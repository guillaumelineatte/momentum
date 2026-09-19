import { prisma } from '@/lib/prisma'

export type RecordCharge = { exercice: string; chargeKg: number; date: Date; reps: number }

/** Meilleure charge jamais soulevée, par exercice. */
export async function getRecordsCharges(userId: string): Promise<RecordCharge[]> {
  const sets = await prisma.workoutSet.findMany({
    where: { workoutSession: { userId } },
    include: { exercise: { select: { nom: true } }, workoutSession: { select: { date: true } } },
  })

  const meilleurs = new Map<string, RecordCharge>()
  for (const s of sets) {
    const actuel = meilleurs.get(s.exerciseId)
    if (!actuel || s.chargeKg > actuel.chargeKg) {
      meilleurs.set(s.exerciseId, { exercice: s.exercise.nom, chargeKg: s.chargeKg, date: s.workoutSession.date, reps: s.repetitions })
    }
  }
  return Array.from(meilleurs.values()).sort((a, b) => b.chargeKg - a.chargeKg)
}

export type RecordAllure = { distanceKm: number; allureMinParKm: number; date: Date } | null

/** Meilleure allure (la plus rapide) sur une distance proche de `cible` km (tolérance ±cible*5%). */
async function meilleureAllureSur(userId: string, cible: number): Promise<RecordAllure> {
  const tolerance = cible * 0.05
  const sessions = await prisma.cardioSession.findMany({
    where: { userId, distanceKm: { gte: cible - tolerance, lte: cible + tolerance } },
  })
  if (sessions.length === 0) return null

  let meilleure: RecordAllure = null
  for (const s of sessions) {
    if (!s.distanceKm) continue
    const allure = s.dureeSecondes / 60 / s.distanceKm
    if (!meilleure || allure < meilleure.allureMinParKm) {
      meilleure = { distanceKm: s.distanceKm, allureMinParKm: Math.round(allure * 100) / 100, date: s.date }
    }
  }
  return meilleure
}

export type PlusLongueSortie = { distanceKm: number; date: Date; type: string } | null

async function getPlusLongueSortie(userId: string): Promise<PlusLongueSortie> {
  const session = await prisma.cardioSession.findFirst({
    where: { userId, distanceKm: { not: null } },
    orderBy: { distanceKm: 'desc' },
  })
  return session?.distanceKm ? { distanceKm: session.distanceKm, date: session.date, type: session.type } : null
}

export async function getRecordsCardio(userId: string) {
  const [allure5km, allure10km, plusLongue] = await Promise.all([
    meilleureAllureSur(userId, 5),
    meilleureAllureSur(userId, 10),
    getPlusLongueSortie(userId),
  ])
  return { allure5km, allure10km, plusLongue }
}
