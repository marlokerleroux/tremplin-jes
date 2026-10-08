// Real database checks, restricted to the dedicated localhost preview cluster.
import pg from 'pg';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { db, metadata } from '../server/db.mjs';
import { prepareDataset, publishKnowledge } from '../server/publish-knowledge.mjs';
import { remoteKnowledge, closeSupabase } from '../server/supabase.mjs';

const target = new URL(process.env.CHATBOT_TEST_DB_URL || 'postgresql://invalid');
if (target.hostname !== '127.0.0.1' || target.port !== '54329' || target.pathname !== '/tremplin_local') throw new Error('Tests réservés au cluster local de prévisualisation sur 127.0.0.1:54329.');
const admin = new pg.Client({ connectionString: target.toString() });
const name = `chatbot_test_${randomUUID().replaceAll('-', '')}`;
let client, created = false;
try {
  await admin.connect();
  await admin.query(`CREATE DATABASE ${name}`); created = true;
  target.pathname = `/${name}`;
  client = new pg.Client({ connectionString: target.toString() }); await client.connect();
  await client.query('CREATE TABLE public.sentinel (id integer PRIMARY KEY, value text); INSERT INTO public.sentinel VALUES (1,\'keep me\')');
  const dataset = prepareDataset(db.prepare('SELECT * FROM documents ORDER BY url').all(), db.prepare('SELECT * FROM chunks ORDER BY url,rowid').all(), {
    source: metadata('site'), indexedAt: metadata('indexedAt'), embeddingModel: metadata('embeddingModel'),
  });
  assert.equal((await publishKnowledge(client, dataset)).inserted, true);
  assert.equal((await publishKnowledge(client, dataset)).inserted, false);
  assert.equal((await client.query('SELECT count(*)::int AS n FROM tremplin_chatbot.datasets')).rows[0].n, 1);
  // A failed new import must not leave a partial dataset or touch the active one.
  await assert.rejects(publishKnowledge(client, { ...dataset, id: 'invalid-fixture', chunks: [...dataset.chunks,dataset.chunks[0]] }));
  assert.equal((await client.query('SELECT count(*)::int AS n FROM tremplin_chatbot.datasets')).rows[0].n, 1);
  assert.deepEqual((await client.query('SELECT * FROM public.sentinel')).rows, [{ id: 1, value: 'keep me' }]);
  assert.ok((await client.query("SELECT relrowsecurity FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='tremplin_chatbot' AND c.relkind='r'")).rows.every(x => x.relrowsecurity));
  process.env.SUPABASE_DB_URL = target.toString();
  const index = await remoteKnowledge(['auditions', 'brest']);
  assert.equal(index.chunks.length, dataset.chunks.length);
  assert.equal(index.stats.documents, dataset.documents.length);
  assert.ok(index.lexical.length > 0);
  assert.equal(JSON.parse(index.chunks[0].embedding).length, 1536);
  console.log('PostgreSQL : import, relance sans doublon, rollback, isolation, RLS et recherche validés.');
} finally {
  await closeSupabase(); await client?.end();
  if (created) await admin.query(`DROP DATABASE ${name}`); // Only this run's disposable database.
  await admin.end();
}
