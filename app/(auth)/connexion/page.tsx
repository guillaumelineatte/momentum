import Link from 'next/link'
import { LiensLegaux } from '@/components/legal/liens-legaux'
import { ConnexionForm } from './connexion-form'

export default async function ConnexionPage({
  searchParams,
}: {
  searchParams: Promise<{ reinitialise?: string; verifie?: string; supprime?: string }>
}) {
  const { reinitialise, verifie, supprime } = await searchParams

  return (
    <main className="auth-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <div className="auth-card glass-card">
        <div className="auth-brand">
          <div className="brand-mark"><span>M</span></div>
          <strong>momentum</strong>
        </div>
        <h1>Content de te revoir</h1>
        <p className="auth-subtitle">Connecte-toi pour retrouver ton rythme.</p>

        {reinitialise && (
          <p className="form-success">Mot de passe mis à jour. Connecte-toi avec ton nouveau mot de passe.</p>
        )}

        {verifie && <p className="form-success">Adresse confirmée. Tu peux maintenant te connecter.</p>}
        {supprime && <p className="form-success">Ton compte et toutes tes données ont été supprimés.</p>}

        <ConnexionForm />

        <div className="auth-links">
          <Link href="/mot-de-passe-oublie">Mot de passe oublié ?</Link>
          <span>Pas encore de compte ? <Link href="/inscription">Créer un compte</Link></span>
        </div>
        <LiensLegaux />
      </div>
    </main>
  )
}
