import { prisma } from '@/lib/prisma'

/** Bibliothèque complète : exercices globaux + ceux créés par l'utilisateur, triés par nom. */
export async function getExercicesDisponibles(userId: string) {
  return prisma.exercise.findMany({
    where: { OR: [{ userId: null }, { userId }] },
    orderBy: { nom: 'asc' },
  })
}

/** Les exercices les plus utilisés par l'utilisateur pour ce type de séance (mis en avant en premier). */
export async function getExercicesFrequents(userId: string, type: string, limite = 8): Promise<string[]> {
  const sets = await prisma.workoutSet.findMany({
    where: { workoutSession: { userId, type: type as never } },
    select: { exerciseId: true },
  })
  const compteurs = new Map<string, number>()
  for (const s of sets) compteurs.set(s.exerciseId, (compteurs.get(s.exerciseId) ?? 0) + 1)
  return Array.from(compteurs.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limite)
    .map(([id]) => id)
}

/** Dernière série loggée sur cet exercice (hors séance en cours), pour l'indice "Dernière fois". */
export async function getDernieresPerformances(userId: string, exerciceIds: string[], excludeSessionId: string) {
  if (exerciceIds.length === 0) return new Map<string, { reps: number; chargeKg: number; date: Date }>()

  const sets = await prisma.workoutSet.findMany({
    where: {
      exerciseId: { in: exerciceIds },
      workoutSession: { userId, id: { not: excludeSessionId } },
    },
    orderBy: { createdAt: 'desc' },
    select: { exerciseId: true, repetitions: true, chargeKg: true, createdAt: true },
  })

  const map = new Map<string, { reps: number; chargeKg: number; date: Date }>()
  for (const s of sets) {
    if (!map.has(s.exerciseId)) {
      map.set(s.exerciseId, { reps: s.repetitions, chargeKg: s.chargeKg, date: s.createdAt })
    }
  }
  return map
}

/** Charge maximale historique par exercice (hors séance en cours), pour détecter les nouveaux records. */
export async function getRecordsActuels(userId: string, exerciceIds: string[], excludeSessionId: string) {
  if (exerciceIds.length === 0) return new Map<string, number>()

  const sets = await prisma.workoutSet.findMany({
    where: {
      exerciseId: { in: exerciceIds },
      workoutSession: { userId, id: { not: excludeSessionId } },
    },
    select: { exerciseId: true, chargeKg: true },
  })

  const map = new Map<string, number>()
  for (const s of sets) {
    const actuel = map.get(s.exerciseId) ?? 0
    if (s.chargeKg > actuel) map.set(s.exerciseId, s.chargeKg)
  }
  return map
}
