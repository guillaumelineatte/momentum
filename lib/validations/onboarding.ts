import { z } from 'zod'

export const OBJECTIFS = [
  { value: 'PERTE_DE_POIDS', label: 'Perte de poids' },
  { value: 'PRISE_DE_MUSCLE', label: 'Prise de muscle' },
  { value: 'RECOMPOSITION', label: 'Recomposition' },
  { value: 'ENDURANCE', label: 'Endurance' },
  { value: 'FORCE', label: 'Force' },
  { value: 'SANTE_GENERALE', label: 'Santé générale' },
] as const

const optionalPositiveNumber = z.coerce.number().positive().optional().or(z.literal('').transform(() => undefined))

export const onboardingSchema = z.object({
  tailleCm: optionalPositiveNumber,
  poidsDepartKg: optionalPositiveNumber,
  dateNaissance: z
    .string()
    .optional()
    .transform((v) => (v ? v : undefined)),
  objectifs: z.array(z.enum(OBJECTIFS.map((o) => o.value) as [string, ...string[]])).min(1, 'Choisis au moins un objectif'),
  tourTailleDepartCm: optionalPositiveNumber,
  tourHanchesDepartCm: optionalPositiveNumber,
  tourPoitrineDepartCm: optionalPositiveNumber,
  tourBrasDepartCm: optionalPositiveNumber,
  tourCuissesDepartCm: optionalPositiveNumber,
  tourMolletsDepartCm: optionalPositiveNumber,
  tourCouDepartCm: optionalPositiveNumber,
})
export type OnboardingInput = z.infer<typeof onboardingSchema>
