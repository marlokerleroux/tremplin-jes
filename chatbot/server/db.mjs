import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { dataDir } from './config.mjs';
mkdirSync(dataDir, { recursive: true });
export const db = new Database(process.env.RAG_DB || path.join(dataDir, 'knowledge.sqlite'));
db.exec(`PRAGMA journal_mode=WAL;
CREATE TABLE IF NOT EXISTS documents (url TEXT PRIMARY KEY,title TEXT NOT NULL,text TEXT NOT NULL,hash TEXT NOT NULL,fetched_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS chunks (id TEXT PRIMARY KEY,url TEXT NOT NULL,title TEXT NOT NULL,text TEXT NOT NULL,embedding TEXT,embedding_model TEXT,FOREIGN KEY(url) REFERENCES documents(url));
CREATE VIRTUAL TABLE IF NOT EXISTS chunks_fts USING fts5(id UNINDEXED,title,text,tokenize='unicode61 remove_diacritics 2');
CREATE TABLE IF NOT EXISTS metadata (key TEXT PRIMARY KEY,value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS usage_daily (day TEXT PRIMARY KEY,requests INTEGER NOT NULL DEFAULT 0);`);
export function metadata(key, value) {
  if (value !== undefined) db.prepare('INSERT OR REPLACE INTO metadata VALUES (?,?)').run(key, JSON.stringify(value));
  const result = db.prepare('SELECT value FROM metadata WHERE key=?').get(key);
  return result ? JSON.parse(result.value) : null;
}
export function stats() {
  return { documents: db.prepare('SELECT count(*) as n FROM documents').get().n,
    chunks: db.prepare('SELECT count(*) as n FROM chunks').get().n,
    embeddings: db.prepare('SELECT count(*) as n FROM chunks WHERE embedding IS NOT NULL').get().n,
    indexedAt: metadata('indexedAt'), source: metadata('site') };
}
export function reserveRequest(limit) {
  const day = new Date().toISOString().slice(0,10);
  const result = db.prepare('INSERT INTO usage_daily(day,requests) VALUES (?,1) ON CONFLICT(day) DO UPDATE SET requests=requests+1 WHERE requests < ? RETURNING requests').get(day,limit);
  return !!result;
}
