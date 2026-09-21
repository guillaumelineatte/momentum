import { prisma } from '@/lib/prisma'

/**
 * Toutes les données d'un utilisateur, pour l'export (droit d'accès et à la portabilité).
 * Volontairement absents : l'empreinte du mot de passe, les jetons, les sessions et les identifiants internes
 * qui pointent vers d'autres utilisateurs.
 */
export async function exporterDonnees(userId: string) {
  const [user, profil, exercices, seances, cardio, mesures, suivi, repos, objectifs, badges] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { name: true, email: true, emailVerified: true, consentementLe: true, createdAt: true },
    }),
    prisma.profile.findUnique({ where: { userId }, omit: { id: true, userId: true } }),
    prisma.exercise.findMany({ where: { userId }, select: { nom: true, groupeMusculaire: true, createdAt: true } }),
    prisma.workoutSession.findMany({
      where: { userId },
      orderBy: { date: 'asc' },
      omit: { id: true, userId: true },
      include: {
        sets: {
          orderBy: { ordre: 'asc' },
          omit: { id: true, workoutSessionId: true, exerciseId: true },
          include: { exercise: { select: { nom: true, groupeMusculaire: true } } },
        },
      },
    }),
    prisma.cardioSession.findMany({ where: { userId }, orderBy: { date: 'asc' }, omit: { id: true, userId: true } }),
    prisma.bodyMeasurement.findMany({ where: { userId }, orderBy: { date: 'asc' }, omit: { id: true, userId: true } }),
    prisma.dailyMetric.findMany({ where: { userId }, orderBy: { date: 'asc' }, omit: { id: true, userId: true } }),
    prisma.restDay.findMany({ where: { userId }, orderBy: { date: 'asc' }, omit: { id: true, userId: true } }),
    prisma.goal.findMany({ where: { userId }, orderBy: { createdAt: 'asc' }, omit: { id: true, userId: true } }),
    prisma.userBadge.findMany({
      where: { userId },
      orderBy: { debloqueLe: 'asc' },
      select: { debloqueLe: true, badge: { select: { cle: true, nom: true, description: true } } },
    }),
  ])

  return {
    exporteLe: new Date().toISOString(),
    compte: {
      prenom: user.name,
      email: user.email,
      emailConfirmeLe: user.emailVerified,
      consentementLe: user.consentementLe,
      creeLe: user.createdAt,
    },
    profil,
    exercicesPersonnalises: exercices,
    seancesMusculation: seances,
    seancesCardio: cardio,
    mesuresCorporelles: mesures,
    suiviQuotidien: suivi,
    joursDeRepos: repos,
    objectifs,
    badges,
  }
}
