import NextAuth from 'next-auth'
import { authConfig } from './auth.config'

// Proxy edge-safe (anciennement "middleware") : ne fait que vérifier la présence
// d'une session valide (callbacks.authorized dans auth.config.ts). La vérification
// de l'onboarding (Profile existant) se fait plus loin, dans le layout du groupe
// (app), car elle nécessite une requête Prisma qui ne peut pas tourner en edge runtime.
const { auth } = NextAuth(authConfig)

export function proxy(...args: Parameters<typeof auth>) {
  return auth(...args)
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.(?:png|jpg|jpeg|svg|ico|webmanifest)$).*)'],
}
