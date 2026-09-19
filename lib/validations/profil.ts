import { z } from 'zod'
import { OBJECTIFS } from '@/lib/validations/onboarding'

const ANNEE_MIN_NAISSANCE = 1900

export const modifierProfilSchema = z.object({
  prenom: z.string().trim().min(1, 'Merci d’indiquer ton prénom.').max(50, 'Ce prénom est trop long (50 caractères maximum).'),
  tailleCm: z.coerce.number().positive('Taille invalide.').optional().or(z.literal('').transform(() => undefined)),
  dateNaissance: z
    .string()
    .optional()
    .transform((v) => (v ? v : undefined))
    .refine(
      (v) => {
        if (!v) return true
        const date = new Date(v)
        if (Number.isNaN(date.getTime())) return false
        return date.getFullYear() >= ANNEE_MIN_NAISSANCE && date.getTime() <= Date.now()
      },
      { message: `Cette date de naissance n'est pas valide (entre ${ANNEE_MIN_NAISSANCE} et aujourd'hui).` },
    ),
  objectifs: z.array(z.enum(OBJECTIFS.map((o) => o.value) as [string, ...string[]])).min(1, 'Choisis au moins un objectif'),
})
export type ModifierProfilInput = z.infer<typeof modifierProfilSchema>
