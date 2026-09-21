import { afterAll, describe, expect, it } from 'vitest'
import { prisma } from '@/lib/prisma'
import { supprimerCompte } from '@/lib/data/compte'
import { exporterDonnees } from '@/lib/data/export'

// Test d'intégration : nécessite DATABASE_URL (branche Neon "dev", jamais la prod).
const PREFIXE = `vitest-compte-${Date.now()}`
const emails: string[] = []

/** Un utilisateur avec au moins une ligne dans CHAQUE table qui lui appartient. */
async function utilisateurComplet(nom: string) {
  const email = `${PREFIXE}-${nom}@example.test`
  emails.push(email)
  const user = await prisma.user.create({ data: { name: nom, email, passwordHash: 'hash-secret', consentementLe: new Date() } })
  const badge = await prisma.badge.findFirstOrThrow()

  // Exercice PERSONNEL utilisé dans une série : le cas qui bloquerait une suppression en cascade naïve.
  const exercice = await prisma.exercise.create({ data: { nom: `Perso ${nom}`, groupeMusculaire: 'DOS', userId: user.id } })
  await prisma.profile.create({ data: { userId: user.id, prenom: nom, tailleCm: 180, objectifs: ['FORCE'] } })
  await prisma.workoutSession.create({
    data: { userId: user.id, type: 'FULL_BODY', sets: { create: [{ exerciseId: exercice.id, ordre: 1, repetitions: 8, chargeKg: 60 }] } },
  })
  await prisma.cardioSession.create({ data: { userId: user.id, type: 'FOOTING', dureeSecondes: 1800 } })
  await prisma.bodyMeasurement.create({ data: { userId: user.id, poidsKg: 71.3 } })
  await prisma.dailyMetric.create({ data: { userId: user.id, pas: 9000 } })
  await prisma.restDay.create({ data: { userId: user.id, date: new Date() } })
  await prisma.goal.create({ data: { userId: user.id, type: 'POIDS', titre: 'Objectif', valeurCible: 70, unite: 'kg' } })
  await prisma.userBadge.create({ data: { userId: user.id, badgeId: badge.id } })
  await prisma.verificationToken.create({ data: { identifier: email, token: `t-${nom}`, expires: new Date(Date.now() + 1000) } })
  await prisma.verificationToken.create({ data: { identifier: `verif:${email}`, token: `v-${nom}`, expires: new Date(Date.now() + 1000) } })
  await prisma.rateLimit.create({ data: { key: `connexion:email:${email}` } })
  return { user, email }
}

const comptes = (userId: string) => ({
  profils: prisma.profile.count({ where: { userId } }),
  exercices: prisma.exercise.count({ where: { userId } }),
  seances: prisma.workoutSession.count({ where: { userId } }),
  cardio: prisma.cardioSession.count({ where: { userId } }),
  mesures: prisma.bodyMeasurement.count({ where: { userId } }),
  suivi: prisma.dailyMetric.count({ where: { userId } }),
  repos: prisma.restDay.count({ where: { userId } }),
  objectifs: prisma.goal.count({ where: { userId } }),
  badges: prisma.userBadge.count({ where: { userId } }),
})
async function lignes(userId: string) {
  const c = comptes(userId)
  return Object.fromEntries(await Promise.all(Object.entries(c).map(async ([k, v]) => [k, await v])))
}

afterAll(async () => {
  await prisma.verificationToken.deleteMany({ where: { identifier: { contains: PREFIXE } } })
  await prisma.rateLimit.deleteMany({ where: { key: { contains: PREFIXE } } })
  await prisma.workoutSession.deleteMany({ where: { user: { email: { in: emails } } } })
  await prisma.user.deleteMany({ where: { email: { in: emails } } })
  await prisma.$disconnect()
})

describe('supprimerCompte', () => {
  it('supprime le compte et TOUTES ses données, y compris un exercice personnel utilisé dans une série', async () => {
    const { user, email } = await utilisateurComplet('alice')
    expect(Object.values(await lignes(user.id)).every((n) => n === 1)).toBe(true) // le jeu de données est complet

    await supprimerCompte(user.id, email)

    expect(await prisma.user.count({ where: { id: user.id } })).toBe(0)
    expect(Object.values(await lignes(user.id)).every((n) => n === 0)).toBe(true)
    expect(await prisma.workoutSet.count({ where: { exercise: { userId: user.id } } })).toBe(0)
    expect(await prisma.verificationToken.count({ where: { identifier: { in: [email, `verif:${email}`] } } })).toBe(0)
    expect(await prisma.rateLimit.count({ where: { key: { contains: email } } })).toBe(0)
  })

  it('ne touche ni aux autres utilisateurs ni aux données communes', async () => {
    const a = await utilisateurComplet('bob')
    const b = await utilisateurComplet('carla')
    const [globaux, badges] = await Promise.all([prisma.exercise.count({ where: { userId: null } }), prisma.badge.count()])

    await supprimerCompte(a.user.id, a.email)

    expect(Object.values(await lignes(b.user.id)).every((n) => n === 1)).toBe(true)
    expect(await prisma.verificationToken.count({ where: { identifier: b.email } })).toBe(1)
    expect(await prisma.exercise.count({ where: { userId: null } })).toBe(globaux)
    expect(await prisma.badge.count()).toBe(badges)
  })
})

describe('exporterDonnees', () => {
  it('contient les données de l’utilisateur, sans secret ni donnée d’un autre compte', async () => {
    const { user } = await utilisateurComplet('dora')
    await utilisateurComplet('eric')

    const export_ = await exporterDonnees(user.id)
    const texte = JSON.stringify(export_)

    expect(export_.compte.prenom).toBe('dora')
    expect(export_.profil?.prenom).toBe('dora')
    expect(export_.seancesMusculation).toHaveLength(1)
    expect(export_.seancesMusculation[0].sets[0].exercise.nom).toBe('Perso dora')
    expect(export_.mesuresCorporelles[0].poidsKg).toBe(71.3)
    expect(export_.seancesCardio).toHaveLength(1)
    expect(export_.suiviQuotidien).toHaveLength(1)
    expect(export_.joursDeRepos).toHaveLength(1)
    expect(export_.objectifs).toHaveLength(1)
    expect(export_.badges).toHaveLength(1)
    expect(export_.exercicesPersonnalises).toHaveLength(1)

    // Aucun secret, aucune donnée d'un autre compte.
    expect(texte).not.toContain('hash-secret')
    expect(texte).not.toMatch(/passwordHash/)
    expect(texte).not.toContain(user.id)
    expect(texte).not.toContain('eric')
  })
})
