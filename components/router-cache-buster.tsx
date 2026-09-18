'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Next.js restaure toujours un instantané mis en cache lors d'une navigation
 * retour/avant du navigateur (comportement volontaire, non désactivable via
 * `staleTimes`, pour préserver la position de scroll) — voir
 * https://nextjs.org/docs/app/api-reference/config/next-config-js/staleTimes
 *
 * Sur des pages mutées très souvent (ajout/suppression d'activités), ça peut
 * afficher un contenu périmé (ex. une carte qui semble avoir disparu). On force
 * un rafraîchissement des données serveur à chaque navigation historique.
 */
export function RouterCacheBuster() {
  const router = useRouter()

  useEffect(() => {
    function onPopState() {
      router.refresh()
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [router])

  return null
}
