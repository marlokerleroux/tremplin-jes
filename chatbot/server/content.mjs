import { load } from 'cheerio';
import { createHash } from 'node:crypto';
export const hash = text => createHash('sha256').update(text).digest('hex');
export function canonical(value, base) {
  try {
    const u = new URL(value, base), origin = new URL(base);
    if (u.protocol !== 'https:' || u.hostname.replace(/^www\./,'') !== origin.hostname.replace(/^www\./,'')) return null;
    u.hostname = origin.hostname; u.hash = ''; u.search = '';
    u.pathname = u.pathname.replace(/\/+$/,'') || '/';
    if (/\/(api|admin|dashboard|auth|login|logout|connexion|inscription|register|candidat|candidates|espace-candidat|_next)(\/|$)/i.test(u.pathname)) return null;
    if (/\.(png|jpe?g|gif|webp|svg|mp[34]|mov|woff2?|css|js|zip|ico)$/i.test(u.pathname)) return null;
    return u.href;
  } catch { return null; }
}
export function extract(html, url) {
  const $ = load(html);
  // Public artist biographies are passed as JSON props to client-side dialogs.
  // Parse only JSON and the named public fields; never evaluate inline scripts.
  const biographies=new Map();
  const flight=$('script').map((_,e)=>{
    const match=$(e).text().match(/self\.__next_f\.push\((\[.*\])\)/s);
    try{const part=match?JSON.parse(match[1]):null;return part?.[0]===1?part[1]:'';}catch{return '';}
  }).get().join('');
  function visit(value) {
    if(!value||typeof value!=='object')return;
    if(value.finalist?.name&&typeof value.finalist.description==='string'){
      const f=value.finalist;biographies.set(f.name,`${f.name} — ${f.genre||''}\n${f.description}`);
    }
    for(const child of Object.values(value))visit(child);
  }
  for(const line of flight.split('\n')){try{visit(JSON.parse(line.slice(line.indexOf(':')+1)));}catch{}}
  // Assemble React/Next streamed HTML without executing any site JavaScript.
  for(const match of html.matchAll(/\$R([SC])\("([^"]+)","([^"]+)"\)/g)) {
    const source=match[1]==='S'?match[2]:match[3], target=match[1]==='S'?match[3]:match[2];
    const segment=$(`[id="${source}"]`), placeholder=$(`[id="${target}"]`);
    if(segment.length&&placeholder.length){placeholder.replaceWith(segment.contents());segment.remove();}
  }
  const pageTitle=$('title').first().text().trim(), heading=({'/legal':'Mentions légales','/privacy':'Politique de confidentialité'}[new URL(url).pathname]) || $('h1,h2').first().text().trim();
  const title = (!pageTitle||pageTitle==='Tremplin Jeunes en Scène') ? (heading||pageTitle) : pageTitle;
  const links = $('a[href]').map((_,e) => canonical($(e).attr('href'),url)).get().filter(Boolean);
  $('script,style,noscript,svg,nav,header,form,[aria-hidden="true"],input').remove();
  $('img[alt]').each((_,el)=>{const alt=$(el).attr('alt');if(alt)$(el).replaceWith(`\n${alt}\n`);});
  if($('main').length)$('main').first().append($('footer').contents());
  $('footer').remove();
  const root = $('main').length ? $('main').first() : $('body');
  root.find('br').replaceWith('\n');
  root.find('h1,h2,h3,h4,p,li,section,article,div,tr').each((_,el) => { $(el).prepend('\n').append('\n'); });
  const text = (root.text()+(biographies.size?'\n\nBiographies des finalistes du palmarès\n\n'+[...biographies.values()].join('\n\n'):'')).replace(/[ \t]+/g,' ').replace(/\n\s*\n/g,'\n\n').trim();
  return { url,title,text,links,hash:hash(text),fetchedAt:new Date().toISOString() };
}
export function chunkText(text, size=1500, overlap=220) {
  const chunks=[];
  let start=0;
  while(start < text.length) {
    let end=Math.min(start+size,text.length);
    if(end<text.length) { const cut=text.lastIndexOf('\n',end); if(cut>start+size*.55)end=cut; }
    const chunk=text.slice(start,end).trim();
    if(chunk)chunks.push(chunk);
    if(end===text.length)break;
    start=Math.max(start+1,end-overlap);
  }
  return chunks;
}
