/* ================= NUCLEO — stato, archivio, navigazione ================= */
'use strict';
const $=(s,e)=>(e||document).querySelector(s);
const $$=(s,e)=>[...(e||document).querySelectorAll(s)];
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const oggi=()=>new Date().toISOString().slice(0,10);
const MESI=['gennaio','febbraio','marzo','aprile','maggio','giugno','luglio','agosto','settembre','ottobre','novembre','dicembre'];
function dataIt(s){ if(!s)return''; const [a,m,g]=s.split('-'); return g?`${+g} ${MESI[+m-1]} ${a}`:s; }
/* chiave di ricerca: minuscole, senza accenti, senza punteggiatura */
function ck(s){ return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  .replace(/[șşŞȘ]/g,'s').replace(/[țţŢȚ]/g,'t').toLowerCase().replace(/[^0-9a-z ]/g,' ').replace(/\s+/g,' ').trim(); }
function mescola(a,rnd){ a=a.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor((rnd?rnd():Math.random())*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
/* generatore pseudocasuale ripetibile */
function seme(n){ let s=n>>>0; return ()=>{ s=(s*1664525+1013904223)>>>0; return s/4294967296; }; }

/* ---------------- avvisi ---------------- */
let _avvT;
function avvisa(t,tipo){
  const d=document.createElement('div'); d.className='avv'+(tipo?' '+tipo:''); d.textContent=t;
  $('#avvisi').appendChild(d);
  setTimeout(()=>{ d.style.transition='opacity .3s'; d.style.opacity='0'; setTimeout(()=>d.remove(),320); }, tipo==='no'?3600:2200);
}

/* ---------------- finestre modali ---------------- */
function apri(titolo,corpo,piede,largo,classe){
  const m=$('#modale');
  m.innerHTML=`<div class="foglio${classe?' '+classe:''}" style="${largo?'width:min('+largo+'px,100%)':''}">
    <div class="cap"><b>${esc(titolo)}</b><button class="chiudi" onclick="chiudi()">✕</button></div>
    <div class="cor">${corpo}</div>${piede?`<div class="pie">${piede}</div>`:''}</div>`;
  m.classList.add('on');
  m.onclick=e=>{ if(e.target===m) chiudi(); };
  return m;
}
function chiudi(){ $('#modale').classList.remove('on'); $('#modale').innerHTML=''; }
function conferma(testo,poi,etichetta){
  apri('Conferma',`<p style="margin:0;font-size:15.5px;line-height:1.6">${esc(testo).replace(/\n/g,'<br>')}</p>`,
    `<button class="bt pi" onclick="chiudi()">Annulla</button>
     <button class="bt pr" id="btConf">${esc(etichetta||'Sì, procedi')}</button>`,460);
  $('#btConf').onclick=()=>{ chiudi(); poi(); };
}

/* ---------------- archivio (IndexedDB + copia rapida) ---------------- */
const DB='prediche_domande', NS='stato:prediche', LS='prediche_v1';
let _db=null;
function db(){
  if(_db) return Promise.resolve(_db);
  return new Promise((ris, err)=>{
    const r=indexedDB.open(DB,1);
    r.onupgradeneeded=()=>{ if(!r.result.objectStoreNames.contains('kv')) r.result.createObjectStore('kv'); };
    r.onsuccess=()=>{ _db=r.result; ris(_db); };
    r.onerror=()=>err(r.error);
  });
}
async function kvSet(k,v){ const d=await db(); return new Promise((ris,err)=>{
  const t=d.transaction('kv','readwrite'); t.objectStore('kv').put(v,k);
  t.oncomplete=ris; t.onerror=()=>err(t.error); }); }
async function kvGet(k){ const d=await db(); return new Promise((ris,err)=>{
  const t=d.transaction('kv','readonly'); const q=t.objectStore('kv').get(k);
  q.onsuccess=()=>ris(q.result); q.onerror=()=>err(q.error); }); }
async function kvDel(k){ const d=await db(); return new Promise((ris,err)=>{
  const t=d.transaction('kv','readwrite'); t.objectStore('kv').delete(k);
  t.oncomplete=ris; t.onerror=()=>err(t.error); }); }

const BASE={
  _at:0, prediche:[], cantici:[], esperienze:[], poesie:[], domandeMie:[], versetti:{}, lezionari:[], musica:{}, predAnnot:{},
  viste:{dom:'',chd:'',giri:{dom:0,chd:0}},
  imp:{ chiesa:'Chiesa Avventista del 7° Giorno — Movimento di Riforma', locale:'', resp:'',
        lingua:'it', sfondoProi:'notte', quizMesc:true, quizMescOpz:false, mostraNum:true }
};
let stato=JSON.parse(JSON.stringify(BASE));

let _codaSalva=Promise.resolve();
function salva(){
  stato._at=Date.now();
  try{ localStorage.setItem(LS,JSON.stringify(stato)); }catch(e){}
  _codaSalva=_codaSalva.then(()=>kvSet(NS,stato)).catch(e=>console.warn('salvataggio',e));
  return _codaSalva;
}
async function carica(){
  let a=null,b=null;
  try{ const s=localStorage.getItem(LS); if(s) a=JSON.parse(s); }catch(e){}
  try{ b=await kvGet(NS); }catch(e){}
  const buono = (!a&&!b)?null : (!a?b : (!b?a : ((b._at||0)>=(a._at||0)?b:a)));
  if(buono){ stato=Object.assign(JSON.parse(JSON.stringify(BASE)),buono);
             stato.imp=Object.assign({},BASE.imp,buono.imp||{}); }
}
/* allegati: uno per chiave, fuori dallo stato */
const fileUrl={};
async function salvaAllegato(id,blob){ await kvSet('all:'+id,blob); fileUrl[id]=URL.createObjectURL(blob); }
async function riprendiAllegati(ids){
  for(const id of ids){ try{ const b=await kvGet('all:'+id); if(b) fileUrl[id]=URL.createObjectURL(b); }catch(e){} }
}

/* ================= MEMORIA DELLE PRESENTAZIONI =================
   Quello che hai già presentato non torna più, finché non l'hai visto tutto.
   Me lo ricordo per sempre: anche fra mesi o anni riprendo da dove eravamo.
   Ogni domanda ha un suo numero fisso ricavato dal testo, non dal posto in
   elenco: così la memoria regge anche quando aggiungo domande nuove. */
function chiaveVista(t){
  let h=5381;
  const x=String(t||'');
  for(let i=0;i<x.length;i++) h=(((h*33)>>>0) ^ x.charCodeAt(i))>>>0;
  return ('000000'+h.toString(36)).slice(-7);
}
function chiaveDomanda(d){ return chiaveVista(d.d+'|'+(d.o?d.o[d.g]:'')); }
function chiaveFrase(c){ return chiaveVista(c.q+'|'+c.chi); }
function _viste(){
  stato.viste=stato.viste||{dom:'',chd:'',giri:{dom:0,chd:0}};
  stato.viste.giri=stato.viste.giri||{dom:0,chd:0};
  return stato.viste;
}
/* le chiavi stanno tutte attaccate, sette lettere per volta: occupa poco */
const _memViste={};
function insiemeViste(tipo){
  const v=_viste(), testo=v[tipo]||'';
  if(!_memViste[tipo] || _memViste[tipo].testo!==testo){
    const set=new Set();
    for(let i=0;i+7<=testo.length;i+=7) set.add(testo.substr(i,7));
    _memViste[tipo]={testo,set};
  }
  return _memViste[tipo].set;
}
function segnaViste(tipo,chiavi){
  const v=_viste(), set=insiemeViste(tipo);
  let agg='';
  chiavi.forEach(k=>{ if(k && !set.has(k)){ set.add(k); agg+=k; } });
  if(!agg) return;
  v[tipo]=(v[tipo]||'')+agg;
  _memViste[tipo]={testo:v[tipo],set};
  salva();
}
function quanteViste(tipo){ return insiemeViste(tipo).size; }
function giroViste(tipo){ return (_viste().giri[tipo]||0)+1; }
function azzeraViste(tipo,contaGiro){
  const v=_viste();
  v[tipo]='';
  if(contaGiro) v.giri[tipo]=(v.giri[tipo]||0)+1;
  delete _memViste[tipo];
  salva();
}
/* Prende «quante» cose dall'elenco saltando quelle già presentate.
   Se non ne bastano, finisce il giro, ricomincia da capo e prende il resto
   fra quelle che non ha appena preso: dentro alla stessa presentazione non
   si ripete mai niente. */
function pescaNuove(elenco,quante,tipo,chiaveDi,rnd){
  const set=insiemeViste(tipo);
  const mai=elenco.filter(x=>!set.has(chiaveDi(x)));
  const n=quante||elenco.length;
  let presi=mescola(mai,rnd);
  let girato=false;
  if(presi.length<n){
    /* le hai viste tutte: il giro ricomincia */
    const presiSet=new Set(presi.map(chiaveDi));
    const resto=mescola(elenco.filter(x=>!presiSet.has(chiaveDi(x))),rnd);
    azzeraViste(tipo,true);
    girato=presi.length>0 || elenco.length>0;
    presi=presi.concat(resto);
  }
  return {lista:presi.slice(0,n), girato, restavano:mai.length};
}
/* la scritta che dice a che punto sei del giro */
function strisciaViste(tipo,elenco,chiaveDi){
  const set=insiemeViste(tipo);
  const gia=elenco.filter(x=>set.has(chiaveDi(x))).length;
  const restano=elenco.length-gia;
  const g=giroViste(tipo);
  return `<div class="conta-viste">
    <span class="cv-tit">🧠 Mai due volte la stessa</span>
    <span class="cv-n"><b>${restano.toLocaleString('it-IT')}</b> ancora da presentare</span>
    <span class="cv-n b"><b>${gia.toLocaleString('it-IT')}</b> già presentate${g>1?` · ${g}° giro`:''}</span>
    ${gia?`<button class="bt mini pi" onclick="chiediAzzeraViste('${tipo}')">↺ Ricomincia il giro</button>`:''}
  </div>`;
}
function chiediAzzeraViste(tipo){
  const che = tipo==='dom' ? 'le domande' : 'le frasi';
  conferma(`Vuoi dimenticare ${che} già presentate e ricominciare il giro da capo?`,()=>{
    azzeraViste(tipo,false);
    if(tipo==='dom') vDomande(); else vChiHaDetto();
    avvisa('Ricominciamo da capo','ok');
  },'Ricomincia');
}

/* ---------------- sezioni e navigazione ---------------- */
const SEZIONI=[
  {id:'home',      ic:'🏠', et:'Home'},
  {id:'domande',   ic:'❓', et:'Domande bibliche'},
  {id:'chihadetto',ic:'💬', et:'Chi ha detto?'},
  {id:'bibbia',    ic:'📕', et:'Bibbia'},
  {id:'cantici',   ic:'🎵', et:'Cantici'},
  {id:'prediche',  ic:'📖', et:'Prediche'},
  {id:'poesie',    ic:'🪶', et:'Poesie'},
  {id:'esperienze',ic:'🌟', et:'Esperienze'},
  {id:'sabato',    ic:'📚', et:'Scuola del Sabato'},
  {id:'sole',      ic:'🌅', et:'Alba e tramonto', fuori:true},
  {id:'dati',      ic:'☁️', et:'Dati e copie'},
  {id:'guida',     ic:'📘', et:'Guida'}
];
let sezione='home';
function menu(){
  $('#voci').innerHTML=SEZIONI.filter(s=>!s.fuori).map(s=>{
    const n=contaSez(s.id);
    return `<button class="voce${s.id===sezione?' on':''}" onclick="vai('${s.id}')">
      <span class="ic">${s.ic}</span><span class="et">${s.et}</span>
      ${n!=null?`<span class="cnt">${n}</span>`:''}</button>`;
  }).join('');
}
function contaSez(id){
  if(id==='domande')   return (DOMANDE.length+stato.domandeMie.length).toLocaleString('it-IT');
  if(id==='chihadetto')return CITAZIONI.length.toLocaleString('it-IT');
  if(id==='cantici')   return (CANTICI.length+stato.cantici.length).toLocaleString('it-IT');
  if(id==='prediche')  return (PREDICHE.length+stato.prediche.length)||null;
  if(id==='poesie')    return (POESIE.length+(stato.poesie||[]).length)||null;
  if(id==='esperienze')return (ESPERIENZE.length+stato.esperienze.length)||null;
  if(id==='sabato')    return (stato.lezionari||[]).length||null;
  return null;
}
function vai(id,sotto){
  if(!SEZIONI.some(s=>s.id===id)) id='home';
  sezione=id; document.body.classList.remove('menu');
  if(id!=='home') document.body.classList.remove('home-fissa');
  if(id!=='sabato') document.body.classList.remove('sab-fissa');
  document.body.classList.remove('pred-fissa');
  const s=SEZIONI.find(x=>x.id===id);
  $('#titSez').textContent=s.et; $('#sottoSez').textContent=sotto||'';
  menu(); window.scrollTo(0,0);
  try{ ({home:vHome,domande:vDomande,chihadetto:vChiHaDetto,bibbia:vBibbia,cantici:vCantici,prediche:vPrediche,poesie:vPoesie,
         esperienze:vEsperienze,sabato:vSabato,sole:vSole,dati:vDati,guida:vGuida})[id](); }
  catch(e){ console.error(e); $('#vista').innerHTML=`<div class="vuoto"><span class="em">⚠️</span>Errore nella sezione.<br><small>${esc(e.message)}</small></div>`; }
  try{ location.hash=id; }catch(e){}
}
function sotto(t){ $('#sottoSez').textContent=t||''; }
/* Il totale diviso per lingua: quante in italiano e quante in rumeno.
   Serve sulla home e in cima alle due sezioni. */
function contaLingue(elenco){
  let it=0, ro=0;
  (elenco||[]).forEach(x=>{ if(x.lg==='ro') ro++; else it++; });
  return {it,ro,tot:it+ro};
}
function strisciaLingue(elenco){
  const c=contaLingue(elenco);
  return `<span class="conta-lg"><b>${c.tot.toLocaleString('it-IT')}</b> in tutto
    <i>🇮🇹 ${c.it.toLocaleString('it-IT')} in italiano</i>
    <i>🇷🇴 ${c.ro.toLocaleString('it-IT')} in rumeno</i></span>`;
}
function pinta(html){ $('#vista').innerHTML=`<div class="sez">${html}</div>`; }
