import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { OnboardingForm } from './onboarding-form'
import { LiensLegaux } from '@/components/legal/liens-legaux'

export default async function OnboardingPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/connexion')

  // Session valide mais utilisateur supprimé en base (ex. reset de la base) -> on
  // nettoie la session au lieu de planter plus loin sur une contrainte de clé
  // étrangère lors de la soumission du formulaire.
  const utilisateur = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { profile: true },
  })
  if (!utilisateur) redirect('/api/nettoyer-session')

  // Onboarding déjà fait -> pas besoin de repasser par ici.
  if (utilisateur.profile) redirect('/')

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
        <LiensLegaux />
      </div>
    </main>
  )
}
