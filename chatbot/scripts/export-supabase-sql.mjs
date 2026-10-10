import { readFile,writeFile,mkdir } from 'node:fs/promises';
import Database from 'better-sqlite3';
import { db,metadata } from '../server/db.mjs';
import { prepareDataset } from '../server/publish-knowledge.mjs';

const dataset=prepareDataset(db.prepare('SELECT * FROM documents ORDER BY url').all(),db.prepare('SELECT * FROM chunks ORDER BY url,rowid').all(),{
  source:metadata('site'),indexedAt:metadata('indexedAt'),embeddingModel:metadata('embeddingModel'),
});
const quote=value=>`'${String(value).replaceAll("'","''")}'`;
const {id,documents,chunks,meta}=dataset;
const append=process.argv.includes('--append');
// Optional immutable local snapshot of an already-published version. Copy its
// unchanged rows inside PostgreSQL to keep SQL-editor payloads below 1 MB.
const reusePath=process.argv.find(x=>x.startsWith('--reuse-index='))?.slice('--reuse-index='.length);
let previous;
if(reusePath) {
  if(!append)throw new Error('--reuse-index nécessite --append');
  const snapshot=new Database(reusePath,{readonly:true,fileMustExist:true});
  try {
    const get=key=>JSON.parse(snapshot.prepare('SELECT value FROM metadata WHERE key=?').get(key).value);
    previous=prepareDataset(snapshot.prepare('SELECT * FROM documents ORDER BY url').all(),snapshot.prepare('SELECT * FROM chunks ORDER BY url,rowid').all(),{source:get('site'),indexedAt:get('indexedAt'),embeddingModel:get('embeddingModel')});
  } finally {snapshot.close();}
}
const unchanged=new Map((previous?.chunks||[]).map(c=>[c.id,c]));
const schema=await readFile(new URL('../supabase/chatbot.sql',import.meta.url),'utf8');
const rpc=await readFile(new URL('../supabase/read-index.sql',import.meta.url),'utf8');
const guard=`DO $guard$ BEGIN
  IF (SELECT obj_description(oid,'pg_namespace') FROM pg_namespace WHERE nspname='tremplin_chatbot') IS DISTINCT FROM 'Tremplin En coulisses RAG schema v1' THEN RAISE EXCEPTION 'Schéma du chatbot absent ou non reconnu : import annulé'; END IF;
  IF EXISTS (SELECT 1 FROM tremplin_chatbot.datasets WHERE indexed_at > ${quote(meta.indexedAt)}::timestamptz) THEN RAISE EXCEPTION 'Un index plus récent existe déjà : import annulé'; END IF;
END $guard$;`;
const lines=["BEGIN; SET LOCAL lock_timeout='5s'; SET LOCAL statement_timeout='30s'; SET LOCAL standard_conforming_strings=on;",
  "SELECT pg_advisory_xact_lock(hashtext('tremplin_chatbot_publish'));",append?guard:schema,
  `INSERT INTO tremplin_chatbot.datasets(id,source,indexed_at,embedding_model,document_count,chunk_count) VALUES (${[id,meta.source,meta.indexedAt,meta.embeddingModel,documents.length,chunks.length].map(quote).join(',')}) ON CONFLICT(id) DO NOTHING;`];
for(const d of documents)lines.push(`INSERT INTO tremplin_chatbot.documents(dataset_id,url,title,content,content_hash,fetched_at) VALUES (${[id,d.url,d.title,d.text,d.hash,d.fetched_at].map(quote).join(',')}) ON CONFLICT(dataset_id,url) DO NOTHING;`);
for(const c of chunks) {
  const old=unchanged.get(c.id);
  if(old && old.embedding===c.embedding && old.embedding_model===c.embedding_model) {
    lines.push(`INSERT INTO tremplin_chatbot.chunks(dataset_id,id,url,title,content,position,embedding,embedding_model) SELECT ${quote(id)},id,url,title,content,${c.position},embedding,embedding_model FROM tremplin_chatbot.chunks WHERE dataset_id=${quote(previous.id)} AND id=${quote(c.id)} ON CONFLICT(dataset_id,id) DO NOTHING;`);
  } else {
    lines.push(`INSERT INTO tremplin_chatbot.chunks(dataset_id,id,url,title,content,position,embedding,embedding_model) VALUES (${[id,c.id,c.url,c.title,c.text,c.position].map(quote).join(',')},${quote(`{${c.vector.join(',')}}`)}::real[],${quote(c.embedding_model)}) ON CONFLICT(dataset_id,id) DO NOTHING;`);
  }
}
lines.push(`DO $verify$ BEGIN
  IF (SELECT count(*) FROM tremplin_chatbot.documents WHERE dataset_id=${quote(id)}) <> ${documents.length}
    OR (SELECT count(*) FROM tremplin_chatbot.chunks WHERE dataset_id=${quote(id)} AND embedding IS NOT NULL) <> ${chunks.length}
    THEN RAISE EXCEPTION 'Import incomplet : transaction annulée'; END IF;
END $verify$;`);
if(!append)lines.push(rpc);
lines.push('COMMIT;',`SELECT ${quote(id)} AS dataset_id,(SELECT count(*) FROM tremplin_chatbot.documents WHERE dataset_id=${quote(id)}) AS documents,(SELECT count(*) FROM tremplin_chatbot.chunks WHERE dataset_id=${quote(id)}) AS chunks,(SELECT count(*) FROM tremplin_chatbot.datasets) AS versions_conservees,(SELECT count(*) FROM pg_tables WHERE schemaname='public') AS existing_public_tables,md5((SELECT string_agg(table_name||'.'||column_name||':'||data_type,',' ORDER BY table_name,ordinal_position) FROM information_schema.columns WHERE table_schema='public')) AS public_structure_fingerprint;`);
await mkdir('artifacts',{recursive:true});
await writeFile(`artifacts/supabase-${append?'append':'initial-import'}.sql`,lines.join('\n'));
console.log(`SQL ${append?'ajout de version':'initial'} prêt : ${documents.length} documents, ${chunks.length} passages. Aucun remplacement ni secret inclus.`);
