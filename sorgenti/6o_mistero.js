/* ======================= 🕯️ MISTERO BIBLICO =======================
   Al posto del Blitz. Non è un quiz: si entra in un caso tratto da un episodio della Bibbia senza
   sapere quale sia, si esplora la scena toccando gli oggetti e le persone, si raccolgono gli indizi
   nel taccuino, si ascoltano le testimonianze e, quando si pensa di aver capito, si risolve il caso
   ricostruendo quello che è successo con alcune prove (a scelta, mettere in ordine, vero/falso).
   Stessa grafica, stessi giocatori, stessi premi, classifiche, gara e trofei degli altri giochi.
   I CASI NON STANNO QUI: sono dati (MISTERI, da dati/misteri.json, preparato da
   strumenti/misteri/genera.py dai file scritti a mano in italiano e in rumeno). Per aggiungerne
   altri basta scriverli lì: questo motore non cambia. Forma di un caso (le scritte sono {it,ro}):
     id, num, ic, titolo, sotto, dif (1 facile · 2 medio · 3 esperto), rif (testo) e rifN ([libro,cap,v]),
     intro, scena ('palazzo','deserto','mare','prigione','monte','citta','campo','tempio','notte','casa','giardino','fiume'),
     elementi: [{k, ic, n (nome), x, y (posto nella scena, in %), tipo: 'i' indizio · 'f' irrilevante · 't' testimone,
                 tx (quello che si scopre), chi (chi parla, per i testimoni: può restare nascosto), nota (per il taccuino)}],
     aiuti: [tre suggerimenti, dal più leggero al più evidente],
     prove: [{t:'scelta', q, opz:{it:[...],ro:[...]}, ok} · {t:'ordine', q, voci:{it:[...],ro:[...]} (in ordine giusto)} ·
             {t:'vero', q, frasi:[{t, v:true|false}]}],
     storia (la spiegazione finale), punti (di partenza, 2000), sblocco (quanti casi risolti servono). */
const MIS={ lg:'it', vista:'archivio', caso:null, trovati:[], aiuti:0, errori:0, tentativi:0, prova:0, stato:null,
            esito:null, fine:null, pid:null, garaCaso:null };
const MIS_COSTI={ elemento:40, aiuto:[150,250,400], errore:200 };
function misCasi(){ return (typeof MISTERI!=='undefined' && MISTERI.casi)||[]; }
function misTrova(id){ return misCasi().find(c=>c.id===id)||null; }
function misT(o){ return gnT(o,MIS.lg); }
function misL(o){ return o?(o[MIS.lg]||o.it||[]):[]; }
function misPr(){ const p=gnProgressi('mistero'); p.casi=p.casi||{}; return p; }
function misDati(id){ const p=misPr(); return p.casi[id]=p.casi[id]||{iniziato:0,risolto:0,stelle:0,best:0,indizi:0,errori:0,aiuti:0,volte:0}; }
function misRisolti(){ const p=misPr(); return Object.keys(p.casi).filter(k=>p.casi[k].risolto&&misTrova(k)).length; }
/* quanti casi risolti servono per aprire un caso (se il caso non lo scrive da sé): i primi tre facili
   sono aperti da subito e ogni caso risolto apre il facile dopo; i medi si aprono dopo 2 casi risolti,
   gli esperti («casi avanzati») dopo 5, e anche lì uno alla volta */
