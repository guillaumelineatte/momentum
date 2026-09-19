'use client'

import { useEffect } from 'react'

// Ne se déclenche que si le layout racine lui-même plante (très rare) — doit donc
// fournir son propre <html>/<body>, il remplace tout le reste de l'app.
export default function ErreurGlobale({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Erreur globale:', error)
  }, [error])

  return (
    <html lang="fr">
      <body style={{ margin: 0, background: '#1a0a0f', color: '#f8f0f0', fontFamily: 'system-ui, sans-serif' }}>
        <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, textAlign: 'center', padding: 24 }}>
          <h1 style={{ fontSize: 22, margin: 0 }}>Momentum a rencontré un problème</h1>
          <p style={{ color: '#b6a7ac', maxWidth: 360, margin: 0 }}>Recharge la page — si le problème persiste, reviens un peu plus tard.</p>
          <button
            onClick={reset}
            style={{ height: 46, padding: '0 24px', borderRadius: 12, border: 0, color: 'white', fontWeight: 600, background: 'linear-gradient(145deg, #fb7185, #be123c)' }}
          >
            Réessayer
          </button>
        </main>
      </body>
    </html>
  )
}
