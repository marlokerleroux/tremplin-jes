import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const marker = 'Tremplin En coulisses RAG schema v1';
export function prepareDataset(documents, chunks, meta) {
  if (!documents.length || !chunks.length || !meta.indexedAt || !meta.source || meta.embeddingModel !== 'openai/text-embedding-3-small') throw new Error('Index incomplet ou modèle d’embedding incompatible.');
  const urls = new Set(documents.map(doc => doc.url));
  const allowed = new URL(meta.source).hostname;
  for (const document of documents) {
    const url = new URL(document.url);
    if (url.protocol !== 'https:' || url.hostname !== allowed || !document.text || !document.hash) throw new Error('Document non public ou invalide.');
  }
  const prepared = chunks.map((chunk, position) => {
    const embedding = JSON.parse(chunk.embedding);
    if (!urls.has(chunk.url) || !chunk.text || !Array.isArray(embedding) || embedding.length !== 1536 || embedding.some(x => !Number.isFinite(x))) throw new Error('Passage ou vecteur invalide.');
    if (chunk.embedding_model !== meta.embeddingModel) throw new Error('Modèle d’embedding incohérent.');
    return { ...chunk, position, vector: embedding };
  });
  const id = createHash('sha256').update(JSON.stringify({ documents, chunks: prepared, meta })).digest('hex');
  return { id, documents, chunks: prepared, meta };
}

export async function publishKnowledge(client, dataset) {
  await client.query('BEGIN');
  try {
    await client.query("SELECT pg_advisory_xact_lock(hashtext('tremplin_chatbot_publish'))");
    const { rows: [existing] } = await client.query("SELECT obj_description(oid,'pg_namespace') AS marker FROM pg_namespace WHERE nspname='tremplin_chatbot'");
    if (existing && existing.marker !== marker) throw new Error('Le schéma tremplin_chatbot existe déjà sans notre signature : aucune écriture autorisée.');
    if (!existing) await client.query(await readFile(new URL('../supabase/chatbot.sql', import.meta.url), 'utf8'));
    const { id, documents, chunks, meta } = dataset;
    const inserted = await client.query(`INSERT INTO tremplin_chatbot.datasets(id,source,indexed_at,embedding_model,document_count,chunk_count)
      VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(id) DO NOTHING RETURNING id`,
    [id, meta.source, meta.indexedAt, meta.embeddingModel, documents.length, chunks.length]);
    if (inserted.rowCount) {
      for (const d of documents) await client.query(`INSERT INTO tremplin_chatbot.documents(dataset_id,url,title,content,content_hash,fetched_at) VALUES($1,$2,$3,$4,$5,$6)`, [id,d.url,d.title,d.text,d.hash,d.fetched_at]);
      for (const c of chunks) await client.query(`INSERT INTO tremplin_chatbot.chunks(dataset_id,id,url,title,content,position,embedding,embedding_model) VALUES($1,$2,$3,$4,$5,$6,$7,$8)`, [id,c.id,c.url,c.title,c.text,c.position,c.vector,c.embedding_model]);
    }
    const { rows: [counts] } = await client.query(`SELECT
      (SELECT count(*)::int FROM tremplin_chatbot.documents WHERE dataset_id=$1) AS documents,
      (SELECT count(*)::int FROM tremplin_chatbot.chunks WHERE dataset_id=$1) AS chunks`, [id]);
    if (counts.documents !== documents.length || counts.chunks !== chunks.length) throw new Error('Version existante incohérente : import annulé sans remplacement.');
    await client.query('COMMIT');
    return { datasetId: id, inserted: !!inserted.rowCount, ...counts };
  } catch (error) { await client.query('ROLLBACK').catch(() => {}); throw error; }
}