function misSblocco(c,k){
  if(c.sblocco!=null && c.sblocco>0) return c.sblocco;
  const stessi=misCasi().filter(x=>(x.dif||1)===(c.dif||1)), i=stessi.indexOf(c);
  if((c.dif||1)===1) return i<3?0:i-1;
  return ((c.dif||1)===2?2:5)+i;
}
function misAperto(c,k){ return (GARA&&GARA.attiva&&GARA.gioco==='mistero') || misRisolti()>=misSblocco(c,k); }
function misStelle(n){ return '⭐'.repeat(n)+'☆'.repeat(3-n); }
function misOggi(){ const d=new Date(); return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate(); }
/* il caso del giorno: uno dei casi aperti, scelto dalla data (senza Internet) */
function misCasoDelGiorno(){
  const aperti=misCasi().filter((c,k)=>misAperto(c,k)); if(!aperti.length) return null;
  const s=misOggi(); let h=0; for(const ch of s) h=(h*31+ch.charCodeAt(0))>>>0;
  return aperti[h%aperti.length];
}
const MIS_DIF={1:{ic:'🟢',it:'FACILE',ro:'UȘOR'},2:{ic:'🟡',it:'MEDIO',ro:'MEDIU'},3:{ic:'🔴',it:'ESPERTO',ro:'EXPERT'}};
const MIS_TX={
  it:{archivio:'ARCHIVIO DEI MISTERI',nuovo:'NUOVO CASO',inizia:'🔎 INIZIA L\'INDAGINE',indizi:'INDIZI TROVATI',taccuino:'📓 TACCUINO',
      aiuto:'💡 AIUTO',risolvi:'🔎 RISOLVI IL CASO',trovato:'🔎 INDIZIO TROVATO',testim:'👤 TESTIMONIANZA',aggiungi:'AGGIUNGI AGLI INDIZI',
      sicuro:'Sei sicuro di avere abbastanza indizi?',continua:'CONTINUA L\'INDAGINE',ora:'RISOLVI ORA',prova:'PROVA',di:'di',
      risolto:'🔓 MISTERO RISOLTO!',completato:'CASO COMPLETATO',storia:'📖 LA STORIA BIBLICA',errori:'ERRORI',aiuti:'AIUTI',punteggio:'PUNTEGGIO',
      nonComp:'NON COMPLETATO',giorno:'🕯️ CASO DEL GIORNO',continuaInd:'▶ CONTINUA INDAGINE',bloccato:'Risolvi altri casi per aprirlo',
      vuoto:'Il taccuino è vuoto: tocca gli oggetti e le persone della scena.',conferma:'Conferma',giusto:'✓ Giusto!',sbagliato:'✗ Non è così: riprova'},
  ro:{archivio:'ARHIVA MISTERELOR',nuovo:'CAZ NOU',inizia:'🔎 ÎNCEPE ANCHETA',indizi:'INDICII GĂSITE',taccuino:'📓 CARNETUL',
      aiuto:'💡 AJUTOR',risolvi:'🔎 REZOLVĂ CAZUL',trovato:'🔎 INDICIU GĂSIT',testim:'👤 MĂRTURIE',aggiungi:'ADAUGĂ LA INDICII',
      sicuro:'Ești sigur că ai destule indicii?',continua:'CONTINUĂ ANCHETA',ora:'REZOLVĂ ACUM',prova:'PROBA',di:'din',
      risolto:'🔓 MISTER REZOLVAT!',completato:'CAZ ÎNCHEIAT',storia:'📖 ISTORIA BIBLICĂ',errori:'GREȘELI',aiuti:'AJUTOARE',punteggio:'PUNCTAJ',
      nonComp:'NEÎNCHEIAT',giorno:'🕯️ CAZUL ZILEI',continuaInd:'▶ CONTINUĂ ANCHETA',bloccato:'Rezolvă alte cazuri ca să-l deschizi',
      vuoto:'Carnetul e gol: atinge obiectele și persoanele din scenă.',conferma:'Confirmă',giusto:'✓ Corect!',sbagliato:'✗ Nu e așa: mai încearcă'}};
function misX(k){ return (MIS_TX[MIS.lg]||MIS_TX.it)[k]||k; }

