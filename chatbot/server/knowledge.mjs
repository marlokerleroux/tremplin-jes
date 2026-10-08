import { db, metadata, stats } from './db.mjs';
import { remoteKnowledge, supabaseEnabled } from './supabase.mjs';

export async function knowledge(queryTerms) {
  if (supabaseEnabled()) return remoteKnowledge(queryTerms);
  return {
    chunks: db.prepare('SELECT * FROM chunks').all(),
    lexical: queryTerms.length ? db.prepare('SELECT id,bm25(chunks_fts,0,2,1) AS rank FROM chunks_fts WHERE chunks_fts MATCH ? ORDER BY rank LIMIT 20').all(queryTerms.map(t => `"${t}"*`).join(' OR ')) : [],
    embeddingModel: metadata('embeddingModel'), indexedAt: metadata('indexedAt'),
  };
}

export async function knowledgeStats() {
  return supabaseEnabled() ? (await remoteKnowledge()).stats : { ...stats(), storage: 'sqlite' };
}
