# Changelog

## [Non publié]

### Conformité (RGPD)
- Consentement explicite à l'inscription (données de santé), date enregistrée.
- Pages légales : politique de confidentialité et mentions légales, identité de l'éditeur par variables d'environnement.
- Confirmation de l'adresse e-mail avant la première connexion (lien de 24 h, à usage unique, stocké haché). Les comptes existants sont marqués comme confirmés (migration `conformite`).
- Export des données au format JSON (`/api/export`) et suppression définitive du compte avec ré-authentification.
- Tests : intégration (jeton de vérification, suppression en cascade, export) et de bout en bout (inscription avec confirmation, export, suppression).

### E-mails
- Envoi par SMTP (`nodemailer`), sans nom de domaine : une boîte Gmail dédiée avec mot de passe d'application. Prioritaire sur Resend quand `SMTP_HOST`, `SMTP_USER` et `SMTP_PASSWORD` sont définis.
- En développement sans service configuré, le lien de réinitialisation s'affiche dans le terminal ; en production sans service, l'envoi est refusé.
- Le message contient désormais une version texte et le lien en clair.

### Sécurité des bases
- Garde-fou `lib/garde-base.ts` : une version de test ou un serveur local ne peut plus se connecter à la base de production, ni la production à la base de dev (vérifié au démarrage et avant chaque build Vercel).

### Déploiement Vercel
- Deux environnements : production (branche Neon `production`) et test/Preview (branche `dev`). Les migrations Prisma s'appliquent automatiquement à chaque build (`vercel-build`), sur la base de l'environnement concerné.
- `prisma generate` n'exige plus `DATABASE_URL` (l'installation Vercel ne plante plus si la variable manque).
- `NEXTAUTH_URL` devient optionnelle : repli sur l'URL de l'environnement Vercel (les liens d'e-mail d'une version de test ne pointent jamais sur la production).
- Fonctions déployées en `fra1`, comme la base Neon.

### Ajouté
- Migrations Prisma (`prisma/migrations`), script `db:deploy`.
- Limitation de tentatives (connexion, inscription, mot de passe oublié), stockée en base.
- Tests Vitest (unitaires + intégration) et Playwright (parcours d'authentification).
- README avec la procédure de déploiement, template de PR.

### Modifié
- Les jetons de réinitialisation de mot de passe sont stockés sous forme de hash SHA-256 (les liens émis avant ce changement sont invalidés).
- Le nom du package devient `momentum`.

### Supprimé
- Script `db:push` (les changements de schéma passent par les migrations).
- Fichiers `placeholder-*` inutilisés et entrées `.gitignore` héritées de v0.
