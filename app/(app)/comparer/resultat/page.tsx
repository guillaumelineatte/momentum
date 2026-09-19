import Link from 'next/link'
import { ArrowDownRight, ArrowUpRight, ChevronLeft, Minus, Scale } from 'lucide-react'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { comparerJours, type Direction } from '@/lib/data/comparaison'
import { parseDateParam, formatDateParam, labelJourLong } from '@/lib/dates'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { getStreak } from '@/lib/data/jour'

function formatValeur(v: number | null, decimales = 0): string {
  if (v == null) return '—'
  return v.toLocaleString('fr-FR', { minimumFractionDigits: decimales, maximumFractionDigits: decimales })
}

function EcartBadge({ avant, apres, direction, decimales = 0 }: { avant: number | null; apres: number | null; direction: Direction; decimales?: number }) {
  if (avant == null || apres == null) {
    return <span className="compare-ecart-badge neutre"><Minus size={11} /> —</span>
  }
  const ecart = apres - avant
  const pct = avant !== 0 ? (ecart / Math.abs(avant)) * 100 : null
  if (Math.abs(ecart) < 10 ** -(decimales + 1)) {
    return <span className="compare-ecart-badge neutre"><Minus size={11} /> stable</span>
  }
  const favorable = direction === 'neutre' ? null : direction === 'hausse' ? ecart > 0 : ecart < 0
  const classe = favorable == null ? 'neutre' : favorable ? 'positif' : 'negatif'
  const Icone = ecart > 0 ? ArrowUpRight : ArrowDownRight
  return (
    <span className={`compare-ecart-badge ${classe}`}>
      <Icone size={11} />
      {ecart > 0 ? '+' : ''}{formatValeur(ecart, decimales)}
      {pct != null && Number.isFinite(pct) && ` (${pct > 0 ? '+' : ''}${pct.toFixed(0)}%)`}
    </span>
  )
}

export default async function ResultatComparaisonPage({
  searchParams,
}: {
  searchParams: Promise<{ avant?: string; apres?: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/connexion')
  const userId = session.user.id

  const { avant, apres } = await searchParams
  if (!avant || !apres) redirect('/comparer')

  const dateAvant = parseDateParam(avant)
  const dateApres = parseDateParam(apres)

  const profile = await prisma.profile.findUnique({ where: { userId } })
  const [{ groupes, exercices }, streak] = await Promise.all([
    comparerJours(userId, dateAvant, dateApres, profile?.objectifs ?? []),
    getStreak(userId),
  ])

  const rienATrouver = groupes.length === 0 && exercices.length === 0

  return (
    <DashboardShell prenom={profile?.prenom ?? ''} pageActive="Aujourd’hui" streak={streak}>
      <Link href={`/comparer?date=${formatDateParam(dateApres)}`} className="auth-links" style={{ marginTop: 20, display: 'inline-flex', alignItems: 'center', gap: 6, width: 'fit-content' }}>
        <ChevronLeft size={15} /> Choisir un autre jour
      </Link>

      <div className="compare-header">
        <div className="jour"><p>AVANT</p><strong>{labelJourLong(dateAvant)}</strong></div>
        <div className="vs">VS</div>
        <div className="jour"><p>APRÈS</p><strong>{labelJourLong(dateApres)}</strong></div>
      </div>

      {rienATrouver ? (
        <div className="empty-state">
          <div className="empty-icon"><Scale size={17} /></div>
          Aucune donnée commune entre ces deux jours pour l’instant.
        </div>
      ) : (
        <div style={{ maxWidth: 640, margin: '0 auto', width: '100%' }}>
          {groupes.map((groupe) => (
            <section className="compare-group glass-card" key={groupe.titre}>
              <h3>{groupe.titre}</h3>
              {groupe.metriques.map((m) => (
                <div className="compare-metric-row" key={m.cle}>
                  <div className="valeur-avant">
                    <strong>{formatValeur(m.avant, m.decimales)}{m.avant != null ? ` ${m.unite}` : ''}</strong>
                  </div>
                  <div className="compare-ecart">
                    <span className="nom-metrique">{m.label}</span>
                    <EcartBadge avant={m.avant} apres={m.apres} direction={m.direction} decimales={m.decimales} />
                  </div>
                  <div className="valeur-apres">
                    <strong>{formatValeur(m.apres, m.decimales)}{m.apres != null ? ` ${m.unite}` : ''}</strong>
                  </div>
                </div>
              ))}
            </section>
          ))}

          {exercices.length > 0 && (
            <section className="compare-group glass-card">
              <h3>Musculation, exercice par exercice</h3>
              {exercices.map((e) => (
                <div className="compare-exercice" key={e.nom}>
                  <strong>{e.nom}</strong>
                  <div className="compare-exercice-stats">
                    <div className="compare-exercice-stat">
                      <span className="label">Charge max</span>
                      <EcartBadge avant={e.chargeMaxAvant} apres={e.chargeMaxApres} direction="hausse" decimales={1} />
                    </div>
                    <div className="compare-exercice-stat">
                      <span className="label">Volume</span>
                      <EcartBadge avant={e.volumeAvant} apres={e.volumeApres} direction="hausse" />
                    </div>
                    <div className="compare-exercice-stat">
                      <span className="label">Répétitions</span>
                      <EcartBadge avant={e.repsAvant} apres={e.repsApres} direction="hausse" />
                    </div>
                  </div>
                </div>
              ))}
            </section>
          )}
        </div>
      )}
    </DashboardShell>
  )
}
