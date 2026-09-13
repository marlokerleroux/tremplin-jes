-- Résultats des auditions, rappels automatiques, modèles d'emails et vérification de l'adresse email (septembre 2026)

-- 1. Vérification de l'email : les comptes existants sont considérés comme vérifiés.
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "email_verified_at" TIMESTAMP(3);
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "email_verification_token" TEXT;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "email_verification_sent_at" TIMESTAMP(3);
UPDATE "profiles" SET "email_verified_at" = COALESCE("created_at", CURRENT_TIMESTAMP) WHERE "email_verified_at" IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "profiles_email_verification_token_key" ON "profiles"("email_verification_token");

-- 2. Résultats et rappels
ALTER TABLE "applications" ADD COLUMN IF NOT EXISTS "is_finalist" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "applications" ADD COLUMN IF NOT EXISTS "result_sent_at" TIMESTAMP(3);
ALTER TABLE "applications" ADD COLUMN IF NOT EXISTS "reminder_j7_sent_at" TIMESTAMP(3);
ALTER TABLE "applications" ADD COLUMN IF NOT EXISTS "reminder_j1_sent_at" TIMESTAMP(3);

-- 3. Modèles d'emails personnalisables
CREATE TABLE IF NOT EXISTS "email_templates" (
    "key" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_templates_pkey" PRIMARY KEY ("key")
);