/* ---------- la partita ---------- */
function nuovaPartitaMistero(){
  gnFermaTimer();
  /* in gara: chi viene dopo gioca lo STESSO caso, così la sfida è alla pari */
  if(GARA&&GARA.attiva&&GARA.gioco==='mistero'&&MIS.garaCaso&&GARA.turno>0) return misApri(MIS.garaCaso,true);
  if(!(GARA&&GARA.attiva&&GARA.gioco==='mistero')) MIS.garaCaso=null;
  Object.assign(MIS,{vista:'archivio',caso:null,esito:null,fine:null});
  vMistero();
}
function misLingua(lg){ MIS.lg=lg; Object.assign(MIS,{vista:'archivio',caso:null,fine:null}); vMistero(); }
function misArchivio(){ misSalvaInCorso(); Object.assign(MIS,{vista:'archivio',caso:null,fine:null}); vMistero(); }
/* apre un caso: dall'inizio (introduzione) o, se era lasciato a metà, da dove eri */
function misApri(id,daCapo){
  const c=misTrova(id); if(!c) return;
  const p=misPr();
  if(!daCapo && p.inCorso && p.inCorso.id===id){ Object.assign(MIS,p.inCorso,{caso:id,esito:null,fine:null}); MIS.lg=p.inCorso.lg||MIS.lg; vMistero(); return; }
  Object.assign(MIS,{vista:'intro',caso:id,trovati:[],aiuti:0,errori:0,tentativi:0,prova:0,stato:null,esito:null,fine:null,pid:uid(),aiutiVisti:[]});
  if(GARA&&GARA.attiva&&GARA.gioco==='mistero'&&GARA.turno===0) MIS.garaCaso=id;
  vMistero();
}
function misInizia(){
  const c=misTrova(MIS.caso); if(!c) return;
  const d=misDati(c.id); d.iniziato=(d.iniziato||0)+1; d.volte=(d.volte||0)+1;
  MIS.vista='scena'; misSalvaInCorso(); vMistero();
}
/* il caso lasciato a metà resta salvato per il giocatore: «Continua indagine» */
function misSalvaInCorso(){
  const p=misPr();
  if(MIS.caso && (MIS.vista==='scena'||MIS.vista==='prove'))
    p.inCorso={id:MIS.caso,vista:MIS.vista,trovati:MIS.trovati.slice(),aiuti:MIS.aiuti,errori:MIS.errori,tentativi:MIS.tentativi,
      prova:MIS.prova,aiutiVisti:(MIS.aiutiVisti||[]).slice(),pid:MIS.pid,lg:MIS.lg};
  salva();
}
function misPunteggio(c){
  let p=(c.punti||2000)-MIS.trovati.length*MIS_COSTI.elemento-MIS.errori*MIS_COSTI.errore;
  for(let k=0;k<MIS.aiuti;k++) p-=MIS_COSTI.aiuto[k]||400;
  return Math.max(100,p);
}
/* toccare un elemento della scena */
function misTocca(k){
  const c=misTrova(MIS.caso); if(!c) return;
  const e=c.elementi.find(x=>x.k===k); if(!e) return;
  const gia=MIS.trovati.includes(k);
  const test=e.tipo==='t';
  apri(test?misX('testim'):misX('trovato'),`
    <div class="mis-indizio ${test?'test':''}">
      <div class="mis-ind-ic">${e.ic}</div>
      ${test?`<div class="mis-ind-chi">${esc(misT(e.chi)||misT(e.n))}</div>`:`<div class="mis-ind-chi">${esc(misT(e.n))}</div>`}
      <p class="mis-ind-tx">${test?'«':''}${esc(misT(e.tx))}${test?'»':''}</p>
    </div>`,
    gia?`<button class="bt pr" onclick="chiudi()">OK</button>`
       :`<button class="bt pi" onclick="chiudi()">✕</button><button class="bt pr" onclick="misAggiungi('${k}')">📓 ${misX('aggiungi')}</button>`,520);
}
function misAggiungi(k){
  chiudi();
  if(!MIS.trovati.includes(k)){ MIS.trovati.push(k); misSalvaInCorso(); }
  vMistero();
  const el=document.querySelector(`.mis-el[data-k="${k}"]`); if(el){ el.classList.add('mis-nuovo'); }
}
function misTaccuino(){
  const c=misTrova(MIS.caso); if(!c) return;
  const el=MIS.trovati.map(k=>c.elementi.find(x=>x.k===k)).filter(Boolean);
  apri(misX('taccuino'),`
    <div class="mis-tac-tit">${esc(misT(c.titolo))}</div>
    <div class="mis-tac-n">${misX('indizi')}: <b>${el.length}/${c.elementi.length}</b></div>
    ${el.length?`<ul class="mis-tac">${el.map(e=>`<li><span>${e.ic}</span>${esc(misT(e.nota)||misT(e.tx))}</li>`).join('')}</ul>`
      :`<p class="sotto">${esc(misX('vuoto'))}</p>`}
    ${(MIS.aiutiVisti||[]).length?`<div class="mis-tac-aiuti">${MIS.aiutiVisti.map(i=>`<p>💡 ${esc(misT(c.aiuti[i]))}</p>`).join('')}</div>`:''}`,
    `<button class="bt pr" onclick="chiudi()">OK</button>`,560);
}
function misAiuto(){
  const c=misTrova(MIS.caso); if(!c) return;
  const n=MIS.aiuti;
  if(n>=(c.aiuti||[]).length){ misTaccuino(); return; }
  const costo=MIS_COSTI.aiuto[n]||400;
  conferma(`${n+1}° ${misX('aiuto').replace('💡 ','').toLowerCase()} (−${costo} ${MIS.lg==='ro'?'puncte':'punti'})`,()=>{
    MIS.aiuti++; MIS.aiutiVisti=(MIS.aiutiVisti||[]).concat([n]); misSalvaInCorso(); vMistero();
    apri(misX('aiuto'),`<p class="mis-aiuto-tx">💡 ${esc(misT(c.aiuti[n]))}</p>`,`<button class="bt pr" onclick="chiudi()">OK</button>`,500);
  },'💡 OK');
}
function misRisolvi(){
  apri(misX('risolvi'),`<p style="font-size:18px;margin:0">${esc(misX('sicuro'))}</p>`,
    `<button class="bt pi" onclick="chiudi()">${misX('continua')}</button>
     <button class="bt pr" onclick="chiudi();misVaiProve()">${misX('ora')}</button>`,480);
}
function misVaiProve(){ MIS.vista='prove'; MIS.prova=0; MIS.stato=null; MIS.esito=null; misSalvaInCorso(); vMistero(); }
/* ---------- le prove della ricostruzione ---------- */
function misStatoProva(p){
  if(MIS.stato) return MIS.stato;
  if(p.t==='ordine') MIS.stato=gnOrdinaNuovo(misL(p.voci));
  else if(p.t==='scelta'){ const o=misL(p.opz), ord=mescola(o.map((_,i)=>i)); MIS.stato={ord, via:[]}; }
  else if(p.t==='vero') MIS.stato={sel:[]};
  return MIS.stato;
}
function misErrore(){ MIS.errori++; MIS.tentativi++; MIS.esito={ok:false}; misSalvaInCorso(); garaFatto('mistero',false,0,null); }
function misGiusto(){ MIS.tentativi++; MIS.esito={ok:true}; misSalvaInCorso(); garaFatto('mistero',true,0); }
function misScelta(i){
  const c=misTrova(MIS.caso), p=c.prove[MIS.prova], s=misStatoProva(p);
  if(MIS.esito&&MIS.esito.ok) return;
  if(s.ord[i]===p.ok){ misGiusto(); s.giusta=i; }
  else { s.via.push(i); misErrore(); }
  vMistero();
}
function misOrdina(k){
  const c=misTrova(MIS.caso), p=c.prove[MIS.prova], s=misStatoProva(p);
  if(MIS.esito&&MIS.esito.ok) return;
  MIS.esito=null;
  const r=gnOrdinaTocca(s,k);
  if(r===true) misGiusto();
  else if(r===false){ misErrore(); s.scelti=[]; s.bloccato=false; }
  vMistero();
}
function misVero(i){
  const c=misTrova(MIS.caso), p=c.prove[MIS.prova], s=misStatoProva(p);
  if(MIS.esito&&MIS.esito.ok) return;
  MIS.esito=null;
  const k=s.sel.indexOf(i); if(k>=0) s.sel.splice(k,1); else s.sel.push(i);
  vMistero();
}
function misVeroConferma(){
  const c=misTrova(MIS.caso), p=c.prove[MIS.prova], s=misStatoProva(p);
  const giuste=p.frasi.map((f,i)=>f.v?i:-1).filter(i=>i>=0);
  const ok=giuste.length===s.sel.length && giuste.every(i=>s.sel.includes(i));
  if(ok) misGiusto(); else { misErrore(); s.sel=[]; }
  vMistero();
}
function misAvanti(){
  if(garaPassa('mistero',misAvanti)) return;           /* in gara: la prova dopo è del prossimo giocatore */
  const c=misTrova(MIS.caso);
  MIS.esito=null; MIS.stato=null;
  if(MIS.prova<c.prove.length-1){ MIS.prova++; misSalvaInCorso(); vMistero(); return; }
  misFine();
}
/* ---------- il caso risolto: punti, stelle, record, trofei ---------- */
function misFine(){
  const c=misTrova(MIS.caso), p=misPr(), d=misDati(c.id);
  const tot=c.elementi.length, usati=MIS.trovati.length;
  const base=misPunteggio(c);
  const bonus={risolto:1000, nonUsati:(tot-usati)*50, senzaErrori:MIS.errori===0?500:0,
               investigatore:(MIS.aiuti===0 && usati<=Math.ceil(tot/2))?250:0, giorno:0};
  const cg=misCasoDelGiorno();
  if(cg && cg.id===c.id && !(p.giorno&&p.giorno.data===misOggi()&&p.giorno.fatto)){ bonus.giorno=300; p.giorno={data:misOggi(),fatto:true,id:c.id}; }
  const punti=base+bonus.risolto+bonus.nonUsati+bonus.senzaErrori+bonus.investigatore+bonus.giorno;
  const stelle = (MIS.errori<=1 && MIS.aiuti===0 && usati<=Math.ceil(tot*0.75)) ? 3 : (MIS.errori<=3 && MIS.aiuti<=1) ? 2 : 1;
  const primaVolta=!d.risolto, recPrima=d.best||0;
  Object.assign(d,{risolto:(d.risolto||0)+1, stelle:Math.max(d.stelle||0,stelle), best:Math.max(recPrima,punti),
    indizi:(d.indizi||0)+usati, errori:(d.errori||0)+MIS.errori, aiuti:(d.aiuti||0)+MIS.aiuti});
  delete p.inCorso;
  const maxPunti=(c.punti||2000)+1000+tot*50+500+250;
  const perc=Math.round(Math.min(100,punti/maxPunti*100));
  const r=gnFinePartita('mistero',MIS.pid,perc,{caso:c.id,punti,stelle,indizi:usati,tot,errori:MIS.errori,aiuti:MIS.aiuti});
  /* i trofei */
  const nuovi=[];
  const T=(id,et,ic,cond)=>{ if(cond && gnDaiTrofeo('mis_'+id,et,ic)) nuovi.push(ic+' '+et); };
  const ris=misRisolti();
  T('primo',MIS.lg==='ro'?'Primul mister':'Primo Mistero','🔎',ris>=1);
  T('invest',MIS.lg==='ro'?'Anchetator':'Investigatore','🕵️',ris>=5);
  T('grande',MIS.lg==='ro'?'Mare anchetator':'Grande Investigatore','🕯️',ris>=10);
  T('perfetto',MIS.lg==='ro'?'Caz perfect':'Caso Perfetto','⭐',stelle===3);
  T('senza',MIS.lg==='ro'?'Fără ajutor':'Senza Aiuto','🧠',MIS.aiuti===0);
  T('intuiz',MIS.lg==='ro'?'Intuiție':'Intuizione','⚡',usati<tot/2);
  T('maestro',MIS.lg==='ro'?'Maestrul misterelor':'Maestro dei Misteri','🏆',ris>=misCasi().length);
  salva();
  MIS.fine={punti,base,bonus,stelle,usati,tot,nuovoRecord:punti>recPrima,primaVolta,nuovi,perc,rec:r};
  MIS.vista='fine';
  vMistero();
}

