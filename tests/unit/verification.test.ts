import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'

// Aucun e-mail réel : on remplace seulement l'envoi.
const { envoyerEmailVerification } = vi.hoisted(() => ({ envoyerEmailVerification: vi.fn() }))
vi.mock('@/lib/email', () => ({ envoyerEmailVerification }))
vi.mock('next/headers', () => ({ headers: async () => new Headers() }))

import { prisma } from '@/lib/prisma'
import { hashToken } from '@/lib/token'
import { confirmerEmail, creerJetonVerification, envoyerLienVerification } from '@/lib/verification'

// Test d'intégration : nécessite DATABASE_URL (branche Neon "dev", jamais la prod).
const PREFIXE = `vitest-verif-${Date.now()}`
const emails: string[] = []
async function nouvelUtilisateur() {
  const email = `${PREFIXE}-${emails.length}@example.test`
  emails.push(email)
  return prisma.user.create({ data: { name: 'Test', email, passwordHash: 'x' } })
}

beforeEach(() => vi.clearAllMocks())
afterAll(async () => {
  await prisma.verificationToken.deleteMany({ where: { identifier: { contains: PREFIXE } } })
  await prisma.user.deleteMany({ where: { email: { in: emails } } })
  await prisma.$disconnect()
})

describe('jeton de vérification', () => {
  it('ne stocke que son empreinte, avec un identifiant distinct de la réinitialisation', async () => {
    const { email } = await nouvelUtilisateur()
    const jeton = await creerJetonVerification(email!)

    const lignes = await prisma.verificationToken.findMany({ where: { identifier: { contains: email! } } })
    expect(lignes).toHaveLength(1)
    expect(lignes[0].identifier).toBe(`verif:${email}`)
    expect(lignes[0].token).toBe(hashToken(jeton))
    expect(lignes[0].token).not.toBe(jeton)
  })

  it('remplace le jeton précédent', async () => {
    const { email } = await nouvelUtilisateur()
    const premier = await creerJetonVerification(email!)
    const second = await creerJetonVerification(email!)

    expect(await prisma.verificationToken.count({ where: { identifier: `verif:${email}` } })).toBe(1)
    expect(await confirmerEmail(email!, premier)).toBe(false)
    expect(await confirmerEmail(email!, second)).toBe(true)
  })
})

describe('confirmerEmail', () => {
  it('confirme l’adresse, une seule fois', async () => {
    const user = await nouvelUtilisateur()
    const jeton = await creerJetonVerification(user.email!)

    expect(await confirmerEmail(user.email!, jeton)).toBe(true)
    expect((await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).emailVerified).toBeInstanceOf(Date)
    expect(await confirmerEmail(user.email!, jeton)).toBe(false) // usage unique
  })

  it('refuse un mauvais jeton, sans rien confirmer', async () => {
    const user = await nouvelUtilisateur()
    await creerJetonVerification(user.email!)

    expect(await confirmerEmail(user.email!, 'pas-le-bon-jeton')).toBe(false)
    expect((await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).emailVerified).toBeNull()
  })

  it('refuse un jeton expiré', async () => {
    const user = await nouvelUtilisateur()
    const jeton = await creerJetonVerification(user.email!)
    await prisma.verificationToken.updateMany({ where: { identifier: `verif:${user.email}` }, data: { expires: new Date(Date.now() - 1000) } })

    expect(await confirmerEmail(user.email!, jeton)).toBe(false)
    expect((await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).emailVerified).toBeNull()
  })

  it('refuse le jeton d’un autre compte', async () => {
    const a = await nouvelUtilisateur()
    const b = await nouvelUtilisateur()
    const jetonA = await creerJetonVerification(a.email!)

    expect(await confirmerEmail(b.email!, jetonA)).toBe(false)
  })

  it('ne se laisse pas valider avec un jeton de réinitialisation de mot de passe', async () => {
    const user = await nouvelUtilisateur()
    const jetonReset = 'jeton-de-reinitialisation'
    await prisma.verificationToken.create({
      data: { identifier: user.email!, token: hashToken(jetonReset), expires: new Date(Date.now() + 3600_000) },
    })

    expect(await confirmerEmail(user.email!, jetonReset)).toBe(false)
  })
})

describe('envoyerLienVerification', () => {
  it('envoie un lien vers /verifier-email contenant un jeton valable', async () => {
    const user = await nouvelUtilisateur()
    await envoyerLienVerification(user.email!)

    expect(envoyerEmailVerification).toHaveBeenCalledTimes(1)
    const [destinataire, lien] = envoyerEmailVerification.mock.calls[0]
    expect(destinataire).toBe(user.email)
    const url = new URL(lien)
    expect(url.pathname).toBe('/verifier-email')
    expect(url.searchParams.get('email')).toBe(user.email)
    expect(await confirmerEmail(user.email!, url.searchParams.get('token')!)).toBe(true)
  })

  it('ne lève jamais d’erreur si l’envoi échoue', async () => {
    const user = await nouvelUtilisateur()
    envoyerEmailVerification.mockRejectedValueOnce(new Error('SMTP indisponible'))
    const journal = vi.spyOn(console, 'error').mockImplementation(() => {})

    await expect(envoyerLienVerification(user.email!)).resolves.toBeUndefined()
    expect(journal).toHaveBeenCalled()
    journal.mockRestore()
  })
})
