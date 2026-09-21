import Link from 'next/link'
import { MotDePasseOublieForm } from './mot-de-passe-oublie-form'
import { LiensLegaux } from '@/components/legal/liens-legaux'

export default async function MotDePasseOubliePage({
  searchParams,
}: {
  searchParams: Promise<{ envoye?: string }>
}) {
  const { envoye } = await searchParams

  return (
    <main className="auth-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <div className="auth-card glass-card">
        <div className="auth-brand">
          <div className="brand-mark"><span>M</span></div>
          <strong>momentum</strong>
        </div>
        <h1>Mot de passe oublié</h1>
        <p className="auth-subtitle">On t’envoie un lien pour en choisir un nouveau.</p>

        {envoye ? (
          <p className="form-success">
            Si un compte existe avec cet e-mail, un lien de réinitialisation vient d’être envoyé. Vérifie ta boîte de réception (et tes spams).
          </p>
        ) : (
          <MotDePasseOublieForm />
        )}

        <div className="auth-links">
          <Link href="/connexion">Retour à la connexion</Link>
        </div>
        <LiensLegaux />
      </div>
    </main>
  )
}
