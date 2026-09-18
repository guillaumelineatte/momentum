import { z } from 'zod'

export const TYPES_SEANCE = [
  { value: 'PUSH', label: 'Push' },
  { value: 'PULL', label: 'Pull' },
  { value: 'LEGS', label: 'Legs' },
  { value: 'UPPER', label: 'Upper' },
  { value: 'LOWER', label: 'Lower' },
  { value: 'FULL_BODY', label: 'Full body' },
  { value: 'PERSONNALISE', label: 'Personnalisé' },
] as const

export const GROUPES_MUSCULAIRES = [
  { value: 'PECTORAUX', label: 'Pectoraux' },
  { value: 'DOS', label: 'Dos' },
  { value: 'EPAULES', label: 'Épaules' },
  { value: 'BICEPS', label: 'Biceps' },
  { value: 'TRICEPS', label: 'Triceps' },
  { value: 'AVANT_BRAS', label: 'Avant-bras' },
  { value: 'QUADRICEPS', label: 'Quadriceps' },
  { value: 'ISCHIOS', label: 'Ischios' },
  { value: 'FESSIERS', label: 'Fessiers' },
  { value: 'MOLLETS', label: 'Mollets' },
  { value: 'ABDOMINAUX', label: 'Abdominaux' },
  { value: 'LOMBAIRES', label: 'Lombaires' },
  { value: 'CARDIO', label: 'Cardio' },
  { value: 'FULL_BODY', label: 'Full body' },
] as const

export const demarrerSeanceSchema = z
  .object({
    date: z.string().min(1),
    type: z.enum(TYPES_SEANCE.map((t) => t.value) as [string, ...string[]]),
    nomPersonnalise: z
      .string()
      .trim()
      .max(60, 'Ce nom est trop long (60 caractères maximum).')
      .optional()
      .or(z.literal('').transform(() => undefined)),
  })
  .refine((data) => data.type !== 'PERSONNALISE' || !!data.nomPersonnalise, {
    message: 'Donne un nom à ce type de séance.',
    path: ['nomPersonnalise'],
  })
export type DemarrerSeanceInput = z.infer<typeof demarrerSeanceSchema>

export const creerExerciceSchema = z.object({
  nom: z.string().trim().min(1, "Donne un nom à l'exercice.").max(80, 'Ce nom est trop long (80 caractères maximum).'),
  groupeMusculaire: z.enum(GROUPES_MUSCULAIRES.map((g) => g.value) as [string, ...string[]]),
})
export type CreerExerciceInput = z.infer<typeof creerExerciceSchema>

export const ajouterSerieSchema = z.object({
  workoutSessionId: z.string().min(1),
  exerciseId: z.string().min(1),
  repetitions: z.coerce.number().int().positive('Répétitions requises'),
  chargeKg: z.coerce.number().min(0, 'Charge invalide'),
  rpe: z.coerce
    .number()
    .min(1)
    .max(10)
    .optional()
    .or(z.literal('').transform(() => undefined)),
  note: z
    .string()
    .max(200)
    .optional()
    .or(z.literal('').transform(() => undefined)),
})
export type AjouterSerieInput = z.infer<typeof ajouterSerieSchema>
