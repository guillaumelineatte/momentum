import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { OnboardingForm } from './onboarding-form'

export default async function OnboardingPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/connexion')

  // Onboarding déjà fait -> pas besoin de repasser par ici.
  const profile = await prisma.profile.findUnique({ where: { userId: session.user.id } })
  if (profile) redirect('/')

  return (
    <main className="onboarding-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <div className="onboarding-card glass-card">
        <div className="auth-brand">
          <div className="brand-mark"><span>M</span></div>
          <strong>momentum</strong>
        </div>
        <h1>Bienvenue{session.user.name ? `, ${session.user.name}` : ''} 👋</h1>
        <p className="auth-subtitle">
          Ces informations forment ton point de départ — elles serviront de référence pour toutes tes comparaisons de progression. Tout est modifiable plus tard, et la plupart des champs sont optionnels.
        </p>

        <OnboardingForm />
      </div>
    </main>
  )
}
