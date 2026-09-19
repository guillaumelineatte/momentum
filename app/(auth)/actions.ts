'use server'

import { randomBytes } from 'node:crypto'
import { redirect } from 'next/navigation'
import { AuthError } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/password'
import { envoyerEmailReinitialisation } from '@/lib/email'
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

  try {
    await signIn('credentials', {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: '/',
    })
  } catch (error) {
    if (error instanceof AuthError) {
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
    return { fieldErrors, values }
  }

  const { prenom, email, password } = parsed.data

  const utilisateurExistant = await prisma.user.findUnique({ where: { email } })
  if (utilisateurExistant) {
    return {
      fieldErrors: { email: 'Un compte existe déjà avec cette adresse e-mail.' },
      values: { prenom },
    }
  }

  const passwordHash = await hashPassword(password)
  await prisma.user.create({
    data: { name: prenom, email, passwordHash },
  })

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

export async function demandeReinitialisationAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = motDePasseOublieSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: 'Adresse e-mail invalide.' }

  const { email } = parsed.data
  const user = await prisma.user.findUnique({ where: { email } })

  // On ne révèle jamais si l'e-mail existe ou non (évite l'énumération de comptes).
  if (user) {
    const token = randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 1000 * 60 * 60) // 1h

    await prisma.verificationToken.deleteMany({ where: { identifier: email } })
    await prisma.verificationToken.create({ data: { identifier: email, token, expires } })

    const base = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
    const lien = `${base}/reinitialiser-mot-de-passe?token=${token}&email=${encodeURIComponent(email)}`
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
    where: { identifier_token: { identifier: email, token: parsed.data.token } },
  })

  if (!verification || verification.expires < new Date()) {
    return { error: 'Ce lien a expiré. Refais une demande de réinitialisation.' }
  }

  const passwordHash = await hashPassword(parsed.data.password)
  await prisma.user.update({ where: { email }, data: { passwordHash } })
  await prisma.verificationToken.delete({
    where: { identifier_token: { identifier: email, token: parsed.data.token } },
  })

  redirect('/connexion?reinitialise=1')
}
