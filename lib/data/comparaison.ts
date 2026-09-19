import { prisma } from '@/lib/prisma'
import { jourRange } from '@/lib/dates'

export type Direction = 'hausse' | 'baisse' | 'neutre'

export type Metrique = {
  cle: string
  label: string
  unite: string
  avant: number | null
  apres: number | null
  direction: Direction
  decimales?: number
}

export type GroupeComparaison = {
  titre: string
  metriques: Metrique[]
}

export type ComparaisonExercice = {
  nom: string
  chargeMaxAvant: number | null
  chargeMaxApres: number | null
  volumeAvant: number | null
  volumeApres: number | null
  repsAvant: number | null
  repsApres: number | null
}

/** Mesure corporelle la plus récente à la date donnée ou avant (le poids/les mensurations
 * ne se mesurent pas forcément tous les jours, on prend la dernière valeur connue). */
async function getDernierePesee(userId: string, date: Date) {
  const { fin } = jourRange(date)
  return prisma.bodyMeasurement.findFirst({
    where: { userId, date: { lte: fin } },
    // `date` ne retient que le jour choisi (minuit), donc plusieurs mesures le même
    // jour ont une valeur `date` identique — `createdAt` départage pour garder la
    // dernière saisie réelle comme valeur de référence.
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
  })
}

async function getQuotidien(userId: string, date: Date) {
  const { debut, fin } = jourRange(date)
  return prisma.dailyMetric.findFirst({ where: { userId, date: { gte: debut, lte: fin } } })
}

async function getCardioAgrege(userId: string, date: Date) {
  const { debut, fin } = jourRange(date)
  const sessions = await prisma.cardioSession.findMany({ where: { userId, date: { gte: debut, lte: fin } } })
  if (sessions.length === 0) return null
  const distanceKm = sessions.reduce((t, s) => t + (s.distanceKm ?? 0), 0)
  const dureeSecondes = sessions.reduce((t, s) => t + s.dureeSecondes, 0)
  return { distanceKm, dureeSecondes, allureMinParKm: distanceKm > 0 ? dureeSecondes / 60 / distanceKm : null }
}

async function getExercicesJour(userId: string, date: Date) {
  const { debut, fin } = jourRange(date)
  const sessions = await prisma.workoutSession.findMany({
    where: { userId, date: { gte: debut, lte: fin } },
    include: { sets: { include: { exercise: true } } },
  })
  const parExercice = new Map<string, { nom: string; chargeMax: number; volume: number; reps: number }>()
  for (const session of sessions) {
    for (const set of session.sets) {
      const cle = set.exercise.nom
      const actuel = parExercice.get(cle) ?? { nom: cle, chargeMax: 0, volume: 0, reps: 0 }
      actuel.chargeMax = Math.max(actuel.chargeMax, set.chargeKg)
      actuel.volume += set.repetitions * set.chargeKg
      actuel.reps += set.repetitions
      parExercice.set(cle, actuel)
    }
  }
  return parExercice
}

/** Le WorkoutSession du même type le plus récent avant `date` (raccourci "même séance précédente"). */
export async function getMemeSeancePrecedente(userId: string, date: Date) {
  const { debut } = jourRange(date)
  const seanceJour = await prisma.workoutSession.findFirst({ where: { userId, date: { gte: debut } }, orderBy: { date: 'asc' } })
  if (!seanceJour) return null
  const precedente = await prisma.workoutSession.findFirst({
    where: { userId, type: seanceJour.type, date: { lt: debut } },
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
  })
  return precedente?.date ?? null
}

function ecartPct(avant: number | null, apres: number | null): number | null {
  if (avant == null || apres == null || avant === 0) return null
  return ((apres - avant) / Math.abs(avant)) * 100
}

/** Le sens "favorable" du poids dépend de l'objectif de l'utilisateur — sans ça,
 * impossible de savoir si une prise ou une perte de poids est une bonne nouvelle. */
function directionPoids(objectifs: string[]): Direction {
  const viseLaPerte = objectifs.includes('PERTE_DE_POIDS')
  const viseLaPrise = objectifs.includes('PRISE_DE_MUSCLE')
  if (viseLaPerte && !viseLaPrise) return 'baisse'
  if (viseLaPrise && !viseLaPerte) return 'hausse'
  return 'neutre' // objectifs contradictoires/absents (recomposition, endurance, force…) -> pas de sens univoque
}

