import Link from 'next/link'
import { ReinitialiserForm } from './reinitialiser-form'

export default async function ReinitialiserMotDePassePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; email?: string }>
}) {
  const { token, email } = await searchParams

  const lienInvalide = !token || !email

  return (
    <main className="auth-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <div className="auth-card glass-card">
        <div className="auth-brand">
          <div className="brand-mark"><span>M</span></div>
          <strong>momentum</strong>
        </div>
        <h1>Nouveau mot de passe</h1>
        <p className="auth-subtitle">Choisis un mot de passe pour {email ?? 'ton compte'}.</p>

        {lienInvalide ? (
          <p className="form-error">Ce lien est invalide. Refais une demande de réinitialisation.</p>
        ) : (
          <ReinitialiserForm token={token} email={email} />
        )}

        <div className="auth-links">
          <Link href="/mot-de-passe-oublie">Renvoyer un lien</Link>
        </div>
      </div>
    </main>
  )
}
