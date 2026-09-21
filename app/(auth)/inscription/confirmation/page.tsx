import Link from 'next/link'
import { RenvoyerForm } from './renvoyer-form'
import { LiensLegaux } from '@/components/legal/liens-legaux'

export default async function ConfirmationInscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; renvoye?: string }>
}) {
  const { email, renvoye } = await searchParams

  return (
    <main className="auth-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <div className="auth-card glass-card">
        <div className="auth-brand">
          <div className="brand-mark"><span>M</span></div>
          <strong>momentum</strong>
        </div>
        <h1>Vérifie ta boîte mail</h1>
        <p className="auth-subtitle">
          {email ? <>Nous avons envoyé un lien de confirmation à <strong>{email}</strong>.</> : 'Nous avons envoyé un lien de confirmation à ton adresse.'}{' '}
          Il est valable 24 heures. Pense à regarder tes spams.
        </p>

        {renvoye && (
          <p className="form-success">
            Si un compte en attente de confirmation existe avec cette adresse, un nouveau lien vient d’être envoyé.
          </p>
        )}

        {email && <RenvoyerForm email={email} />}

        <div className="auth-links">
          <Link href="/connexion">Retour à la connexion</Link>
        </div>
        <LiensLegaux />
      </div>
    </main>
  )
}
