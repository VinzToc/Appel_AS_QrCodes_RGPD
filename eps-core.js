/* eps-core.js — base de données élèves partagée (IndexedDB "MesAppsEPS"), 100 % locale (RGPD). */
(function(){
const DB='MesAppsEPS';let _db;
const open=()=>_db?Promise.resolve(_db):new Promise((ok,ko)=>{const r=indexedDB.open(DB,1);
 r.onupgradeneeded=()=>{r.result.createObjectStore('eleves',{keyPath:'id'});r.result.createObjectStore('meta',{keyPath:'k'})};
 r.onsuccess=()=>ok(_db=r.result);r.onerror=()=>ko(r.error)});
const tx=async(s,m,f)=>{const d=await open();return new Promise((ok,ko)=>{const t=d.transaction(s,m),o=t.objectStore(s);const q=f(o);t.oncomplete=()=>ok(q&&q.result);t.onerror=()=>ko(t.error)})};
const norm=s=>(s||'').toString().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
const makeId=e=>norm(e.nom)+'_'+norm(e.prenom)+'_'+norm(e.naissance);
function parseCSV(t){t=t.replace(/^\uFEFF/,'');const f=t.split('\n')[0];const d=[';',',','\t'].sort((a,b)=>f.split(b).length-f.split(a).length)[0];
 const rows=[];let r=[],c='',q=false;
 for(let i=0;i<t.length;i++){const ch=t[i];
  if(q){if(ch=='"'){if(t[i+1]=='"'){c+='"';i++}else q=false}else c+=ch}
  else if(ch=='"')q=true;else if(ch==d){r.push(c);c=''}
  else if(ch=='\n'||ch=='\r'){if(ch=='\r'&&t[i+1]=='\n')i++;r.push(c);rows.push(r);r=[];c=''}else c+=ch}
 if(c||r.length){r.push(c);rows.push(r)}
 return{delim:d,rows:rows.filter(x=>x.some(v=>v.trim()))}}
async function decode(file){const b=await file.arrayBuffer();try{return new TextDecoder('utf-8',{fatal:true}).decode(b)}catch(e){return new TextDecoder('windows-1252').decode(b)}}
const MAP={nom:['nom','nomeleve','eleves','eleve'],prenom:['prenom','prenoms','prenomeleve'],naissance:['neele','nele','naissance','datedenaissance','nele'],classe:['classe','classederattachement','division'],regime:['regime']};
function findCol(h,k){const n=h.map(norm);for(const a of MAP[k]){const i=n.indexOf(a);if(i>=0)return i}
 return n.findIndex(x=>MAP[k].some(a=>x.startsWith(a)))}
/* Pronote : colonne unique « NOM Prénom » → NOM = mots sans minuscule, Prénom = le reste */
const splitName=v=>{const w=v.trim().split(/\s+/);let i=0;while(i<w.length-1&&w[i]===w[i].toUpperCase()&&!/[a-zà-ÿ]/.test(w[i]))i++;
 if(i===0)i=1;return[w.slice(0,i).join(' '),w.slice(i).join(' ')]};
const EPS={parseCSV,splitName,
 open,norm,
 async all(){return (await tx('eleves','readonly',o=>o.getAll()))||[]},
 async importCSV(file){const{rows}=parseCSV(await decode(file));
  // l'en-tête = première ligne contenant "nom" et "classe"
  const hi=rows.findIndex(r=>{const n=r.map(norm);return n.some(x=>x.startsWith('nom')||x==='eleves'||x==='eleve')&&n.some(x=>x.startsWith('classe'))});
  if(hi<0)throw new Error("En-têtes introuvables (colonnes Nom et Classe requises).");
  const h=rows[hi],ix={};for(const k in MAP)ix[k]=findCol(h,k);
  const old=new Map((await EPS.all()).map(e=>[e.id,e]));let add=0,upd=0;const d=await open();
  const t=d.transaction('eleves','readwrite'),o=t.objectStore('eleves');
  for(const r of rows.slice(hi+1)){const e={};for(const k in ix)e[k]=ix[k]>=0?(r[ix[k]]||'').trim():'';
   if(ix.prenom<0&&e.nom){const s=splitName(e.nom);e.nom=s[0];e.prenom=s[1]}
   if(!e.nom&&!e.prenom)continue;e.id=makeId(e);const p=old.get(e.id);
   if(p){upd++;e.ext=p.ext||{}}else{add++;e.ext={}}o.put(e)}
  await new Promise(ok=>t.oncomplete=ok);
  await tx('meta','readwrite',o=>o.put({k:'lastImport',v:new Date().toISOString(),n:file.name}));
  return{add,upd,cols:Object.keys(ix).filter(k=>ix[k]<0&&!(k==='prenom'&&ix.nom>=0))}},
 /* API pour les applications : données propres à une app, rangées sous ext[appId] */
 async getExt(appId){return (await EPS.all()).map(e=>({id:e.id,nom:e.nom,prenom:e.prenom,classe:e.classe,naissance:e.naissance,regime:e.regime,data:(e.ext||{})[appId]||{}}))},
 async setExt(appId,id,data){const d=await open();return new Promise((ok,ko)=>{const t=d.transaction('eleves','readwrite'),o=t.objectStore('eleves');const g=o.get(id);
  g.onsuccess=()=>{const e=g.result;if(!e)return ko('élève inconnu');e.ext=e.ext||{};e.ext[appId]=Object.assign(e.ext[appId]||{},data);o.put(e)};t.oncomplete=ok;t.onerror=()=>ko(t.error)})},
 async meta(){return tx('meta','readonly',o=>o.get('lastImport'))},
 async clear(){await tx('eleves','readwrite',o=>o.clear());await tx('meta','readwrite',o=>o.clear())},
 /* Export CSV : colonnes d'origine + une colonne par champ d'app, nommée APP_<appId>_<champ> */
 async exportCSV(){const L=await EPS.all();const ec=[];L.forEach(e=>{for(const a in e.ext||{})for(const c in e.ext[a]){const n=`APP_${a}_${c}`;if(!ec.includes(n))ec.push(n)}});
  const q=v=>'"'+String(v??'').replace(/"/g,'""')+'"';const H=['Nom','Prénom','Né(e) le','Classe','Régime',...ec];
  const lines=[H.map(q).join(';')];L.forEach(e=>lines.push([e.nom,e.prenom,e.naissance,e.classe,e.regime,...ec.map(n=>{const[,a,...c]=n.split('_');return(e.ext?.[a]||{})[c.join('_')]})].map(q).join(';')));
  return '\uFEFF'+lines.join('\r\n')}
};
window.EPS=EPS})();
