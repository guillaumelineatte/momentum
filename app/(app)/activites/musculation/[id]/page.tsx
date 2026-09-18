import { redirect, notFound } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getExercicesDisponibles, getExercicesFrequents, getDernieresPerformances, getRecordsActuels } from '@/lib/data/musculation'
import { SeanceActive } from './seance-active'

export default async function SeancePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) redirect('/connexion')
  const userId = session.user.id

  const { id } = await params
  const seance = await prisma.workoutSession.findUnique({
    where: { id },
    include: { sets: { include: { exercise: true }, orderBy: { ordre: 'asc' } } },
  })

  if (!seance || seance.userId !== userId) notFound()
  if (seance.dureeSecondes != null) redirect(`/activites/musculation/${id}/recap`)

  const exerciceIdsEnCours = Array.from(new Set(seance.sets.map((s) => s.exerciseId)))

  const [bibliotheque, frequents, dernieresPerformances, records] = await Promise.all([
    getExercicesDisponibles(userId),
    getExercicesFrequents(userId, seance.type),
    getDernieresPerformances(userId, exerciceIdsEnCours, seance.id),
    getRecordsActuels(userId, exerciceIdsEnCours, seance.id),
  ])

  return (
    <SeanceActive
      seance={{
        id: seance.id,
        type: seance.type,
        nomPersonnalise: seance.nomPersonnalise,
        // `date` = jour choisi pour le classement (peut être un jour passé, complété a posteriori) ;
        // `createdAt` = instant réel de création, utilisé pour le chrono (sinon une séance filée sur
        // un autre jour que "maintenant" afficherait un temps écoulé absurde depuis minuit).
        dateDebutISO: seance.createdAt.toISOString(),
      }}
      sets={seance.sets.map((s) => ({
        id: s.id,
        ordre: s.ordre,
        repetitions: s.repetitions,
        chargeKg: s.chargeKg,
        rpe: s.rpe,
        note: s.note,
        exercice: { id: s.exercise.id, nom: s.exercise.nom, groupeMusculaire: s.exercise.groupeMusculaire },
      }))}
      bibliotheque={bibliotheque.map((e) => ({ id: e.id, nom: e.nom, groupeMusculaire: e.groupeMusculaire, personnalise: e.userId != null }))}
      exercicesFrequents={frequents}
      dernieresPerformances={Object.fromEntries(
        Array.from(dernieresPerformances, ([id, p]) => [id, { reps: p.reps, chargeKg: p.chargeKg, date: p.date.toISOString() }]),
      )}
      records={Object.fromEntries(records)}
    />
  )
}
