import { z } from 'zod'

const emailSchema = z.email('Adresse e-mail invalide')
const passwordSchema = z
  .string()
  .min(8, 'Le mot de passe doit contenir au moins 8 caractères')

export const connexionSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Mot de passe requis'),
})
export type ConnexionInput = z.infer<typeof connexionSchema>

export const inscriptionSchema = z
  .object({
    prenom: z
      .string()
      .trim()
      .min(1, 'Merci d’indiquer ton prénom.')
      .max(50, 'Ce prénom est trop long (50 caractères maximum).'),
    email: z
      .string()
      .trim()
      .min(1, 'Merci d’indiquer ton adresse e-mail.')
      .refine((valeur) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valeur), 'Cette adresse e-mail ne semble pas valide.'),
    password: z.string().min(8, 'Ton mot de passe doit contenir au moins 8 caractères.'),
    confirmPassword: z.string().min(1, 'Merci de confirmer ton mot de passe.'),
    consentement: z.string().refine((valeur) => valeur === 'on', 'Tu dois accepter la politique de confidentialité pour créer ton compte.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les deux mots de passe ne sont pas identiques.',
    path: ['confirmPassword'],
  })
export type InscriptionInput = z.infer<typeof inscriptionSchema>

export const motDePasseOublieSchema = z.object({
  email: emailSchema,
})
export type MotDePasseOublieInput = z.infer<typeof motDePasseOublieSchema>

export const reinitialiserMotDePasseSchema = z
  .object({
    token: z.string().min(1),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  })
export type ReinitialiserMotDePasseInput = z.infer<typeof reinitialiserMotDePasseSchema>
