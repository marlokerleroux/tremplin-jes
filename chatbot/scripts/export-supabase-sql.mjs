import { readFile,writeFile,mkdir } from 'node:fs/promises';
import { db,metadata } from '../server/db.mjs';
import { prepareDataset } from '../server/publish-knowledge.mjs';

const dataset=prepareDataset(db.prepare('SELECT * FROM documents ORDER BY url').all(),db.prepare('SELECT * FROM chunks ORDER BY url,rowid').all(),{
  source:metadata('site'),indexedAt:metadata('indexedAt'),embeddingModel:metadata('embeddingModel'),
});
const quote=value=>`'${String(value).replaceAll("'","''")}'`;
const {id,documents,chunks,meta}=dataset;
const schema=await readFile(new URL('../supabase/chatbot.sql',import.meta.url),'utf8');
const rpc=await readFile(new URL('../supabase/read-index.sql',import.meta.url),'utf8');
const lines=["BEGIN; SET LOCAL lock_timeout='5s'; SET LOCAL statement_timeout='30s'; SET LOCAL standard_conforming_strings=on;",schema,
  `INSERT INTO tremplin_chatbot.datasets(id,source,indexed_at,embedding_model,document_count,chunk_count) VALUES (${[id,meta.source,meta.indexedAt,meta.embeddingModel,documents.length,chunks.length].map(quote).join(',')});`];
for(const d of documents)lines.push(`INSERT INTO tremplin_chatbot.documents(dataset_id,url,title,content,content_hash,fetched_at) VALUES (${[id,d.url,d.title,d.text,d.hash,d.fetched_at].map(quote).join(',')});`);
for(const c of chunks)lines.push(`INSERT INTO tremplin_chatbot.chunks(dataset_id,id,url,title,content,position,embedding,embedding_model) VALUES (${[id,c.id,c.url,c.title,c.text,c.position].map(quote).join(',')},${quote(`{${c.vector.join(',')}}`)}::real[],${quote(c.embedding_model)});`);
lines.push(rpc,'COMMIT;',`SELECT (SELECT count(*) FROM tremplin_chatbot.documents) AS documents,(SELECT count(*) FROM tremplin_chatbot.chunks) AS chunks,(SELECT count(*) FROM pg_tables WHERE schemaname='public') AS existing_public_tables,md5((SELECT string_agg(table_name||'.'||column_name||':'||data_type,',' ORDER BY table_name,ordinal_position) FROM information_schema.columns WHERE table_schema='public')) AS public_structure_fingerprint;`);
await mkdir('artifacts',{recursive:true});
await writeFile('artifacts/supabase-initial-import.sql',lines.join('\n'));
console.log(`SQL initial prêt : ${documents.length} documents, ${chunks.length} passages. Échec volontaire si le schéma ou la fonction existe déjà. Aucun secret inclus.`);
