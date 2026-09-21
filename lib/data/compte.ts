import { prisma } from '@/lib/prisma'

/**
 * Supprime définitivement un compte et toutes les données qui s'y rattachent.
 *
 * Les séances sont supprimées explicitement avant l'utilisateur : leurs séries référencent des
 * exercices (parfois personnels, donc eux aussi supprimés en cascade) sans règle de suppression,
 * et PostgreSQL refuserait de supprimer un exercice encore utilisé selon l'ordre de la cascade.
 * Le reste (profil, cardio, mesures, suivi, repos, objectifs, badges, comptes liés) part en cascade.
 * Tout se fait dans une transaction : le compte est supprimé en entier ou pas du tout.
 */
export async function supprimerCompte(userId: string, email: string): Promise<void> {
  await prisma.$transaction([
    prisma.verificationToken.deleteMany({ where: { identifier: { in: [email, `verif:${email}`] } } }),
    // Compteurs de sécurité qui contiennent l'adresse e-mail (les clés ne stockent que l'e-mail en minuscules).
    prisma.rateLimit.deleteMany({ where: { key: { contains: `:email:${email.toLowerCase()}` } } }),
    prisma.workoutSession.deleteMany({ where: { userId } }),
    prisma.user.delete({ where: { id: userId } }),
  ])
}
