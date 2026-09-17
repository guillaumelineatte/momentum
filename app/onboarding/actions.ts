'use server'

import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { onboardingSchema } from '@/lib/validations/onboarding'
import type { ActionState } from '@/app/(auth)/actions'

export async function completeOnboardingAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth()
  if (!session?.user?.id) redirect('/connexion')

  const raw = Object.fromEntries(formData)
  const parsed = onboardingSchema.safeParse({
    ...raw,
    objectifs: formData.getAll('objectifs'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Formulaire invalide.' }
  }

  const userId = session.user.id
  const user = await prisma.user.findUnique({ where: { id: userId } })
  const data = parsed.data
  const dateDepart = new Date()

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
