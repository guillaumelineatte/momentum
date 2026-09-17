import Link from 'next/link'
import { Dumbbell } from 'lucide-react'
import { ActiviteShell } from '@/components/dashboard/activite-shell'
import { formatDateParam } from '@/lib/dates'

// Le flux musculation complet (choix du type de séance, bibliothèque d'exercices,
// chronomètre, séries avec RPE, minuteur de repos, records...) est le cœur de la
// Phase 4 — volontairement pas construit ici pour éviter de le refaire deux fois.
export default async function NouvelleMusculationPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>
}) {
  const { date } = await searchParams
  const dateValue = date ?? formatDateParam(new Date())

  return (
    <ActiviteShell date={dateValue} titre="Musculation">
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <div className="checkbox-card" style={{ display: 'inline-flex', width: 56, height: 56, borderRadius: '50%', margin: '0 auto 18px', color: 'var(--coral-bright)' }}>
          <Dumbbell size={24} style={{ margin: 'auto' }} />
        </div>
        <p className="auth-subtitle" style={{ marginBottom: 22 }}>
          Le suivi détaillé des séances de musculation (bibliothèque d'exercices, séries, charges, minuteur de repos, records) arrive dans la prochaine phase.
        </p>
        <Link href={`/?date=${dateValue}`} className="form-submit" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', maxWidth: 260 }}>
          Retour à ta journée
        </Link>
      </div>
    </ActiviteShell>
  )
}
