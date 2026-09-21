-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Objectif" AS ENUM ('PERTE_DE_POIDS', 'PRISE_DE_MUSCLE', 'RECOMPOSITION', 'ENDURANCE', 'FORCE', 'SANTE_GENERALE');

-- CreateEnum
CREATE TYPE "GroupeMusculaire" AS ENUM ('PECTORAUX', 'DOS', 'EPAULES', 'BICEPS', 'TRICEPS', 'AVANT_BRAS', 'QUADRICEPS', 'ISCHIOS', 'FESSIERS', 'MOLLETS', 'ABDOMINAUX', 'LOMBAIRES', 'CARDIO', 'FULL_BODY');

-- CreateEnum
CREATE TYPE "TypeSeance" AS ENUM ('PUSH', 'PULL', 'LEGS', 'UPPER', 'LOWER', 'FULL_BODY', 'PERSONNALISE');

-- CreateEnum
CREATE TYPE "TypeCardio" AS ENUM ('FOOTING', 'FRACTIONNE', 'SORTIE_LONGUE', 'TEMPO', 'VELO', 'NATATION', 'MARCHE', 'RAMEUR', 'AUTRE');

-- CreateEnum
CREATE TYPE "TypeObjectif" AS ENUM ('POIDS', 'MENSURATION', 'CHARGE_EXERCICE', 'ALLURE', 'DISTANCE_HEBDO', 'VOLUME_HEBDO', 'PERSONNALISE');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "passwordHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "tailleCm" DOUBLE PRECISION,
    "poidsDepartKg" DOUBLE PRECISION,
    "dateNaissance" TIMESTAMP(3),
    "objectifs" "Objectif"[],
    "tourTailleDepartCm" DOUBLE PRECISION,
    "tourHanchesDepartCm" DOUBLE PRECISION,
    "tourPoitrineDepartCm" DOUBLE PRECISION,
    "tourBrasDepartCm" DOUBLE PRECISION,
    "tourCuissesDepartCm" DOUBLE PRECISION,
    "tourMolletsDepartCm" DOUBLE PRECISION,
    "tourCouDepartCm" DOUBLE PRECISION,
    "dateDepart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercises" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "groupeMusculaire" "GroupeMusculaire" NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workout_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "TypeSeance" NOT NULL,
    "nomPersonnalise" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dureeSecondes" INTEGER,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workout_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workout_sets" (
    "id" TEXT NOT NULL,
    "workoutSessionId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL,
    "repetitions" INTEGER NOT NULL,
    "chargeKg" DOUBLE PRECISION NOT NULL,
    "rpe" DOUBLE PRECISION,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workout_sets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cardio_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "TypeCardio" NOT NULL,
    "nomPersonnalise" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "distanceKm" DOUBLE PRECISION,
    "dureeSecondes" INTEGER NOT NULL,
    "deniveleM" INTEGER,
    "frequenceCardiaqueMoyenne" INTEGER,
    "ressenti" INTEGER,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cardio_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "body_measurements" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "poidsKg" DOUBLE PRECISION,
    "masseGrassePct" DOUBLE PRECISION,
    "tourTailleCm" DOUBLE PRECISION,
    "tourHanchesCm" DOUBLE PRECISION,
    "tourPoitrineCm" DOUBLE PRECISION,
    "tourBrasCm" DOUBLE PRECISION,
    "tourCuissesCm" DOUBLE PRECISION,
    "tourMolletsCm" DOUBLE PRECISION,
    "tourCouCm" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "body_measurements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_metrics" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pas" INTEGER,
    "sommeilHeures" DOUBLE PRECISION,
    "qualiteSommeil" INTEGER,
    "proteinesG" DOUBLE PRECISION,
    "hydratationL" DOUBLE PRECISION,
    "energie" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rest_days" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rest_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goals" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "TypeObjectif" NOT NULL,
    "titre" TEXT NOT NULL,
    "valeurDepart" DOUBLE PRECISION,
    "valeurCible" DOUBLE PRECISION NOT NULL,
    "unite" TEXT NOT NULL,
    "exerciceId" TEXT,
    "dateCible" TIMESTAMP(3),
    "atteint" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "badges" (
    "id" TEXT NOT NULL,
    "cle" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icone" TEXT NOT NULL,

    CONSTRAINT "badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_badges" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "debloqueLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_badges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_userId_key" ON "profiles"("userId");

-- CreateIndex
CREATE INDEX "exercises_groupeMusculaire_idx" ON "exercises"("groupeMusculaire");

-- CreateIndex
CREATE INDEX "exercises_userId_idx" ON "exercises"("userId");

-- CreateIndex
CREATE INDEX "workout_sessions_userId_date_idx" ON "workout_sessions"("userId", "date");

-- CreateIndex
CREATE INDEX "workout_sets_workoutSessionId_idx" ON "workout_sets"("workoutSessionId");

-- CreateIndex
CREATE INDEX "workout_sets_exerciseId_idx" ON "workout_sets"("exerciseId");

-- CreateIndex
CREATE INDEX "cardio_sessions_userId_date_idx" ON "cardio_sessions"("userId", "date");

-- CreateIndex
CREATE INDEX "body_measurements_userId_date_idx" ON "body_measurements"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "daily_metrics_userId_date_key" ON "daily_metrics"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "rest_days_userId_date_key" ON "rest_days"("userId", "date");

-- CreateIndex
CREATE INDEX "goals_userId_idx" ON "goals"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "badges_cle_key" ON "badges"("cle");

-- CreateIndex
CREATE UNIQUE INDEX "user_badges_userId_badgeId_key" ON "user_badges"("userId", "badgeId");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercises" ADD CONSTRAINT "exercises_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_sessions" ADD CONSTRAINT "workout_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_sets" ADD CONSTRAINT "workout_sets_workoutSessionId_fkey" FOREIGN KEY ("workoutSessionId") REFERENCES "workout_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_sets" ADD CONSTRAINT "workout_sets_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "exercises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cardio_sessions" ADD CONSTRAINT "cardio_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "body_measurements" ADD CONSTRAINT "body_measurements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_metrics" ADD CONSTRAINT "daily_metrics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rest_days" ADD CONSTRAINT "rest_days_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goals" ADD CONSTRAINT "goals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "badges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

