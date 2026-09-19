'use client'

import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'

export default function ErreurApp({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Erreur dans (app):', error)
  }, [error])

  return (
    <main className="momentum-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <section className="content">
        <div className="stub-page">
          <div className="stub-icon"><AlertTriangle size={26} /></div>
          <h1>Un imprévu est survenu</h1>
          <p>Cette page n’a pas pu s’afficher correctement. Réessaie — si le problème persiste, reviens un peu plus tard.</p>
          <button className="form-submit" style={{ maxWidth: 220, marginTop: 10 }} onClick={reset}>
            Réessayer
          </button>
        </div>
      </section>
    </main>
  )
}
