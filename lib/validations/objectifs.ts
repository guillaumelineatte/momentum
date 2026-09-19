import { z } from 'zod'

// Défini ici (pas dans lib/data/objectifs.ts, qui importe Prisma) pour rester
// importable depuis des composants client sans tirer le driver Postgres au build.
export const TYPES_OBJECTIF = [
  { value: 'POIDS', label: 'Poids', unite: 'kg' },
  { value: 'MENSURATION', label: 'Tour de taille', unite: 'cm' },
  { value: 'CHARGE_EXERCICE', label: 'Charge sur un exercice', unite: 'kg' },
  { value: 'ALLURE', label: 'Allure en course', unite: 'min/km' },
  { value: 'DISTANCE_HEBDO', label: 'Distance hebdomadaire', unite: 'km' },
  { value: 'VOLUME_HEBDO', label: 'Volume musculation hebdomadaire', unite: 'kg' },
] as const

export const creerObjectifSchema = z
  .object({
    type: z.enum(TYPES_OBJECTIF.map((t) => t.value) as [string, ...string[]]),
    titre: z.string().trim().min(1, 'Donne un nom à cet objectif.').max(80, 'Ce titre est trop long (80 caractères maximum).'),
    valeurCible: z.coerce.number().positive('La valeur cible doit être un nombre positif.'),
    exerciceId: z.string().optional().or(z.literal('').transform(() => undefined)),
  })
  .refine((data) => data.type !== 'CHARGE_EXERCICE' || !!data.exerciceId, {
    message: 'Choisis un exercice pour cet objectif.',
    path: ['exerciceId'],
  })
export type CreerObjectifInput = z.infer<typeof creerObjectifSchema>
