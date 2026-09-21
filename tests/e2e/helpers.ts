import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import type { Page } from '@playwright/test'

export const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) })

export const MOT_DE_PASSE = 'Motdepasse-e2e-1'

export function emailUnique(prefixe = 'e2e') {
  return `${prefixe}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.test`
}

export async function supprimerUtilisateur(email: string) {
  await prisma.user.deleteMany({ where: { email } }) // cascade sur toutes les données liées
}

/** Les compteurs sont par IP : sans remise à zéro, plusieurs lancements d'affilée se bloqueraient. */
export async function reinitialiserLimites() {
  await prisma.rateLimit.deleteMany({ where: { key: { contains: '@example.test' } } })
  await prisma.rateLimit.deleteMany({ where: { key: { contains: ':ip:' } } })
}

export async function inscrire(page: Page, email: string, prenom = 'Testeur') {
  await page.goto('/inscription')
  await page.getByLabel('Prénom').fill(prenom)
  await page.getByLabel('E-mail').fill(email)
  await page.getByLabel('Mot de passe', { exact: true }).fill(MOT_DE_PASSE)
  await page.getByLabel('Confirmer le mot de passe').fill(MOT_DE_PASSE)
  await page.getByLabel(/politique de confidentialité/).check()
  await page.getByRole('button', { name: 'Créer mon compte' }).click()
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
