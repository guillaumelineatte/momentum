import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import type { Page } from '@playwright/test'
import { hashToken } from '../../lib/token'

export const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) })

export const MOT_DE_PASSE = 'Motdepasse-e2e-1'

export function emailUnique(prefixe = 'e2e') {
  return `${prefixe}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.test`
}

export async function supprimerUtilisateur(email: string) {
  await prisma.verificationToken.deleteMany({ where: { identifier: { in: [email, `verif:${email}`] } } })
  await prisma.user.deleteMany({ where: { email } }) // cascade sur toutes les données liées
}

/** Simule le clic sur le lien reçu par e-mail (le jeton en clair n'est jamais stocké, donc inaccessible). */
export async function confirmerEmailEnBase(email: string) {
  await prisma.user.updateMany({ where: { email }, data: { emailVerified: new Date() } })
}

/** Remplace le jeton de confirmation par un jeton connu, pour tester le vrai lien de l'e-mail. */
export async function definirJetonDeConfirmation(email: string, jetonClair: string) {
  await prisma.verificationToken.updateMany({
    where: { identifier: `verif:${email}` },
    data: { token: hashToken(jetonClair), expires: new Date(Date.now() + 3600_000) },
  })
}

/** Les compteurs sont par IP : sans remise à zéro, plusieurs lancements d'affilée se bloqueraient. */
export async function reinitialiserLimites() {
  await prisma.rateLimit.deleteMany({ where: { key: { contains: '@example.test' } } })
  await prisma.rateLimit.deleteMany({ where: { key: { contains: ':ip:' } } })
}

/** Remplit et envoie le formulaire d'inscription ; l'utilisateur arrive sur la page « vérifie ta boîte mail ». */
export async function remplirInscription(page: Page, email: string, prenom = 'Testeur') {
  await page.goto('/inscription')
  await page.getByLabel('Prénom').fill(prenom)
  await page.getByLabel('E-mail').fill(email)
  await page.getByLabel('Mot de passe', { exact: true }).fill(MOT_DE_PASSE)
  await page.getByLabel('Confirmer le mot de passe').fill(MOT_DE_PASSE)
  await page.getByLabel(/politique de confidentialité/).check()
  await page.getByRole('button', { name: 'Créer mon compte' }).click()
  await page.waitForURL('**/inscription/confirmation**')
}

export async function seConnecter(page: Page, email: string, motDePasse = MOT_DE_PASSE) {
  await page.goto('/connexion')
  await page.getByLabel('E-mail').fill(email)
  await page.getByLabel('Mot de passe').fill(motDePasse)
  await page.getByRole('button', { name: 'Se connecter' }).click()
}

/** Crée un compte, confirme l'adresse en base et se connecte : l'utilisateur arrive sur l'onboarding. */
export async function inscrire(page: Page, email: string, prenom = 'Testeur') {
  await remplirInscription(page, email, prenom)
  await confirmerEmailEnBase(email)
  await seConnecter(page, email)
  await page.waitForURL('**/onboarding')
}

export async function terminerOnboarding(page: Page) {
  await page.getByLabel('Taille (cm)', { exact: true }).fill('175')
  await page.getByLabel('Poids (kg)', { exact: true }).fill('70')
  await page.getByText('Prise de muscle').click()
  await page.getByRole('button', { name: 'Commencer mon suivi' }).click()
  await page.getByRole('button', { name: 'Continuer sans' }).click() // aucune mensuration renseignée
  await page.waitForURL((url) => url.pathname === '/')
}
