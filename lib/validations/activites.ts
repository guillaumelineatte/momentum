import { z } from 'zod'

const nombreOptionnel = z.coerce.number().optional().or(z.literal('').transform(() => undefined))
const nombrePositifOptionnel = z.coerce.number().positive().optional().or(z.literal('').transform(() => undefined))
const echelle5Optionnelle = z.coerce.number().int().min(1).max(5).optional().or(z.literal('').transform(() => undefined))

export const TYPES_CARDIO = [
  { value: 'FOOTING', label: 'Footing' },
  { value: 'FRACTIONNE', label: 'Fractionné' },
  { value: 'SORTIE_LONGUE', label: 'Sortie longue' },
  { value: 'TEMPO', label: 'Tempo' },
  { value: 'VELO', label: 'Vélo' },
  { value: 'NATATION', label: 'Natation' },
  { value: 'MARCHE', label: 'Marche' },
  { value: 'RAMEUR', label: 'Rameur' },
  { value: 'AUTRE', label: 'Autre' },
] as const

export const cardioSchema = z
  .object({
    date: z.string().min(1),
    type: z.enum(TYPES_CARDIO.map((t) => t.value) as [string, ...string[]]),
    nomPersonnalise: z
      .string()
      .trim()
      .max(60, 'Ce nom est trop long (60 caractères maximum).')
      .optional()
      .or(z.literal('').transform(() => undefined)),
    distanceKm: nombrePositifOptionnel,
    dureeMinutes: z.coerce.number().positive('Durée requise'),
    deniveleM: nombreOptionnel,
    frequenceCardiaqueMoyenne: nombreOptionnel,
    ressenti: echelle5Optionnelle,
    note: z.string().max(500).optional().or(z.literal('').transform(() => undefined)),
  })
  .refine((data) => data.type !== 'AUTRE' || !!data.nomPersonnalise, {
    message: 'Donne un nom à cette activité (ex. Escalade, Yoga…).',
    path: ['nomPersonnalise'],
  })
export type CardioInput = z.infer<typeof cardioSchema>

export const mesuresSchema = z.object({
  date: z.string().min(1),
  poidsKg: nombrePositifOptionnel,
  masseGrassePct: nombrePositifOptionnel,
  tourTailleCm: nombrePositifOptionnel,
  tourHanchesCm: nombrePositifOptionnel,
  tourPoitrineCm: nombrePositifOptionnel,
  tourBrasCm: nombrePositifOptionnel,
  tourCuissesCm: nombrePositifOptionnel,
  tourMolletsCm: nombrePositifOptionnel,
  tourCouCm: nombrePositifOptionnel,
})
export type MesuresInput = z.infer<typeof mesuresSchema>

export const suiviQuotidienSchema = z.object({
  date: z.string().min(1),
  pas: nombreOptionnel,
  sommeilHeures: nombrePositifOptionnel,
  qualiteSommeil: echelle5Optionnelle,
  proteinesG: nombreOptionnel,
  hydratationL: nombrePositifOptionnel,
  energie: echelle5Optionnelle,
})
export type SuiviQuotidienInput = z.infer<typeof suiviQuotidienSchema>
