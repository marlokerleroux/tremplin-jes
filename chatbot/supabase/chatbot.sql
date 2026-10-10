-- Additive schema, separate from the site's Prisma migrations and public tables.
-- Applied once, inside the import transaction. No DROP, DELETE or replacement.
CREATE SCHEMA tremplin_chatbot;
COMMENT ON SCHEMA tremplin_chatbot IS 'Tremplin En coulisses RAG schema v1';
REVOKE ALL ON SCHEMA tremplin_chatbot FROM PUBLIC;

CREATE TABLE tremplin_chatbot.datasets (
  id text PRIMARY KEY,
  source text NOT NULL,
  indexed_at timestamptz NOT NULL,
  embedding_model text NOT NULL,
  document_count integer NOT NULL CHECK (document_count > 0),
  chunk_count integer NOT NULL CHECK (chunk_count > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE tremplin_chatbot.documents (
  dataset_id text NOT NULL REFERENCES tremplin_chatbot.datasets(id),
  url text NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  content_hash text NOT NULL,
  fetched_at timestamptz NOT NULL,
  PRIMARY KEY (dataset_id, url)
);
CREATE TABLE tremplin_chatbot.chunks (
  dataset_id text NOT NULL,
  id text NOT NULL,
  url text NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  position integer NOT NULL,
  embedding real[],
  embedding_model text NOT NULL,
  search tsvector GENERATED ALWAYS AS (to_tsvector('french',title || ' ' || content)) STORED,
  PRIMARY KEY (dataset_id, id),
  FOREIGN KEY (dataset_id,url) REFERENCES tremplin_chatbot.documents(dataset_id,url),
  CHECK (embedding IS NULL OR array_length(embedding,1)=1536)
);
CREATE INDEX chatbot_chunks_search ON tremplin_chatbot.chunks USING gin(search);
ALTER TABLE tremplin_chatbot.datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE tremplin_chatbot.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE tremplin_chatbot.chunks ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON ALL TABLES IN SCHEMA tremplin_chatbot FROM PUBLIC;
-- No API roles get access. This schema is read through the server's DB connection.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN
    REVOKE ALL ON SCHEMA tremplin_chatbot FROM anon;
    REVOKE ALL ON ALL TABLES IN SCHEMA tremplin_chatbot FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN
    REVOKE ALL ON SCHEMA tremplin_chatbot FROM authenticated;
    REVOKE ALL ON ALL TABLES IN SCHEMA tremplin_chatbot FROM authenticated;
  END IF;
END $$;
