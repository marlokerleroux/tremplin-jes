import assert from 'node:assert/strict';
import { writeFile,mkdir } from 'node:fs/promises';
const base=process.env.TEST_URL||'http://127.0.0.1:3000';
const cases=[
  {name:'grille du jury',question:'Quels sont les critères de notation du jury et combien de points vaut chacun ?',expect:[/artistique/i,/technique/i,/sc[eé]nique/i,/originalit[eé]|cr[eé]ativit[eé]/i,/potentiel/i,/4/,/20/],source:/Grille de notation/},
  {name:'bande son',question:'Je chante sur une bande son : comment préparer ma clé USB pour les auditions ?',expect:[/USB/,/nom/i,/racine/i],source:/Informations pratiques/},
  {name:'matériel et accueil',question:'Puis-je déplacer la batterie sur place ? Combien de temps avant dois-je venir et est-ce que la salle est accessible en fauteuil ?',expect:[/30/,/pas|fixe|impossible/i,/accessible|accessibilité/i],source:/Informations pratiques/},
  {name:'calendrier du site prioritaire',question:'Les inscriptions ouvrent-elles le 15 octobre et les auditions sont-elles les 22 et 23 janvier 2027 ?',expect:[/21 octobre 2026/i,/23.*24/s,/janvier 2027/i],source:/Édition 2027/},
  {name:'règlement ancien identifié',question:'Pour l’ancienne édition 2024–2025 uniquement, combien de temps duraient les sets des auditions et de la finale ?',expect:[/2024|2025/,/5\s*(?:\*\*)?\s*min/i,/20\s*(?:\*\*)?\s*min/i],source:/archive 2024/},
];
const report=[];
for(const c of cases){
  const start=Date.now();
  const r=await fetch(`${base}/api/chat`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:[{role:'user',content:c.question}]})});
  const data=await r.json();assert.equal(r.status,200,JSON.stringify(data));
  for(const pattern of c.expect)assert.match(data.answer,pattern,c.name);
  assert.ok(data.sources.some(s=>c.source.test(s.title)),`${c.name}: missing documentary citation`);
  assert.ok(data.sources.every(s=>!s.url||s.url.startsWith('https://www.tremplin-jeunes-en-scene.fr/')));
  assert.doesNotMatch(JSON.stringify(data),/document:\/\/|file:\/\/|\/Users\//);
  report.push({test:c.name,question:c.question,...data,latencyMs:Date.now()-start});
  console.log(`OK : ${c.name} (${Date.now()-start} ms)`);
}
await mkdir('artifacts',{recursive:true});await writeFile('artifacts/document-tests.json',JSON.stringify(report,null,2));
console.log('Réponses documentaires, sources et priorité du calendrier vérifiées.');
