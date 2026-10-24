const $=s=>document.querySelector(s),KEY='as_appel_v1';
const norm=s=>(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim().replace(/\s+/g,' ');
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
let S;try{S=JSON.parse(localStorage.getItem(KEY))}catch(e){}S=S||{students:[],extra:[],dates:[]};S.act=S.act||{};
const ACTS=["Activités libres", "Multi-activités", "Athlétisme", "Acrosport", "Aérobic", "Arts du cirque", "Aquathlon", "Aviron", "Badminton", "Baseball", "Basket-ball", "Basket 3x3", "Beach-volley", "Biathlon", "BMX", "Boxe française (Savate)", "Canoë-kayak", "Course d'orientation", "Cyclisme sur route", "Danse chorégraphiée", "Danse hip-hop", "Double dutch", "Duathlon", "Équitation", "Escalade", "Fitness / Step", "Football", "Futsal", "Gymnastique artistique", "Gymnastique rythmique", "Handball", "Handball à 4", "Handisport", "Hockey sur gazon", "Judo", "Karaté", "Kitesurf", "Laser run", "Musculation", "Natation", "Padel", "Pétanque", "Planche à voile", "Raid multisports", "Rugby à VII", "Run & Bike", "Sauvetage aquatique", "Skateboard / Surfskate", "Ski alpin", "Sport partagé", "Squash", "Surf", "Tennis", "Tennis de table", "Triathlon", "Ultimate frisbee", "Volley-ball", "Voile légère", "VTT"];
const save=()=>{localStorage.setItem(KEY,JSON.stringify(S));refresh()};
const msg=(id,t)=>{const e=$(id);e.textContent=t;e.classList.toggle('err',/introuvable|absent|inaccessible|Choisissez|non reconnu|déjà noté|vide|Importez/i.test(t))};
if('serviceWorker'in navigator){const had=navigator.serviceWorker.controller;navigator.serviceWorker.register('sw.js');navigator.serviceWorker.addEventListener('controllerchange',()=>{if(had&&!window._r){window._r=1;location.reload()}})}
qrcode.stringToBytes=qrcode.stringToBytesFuncs['UTF-8'];
document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>{document.querySelectorAll('nav button').forEach(x=>x.classList.toggle('on',x===b));
document.querySelectorAll('section').forEach(s=>s.hidden=s.id!==b.dataset.t);if(b.dataset.t!=='t3')stopScan()});
/* ---------- CSV ---------- */
function parseCSV(t){const d=[';',',','\t'].map(c=>[c,t.split(/\r?\n/)[0].split(c).length]).sort((a,b)=>b[1]-a[1])[0][0];
const rows=[];let r=[],c='',q=false;
for(let i=0;i<t.length;i++){const h=t[i];
if(q){if(h=='"'){if(t[i+1]=='"'){c+='"';i++}else q=false}else c+=h}
else if(h=='"')q=true;else if(h==d){r.push(c);c=''}
else if(h=='\n'||h=='\r'){if(h=='\r'&&t[i+1]=='\n')i++;r.push(c);rows.push(r);r=[];c=''}else c+=h}
if(c||r.length){r.push(c);rows.push(r)}return rows.filter(r=>r.some(x=>x.trim()))}
$('#file').onchange=async e=>{const f=e.target.files[0];if(!f)return;
const b=await f.arrayBuffer();let t=new TextDecoder('utf-8').decode(b);if(t.includes('\uFFFD'))t=new TextDecoder('windows-1252').decode(b);
const rows=parseCSV(t.replace(/^\uFEFF/,''));if(rows.length<2){msg('#m1','Fichier vide ou illisible.');return}
const head=rows.shift().map(h=>h.trim()),pc=[];
head.forEach((h,i)=>{const m=h.match(/^Présence (\d{4}-\d{2}-\d{2})(?: \| (.+))?$/);if(m)pc.push([i,m[1],m[2]])});
const skip=new Set([...pc.map(p=>p[0]),head.indexOf('Total présences')]);
const ex=[];head.forEach((h,i)=>{if(i>=8&&!skip.has(i))ex.push(h)});ex.forEach(h=>{if(!S.extra.includes(h))S.extra.push(h)});
pc.forEach(([,d,a])=>{if(!S.dates.includes(d))S.dates.push(d);if(a&&!S.act[d])S.act[d]=a});
let add=0,old=0;
for(const r of rows){const g=i=>(r[i]||'').trim(),id=g(0),user=g(1);if(!id&&!user)continue;
let s=S.students.find(x=>(id&&x.id===id)||(user&&norm(x.user)===norm(user)));
if(s)old++;else{s={id,user,etab:g(2),rep:g(3),classe:g(4),nais:g(5),sexe:g(6),tel:g(7),
extra:S.extra.map(h=>{const i=head.indexOf(h);return i>=0?g(i):''}),pres:{}};S.students.push(s);add++}
pc.forEach(([i,d])=>{if(g(i)==='1')s.pres[d]=1})}
S.dates.sort();save();msg('#m1',`${add} élève(s) ajouté(s), ${old} déjà présent(s).`);$('#m1').scrollIntoView({block:'nearest',behavior:'smooth'});e.target.value=''};
document.querySelectorAll('.exp').forEach(b=>b.onclick=()=>{const q=v=>'"'+String(v??'').replace(/"/g,'""')+'"';
const L=[['ID','utilisateur','établissement','date de réponse','classe','date de naissance','sexe','téléphone responsable',...S.extra,...S.dates.map(d=>'Présence '+d+(S.act[d]?' | '+S.act[d]:'')),'Total présences']];
S.students.forEach(s=>L.push([s.id,s.user,s.etab,s.rep,s.classe,s.nais,s.sexe,s.tel,...S.extra.map((h,i)=>s.extra[i]??''),...S.dates.map(d=>s.pres[d]?1:0),Object.keys(s.pres).length]));
const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\uFEFF'+L.map(r=>r.map(q).join(';')).join('\r\n')],{type:'text/csv'}));
a.download='sauvegarde_AS_'+new Date().toLocaleDateString('sv')+'.csv';a.click()});
$('#wipe').onclick=()=>{if(confirm('Effacer définitivement toutes les données de ce navigateur ?')){S={students:[],extra:[],dates:[],act:{}};save();msg('#m1','Données effacées.')}};
/* ---------- Cartes ---------- */
const tc=s=>s.toLowerCase().replace(/(^|[\s-])(\p{L})/gu,(m,a,b)=>a+b.toUpperCase());
const splitName=u=>{const w=u.trim().split(/\s+/),up=x=>x===x.toUpperCase()&&x!==x.toLowerCase();
let nom=w.filter(up),pre=w.filter(x=>!up(x));
if(nom.length===w.length&&w.length>1){pre=[w.pop()];nom=w}else if(!nom.length){nom=[w[0]];pre=w.slice(1)}
return{nom:nom.join(' '),pre:tc(pre.join(' '))}};
const payload=s=>{const n=splitName(s.user);return['AS',s.id,n.nom,n.pre,s.classe].join('|')};
const mkQR=t=>{const q=qrcode(0,'M');q.addData(t);q.make();return q};
let logo=null;const im=new Image();im.onload=()=>{try{const c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;c.getContext('2d').drawImage(im,0,0);logo={d:c.toDataURL('image/png'),r:im.naturalWidth/im.naturalHeight}}catch(e){}};im.src='logo.png';
const cardHTML=s=>{const n=splitName(s.user);return`<div class="card"><div class="ch"><img src="logo.png" alt="" onerror="this.style.display='none'"><b>Association Sportive</b></div><div class="cb"><div><div class="n">${esc(n.nom)}</div><div>${esc(n.pre)}</div><div class="cl">${esc(s.classe)}</div></div>${mkQR(payload(s)).createSvgTag({cellSize:2,margin:0,scalable:true})}</div></div>`};
$('#gen').onclick=()=>{if(!S.students.length)return msg('#m2','Importez d’abord la liste des élèves.');
$('#cards').innerHTML=S.students.map(cardHTML).join('');$('#pdf').disabled=false;msg('#m2',S.students.length+' carte(s) générée(s).')};
function makePDF(list,name){const{jsPDF}=window.jspdf,doc=new jsPDF({unit:'mm',format:'a4'}),W=85.6,H=54,gx=(210-2*W)/3,gy=(297-5*H)/6;
list.forEach((s,k)=>{if(k&&k%10==0)doc.addPage();const p=k%10,x=gx+(p%2)*(W+gx),y=gy+Math.floor(p/2)*(H+gy),n=splitName(s.user);
doc.setDrawColor(194,65,12);doc.setLineWidth(.4);doc.rect(x,y,W,H);doc.setFillColor(194,65,12);doc.rect(x,y,W,12,'F');
if(logo)doc.addImage(logo.d,'PNG',x+2,y+1.5,9*logo.r,9);
doc.setTextColor(255);doc.setFont('helvetica','bold');doc.setFontSize(11);doc.text('Association Sportive',x+(logo?4+9*logo.r:4),y+7.6);
doc.setTextColor(20);const fit=(t,fs,yy,b)=>{doc.setFont('helvetica',b?'bold':'normal');doc.setFontSize(fs);while(doc.getTextWidth(t)>44&&fs>6){fs--;doc.setFontSize(fs)}doc.text(t,x+4,yy)};
fit(n.nom,13,y+24,1);fit(n.pre,11,y+31);doc.setTextColor(194,65,12);fit(s.classe,13,y+41,1);
const q=mkQR(payload(s)),c=q.getModuleCount(),sz=30,m=sz/c,qx=x+W-sz-4,qy=y+16;doc.setFillColor(0);
for(let i=0;i<c;i++)for(let j=0;j<c;j++)if(q.isDark(i,j))doc.rect(qx+j*m,qy+i*m,m+.02,m+.02,'F');
doc.setTextColor(110);doc.setFont('helvetica','normal');doc.setFontSize(6);doc.text('À présenter à chaque séance',x+4,y+H-2.5)});
doc.save(name)}
$('#pdf').onclick=()=>makePDF(S.students,'cartes_AS.pdf');
const find=t=>{const k=norm(t);return S.students.filter(s=>norm(s.user)===k).concat(S.students.filter(s=>norm(s.user).includes(k)))[0]};
$('#one').onclick=()=>{const s=find($('#nm').value);if(!$('#nm').value.trim()||!s)return msg('#m2','Élève introuvable.');
makePDF([s],'carte_'+norm(s.user).replace(/ /g,'_')+'.pdf');msg('#m2','Carte de '+s.user+' téléchargée.')};
/* ---------- Appel ---------- */
$('#date').value=new Date().toLocaleDateString('sv');
let stream=null,last='',lastT=0,ac;
const beep=()=>{try{ac=ac||new AudioContext();const o=ac.createOscillator();o.connect(ac.destination);o.frequency.value=880;o.start();o.stop(ac.currentTime+.12)}catch(e){}navigator.vibrate&&navigator.vibrate(80)};
function mark(s,d){if(!d){msg('#m3','Choisissez une date.');return false}
if(s.pres[d]){msg('#m3',s.user+' : déjà noté présent.');return false}
s.pres[d]=1;if(!S.dates.includes(d)){S.dates.push(d);S.dates.sort()}save();msg('#m3','✔ '+s.user+' ('+s.classe+')');beep();return true}
$('#scan').onclick=async()=>{if(!$('#date').value)return msg('#m3','Choisissez d’abord la date.');
try{stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}})}catch(e){return msg('#m3','Caméra inaccessible : autorisez-la dans le navigateur.')}
const v=$('#v');v.srcObject=stream;await v.play();$('#cam').hidden=false;$('#stop').hidden=false;$('#scan').hidden=true;loop()};
function stopScan(){if(stream)stream.getTracks().forEach(t=>t.stop());stream=null;$('#cam').hidden=true;$('#stop').hidden=true;$('#scan').hidden=false}
$('#stop').onclick=stopScan;
function loop(){if(!stream)return;const v=$('#v');
if(v.readyState===4&&v.videoWidth){const k=Math.min(1,640/v.videoWidth),c=loop.c||(loop.c=document.createElement('canvas'));c.width=v.videoWidth*k;c.height=v.videoHeight*k;
const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(v,0,0,c.width,c.height);const im=x.getImageData(0,0,c.width,c.height),code=jsQR(im.data,c.width,c.height,{inversionAttempts:'dontInvert'});
if(code){const t=new TextDecoder().decode(Uint8Array.from(code.binaryData));
if(!(t===last&&Date.now()-lastT<3000)){last=t;lastT=Date.now();const p=t.split('|');
if(p[0]!=='AS')msg('#m3','QR code non reconnu.');
else{const w=S.students.find(s=>s.id&&s.id===p[1])||S.students.find(s=>norm(splitName(s.user).nom+' '+splitName(s.user).pre)===norm(p[2]+' '+p[3]));
w?mark(w,$('#date').value):msg('#m3','Élève absent de la liste : '+p[2]+' '+p[3])}}}}
requestAnimationFrame(loop)}
$('#add').onclick=()=>{const s=find($('#man').value);s?mark(s,$('#date').value):msg('#m3','Élève introuvable.');$('#man').value=''};
$('#date').onchange=refresh;['#fd','#fa','#fj','#fs'].forEach(i=>$(i).onchange=renderView);
$('#act').onchange=()=>{const d=$('#date').value;if(!d){msg('#m3','Choisissez d’abord la date.');$('#act').value='';return}if($('#act').value)S.act[d]=$('#act').value;else delete S.act[d];save()};
/* ---------- Stats ---------- */
const grp=x=>{const c=(x||'').trim()[0]?.toUpperCase();return c==='F'?'Filles':'MGH'.includes(c||'-')?'Garçons':'Non précisé'};
const tbl=(h,rows)=>`<table><tr>${h.map(x=>`<th>${x}</th>`).join('')}</tr>${rows.map(r=>`<tr>${r.map(x=>`<td>${x}</td>`).join('')}</tr>`).join('')}</table>`;
const bar=p=>`<div class="bar" style="width:${Math.min(100,p)}%"></div>`;
function stats(){const N=S.students.length,D=S.dates;if(!D.length||!N)return'<p>Aucune séance enregistrée.</p>';
const cnt=d=>S.students.filter(s=>s.pres[d]).length,pc=(a,b)=>b?Math.round(100*a/b):0;
let h='<h3>Par date</h3>'+tbl(['Date','Présents','Taux',''],D.map(d=>{const c=cnt(d);return[d.split('-').reverse().join('/'),c+' / '+N,pc(c,N)+' %',bar(pc(c,N))]}));
const J=['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'],jd=J.map(()=>[]);
D.forEach(d=>jd[(new Date(d+'T12:00').getDay()+6)%7].push(d));
h+='<h3>Par jour de la semaine</h3>'+tbl(['Jour','Séances','Présences','Moyenne',''],J.map((j,i)=>{if(!jd[i].length)return null;const t=jd[i].reduce((a,d)=>a+cnt(d),0),m=t/jd[i].length;return[j,jd[i].length,t,m.toFixed(1),bar(pc(m,N))]}).filter(Boolean));
const AC={};D.forEach(d=>{const a=S.act[d]||'Non précisée';(AC[a]=AC[a]||[]).push(d)});
h+='<h3>Par activité</h3>'+tbl(['Activité','Séances','Présences','Moyenne',''],Object.entries(AC).sort((a,b)=>a[0].localeCompare(b[0],'fr')).map(([a,ds])=>{const t=ds.reduce((x,d)=>x+cnt(d),0),m=t/ds.length;return[esc(a),ds.length,t,m.toFixed(1),bar(pc(m,N))]}));
const G={};S.students.forEach(s=>{const g=grp(s.sexe);G[g]=G[g]||{n:0,p:0};G[g].n++;G[g].p+=D.filter(d=>s.pres[d]).length});
h+='<h3>Par sexe</h3>'+tbl(['Groupe','Élèves','Présences','Assiduité',''],Object.entries(G).map(([g,v])=>[g,v.n,v.p,pc(v.p,v.n*D.length)+' %',bar(pc(v.p,v.n*D.length))]));return h.replace(/<h3>/g,'<div class="sp"><h3>').replace(/<\/table>/g,'</table></div>')}
function renderList(){const L=[...S.students].sort((a,b)=>a.user.localeCompare(b.user,'fr'));
$('#nl').textContent='('+S.students.length+')';
$('#tl').innerHTML='<tr><th>Élève</th><th>Classe</th><th>Sexe</th><th>Présences</th></tr>'+(L.length?L.map(s=>`<tr><td>${esc(s.user)}</td><td>${esc(s.classe)}</td><td>${esc(s.sexe)}</td><td>${Object.keys(s.pres).length}</td></tr>`).join(''):'<tr><td colspan="4">Aucun élève importé pour l’instant.</td></tr>')}
const JOURS=['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'];
function fill(sel,items,all){const cur=sel.value;sel.innerHTML='<option value="">'+all+'</option>'+items.map(([v,t])=>`<option value="${esc(v)}">${esc(t)}</option>`).join('');if(items.some(x=>x[0]===cur))sel.value=cur}
function renderView(){const D=[...S.dates].sort().reverse(),dow=d=>new Date(d+'T12:00').getDay();
fill($('#act'),ACTS.map(a=>[a,a]),'Choisir l’activité de la séance');$('#act').value=S.act[$('#date').value]||'';
fill($('#fd'),D.map(d=>[d,d.split('-').reverse().join('/')+' ('+JOURS[dow(d)]+')'+(S.act[d]?' – '+S.act[d]:'')]),'Toutes les dates');
fill($('#fa'),[...new Set(D.map(d=>S.act[d]).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'fr')).map(a=>[a,a]),'Toutes les activités');
const fd=$('#fd').value,fa=$('#fa').value,fj=$('#fj').value,fs=$('#fs').value,
ses=D.filter(d=>(!fd||d===fd)&&(!fa||S.act[d]===fa)&&(fj===''||dow(d)==fj)),
P=S.students.filter(s=>!fs||grp(s.sexe)===fs).map(s=>[s,ses.filter(d=>s.pres[d]).length]).filter(x=>x[1]>0).sort((a,b)=>b[1]-a[1]||a[0].user.localeCompare(b[0].user,'fr'));
$('#vn').textContent='('+P.length+' élève'+(P.length>1?'s':'')+' · '+ses.length+' séance'+(ses.length>1?'s':'')+')';
$('#vh').textContent=ses.length>1&&P.length?'Le chiffre à droite indique le nombre de séances suivies.':'';
$('#vl').innerHTML=P.length?P.map(([s,n])=>`<li><span>${esc(s.user)} <small>${esc(s.classe)}</small></span>${ses.length>1?'<b>'+n+'</b>':''}</li>`).join(''):'<li>'+(S.dates.length?'Aucun élève pour ces critères.':'Aucune séance enregistrée.')+'</li>'}
function refresh(){renderList();renderView();$('#count').textContent=S.students.length+' élèves';
$('#dl').innerHTML=S.students.map(s=>`<option value="${esc(s.user)}">`).join('');
const d=$('#date').value,P=S.students.filter(s=>s.pres[d]);$('#np').textContent='('+P.length+')';
$('#pl').innerHTML=P.map(s=>`<li><span>${esc(s.user)} <small>${esc(s.classe)}</small></span><button data-i="${S.students.indexOf(s)}" title="Retirer">✕</button></li>`).join('')||'<li>Aucun élève scanné.</li>';
$('#pl').querySelectorAll('button').forEach(b=>b.onclick=()=>{delete S.students[b.dataset.i].pres[d];save()});
$('#st').innerHTML=stats()}
refresh();

/* ---------- Installation PWA ---------- */
const standalone=matchMedia('(display-mode: standalone)').matches||navigator.standalone;
const ios=/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
function instUI(){if(standalone)return;$('#inst').hidden=false;$('#instb').hidden=!window.dip;
$('#instp').textContent=window.dip?'Installez Gestion AS pour l’ouvrir comme une application, même sans connexion.':ios?'Sur iPhone ou iPad, dans Safari : touchez le bouton Partager, puis « Sur l’écran d’accueil ».':'Ouvrez le menu du navigateur (⋮ ou ⋯) et choisissez « Installer l’application » ou « Ajouter à l’écran d’accueil ». Si l’option n’existe pas, votre navigateur ne permet pas l’installation (par exemple Firefox sur ordinateur).'}
addEventListener('dipready',instUI);
$('#instb').onclick=async()=>{const e=window.dip;if(!e)return;e.prompt();await e.userChoice;window.dip=null;instUI()};
addEventListener('appinstalled',()=>{window.dip=null;$('#inst').hidden=true});
instUI();
