import { expect, test } from '@playwright/test'
import { hashToken } from '../../lib/token'
import {
  MOT_DE_PASSE,
  definirJetonDeConfirmation,
  emailUnique,
  inscrire,
  remplirInscription,
  seConnecter,
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
  await expect(page.getByText('Guillaume Linéatte').first()).toBeVisible()
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

test("la confirmation de l'adresse e-mail est exigée avant la première connexion", async ({ page }) => {
  const email = emailUnique('verif')
  emails.push(email)
  await remplirInscription(page, email, 'Vérif')

  // La page explique quoi faire, et le jeton en base est bien une empreinte (jamais le lien en clair).
  await expect(page.getByRole('heading', { name: 'Vérifie ta boîte mail' })).toBeVisible()
  await expect(page.getByText(email)).toBeVisible()
  const enBase = await prisma.verificationToken.findFirst({ where: { identifier: `verif:${email}` } })
  expect(enBase?.token).toMatch(/^[0-9a-f]{64}$/)
  expect((await prisma.user.findUniqueOrThrow({ where: { email } })).emailVerified).toBeNull()

  // Connexion refusée tant que l'adresse n'est pas confirmée (mot de passe pourtant correct).
  await seConnecter(page, email)
  await expect(page.getByText('Confirme d’abord ton adresse e-mail')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Renvoyer l’e-mail de confirmation' })).toBeVisible()

  // Un mauvais mot de passe ne révèle rien : même message que pour un compte inexistant.
  await seConnecter(page, email, 'mauvais-mot-de-passe')
  await expect(page.getByText('Adresse e-mail ou mot de passe incorrect.')).toBeVisible()

  // Le lien de l'e-mail : un bouton de confirmation, puis retour à la connexion.
  const jeton = 'e2e-confirm-' + 'b'.repeat(52)
  await definirJetonDeConfirmation(email, jeton)
  await page.goto(`/verifier-email?token=${jeton}&email=${encodeURIComponent(email)}`)
  await page.getByRole('button', { name: 'Confirmer mon adresse' }).click()
  await page.waitForURL(/\/connexion\?verifie=1/)
  await expect(page.getByText('Adresse confirmée')).toBeVisible()

  await seConnecter(page, email)
  await page.waitForURL('**/onboarding')

  // Le jeton est à usage unique.
  expect(await prisma.verificationToken.count({ where: { identifier: `verif:${email}` } })).toBe(0)
})

test('un lien de confirmation invalide propose d’en recevoir un nouveau', async ({ page }) => {
  await page.goto('/verifier-email?token=faux&email=personne%40example.test')
  await page.getByRole('button', { name: 'Confirmer mon adresse' }).click()
  await expect(page.getByText('Ce lien a expiré ou n’est plus valable')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Recevoir un nouveau lien' })).toBeVisible()

  await page.goto('/verifier-email') // lien incomplet
  await expect(page.getByText('Ce lien est incomplet')).toBeVisible()
})

test('le renvoi de l’e-mail de confirmation remplace le lien précédent', async ({ page }) => {
  const email = emailUnique('renvoi')
  emails.push(email)
  await remplirInscription(page, email)
  const avant = await prisma.verificationToken.findFirstOrThrow({ where: { identifier: `verif:${email}` } })

  await page.getByRole('button', { name: 'Renvoyer l’e-mail' }).click()
  await expect(page.getByText('un nouveau lien vient d’être envoyé')).toBeVisible()

  const lignes = await prisma.verificationToken.findMany({ where: { identifier: `verif:${email}` } })
  expect(lignes).toHaveLength(1)
  expect(lignes[0].token).not.toBe(avant.token)
})
