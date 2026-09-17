import { prisma } from '@/lib/prisma'
import { jourRange, subDays, formatDateParam } from '@/lib/dates'

export async function getJourSummary(userId: string, date: Date) {
  const { debut, fin } = jourRange(date)

  const [seances, cardio, mesures, quotidien] = await Promise.all([
    prisma.workoutSession.findMany({
      where: { userId, date: { gte: debut, lte: fin } },
      include: { sets: true },
      orderBy: { date: 'asc' },
    }),
    prisma.cardioSession.findMany({
      where: { userId, date: { gte: debut, lte: fin } },
      orderBy: { date: 'asc' },
    }),
    prisma.bodyMeasurement.findMany({
      where: { userId, date: { gte: debut, lte: fin } },
      orderBy: { date: 'asc' },
    }),
    prisma.dailyMetric.findFirst({
      where: { userId, date: { gte: debut, lte: fin } },
    }),
  ])

  return { seances, cardio, mesures, quotidien }
}

/** Métrique du jour précédent, pour afficher une tendance simple sur les chiffres du jour. */
export async function getQuotidienVeille(userId: string, date: Date) {
  const veille = subDays(date, 1)
  const { debut, fin } = jourRange(veille)
  return prisma.dailyMetric.findFirst({ where: { userId, date: { gte: debut, lte: fin } } })
}

export type TypeActivite = 'muscu' | 'cardio' | 'mesure' | 'quotidien'

/** Pour chaque jour de `dates`, quels types d'activité sont présents (pastilles du calendrier / bandeau semaine). */
export async function getActivitesParJour(userId: string, dates: Date[]): Promise<Map<string, Set<TypeActivite>>> {
  if (dates.length === 0) return new Map()
  const debut = dates[0]
  const fin = dates[dates.length - 1]
  const { debut: rangeDebut } = jourRange(debut)
  const { fin: rangeFin } = jourRange(fin)

  const [seances, cardio, mesures, quotidien] = await Promise.all([
    prisma.workoutSession.findMany({ where: { userId, date: { gte: rangeDebut, lte: rangeFin } }, select: { date: true } }),
    prisma.cardioSession.findMany({ where: { userId, date: { gte: rangeDebut, lte: rangeFin } }, select: { date: true } }),
    prisma.bodyMeasurement.findMany({ where: { userId, date: { gte: rangeDebut, lte: rangeFin } }, select: { date: true } }),
    prisma.dailyMetric.findMany({ where: { userId, date: { gte: rangeDebut, lte: rangeFin } }, select: { date: true } }),
  ])

  const map = new Map<string, Set<TypeActivite>>()
  const ajoute = (rows: { date: Date }[], type: TypeActivite) => {
    for (const row of rows) {
      const cle = formatDateParam(row.date)
      if (!map.has(cle)) map.set(cle, new Set())
      map.get(cle)!.add(type)
    }
  }
  ajoute(seances, 'muscu')
  ajoute(cardio, 'cardio')
  ajoute(mesures, 'mesure')
  ajoute(quotidien, 'quotidien')

  return map
}

/** Nombre de jours consécutifs (jusqu'à aujourd'hui, ou hier si rien saisi aujourd'hui) avec au moins une activité. */
export async function getStreak(userId: string): Promise<number> {
  const depuis = subDays(new Date(), 400)
  const activites = await getActivitesParJour(userId, [depuis, new Date()])

  let curseur = new Date()
  // Si rien aujourd'hui, on ne casse pas la série : on commence à hier.
  if (!activites.has(formatDateParam(curseur))) {
    curseur = subDays(curseur, 1)
    if (!activites.has(formatDateParam(curseur))) return 0
  }

  let streak = 0
  while (activites.has(formatDateParam(curseur))) {
    streak += 1
    curseur = subDays(curseur, 1)
  }
  return streak
}

/** Stats simples de la semaine en cours (séances, km parcourus, jours actifs). */
export async function getStatsSemaineEnCours(userId: string, joursDeLaSemaine: Date[]) {
  const debut = joursDeLaSemaine[0]
  const fin = joursDeLaSemaine[joursDeLaSemaine.length - 1]
  const { debut: rangeDebut } = jourRange(debut)
  const { fin: rangeFin } = jourRange(fin)

  const [seances, cardio, activites] = await Promise.all([
    prisma.workoutSession.count({ where: { userId, date: { gte: rangeDebut, lte: rangeFin } } }),
    prisma.cardioSession.findMany({ where: { userId, date: { gte: rangeDebut, lte: rangeFin } }, select: { distanceKm: true } }),
    getActivitesParJour(userId, joursDeLaSemaine),
  ])

  const kmParcourus = cardio.reduce((total, c) => total + (c.distanceKm ?? 0), 0)
  const joursActifs = joursDeLaSemaine.filter((jour) => activites.has(formatDateParam(jour))).length

  return {
    seances,
    kmParcourus,
    joursActifs,
    pourcentageSemaine: Math.round((joursActifs / joursDeLaSemaine.length) * 100),
  }
}
