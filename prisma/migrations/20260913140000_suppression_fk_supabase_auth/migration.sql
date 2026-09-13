-- Création de compte : suppression des clés étrangères héritées de Supabase Auth.
-- L'ancienne base liait profiles.id à auth.users(id) ; depuis le passage à NextAuth, les profils sont
-- créés directement par l'application et cette contrainte fait échouer toute inscription (P2003).
ALTER TABLE "profiles" DROP CONSTRAINT IF EXISTS "profiles_id_fkey";

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT c.conname, t.relname AS table_name
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    JOIN pg_class ft ON ft.oid = c.confrelid
    JOIN pg_namespace fn ON fn.oid = ft.relnamespace
    WHERE c.contype = 'f' AND n.nspname = 'public' AND fn.nspname = 'auth'
  LOOP
    EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT %I', r.table_name, r.conname);
  END LOOP;
END $$;
