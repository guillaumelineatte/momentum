'use server'

import { randomBytes } from 'node:crypto'
import { redirect } from 'next/navigation'
import { AuthError } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/password'
import { hashToken } from '@/lib/token'
import { urlPublique } from '@/lib/url'
import { ipClient, messageAttente, verifierLimites } from '@/lib/rate-limit'
import { envoyerEmailReinitialisation } from '@/lib/email'
import { verificationEmailRequise } from '@/lib/config'
import { confirmerEmail, envoyerLienVerification } from '@/lib/verification'
import { signIn, signOut } from '@/auth'
import {
  connexionSchema,
  inscriptionSchema,
  motDePasseOublieSchema,
  reinitialiserMotDePasseSchema,
} from '@/lib/validations/auth'

export type ActionState =
  | {
      error?: string
      /** Code machine d'une erreur particulière (ex. 'email_non_verifie'), pour proposer une action adaptée. */
      code?: string
      /** Message d'erreur par champ (ex. { email: '...' }). */
      fieldErrors?: Record<string, string>
      /** Valeurs à réafficher pour les champs qui n'étaient PAS en erreur, pour ne pas faire
       * tout retaper à l'utilisateur — les champs en erreur, eux, repartent vides. */
      values?: Record<string, string>
      /** Cases à cocher multi-valeurs à réafficher (ex. objectifs). */
      arrayValues?: Record<string, string[]>
    }
  | undefined

export async function deconnexionAction() {
  await signOut({ redirectTo: '/connexion' })
}

export async function connexionAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get('email') ?? '')
  const parsed = connexionSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: 'Adresse e-mail ou mot de passe invalide.', values: { email } }

  const ip = await ipClient()
  const limite = await verifierLimites([
    [`connexion:ip:${ip}`, { max: 30, fenetreSecondes: 15 * 60 }],
    [`connexion:email:${parsed.data.email.toLowerCase()}`, { max: 10, fenetreSecondes: 15 * 60 }],
  ])
  if (!limite.autorise) return { error: messageAttente(limite.reessayerDansSecondes), values: { email } }

  try {
    await signIn('credentials', {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: '/',
    })
  } catch (error) {
    if (error instanceof AuthError) {
      if ((error as { code?: string }).code === 'email_non_verifie') {
        return {
          error: 'Confirme d’abord ton adresse e-mail : clique sur le lien que nous t’avons envoyé.',
          code: 'email_non_verifie',
          values: { email },
        }
      }
      return { error: 'Adresse e-mail ou mot de passe incorrect.', values: { email } }
    }
    throw error // NEXT_REDIRECT doit être re-lancé, ce n'est pas une vraie erreur
  }
}

// Champs texte qu'on peut sans risque redonner à l'utilisateur après une erreur.
// Les mots de passe n'y figurent jamais : ni renvoyés au client, ni ré-affichés.
const CHAMPS_RECONDUCTIBLES = ['prenom', 'email'] as const

export async function inscriptionAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const brut = {
    prenom: String(formData.get('prenom') ?? ''),
    email: String(formData.get('email') ?? ''),
    password: String(formData.get('password') ?? ''),
    confirmPassword: String(formData.get('confirmPassword') ?? ''),
    consentement: formData.get('consentement') === 'on' ? 'on' : '',
  }

  const parsed = inscriptionSchema.safeParse(brut)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const champ = issue.path[0]
      if (typeof champ === 'string' && !fieldErrors[champ]) fieldErrors[champ] = issue.message
    }
    const values: Record<string, string> = {}
    for (const champ of CHAMPS_RECONDUCTIBLES) {
      if (!fieldErrors[champ]) values[champ] = brut[champ]
    }
    if (brut.consentement) values.consentement = brut.consentement
    return { fieldErrors, values }
  }

  const { prenom, email, password } = parsed.data

  const limite = await verifierLimites([[`inscription:ip:${await ipClient()}`, { max: 10, fenetreSecondes: 60 * 60 }]])
  if (!limite.autorise) return { error: messageAttente(limite.reessayerDansSecondes), values: { prenom, email } }

  const utilisateurExistant = await prisma.user.findUnique({ where: { email } })
  if (utilisateurExistant) {
    return {
      fieldErrors: { email: 'Un compte existe déjà avec cette adresse e-mail.' },
      values: { prenom },
    }
  }

  const passwordHash = await hashPassword(password)
  await prisma.user.create({
    data: { name: prenom, email, passwordHash, consentementLe: new Date() },
  })

  if (verificationEmailRequise()) {
    // Pas de connexion automatique : l'adresse doit d'abord être confirmée par le lien envoyé par e-mail.
    await envoyerLienVerification(email)
    redirect(`/inscription/confirmation?email=${encodeURIComponent(email)}`)
  }

  // Confirmation désactivée (développement local) : on marque l'adresse comme vérifiée et on connecte.
  await prisma.user.update({ where: { email }, data: { emailVerified: new Date() } })
  try {
    await signIn('credentials', { email, password, redirectTo: '/onboarding' })
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        error: 'Ton compte a bien été créé, mais la connexion automatique a échoué. Connecte-toi manuellement.',
      }
    }
    throw error
  }
}

