import pg from 'pg';
import { readFileSync } from 'node:fs';

let pool;
export function supabasePool() {
  if (pool) return pool;
  const connectionString = process.env.SUPABASE_DB_URL;
  if (!connectionString) throw new Error('SUPABASE_DB_URL manquant dans le fichier local de secrets.');
  const url = new URL(connectionString);
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  // TLS is mandatory remotely; never accept a URL disabling certificate checks.
  for (const key of ['sslmode', 'sslcert', 'sslkey', 'sslrootcert']) url.searchParams.delete(key);
  pool = new pg.Pool({
    connectionString: url.toString(), max: 3, connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 15000, statement_timeout: 15000,
    ssl: local ? false : {
      rejectUnauthorized: true,
      ...(process.env.SUPABASE_CA_FILE ? { ca: readFileSync(process.env.SUPABASE_CA_FILE, 'utf8') } : {}),
    },
  });
  pool.on('error', error => console.error('Supabase:', error.code || 'CONNECTION_ERROR'));
  return pool;
}

export async function closeSupabase() { if (pool) { await pool.end(); pool = undefined; } }

export async function remoteKnowledge(queryTerms = []) {
  if (process.env.SUPABASE_TRANSPORT === 'rest') {
    const url = new URL(process.env.SUPABASE_URL || 'https://invalid');
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (url.protocol !== 'https:' || !url.hostname.endsWith('.supabase.co') || !key) throw new Error('Configuration Supabase serveur manquante.');
    const response = await fetch(`${url.origin}/rest/v1/rpc/tremplin_chatbot_read_index`, {
      method: 'POST', headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query_terms: queryTerms.map(term => `${term}:*`).join(' | ') }), signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) { await response.body?.cancel(); throw new Error(`SUPABASE_${response.status}`); }
    const result = await response.json();
    if (!result?.chunks?.length) throw new Error('EMPTY_KNOWLEDGE');
    return result;
  }
  const connection = await supabasePool().connect();
  try {
    await connection.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
    const { rows: [dataset] } = await connection.query(`SELECT id, indexed_at, source, embedding_model, document_count, chunk_count
      FROM tremplin_chatbot.datasets ORDER BY created_at DESC, id DESC LIMIT 1`);
    if (!dataset) throw new Error('EMPTY_KNOWLEDGE');
    const { rows: chunks } = await connection.query(`SELECT id,url,title,content AS text,to_json(embedding)::text AS embedding,embedding_model
      FROM tremplin_chatbot.chunks WHERE dataset_id=$1 ORDER BY position,id`, [dataset.id]);
    const lexical = queryTerms.length ? (await connection.query(`SELECT id FROM tremplin_chatbot.chunks
      WHERE dataset_id=$1 AND search @@ to_tsquery('french',$2)
      ORDER BY ts_rank_cd(search,to_tsquery('french',$2)) DESC,id LIMIT 20`,
    [dataset.id, queryTerms.map(term => `${term}:*`).join(' | ')])).rows : [];
    await connection.query('COMMIT');
    return { chunks, lexical, embeddingModel: dataset.embedding_model, indexedAt: dataset.indexed_at,
      stats: { documents: dataset.document_count, chunks: dataset.chunk_count, embeddings: chunks.filter(x => x.embedding).length,
        indexedAt: dataset.indexed_at, source: dataset.source, storage: 'supabase' } };
  } catch (error) { await connection.query('ROLLBACK').catch(() => {}); throw error; }
  finally { connection.release(); }
}

export function supabaseEnabled() { return process.env.RAG_BACKEND === 'supabase'; }
