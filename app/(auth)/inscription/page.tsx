import Link from 'next/link'
import { LiensLegaux } from '@/components/legal/liens-legaux'
import { InscriptionForm } from './inscription-form'

export default function InscriptionPage() {
  return (
    <main className="auth-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <div className="auth-card glass-card">
        <div className="auth-brand">
          <div className="brand-mark"><span>M</span></div>
          <strong>momentum</strong>
        </div>
        <h1>Crée ton compte</h1>
        <p className="auth-subtitle">Quelques secondes suffisent. Tu personnaliseras ton profil juste après.</p>

        <InscriptionForm />

        <div className="auth-links">
          <span>Déjà un compte ? <Link href="/connexion">Se connecter</Link></span>
        </div>
        <LiensLegaux />
      </div>
    </main>
  )
}
