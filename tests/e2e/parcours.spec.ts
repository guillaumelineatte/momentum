import { expect, test, type Page } from '@playwright/test'
import { emailUnique, inscrire, prisma, reinitialiserLimites, supprimerUtilisateur, terminerOnboarding } from './helpers'

const BASE_URL = 'http://localhost:3100'

// Un seul compte pour tous les parcours (l'inscription et l'onboarding sont déjà testés à part) :
// les tests s'exécutent dans l'ordre et s'appuient sur les données créées par les précédents.
test.describe.serial('fonctions de l’application', () => {
  let page: Page
  let email: string
  let userId: string

  test.beforeAll(async ({ browser }) => {
    await reinitialiserLimites()
    email = emailUnique('parcours')
    page = await browser.newPage({ baseURL: BASE_URL })
    await inscrire(page, email, 'Parcours')
    await terminerOnboarding(page)
    userId = (await prisma.user.findUniqueOrThrow({ where: { email } })).id
  })

  test.afterAll(async () => {
    await page.close()
    await supprimerUtilisateur(email)
    await reinitialiserLimites()
    await prisma.$disconnect()
  })

  test('séance de musculation complète : choisir, ajouter des séries, terminer, récapitulatif', async () => {
    await page.goto('/activites/musculation/nouvelle')
    await page.getByRole('button', { name: 'Push', exact: true }).click()
    await page.getByRole('button', { name: 'Démarrer la séance' }).click()
    await page.waitForURL(/\/activites\/musculation\/[^/]+$/)

    // « Terminer » est inactif tant qu'aucune série n'est validée.
    await expect(page.getByRole('button', { name: 'Terminer' })).toBeDisabled()

    await page.getByRole('button', { name: /Ajouter un exercice/ }).click()
    await page.getByPlaceholder('Rechercher un exercice…').fill('Développé couché barre')
    await page.getByRole('button', { name: /Développé couché barre/ }).first().click()

    await page.getByRole('button', { name: 'Plus de charge' }).click() // +2,5 kg sur la charge de départ
    await page.getByRole('button', { name: 'Valider la série 1' }).click()
    await expect(page.getByRole('button', { name: 'Valider la série 2' })).toBeVisible()
    await page.getByRole('button', { name: 'Valider la série 2' }).click()
    await expect(page.getByRole('button', { name: 'Valider la série 3' })).toBeVisible()

    await page.getByRole('button', { name: 'Terminer' }).click()
    await page.waitForURL(/\/recap$/)
    await expect(page.getByText('séries', { exact: true })).toBeVisible()

    const seance = await prisma.workoutSession.findFirstOrThrow({ where: { userId }, include: { sets: { include: { exercise: true } } } })
    expect(seance.type).toBe('PUSH')
    expect(seance.sets).toHaveLength(2)
    expect(seance.sets[0].exercise.nom).toBe('Développé couché barre')
    expect(seance.sets[0].chargeKg).toBeGreaterThan(0)
    expect(seance.sets[0].chargeKg % 2.5).toBe(0) // la charge évolue par pas de 2,5 kg

    await page.getByRole('link', { name: 'Retour à ta journée' }).click()
    await expect(page.getByRole('heading', { name: /On garde le/ })).toBeVisible()
  })

  test('séance de cardio', async () => {
    await page.goto('/activites/cardio/nouvelle')
    await page.getByLabel('Distance (km)').fill('5')
    await page.getByLabel('Durée (min)').fill('30')
    await page.getByRole('button', { name: 'Enregistrer la séance' }).click()
    await page.waitForURL((url) => url.pathname === '/')

    const cardio = await prisma.cardioSession.findFirstOrThrow({ where: { userId }, orderBy: { createdAt: 'desc' } })
    expect(cardio.distanceKm).toBe(5)
    expect(cardio.dureeSecondes).toBe(1800)
  })

  test('mesures corporelles', async () => {
    await page.goto('/activites/mesures/nouvelle')
    await page.getByLabel('Poids (kg)').fill('71.3')
    await page.getByLabel('Tour de taille (cm)').fill('82')
    await page.getByRole('button', { name: 'Enregistrer les mesures' }).click()
    await page.waitForURL((url) => url.pathname === '/')

    // L'onboarding crée déjà une mesure de départ : on lit donc la plus récente.
    const mesure = await prisma.bodyMeasurement.findFirstOrThrow({ where: { userId }, orderBy: { createdAt: 'desc' } })
    expect(mesure.poidsKg).toBe(71.3)
    expect(mesure.tourTailleCm).toBe(82)
  })

  test('suivi quotidien', async () => {
    await page.goto('/activites/suivi/nouvelle')
    await page.getByLabel('Pas', { exact: true }).fill('8000')
    await page.getByLabel('Protéines (g)').fill('120')
    await page.getByRole('button', { name: 'Enregistrer le suivi du jour' }).click()
    await page.waitForURL((url) => url.pathname === '/')

    const suivi = await prisma.dailyMetric.findFirstOrThrow({ where: { userId }, orderBy: { createdAt: 'desc' } })
    expect(suivi.pas).toBe(8000)
    expect(suivi.proteinesG).toBe(120)
  })

  test('objectif', async () => {
    await page.goto('/objectifs/nouveau')
    await page.getByLabel('Nom de l\'objectif').fill('Passer à 70 kg')
    await page.getByLabel(/Valeur cible/).fill('70')
    await page.getByRole('button', { name: 'Créer l’objectif' }).click()
    await page.waitForURL((url) => !url.pathname.endsWith('/nouveau'))

    const objectif = await prisma.goal.findFirstOrThrow({ where: { userId }, orderBy: { createdAt: 'desc' } })
    expect(objectif.titre).toBe('Passer à 70 kg')
    expect(objectif.valeurCible).toBe(70)
  })

  test('modification du profil', async () => {
    await page.goto('/profil/modifier')
    await page.getByLabel('Prénom').fill('Renommée')
    await page.getByRole('button', { name: 'Enregistrer' }).click()
    await page.waitForURL((url) => url.pathname === '/profil')

    expect((await prisma.profile.findUniqueOrThrow({ where: { userId } })).prenom).toBe('Renommée')
    await expect(page.getByRole('heading', { name: 'Renommée' })).toBeVisible()
  })

  test('chaque page s’affiche sans erreur avec les données créées', async () => {
    for (const chemin of ['/', '/calendrier', '/progression', '/records', '/comparer', '/profil']) {
      const reponse = await page.goto(chemin)
      expect(reponse?.status(), chemin).toBeLessThan(400)
      await expect(page.getByText(/Une erreur est survenue|Application error|Internal Server Error/i), chemin).toHaveCount(0)
      await expect(page.locator('h1').first(), chemin).toBeVisible()
      // Mentions légales et confidentialité : accessibles depuis chaque page de l'application.
      await expect(page.getByRole('link', { name: 'Mentions légales' }), chemin).toBeVisible()
      await expect(page.getByRole('link', { name: 'Confidentialité' }), chemin).toBeVisible()
    }
  })

  test('les données d’un compte restent invisibles pour un autre compte', async ({ browser }) => {
    const seance = await prisma.workoutSession.findFirstOrThrow({ where: { userId } })
    const autreEmail = emailUnique('intrus')
    const autre = await browser.newPage({ baseURL: BASE_URL })
    try {
      await inscrire(autre, autreEmail, 'Intrus')
      await terminerOnboarding(autre)

      // Le statut HTTP ne suffit pas comme preuve : avec le chargement progressif (loading.tsx), l'en-tête
      // part en 200 avant que la page ne constate que la séance n'appartient pas à l'utilisateur. On vérifie
      // donc ce qui est réellement affiché : la page « introuvable », et rien de la séance de l'autre compte.
      for (const chemin of [`/activites/musculation/${seance.id}`, `/activites/musculation/${seance.id}/recap`]) {
        await autre.goto(chemin)
        await expect(autre.getByRole('heading', { name: 'Page introuvable' }), chemin).toBeVisible()
        await expect(autre.getByText('Développé couché barre'), chemin).toHaveCount(0)
        await expect(autre.getByText('volume (kg)'), chemin).toHaveCount(0)
      }

      // Et son propre export ne contient rien de l'autre compte.
      const donnees = await (await autre.request.get('/api/export')).json()
      expect(donnees.seancesMusculation).toHaveLength(0)
      expect(JSON.stringify(donnees)).not.toContain('Passer à 70 kg')
    } finally {
      await autre.close()
      await supprimerUtilisateur(autreEmail)
    }
  })
})
