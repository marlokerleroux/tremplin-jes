-- Server-only bridge for an invited project accessed through the SQL editor.
-- CREATE deliberately fails if a function with this signature already exists.
CREATE FUNCTION public.tremplin_chatbot_read_index(query_terms text DEFAULT '')
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $function$
  WITH latest AS (
    SELECT * FROM tremplin_chatbot.datasets ORDER BY created_at DESC,id DESC LIMIT 1
  )
  SELECT jsonb_build_object(
    'chunks', COALESCE((SELECT jsonb_agg(jsonb_build_object(
      'id',c.id,'url',c.url,'title',c.title,'text',c.content,
      'embedding',to_json(c.embedding)::text,'embedding_model',c.embedding_model
    ) ORDER BY c.position,c.id) FROM tremplin_chatbot.chunks c WHERE c.dataset_id=d.id),'[]'::jsonb),
    'lexical', CASE WHEN query_terms='' THEN '[]'::jsonb ELSE COALESCE((
      SELECT jsonb_agg(jsonb_build_object('id',ranked.id)) FROM (
        SELECT c.id FROM tremplin_chatbot.chunks c WHERE c.dataset_id=d.id
        AND c.search @@ to_tsquery('french',query_terms)
        ORDER BY ts_rank_cd(c.search,to_tsquery('french',query_terms)) DESC,c.id LIMIT 20
      ) ranked
    ),'[]'::jsonb) END,
    'embeddingModel',d.embedding_model,'indexedAt',d.indexed_at,
    'stats',jsonb_build_object('documents',d.document_count,'chunks',d.chunk_count,
      'embeddings',(SELECT count(*) FROM tremplin_chatbot.chunks WHERE dataset_id=d.id AND embedding IS NOT NULL),
      'indexedAt',d.indexed_at,'source',d.source,'storage','supabase')
  ) FROM latest d;
$function$;
REVOKE ALL ON FUNCTION public.tremplin_chatbot_read_index(text) FROM PUBLIC;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN
    REVOKE ALL ON FUNCTION public.tremplin_chatbot_read_index(text) FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN
    REVOKE ALL ON FUNCTION public.tremplin_chatbot_read_index(text) FROM authenticated;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='service_role') THEN
    GRANT EXECUTE ON FUNCTION public.tremplin_chatbot_read_index(text) TO service_role;
  END IF;
END $$;
NOTIFY pgrst, 'reload schema';
