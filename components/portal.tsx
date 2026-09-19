'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

/**
 * Échappe toujours au DOM courant pour rendre directement dans `document.body`.
 *
 * Nécessaire pour toute modale en `position: fixed` : un ancêtre avec `backdrop-filter`
 * (ex. `.glass-card`) crée un nouveau "containing block" CSS pour ses descendants fixed/
 * absolute (même comportement que `filter` ou `transform`) — sans Portal, une modale
 * ouverte depuis un composant niché dans une `.glass-card` se positionne par rapport à
 * cette carte au lieu du viewport entier, au lieu de couvrir tout l'écran.
 */
export function Portal({ children }: { children: React.ReactNode }) {
  const [monte, setMonte] = useState(false)
  useEffect(() => setMonte(true), [])
  if (!monte) return null
  return createPortal(children, document.body)
}
