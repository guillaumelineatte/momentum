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
pnpm test:e2e    # Playwright : parcours complet sur un serveur de test (port 3100)
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

1. **Variables d'environnement Vercel** (Production) :
   - `DATABASE_URL` : chaîne pooled de la branche Neon `production`
   - `AUTH_SECRET` : `npx auth secret`
   - `NEXTAUTH_URL` : URL publique, ex. `https://momentum.example.com` (sert au lien de réinitialisation)
   - `RESEND_API_KEY`
   - `EMAIL_FROM` : adresse sur un domaine **vérifié** dans Resend (avec `onboarding@resend.dev`, seuls les e-mails vers le propriétaire du compte partent)
2. **Migrer la base de production** (une fois, depuis ta machine, avec l'URL de production) :
   ```bash
   # La base de prod a été créée avant les migrations : on déclare la migration de base comme déjà appliquée.
   DATABASE_URL="<url prod>" pnpm exec prisma migrate resolve --applied 0_init
   DATABASE_URL="<url prod>" pnpm db:deploy
   ```
   Ensuite, à chaque déploiement qui change le schéma : `pnpm db:deploy` avant (ou pendant) la mise en ligne.
3. **Seed** : déjà fait sur la base de production (64 exercices, 7 badges). Pour une nouvelle base : `pnpm db:seed`.
4. Déployer, puis vérifier : inscription, onboarding, une séance, « mot de passe oublié » (e-mail reçu, lien vers le bon domaine).

## Sécurité

- Mots de passe hachés (bcrypt, 12 tours) ; jetons de réinitialisation stockés sous forme de hash SHA-256.
- Limitation de tentatives en base (`rate_limits`) : connexion (10 / 15 min par e-mail, 30 / 15 min par IP), inscription (10 / h par IP), mot de passe oublié (3 / h par e-mail, 10 / h par IP).
- Validation Zod côté serveur sur toutes les Server Actions.
