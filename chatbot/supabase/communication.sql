-- Additive communication dashboard; existing RAG datasets and site tables stay untouched.
BEGIN;
SET LOCAL lock_timeout = '5s';
SELECT pg_advisory_xact_lock(hashtext('tremplin_communication_install'));
DO $$ DECLARE object_name text; BEGIN
  IF (SELECT obj_description(oid,'pg_namespace') FROM pg_namespace WHERE nspname='tremplin_chatbot') IS DISTINCT FROM 'Tremplin En coulisses RAG schema v1' THEN
    RAISE EXCEPTION 'Existing chatbot schema must be installed first';
  END IF;
  IF to_regprocedure('public.tremplin_communication(text,jsonb)') IS NOT NULL AND obj_description(to_regprocedure('public.tremplin_communication(text,jsonb)'), 'pg_proc') IS DISTINCT FROM 'Tremplin communication v1' THEN
    RAISE EXCEPTION 'A communication function already exists and is not owned by this migration';
  END IF;
  FOREACH object_name IN ARRAY ARRAY['communication_settings','communication_questions','communication_answers','communication_drafts','communication_login_attempts','communication_ai_requests'] LOOP
    IF to_regclass(format('tremplin_chatbot.%I',object_name)) IS NOT NULL AND obj_description(to_regclass(format('tremplin_chatbot.%I',object_name)), 'pg_class') IS DISTINCT FROM 'Tremplin communication v1' THEN
      RAISE EXCEPTION 'An unrelated table already exists: %',object_name;
    END IF;
  END LOOP;
