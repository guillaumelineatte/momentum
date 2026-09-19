import Link from 'next/link'
import { BarChart3, Trophy } from 'lucide-react'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getStreak } from '@/lib/data/jour'
import {
  getSerie,
  getExercicesAvecHistorique,
  dateDebutPeriode,
  METRIQUES,
  PERIODES,
  type CleMetrique,
  type Periode,
} from '@/lib/data/progression'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { ProgressionChart } from '@/components/progression/chart'
import { ObjectifsSection } from '@/components/progression/objectifs-section'
import { BadgesSection } from '@/components/progression/badges-section'
import { getObjectifsAvecProgression } from '@/lib/data/objectifs'
import { getBadgesUtilisateur } from '@/lib/data/badges'

export default async function ProgressionPage({
  searchParams,
}: {
  searchParams: Promise<{ metrique?: string; periode?: string; exercice?: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/connexion')
  const userId = session.user.id

  const { metrique, periode, exercice } = await searchParams
  const metriqueActive = (METRIQUES.some((m) => m.value === metrique) ? metrique : 'poids') as CleMetrique
  const periodeActive = (PERIODES.some((p) => p.value === periode) ? periode : '4sem') as Periode
  const infoMetrique = METRIQUES.find((m) => m.value === metriqueActive)!

  const [profile, streak, exercicesHistorique, objectifs, badges] = await Promise.all([
    prisma.profile.findUnique({ where: { userId } }),
    getStreak(userId),
    metriqueActive === 'charge' ? getExercicesAvecHistorique(userId) : Promise.resolve([]),
    getObjectifsAvecProgression(userId),
    getBadgesUtilisateur(userId),
  ])

  const exerciceActif = exercice ?? exercicesHistorique[0]?.id
  const debut = dateDebutPeriode(periodeActive, profile?.dateDepart)
  const donnees = await getSerie(userId, metriqueActive, debut, exerciceActif)

  const pointDepart =
    metriqueActive === 'poids' ? profile?.poidsDepartKg ?? undefined :
    metriqueActive === 'tourTaille' ? profile?.tourTailleDepartCm ?? undefined :
    undefined

  const qs = (overrides: Record<string, string>) => {
    const params = new URLSearchParams({ metrique: metriqueActive, periode: periodeActive, ...(exerciceActif ? { exercice: exerciceActif } : {}), ...overrides })
    return `/progression?${params.toString()}`
  }

  return (
    <DashboardShell prenom={profile?.prenom ?? ''} pageActive="Progression" streak={streak}>
      <div className="calendar-page-header">
        <div>
          <p className="eyebrow">PROGRESSION</p>
          <h1>Ton évolution</h1>
        </div>
        <Link href="/records" className="calendar-button"><Trophy size={15} /> <span>Records personnels</span></Link>
      </div>

      <div className="progression-controls">
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {METRIQUES.map((m) => (
            <Link
              key={m.value}
              href={qs({ metrique: m.value, exercice: m.value === 'charge' ? (exercicesHistorique[0]?.id ?? '') : '' })}
              className="compare-shortcut"
              style={{ minHeight: 'auto', padding: '8px 14px', flexDirection: 'row', alignItems: 'center', gap: 8, ...(metriqueActive === m.value ? { borderColor: 'rgba(240,82,97,.55)', background: 'rgba(240,82,97,.12)', color: 'var(--coral-bright)' } : {}) }}
            >
              <strong style={{ fontSize: 12 }}>{m.label}</strong>
            </Link>
          ))}
        </div>
        <div className="periode-tabs">
          {PERIODES.map((p) => (
            <Link key={p.value} href={qs({ periode: p.value })} className={periodeActive === p.value ? 'active' : ''}>{p.label}</Link>
          ))}
        </div>
      </div>

      {metriqueActive === 'charge' && exercicesHistorique.length > 0 && (
        <div style={{ marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {exercicesHistorique.map((e) => (
            <Link
              key={e.id}
              href={qs({ exercice: e.id })}
              className="calendar-button"
              style={exerciceActif === e.id ? { borderColor: 'rgba(240,82,97,.55)', color: 'var(--coral-bright)' } : undefined}
            >
              <span>{e.nom}</span>
            </Link>
          ))}
        </div>
      )}

      <section className="chart-card glass-card">
        {metriqueActive === 'charge' && exercicesHistorique.length === 0 ? (
          <div className="chart-empty">Aucune séance de musculation enregistrée pour l’instant.</div>
        ) : (
          <div className="chart-card-inner-pad">
            <ProgressionChart donnees={donnees} unite={infoMetrique.unite} pointDepart={pointDepart} />
          </div>
        )}
      </section>

      <div className="section-inline-title">
        <h2>Objectifs</h2>
      </div>
      <ObjectifsSection objectifs={objectifs} />

      <div className="section-inline-title">
        <h2>Badges</h2>
      </div>
      <BadgesSection badges={badges} />
    </DashboardShell>
  )
}
