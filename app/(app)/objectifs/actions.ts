'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { creerObjectifSchema } from '@/lib/validations/objectifs'
import { getValeurActuelle, TYPES_OBJECTIF } from '@/lib/data/objectifs'
import type { ActionState } from '@/app/(auth)/actions'

async function requireUserId() {
  const session = await auth()
  if (!session?.user?.id) redirect('/connexion')
  return session.user.id
}

export async function creerObjectifAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const userId = await requireUserId()
  const parsed = creerObjectifSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const champ = issue.path[0]
      if (typeof champ === 'string' && !fieldErrors[champ]) fieldErrors[champ] = issue.message
    }
    return { fieldErrors }
  }

  const { type, titre, valeurCible, exerciceId } = parsed.data
  const unite = TYPES_OBJECTIF.find((t) => t.value === type)?.unite ?? ''
  const valeurDepart = await getValeurActuelle(userId, type, exerciceId)

  await prisma.goal.create({
    data: { userId, type: type as never, titre, valeurCible, unite, exerciceId, valeurDepart },
  })

  revalidatePath('/progression')
  redirect('/progression')
}

export async function supprimerObjectifAction(id: string) {
  const userId = await requireUserId()
  const objectif = await prisma.goal.findUnique({ where: { id } })
  if (!objectif || objectif.userId !== userId) throw new Error("Cet objectif n'existe pas ou ne t'appartient pas.")

  await prisma.goal.delete({ where: { id } })
  revalidatePath('/progression')
}