export async function comparerJours(userId: string, dateAvant: Date, dateApres: Date, objectifs: string[] = []) {
  const [peseeAvant, peseeApres, quotidienAvant, quotidienApres, cardioAvant, cardioApres, exercicesAvant, exercicesApres] =
    await Promise.all([
      getDernierePesee(userId, dateAvant),
      getDernierePesee(userId, dateApres),
      getQuotidien(userId, dateAvant),
      getQuotidien(userId, dateApres),
      getCardioAgrege(userId, dateAvant),
      getCardioAgrege(userId, dateApres),
      getExercicesJour(userId, dateAvant),
      getExercicesJour(userId, dateApres),
    ])

  const groupes: GroupeComparaison[] = []

  // ——— Corps ———
  const corps: Metrique[] = []
  if (peseeAvant?.poidsKg != null || peseeApres?.poidsKg != null) {
    corps.push({ cle: 'poids', label: 'Poids', unite: 'kg', avant: peseeAvant?.poidsKg ?? null, apres: peseeApres?.poidsKg ?? null, direction: directionPoids(objectifs), decimales: 1 })
  }
  const mensurations: [string, string, 'tourTailleCm' | 'tourHanchesCm' | 'tourPoitrineCm' | 'tourBrasCm' | 'tourCuissesCm' | 'tourMolletsCm' | 'tourCouCm'][] = [
    ['tourTaille', 'Tour de taille', 'tourTailleCm'],
    ['tourHanches', 'Tour de hanches', 'tourHanchesCm'],
    ['tourPoitrine', 'Tour de poitrine', 'tourPoitrineCm'],
    ['tourBras', 'Tour de bras', 'tourBrasCm'],
    ['tourCuisses', 'Tour de cuisses', 'tourCuissesCm'],
    ['tourMollets', 'Tour de mollets', 'tourMolletsCm'],
    ['tourCou', 'Tour de cou', 'tourCouCm'],
  ]
  for (const [cle, label, champ] of mensurations) {
    const avant = peseeAvant?.[champ] ?? null
    const apres = peseeApres?.[champ] ?? null
    if (avant != null || apres != null) corps.push({ cle, label, unite: 'cm', avant, apres, direction: 'baisse', decimales: 1 })
  }
  if (corps.length > 0) groupes.push({ titre: 'Corps', metriques: corps })

  // ——— Suivi quotidien ———
  const quotidien: Metrique[] = []
  if (quotidienAvant?.pas != null || quotidienApres?.pas != null) {
    quotidien.push({ cle: 'pas', label: 'Pas', unite: '', avant: quotidienAvant?.pas ?? null, apres: quotidienApres?.pas ?? null, direction: 'hausse' })
  }
  if (quotidienAvant?.sommeilHeures != null || quotidienApres?.sommeilHeures != null) {
    quotidien.push({ cle: 'sommeil', label: 'Sommeil', unite: 'h', avant: quotidienAvant?.sommeilHeures ?? null, apres: quotidienApres?.sommeilHeures ?? null, direction: 'hausse', decimales: 1 })
  }
  if (quotidienAvant?.hydratationL != null || quotidienApres?.hydratationL != null) {
    quotidien.push({ cle: 'hydratation', label: 'Hydratation', unite: 'L', avant: quotidienAvant?.hydratationL ?? null, apres: quotidienApres?.hydratationL ?? null, direction: 'hausse', decimales: 1 })
  }
  if (quotidienAvant?.energie != null || quotidienApres?.energie != null) {
    quotidien.push({ cle: 'energie', label: 'Énergie', unite: '/5', avant: quotidienAvant?.energie ?? null, apres: quotidienApres?.energie ?? null, direction: 'hausse' })
  }
  if (quotidien.length > 0) groupes.push({ titre: 'Suivi quotidien', metriques: quotidien })

  // ——— Cardio ———
  if (cardioAvant || cardioApres) {
    const cardio: Metrique[] = [
      { cle: 'distance', label: 'Distance', unite: 'km', avant: cardioAvant?.distanceKm ?? null, apres: cardioApres?.distanceKm ?? null, direction: 'hausse', decimales: 1 },
      { cle: 'duree', label: 'Durée', unite: 'min', avant: cardioAvant ? cardioAvant.dureeSecondes / 60 : null, apres: cardioApres ? cardioApres.dureeSecondes / 60 : null, direction: 'neutre' },
    ]
    if (cardioAvant?.allureMinParKm != null || cardioApres?.allureMinParKm != null) {
      cardio.push({ cle: 'allure', label: 'Allure', unite: 'min/km', avant: cardioAvant?.allureMinParKm ?? null, apres: cardioApres?.allureMinParKm ?? null, direction: 'baisse', decimales: 2 })
    }
    groupes.push({ titre: 'Cardio', metriques: cardio })
  }

  // ——— Musculation, exercice par exercice ———
  const nomsExercices = new Set([...exercicesAvant.keys(), ...exercicesApres.keys()])
  const exercices: ComparaisonExercice[] = Array.from(nomsExercices).map((nom) => {
    const a = exercicesAvant.get(nom)
    const b = exercicesApres.get(nom)
    return {
      nom,
      chargeMaxAvant: a?.chargeMax ?? null,
      chargeMaxApres: b?.chargeMax ?? null,
      volumeAvant: a?.volume ?? null,
      volumeApres: b?.volume ?? null,
      repsAvant: a?.reps ?? null,
      repsApres: b?.reps ?? null,
    }
  })

  return { groupes, exercices, ecartPct }
}
