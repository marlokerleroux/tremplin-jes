-- Site vitrine piloté par l'administration : configuration, éditions (finale, palmarès, après-finale),
-- partenaires et médias. Reprise des données de la finale 2026 jusqu'ici codées en dur.

CREATE TABLE IF NOT EXISTS "vitrine_config" (
    "id" UUID NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'finale',
    "banner_enabled" BOOLEAN NOT NULL DEFAULT false,
    "banner_text" TEXT,
    "banner_url" TEXT,
    "auditions_intro" TEXT,
    "preseason_text" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "vitrine_config_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "vitrine_editions" (
    "edition" INTEGER NOT NULL,
    "anniversary_label" TEXT,
    "final_date" TIMESTAMP(3),
    "final_venue" TEXT,
    "final_address" TEXT,
    "final_city" TEXT,
    "ticket_url" TEXT,
    "pass_culture_url" TEXT,
    "price_label" TEXT,
    "jury_prize_text" TEXT,
    "public_prize_text" TEXT,
    "jury_winner" TEXT,
    "public_winner" TEXT,
    "aftermath_text" TEXT,
    "aftermath_video_url" TEXT,
    "aftermath_photos_url" TEXT,
    "finalists" JSONB NOT NULL DEFAULT '[]',
    "tour_dates" JSONB NOT NULL DEFAULT '[]',
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "vitrine_editions_pkey" PRIMARY KEY ("edition")
);

CREATE TABLE IF NOT EXISTS "vitrine_partners" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "logo_url" TEXT NOT NULL,
    "url" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "vitrine_partners_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "vitrine_media" (
    "id" UUID NOT NULL,
    "blob_url" TEXT NOT NULL,
    "content_type" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "vitrine_media_pkey" PRIMARY KEY ("id")
);

-- Données initiales : le site reste en mode « finale » avec l'édition 2026 telle qu'affichée aujourd'hui.
INSERT INTO "vitrine_config" ("id", "mode", "banner_enabled", "updated_at")
SELECT gen_random_uuid(), 'finale', false, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "vitrine_config");

INSERT INTO "vitrine_editions" (
  "edition", "anniversary_label", "final_date", "final_venue", "final_address", "final_city",
  "ticket_url", "pass_culture_url", "price_label", "jury_prize_text", "public_prize_text",
  "jury_winner", "public_winner", "finalists", "tour_dates", "updated_at"
)
SELECT 2026, '10 ans du Tremplin', TIMESTAMP '2026-05-13 18:00:00', 'Le Vauban', '17 Avenue Georges Clemenceau', 'Brest',
  'https://www.billetweb.fr/finale-tremplin-jeunes-en-scene-2026', 'https://passculture.app/offre/399633296', 'à partir de 7 €',
  'Le lauréat remporte une tournée dans les festivals bretons partenaires de l''association Pass''Musique, ainsi que l''enregistrement d''un EP dans un studio partenaire.',
  'Le public vote pour son artiste préféré ! Le gagnant remporte une séance photo professionnelle et l''enregistrement d''une maquette.',
  'Starfish', 'Cyel', '[{"id": "finaliste-1", "name": "Mayti", "genre": "Rap", "image": "/images/vitrine/finalists/mayti.jpg", "youtubeId": "t-jooYuxiWI", "description": "Rappeur de 17 ans originaire de la région lorientaise, il a créé un univers reposant sur une écriture sincère, teintée d''émotions brutes, de doutes, de réflexions personnelles et d''une lucidité étonnante."}, {"id": "finaliste-2", "name": "Cyel", "genre": "Pop / Rock", "image": "/images/vitrine/finalists/cyel.jpg", "youtubeId": "zV89QknrueM", "description": "Le groupe évolue dans des compositions principalement en français et nourries par des influences variées des membres du groupe. Sur scène, leur but est de s''amuser tout en communiquant leur énergie et leur passion."}, {"id": "finaliste-3", "name": "Vantage", "genre": "Pop / Punk / Rock", "image": "/images/vitrine/finalists/vantage.jpeg", "youtubeId": "oSQmIJJOBIg", "description": "C''est avant tout une bande de potes entre répètes et virées à la boulangerie, à l''énergie sincère et un peu bordélique. Dans son dernier EP, le groupe aborde des thèmes aussi variés que les relations, les regrets, le monde virtuel..."}, {"id": "finaliste-4", "name": "Al!ce", "genre": "Pop / Rock", "image": "/images/vitrine/finalists/alice.jpg", "youtubeId": "XdtLJXi9a2s", "description": "Il nous emporte dans un voyage énergique entre pop, rock, rap, et électro, évoquant les ruptures amoureuses et amicales, ses failles, mais aussi des sujets plus engagés comme la montée des extrêmes ou l''abus de pouvoir."}, {"id": "finaliste-5", "name": "Lilly Jane", "genre": "Pop / Folk", "image": "/images/vitrine/finalists/lillyjane.jpg", "youtubeId": "O5gljF3_z8M", "description": "Autrice-compositrice-interprète de 18 ans, elle se distingue par un univers pop-folk aux touches jazzy. Au piano comme à la guitare, elle interprète des chansons sincères, où se mêlent émotions et instants de vie."}, {"id": "finaliste-6", "name": "Starfish", "genre": "Pop / Rock Alternatif", "image": "/images/vitrine/finalists/starfish.jpg", "youtubeId": "uwRgnE-Cogg", "description": "Jeune groupe de rock alternatif brestois, leur plus grande force est certainement leur énergie sur scène, celle-ci étant un lieu d''expression et de libération. Ils font de chaque concert un moment unique de partage avec le public."}]'::jsonb, '[]'::jsonb, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "vitrine_editions" WHERE "edition" = 2026);

