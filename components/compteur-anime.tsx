'use client'

import { useEffect, useRef } from 'react'
import { animate, useReducedMotion } from 'framer-motion'

/** Anime un nombre de 0 (ou de sa valeur précédente) jusqu'à `valeur`. Respecte
 * prefers-reduced-motion en affichant directement la valeur finale, sans transition. */
export function CompteurAnime({
  valeur,
  decimales = 0,
  suffixe = '',
  className,
}: {
  valeur: number
  decimales?: number
  suffixe?: string
  className?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const reduireMotion = useReducedMotion()
  const derniereValeur = useRef(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (reduireMotion) {
      el.textContent = valeur.toLocaleString('fr-FR', { minimumFractionDigits: decimales, maximumFractionDigits: decimales }) + suffixe
      derniereValeur.current = valeur
      return
    }

    const depart = derniereValeur.current
    const controls = animate(depart, valeur, {
      duration: 0.7,
      ease: 'easeOut',
      onUpdate(v) {
        if (el) el.textContent = v.toLocaleString('fr-FR', { minimumFractionDigits: decimales, maximumFractionDigits: decimales }) + suffixe
      },
    })
    derniereValeur.current = valeur
    return () => controls.stop()
  }, [valeur, decimales, suffixe, reduireMotion])

  // La classe "compteur-anime" force l'héritage de la taille/couleur du parent direct
  // (voir globals.css) : sans ça, un sélecteur générique du type ".truc span { font-size: 9px }"
  // ailleurs dans la page peut cibler ce <span> sans nom de classe et écraser silencieusement
  // ce qu'on voulait lui faire hériter de son parent (ex. un <strong> volontairement agrandi).
  return <span ref={ref} className={`compteur-anime${className ? ` ${className}` : ''}`}>0{suffixe}</span>
}
