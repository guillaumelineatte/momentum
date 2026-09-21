import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { getExercicesAvecHistorique } from '@/lib/data/progression'
import { NouvelObjectifForm } from './nouvel-objectif-form'
import { LiensLegaux } from '@/components/legal/liens-legaux'

export default async function NouvelObjectifPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/connexion')

  const exercices = await getExercicesAvecHistorique(session.user.id)

  return (
    <main className="onboarding-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <div className="onboarding-card glass-card">
        <Link href="/progression" className="auth-links" style={{ marginBottom: 18, display: 'inline-flex', alignItems: 'center', gap: 6, width: 'fit-content' }}>
          <ChevronLeft size={15} /> Retour à ta progression
        </Link>
        <h1>Nouvel objectif</h1>
        <p className="auth-subtitle">Fixe-toi une cible claire — on calcule la progression depuis maintenant.</p>
        <NouvelObjectifForm exercices={exercices} />
        <LiensLegaux />
      </div>
    </main>
  )
}
