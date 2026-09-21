import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { ModifierProfilForm } from './modifier-profil-form'
import { LiensLegaux } from '@/components/legal/liens-legaux'

export default async function ModifierProfilPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/connexion')

  const profile = await prisma.profile.findUnique({ where: { userId: session.user.id } })
  if (!profile) redirect('/onboarding')

  return (
    <main className="onboarding-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <div className="onboarding-card glass-card">
        <Link href="/profil" className="auth-links" style={{ marginBottom: 18, display: 'inline-flex', alignItems: 'center', gap: 6, width: 'fit-content' }}>
          <ChevronLeft size={15} /> Retour au profil
        </Link>
        <h1>Modifier ton profil</h1>
        <p className="auth-subtitle">
          Ton point de départ (poids, mensurations initiales) reste figé comme référence pour tes comparaisons — seules tes informations générales sont modifiables ici.
        </p>
        <ModifierProfilForm
          valeursInitiales={{
            prenom: profile.prenom,
            tailleCm: profile.tailleCm != null ? String(profile.tailleCm) : '',
            dateNaissance: profile.dateNaissance ? profile.dateNaissance.toISOString().slice(0, 10) : '',
            objectifs: profile.objectifs,
          }}
        />
        <LiensLegaux />
      </div>
    </main>
  )
}
