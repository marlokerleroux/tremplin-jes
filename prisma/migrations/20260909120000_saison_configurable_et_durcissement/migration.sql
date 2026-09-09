-- Saison configurable, archivage par édition et durcissement (septembre 2026)

-- 1. Nettoyage préalable : une seule fiche technique par candidature (on garde la plus récente)
DELETE FROM "technical_sheets" t
USING "technical_sheets" newer
WHERE t."application_id" = newer."application_id"
  AND (t."updated_at" < newer."updated_at" OR (t."updated_at" = newer."updated_at" AND t."id" < newer."id"));

-- 2. Nettoyage préalable : jetons de réinitialisation orphelins (profil supprimé)
DELETE FROM "password_reset_tokens" t
WHERE NOT EXISTS (SELECT 1 FROM "profiles" p WHERE p."id" = t."profile_id");

-- DropIndex
DROP INDEX IF EXISTS "applications_user_id_key";

-- AlterTable
ALTER TABLE "applications" ADD COLUMN     "edition" INTEGER NOT NULL DEFAULT 2026;

-- AlterTable
ALTER TABLE "time_slots" ADD COLUMN     "edition" INTEGER NOT NULL DEFAULT 2026;

-- AlterTable
ALTER TABLE "schedule_config" ADD COLUMN     "age_reference_date" TEXT,
ADD COLUMN     "audition_dates" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "edition" INTEGER NOT NULL DEFAULT 2026,
ADD COLUMN     "registration_closes_at" TIMESTAMP(3),
ADD COLUMN     "registration_opens_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "rate_limit_hits" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rate_limit_hits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "rate_limit_hits_key_created_at_idx" ON "rate_limit_hits"("key", "created_at");

-- CreateIndex
CREATE INDEX "applications_edition_idx" ON "applications"("edition");

-- CreateIndex
CREATE UNIQUE INDEX "applications_user_id_edition_key" ON "applications"("user_id", "edition");

-- CreateIndex
CREATE INDEX "time_slots_edition_date_idx" ON "time_slots"("edition", "date");

-- CreateIndex
CREATE UNIQUE INDEX "technical_sheets_application_id_key" ON "technical_sheets"("application_id");

-- CreateIndex
CREATE INDEX "password_reset_tokens_profile_id_idx" ON "password_reset_tokens"("profile_id");

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 3. Reprise des données de la saison 2026 (état inchangé : inscriptions closes depuis le 1er janvier 2026)
UPDATE "schedule_config"
SET "edition" = 2026,
    "audition_dates" = ARRAY['2026-01-31', '2026-02-01']::TEXT[],
    "age_reference_date" = '2026-01-31',
    "registration_closes_at" = TIMESTAMP '2025-12-31 23:00:00'
WHERE "age_reference_date" IS NULL AND "registration_closes_at" IS NULL;

-- Si aucune configuration n'existe encore, on en crée une pour la saison 2026.
INSERT INTO "schedule_config" ("id", "edition", "audition_dates", "age_reference_date", "registration_closes_at", "is_validated", "venue", "created_at", "updated_at")
SELECT gen_random_uuid(), 2026, ARRAY['2026-01-31', '2026-02-01']::TEXT[], '2026-01-31', TIMESTAMP '2025-12-31 23:00:00', false, 'Espace Léo Ferré, Brest', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "schedule_config");
