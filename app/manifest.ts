import type { MetadataRoute } from 'next'

// PWA manifest — Next.js le sert automatiquement sur /manifest.webmanifest
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Momentum — ton rythme. ta progression.',
    short_name: 'Momentum',
    description: 'Le suivi sportif quotidien qui transforme la régularité en progression.',
    start_url: '/',
    display: 'standalone',
    background_color: '#1a0a0f',
    theme_color: '#1a0a0f',
    orientation: 'portrait',
    lang: 'fr',
    icons: [
      {
        src: '/icon-light-32x32.png',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  }
}
