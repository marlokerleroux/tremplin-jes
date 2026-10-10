import test from 'node:test';
import assert from 'node:assert/strict';
import { suppliedDocuments, documentChunks, isDocumentReference } from '../server/document-sources.mjs';
import { prepareDataset } from '../server/publish-knowledge.mjs';

test('all four supplied documents retain provenance and archive context on every passage', async () => {
  const docs = await suppliedDocuments();
  assert.equal(docs.length, 4);
  for (const d of docs) {
    assert.match(d.sourceSha256, /^[a-f0-9]{64}$/);
    const chunks = documentChunks(d);
    assert.ok(chunks.length);
    assert.ok(chunks.every(c => c.text.startsWith(`Contexte de la source : ${d.context}`)));
  }
  assert.match(docs.find(d => d.url.endsWith('2024-2025')).context, /Archive 2024/);
});

test('discarded document dates cannot reenter retrieval after reindexing', async () => {
  const docs = await suppliedDocuments();
  const text = docs.flatMap(documentChunks).map(c => c.text).join('\n');
  assert.doesNotMatch(text, /15 octobre|22 et le 23 janvier|dimanche 23 janvier|8 mai 2027|avril ou mai 2027|janvier ou février 2027|31 décembre 2024|08\/02\/25/);
  assert.match(text, /clé USB/);
  assert.match(text, /Qualité artistique/);
  assert.match(text, /Potentiel/);
});

test('document identifiers can be published without allowing file paths or arbitrary URLs', async () => {
  const [doc] = await suppliedDocuments();
  const chunks = documentChunks(doc).map(c => ({ ...c, embedding: JSON.stringify(Array(1536).fill(.1)), embedding_model: 'openai/text-embedding-3-small' }));
  const meta = { source: 'https://www.tremplin-jeunes-en-scene.fr', indexedAt: '2026-10-08T12:00:00Z', embeddingModel: chunks[0].embedding_model };
  assert.ok(prepareDataset([doc], chunks, meta).id);
  for (const url of ['file:///Users/private.docx', 'document://evil/path', 'document://tremplin/../secret', 'javascript:alert(1)', 'https://example.com/source']) {
    assert.equal(isDocumentReference(url), false);
    assert.throws(() => prepareDataset([{ ...doc, url }], chunks, meta));
  }
});
