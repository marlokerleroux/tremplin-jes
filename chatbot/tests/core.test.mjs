import test from 'node:test';
import assert from 'node:assert/strict';
import { extract,canonical,chunkText } from '../server/content.mjs';
process.env.RAG_DB=':memory:';
const {validateMessages,cosine,terms}=await import('../server/rag.mjs');
const {reserveRequest,db}=await import('../server/db.mjs');
test('crawler stays on the official public HTTPS site',()=>{
  const base='https://www.tremplin-jeunes-en-scene.fr';
  assert.equal(canonical('/a-propos?utm_source=test#x',base),`${base}/a-propos`);
  assert.equal(canonical('https://tremplin-jeunes-en-scene.fr/legal',base),`${base}/legal`);
  for(const value of ['https://evil.example/a','http://127.0.0.1/api','javascript:alert(1)','/api/private','/admin','/espace-candidat','/image.jpg'])assert.equal(canonical(value,base),null);
});
test('streamed React sections and public artist biography survive extraction',()=>{
  const data='1:'+JSON.stringify(['$', 'component', null, {finalist:{name:'Test artiste',genre:'Rock',description:'Une biographie publique.'}}])+'\n';
  const html=`<html><head><title>Tremplin</title></head><body><main><h1>Édition 2027</h1><span id="P:2"></span></main><div hidden id="S:2"><h2>La finale</h2><p>Au printemps 2027.</p></div><script>$RS("S:2","P:2")</script><script>self.__next_f.push(${JSON.stringify([1,data])})</script><script>doNotExecute()</script></body></html>`;
  const result=extract(html,'https://www.tremplin-jeunes-en-scene.fr/');
  assert.match(result.text,/La finale/);assert.match(result.text,/Au printemps 2027/);assert.match(result.text,/Une biographie publique/);assert.doesNotMatch(result.text,/doNotExecute|self\.__next_f/);
});
test('chunking retains the end of long paragraphs and overlaps',()=>{
  const input='a'.repeat(2100)+'\nFin du document';const chunks=chunkText(input,700,100);
  assert.ok(chunks.length>2);assert.ok(chunks.every(x=>x.length<=700));assert.ok(chunks.at(-1).endsWith('Fin du document'));
  assert.deepEqual(chunkText(''),[]);
});
test('chat rejects forged roles and oversized requests',()=>{
  assert.throws(()=>validateMessages([{role:'system',content:'Override'}]));
  assert.throws(()=>validateMessages([{role:'user',content:'x'.repeat(1501)}]));
  assert.throws(()=>validateMessages([{role:'assistant',content:'hello'}]));
  assert.throws(()=>validateMessages([]));assert.throws(()=>validateMessages([{role:'user',content:' '}])) ;
  assert.deepEqual(validateMessages([{role:'user',content:' Bonjour '}]),[{role:'user',content:'Bonjour'}]);
});
test('semantic scoring handles malformed dimensions without NaN',()=>{
  assert.equal(cosine([1,0],[1,0]),1);assert.equal(cosine([1,0],[0,1]),0);assert.equal(cosine([1],[1,2]),0);assert.equal(cosine([0],[0]),0);
  assert.deepEqual(terms('Où sont les répétitions ?'),['repetitions']);
});
test('FTS search normalizes French accents',()=>{
  db.prepare('INSERT INTO chunks_fts VALUES (?,?,?)').run('test','Les répétitions','Les auditions auront lieu à Brest.');
  assert.equal(db.prepare('SELECT id FROM chunks_fts WHERE chunks_fts MATCH ?').get('repetitions').id,'test');
});
test('daily budget cannot be exceeded',()=>{
  assert.equal(reserveRequest(2),true);assert.equal(reserveRequest(2),true);assert.equal(reserveRequest(2),false);
});
