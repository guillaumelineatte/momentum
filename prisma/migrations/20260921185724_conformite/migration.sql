-- AlterTable
ALTER TABLE "users" ADD COLUMN     "consentementLe" TIMESTAMP(3);

-- Les comptes existants ont été créés avant la vérification de l'e-mail : on les considère vérifiés,
-- sinon ils ne pourraient plus se connecter une fois la vérification exigée.
UPDATE "users" SET "emailVerified" = now() WHERE "emailVerified" IS NULL;
