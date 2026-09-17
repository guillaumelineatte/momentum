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
    prenom: z.string().trim().min(1, 'Prénom requis').max(50),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
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
