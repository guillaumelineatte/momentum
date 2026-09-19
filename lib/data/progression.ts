import { prisma } from '@/lib/prisma'
import { subWeeks, subMonths, subYears, startOfWeek, formatDateParam } from '@/lib/dates'

export type Periode = '4sem' | '3mois' | '6mois' | '1an' | 'tout'

export const PERIODES: { value: Periode; label: string }[] = [
  { value: '4sem', label: '4 sem.' },
  { value: '3mois', label: '3 mois' },
  { value: '6mois', label: '6 mois' },
  { value: '1an', label: '1 an' },
  { value: 'tout', label: 'Tout' },
]

export function dateDebutPeriode(periode: Periode, pointDepart?: Date): Date {
  const maintenant = new Date()
  switch (periode) {
    case '4sem':
      return subWeeks(maintenant, 4)
    case '3mois':
      return subMonths(maintenant, 3)
    case '6mois':
      return subMonths(maintenant, 6)
    case '1an':
      return subYears(maintenant, 1)
    case 'tout':
      return pointDepart ?? subYears(maintenant, 5)
  }
}

export type PointSerie = { date: string; valeur: number }

export const METRIQUES = [
  { value: 'poids', label: 'Poids', unite: 'kg' },
  { value: 'tourTaille', label: 'Tour de taille', unite: 'cm' },
  { value: 'pas', label: 'Pas', unite: '' },
  { value: 'sommeil', label: 'Sommeil', unite: 'h' },
  { value: 'kmHebdo', label: 'Km hebdomadaires', unite: 'km' },
  { value: 'allure', label: 'Allure (course)', unite: 'min/km' },
  { value: 'charge', label: 'Charge par exercice', unite: 'kg' },
] as const
export type CleMetrique = (typeof METRIQUES)[number]['value']

async function seriePoids(userId: string, debut: Date): Promise<PointSerie[]> {
  const rows = await prisma.bodyMeasurement.findMany({
    where: { userId, date: { gte: debut }, poidsKg: { not: null } },
    orderBy: { date: 'asc' },
    select: { date: true, poidsKg: true },
  })
  return rows.map((r) => ({ date: formatDateParam(r.date), valeur: r.poidsKg! }))
}

async function serieTourTaille(userId: string, debut: Date): Promise<PointSerie[]> {
  const rows = await prisma.bodyMeasurement.findMany({
    where: { userId, date: { gte: debut }, tourTailleCm: { not: null } },
    orderBy: { date: 'asc' },
    select: { date: true, tourTailleCm: true },
  })
  return rows.map((r) => ({ date: formatDateParam(r.date), valeur: r.tourTailleCm! }))
}

async function seriePas(userId: string, debut: Date): Promise<PointSerie[]> {
  const rows = await prisma.dailyMetric.findMany({
    where: { userId, date: { gte: debut }, pas: { not: null } },
    orderBy: { date: 'asc' },
    select: { date: true, pas: true },
  })
  return rows.map((r) => ({ date: formatDateParam(r.date), valeur: r.pas! }))
}

async function serieSommeil(userId: string, debut: Date): Promise<PointSerie[]> {
  const rows = await prisma.dailyMetric.findMany({
    where: { userId, date: { gte: debut }, sommeilHeures: { not: null } },
    orderBy: { date: 'asc' },
    select: { date: true, sommeilHeures: true },
  })
  return rows.map((r) => ({ date: formatDateParam(r.date), valeur: r.sommeilHeures! }))
}

async function serieKmHebdo(userId: string, debut: Date): Promise<PointSerie[]> {
  const rows = await prisma.cardioSession.findMany({
    where: { userId, date: { gte: debut }, distanceKm: { not: null } },
    select: { date: true, distanceKm: true },
  })
  const parSemaine = new Map<string, number>()
  for (const r of rows) {
    const cle = formatDateParam(startOfWeek(r.date, { weekStartsOn: 1 }))
    parSemaine.set(cle, (parSemaine.get(cle) ?? 0) + (r.distanceKm ?? 0))
  }
  return Array.from(parSemaine.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, valeur]) => ({ date, valeur: Math.round(valeur * 10) / 10 }))
}

async function serieAllure(userId: string, debut: Date): Promise<PointSerie[]> {
  const rows = await prisma.cardioSession.findMany({
    where: { userId, date: { gte: debut }, distanceKm: { not: null, gt: 0 } },
    orderBy: { date: 'asc' },
    select: { date: true, distanceKm: true, dureeSecondes: true },
  })
  return rows.map((r) => ({ date: formatDateParam(r.date), valeur: Math.round((r.dureeSecondes / 60 / r.distanceKm!) * 100) / 100 }))
}

async function serieCharge(userId: string, debut: Date, exerciseId: string): Promise<PointSerie[]> {
  const sets = await prisma.workoutSet.findMany({
    where: { exerciseId, workoutSession: { userId, date: { gte: debut } } },
    include: { workoutSession: { select: { date: true } } },
  })
  const maxParJour = new Map<string, number>()
  for (const s of sets) {
    const cle = formatDateParam(s.workoutSession.date)
    maxParJour.set(cle, Math.max(maxParJour.get(cle) ?? 0, s.chargeKg))
  }
  return Array.from(maxParJour.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, valeur]) => ({ date, valeur }))
}

export async function getSerie(userId: string, metrique: CleMetrique, debut: Date, exerciseId?: string): Promise<PointSerie[]> {
  switch (metrique) {
    case 'poids':
      return seriePoids(userId, debut)
    case 'tourTaille':
      return serieTourTaille(userId, debut)
    case 'pas':
      return seriePas(userId, debut)
    case 'sommeil':
      return serieSommeil(userId, debut)
    case 'kmHebdo':
      return serieKmHebdo(userId, debut)
    case 'allure':
      return serieAllure(userId, debut)
    case 'charge':
      return exerciseId ? serieCharge(userId, debut, exerciseId) : []
  }
}

/** Exercices sur lesquels l'utilisateur a au moins une série enregistrée (pour le sélecteur "Charge par exercice"). */
export async function getExercicesAvecHistorique(userId: string) {
  const sets = await prisma.workoutSet.findMany({
    where: { workoutSession: { userId } },
    distinct: ['exerciseId'],
    select: { exercise: { select: { id: true, nom: true } } },
  })
  return sets.map((s) => s.exercise).sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))
}
