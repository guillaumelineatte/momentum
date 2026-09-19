import { prisma } from '@/lib/prisma'
import { getStreak } from '@/lib/data/jour'
import { getObjectifsAvecProgression } from '@/lib/data/objectifs'

/** Compte le nombre de fois où une charge record a été battue, tous exercices confondus
 * (parcourt l'historique chronologiquement et compte chaque nouveau maximum). */
async function compterRecordsHistoriques(userId: string): Promise<number> {
  const sets = await prisma.workoutSet.findMany({
    where: { workoutSession: { userId } },
    include: { workoutSession: { select: { date: true } } },
    orderBy: [{ workoutSession: { date: 'asc' } }, { createdAt: 'asc' }],
  })
  const maxParExercice = new Map<string, number>()
  let compteur = 0
  for (const s of sets) {
    const actuel = maxParExercice.get(s.exerciseId) ?? 0
    if (s.chargeKg > actuel) {
      compteur += 1
      maxParExercice.set(s.exerciseId, s.chargeKg)
    }
  }
  return compteur
}

type ConditionBadge = (userId: string) => Promise<boolean>

const CONDITIONS: Record<string, ConditionBadge> = {
  'premiere-seance': async (userId) => {
    const n = await prisma.workoutSession.count({ where: { userId, dureeSecondes: { not: null } } })
    return n >= 1
  },
  'streak-7-jours': async (userId) => (await getStreak(userId)) >= 7,
  'streak-30-jours': async (userId) => (await getStreak(userId)) >= 30,
  '100-km-cumules': async (userId) => {
    const sessions = await prisma.cardioSession.findMany({ where: { userId }, select: { distanceKm: true } })
    return sessions.reduce((t, s) => t + (s.distanceKm ?? 0), 0) >= 100
  },
  '10-records': async (userId) => (await compterRecordsHistoriques(userId)) >= 10,
  'premier-objectif': async (userId) => {
    const objectifs = await getObjectifsAvecProgression(userId)
    return objectifs.some((o) => o.atteint)
  },
  '50-seances': async (userId) => {
    const n = await prisma.workoutSession.count({ where: { userId, dureeSecondes: { not: null } } })
    return n >= 50
  },
}

/** Vérifie toutes les conditions et débloque (persiste) les badges nouvellement atteints.
 * Retourne les clés des badges qui viennent d'être débloqués (pour l'animation/toast). */
export async function verifierEtDebloquerBadges(userId: string): Promise<string[]> {
  const [tousLesBadges, dejaDebloques] = await Promise.all([
    prisma.badge.findMany(),
    prisma.userBadge.findMany({ where: { userId }, select: { badgeId: true } }),
  ])
  const idsDejaDebloques = new Set(dejaDebloques.map((u) => u.badgeId))
  const aVerifier = tousLesBadges.filter((b) => !idsDejaDebloques.has(b.id) && CONDITIONS[b.cle])

  const nouveaux: string[] = []
  for (const badge of aVerifier) {
    const atteint = await CONDITIONS[badge.cle](userId)
    if (atteint) {
      await prisma.userBadge.create({ data: { userId, badgeId: badge.id } })
      nouveaux.push(badge.cle)
    }
  }
  return nouveaux
}

export type BadgeAffichage = {
  cle: string
  nom: string
  description: string
  icone: string
  debloque: boolean
  debloqueLe: Date | null
  vientDetreDebloque: boolean
}

export async function getBadgesUtilisateur(userId: string): Promise<BadgeAffichage[]> {
  const nouveaux = await verifierEtDebloquerBadges(userId)

  const [tousLesBadges, debloques] = await Promise.all([
    prisma.badge.findMany({ orderBy: { nom: 'asc' } }),
    prisma.userBadge.findMany({ where: { userId } }),
  ])
  const parBadgeId = new Map(debloques.map((u) => [u.badgeId, u]))

  return tousLesBadges.map((b) => {
    const debloque = parBadgeId.get(b.id)
    return {
      cle: b.cle,
      nom: b.nom,
      description: b.description,
      icone: b.icone,
      debloque: !!debloque,
      debloqueLe: debloque?.debloqueLe ?? null,
      vientDetreDebloque: nouveaux.includes(b.cle),
    }
  })
}
