import { expect, test } from '@playwright/test'
import { hashToken } from '../../lib/token'
import {
  MOT_DE_PASSE,
  emailUnique,
  inscrire,
  prisma,
  reinitialiserLimites,
  supprimerUtilisateur,
  terminerOnboarding,
} from './helpers'

const emails: string[] = []

test.beforeAll(reinitialiserLimites)
test.afterAll(async () => {
  for (const email of emails) await supprimerUtilisateur(email)
  await reinitialiserLimites()
  await prisma.$disconnect()
})

test('les pages protégées redirigent vers la connexion', async ({ page }) => {
  await page.goto('/profil')
  await expect(page).toHaveURL(/\/connexion/)
})

test('les pages légales sont lisibles sans compte', async ({ page }) => {
  await page.goto('/confidentialite')
  await expect(page).toHaveURL(/\/confidentialite$/)
  await expect(page.getByRole('heading', { name: 'Politique de confidentialité' })).toBeVisible()
  await expect(page.getByText('données de santé').first()).toBeVisible()

  await page.goto('/mentions-legales')
  await expect(page).toHaveURL(/\/mentions-legales$/)
  await expect(page.getByRole('heading', { name: 'Mentions légales' })).toBeVisible()
})

test("l'inscription exige d'accepter la politique de confidentialité", async ({ page }) => {
  await page.goto('/inscription')
  await page.getByLabel('Prénom').fill('Sans consentement')
  await page.getByLabel('E-mail').fill(emailUnique('sanscons'))
  await page.getByLabel('Mot de passe', { exact: true }).fill(MOT_DE_PASSE)
  await page.getByLabel('Confirmer le mot de passe').fill(MOT_DE_PASSE)
  await page.getByRole('button', { name: 'Créer mon compte' }).click()
  await expect(page.getByText('Tu dois accepter la politique de confidentialité')).toBeVisible()
  await expect(page).toHaveURL(/\/inscription/)
})

test('inscription, onboarding, déconnexion puis reconnexion', async ({ page }) => {
  const email = emailUnique()
  emails.push(email)

  await inscrire(page, email, 'Alice')
  await terminerOnboarding(page)
  await expect(page.getByText('Alice').first()).toBeVisible()

  await page.goto('/profil')
  await page.getByRole('button', { name: 'Se déconnecter' }).last().click()
  await page.waitForURL('**/connexion')

  await page.getByLabel('E-mail').fill(email)
  await page.getByLabel('Mot de passe').fill(MOT_DE_PASSE)
  await page.getByRole('button', { name: 'Se connecter' }).click()
  await page.waitForURL((url) => url.pathname === '/')
})

test('une inscription avec un e-mail déjà utilisé est refusée', async ({ page }) => {
  const email = emailUnique()
  emails.push(email)
  await inscrire(page, email)

  await page.context().clearCookies()
  await page.goto('/inscription')
  await page.getByLabel('Prénom').fill('Bis')
  await page.getByLabel('E-mail').fill(email)
  await page.getByLabel('Mot de passe', { exact: true }).fill(MOT_DE_PASSE)
  await page.getByLabel('Confirmer le mot de passe').fill(MOT_DE_PASSE)
  await page.getByLabel(/politique de confidentialité/).check()
  await page.getByRole('button', { name: 'Créer mon compte' }).click()
  await expect(page.getByText('Un compte existe déjà')).toBeVisible()
})

test('un mauvais mot de passe affiche une erreur', async ({ page }) => {
  const email = emailUnique()
  emails.push(email)
  await inscrire(page, email)
  await page.context().clearCookies()

  await page.goto('/connexion')
  await page.getByLabel('E-mail').fill(email)
  await page.getByLabel('Mot de passe').fill('mauvais-mot-de-passe')
  await page.getByRole('button', { name: 'Se connecter' }).click()
  await expect(page.getByText('Adresse e-mail ou mot de passe incorrect.')).toBeVisible()
})

test('la connexion est bloquée après trop de tentatives sur un même e-mail', async ({ page }) => {
  const email = emailUnique('bloque')

  for (let i = 0; i < 10; i++) {
    // Rechargement à chaque essai : le formulaire se remonte après une réponse serveur, et
    // l'ancien message d'erreur resterait sinon visible et masquerait la vraie attente.
    await page.goto('/connexion')
    await page.getByLabel('E-mail').fill(email)
    await page.getByLabel('Mot de passe').fill('mauvais')
    await page.getByRole('button', { name: 'Se connecter' }).click()
    await expect(page.getByText('Adresse e-mail ou mot de passe incorrect.')).toBeVisible()
  }

  await page.goto('/connexion')
  await page.getByLabel('E-mail').fill(email)
  await page.getByLabel('Mot de passe').fill('mauvais')
  await page.getByRole('button', { name: 'Se connecter' }).click()
  await expect(page.getByText(/Trop de tentatives/)).toBeVisible()
})

test('la réinitialisation de mot de passe fonctionne avec le jeton haché', async ({ page }) => {
  const email = emailUnique('reset')
  emails.push(email)
  await inscrire(page, email)
  await page.context().clearCookies()

  await page.goto('/mot-de-passe-oublie')
  await page.getByLabel('E-mail').fill(email)
  await page.getByRole('button', { name: 'Envoyer le lien de réinitialisation' }).click()
  await page.waitForURL(/envoye=1/)

  // Le jeton en base est un hash : on ne peut pas s'en servir directement dans le lien.
  const enBase = await prisma.verificationToken.findFirst({ where: { identifier: email } })
  expect(enBase?.token).toMatch(/^[0-9a-f]{64}$/)

  // On simule le lien reçu par e-mail : on remplace le jeton par un jeton connu (dont on stocke le hash).
  const jetonClair = 'e2e-' + 'a'.repeat(60)
  await prisma.verificationToken.update({
    where: { identifier_token: { identifier: email, token: enBase!.token } },
    data: { token: hashToken(jetonClair) },
  })

  await page.goto(`/reinitialiser-mot-de-passe?token=${jetonClair}&email=${encodeURIComponent(email)}`)
  await page.getByLabel('Nouveau mot de passe', { exact: true }).fill('Nouveau-mdp-e2e-2')
  await page.getByLabel('Confirmer le mot de passe').fill('Nouveau-mdp-e2e-2')
  await page.getByRole('button', { name: 'Choisir ce mot de passe' }).click()
  await page.waitForURL(/reinitialise=1/)

  await page.getByLabel('E-mail').fill(email)
  await page.getByLabel('Mot de passe').fill('Nouveau-mdp-e2e-2')
  await page.getByRole('button', { name: 'Se connecter' }).click()
  await page.waitForURL((url) => url.pathname === '/')
})
