'use server'

import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { onboardingSchema } from '@/lib/validations/onboarding'
import { startOfDay } from '@/lib/dates'
import type { ActionState } from '@/app/(auth)/actions'

// Champs scalaires du formulaire, dans l'ordre où ils apparaissent — sert à savoir
// lesquels reconduire (valides) et lesquels vider (en erreur) après un échec.
const CHAMPS_ONBOARDING = [
  'tailleCm',
  'poidsDepartKg',
  'dateNaissance',
  'tourTailleDepartCm',
  'tourHanchesDepartCm',
  'tourPoitrineDepartCm',
  'tourBrasDepartCm',
  'tourCuissesDepartCm',
  'tourMolletsDepartCm',
  'tourCouDepartCm',
] as const

export async function completeOnboardingAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth()
  if (!session?.user?.id) redirect('/connexion')

  const raw = Object.fromEntries(formData)
  const objectifsSoumis = formData.getAll('objectifs').map(String)
  const parsed = onboardingSchema.safeParse({
    ...raw,
    objectifs: objectifsSoumis,
  })

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const champ = issue.path[0]
      if (typeof champ === 'string' && !fieldErrors[champ]) fieldErrors[champ] = issue.message
    }

    const values: Record<string, string> = {}
    for (const champ of CHAMPS_ONBOARDING) {
      if (!fieldErrors[champ]) values[champ] = String(raw[champ] ?? '')
    }

    return {
      fieldErrors,
      values,
      // Les objectifs cochés ne sont jamais en erreur individuellement (seul le "au moins 1"
      // global peut échouer) -> on les reconduit toujours tels quels.
      arrayValues: { objectifs: objectifsSoumis },
    }
  }

  const userId = session.user.id
  const user = await prisma.user.findUnique({ where: { id: userId } })
  // Session valide mais utilisateur supprimé en base -> éviter de planter plus loin
  // sur une violation de contrainte de clé étrangère (userId inexistant).
  if (!user) redirect('/api/nettoyer-session')
  const data = parsed.data
  // Normalisé au jour civil (comme toutes les autres écritures de `date` dans l'app) : sinon
  // une mesure ajoutée le même jour via un autre formulaire ne serait jamais reconnue comme
  // "plus récente" en cas d'égalité, faute de valeur de `date` strictement comparable.
  const dateDepart = startOfDay(new Date())

  await prisma.$transaction([
    prisma.profile.upsert({
      where: { userId },
      create: {
        userId,
        prenom: user?.name ?? '',
        tailleCm: data.tailleCm,
        poidsDepartKg: data.poidsDepartKg,
        dateNaissance: data.dateNaissance ? new Date(data.dateNaissance) : undefined,
        objectifs: data.objectifs as never,
        tourTailleDepartCm: data.tourTailleDepartCm,
        tourHanchesDepartCm: data.tourHanchesDepartCm,
        tourPoitrineDepartCm: data.tourPoitrineDepartCm,
        tourBrasDepartCm: data.tourBrasDepartCm,
        tourCuissesDepartCm: data.tourCuissesDepartCm,
        tourMolletsDepartCm: data.tourMolletsDepartCm,
        tourCouDepartCm: data.tourCouDepartCm,
        dateDepart,
      },
      update: {
        tailleCm: data.tailleCm,
        poidsDepartKg: data.poidsDepartKg,
        dateNaissance: data.dateNaissance ? new Date(data.dateNaissance) : undefined,
        objectifs: data.objectifs as never,
        tourTailleDepartCm: data.tourTailleDepartCm,
        tourHanchesDepartCm: data.tourHanchesDepartCm,
        tourPoitrineDepartCm: data.tourPoitrineDepartCm,
        tourBrasDepartCm: data.tourBrasDepartCm,
        tourCuissesDepartCm: data.tourCuissesDepartCm,
        tourMolletsDepartCm: data.tourMolletsDepartCm,
        tourCouDepartCm: data.tourCouDepartCm,
      },
    }),
    // Le point de départ devient aussi la première mesure corporelle, pour que
    // les graphiques de progression (Phase 6) l'incluent naturellement.
    prisma.bodyMeasurement.create({
      data: {
        userId,
        date: dateDepart,
        poidsKg: data.poidsDepartKg,
        tourTailleCm: data.tourTailleDepartCm,
        tourHanchesCm: data.tourHanchesDepartCm,
        tourPoitrineCm: data.tourPoitrineDepartCm,
        tourBrasCm: data.tourBrasDepartCm,
        tourCuissesCm: data.tourCuissesDepartCm,
        tourMolletsCm: data.tourMolletsDepartCm,
        tourCouCm: data.tourCouDepartCm,
      },
    }),
  ])

  redirect('/')
}
