'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { parseDateParam, formatDateParam } from '@/lib/dates'
import { cardioSchema, mesuresSchema, suiviQuotidienSchema } from '@/lib/validations/activites'
import type { ActionState } from '@/app/(auth)/actions'

async function requireUserId() {
  const session = await auth()
  if (!session?.user?.id) redirect('/connexion')
  return session.user.id
}

export async function creerCardioAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const userId = await requireUserId()
  const parsed = cardioSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Formulaire invalide.' }

  const { date, dureeMinutes, ...reste } = parsed.data
  const jour = parseDateParam(date)
  await prisma.cardioSession.create({
    data: {
      userId,
      date: jour,
      dureeSecondes: Math.round(dureeMinutes * 60),
      type: reste.type as never,
      nomPersonnalise: reste.nomPersonnalise,
      distanceKm: reste.distanceKm,
      deniveleM: reste.deniveleM,
      frequenceCardiaqueMoyenne: reste.frequenceCardiaqueMoyenne,
      ressenti: reste.ressenti,
      note: reste.note,
    },
  })

  revalidatePath('/')
  redirect(`/?date=${formatDateParam(jour)}&ajoute=1`)
}

export async function creerMesuresAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const userId = await requireUserId()
  const parsed = mesuresSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Formulaire invalide.' }

  const { date, ...mesures } = parsed.data
  const jour = parseDateParam(date)
  await prisma.bodyMeasurement.create({ data: { userId, date: jour, ...mesures } })

  revalidatePath('/')
  redirect(`/?date=${formatDateParam(jour)}&ajoute=1`)
}

export async function enregistrerSuiviQuotidienAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const userId = await requireUserId()
  const parsed = suiviQuotidienSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Formulaire invalide.' }

  const { date, ...donnees } = parsed.data
  const jour = parseDateParam(date)

  // Un seul suivi quotidien par jour : on met à jour s'il existe déjà (l'utilisateur peut
  // revenir compléter sa journée plus tard sans créer de doublon).
  await prisma.dailyMetric.upsert({
    where: { userId_date: { userId, date: jour } },
    create: { userId, date: jour, ...donnees },
    update: donnees,
  })

  revalidatePath('/')
  redirect(`/?date=${formatDateParam(jour)}&ajoute=1`)
}

async function supprimerEtRevalider<T extends { userId: string; date: Date }>(
  find: () => Promise<T | null>,
  remove: () => Promise<unknown>,
) {
  const userId = await requireUserId()
  const enregistrement = await find()
  if (!enregistrement || enregistrement.userId !== userId) {
    throw new Error("Cette entrée n'existe pas ou ne t'appartient pas.")
  }
  await remove()
  revalidatePath('/')
  return formatDateParam(enregistrement.date)
}

export async function supprimerSeanceAction(id: string) {
  await supprimerEtRevalider(
    () => prisma.workoutSession.findUnique({ where: { id } }),
    () => prisma.workoutSession.delete({ where: { id } }),
  )
}

export async function supprimerCardioAction(id: string) {
  await supprimerEtRevalider(
    () => prisma.cardioSession.findUnique({ where: { id } }),
    () => prisma.cardioSession.delete({ where: { id } }),
  )
}

export async function supprimerMesureAction(id: string) {
  await supprimerEtRevalider(
    () => prisma.bodyMeasurement.findUnique({ where: { id } }),
    () => prisma.bodyMeasurement.delete({ where: { id } }),
  )
}

export async function supprimerQuotidienAction(id: string) {
  await supprimerEtRevalider(
    () => prisma.dailyMetric.findUnique({ where: { id } }),
    () => prisma.dailyMetric.delete({ where: { id } }),
  )
}

export async function supprimerReposAction(id: string) {
  await supprimerEtRevalider(
    () => prisma.restDay.findUnique({ where: { id } }),
    () => prisma.restDay.delete({ where: { id } }),
  )
}

/** Marque un jour comme repos : compte pour le streak de régularité sans être une vraie séance. */
export async function marquerJourReposAction(date: string) {
  const userId = await requireUserId()
  const jour = parseDateParam(date)

  await prisma.restDay.upsert({
    where: { userId_date: { userId, date: jour } },
    create: { userId, date: jour },
    update: {},
  })

  revalidatePath('/')
}
