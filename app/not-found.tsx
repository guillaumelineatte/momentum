import Link from 'next/link'
import { Compass } from 'lucide-react'

export default function NonTrouve() {
  return (
    <main className="auth-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <div className="auth-card glass-card" style={{ textAlign: 'center' }}>
        <div className="stub-icon" style={{ margin: '0 auto 16px' }}><Compass size={24} /></div>
        <h1>Page introuvable</h1>
        <p className="auth-subtitle">Cette page n’existe pas ou a été déplacée.</p>
        <Link href="/" className="form-submit" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          Retour à l’accueil
        </Link>
      </div>
    </main>
  )
}
