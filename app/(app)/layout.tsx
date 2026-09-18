import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { RouterCacheBuster } from '@/components/router-cache-buster'

// Garde-fou serveur pour toutes les pages authentifiées de l'app (Aujourd'hui,
// Calendrier, Progression, Profil...). Le middleware garantit déjà la présence
// d'une session ; ici on vérifie en plus que l'onboarding a été complété,
// ce qui nécessite Prisma et ne peut donc pas se faire en edge runtime.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user?.id) redirect('/connexion')

  const profile = await prisma.profile.findUnique({ where: { userId: session.user.id } })
  if (!profile) redirect('/onboarding')

  return (
    <>
      <RouterCacheBuster />
      {children}
    </>
  )
}
