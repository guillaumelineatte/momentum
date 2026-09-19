import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { Trophy } from 'lucide-react'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getRecordsActuels } from '@/lib/data/musculation'
import { LABELS_TYPE_SEANCE, formatDureeMin } from '@/lib/labels'
import { formatDateParam } from '@/lib/dates'
import { CompteurAnime } from '@/components/compteur-anime'

export default async function RecapSeancePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) redirect('/connexion')
  const userId = session.user.id

  const { id } = await params
  const seance = await prisma.workoutSession.findUnique({
    where: { id },
    include: { sets: { include: { exercise: true } } },
  })

  if (!seance || seance.userId !== userId) notFound()
  if (seance.dureeSecondes == null) redirect(`/activites/musculation/${id}`)

  const titre = seance.nomPersonnalise || LABELS_TYPE_SEANCE[seance.type] || 'Séance'
  const volumeTotal = seance.sets.reduce((total, s) => total + s.repetitions * s.chargeKg, 0)
  const exerciceIds = Array.from(new Set(seance.sets.map((s) => s.exerciseId)))
  const recordsAvant = await getRecordsActuels(userId, exerciceIds, seance.id)

  const chargeMaxParExercice = new Map<string, { nom: string; charge: number }>()
  for (const s of seance.sets) {
    const actuel = chargeMaxParExercice.get(s.exerciseId)
    if (!actuel || s.chargeKg > actuel.charge) {
      chargeMaxParExercice.set(s.exerciseId, { nom: s.exercise.nom, charge: s.chargeKg })
    }
  }
  const nouveauxRecords = Array.from(chargeMaxParExercice.entries())
    .filter(([id, { charge }]) => charge > (recordsAvant.get(id) ?? 0))
    .map(([, v]) => v)

  return (
    <main className="recap-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <div className="recap-card glass-card">
        <p className="eyebrow accent">SÉANCE TERMINÉE</p>
        <h1 style={{ margin: '8px 0 4px' }}>{titre}</h1>
        <p className="auth-subtitle" style={{ marginBottom: 0 }}>Bien joué, c'est enregistré.</p>

        <div className="recap-stats">
          <div><strong>{formatDureeMin(seance.dureeSecondes ?? 0)}</strong><span>durée</span></div>
          <div><strong><CompteurAnime valeur={seance.sets.length} /></strong><span>séries</span></div>
          <div><strong><CompteurAnime valeur={Math.round(volumeTotal)} /></strong><span>volume (kg)</span></div>
        </div>

        {nouveauxRecords.length > 0 && (
          <div className="recap-records">
            <h3><Trophy size={15} /> Nouveaux records</h3>
            <ul>
              {nouveauxRecords.map((r) => (
                <li key={r.nom}>{r.nom} — <strong>{r.charge} kg</strong></li>
              ))}
            </ul>
          </div>
        )}

        <Link href={`/?date=${formatDateParam(seance.date)}`} className="form-submit" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 20 }}>
          Retour à ta journée
        </Link>
      </div>
    </main>
  )
}
