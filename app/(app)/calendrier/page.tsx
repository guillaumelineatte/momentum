import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { getActivitesParJour, getStreak } from '@/lib/data/jour'
import { prisma } from '@/lib/prisma'
import {
  grilleMoisDe,
  parseMoisParam,
  formatMoisParam,
  formatDateParam,
  parseDateParam,
  labelMois,
  moisSuivant,
  moisPrecedent,
  isSameMonth,
  isToday,
  isSameDay,
} from '@/lib/dates'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'

const JOURS_SEMAINE = ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM']

export default async function CalendrierPage({
  searchParams,
}: {
  searchParams: Promise<{ mois?: string; date?: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/connexion')

  const { mois, date } = await searchParams
  const moisCourant = parseMoisParam(mois)
  const jourSelectionne = date ? parseDateParam(date) : undefined
  const grille = grilleMoisDe(moisCourant)
  const [activites, profile, streak] = await Promise.all([
    getActivitesParJour(session.user.id, grille),
    prisma.profile.findUnique({ where: { userId: session.user.id } }),
    getStreak(session.user.id),
  ])

  const moisPrecedentParam = formatMoisParam(moisPrecedent(moisCourant))
  const moisSuivantParam = formatMoisParam(moisSuivant(moisCourant))

  return (
    <DashboardShell prenom={profile?.prenom ?? session.user.name ?? ''} pageActive="Calendrier" streak={streak}>
      <div className="calendar-page-header">
        <div>
          <p className="eyebrow">CALENDRIER</p>
          <h1>{labelMois(moisCourant)}</h1>
        </div>
        <div className="calendar-nav">
          <Link href={`/calendrier?mois=${moisPrecedentParam}`} className="circle-arrow" aria-label="Mois précédent"><ChevronLeft size={18} /></Link>
          <Link href={`/calendrier?mois=${formatMoisParam(new Date())}`} className="calendar-button"><span>Aujourd’hui</span></Link>
          <Link href={`/calendrier?mois=${moisSuivantParam}`} className="circle-arrow" aria-label="Mois suivant"><ChevronRight size={18} /></Link>
        </div>
      </div>

      <div className="calendar-weekdays">
        {JOURS_SEMAINE.map((j) => <span key={j}>{j}</span>)}
      </div>

      <div className="calendar-grid">
        {grille.map((jour) => {
          const cle = formatDateParam(jour)
          const types = activites.get(cle)
          const horsMois = !isSameMonth(jour, moisCourant)
          const estAujourdhui = isToday(jour)
          const estSelectionne = jourSelectionne ? isSameDay(jour, jourSelectionne) : false

          return (
            <Link
              key={cle}
              href={`/?date=${cle}`}
              className={`calendar-cell${horsMois ? ' hors-mois' : ''}${estAujourdhui ? ' aujourdhui' : ''}${estSelectionne ? ' selectionne' : ''}`}
            >
              <span>{jour.getDate()}</span>
              {types && types.size > 0 && (
                <div className="calendar-dots">
                  {Array.from(types).map((type) => <i key={type} className={type} />)}
                </div>
              )}
            </Link>
          )
        })}
      </div>

      <div className="calendar-legend">
        <div><i style={{ background: 'var(--coral-bright)' }} /> Musculation</div>
        <div><i style={{ background: 'var(--cyan)' }} /> Cardio</div>
        <div><i style={{ background: 'var(--gold)' }} /> Mesures</div>
        <div><i style={{ background: 'var(--violet)' }} /> Suivi quotidien</div>
        <div><i style={{ background: 'var(--success)' }} /> Repos</div>
      </div>
    </DashboardShell>
  )
}
