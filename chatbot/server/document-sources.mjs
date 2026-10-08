import { readFile } from 'node:fs/promises';
import { hash, chunkText } from './content.mjs';

// Internal references identify supplied documents without exposing a local path
// or inventing a public download URL.
export function isDocumentReference(value) {
  return /^document:\/\/tremplin\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

export async function suppliedDocuments() {
  const docs = JSON.parse(await readFile(new URL('../knowledge/documents.json', import.meta.url), 'utf8'));
  const seen = new Set();
  for (const doc of docs) {
    if (!isDocumentReference(doc.url) || seen.has(doc.url) || !doc.title || !doc.context || !doc.text || !doc.sourceFile || !doc.fetchedAt) throw new Error('Document fourni incomplet ou dupliqué.');
    seen.add(doc.url);
    doc.hash = hash(doc.text);
  }
  return docs;
}

export function documentChunks(doc) {
  return chunkText(doc.text).map((body, position) => {
    // Repeat edition/provenance on every passage, including middle/end chunks.
    const text = doc.context ? `Contexte de la source : ${doc.context}\n\n${body}` : body;
    return { id: hash(`${doc.url}:${doc.title}:${text}`), url: doc.url, title: doc.title, text, position };
  });
}
