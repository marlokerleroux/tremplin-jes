import { readFile,writeFile } from 'node:fs/promises';
import path from 'node:path';
import { db,metadata,stats } from '../server/db.mjs';
import { config,dataDir } from '../server/config.mjs';
import { hash,chunkText } from '../server/content.mjs';
import { embed } from '../server/provider.mjs';
const docs=JSON.parse(await readFile(path.join(dataDir,'documents.json'),'utf8'));
const crawl=JSON.parse(await readFile(path.join(dataDir,'crawl-report.json'),'utf8'));
const chunks=docs.flatMap(doc=>chunkText(doc.text).map((text,i)=>({id:hash(`${doc.url}:${doc.title}:${text}`),url:doc.url,title:doc.title,text,position:i})));
const old=new Map(db.prepare('SELECT id,embedding,embedding_model FROM chunks').all().map(x=>[x.id,x]));
const missing=chunks.filter(x=>!old.get(x.id)?.embedding||old.get(x.id)?.embedding_model!==config.embedding);
for(let i=0;i<missing.length;i+=24) {
  const batch=missing.slice(i,i+24);
  const vectors=await embed(batch.map(x=>`${x.title}\n${x.text}`));
  batch.forEach((x,n)=>old.set(x.id,{embedding:JSON.stringify(vectors[n]),embedding_model:config.embedding}));
  console.log(`Embeddings : ${Math.min(i+24,missing.length)}/${missing.length}`);
}
db.exec('BEGIN IMMEDIATE');
try {
  // A partial crawl must never erase previously indexed pages.
  if(crawl.complete){db.exec('DELETE FROM chunks_fts; DELETE FROM chunks; DELETE FROM documents;');}
  const insertDoc=db.prepare('INSERT OR REPLACE INTO documents VALUES (?,?,?,?,?)');
  const insertChunk=db.prepare('INSERT OR REPLACE INTO chunks VALUES (?,?,?,?,?,?)');
  const insertFts=db.prepare('INSERT INTO chunks_fts(id,title,text) VALUES (?,?,?)');
  for(const doc of docs) {
    if(!crawl.complete){db.prepare('DELETE FROM chunks_fts WHERE id IN (SELECT id FROM chunks WHERE url=?)').run(doc.url);db.prepare('DELETE FROM chunks WHERE url=?').run(doc.url);}
    insertDoc.run(doc.url,doc.title,doc.text,doc.hash,doc.fetchedAt);
  }
  for(const x of chunks){const v=old.get(x.id);insertChunk.run(x.id,x.url,x.title,x.text,v.embedding,v.embedding_model);insertFts.run(x.id,x.title,x.text);}
  metadata('site',config.site);metadata('indexedAt',new Date().toISOString());metadata('embeddingModel',config.embedding);metadata('crawlComplete',crawl.complete);
  db.exec('COMMIT');
}catch(e){db.exec('ROLLBACK');throw e;}
const report={...stats(),model:config.embedding,newEmbeddings:missing.length,crawlComplete:crawl.complete};
await writeFile(path.join(dataDir,'index-report.json'),JSON.stringify(report,null,2));console.log(report);
