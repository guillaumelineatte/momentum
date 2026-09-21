import Link from 'next/link'
import { ConfirmerForm } from './confirmer-form'
import { LiensLegaux } from '@/components/legal/liens-legaux'

// La confirmation est un bouton (requête POST) et non l'ouverture directe du lien : les antivirus et
// les messageries ouvrent parfois les liens d'un e-mail à l'avance, ce qui consommerait le jeton.
export default async function VerifierEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; email?: string }>
}) {
  const { token, email } = await searchParams

  return (
    <main className="auth-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <div className="auth-card glass-card">
        <div className="auth-brand">
          <div className="brand-mark"><span>M</span></div>
          <strong>momentum</strong>
        </div>
        <h1>Confirme ton adresse</h1>

        {token && email ? (
          <>
            <p className="auth-subtitle">Un dernier clic pour activer ton compte.</p>
            <ConfirmerForm email={email} token={token} />
          </>
        ) : (
          <p className="form-error" role="alert">Ce lien est incomplet. Utilise le lien reçu par e-mail.</p>
        )}

        <div className="auth-links">
          <Link href="/connexion">Retour à la connexion</Link>
        </div>
        <LiensLegaux />
      </div>
    </main>
  )
}