END $$;
CREATE TABLE IF NOT EXISTS tremplin_chatbot.communication_settings (key text PRIMARY KEY, value text NOT NULL);
CREATE TABLE IF NOT EXISTS tremplin_chatbot.communication_questions (
  id uuid PRIMARY KEY, question text NOT NULL CHECK (length(question) BETWEEN 1 AND 1500),
  answer text NOT NULL DEFAULT '' CHECK (length(answer)<=8000), status text NOT NULL CHECK(status IN ('answered','unanswered','error')),
  topic text NOT NULL, sources jsonb NOT NULL DEFAULT '[]', conversation_id uuid, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS communication_questions_created ON tremplin_chatbot.communication_questions(created_at DESC);
CREATE TABLE IF NOT EXISTS tremplin_chatbot.communication_answers (
  id uuid PRIMARY KEY, source_question_id uuid NOT NULL UNIQUE REFERENCES tremplin_chatbot.communication_questions(id),
  question text NOT NULL, answer text NOT NULL CHECK(length(answer) BETWEEN 1 AND 6000),
  embedding real[] NOT NULL CHECK(cardinality(embedding)=1536), embedding_model text NOT NULL,
  active boolean NOT NULL DEFAULT true, updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS tremplin_chatbot.communication_drafts (
  id uuid PRIMARY KEY, title text NOT NULL CHECK(length(title) BETWEEN 1 AND 160), body text NOT NULL CHECK(length(body) BETWEEN 1 AND 8000),
  format text NOT NULL CHECK(format IN ('Instagram','Facebook')), status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','ready','published')),
  question_ids jsonb NOT NULL DEFAULT '[]', updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS tremplin_chatbot.communication_login_attempts (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, key text NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS communication_login_created ON tremplin_chatbot.communication_login_attempts(created_at DESC);
CREATE TABLE IF NOT EXISTS tremplin_chatbot.communication_ai_requests (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS communication_ai_created ON tremplin_chatbot.communication_ai_requests(created_at DESC);
COMMENT ON TABLE tremplin_chatbot.communication_settings IS 'Tremplin communication v1';
COMMENT ON TABLE tremplin_chatbot.communication_questions IS 'Tremplin communication v1';
COMMENT ON TABLE tremplin_chatbot.communication_answers IS 'Tremplin communication v1';
COMMENT ON TABLE tremplin_chatbot.communication_drafts IS 'Tremplin communication v1';
COMMENT ON TABLE tremplin_chatbot.communication_login_attempts IS 'Tremplin communication v1';
COMMENT ON TABLE tremplin_chatbot.communication_ai_requests IS 'Tremplin communication v1';
ALTER TABLE tremplin_chatbot.communication_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tremplin_chatbot.communication_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tremplin_chatbot.communication_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE tremplin_chatbot.communication_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tremplin_chatbot.communication_login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tremplin_chatbot.communication_ai_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON tremplin_chatbot.communication_ai_requests FROM PUBLIC,anon,authenticated;
REVOKE ALL ON tremplin_chatbot.communication_settings,tremplin_chatbot.communication_questions,tremplin_chatbot.communication_answers,tremplin_chatbot.communication_drafts,tremplin_chatbot.communication_login_attempts FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.tremplin_communication(operation text, payload jsonb DEFAULT '{}')
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE result jsonb; source_question record; answer_id uuid; page_number int; since_date timestamptz;
BEGIN
  IF operation='settings' THEN
    RETURN jsonb_build_object('passwordHash',(SELECT value FROM tremplin_chatbot.communication_settings WHERE key='password_hash'));
  ELSIF operation='login_attempt' THEN
    PERFORM pg_advisory_xact_lock(hashtext('tremplin_communication_login'));
    DELETE FROM tremplin_chatbot.communication_login_attempts WHERE created_at<now()-interval '1 day';
    IF (SELECT count(*) FROM tremplin_chatbot.communication_login_attempts WHERE created_at>now()-interval '15 minutes' AND key=payload->>'key')>=5
      OR (SELECT count(*) FROM tremplin_chatbot.communication_login_attempts WHERE created_at>now()-interval '15 minutes')>=60 THEN RETURN 'false'::jsonb; END IF;
    INSERT INTO tremplin_chatbot.communication_login_attempts(key) VALUES(payload->>'key'); RETURN 'true'::jsonb;
  ELSIF operation='ai_attempt' THEN
    PERFORM pg_advisory_xact_lock(hashtext('tremplin_communication_ai'));
    DELETE FROM tremplin_chatbot.communication_ai_requests WHERE created_at<now()-interval '1 day';
    IF (SELECT count(*) FROM tremplin_chatbot.communication_ai_requests WHERE created_at>now()-interval '1 minute')>=5
      OR (SELECT count(*) FROM tremplin_chatbot.communication_ai_requests WHERE created_at>now()-interval '1 day')>=50 THEN RETURN 'false'::jsonb; END IF;
    INSERT INTO tremplin_chatbot.communication_ai_requests DEFAULT VALUES; RETURN 'true'::jsonb;
  ELSIF operation='record' THEN
    INSERT INTO tremplin_chatbot.communication_questions(id,question,answer,status,topic,sources,conversation_id)
      VALUES((payload->>'id')::uuid,payload->>'question',payload->>'answer',payload->>'status',payload->>'topic',coalesce(payload->'sources','[]'),(payload->>'conversationId')::uuid)
      ON CONFLICT(id) DO NOTHING;
    RETURN 'true'::jsonb;
  ELSIF operation='answer' THEN
    SELECT * INTO STRICT source_question FROM tremplin_chatbot.communication_questions WHERE id=(payload->>'questionId')::uuid;
    PERFORM pg_advisory_xact_lock(hashtext('tremplin_answer:'||lower(trim(source_question.question))));
    answer_id:=coalesce((SELECT id FROM tremplin_chatbot.communication_answers WHERE source_question_id=source_question.id),(payload->>'id')::uuid);
    UPDATE tremplin_chatbot.communication_answers SET active=false WHERE active AND lower(trim(question))=lower(trim(source_question.question)) AND id<>answer_id;
    INSERT INTO tremplin_chatbot.communication_answers(id,source_question_id,question,answer,embedding,embedding_model)
      VALUES(answer_id,source_question.id,source_question.question,payload->>'answer',ARRAY(SELECT jsonb_array_elements_text(payload->'embedding')::real),payload->>'embeddingModel')
      ON CONFLICT(source_question_id) DO UPDATE SET answer=EXCLUDED.answer,embedding=EXCLUDED.embedding,embedding_model=EXCLUDED.embedding_model,active=true,updated_at=now();
    RETURN jsonb_build_object('id',answer_id);
  ELSIF operation='deactivate_answer' THEN
    UPDATE tremplin_chatbot.communication_answers SET active=false,updated_at=now() WHERE id=(payload->>'id')::uuid;
    RETURN jsonb_build_object('ok',FOUND);
  ELSIF operation='manuals' THEN
    SELECT coalesce(jsonb_agg(jsonb_build_object('id',id,'url','document://tremplin/reponse-'||id,'title','Réponse validée par l’équipe','text','Question : '||question||E'\nRéponse validée : '||answer,'embedding',to_json(embedding)::text,'embedding_model',embedding_model,'updatedAt',updated_at,'lexical',CASE WHEN coalesce(payload->>'query','')='' THEN false ELSE to_tsvector('french',question||' '||answer) @@ to_tsquery('french',payload->>'query') END) ORDER BY updated_at DESC),'[]') INTO result FROM tremplin_chatbot.communication_answers WHERE active;
    RETURN result;
  ELSIF operation='question' THEN
    SELECT jsonb_build_object('id',q.id,'question',q.question,'answer',q.answer,'status',q.status,'topic',q.topic,'createdAt',q.created_at,'sources',q.sources,'validatedAnswer',a.answer,'manualId',a.id,'resolved',a.id IS NOT NULL) INTO result
      FROM tremplin_chatbot.communication_questions q LEFT JOIN LATERAL(SELECT id,answer FROM tremplin_chatbot.communication_answers WHERE active AND lower(trim(question))=lower(trim(q.question)) ORDER BY updated_at DESC LIMIT 1)a ON true WHERE q.id=(payload->>'id')::uuid;
    RETURN result;
  ELSIF operation='save_draft' THEN
    INSERT INTO tremplin_chatbot.communication_drafts(id,title,body,format,status,question_ids)
      VALUES((payload->>'id')::uuid,payload->>'title',payload->>'body',payload->>'format',payload->>'status',payload->'questionIds')
      ON CONFLICT(id) DO UPDATE SET title=EXCLUDED.title,body=EXCLUDED.body,format=EXCLUDED.format,status=EXCLUDED.status,updated_at=now();
    RETURN jsonb_build_object('id',payload->>'id');
  ELSIF operation='dashboard' THEN
    page_number:=greatest(0,least(coalesce((payload->>'page')::int,0),100000));
    since_date:=CASE WHEN coalesce((payload->>'days')::int,30)=0 THEN '-infinity'::timestamptz ELSE now()-make_interval(days=>greatest(1,least((payload->>'days')::int,365))) END;
    WITH all_questions AS (
      SELECT q.*,a.answer validated_answer,a.id manual_id,a.id IS NOT NULL resolved FROM tremplin_chatbot.communication_questions q
      LEFT JOIN LATERAL(SELECT id,answer FROM tremplin_chatbot.communication_answers WHERE active AND lower(trim(question))=lower(trim(q.question)) ORDER BY updated_at DESC LIMIT 1)a ON true
      WHERE q.created_at>=since_date
    ), filtered AS (
      SELECT * FROM all_questions WHERE (coalesce(payload->>'search','')='' OR position(lower(payload->>'search') IN lower(question))>0)
      AND (coalesce(payload->>'topic','')='' OR topic=payload->>'topic')
      AND (coalesce(payload->>'status','')='' OR (payload->>'status'='pending' AND status<>'answered' AND NOT resolved) OR (payload->>'status'='answered' AND (status='answered' OR resolved)) OR (payload->>'status'='corrected' AND resolved))
    ), paginated AS (SELECT * FROM filtered ORDER BY created_at DESC,id LIMIT 25 OFFSET page_number*25),
    grouped AS (SELECT lower(trim(question)) normalized,min(question) question,count(*) n,min(topic) topic FROM all_questions GROUP BY lower(trim(question))),
    recurring AS (SELECT g.*,q.id question_id,coalesce(q.validated_answer,CASE WHEN q.status='answered' THEN q.answer END) reference_answer FROM grouped g JOIN LATERAL(SELECT * FROM all_questions a WHERE lower(trim(a.question))=g.normalized ORDER BY a.resolved DESC,(a.status='answered') DESC,a.created_at DESC LIMIT 1)q ON true ORDER BY n DESC LIMIT 12)
    SELECT jsonb_build_object(
      'questions',coalesce((SELECT jsonb_agg(jsonb_build_object('id',id,'question',question,'answer',answer,'status',status,'topic',topic,'createdAt',created_at,'sources',sources,'validatedAnswer',validated_answer,'manualId',manual_id,'resolved',resolved) ORDER BY created_at DESC,id) FROM paginated),'[]'),
      'total',(SELECT count(*) FROM filtered),'page',page_number,'pageSize',25,
      'stats',jsonb_build_object('total',(SELECT count(*) FROM all_questions),'answered',(SELECT count(*) FROM all_questions WHERE status='answered' OR resolved),'unanswered',(SELECT count(*) FROM all_questions WHERE status<>'answered' AND NOT resolved),'corrected',(SELECT count(*) FROM all_questions WHERE resolved),'firstRecordedAt',(SELECT min(created_at) FROM tremplin_chatbot.communication_questions)),
      'topics',coalesce((SELECT jsonb_agg(jsonb_build_object('topic',topic,'count',n,'unanswered',pending) ORDER BY n DESC) FROM (SELECT topic,count(*) n,count(*) FILTER(WHERE status<>'answered' AND NOT resolved) pending FROM all_questions GROUP BY topic)t),'[]'),
      'days',coalesce((SELECT jsonb_agg(jsonb_build_object('date',day_key,'count',n,'unanswered',pending) ORDER BY day_key) FROM (SELECT to_char(created_at AT TIME ZONE 'Europe/Paris','YYYY-MM-DD') AS day_key,count(*) n,count(*) FILTER(WHERE status<>'answered' AND NOT resolved) pending FROM all_questions GROUP BY 1)t),'[]'),
      'recurring',coalesce((SELECT jsonb_agg(jsonb_build_object('question',question,'count',n,'topic',topic,'questionId',question_id,'answer',reference_answer) ORDER BY n DESC) FROM recurring),'[]'),
      'drafts',coalesce((SELECT jsonb_agg(jsonb_build_object('id',id,'title',title,'body',body,'format',format,'status',status,'questionIds',question_ids,'updatedAt',updated_at) ORDER BY updated_at DESC) FROM (SELECT * FROM tremplin_chatbot.communication_drafts ORDER BY updated_at DESC LIMIT 100)d),'[]')
    ) INTO result;
    RETURN result;
  END IF;
  RAISE EXCEPTION 'Unknown communication operation';
END $$;
COMMENT ON FUNCTION public.tremplin_communication(text,jsonb) IS 'Tremplin communication v1';
REVOKE ALL ON FUNCTION public.tremplin_communication(text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.tremplin_communication(text,jsonb) TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
