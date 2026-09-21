import { randomBytes } from 'node:crypto'
import { prisma } from '@/lib/prisma'
import { hashToken } from '@/lib/token'
import { envoyerEmailVerification } from '@/lib/email'
import { urlPublique } from '@/lib/url'

const DUREE_VALIDITE_MS = 24 * 60 * 60 * 1000 // 24 h

// Préfixe de l'identifiant : sépare ces jetons de ceux de réinitialisation de mot de passe, qui
// utilisent l'e-mail seul comme identifiant (l'un ne doit jamais écraser ni valider l'autre).
const identifiant = (email: string) => `verif:${email}`

/** Crée un jeton à usage unique (seule son empreinte est stockée) et remplace le précédent. */
export async function creerJetonVerification(email: string): Promise<string> {
  const jeton = randomBytes(32).toString('hex')
  await prisma.verificationToken.deleteMany({ where: { identifier: identifiant(email) } })
  await prisma.verificationToken.create({
    data: { identifier: identifiant(email), token: hashToken(jeton), expires: new Date(Date.now() + DUREE_VALIDITE_MS) },
  })
  return jeton
}

/** Valide le jeton : marque l'adresse comme confirmée et détruit le jeton. Retourne false s'il est invalide ou expiré. */
export async function confirmerEmail(email: string, jeton: string): Promise<boolean> {
  const cle = { identifier: identifiant(email), token: hashToken(jeton) }
  const enBase = await prisma.verificationToken.findUnique({ where: { identifier_token: cle } })
  if (!enBase || enBase.expires < new Date()) return false

  await prisma.$transaction([
    prisma.user.updateMany({ where: { email }, data: { emailVerified: new Date() } }),
    prisma.verificationToken.delete({ where: { identifier_token: cle } }),
  ])
  return true
}

/** Envoie le lien de confirmation. Ne lève jamais : un échec d'envoi est journalisé (l'utilisateur peut renvoyer le lien). */
export async function envoyerLienVerification(email: string): Promise<void> {
  try {
    const jeton = await creerJetonVerification(email)
    const lien = `${urlPublique()}/verifier-email?token=${jeton}&email=${encodeURIComponent(email)}`
    await envoyerEmailVerification(email, lien)
  } catch (erreur) {
    console.error("Échec de l'envoi de l'e-mail de confirmation:", erreur)
  }
}
