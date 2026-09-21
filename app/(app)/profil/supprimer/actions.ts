'use server'

import { redirect } from 'next/navigation'
import { auth, signOut } from '@/auth'
import { prisma } from '@/lib/prisma'
import { verifyPassword } from '@/lib/password'
import { supprimerCompte } from '@/lib/data/compte'
import { consommerTentative, messageAttente } from '@/lib/rate-limit'
import type { ActionState } from '@/app/(auth)/actions'

export async function supprimerCompteAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  // Une suppression est définitive : on revérifie la session ET le mot de passe (ré-authentification).
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) redirect('/connexion')

  const limite = await consommerTentative(`suppression:user:${userId}`, { max: 5, fenetreSecondes: 15 * 60 })
  if (!limite.autorise) return { error: messageAttente(limite.reessayerDansSecondes) }

  if (formData.get('confirmation') !== 'on') return { error: 'Coche la case pour confirmer la suppression.' }

  const motDePasse = String(formData.get('password') ?? '')
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user?.passwordHash || !user.email || !(await verifyPassword(motDePasse, user.passwordHash))) {
    return { error: 'Mot de passe incorrect.' }
  }

  await supprimerCompte(user.id, user.email)
  await signOut({ redirectTo: '/connexion?supprime=1' })
}
