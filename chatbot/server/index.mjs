import express from 'express';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { config,root } from './config.mjs';
import { reserveRequest } from './db.mjs';
import { knowledgeStats } from './knowledge.mjs';
import { answer,validateMessages } from './rag.mjs';
import { validateAudio,transcribe,MAX_AUDIO_BYTES } from './audio.mjs';
const app=express();app.disable('x-powered-by');
const production=process.env.NODE_ENV==='production';
const frameOrigins=(process.env.ALLOWED_FRAME_ORIGINS||'https://www.tremplin-jeunes-en-scene.fr https://tremplin-jeunes-en-scene.fr').split(/\s+/).filter(x=>/^https?:\/\/[a-z0-9.:-]+$/i.test(x));
app.use((req,res,next)=>{
  res.set({'X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','Permissions-Policy':'camera=(), microphone=(self), geolocation=()', 'Content-Security-Policy':`frame-ancestors 'self' ${frameOrigins.join(' ')}; object-src 'none'; base-uri 'self'`});next();
});
app.use('/api',(req,res,next)=>{
  res.set('Cache-Control','no-store');
  const origin=req.get('origin');
  if(req.method==='POST'&&origin&&origin!==`${req.protocol}://${req.get('host')}`)return res.status(403).json({error:'Origine non autorisée.'});
  next();
});
app.get('/api/health',async(_,res)=>{try{res.json({ok:true,configured:!!config.key,...await knowledgeStats()});}catch{res.status(503).json({ok:false,error:'Documentation indisponible.'});}});
app.get('/api/sources',async(_,res)=>{try{res.json(await knowledgeStats());}catch{res.status(503).json({error:'Documentation indisponible.'});}});
const requests=new Map();let active=0;
function acquireQuota(req,res) {
  const now=Date.now(),ip=req.ip;
  for(const [key,value] of requests)if(now-value.start>60000&&!value.active)requests.delete(key);
  const quota=requests.get(ip)||{start:now,count:0,active:0};
  if(quota.count>=12||quota.active>=2||active>=8){res.set('Retry-After','60');res.status(429).json({error:'Un petit instant : plusieurs demandes sont en cours. Réessaie dans une minute.'});return null;}
  if(!config.key){res.status(503).json({error:'L’assistant n’est pas encore connecté. Réessaie un peu plus tard.'});return null;}
  if(!reserveRequest(Math.max(1,Number(process.env.DAILY_REQUEST_LIMIT)||300))){res.status(429).json({error:'L’assistant a atteint sa limite pour aujourd’hui. Les informations restent disponibles sur le site.'});return null;}
  quota.count++;quota.active++;requests.set(ip,quota);active++;
  return ()=>{quota.active--;active--;};
}
app.post('/api/transcribe',express.raw({type:()=>true,limit:MAX_AUDIO_BYTES}),async(req,res)=>{
  let audio;
  try{audio=validateAudio(req.body,req.get('content-type'));}catch(error){return res.status(400).json({error:error.message});}
  const release=acquireQuota(req,res);if(!release)return;
  const controller=new AbortController();res.on('close',()=>{if(!res.writableEnded)controller.abort();});
  try{const result=await transcribe(audio,controller.signal);res.status(result.status||200).json(result.error?{error:result.error}:{text:result.text});}
  catch(error){if(!controller.signal.aborted){console.error('Transcription:',error.message);res.status(503).json({error:'La transcription est indisponible. Réessaie le micro ou écris ta question.'});}}
  finally{release();}
});
app.use('/api',express.json({limit:'24kb'}));
app.post('/api/chat',async(req,res)=>{
  let messages;
  try{messages=validateMessages(req.body?.messages);}catch{return res.status(400).json({error:'Écris une question de 1 500 caractères maximum.'});}
  try{if(!(await knowledgeStats()).chunks)throw new Error('EMPTY_KNOWLEDGE');}catch{return res.status(503).json({error:'La documentation est en préparation. Réessaie un peu plus tard.'});}
  const release=acquireQuota(req,res);if(!release)return;
  const controller=new AbortController();res.on('close',()=>{if(!res.writableEnded)controller.abort();});
  try{const result=await answer(messages,controller.signal);res.set('Cache-Control','no-store');res.json(result);}
  catch(error){if(!controller.signal.aborted){console.error('Chat:',error.message);res.status(503).json({error:'La connexion à l’assistant a été interrompue. Ta question est conservée : tu peux réessayer.'});}}
  finally{release();}
});
app.use('/api',(_,res)=>res.status(404).json({error:'Ressource introuvable.'}));
if(production) {
  app.use(express.static(path.join(root,'dist'),{index:false}));
  app.get(['/', '/chat'],(_,res)=>res.sendFile(path.join(root,'dist','index.html')));
} else {
  const {createServer}=await import('vite');
  const vite=await createServer({server:{middlewareMode:true},appType:'custom'});
  app.use(vite.middlewares);
  app.get(['/', '/chat'],async(req,res,next)=>{try{const html=await readFile(path.join(root,'index.html'),'utf8');res.type('html').send(await vite.transformIndexHtml(req.originalUrl,html));}catch(e){next(e);}});
}
app.use((err,req,res,next)=>{if(res.headersSent)return next(err);res.status(err.status===413?413:400).json({error:req.path==='/api/transcribe'?'Le vocal n’a pas pu être lu ou dépasse 2 Mo. Enregistre une question plus courte.':'La demande n’a pas pu être lue. Raccourcis ton message et réessaie.'});});
app.listen(config.port,config.host,()=>console.log(`En coulisses → http://${config.host}:${config.port}`));
