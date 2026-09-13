-- L'édition affichée par le site vitrine (finale, après-finale) est indépendante de la saison en cours :
-- ouvrir la saison suivante dans l'administration ne doit pas vider la page de la finale.
ALTER TABLE "vitrine_config" ADD COLUMN IF NOT EXISTS "edition" INTEGER;
UPDATE "vitrine_config"
SET "edition" = (
  SELECT max("edition") FROM "vitrine_editions"
  WHERE jsonb_array_length("finalists") > 0 OR "jury_winner" IS NOT NULL OR "final_date" IS NOT NULL
)
WHERE "edition" IS NULL;
