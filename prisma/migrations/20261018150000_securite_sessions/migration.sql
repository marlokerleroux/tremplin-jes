-- Invalidation des sessions après un changement de mot de passe (comparée au jeton de session).
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "session_version" INTEGER NOT NULL DEFAULT 0;
