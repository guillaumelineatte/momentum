'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { formatDateParam } from '@/lib/dates'
import { demarrerSeanceSchema, creerExerciceSchema, ajouterSerieSchema } from '@/lib/validations/musculation'
import { getDernieresPerformances, getRecordsActuels } from '@/lib/data/musculation'
import type { ActionState } from '@/app/(auth)/actions'

async function requireUserId() {
  const session = await auth()
  if (!session?.user?.id) redirect('/connexion')
  return session.user.id
}

export async function demarrerSeanceAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const userId = await requireUserId()
  const parsed = demarrerSeanceSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const champ = issue.path[0]
      if (typeof champ === 'string' && !fieldErrors[champ]) fieldErrors[champ] = issue.message
    }
    return { fieldErrors }
  }

  const { date, type, nomPersonnalise } = parsed.data
  const session = await prisma.workoutSession.create({
    data: { userId, date: new Date(date), type: type as never, nomPersonnalise },
  })

  redirect(`/activites/musculation/${session.id}`)
}

/** Crée un exercice personnalisé pour l'utilisateur courant uniquement. */
export async function creerExercicePersonnaliseAction(nom: string, groupeMusculaire: string) {
  const userId = await requireUserId()
  const parsed = creerExerciceSchema.safeParse({ nom, groupeMusculaire })
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? 'Exercice invalide.')

  const exercice = await prisma.exercise.create({
    data: { nom: parsed.data.nom, groupeMusculaire: parsed.data.groupeMusculaire as never, userId },
  })
  return exercice
}

/** Dernière performance + record actuel pour un exercice qu'on vient d'ajouter à la séance en cours. */
export async function getInfosExerciceAction(exerciseId: string, excludeSessionId: string) {
  const userId = await requireUserId()
  const [perfs, records] = await Promise.all([
    getDernieresPerformances(userId, [exerciseId], excludeSessionId),
    getRecordsActuels(userId, [exerciseId], excludeSessionId),
  ])
  return {
    dernierePerformance: perfs.get(exerciseId) ?? null,
    record: records.get(exerciseId) ?? null,
  }
}

export async function ajouterSerieAction(input: {
  workoutSessionId: string
  exerciseId: string
  repetitions: number
  chargeKg: number
  rpe?: number
  note?: string
}) {
  const userId = await requireUserId()
  const parsed = ajouterSerieSchema.safeParse(input)
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? 'Série invalide.')

  const seance = await prisma.workoutSession.findUnique({ where: { id: parsed.data.workoutSessionId } })
  if (!seance || seance.userId !== userId) throw new Error("Cette séance n'existe pas ou ne t'appartient pas.")

  const dernierOrdre = await prisma.workoutSet.count({ where: { workoutSessionId: parsed.data.workoutSessionId } })

  const set = await prisma.workoutSet.create({
    data: {
      workoutSessionId: parsed.data.workoutSessionId,
      exerciseId: parsed.data.exerciseId,
      ordre: dernierOrdre,
      repetitions: parsed.data.repetitions,
      chargeKg: parsed.data.chargeKg,
      rpe: parsed.data.rpe,
      note: parsed.data.note,
    },
  })

  revalidatePath(`/activites/musculation/${parsed.data.workoutSessionId}`)
  return set
}

/** Duplique une série existante (même exercice/reps/charge), ajoutée à la fin de la séance. */
export async function dupliquerSerieAction(setId: string) {
  const userId = await requireUserId()
  const original = await prisma.workoutSet.findUnique({
    where: { id: setId },
    include: { workoutSession: true },
  })
  if (!original || original.workoutSession.userId !== userId) {
    throw new Error("Cette série n'existe pas ou ne t'appartient pas.")
  }

  const dernierOrdre = await prisma.workoutSet.count({ where: { workoutSessionId: original.workoutSessionId } })
  const copie = await prisma.workoutSet.create({
    data: {
      workoutSessionId: original.workoutSessionId,
      exerciseId: original.exerciseId,
      ordre: dernierOrdre,
      repetitions: original.repetitions,
      chargeKg: original.chargeKg,
      rpe: original.rpe,
      note: original.note,
    },
  })

  revalidatePath(`/activites/musculation/${original.workoutSessionId}`)
  return copie
}

export async function supprimerSerieMusculationAction(setId: string) {
  const userId = await requireUserId()
  const set = await prisma.workoutSet.findUnique({ where: { id: setId }, include: { workoutSession: true } })
  if (!set || set.workoutSession.userId !== userId) {
    throw new Error("Cette série n'existe pas ou ne t'appartient pas.")
  }
  await prisma.workoutSet.delete({ where: { id: setId } })
  revalidatePath(`/activites/musculation/${set.workoutSessionId}`)
}

export async function terminerSeanceAction(workoutSessionId: string, dureeSecondes: number) {
  const userId = await requireUserId()
  const seance = await prisma.workoutSession.findUnique({ where: { id: workoutSessionId } })
  if (!seance || seance.userId !== userId) throw new Error("Cette séance n'existe pas ou ne t'appartient pas.")

  await prisma.workoutSession.update({ where: { id: workoutSessionId }, data: { dureeSecondes } })
  revalidatePath('/')
  redirect(`/activites/musculation/${workoutSessionId}/recap`)
}

export async function abandonnerSeanceAction(workoutSessionId: string) {
  const userId = await requireUserId()
  const seance = await prisma.workoutSession.findUnique({ where: { id: workoutSessionId } })
  if (!seance || seance.userId !== userId) throw new Error("Cette séance n'existe pas ou ne t'appartient pas.")

  await prisma.workoutSession.delete({ where: { id: workoutSessionId } })
  revalidatePath('/')
  redirect(`/?date=${formatDateParam(seance.date)}`)
}
