import { Dumbbell, Gauge, Route as RouteIcon, Trophy } from 'lucide-react'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getStreak } from '@/lib/data/jour'
import { getRecordsCharges, getRecordsCardio } from '@/lib/data/records'
import { LABELS_TYPE_CARDIO } from '@/lib/labels'
import { labelJourLongAvecAnnee } from '@/lib/dates'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'

function formatAllure(minParKm: number): string {
  const minutes = Math.floor(minParKm)
  const secondes = Math.round((minParKm - minutes) * 60)
  return `${minutes}:${String(secondes).padStart(2, '0')} /km`
}

export default async function RecordsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/connexion')
  const userId = session.user.id

  const [profile, streak, recordsCharges, recordsCardio] = await Promise.all([
    prisma.profile.findUnique({ where: { userId } }),
    getStreak(userId),
    getRecordsCharges(userId),
    getRecordsCardio(userId),
  ])

  const aucunRecord = recordsCharges.length === 0 && !recordsCardio.allure5km && !recordsCardio.allure10km && !recordsCardio.plusLongue

  return (
    <DashboardShell prenom={profile?.prenom ?? ''} pageActive="Progression" streak={streak}>
      <div className="calendar-page-header">
        <div>
          <p className="eyebrow">RECORDS PERSONNELS</p>
          <h1>Tes meilleures performances</h1>
        </div>
      </div>

      {aucunRecord && (
        <div className="empty-state">
          <div className="empty-icon"><Trophy size={17} /></div>
          Aucun record pour l’instant — continue à t’entraîner !
        </div>
      )}

      {(recordsCardio.allure5km || recordsCardio.allure10km || recordsCardio.plusLongue) && (
        <>
          <div className="section-inline-title"><h2>Course</h2></div>
          <div className="records-grid">
            {recordsCardio.allure5km && (
              <article className="record-card glass-card">
                <div className="icon-badge"><Gauge size={17} /></div>
                <strong>{formatAllure(recordsCardio.allure5km.allureMinParKm)}</strong>
                <span className="sous-titre">Meilleure allure sur ~5 km ({recordsCardio.allure5km.distanceKm} km)</span>
                <span className="date">{labelJourLongAvecAnnee(recordsCardio.allure5km.date)}</span>
              </article>
            )}
            {recordsCardio.allure10km && (
              <article className="record-card glass-card">
                <div className="icon-badge"><Gauge size={17} /></div>
                <strong>{formatAllure(recordsCardio.allure10km.allureMinParKm)}</strong>
                <span className="sous-titre">Meilleure allure sur ~10 km ({recordsCardio.allure10km.distanceKm} km)</span>
                <span className="date">{labelJourLongAvecAnnee(recordsCardio.allure10km.date)}</span>
              </article>
            )}
            {recordsCardio.plusLongue && (
              <article className="record-card glass-card">
                <div className="icon-badge"><RouteIcon size={17} /></div>
                <strong>{recordsCardio.plusLongue.distanceKm} km</strong>
                <span className="sous-titre">Plus longue sortie ({LABELS_TYPE_CARDIO[recordsCardio.plusLongue.type] ?? recordsCardio.plusLongue.type})</span>
                <span className="date">{labelJourLongAvecAnnee(recordsCardio.plusLongue.date)}</span>
              </article>
            )}
          </div>
        </>
      )}

      {recordsCharges.length > 0 && (
        <>
          <div className="section-inline-title"><h2>Musculation — meilleure charge par exercice</h2></div>
          <div className="records-grid">
            {recordsCharges.map((r) => (
              <article className="record-card glass-card" key={r.exercice}>
                <div className="icon-badge"><Dumbbell size={17} /></div>
                <strong>{r.chargeKg} kg</strong>
                <span className="sous-titre">{r.exercice} · {r.reps} reps</span>
                <span className="date">{labelJourLongAvecAnnee(r.date)}</span>
              </article>
            ))}
          </div>
        </>
      )}
    </DashboardShell>
  )
}
