# Changelog

## [Non publié]

### Déploiement Vercel
- Les migrations Prisma s'appliquent automatiquement au build de production (`vercel-build`).
- `prisma generate` n'exige plus `DATABASE_URL` (l'installation Vercel ne plante plus si la variable manque).
- `NEXTAUTH_URL` devient optionnelle : repli sur l'URL de production fournie par Vercel.
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
