import { expect, test } from '@playwright/test'
import { MOT_DE_PASSE, emailUnique, inscrire, prisma, reinitialiserLimites, seConnecter, supprimerUtilisateur, terminerOnboarding } from './helpers'

const emails: string[] = []

test.beforeAll(reinitialiserLimites)
test.afterAll(async () => {
  for (const email of emails) await supprimerUtilisateur(email)
  await reinitialiserLimites()
  await prisma.$disconnect()
})

async function compteAvecOnboarding(page: import('@playwright/test').Page, prefixe: string, prenom: string) {
  const email = emailUnique(prefixe)
  emails.push(email)
  await inscrire(page, email, prenom)
  await terminerOnboarding(page)
  return email
}

test('l’export de mes données est un fichier JSON, réservé à mon compte et sans secret', async ({ page, browser }) => {
  const email = await compteAvecOnboarding(page, 'export', 'Exportée')

  await page.goto('/profil')
  await expect(page.getByRole('link', { name: /Exporter mes données/ })).toBeVisible()

  const reponse = await page.request.get('/api/export')
  expect(reponse.status()).toBe(200)
  expect(reponse.headers()['content-disposition']).toMatch(/^attachment; filename="momentum-donnees-\d{4}-\d{2}-\d{2}\.json"$/)
  expect(reponse.headers()['cache-control']).toBe('no-store')

  const donnees = await reponse.json()
  expect(donnees.compte.email).toBe(email)
  expect(donnees.compte.prenom).toBe('Exportée')
  expect(donnees.profil.tailleCm).toBe(175)
  expect(donnees.compte.consentementLe).toBeTruthy()
  expect(JSON.stringify(donnees)).not.toMatch(/passwordHash|\$2[aby]\$/)

  // Sans session : refusé.
  const anonyme = await browser.newContext()
  const refus = await anonyme.request.get('http://localhost:3100/api/export')
  expect(refus.status()).toBe(401)
  await anonyme.close()
})

test('la suppression du compte exige le mot de passe et une confirmation, puis efface tout', async ({ page }) => {
  const email = await compteAvecOnboarding(page, 'suppr', 'Supprimée')
  const user = await prisma.user.findUniqueOrThrow({ where: { email } })
  expect(await prisma.profile.count({ where: { userId: user.id } })).toBe(1)

  await page.goto('/profil')
  await page.getByRole('link', { name: /Supprimer mon compte/ }).click()
  await expect(page.getByRole('heading', { name: 'Supprimer mon compte' })).toBeVisible()

  // Sans confirmation : refusé.
  await page.getByLabel('Ton mot de passe').fill(MOT_DE_PASSE)
  await page.getByRole('button', { name: 'Supprimer définitivement mon compte' }).click()
  await expect(page.getByText('Coche la case pour confirmer')).toBeVisible()

  // Mauvais mot de passe : refusé, rien n'est supprimé.
  await page.getByLabel('Ton mot de passe').fill('mauvais-mot-de-passe')
  await page.getByLabel(/suppression est immédiate/).check()
  await page.getByRole('button', { name: 'Supprimer définitivement mon compte' }).click()
  await expect(page.getByText('Mot de passe incorrect.')).toBeVisible()
  expect(await prisma.user.count({ where: { id: user.id } })).toBe(1)

  // Bon mot de passe : compte effacé, session fermée, retour à la connexion.
  await page.getByLabel('Ton mot de passe').fill(MOT_DE_PASSE)
  await page.getByLabel(/suppression est immédiate/).check()
  await page.getByRole('button', { name: 'Supprimer définitivement mon compte' }).click()
  await page.waitForURL(/\/connexion\?supprime=1/)
  await expect(page.getByText('Ton compte et toutes tes données ont été supprimés.')).toBeVisible()

  expect(await prisma.user.count({ where: { id: user.id } })).toBe(0)
  expect(await prisma.profile.count({ where: { userId: user.id } })).toBe(0)

  // Plus de session, plus de connexion possible avec ces identifiants.
  await page.goto('/profil')
  await expect(page).toHaveURL(/\/connexion/)
  await seConnecter(page, email)
  await expect(page.getByText('Adresse e-mail ou mot de passe incorrect.')).toBeVisible()
})

test('la page de suppression est inaccessible sans être connecté', async ({ page }) => {
  await page.goto('/profil/supprimer')
  await expect(page).toHaveURL(/\/connexion/)
})
