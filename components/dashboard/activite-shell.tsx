import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { labelJourLong, parseDateParam } from '@/lib/dates'

export function ActiviteShell({
  date,
  titre,
  sousTitre,
  children,
}: {
  date: string
  titre: string
  sousTitre?: string
  children: React.ReactNode
}) {
  const jourLabel = labelJourLong(parseDateParam(date))

  return (
    <main className="onboarding-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <div className="onboarding-card glass-card">
        <Link href={`/?date=${date}`} className="auth-links" style={{ marginBottom: 18, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <ArrowLeft size={15} /> Retour à {jourLabel}
        </Link>
        <h1>{titre}</h1>
        {sousTitre && <p className="auth-subtitle">{sousTitre}</p>}
        {children}
      </div>
    </main>
  )
}
