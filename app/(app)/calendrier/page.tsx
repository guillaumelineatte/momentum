import Link from 'next/link'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
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
  labelJourLong,
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
  searchParams: Promise<{ mois?: string; date?: string; pour?: string; apres?: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/connexion')

  const { mois, date, pour, apres } = await searchParams
  const modeComparaison = pour === 'comparer' && !!apres
  const dateApres = apres ? parseDateParam(apres) : undefined

  const moisCourant = parseMoisParam(mois ?? (dateApres ? formatMoisParam(dateApres) : undefined))
  const jourSelectionne = date ? parseDateParam(date) : undefined
  const grille = grilleMoisDe(moisCourant)
  const [activites, profile, streak] = await Promise.all([
    getActivitesParJour(session.user.id, grille),
    prisma.profile.findUnique({ where: { userId: session.user.id } }),
    getStreak(session.user.id),
  ])

  const moisPrecedentParam = formatMoisParam(moisPrecedent(moisCourant))
  const moisSuivantParam = formatMoisParam(moisSuivant(moisCourant))
  const suffixeMode = modeComparaison ? `&pour=comparer&apres=${apres}` : ''

  return (
    <DashboardShell prenom={profile?.prenom ?? session.user.name ?? ''} pageActive="Calendrier" streak={streak}>
      {modeComparaison && dateApres && (
        <div className="streak-pill compact" style={{ margin: '20px 0 0', width: 'fit-content' }}>
          <div><strong>Choisis un jour à comparer avec {labelJourLong(dateApres)}</strong></div>
          <Link href={`/comparer?date=${apres}`} aria-label="Annuler la comparaison"><X size={14} /></Link>
        </div>
      )}

      <div className="calendar-page-header">
        <div>
          <p className="eyebrow">CALENDRIER</p>
          <h1>{labelMois(moisCourant)}</h1>
        </div>
        <div className="calendar-nav">
          <Link href={`/calendrier?mois=${moisPrecedentParam}${suffixeMode}`} className="circle-arrow" aria-label="Mois précédent"><ChevronLeft size={18} /></Link>
          <Link href={`/calendrier?mois=${formatMoisParam(new Date())}${suffixeMode}`} className="calendar-button"><span>Aujourd’hui</span></Link>
          <Link href={`/calendrier?mois=${moisSuivantParam}${suffixeMode}`} className="circle-arrow" aria-label="Mois suivant"><ChevronRight size={18} /></Link>
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
          const indisponible = modeComparaison && dateApres && (jour >= dateApres)

          const contenu = (
            <>
              <span>{jour.getDate()}</span>
              {types && types.size > 0 && (
                <div className="calendar-dots">
                  {Array.from(types).map((type) => <i key={type} className={type} />)}
                </div>
              )}
            </>
          )
          const classes = `calendar-cell${horsMois ? ' hors-mois' : ''}${estAujourdhui ? ' aujourdhui' : ''}${estSelectionne ? ' selectionne' : ''}${indisponible ? ' hors-mois' : ''}`

          if (indisponible) {
            return <span key={cle} className={classes} style={{ cursor: 'default' }}>{contenu}</span>
          }

          const href = modeComparaison ? `/comparer/resultat?apres=${apres}&avant=${cle}` : `/?date=${cle}`
          return (
            <Link key={cle} href={href} className={classes}>
              {contenu}
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