/* ---------- le schermate ---------- */
function misCard(c,k){
  const aperto=misAperto(c,k), d=(misPr().casi||{})[c.id]||{};
  const df=MIS_DIF[c.dif]||MIS_DIF[1];
  return `<button class="scheda mis-card ${aperto?'':'chiuso'} ${d.risolto?'fatto':''}" ${aperto?`onclick="misApri('${c.id}')"`:'disabled'}>
    <span class="mis-num">${MIS.lg==='ro'?'CAZUL':'CASO'} ${String(c.num||k+1).padStart(2,'0')}</span>
    <span class="mis-card-ic">${aperto?c.ic:'🔒'}</span>
    <b class="mis-card-tit">${esc(misT(c.titolo))}</b>
    <span class="mis-card-rif">${d.risolto?'📖 '+esc(misT(c.rif)):'📖 ?'}</span>
    <span class="mis-card-st">${d.risolto?misStelle(d.stelle||1):aperto?esc(misX('nonComp')):esc(misX('bloccato'))}</span>
    <span class="mis-dif" style="--dc:${c.dif===3?'#ff6b81':c.dif===2?'#ffd166':'#4fd1a5'}">${df.ic} ${df[MIS.lg]||df.it}</span>
  </button>`;
}
function misHtmlArchivio(){
  const casi=misCasi(), p=misPr(), ris=misRisolti();
  const stelle=casi.reduce((s,c)=>s+(((p.casi[c.id]||{}).stelle)||0),0);
  const cg=misCasoDelGiorno(), ic=p.inCorso&&misTrova(p.inCorso.id);
  const fattoOggi=p.giorno&&p.giorno.data===misOggi()&&p.giorno.fatto;
  const gruppi=[1,2,3].map(df=>{ const el=casi.map((c,k)=>({c,k})).filter(x=>(x.c.dif||1)===df); if(!el.length) return '';
    const D=MIS_DIF[df]; return `<div class="mis-gruppo"><h2 class="mis-gr-tit">${D.ic} ${D[MIS.lg]||D.it}</h2><div class="mis-griglia">${el.map(x=>misCard(x.c,x.k)).join('')}</div></div>`; }).join('');
  return `<div class="mis-archivio">
    <div class="mis-testa-arch">
      <h2>🗂️ ${misX('archivio')}</h2>
      <span class="mis-cont">✔ ${ris}/${casi.length} · ⭐ ${stelle}/${casi.length*3}</span>
    </div>
    <div class="mis-speciali">
      ${ic?`<button class="scheda mis-spec continua" onclick="misApri('${ic.id}')"><span class="mis-spec-ic">${ic.ic}</span><span><b>${misX('continuaInd')}</b><i>${esc(misT(ic.titolo))}</i></span></button>`:''}
      ${cg?`<button class="scheda mis-spec giorno ${fattoOggi?'fatto':''}" onclick="misApri('${cg.id}')"><span class="mis-spec-ic">🕯️</span><span><b>${misX('giorno')}</b><i>${cg.ic} ${esc(misT(cg.titolo))} · ${fattoOggi?'✓':(MIS.lg==='ro'?'BONUS +300':'BONUS GIORNALIERO +300')}</i></span></button>`:''}
    </div>
    ${gruppi}
  </div>`;
}
function misHtmlIntro(c){
  const df=MIS_DIF[c.dif]||MIS_DIF[1];
  return `<div class="scheda mis-intro mis-scena-${esc(c.scena||'notte')}">
    <div class="mis-intro-lampada">🕯️</div>
    <div class="mis-intro-su">${misX('nuovo')} · ${MIS.lg==='ro'?'CAZUL':'CASO'} ${String(c.num||1).padStart(2,'0')} · ${df.ic} ${df[MIS.lg]||df.it}</div>
    <h2 class="mis-intro-tit">${c.ic} ${esc(misT(c.titolo)).toUpperCase()}</h2>
    ${c.sotto?`<p class="mis-intro-sotto">${esc(misT(c.sotto))}</p>`:''}
    <p class="mis-intro-tx">«${esc(misT(c.intro))}»</p>
    <div class="mis-intro-az">
      <button class="bt pi" onclick="misArchivio()">🗂️ ${MIS.lg==='ro'?'Arhiva':'Archivio'}</button>
      <button class="bt pr mis-grande" onclick="misInizia()">${misX('inizia')}</button>
    </div>
  </div>`;
}
function misBarra(c){
  const n=MIS.trovati.length, tot=c.elementi.length;
  return `<div class="mis-barra">
    <b class="mis-b-tit">${c.ic} ${esc(misT(c.titolo))}</b>
    <span class="mis-b-n">${misX('indizi')}: <b>${n}/${tot}</b></span>
    <span class="mis-b-pt">${gnNum(misPunteggio(c))} ${MIS.lg==='ro'?'puncte':'punti'}</span>
    <button class="bt pi mis-b-bt" onclick="misTaccuino()">${misX('taccuino')}</button>
    <button class="bt pi mis-b-bt" onclick="misAiuto()">${misX('aiuto')} ${MIS.aiuti}/${(c.aiuti||[]).length}</button>
    ${MIS.vista==='scena'?`<button class="bt pr mis-b-bt" onclick="misRisolvi()">${misX('risolvi')}</button>`:''}
  </div>`;
}
function misHtmlScena(c){
  return `${misBarra(c)}
  <div class="scheda mis-scena mis-scena-${esc(c.scena||'notte')}">
    <div class="mis-deco">${esc(c.deco||'')}</div>
    ${c.elementi.map(e=>{ const t=MIS.trovati.includes(e.k);
      return `<button class="mis-el ${t?'trovato':''} ${e.tipo==='t'?'persona':''}" data-k="${e.k}" style="--x:${e.x}%;--y:${e.y}%" onclick="misTocca('${e.k}')">
        <span class="mis-el-ic">${e.ic}</span><span class="mis-el-n">${esc(misT(e.n))}</span>${t?'<i class="mis-el-ok">✓</i>':''}</button>`; }).join('')}
  </div>`;
}
function misHtmlProva(c){
  const p=c.prove[MIS.prova], s=misStatoProva(p), E=MIS.esito;
  let corpo='';
  if(p.t==='scelta'){
    const o=misL(p.opz);
    corpo=`<div class="dom-opz gn-opz mis-opz">${s.ord.map((k,i)=>{
      const cl = (E&&E.ok&&s.giusta===i)?'giusta':(s.via.includes(i)?'sbagliata':'');
      return `<button class="bt ${cl}" ${(E&&E.ok)||s.via.includes(i)?'disabled':''} onclick="misScelta(${i})">${esc(o[k])}</button>`; }).join('')}</div>`;
  } else if(p.t==='ordine'){
    corpo=gnOrdinaHtml(s,'misOrdina');
  } else if(p.t==='vero'){
    corpo=`<div class="mis-vero">${p.frasi.map((f,i)=>`<button class="bt mis-v ${s.sel.includes(i)?'on':''}" ${E&&E.ok?'disabled':''} onclick="misVero(${i})"><span class="mis-v-box">${s.sel.includes(i)?'✓':''}</span>${esc(misT(f.t))}</button>`).join('')}</div>
      ${E&&E.ok?'':`<div class="gn-centro"><button class="bt pr" onclick="misVeroConferma()">${misX('conferma')}</button></div>`}`;
  }
  return `${misBarra(c)}
  <div class="scheda mis-prova">
    <div class="mis-p-su">🧩 ${misX('prova')} ${MIS.prova+1} ${misX('di')} ${c.prove.length}</div>
    <h2 class="mis-p-q">${esc(misT(p.q))}</h2>
    ${corpo}
    ${E?`<div class="gn-esito ${E.ok?'si':'no'}"><b>${E.ok?misX('giusto'):misX('sbagliato')}</b>${E.ok?'':`<span class="gn-punti">−${MIS_COSTI.errore}</span>`}</div>`:''}
    ${E&&E.ok?`<div class="gn-centro"><button class="bt pr mis-grande" onclick="misAvanti()">${MIS.prova<c.prove.length-1?(MIS.lg==='ro'?'Proba următoare →':'Prova successiva →'):'🔓 '+(MIS.lg==='ro'?'Rezolvă misterul':'Risolvi il mistero')}</button></div>`:''}
  </div>`;
}
function misHtmlFine(c){
  const F=MIS.fine, L=MIS.lg==='ro';
  const riga=(e,v,cl)=>`<div class="mis-f-riga ${cl||''}"><span>${e}</span><b>${v}</b></div>`;
  const b=F.bonus;
  const idx=misCasi().indexOf(c), dopo=misCasi().find((x,k)=>k>idx && misAperto(x,k) && !((misPr().casi[x.id]||{}).risolto));
  return `<div class="mis-fine">
    <div class="scheda mis-risolto">
      <div class="mis-lucchetto">🔓</div>
      <h2>${misX('risolto')}</h2>
      <div class="mis-f-comp">${misX('completato')}</div>
      <div class="mis-stelle">${misStelle(F.stelle)}</div>
      ${F.nuovoRecord?`<div class="mis-record">🎉 ${L?'RECORD NOU!':'NUOVO RECORD!'}</div>`:''}
      ${F.nuovi.length?`<div class="mis-trofei">🏆 ${F.nuovi.map(esc).join(' · ')}</div>`:''}
    </div>
    <div class="scheda mis-storia">
      <h2>${misX('storia')}</h2>
      <b class="mis-s-tit">${c.ic} ${esc(misT(c.titolo))} — ${esc(misT(c.rif))}</b>
      <p>${esc(misT(c.storia))}</p>
      ${c.rifN?gnRifBt(c.rifN,MIS.lg):''}
    </div>
    <div class="scheda mis-conti">
      ${riga(misX('indizi'),`${F.usati}/${F.tot}`)}${riga(misX('errori'),MIS.errori)}${riga(misX('aiuti'),MIS.aiuti)}
      ${riga(L?'Punctaj de anchetă':'Punteggio d\'indagine',gnNum(F.base))}
      ${riga(L?'Caz rezolvat':'Caso risolto','+'+gnNum(b.risolto))}
      ${b.nonUsati?riga(L?'Indicii nefolosite':'Indizi non utilizzati','+'+gnNum(b.nonUsati)):''}
      ${b.senzaErrori?riga(L?'Nicio greșeală':'Nessun errore','+'+gnNum(b.senzaErrori)):''}
      ${b.investigatore?riga(L?'Bonus anchetator':'Bonus investigatore','+'+gnNum(b.investigatore)):''}
      ${b.giorno?riga(L?'Bonusul zilei':'Bonus giornaliero','+'+gnNum(b.giorno)):''}
      ${riga(misX('punteggio'),gnNum(F.punti),'tot')}
      ${htmlPremio('mistero',F.perc,{senzaClassifica:false})}
      <div class="gn-centro mis-f-az">
        <button class="bt pi" onclick="misArchivio()">🗂️ ${L?'Arhiva':'Archivio'}</button>
        ${dopo&&!(GARA&&GARA.attiva)?`<button class="bt pr" onclick="misApri('${dopo.id}')">${dopo.ic} ${L?'Cazul următor':'Prossimo caso'} →</button>`:''}
      </div>
    </div>
  </div>`;
}
function vMistero(){
  if(GIO.giocatore) return vPaginaGiocatore();
  /* la scena e le prove stanno ferme nello schermo come gli altri giochi; l'archivio e la fine scorrono */
  document.body.classList.toggle('gio-fissa', ['intro','scena','prove'].includes(MIS.vista));
  const c=misTrova(MIS.caso);
  let corpo;
  if(!misCasi().length) corpo=`<div class="vuoto">I casi non sono stati caricati.</div>`;
  else if(!c || MIS.vista==='archivio') corpo=misHtmlArchivio();
  else if(MIS.vista==='intro') corpo=misHtmlIntro(c);
  else if(MIS.vista==='scena') corpo=misHtmlScena(c);
  else if(MIS.vista==='prove') corpo=misHtmlProva(c);
  else if(MIS.vista==='fine' && MIS.fine) corpo=misHtmlFine(c);
  else corpo=misHtmlArchivio();
  pinta(`
  <div class="gio-pagina gn-pagina mis-pagina">
  ${gnTesta('mistero','🕯️','Mistero Biblico')}
  ${MIS.vista==='archivio'?`<div class="scelte scelte-3">
    ${gnLingua(MIS,'misLingua')}
    <div class="scelta" style="--ac:#ffb37a"><div class="scelta-tit">💾 ${MIS.lg==='ro'?'Progrese':'Progressi'}</div>
      <div class="scelta-op"><span class="sotto" style="margin:0">${MIS.lg==='ro'?'Salvate pentru':'Salvati per'} ${esc(gnChiGioca())}: ${MIS.lg==='ro'?'poți lăsa un caz la jumătate și să continui.':'puoi lasciare un caso a metà e continuare.'}</span></div></div>
  </div>`:''}
  ${corpo}
  </div>`);
}
/* le statistiche di un giocatore, per la sua pagina */
function misHtmlProgressi(pid){
  const pr=((gnProgressiDi(pid)||{}).mistero||{}), casi=pr.casi||{}, tutti=misCasi();
  const v=Object.keys(casi).filter(k=>misTrova(k)).map(k=>casi[k]);
  if(!v.length) return [];
  const somma=f=>v.reduce((s,x)=>s+(+x[f]||0),0);
  const risolti=v.filter(x=>x.risolto).length;
  const rec=v.reduce((m,x)=>Math.max(m,x.best||0),0);
  const punti=partiteDi('mistero',pid).reduce((s,r)=>s+(+((r.d||{}).punti)||0),0);
  return [`🗂️ Casi iniziati: <b>${v.filter(x=>x.iniziato).length}</b> · risolti: <b>${risolti}</b> su ${tutti.length} (<b>${Math.round(risolti/Math.max(1,tutti.length)*100)}%</b>)`,
    `⭐ Stelle: <b>${somma('stelle')}</b> su ${tutti.length*3} · 🏅 Record: <b>${gnNum(rec)}</b> punti · Punti in tutto: <b>${gnNum(punti)}</b>`,
    `🔎 Indizi usati: <b>${somma('indizi')}</b> · ✗ Errori: <b>${somma('errori')}</b> · 💡 Aiuti: <b>${somma('aiuti')}</b>`,
    ...tutti.filter(c=>casi[c.id]&&casi[c.id].risolto).map(c=>`${c.ic} ${esc(gnT(c.titolo,'it'))} – ${misStelle(casi[c.id].stelle||1)}`)];
}
