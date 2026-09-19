import { prisma } from '@/lib/prisma'
import { startOfWeek, endOfWeek } from 'date-fns'
import { TYPES_OBJECTIF } from '@/lib/validations/objectifs'

export { TYPES_OBJECTIF }

/** Valeur actuelle pour un type d'objectif donné — sert à la fois à créer un objectif
 * (capture du point de départ) et à calculer sa progression au fil du temps. */
export async function getValeurActuelle(userId: string, type: string, exerciceId?: string | null): Promise<number | null> {
  switch (type) {
    case 'POIDS': {
      const m = await prisma.bodyMeasurement.findFirst({ where: { userId, poidsKg: { not: null } }, orderBy: [{ date: 'desc' }, { createdAt: 'desc' }] })
      return m?.poidsKg ?? null
    }
    case 'MENSURATION': {
      const m = await prisma.bodyMeasurement.findFirst({ where: { userId, tourTailleCm: { not: null } }, orderBy: [{ date: 'desc' }, { createdAt: 'desc' }] })
      return m?.tourTailleCm ?? null
    }
    case 'CHARGE_EXERCICE': {
      if (!exerciceId) return null
      const s = await prisma.workoutSet.findFirst({
        where: { exerciseId: exerciceId, workoutSession: { userId } },
        orderBy: { chargeKg: 'desc' },
      })
      return s?.chargeKg ?? null
    }
    case 'ALLURE': {
      const sessions = await prisma.cardioSession.findMany({ where: { userId, distanceKm: { gte: 1 } } })
      if (sessions.length === 0) return null
      const allures = sessions.map((s) => s.dureeSecondes / 60 / s.distanceKm!)
      return Math.round(Math.min(...allures) * 100) / 100
    }
    case 'DISTANCE_HEBDO': {
      const debut = startOfWeek(new Date(), { weekStartsOn: 1 })
      const fin = endOfWeek(new Date(), { weekStartsOn: 1 })
      const sessions = await prisma.cardioSession.findMany({ where: { userId, date: { gte: debut, lte: fin } } })
      return Math.round(sessions.reduce((t, s) => t + (s.distanceKm ?? 0), 0) * 10) / 10
    }
    case 'VOLUME_HEBDO': {
      const debut = startOfWeek(new Date(), { weekStartsOn: 1 })
      const fin = endOfWeek(new Date(), { weekStartsOn: 1 })
      const sets = await prisma.workoutSet.findMany({ where: { workoutSession: { userId, date: { gte: debut, lte: fin } } } })
      return Math.round(sets.reduce((t, s) => t + s.repetitions * s.chargeKg, 0))
    }
    default:
      return null
  }
}

export type ObjectifAvecProgression = {
  id: string
  titre: string
  type: string
  unite: string
  valeurDepart: number | null
  valeurCible: number
  valeurActuelle: number | null
  progressionPct: number
  atteint: boolean
}

export async function getObjectifsAvecProgression(userId: string): Promise<ObjectifAvecProgression[]> {
  const objectifs = await prisma.goal.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } })

  return Promise.all(
    objectifs.map(async (o) => {
      const valeurActuelle = await getValeurActuelle(userId, o.type, o.exerciceId)
      let progressionPct = 0
      if (valeurActuelle != null) {
        if (o.valeurDepart != null && o.valeurCible !== o.valeurDepart) {
          progressionPct = ((valeurActuelle - o.valeurDepart) / (o.valeurCible - o.valeurDepart)) * 100
        } else if (o.valeurDepart == null && o.valeurCible !== 0) {
          progressionPct = (valeurActuelle / o.valeurCible) * 100
        }
      }
      progressionPct = Math.max(0, Math.min(100, Math.round(progressionPct)))
      const atteint = progressionPct >= 100

      return {
        id: o.id,
        titre: o.titre,
        type: o.type,
        unite: o.unite,
        valeurDepart: o.valeurDepart,
        valeurCible: o.valeurCible,
        valeurActuelle,
        progressionPct,
        atteint,
      }
    }),
  )
}
