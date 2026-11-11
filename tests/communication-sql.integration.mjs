import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const { PGlite } = await import(process.env.PGLITE_TEST_MODULE || '@electric-sql/pglite');

test('private communication database: migration, history, corrections and quotas', async () => {
  const db=new PGlite();
  try {
    await db.exec("CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role; CREATE SCHEMA tremplin_chatbot; COMMENT ON SCHEMA tremplin_chatbot IS 'Tremplin En coulisses RAG schema v1'; CREATE TABLE public.existing_site(id int); INSERT INTO public.existing_site VALUES(42);");
    const sql=await readFile(new URL('../chatbot/supabase/communication.sql',import.meta.url),'utf8');
    await db.exec(sql);
    const rpc=async(action,payload={})=>(await db.query('SELECT public.tremplin_communication($1,$2) value',[action,JSON.stringify(payload)])).rows[0].value;
    const first='00000000-0000-4000-8000-000000000001',second='00000000-0000-4000-8000-000000000002',manual='00000000-0000-4000-8000-000000000003',otherManual='00000000-0000-4000-8000-000000000004';
    assert.equal((await rpc('dashboard',{days:30})).stats.total,0);
    await rpc('record',{id:first,question:'Peut-on participer en duo ?',answer:'Je ne sais pas.',status:'unanswered',topic:'Éligibilité',sources:[]});
    await rpc('record',{id:second,question:'Peut-on participer en duo ?',answer:'',status:'error',topic:'Éligibilité',sources:[]});
    let d=await rpc('dashboard',{days:30,status:'pending'});
    assert.equal(d.stats.unanswered,2);assert.equal(d.total,2);assert.equal(d.recurring[0].count,2);
    const answer={id:manual,questionId:first,answer:'Les duos sont acceptés.',embedding:Array(1536).fill(.1),embeddingModel:'test-model'};
    await rpc('answer',answer);
    d=await rpc('dashboard',{days:30,status:'pending'});assert.equal(d.total,0);assert.equal(d.stats.corrected,2);
    assert.equal((await rpc('question',{id:second})).validatedAnswer,answer.answer);
    let chunks=await rpc('manuals',{query:'duo:*'});assert.equal(chunks.length,1);assert.equal(chunks[0].lexical,true);assert.match(chunks[0].url,/^document:\/\//);
    await rpc('answer',{...answer,id:otherManual,questionId:second,answer:'Nouvelle précision validée.'});
    chunks=await rpc('manuals');assert.equal(chunks.length,1);assert.match(chunks[0].text,/Nouvelle précision/);
    await rpc('deactivate_answer',{id:otherManual});assert.equal((await rpc('manuals')).length,0);
    assert.equal((await rpc('dashboard',{days:30,status:'pending'})).total,2);
    assert.equal((await rpc('dashboard',{days:30,search:'%'})).total,0);
    for(let i=0;i<5;i++)assert.equal(await rpc('login_attempt',{key:'test'}),true);
    assert.equal(await rpc('login_attempt',{key:'test'}),false);
    for(let i=0;i<5;i++)assert.equal(await rpc('ai_attempt'),true);
    assert.equal(await rpc('ai_attempt'),false);
    await rpc('save_draft',{id:manual,title:'Titre',body:'Texte',format:'Instagram',status:'draft',questionIds:[first]});
    await rpc('save_draft',{id:manual,title:'Titre corrigé',body:'Texte corrigé',format:'Instagram',status:'ready',questionIds:[first]});
    assert.equal((await rpc('dashboard',{days:0})).drafts[0].status,'ready');
    await db.exec(sql); // installation is repeatable without replacing site data
    assert.deepEqual((await db.query('SELECT * FROM public.existing_site')).rows,[{id:42}]);
    assert.equal((await rpc('dashboard',{days:0})).stats.total,2);
    const rights=await db.query("SELECT has_function_privilege('anon','public.tremplin_communication(text,jsonb)','execute') anon,has_function_privilege('authenticated','public.tremplin_communication(text,jsonb)','execute') authenticated,has_function_privilege('service_role','public.tremplin_communication(text,jsonb)','execute') service");
    assert.deepEqual(rights.rows[0],{anon:false,authenticated:false,service:true});
    await db.exec('SET ROLE anon');
    await assert.rejects(()=>db.query("SELECT public.tremplin_communication('dashboard')"));
    await assert.rejects(()=>db.query('SELECT * FROM tremplin_chatbot.communication_questions'));
    await db.exec("RESET ROLE; COMMENT ON TABLE tremplin_chatbot.communication_questions IS 'Unrelated owner';");
    await assert.rejects(()=>db.exec(sql),/unrelated table/i);
    await db.exec('ROLLBACK');
    assert.equal((await rpc('dashboard',{days:0})).stats.total,2);
  } finally { await db.close(); }
});
