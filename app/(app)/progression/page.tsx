import { BarChart3 } from 'lucide-react'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getStreak } from '@/lib/data/jour'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'

export default async function ProgressionPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/connexion')

  const [profile, streak] = await Promise.all([
    prisma.profile.findUnique({ where: { userId: session.user.id } }),
    getStreak(session.user.id),
  ])

  return (
    <DashboardShell prenom={profile?.prenom ?? session.user.name ?? ''} pageActive="Progression" streak={streak}>
      <div className="stub-page">
        <div className="stub-icon"><BarChart3 size={26} /></div>
        <h1>Tes graphiques de progression arrivent bientôt</h1>
        <p>
          Poids, mensurations, charges et volumes par exercice, allure moyenne, kilométrage
          hebdomadaire, objectifs et badges — tout sera visualisable ici dès que tu auras
          quelques entrées enregistrées.
        </p>
      </div>
    </DashboardShell>
  )
}
