import Link from 'next/link'
import { CalendarDays, ChevronLeft } from 'lucide-react'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getMemeSeancePrecedente } from '@/lib/data/comparaison'
import { parseDateParam, formatDateParam, subDays, labelJourLong, isSameDay } from '@/lib/dates'
import { LiensLegaux } from '@/components/legal/liens-legaux'

export default async function ComparerPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/connexion')
  const userId = session.user.id

  const { date } = await searchParams
  const dateApres = parseDateParam(date)
  const dateApresParam = formatDateParam(dateApres)

  const [profile, memeSeance] = await Promise.all([
    prisma.profile.findUnique({ where: { userId } }),
    getMemeSeancePrecedente(userId, dateApres),
  ])

  const septJours = subDays(dateApres, 7)
  const trenteJours = subDays(dateApres, 30)
  const pointDepart = profile?.dateDepart

  const raccourcis = [
    {
      label: 'Point de départ',
      description: pointDepart ? labelJourLong(pointDepart) : undefined,
      date: pointDepart,
    },
    { label: 'Il y a 7 jours', description: labelJourLong(septJours), date: septJours },
    { label: 'Il y a 30 jours', description: labelJourLong(trenteJours), date: trenteJours },
    {
      label: 'Même séance précédente',
      description: memeSeance ? labelJourLong(memeSeance) : 'Aucune séance similaire trouvée',
      date: memeSeance,
    },
  ]

  return (
    <main className="onboarding-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <div className="onboarding-card glass-card">
        <Link href={`/?date=${dateApresParam}`} className="auth-links" style={{ marginBottom: 18, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <ChevronLeft size={15} /> Retour à {labelJourLong(dateApres)}
        </Link>
        <h1>Comparer avec…</h1>
        <p className="auth-subtitle">Choisis un jour antérieur pour voir ta progression depuis {labelJourLong(dateApres)}.</p>

        <div className="compare-shortcuts">
          {raccourcis.map((r) => {
            const desactive = !r.date || isSameDay(r.date, dateApres)
            const href = r.date ? `/comparer/resultat?apres=${dateApresParam}&avant=${formatDateParam(r.date)}` : '#'
            return desactive ? (
              <button key={r.label} className="compare-shortcut" disabled>
                <strong>{r.label}</strong>
                <span>{r.description ?? 'Non disponible'}</span>
              </button>
            ) : (
              <Link key={r.label} href={href} className="compare-shortcut">
                <strong>{r.label}</strong>
                <span>{r.description}</span>
              </Link>
            )
          })}
        </div>

        <Link href={`/calendrier?pour=comparer&apres=${dateApresParam}`} className="compare-calendrier-link">
          <CalendarDays size={16} /> Choisir un autre jour dans le calendrier
        </Link>

        <LiensLegaux />
      </div>
    </main>
  )
}
