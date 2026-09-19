'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { modifierProfilSchema } from '@/lib/validations/profil'
import type { ActionState } from '@/app/(auth)/actions'

export async function modifierProfilAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth()
  if (!session?.user?.id) redirect('/connexion')
  const userId = session.user.id

  const raw = Object.fromEntries(formData)
  const objectifsSoumis = formData.getAll('objectifs').map(String)
  const parsed = modifierProfilSchema.safeParse({ ...raw, objectifs: objectifsSoumis })

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const champ = issue.path[0]
      if (typeof champ === 'string' && !fieldErrors[champ]) fieldErrors[champ] = issue.message
    }
    const values: Record<string, string> = {}
    for (const champ of ['prenom', 'tailleCm', 'dateNaissance'] as const) {
      if (!fieldErrors[champ]) values[champ] = String(raw[champ] ?? '')
    }
    return { fieldErrors, values, arrayValues: { objectifs: objectifsSoumis } }
  }

  const { prenom, tailleCm, dateNaissance, objectifs } = parsed.data

  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { name: prenom } }),
    prisma.profile.update({
      where: { userId },
      data: {
        prenom,
        tailleCm,
        dateNaissance: dateNaissance ? new Date(dateNaissance) : null,
        objectifs: objectifs as never,
      },
    }),
  ])

  revalidatePath('/profil')
  redirect('/profil')
}
