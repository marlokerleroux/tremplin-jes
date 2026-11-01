-- Relances automatiques des dossiers incomplets (fiche technique / autorisations parentales) avant la clôture des inscriptions.
ALTER TABLE "applications" ADD COLUMN IF NOT EXISTS "dossier_reminder_sent_at" TIMESTAMP(3);
ALTER TABLE "applications" ADD COLUMN IF NOT EXISTS "dossier_reminder_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "schedule_config" ADD COLUMN IF NOT EXISTS "dossier_reminders_enabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "schedule_config" ADD COLUMN IF NOT EXISTS "dossier_reminder_interval_days" INTEGER NOT NULL DEFAULT 7;
ALTER TABLE "schedule_config" ADD COLUMN IF NOT EXISTS "dossier_reminder_final_days" INTEGER NOT NULL DEFAULT 3;
