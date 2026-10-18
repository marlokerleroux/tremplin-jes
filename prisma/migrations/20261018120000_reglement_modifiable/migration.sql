-- Règlement du tremplin modifiable dans l'administration (Paramètres), publié en PDF généré à la volée.
CREATE TABLE IF NOT EXISTS "rules_document" (
    "id" TEXT NOT NULL DEFAULT 'current',
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rules_document_pkey" PRIMARY KEY ("id")
);