export async function confirmerEmailAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const email = formData.get('email')
  const jeton = formData.get('token')
  if (typeof email !== 'string' || typeof jeton !== 'string' || !email || !jeton) {
    return { error: 'Lien invalide.', code: 'lien_invalide' }
  }

  const limite = await verifierLimites([[`confirmation:ip:${await ipClient()}`, { max: 30, fenetreSecondes: 15 * 60 }]])
  if (!limite.autorise) return { error: messageAttente(limite.reessayerDansSecondes) }

  if (!(await confirmerEmail(email, jeton))) {
    return { error: 'Ce lien a expiré ou n’est plus valable. Demande-en un nouveau.', code: 'lien_invalide' }
  }
  redirect('/connexion?verifie=1')
}

export async function renvoyerVerificationAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = motDePasseOublieSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: 'Adresse e-mail invalide.' }
  const { email } = parsed.data

  // Réponse identique dans tous les cas (limite atteinte, compte inconnu, déjà confirmé) : on ne révèle
  // pas si un compte existe. La limite protège surtout la boîte mail d'un tiers contre le spam.
  const limite = await verifierLimites([
    [`verification:ip:${await ipClient()}`, { max: 10, fenetreSecondes: 60 * 60 }],
    [`verification:email:${email.toLowerCase()}`, { max: 3, fenetreSecondes: 60 * 60 }],
  ])
  if (limite.autorise) {
    const user = await prisma.user.findUnique({ where: { email } })
    if (user && !user.emailVerified) await envoyerLienVerification(email)
  }

  redirect(`/inscription/confirmation?email=${encodeURIComponent(email)}&renvoye=1`)
}

export async function demandeReinitialisationAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = motDePasseOublieSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: 'Adresse e-mail invalide.' }

  const { email } = parsed.data

  // Limite silencieuse (même redirection qu'un succès) : afficher une erreur ici
  // révélerait qu'un compte existe pour cette adresse. Elle empêche surtout de spammer
  // la boîte mail d'un tiers et d'épuiser le quota d'envoi Resend.
  const limite = await verifierLimites([
    [`reset:ip:${await ipClient()}`, { max: 10, fenetreSecondes: 60 * 60 }],
    [`reset:email:${email.toLowerCase()}`, { max: 3, fenetreSecondes: 60 * 60 }],
  ])
  const user = limite.autorise ? await prisma.user.findUnique({ where: { email } }) : null

  // On ne révèle jamais si l'e-mail existe ou non (évite l'énumération de comptes).
  if (user) {
    const token = randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 1000 * 60 * 60) // 1h

    await prisma.verificationToken.deleteMany({ where: { identifier: email } })
    await prisma.verificationToken.create({ data: { identifier: email, token: hashToken(token), expires } })

    const lien = `${urlPublique()}/reinitialiser-mot-de-passe?token=${token}&email=${encodeURIComponent(email)}`
    try {
      await envoyerEmailReinitialisation(email, lien)
    } catch (error) {
      // On log côté serveur pour pouvoir diagnostiquer, mais on ne fait jamais
      // planter la requête ni varier la réponse : ça reviendrait à révéler que ce
      // compte existe (un e-mail inconnu, lui, "réussit" toujours silencieusement).
      console.error('Échec envoi e-mail de réinitialisation:', error)
    }
  }

  redirect('/mot-de-passe-oublie?envoye=1')
}

export async function reinitialiserMotDePasseAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = formData.get('email')
  const parsed = reinitialiserMotDePasseSchema.safeParse({
    token: formData.get('token'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  })
  if (!parsed.success || typeof email !== 'string') {
    return { error: parsed.success ? 'Lien invalide.' : parsed.error.issues[0]?.message ?? 'Formulaire invalide.' }
  }

  const verification = await prisma.verificationToken.findUnique({
    where: { identifier_token: { identifier: email, token: hashToken(parsed.data.token) } },
  })

  if (!verification || verification.expires < new Date()) {
    return { error: 'Ce lien a expiré. Refais une demande de réinitialisation.' }
  }

  const passwordHash = await hashPassword(parsed.data.password)
  await prisma.user.update({ where: { email }, data: { passwordHash } })
  await prisma.verificationToken.delete({
    where: { identifier_token: { identifier: email, token: hashToken(parsed.data.token) } },
  })

  redirect('/connexion?reinitialise=1')
}
