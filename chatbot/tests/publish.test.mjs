import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareDataset, publishKnowledge } from '../server/publish-knowledge.mjs';

const documents = [{ url: 'https://www.tremplin-jeunes-en-scene.fr/', title: 'Tremplin', text: 'Auditions à Brest', hash: 'abc', fetched_at: '2026-10-08T08:00:00Z' }];
const chunks = [{ id: 'abc', url: documents[0].url, title: 'Tremplin', text: 'Auditions à Brest', embedding: JSON.stringify(Array(1536).fill(0.1)), embedding_model: 'openai/text-embedding-3-small' }];
const meta = { source: documents[0].url, indexedAt: '2026-10-08T08:00:00Z', embeddingModel: chunks[0].embedding_model };

test('dataset IDs are stable and change with source content or vectors', () => {
  const a = prepareDataset(documents, chunks, meta);
  assert.equal(a.id, prepareDataset(documents, chunks, meta).id);
  assert.notEqual(a.id, prepareDataset([{ ...documents[0], text: 'Nouvelle version' }], chunks, meta).id);
});
test('publishing refuses missing, external, inconsistent or malformed index data', () => {
  assert.throws(() => prepareDataset([], chunks, meta));
  assert.throws(() => prepareDataset([{ ...documents[0], url: 'https://example.com/' }], chunks, meta));
  assert.throws(() => prepareDataset(documents, [{ ...chunks[0], embedding: '[1,2]' }], meta));
  assert.throws(() => prepareDataset(documents, [{ ...chunks[0], url: 'https://example.com/' }], meta));
  assert.throws(() => prepareDataset(documents, chunks, { ...meta, embeddingModel: 'other-model' }));
});
test('a pre-existing foreign schema is left untouched and the transaction rolls back', async () => {
  const statements = [];
  const client = { query: async sql => {
    statements.push(sql);
    return { rows: sql.includes('pg_namespace') ? [{ marker: 'Owned by another application' }] : [] };
  } };
  await assert.rejects(publishKnowledge(client, prepareDataset(documents, chunks, meta)), /existe déjà/);
  assert.equal(statements.at(-1), 'ROLLBACK');
  assert.ok(statements.every(sql => !/^(CREATE|INSERT|UPDATE|DELETE|DROP|ALTER)/.test(sql)));
});
