'use client'

import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'

export default function ErreurRacine({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Erreur racine:', error)
  }, [error])

  return (
    <main className="auth-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <div className="auth-card glass-card" style={{ textAlign: 'center' }}>
        <div className="stub-icon" style={{ margin: '0 auto 16px' }}><AlertTriangle size={24} /></div>
        <h1>Un imprévu est survenu</h1>
        <p className="auth-subtitle">Cette page n’a pas pu s’afficher correctement. Réessaie dans un instant.</p>
        <button className="form-submit" onClick={reset}>Réessayer</button>
      </div>
    </main>
  )
}
