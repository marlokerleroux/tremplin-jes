import { mkdir,writeFile } from 'node:fs/promises';
import path from 'node:path';
import { load } from 'cheerio';
import robotsParser from 'robots-parser';
import { createRequire } from 'node:module';
import { config,dataDir } from '../server/config.mjs';
import { canonical,extract,hash } from '../server/content.mjs';
const require=createRequire(import.meta.url);
const UA='TremplinKnowledgeBot/1.0';
const report={ startedAt:new Date().toISOString(),site:config.site,pages:[],skipped:[],errors:[],sitemaps:[],complete:false };
const origin=new URL(config.site).origin;
await mkdir(path.join(dataDir,'raw'),{recursive:true});
async function get(url, limit=8_000_000) {
  let current=url;
  for(let i=0;i<5;i++) {
    const r=await fetch(current,{headers:{'User-Agent':UA},signal:AbortSignal.timeout(25000),redirect:'manual'});
    if(r.status>=300&&r.status<400) {
      const next=new URL(r.headers.get('location'),current);
      if(next.hostname.replace(/^www\./,'')!==new URL(origin).hostname.replace(/^www\./,'')||next.protocol!=='https:')throw new Error('Redirection externe ignorée');
      current=next.href;continue;
    }
    if(!r.ok)throw new Error(`HTTP ${r.status}`);
    const reader=r.body.getReader();let length=0;const buffers=[];
    while(true){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>limit){await reader.cancel();throw new Error('Document trop volumineux');}buffers.push(value);}
    return {body:Buffer.concat(buffers),type:r.headers.get('content-type')||''};
  }
  throw new Error('Trop de redirections');
}
let robotsText='';
try { robotsText=(await get(`${origin}/robots.txt`)).body.toString(); } catch(e) {
  if(e.message!=='HTTP 404')throw new Error(`Impossible de vérifier robots.txt : ${e.message}`);
}
if(robotsText.trim().startsWith('<'))robotsText='';
const robots=robotsParser(`${origin}/robots.txt`,robotsText);
const extraSeeds=(process.env.CRAWL_SEED_URLS||'').split(',').map(x=>canonical(x.trim(),origin)).filter(Boolean);
const queue=[`${origin}/`,...extraSeeds];const seen=new Set();const docs=[];const sitemapSeen=new Set();
async function sitemap(url) {
  if(sitemapSeen.has(url)||sitemapSeen.size>30)return;
  sitemapSeen.add(url);
  try {
    if(!canonical(url,origin))return;
    const raw=(await get(url)).body.toString();
    if(!/<(?:urlset|sitemapindex)[\s>]/.test(raw))return;
    const $=load(raw,{xmlMode:true});report.sitemaps.push(url);
    const children=$('loc').map((_,e)=>$(e).text().trim()).get();
    if($('sitemapindex').length)for(const child of children)await sitemap(child);
    else queue.push(...children.map(x=>canonical(x,origin)).filter(Boolean));
  } catch(e){report.errors.push({url,error:e.message,kind:'sitemap'});}
}
for(const url of [...robots.getSitemaps(),`${origin}/sitemap.xml`])await sitemap(url);
while(queue.length && seen.size<500) {
  const url=canonical(queue.shift(),origin);if(!url||seen.has(url))continue;seen.add(url);
  if(robots.isAllowed(url,UA)===false){report.skipped.push({url,reason:'robots.txt'});continue;}
  try {
    const {body,type}=await get(url);let doc;
    if(type.includes('pdf')||url.endsWith('.pdf')) {
      const pdf=require('pdf-parse/lib/pdf-parse.js');const parsed=await pdf(body);
      const labels={'reglement.pdf':'Règlement du Tremplin','autorisation-parentale.pdf':'Autorisation parentale','exemples-fiches-techniques.pdf':'Exemples de fiches techniques'};
      const filename=decodeURIComponent(new URL(url).pathname.split('/').pop());
      const dated=/2025\s*\/\s*2026/.test(parsed.text)?' — édition 2025/2026':(/31\/01\/25/.test(parsed.text)?' — formulaire daté de 2025':'');
      doc={url,title:(labels[filename]||filename)+dated,text:parsed.text.trim(),hash:hash(parsed.text),fetchedAt:new Date().toISOString(),links:[]};
    } else if(type.includes('text/html')) doc=extract(body.toString(),url);
    else {report.skipped.push({url,reason:`Type ${type}`});continue;}
    queue.push(...doc.links);
    if(doc.text.length<80){report.skipped.push({url,reason:'Contenu insuffisant'});continue;}
    const filename=`${hash(url).slice(0,16)}.${url.endsWith('.pdf')?'pdf':'html'}`;
    await writeFile(path.join(dataDir,'raw',filename),body);
    docs.push(doc);report.pages.push({url,title:doc.title,characters:doc.text.length,raw:filename});
    console.log(`Collecté : ${new URL(url).pathname} (${doc.text.length} caractères)`);
  }catch(e){report.errors.push({url,error:e.message,kind:'page'});console.log(`Non collecté : ${url} (${e.message})`);}
  await new Promise(r=>setTimeout(r,Math.max(350,(robots.getCrawlDelay(UA)||0)*1000)));
}
report.complete=queue.length===0 && !report.errors.some(e=>e.kind==='page');report.finishedAt=new Date().toISOString();
await writeFile(path.join(dataDir,'crawl-report.json'),JSON.stringify(report,null,2));
if(!docs.length)throw new Error('Aucun document récupéré : la base existante est conservée.');
await writeFile(path.join(dataDir,'documents.json'),JSON.stringify(docs,null,2));
console.log(`${docs.length} documents publics. Rapport : data/crawl-report.json`);
