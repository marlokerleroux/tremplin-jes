import { writeFile, mkdir } from 'node:fs/promises';
import { db, metadata } from '../server/db.mjs';
import { supabasePool, closeSupabase } from '../server/supabase.mjs';
import { prepareDataset, publishKnowledge } from '../server/publish-knowledge.mjs';

const mode = process.argv[2] || 'inspect';
if (!['inspect', 'push'].includes(mode)) throw new Error('Utilisation : supabase.mjs inspect|push');
let client;
try {
  client = await supabasePool().connect();
  // Only metadata is read from the site's existing schemas, never candidate data.
  const inventory = () => client.query(`SELECT n.nspname AS schema,c.relname AS name,c.relkind AS kind,
    a.attname AS column,format_type(a.atttypid,a.atttypmod) AS type
    FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    LEFT JOIN pg_attribute a ON a.attrelid=c.oid AND a.attnum>0 AND NOT a.attisdropped
    WHERE n.nspname NOT IN ('pg_catalog','information_schema','tremplin_chatbot') AND n.nspname NOT LIKE 'pg_toast%'
    AND c.relkind IN ('r','p','v','m') ORDER BY 1,2,4`);
  const before = (await inventory()).rows;
  console.log('Connexion PostgreSQL chiffrée vérifiée. Tables existantes :', [...new Set(before.map(x => `${x.schema}.${x.name}`))]);
  if (mode === 'push') {
    const dataset = prepareDataset(db.prepare('SELECT * FROM documents ORDER BY url').all(),db.prepare('SELECT * FROM chunks ORDER BY url,rowid').all(), {
      source: metadata('site'), indexedAt: metadata('indexedAt'), embeddingModel: metadata('embeddingModel'),
    });
    const result = await publishKnowledge(client, dataset);
    const after = (await inventory()).rows;
    const untouched = JSON.stringify(before) === JSON.stringify(after);
    const report = { ...result, schema: 'tremplin_chatbot', existingStructureUnchanged: untouched, publishedAt: new Date().toISOString() };
    await mkdir('artifacts', { recursive: true });
    await writeFile('artifacts/supabase-publish.json', JSON.stringify(report,null,2));
    console.log(report);
    if (!untouched) throw new Error('Une structure hors chatbot a changé pendant l’import ; vérifier les changements concurrents.');
  }
} catch (error) {
  // Connection URLs and database passwords must never reach command logs.
  console.error('Supabase:', ['ENOTFOUND','ENETUNREACH','EHOSTUNREACH','28P01','DEPTH_ZERO_SELF_SIGNED_CERT','SELF_SIGNED_CERT_IN_CHAIN','UNABLE_TO_VERIFY_LEAF_SIGNATURE'].includes(error.code) ? error.code : String(error.message).replace(/postgres(?:ql)?:\/\/\S+/g,'[connexion masquée]'));
  process.exitCode = 1;
} finally { client?.release(); await closeSupabase(); }
