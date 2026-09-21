# Momentum

Suivi sportif quotidien (musculation, cardio, mesures, objectifs, badges) — Next.js 16, Auth.js, Prisma 7, Neon (PostgreSQL).

## Démarrage local

```bash
pnpm install
cp .env.example .env      # puis renseigner les variables (voir plus bas)
pnpm exec prisma migrate deploy
pnpm db:seed              # bibliothèque d'exercices + badges
pnpm dev
```

`DATABASE_URL` doit pointer sur la branche Neon **dev**, jamais sur `production`.

## Tests

```bash
pnpm test        # Vitest : unitaires + intégration (limitation de tentatives, sur DATABASE_URL)
pnpm test:e2e    # Playwright : parcours d'authentification, de compte (export, suppression) et des fonctions de l'app, sur un serveur de test (port 3100)
```

Les tests e2e créent puis suppriment de vrais comptes : ils tournent sur la base de `DATABASE_URL`.
Premier lancement : `pnpm exec playwright install chromium`.

## Base de données

Le schéma évolue **uniquement par migrations** (`prisma/migrations`) :

```bash
pnpm db:migrate   # développement : crée et applique une migration
pnpm db:deploy    # production : applique les migrations en attente
```

## Déploiement (Vercel + Neon)

1. Sur vercel.com/new, importer le dépôt (Next.js détecté automatiquement).
2. Deux environnements Vercel, deux bases Neon : **Production** (branche `production`) et **Preview** = version de test (branche `dev`). Chacun a sa propre `DATABASE_URL` et son propre `AUTH_SECRET`. Variables :
   - `DATABASE_URL` : chaîne pooled de la branche Neon correspondante
   - `AUTH_SECRET` : `openssl rand -base64 32`
   - E-mails (mot de passe oublié), au choix — le SMTP est prioritaire s'il est complet :
     - **SMTP, sans nom de domaine** : `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=465`, `SMTP_USER` (une boîte Gmail dédiée à l'app), `SMTP_PASSWORD` (« mot de passe d'application » Google, 16 caractères, validation en deux étapes requise). Envoie à n'importe quelle adresse (quota Gmail ≈ 500 par jour) ; l'expéditeur est l'adresse Gmail, les messages peuvent arriver en spam.
     - **Resend** : `RESEND_API_KEY` ; sans domaine vérifié, n'envoie qu'au propriétaire du compte Resend.
     - `EMAIL_FROM` (optionnel) : soit absent, soit renseigné, jamais vide. En SMTP, une adresse `@resend.dev` est ignorée.
     - **Sans service d'e-mail, personne ne peut confirmer son adresse** : les nouveaux comptes restent bloqués. Configure le SMTP avant d'ouvrir l'inscription.
     - Sans aucun service, la production **refuse** d'envoyer (un lien de réinitialisation ne doit jamais finir dans les journaux) ; en développement le lien s'affiche dans le terminal.
   - `NEXTAUTH_URL` (optionnel) : URL du site si domaine personnalisé ; sinon l'URL Vercel est détectée automatiquement.
   - `LEGAL_EDITOR_NAME`, `LEGAL_CONTACT_EMAIL` (et `LEGAL_EDITOR_ADDRESS`, facultative) : identité affichée dans les mentions légales et la politique de confidentialité. Absentes, les pages affichent « [à compléter] » surligné. Un particulier non professionnel peut ne pas publier son adresse (LCEN, art. 6-III-2) s'il l'a communiquée à l'hébergeur.
   - Ne définis **jamais** `REQUIRE_EMAIL_VERIFICATION=false` en production.
3. Déployer. `vercel-build` lance `prisma migrate deploy` à chaque build de production **et** de test, chacun sur sa propre base. Les branches poussées (hors `main`) produisent une version de test sur une URL dédiée.
4. Base de production créée avant les migrations : la migration `0_init` a été déclarée comme déjà appliquée (`prisma migrate resolve --applied 0_init`). Une nouvelle base n'a besoin que du déploiement, puis de `pnpm db:seed` (exercices et badges).
5. Vérifier : inscription, onboarding, une séance, « mot de passe oublié ».

Les fonctions Vercel tournent en région `fra1` (Francfort), la même que la base Neon (`eu-central-1`), pour limiter la latence.

## Données personnelles (RGPD)

L'app stocke des données de santé (poids, mensurations, activité) : elles sont traitées avec le consentement explicite de l'utilisateur.

- **Consentement** : case obligatoire à l'inscription, date enregistrée (`consentementLe`).
- **Pages légales** : `/confidentialite` et `/mentions-legales` (modèles à faire relire ; identité éditeur par variables d'environnement).
- **Confirmation de l'e-mail** : le compte est inutilisable tant que le lien reçu par e-mail (valable 24 h, à usage unique, stocké haché) n'a pas été confirmé. Les comptes créés avant cette fonction ont été marqués comme confirmés par la migration `conformite`.
- **Export** : `GET /api/export` (Profil → « Exporter mes données ») télécharge toutes les données en JSON, sans secret.
- **Suppression du compte** : Profil → « Supprimer mon compte », avec mot de passe et confirmation. Efface le compte et toutes ses données dans une transaction (`lib/data/compte.ts`).

## Garde-fou base de données

`lib/garde-base.ts` identifie la base réellement utilisée (identifiant d'endpoint Neon lu dans `DATABASE_URL`, comparé à des empreintes SHA-256) et **refuse de démarrer** si l'environnement ne correspond pas :
- une version de test (Preview) ou un serveur local branché sur la base de **production** ;
- un déploiement de **production** branché sur la base **dev**.

Il s'exécute au démarrage de l'application (`lib/prisma.ts`) et avant chaque build Vercel (`scripts/verifier-base.ts`, avant toute migration). Une base inconnue passe : si tu changes légitimement d'endpoint Neon, rien ne casse (mets alors à jour les empreintes dans `lib/garde-base.ts`).

## Sécurité

- Mots de passe hachés (bcrypt, 12 tours) ; jetons de réinitialisation stockés sous forme de hash SHA-256.
- Limitation de tentatives en base (`rate_limits`) : connexion (10 / 15 min par e-mail, 30 / 15 min par IP), inscription (10 / h par IP), mot de passe oublié (3 / h par e-mail, 10 / h par IP).
- Validation Zod côté serveur sur toutes les Server Actions.