INSERT INTO "vitrine_partners" ("id", "name", "logo_url", "url", "position", "is_active", "updated_at")
SELECT gen_random_uuid(), v.name, v.logo, v.url, v.position, true, CURRENT_TIMESTAMP
FROM (VALUES
  ('Festidreuz', '/images/vitrine/partners/festidreuz.jpg', 'https://www.festidreuz.fr', 0),
  ('Ouestival', '/images/vitrine/partners/ouestival.jpg', 'https://ouestival29.fr', 1),
  ('Nuit des Étoiles', '/images/vitrine/partners/nuit-des-etoiles.png', 'https://www.festival-nuitdesetoiles.fr', 2),
  ('Les Ribamboules', '/images/vitrine/partners/ribamboules.png', 'https://lesribamboules.bzh/', 3),
  ('Sea Fest N Sound', '/images/vitrine/partners/sea-fest-n-sound.png', 'https://www.seafestnsound.fr', 4),
  ('Espace Léo Ferré', '/images/vitrine/partners/espace-leo-ferre.jpg', 'https://espaceleoferre.e-monsite.com', 5),
  ('Crédit Agricole', '/images/vitrine/partners/credit-agricole.png', 'https://www.credit-agricole.fr/ca-finistere/particulier.html', 6),
  ('Brest', '/images/vitrine/partners/brest.png', 'https://brest.fr', 7),
  ('Le Relecq-Kerhuon', '/images/vitrine/partners/relecq-kerhuon.jpg', 'https://www.lerelecqkerhuon.bzh', 8),
  ('Bibus', '/images/vitrine/partners/bibus.png', 'https://www.bibus.fr', 9),
  ('Intermarché', '/images/vitrine/partners/intermarche.png', 'https://www.intermarche.com/magasins/09641/brest-29200/infos-pratiques', 10),
  ('Mercier Musique', '/images/vitrine/partners/mercier-musique.png', 'https://merciermusique.com', 11),
  ('BDB Studio', '/images/vitrine/partners/bdb-studio.png', 'https://www.instagram.com/studio_bdb/', 12),
  ('KVS Studio', '/images/vitrine/partners/kvs-studio.webp', 'https://kvsstudio.odoo.com', 13),
  ('Hot Pizza', '/images/vitrine/partners/hot-pizza.png', 'https://www.hotpizza-brest.fr/pizzeria-et-pizza-a-emporter-brest.html', 14),
  ('Seems Fair Studio', '/images/vitrine/partners/seems-fair-studio.png', 'https://www.instagram.com/seemsfairstudio/', 15)
) AS v(name, logo, url, position)
WHERE NOT EXISTS (SELECT 1 FROM "vitrine_partners");
