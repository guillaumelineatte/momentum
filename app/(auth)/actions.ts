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

export type ActionState = { error?: string } | undefined

export async function deconnexionAction() {
  await signOut({ redirectTo: '/connexion' })
}

export async function connexionAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = connexionSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: 'Email ou mot de passe invalide.' }

  try {
    await signIn('credentials', {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: '/',
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: 'Email ou mot de passe incorrect.' }
    }
    throw error // NEXT_REDIRECT doit être re-lancé, ce n'est pas une vraie erreur
  }
}

export async function inscriptionAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = inscriptionSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Formulaire invalide.' }
  }

  const { prenom, email, password } = parsed.data

  const utilisateurExistant = await prisma.user.findUnique({ where: { email } })
  if (utilisateurExistant) {
    return { error: 'Un compte existe déjà avec cet e-mail.' }
  }

  const passwordHash = await hashPassword(password)
  await prisma.user.create({
    data: { name: prenom, email, passwordHash },
  })

  try {
    await signIn('credentials', { email, password, redirectTo: '/onboarding' })
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: 'Compte créé, mais la connexion automatique a échoué. Connecte-toi manuellement.' }
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
    await envoyerEmailReinitialisation(email, lien)
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
