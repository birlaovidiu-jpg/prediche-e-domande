/* ================= LETTORE DEL LEZIONARIO ================= */
/* Il disegno del PDF si appoggia a requestAnimationFrame, che il browser ferma
   quando la pagina non è in primo piano (per esempio se cambi app sull'iPad).
   Con questa rete di sicurezza il lavoro va avanti lo stesso. */
(function(){
  const raf=window.requestAnimationFrame ? window.requestAnimationFrame.bind(window) : null;
  window.requestAnimationFrame=cb=>{
    if(document.hidden||!raf) return setTimeout(()=>cb(performance.now()),16);
    return raf(cb);
  };
})();
let _pdfPronto=null;
function caricaPdfJs(){
  if(_pdfPronto) return _pdfPronto;
  _pdfPronto=new Promise((ok,no)=>{
    try{
      if(!window.pdfjsLib) throw new Error('motore PDF non incluso');
      const el=document.getElementById('pdfWorkerSrc');
      if(el&&el.textContent.length>1000){
        const u=URL.createObjectURL(new Blob([el.textContent],{type:'application/javascript'}));
        pdfjsLib.GlobalWorkerOptions.workerSrc=u;
      }
      ok(true);
    }catch(e){ no(e); }
  });
  return _pdfPronto;
}
async function paginaInImmagine(doc,n,larghezza){
  const pg=await doc.getPage(n);
  const v0=pg.getViewport({scale:1});
  const sc=(larghezza||520)/v0.width;
  const v=pg.getViewport({scale:sc});
  const c=document.createElement('canvas'); c.width=Math.round(v.width); c.height=Math.round(v.height);
  await pg.render({canvasContext:c.getContext('2d'),viewport:v}).promise;
  return c.toDataURL('image/jpeg',0.82);
}

const LET={ lez:null, doc:null, docCop:null, nCop:0, pag:1, tot:1, zoom:1,
            strumento:'mano', colore:'#e02b3c', spessore:3, grandezza:4, opacita:0.56, spessoreRiga:1, carattere:'serif',
            colori:{evid:'#e02b3c',sott:'#e02b3c',penna:'#e02b3c',testo:'#e02b3c'},
            modo:'pagina', righe:{}, disegna:false, tratto:null, pagine:{}, dim:{} };
/* le icone della barra: disegnate, così si capisce a colpo d'occhio cosa fanno */
const _sv=(d,extra)=>`<svg viewBox="0 0 24 24" width="22" height="22" fill="none"
  stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const ICO={
  evid:{t:'Evidenziatore — trascina il dito sulle righe',
        s:_sv('<path d="M4 19h6"/><path d="M14.5 3.5 20.5 9.5"/><path d="M16.5 5.5 8 14l-1 4 4-1 8.5-8.5z" fill="currentColor" fill-opacity=".25"/>')},
  sott:{t:'Sottolinea — trascina il dito sulle righe',
        s:_sv('<path d="M6 4v6a6 6 0 0 0 12 0V4"/><path d="M4 20h16" stroke-width="2.6"/>')},
  penna:{t:'Scrivi a mano libera',
        s:_sv('<path d="M12.5 4.5 19.5 11.5"/><path d="M17.5 2.5a2.1 2.1 0 0 1 3 3L8 18l-4.5 1.5L5 15z"/>')},
  testo:{t:'Scrivi un testo — puoi anche dettarlo a voce',
        s:_sv('<path d="M5 6V4h14v2"/><path d="M12 4v16"/><path d="M9 20h6"/>')},
  gomma:{t:'Cancella quello che tocchi',
        s:_sv('<path d="M8 20h11"/><path d="M15.5 4.5 4.5 15.5a2 2 0 0 0 0 3l2 2h5l9-9a2 2 0 0 0 0-3l-2-2a2 2 0 0 0-3 0z"/>')},
  indice:{t:'Indice: tutte le lezioni e i sabati',
        s:_sv('<path d="M4 5h4v14H4z"/><path d="M10 6h10"/><path d="M10 10h10"/><path d="M10 14h10"/><path d="M10 18h7"/>')},
  sabato:{t:'La lezione del sabato che viene',
        s:_sv('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18"/><path d="M8 3v4"/><path d="M16 3v4"/><path d="M9 15l2 2 4-4"/>')},
  scorri:{t:'Pagina singola o scorrimento',
        s:_sv('<rect x="5" y="3" width="14" height="8" rx="1.5"/><rect x="5" y="14" width="14" height="8" rx="1.5"/><path d="M9 12.5h6" stroke-dasharray="2 2"/>')},
  annulla:{t:'Annulla l\'ultima cosa che hai fatto',
        s:_sv('<path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>')},
  lista:{t:'I tuoi appunti su questa pagina: guarda e cancella',
        s:_sv('<path d="M8 6h12"/><path d="M8 12h12"/><path d="M8 18h12"/><circle cx="4" cy="6" r="1.4"/><circle cx="4" cy="12" r="1.4"/><circle cx="4" cy="18" r="1.4"/>')},
  pulisci:{t:'Pulisci: trascina un riquadro e togli gli appunti che ci sono dentro',
        s:_sv('<path d="M4 21h16"/><path d="M6 21V9l6-6 6 6v12"/><path d="M10 21v-6h4v6"/>')}
};
/* i colori per evidenziare (chiari) e per scrivere (pieni) */
/* i colori con cui si può tingere la carta della pagina */
const COL_PAGINA=[['#ffffff','Bianca'],['#fffdf7','Bianco panna chiaro'],['#fdf6e3','Panna'],
                  ['#f6e9cf','Sabbia'],['#f0ead6','Avorio'],['#e8f5e9','Verde chiaro'],
                  ['#e9efe6','Verde tenue'],['#e6f2fb','Azzurra'],['#f3eefb','Lilla chiaro'],
                  ['#fdeaf0','Rosa'],['#ededed','Grigia']];
const COL_EVID_LEZ=['#ffd23f','#ffe98a','#ff9ecb','#ff7f7f','#ffb37a','#ffd9a0',
                    '#8de08d','#b7f0a8','#7fc9ff','#a8e6ff','#d7a6ff','#c3b8ff',
                    '#9fe8d8','#e6e6a8'];
const COL_PENNA_LEZ=['#e02b3c','#b3122a','#1f6feb','#0b3f9e','#128a3c','#0a5c2a',
                     '#a24bd8','#6a2fa0','#e07b00','#8a5a2b','#111111','#555f6e',
                     '#c8a02e','#ffffff','#00b894','#f368e0','#c23616','#2d3436',
                     '#ff3f34','#3ae374','#7158e2','#0abde3','#01a3a4','#b33771','#6d214f'];

/* ---------- apertura ---------- */
async function apriLez(i,pagina){
  const l=trovaLez(i); if(!l) return;
  LET.lez=l; LET.zoom=1; LET.strumento='mano'; LET.righe={}; LET.pagine={};
  LET.altrui={}; LET._par={};
  LET.modo=stato.imp.modoLettore||'scorrimento';
  let box=$('#lettore');
  if(!box){ box=document.createElement('div'); box.id='lettore'; document.body.appendChild(box); }
  box.className='on';
  box.innerHTML=`
   <button id="letEsc" onclick="chiudiLet()" title="Esci">esc</button>
   <div class="let-sx" id="letSx">
     ${[['evid','Evidenzia'],['sott','Sottolinea'],['penna','Penna'],['testo','Scrivi'],['gomma','Cancella']].map(([k,et])=>
       `<button class="lst" data-s="${k}" onclick="setStru('${k}')" title="${ICO[k].t}">${ICO[k].s}<i>${et}</i></button>`).join('')}
     <div class="lst-sep"></div>
     <button class="lst" id="letColore" onclick="apriColoriLet()" title="Scegli il colore"><span class="pallino"></span><i>Colore</i></button>
     <div class="lst-sep"></div>
     <button class="lst" onclick="apriIndiceLez()" title="${ICO.indice.t}">${ICO.indice.s}<i>Indice</i></button>
     <button class="lst" onclick="vaiAlSabato()" title="${ICO.sabato.t}">${ICO.sabato.s}<i>Sabato</i></button>
     <button class="lst" id="letModo" onclick="cambiaModo()" title="Pagina singola o scorrimento">${ICO.scorri.s}<i id="letModoEt">Scorri</i></button>
     <div class="lst-sep"></div>
     <button class="lst" id="letAnnulla" onclick="annullaAppunto()" title="${ICO.annulla.t}">${ICO.annulla.s}<i>Annulla</i></button>
     <button class="lst" onclick="apriAppunti()" title="${ICO.lista.t}">${ICO.lista.s}<i>Appunti</i></button>
     <button class="lst" data-s="pulisci" onclick="setStru('pulisci')" title="${ICO.pulisci.t}">${ICO.pulisci.s}<i>Pulisci</i></button>
   </div>
   <div class="let-area" id="letArea"></div>
   <div class="let-pie" id="letPie">
     <button class="cmd pic" onclick="vaiPag(LET.pag-1)">←</button>
     <input type="number" id="letPag" value="1" min="1" onchange="vaiPag(+this.value)">
     <span id="letTot"></span>
     <button class="cmd pic" onclick="vaiPag(LET.pag+1)">→</button>
     <span class="let-sep"></span>
     <button class="cmd pic" onclick="zoomLez(-0.15)">−</button>
     <span id="letZoom">100%</span>
     <button class="cmd pic" onclick="zoomLez(0.15)">+</button>
     <span class="let-sep"></span>
     <span class="let-nome">${esc(l.titolo||('Lezionario '+l.anno))}</span>
   </div>
   <div class="let-carico" id="letCarico">Apro il lezionario…</div>`;
  document.documentElement.style.overflow='hidden';
  setStru('mano'); setCol(LET.colore);
  applicaCarta();
  aggiornaModo();
  try{
    await caricaPdfJs();
    const b1=await kvGet('all:'+l.fid);
    if(!b1) throw new Error('il file non è più disponibile');
    LET.doc=await pdfjsLib.getDocument({data:new Uint8Array(await b1.arrayBuffer())}).promise;
    if(l.cid){ const b2=await kvGet('all:'+l.cid);
      if(b2) LET.docCop=await pdfjsLib.getDocument({data:new Uint8Array(await b2.arrayBuffer())}).promise; }
    LET.nCop=LET.docCop?LET.docCop.numPages:0;
    LET.tot=LET.nCop+LET.doc.numPages;
    $('#letTot').textContent='/ '+LET.tot;
    $('#letPag').max=LET.tot;
    if(!l.lezioni||!l.lezioni.length) analizzaLezionario(l);
    portaAppuntiVecchi(l);
    const p = pagina || paginaDaAprire(l);
    $('#letCarico').style.display='none';
    if(LET.modo==='scorrimento') await apriScorrimento(p); else await mostraPag(p);
  }catch(e){ console.error(e); const c=$('#letCarico'); if(c) c.textContent='Errore: '+e.message; }
}
function chiudiLet(){
  ricordaPagina();
  clearInterval(LET._tv);
  const b=$('#lettore'); if(b){ b.className=''; b.innerHTML=''; }
  document.documentElement.style.overflow='';
  LET.doc=LET.docCop=null; salva();
  if(sezione==='sabato') vSabato();
}
function ricordaPagina(){ if(LET.lez){ LET.lez.ultimaPag=LET.pag; LET.lez.quandoLetto=new Date().toISOString(); } }

/* ---------- strumenti ---------- */
function setStru(s){
  const prima=LET.strumento;
  /* toccando di nuovo lo stesso pulsante lo si spegne: torna la mano libera */
  if(s===prima && s!=='mano') s='mano';
  LET.strumento=s;

  $$('.lst').forEach(b=>b.classList.toggle('on',b.dataset.s===s));
  $$('.let-note').forEach(n=>n.style.pointerEvents = s==='mano'?'none':'auto');
  const a=$('#letArea'); if(a) a.classList.toggle('con-strumento',s!=='mano');
  mostraColore();
  if(s==='testo') avvisa('Tocca la pagina dove vuoi scrivere','ok');
  else if(s==='mano'&&prima!=='mano') avvisa('Strumento spento','ok');
}
/* ogni strumento si ricorda il suo colore: l'evidenziatore giallo,
   la riga rossa, la penna nera… senza pestarsi i piedi */
function strumentoColore(){ return ['evid','sott','penna','testo'].includes(LET.strumento)?LET.strumento:'penna'; }
function setCol(c){
  LET.colore=c;
  LET.colori=LET.colori||{};
  LET.colori[strumentoColore()]=c;
  mostraColore();
}
/* il colore della carta */
function coloreCarta(){ return stato.imp.cartaLettore||'#ffffff'; }
function setColPagina(c){
  stato.imp.cartaLettore=c; salva();
  applicaCarta();
  $$('#colPag .col-g').forEach(b=>b.classList.toggle('on',b.style.backgroundColor===hexRgb(c)));
}
function applicaCarta(){
  const b=$('#lettore'); if(b) b.style.setProperty('--carta',coloreCarta());
}
/* il colore della riga si sceglie qui, senza cambiare strumento */
function setColSott(c){
  LET.colori=LET.colori||{};
  LET.colori.sott=c;
  if(LET.strumento==='sott'){ LET.colore=c; mostraColore(); }
  $$('#colSott .col-g').forEach(b=>b.classList.toggle('on',b.style.background&&
    b.style.backgroundColor===hexRgb(c)));
  antTratti();
}
function hexRgb(h){
  const n=parseInt(h.slice(1),16);
  return `rgb(${(n>>16)&255}, ${(n>>8)&255}, ${n&255})`;
}
function mostraColore(){
  const k=strumentoColore();
  if(LET.colori&&LET.colori[k]) LET.colore=LET.colori[k];
  const b=$('#letColore'); if(b){ const p=b.querySelector('.pallino'); if(p) p.style.background=LET.colore; }
}
function apriColoriLet(){
  const tav = (LET.strumento==='evid') ? COL_EVID_LEZ.concat(COL_PENNA_LEZ) : COL_PENNA_LEZ.concat(COL_EVID_LEZ);
  apri('Colore',`<div class="col-griglia">${tav.map(c=>
      `<button class="col-g${c===LET.colore?' on':''}" style="background:${c}" onclick="setCol('${c}');chiudi()"></button>`).join('')}</div>
    <div class="campo" style="margin-top:16px"><label>Colore della pagina</label>
      <div class="col-griglia" id="colPag">${COL_PAGINA.map(([c,nm])=>
        `<button class="col-g pic2${c===coloreCarta()?' on':''}" style="background:${c}" title="${nm}"
          onclick="setColPagina('${c}')"></button>`).join('')}</div></div>
    <div class="campo" style="margin-top:16px"><label>Colore della riga per sottolineare</label>
      <div class="col-griglia" id="colSott">${COL_PENNA_LEZ.concat(COL_EVID_LEZ).map(c=>
        `<button class="col-g pic2${c===(LET.colori&&LET.colori.sott)?' on':''}" style="background:${c}"
          onclick="setColSott('${c}')"></button>`).join('')}</div></div>
    <div class="campo" style="margin-top:14px"><label>Quanto è trasparente l'evidenziatore
      — <b id="etOp">${Math.round(LET.opacita*100)}%</b> di colore</label>
      <input type="range" min="20" max="100" value="${Math.round(LET.opacita*100)}"
        oninput="LET.opacita=+this.value/100;document.getElementById('etOp').textContent=this.value+'%';antTratti()"></div>
    <div class="campo"><label>Grossezza della riga per sottolineare — <b id="etRg">${LET.spessoreRiga}</b></label>
      <input type="range" min="1" max="12" value="${LET.spessoreRiga}"
        oninput="LET.spessoreRiga=+this.value;document.getElementById('etRg').textContent=this.value;antTratti()"></div>
    <div class="campo"><label>Grossezza della penna — <b id="etSp">${LET.spessore}</b></label>
      <input type="range" min="2" max="20" value="${LET.spessore}"
        oninput="LET.spessore=+this.value;document.getElementById('etSp').textContent=this.value"></div>
    <canvas id="antCol" width="420" height="74" style="width:100%;border-radius:10px;background:#fff;margin-top:6px"></canvas>`,
    `<button class="bt pr" onclick="chiudi()">Va bene</button>`,460);
  antTratti();
}
/* l'anteprima: fa vedere subito com'è l'evidenziato e la riga */
function antTratti(){
  const c=$('#antCol'); if(!c) return;
  const x=c.getContext('2d');
  x.clearRect(0,0,c.width,c.height);
  x.fillStyle='#222'; x.font='16px Georgia,serif';
  x.save();
  x.globalCompositeOperation='multiply';
  x.globalAlpha=(LET.opacita!=null?LET.opacita:1); x.fillStyle=LET.colore;
  x.fillRect(18,12,384,26); x.restore();
  x.fillStyle='#222'; x.fillText('Così si vede l\'evidenziatore',24,31);
  x.strokeStyle=(LET.colori&&LET.colori.sott)||LET.colore; x.lineWidth=Math.max(1,LET.spessoreRiga); x.lineCap='round';
  x.beginPath(); x.moveTo(18,62); x.lineTo(402,62); x.stroke();
  x.fillStyle='#222'; x.fillText('e così la riga sotto al testo',24,57);
}
function cambiaModo(){
  LET.modo = LET.modo==='pagina' ? 'scorrimento' : 'pagina';
  stato.imp.modoLettore=LET.modo; salva(); aggiornaModo();
  if(LET.modo==='scorrimento') apriScorrimento(LET.pag); else mostraPag(LET.pag);
}
function aggiornaModo(){
  const b=$('#letModo'); if(!b) return;
  const et=$('#letModoEt'); if(et) et.textContent = LET.modo==='scorrimento' ? 'Scorri' : 'Pagina';
  b.classList.toggle('on',LET.modo==='scorrimento');
  b.title = LET.modo==='scorrimento' ? 'Adesso scorri senza fine: tocca per una pagina alla volta'
                                     : 'Adesso una pagina alla volta: tocca per scorrere senza fine';
  const a=$('#letArea'); if(a) a.classList.toggle('scorre',LET.modo==='scorrimento');
}
function zoomLez(d){
  LET.zoom=Math.max(0.5,Math.min(3,LET.zoom+d));
  const z=$('#letZoom'); if(z) z.textContent=Math.round(LET.zoom*100)+'%';
  if(LET.modo==='scorrimento') apriScorrimento(LET.pag); else mostraPag(LET.pag);
}
/* porta la pagina n in cima allo schermo: conto io i pixel, perché
   scrollIntoView su elenchi lunghi a volte non si muove */
function portaAPagina(n){
  const area=$('#letArea'), f=document.querySelector(`.let-foglio[data-p="${n}"]`);
  if(!area||!f) return false;
  const rA=area.getBoundingClientRect(), rF=f.getBoundingClientRect();
  area.scrollTop += (rF.top-rA.top) - 10;
  disegnaPagina(n);
  return true;
}
function vaiPag(n){
  if(n<1||n>LET.tot) return;
  if(LET.modo==='scorrimento'){
    LET.pag=n; const c=$('#letPag'); if(c) c.value=n;
    if(portaAPagina(n)){ ricordaPagina(); return; }
  }
  mostraPag(n);
}
function nudo(){ const b=$('#lettore'); if(b) b.classList.toggle('nudo'); }
/* vai diritto alla lezione del sabato che viene */
function vaiAlSabato(){
  const l=LET.lez; if(!l) return;
  if(!l.lezioni||!l.lezioni.length) analizzaLezionario(l);
  let q=lezioneDelSabato(l);
  if(!q) q=(l.lezioni||[])[0];
  if(!q){ avvisa('In questo file non trovo né lezioni né date: usa l\'indice o i numeri di pagina','no'); apriIndiceLez(); return; }
  vaiPag(q.pag);
  avvisa(`Lezione ${q.n} — ${q.tit}`,'ok');
}

/* ---------- disegno di una pagina ---------- */
function foglioHtml(n,larg,alt){
  return `<div class="let-foglio" data-p="${n}" style="width:${Math.round(larg)}px;height:${Math.round(alt)}px">
      <canvas class="let-pdf"></canvas>
      <canvas class="let-evid"></canvas>
      <canvas class="let-note"></canvas>
      <div class="let-testi"></div>
      <span class="let-num">${n}</span>
    </div>`;
}
async function misuraPagina(n){
  if(LET.dim[n]) return LET.dim[n];
  const daCop=n<=LET.nCop, doc=daCop?LET.docCop:LET.doc, num=daCop?n:(n-LET.nCop);
  const pg=await doc.getPage(num);
  const v=pg.getViewport({scale:1});
  return (LET.dim[n]={w:v.width,h:v.height});
}
/* quanto è larga la pagina: di base quella che entra tutta nello schermo */
function largSchermo(){
  const a=$('#letArea');
  const lw=(a?a.clientWidth:window.innerWidth)-(window.innerWidth<760?8:56);
  const lh=(a?a.clientHeight:window.innerHeight)-(window.innerWidth<760?16:40);
  const d=LET.dim[LET.pag]||LET.dim[1];
  if(d){ const perAltezza=lh*d.w/d.h; return Math.max(240,Math.min(lw,perAltezza)); }
  return Math.max(240,lw);
}
/* pizzicare con due dita per ingrandire o rimpicciolire */
function distanza(e){ const [a,b]=e.touches; return Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY); }
function pizzicoGiu(e){
  if(e.touches.length!==2) return;
  LET._pz={d0:distanza(e), z0:LET.zoom};
  const s=$('#letStack'); if(s) s.style.transformOrigin='top center';
}
function pizzicoMuovi(e){
  if(!LET._pz||e.touches.length!==2) return;
  e.preventDefault();
  const k=distanza(e)/LET._pz.d0;
  LET._pz.k=Math.max(0.4,Math.min(4/LET._pz.z0,k));
  const s=$('#letStack'); if(s) s.style.transform='scale('+LET._pz.k+')';
}
function pizzicoSu(){
  if(!LET._pz) return;
  const k=LET._pz.k||1; LET._pz=null;
  const s=$('#letStack'); if(s) s.style.transform='';
  const nuovo=Math.max(0.5,Math.min(4,LET.zoom*k));
  if(Math.abs(nuovo-LET.zoom)<0.02) return;
  LET.zoom=nuovo;
  const z=$('#letZoom'); if(z) z.textContent=Math.round(LET.zoom*100)+'%';
  if(LET.modo==='scorrimento') apriScorrimento(LET.pag); else mostraPag(LET.pag);
}
/* Quanto fitta è la tela sotto alla pagina: più punti per centimetro,
   più le lettere sono nitide. Prima si disegnava alla misura dello schermo
   e il testo veniva sgranato; adesso si disegna piu' fine e si rimpicciolisce,
   come fa la stampante. */
function fittezza(){
  const d=window.devicePixelRatio||1;
  return Math.min(3, Math.max(2, d*1.5));
}
/* le tele degli appunti non hanno bisogno di essere altrettanto fitte:
   sono righe e non lettere, e così resta memoria per la pagina */
function fittezzaNote(){ return Math.min(2, Math.max(1.25, (window.devicePixelRatio||1))); }
/* Quante pagine posso tenere disegnate senza che l'iPad me le faccia bianche:
   conto quanta memoria costa una pagina a questa fittezza e mi tengo dentro
   a un tetto prudente. */
function raggioVivo(){
  const d=LET.pagine[LET.pag]||LET.dim[LET.pag]||LET.dim[1];
  if(!d||!d.w) return 2;
  const larg=largSchermo()*LET.zoom, alt=larg*(d.h/d.w||1.4);
  const f=fittezza(), fn=fittezzaNote();
  const costo=larg*alt*4*(f*f + 2*fn*fn);
  const quante=Math.floor(190*1024*1024/Math.max(1,costo));
  return Math.max(1, Math.min(3, Math.floor((quante-1)/2)));
}
async function disegnaPagina(n){
  const f=document.querySelector(`.let-foglio[data-p="${n}"]`);
  if(!f||f.dataset.fatto==='1') return;
  f.dataset.fatto='1';
  try{ await disegnaDavvero(n,f); }
  catch(e){ delete f.dataset.fatto; console.warn('pagina',n,e); }
}
async function disegnaDavvero(n,f){
  const daCop=n<=LET.nCop, doc=daCop?LET.docCop:LET.doc, num=daCop?n:(n-LET.nCop);
  const pg=await doc.getPage(num);
  const v0=pg.getViewport({scale:1});
  const sc=(largSchermo()/v0.width)*LET.zoom;
  const v=pg.getViewport({scale:sc});
  const c=f.querySelector('.let-pdf'), nt=f.querySelector('.let-note'), ev=f.querySelector('.let-evid');
  const dpr=fittezza(), dprN=fittezzaNote();
  c.width=Math.round(v.width*dpr); c.height=Math.round(v.height*dpr);
  c.style.width=Math.round(v.width)+'px'; c.style.height=Math.round(v.height)+'px';
  [nt,ev].forEach(z=>{ z.width=Math.round(v.width*dprN); z.height=Math.round(v.height*dprN);
    z.style.width=Math.round(v.width)+'px'; z.style.height=Math.round(v.height)+'px'; });
  f.style.width=Math.round(v.width)+'px'; f.style.height=Math.round(v.height)+'px';
  const cx=c.getContext('2d',{alpha:false}); cx.setTransform(dpr,0,0,dpr,0,0);
  cx.fillStyle='#fff'; cx.fillRect(0,0,v.width,v.height);
  await pg.render({canvasContext:cx,viewport:v,intent:'display'}).promise;
  LET.pagine[n]={w:v.width,h:v.height,dpr:dprN};
  /* dove stanno le righe di testo: serve per evidenziare e sottolineare */
  try{
    const tc=await pg.getTextContent();
    const el=[];
    tc.items.forEach(it=>{
      if(!it.str||!it.str.trim()) return;
      const t=pdfjsLib.Util.transform(v.transform,it.transform);
      const h=Math.hypot(t[2],t[3])||it.height*sc;
      const w=it.width*sc;
      el.push({x:t[4]/v.width,y:(t[5]-h)/v.height,w:w/v.width,h:h/v.height,s:it.str});
    });
    LET.righe[n]=raggruppaRighe(el);
    if(LET._par) delete LET._par[n];
  }catch(e){ LET.righe[n]=[]; if(LET._par) delete LET._par[n]; }
  /* mi procuro anche le righe delle altre pagine del giorno: servono per
     ricucire i capoversi tagliati dal cambio di pagina */
  try{ preparaGiorno(n); }catch(e){}
  disegnaNote(n);
  mostraTesti(n);
  nt.style.pointerEvents = LET.strumento==='mano'?'none':'auto';
  liberaLontane(n,pagineInVista());
}
/* L'iPad e il telefono tengono in memoria poche tele: se ne apro novanta
   le altre restano bianche. Tengo disegnate solo le pagine qui attorno
   e libero le altre, che si ridisegnano appena torni. */
function liberaLontane(centro,tieni){
  if(LET.modo!=='scorrimento') return;
  const salve=new Set(tieni||[]);
  $$('.let-foglio').forEach(f=>{
    const n=+f.dataset.p;
    if(!f.dataset.fatto || Math.abs(n-centro)<=raggioVivo() || salve.has(n)) return;
    delete f.dataset.fatto;
    f.querySelectorAll('canvas').forEach(c=>{ c.width=1; c.height=1; c.style.width=''; c.style.height=''; });
    const tx=f.querySelector('.let-testi'); if(tx) tx.innerHTML='';
    delete LET.pagine[n];
  });
}
function raggruppaRighe(el){
  el.sort((a,b)=>a.y-b.y || a.x-b.x);
  const righe=[];
  el.forEach(it=>{
    const r=righe.find(r=>Math.abs((r.y+r.h/2)-(it.y+it.h/2)) < Math.max(r.h,it.h)*0.6);
    if(r){ r.el.push(it); r.y=Math.min(r.y,it.y); r.h=Math.max(r.h,it.h); }
    else righe.push({y:it.y,h:it.h,el:[it]});
  });
  righe.forEach(r=>r.el.sort((a,b)=>a.x-b.x));
  return righe.sort((a,b)=>a.y-b.y);
}
async function mostraPag(n){
  LET.pag=Math.max(1,Math.min(LET.tot,n));
  const p=$('#letPag'); if(p) p.value=LET.pag;
  ricordaPagina();
  const area=$('#letArea');
  const d=await misuraPagina(LET.pag);
  const larg=largSchermo()*LET.zoom, alt=larg*d.h/d.w;
  area.innerHTML='<div id="letStack" class="let-stack">'+foglioHtml(LET.pag,larg,alt)+'</div>';
  await disegnaPagina(LET.pag);
  area.scrollTop=0;
}
async function apriScorrimento(daPag){
  const area=$('#letArea');
  LET.pag=Math.max(1,Math.min(LET.tot,daPag||1));
  await misuraPagina(LET.pag);
  const larg=largSchermo()*LET.zoom;
  let html='<div id="letStack" class="let-stack">';
  for(let n=1;n<=LET.tot;n++){
    const d=await misuraPagina(n);
    html+=foglioHtml(n,larg,larg*d.h/d.w);
  }
  area.innerHTML=html+'</div>';
  /* mentre scorro guardo io quali pagine sono in vista: è più sicuro
     dell'osservatore del browser, che dopo aver liberato una pagina
     non avvisa più e la lasciava bianca */
  if(!LET._scorre){
    LET._scorre=()=>{ if(LET._raf) return;
      LET._raf=requestAnimationFrame(()=>{ LET._raf=0; aggiornaVista(); }); };
    area.addEventListener('scroll',LET._scorre,{passive:true});
  }
  /* rete di sicurezza: sull'iPad, durante lo scorrimento per inerzia,
     qualche avviso si perde. Ogni tanto controllo io dove siamo. */
  clearInterval(LET._tv);
  LET._tv=setInterval(()=>{
    const a=$('#letArea');
    if(!a||!$('#lettore')||!$('#lettore').classList.contains('on')){ clearInterval(LET._tv); return; }
    if(a.scrollTop!==LET._ultimo){ LET._ultimo=a.scrollTop; aggiornaVista(); }
  },350);
  const f=document.querySelector(`.let-foglio[data-p="${LET.pag}"]`);
  if(f){ await disegnaPagina(LET.pag); portaAPagina(LET.pag); const c=$('#letPag'); if(c) c.value=LET.pag; }
}

/* ---------- appunti ---------- */
/* Gli appunti non stanno attaccati al numero di pagina di UN file, ma alla
   lezione e al giorno: così quello che segni sul lezionario italiano si vede
   anche su quello rumeno dello stesso trimestre, e viceversa. */
/* Il cassetto degli appunti: uno solo per trimestre, in comune fra
   l'edizione italiana e quella rumena. Lo ricavo dai SABATI veri delle
   lezioni — non dall'anno stampato in copertina, che le due edizioni
   scrivono in modi diversi. Prendo il sabato di mezzo, perché il primo
   a volte cade ancora nel trimestre prima. */
/* Le due edizioni non scrivono sempre lo stesso giorno: una mette il sabato
   in cui si studia la lezione, l'altra magari la domenica in cui comincia la
   settimana. Porto ogni data al SABATO della sua settimana (che comincia di
   domenica): così le due si ritrovano sempre sullo stesso giorno. */
function settimanaDi(data){
  const p=String(data||'').split('-');
  const d=new Date(+p[0],+p[1]-1,+p[2]);
  if(isNaN(d)) return data;
  d.setDate(d.getDate()+(6-d.getDay()));
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
}
function gruppoNote(l){
  const d=(l.lezioni||[]).map(x=>x.data).filter(Boolean).map(settimanaDi).sort();
  if(d.length){
    const m=d[Math.floor(d.length/2)];
    return 't'+m.slice(0,4)+'-'+(Math.floor((+m.slice(5,7)-1)/3)+1);
  }
  return `t${l.anno||0}-${l.trim||0}`;
}
/* i cassetti di prima, da svuotare dentro a quello nuovo la prima volta */
function gruppiVecchi(l){
  const v=[`t${l.anno||0}-${l.trim||0}`];
  const d=(l.lezioni||[]).map(x=>x.data).filter(Boolean).sort();
  if(d.length){
    v.push('t'+d[0].slice(0,4)+'-'+(Math.floor((+d[0].slice(5,7)-1)/3)+1));
    const m=d[Math.floor(d.length/2)];
    v.push('t'+m.slice(0,4)+'-'+(Math.floor((+m.slice(5,7)-1)/3)+1));
  }
  const nuovo=gruppoNote(l);
  return v.filter((x,i)=>x!==nuovo && v.indexOf(x)===i);
}
/* I lezionari dello stesso trimestre, in tutte le lingue che hai */
function compagni(l){
  const g=gruppoNote(l);
  return (stato.lezionari||[]).filter(x=>gruppoNote(x)===g);
}
/* COME si scrive l'indirizzo di una pagina, in questo trimestre.
   È la parte più delicata: le due edizioni devono per forza scriverlo
   allo stesso modo, se no gli appunti non si ritrovano. Perciò decido
   guardando TUTTE le edizioni che ho di quel trimestre, non una sola:
   uso la data del sabato solo se ce l'hanno tutte, i giorni della
   settimana solo se li hanno tutte. Altrimenti conto le lezioni e le
   pagine, che è una cosa che riesce sempre. */
const _SCHEMI={};
function schemaGruppo(l){
  const g=gruppoNote(l);
  const q=compagni(l).filter(x=>(x.lezioni||[]).length);
  const firma=g+'|'+q.map(x=>x.i+':'+x.lezioni.length).join(',');
  if(_SCHEMI[g] && _SCHEMI[g].firma===firma) return _SCHEMI[g];
  const conData = q.length>0 && q.every(x=>x.lezioni.every(z=>z.data));
  const conGiorni = q.length>0 && q.every(x=>x.lezioni.every(z=>(z.giorni||[]).length>=5));
  const contiUguali = q.length<2 || new Set(q.map(x=>x.lezioni.length)).size===1;
  const sc={ firma, usaData:conData, usaGiorni:conGiorni, contiUguali,
             /* se le edizioni contano un numero diverso di lezioni e non ci sono
                date, riporto tutto a un trimestre di tredici sabati */
             normalizza: !conData && !contiUguali,
             quante: q.length };
  _SCHEMI[g]=sc;
  return sc;
}
/* I giorni della settimana che TUTTE le edizioni riescono a riconoscere in
   quella lezione. Se l'italiano non trova il sabato e il rumeno sì, il sabato
   non lo uso: se no le due edizioni conterebbero le pagine da punti diversi. */
const _GIORNI_OK={};
function giorniComuni(l,posto,sc){
  const g=gruppoNote(l), ch=g+'#'+posto;
  if(_GIORNI_OK[ch] && _GIORNI_OK[ch].firma===sc.firma) return _GIORNI_OK[ch].set;
  const q=compagni(l).filter(x=>(x.lezioni||[]).length);
  let comune=null;
  q.forEach(x=>{
    const lez=x.lezioni[Math.min(x.lezioni.length,posto)-1];
    const s2=new Set((lez&&lez.giorni||[]).map(z=>z.k));
    comune = comune===null ? s2 : new Set([...comune].filter(k=>s2.has(k)));
  });
  const set=comune||new Set();
  _GIORNI_OK[ch]={firma:sc.firma,set};
  return set;
}
/* il numero della lezione che vale per tutte le lingue */
function postoLezione(l,lez,sc){
  const n=(l.lezioni||[]).length;
  const i=(l.lezioni||[]).indexOf(lez)+1;
  if(!sc.normalizza || n<2) return i;
  return Math.max(1,Math.min(13,Math.round((i-1)*12/(n-1))+1));
}
/* La chiave è il GIORNO di studio, non la singola pagina: la stessa frase
   in italiano sta a pagina 87 e in rumeno finisce a pagina 88, e gli appunti
   devono seguirla. Dentro al giorno ogni segno sa da solo su quali parole sta. */
function primaPagGiorno(l,pag){
  const lez=(l.lezioni||[]).filter(x=>x.pag<=pag).pop();
  if(!lez) return 1;
  const sc=schemaGruppo(l);
  const posto=postoLezione(l,lez,sc);
  const ok=sc.usaGiorni ? giorniComuni(l,posto,sc) : null;
  const g=ok ? (lez.giorni||[]).filter(x=>x.pag<=pag && ok.has(x.k)).pop() : null;
  return g?g.pag:lez.pag;
}
function chiaveNota(l,pag){
  const lez=(l.lezioni||[]).filter(x=>x.pag<=pag).pop();
  /* senza lezioni riconosciute uso il numero di pagina SENZA la copertina:
     così due edizioni dello stesso trimestre si ritrovano lo stesso */
  if(!lez) return 'p'+(pag-(l.pagCop||0));
  const sc=schemaGruppo(l);
  const posto=postoLezione(l,lez,sc);
  const ok=sc.usaGiorni ? giorniComuni(l,posto,sc) : null;
  const g=ok ? (lez.giorni||[]).filter(x=>x.pag<=pag && ok.has(x.k)).pop() : null;
  const testa = (sc.usaData && lez.data) ? 'S'+settimanaDi(lez.data) : 'N'+posto;
  return `${testa}${g?'G'+g.k:''}`;
}
/* Tutti gli altri modi di scrivere lo stesso indirizzo: con la data o senza,
   con il giorno o senza, con il numero stampato della lezione. Quando leggo
   li provo tutti, così quello che hai già segnato non si perde mai. */
/* Prima ogni pagina aveva la sua chiave. Adesso ce n'è una sola per giorno:
   qui elenco tutte le vecchie chiavi delle pagine di quel giorno, così quello
   che avevi già segnato finisce nel posto nuovo e non si perde. */
function chiaviVecchie(l,pag){
  const lez=(l.lezioni||[]).filter(x=>x.pag<=pag).pop();
  if(!lez) return [];
  const posto=(l.lezioni||[]).indexOf(lez)+1;
  const g=(lez.giorni||[]).filter(x=>x.pag<=pag).pop();
  const teste=[`N${posto}`,`L${lez.n}`,`N${postoLezione(l,lez,schemaGruppo(l))}`];
  if(lez.data){ teste.push(`S${settimanaDi(lez.data)}`); teste.push(`S${lez.data}`); }
  const pagine=pagineDelGiorno(l,pag);
  const code=[];
  pagine.forEach(p=>{
    if(g) code.push({c:`G${g.k}+${p-g.pag}`,off:p-pagine[0]});
    code.push({c:`+${p-lez.pag}`,off:p-pagine[0]});
  });
  const v=[];
  teste.forEach(t=>code.forEach(c=>v.push({k:t+c.c,off:c.off})));
  const ora=chiaveNota(l,pag);
  const visti={};
  return v.filter(x=>{ if(x.k===ora||visti[x.k]) return false; visti[x.k]=1; return true; });
}
function noteDi(n,lez){
  const l=lez||LET.lez;
  stato.appunti=stato.appunti||{};
  const nomeG=gruppoNote(l);
  const g=(stato.appunti[nomeG]=stato.appunti[nomeG]||{});
  const k=chiaveNota(l,n);
  g[k]=g[k]||[];
  if(!g._m) Object.defineProperty(g,'_m',{value:{},enumerable:false,writable:true});
  if(!g._m[k]){
    g._m[k]=1;
    /* prima volta con la chiave nuova: raccolgo qui tutto quello che era
       sparso sulle chiavi di una pagina per volta, anche in un altro cassetto */
    const vecchie=chiaviVecchie(l,n);
    const cassetti=[g].concat(gruppiVecchi(l).map(gv=>stato.appunti[gv]).filter(Boolean));
    cassetti.forEach(dove=>{
      if(dove!==g && dove[k] && dove[k].length){
        dove[k].forEach(a=>{ if(!g[k].some(z=>z===a)) g[k].push(a); });
        delete dove[k];
      }
      vecchie.forEach(v=>{
        const el=dove[v.k];
        if(el && el.length){
          el.forEach(a=>{ if(a.off==null && !a.an) a.off=v.off; g[k].push(a); });
          delete dove[v.k];
        }
      });
    });
  }
  return g[k];
}
/* i vecchi appunti, legati alle pagine, li porto dentro al nuovo modo */
function portaAppuntiVecchi(l){
  if(!l.note || l.noteSpostate) return;
  Object.keys(l.note).forEach(p=>{
    const v=l.note[p]; if(!v||!v.length) return;
    const d=noteDi(+p,l);
    v.forEach(a=>{ if(!d.some(x=>JSON.stringify(x)===JSON.stringify(a))) d.push(a); });
  });
  l.noteSpostate=true;
}
function disegnaNote(n){
  const f=document.querySelector(`.let-foglio[data-p="${n}"]`); if(!f) return;
  const nt=f.querySelector('.let-note'), ev=f.querySelector('.let-evid'), dim=LET.pagine[n];
  if(!nt||!dim) return;
  const x=nt.getContext('2d'), xe=ev?ev.getContext('2d'):null; const {w,h,dpr}=dim;
  x.setTransform(dpr,0,0,dpr,0,0); x.clearRect(0,0,w,h);
  if(xe){ xe.setTransform(dpr,0,0,dpr,0,0); xe.clearRect(0,0,w,h); }
  noteDi(n).forEach(a=>{
    if(a.t==='evid'){
      /* l'evidenziatore va sulla sua tela, che si moltiplica con la pagina:
         il colore resta quello scelto e le lettere restano nere sotto */
      if(!xe) return;
      const pth=new Path2D();
      rettDi(a,n).forEach(r=>pth.rect(r[0]*w,r[1]*h,r[2]*w,r[3]*h));
      xe.globalAlpha=(a.o!=null?a.o:1); xe.fillStyle=a.c; xe.fill(pth); xe.globalAlpha=1;
    }
    else if(a.t==='sott'){ x.strokeStyle=a.c; x.lineWidth=Math.max(1,(a.s||3)); x.lineCap='round';
      /* la riga sta SOTTO le lettere, non sopra la loro base */
      rettDi(a,n).forEach(r=>{ const y=(r[1]+r[3])*h + Math.max(1,r[3]*h*0.06);
        x.beginPath(); x.moveTo(r[0]*w,y); x.lineTo((r[0]+r[2])*w,y); x.stroke(); }); }
    else if(a.t==='penna'){ if(!paginaDelSegno(a,n)) return;
      x.strokeStyle=a.c; x.lineWidth=a.s; x.lineCap='round'; x.lineJoin='round';
      x.beginPath(); a.p.forEach((q,k)=>k?x.lineTo(q[0]*w,q[1]*h):x.moveTo(q[0]*w,q[1]*h)); x.stroke(); }
  });
}
function mostraTesti(n){
  const f=document.querySelector(`.let-foglio[data-p="${n}"]`); if(!f) return;
  const box=f.querySelector('.let-testi'); if(!box) return;
  box.innerHTML=noteDi(n).map((a,k)=> (a.t!=='testo'||!paginaDelSegno(a,n)) ? '' :
    `<div class="let-tx" data-k="${k}"
       style="left:${a.x*100}%;top:${a.y*100}%;max-width:${((a.w||0.42)*100).toFixed(1)}%;color:${a.c};font-size:${(a.s||4)*4}px;font-family:${FAMIGLIE[a.f||'serif']}"
       ><span class="tx-corpo">${esc(a.txt).replace(/\n/g,'<br>')}</span><span class="tx-h tx-mano" data-h="m" title="Sposta">✥</span><span class="tx-h tx-largo" data-h="w" title="Allarga o stringi"></span></div>`).join('');
  attaccaManopole(n);
}
/* spostare la casella e cambiarne la larghezza: il testo si riadatta da solo */
function attaccaManopole(n){
  const f=document.querySelector(`.let-foglio[data-p="${n}"]`); if(!f) return;
  /* la scritta si prende e si sposta anche toccandola in mezzo, sempre */
  f.querySelectorAll('.let-tx').forEach(el=>{
    el.onclick=e=>e.stopPropagation();
    el.onpointerdown=ev=>{
      if(ev.target.closest('.tx-h')) return;
      const k=+el.dataset.k, a=noteDi(n)[k]; if(!a) return;
      if(LET.strumento==='gomma'){ ricordaPrima(n); noteDi(n).splice(k,1); salva(); mostraTesti(n); return; }
      ev.preventDefault(); ev.stopPropagation();
      const r=f.getBoundingClientRect();
      const p0={x:ev.clientX,y:ev.clientY,ax:a.x,ay:a.y}; let mosso=false, segnato=false;
      el.classList.add('presa');
      const muovi=e=>{
        const dx=(e.clientX-p0.x)/r.width, dy=(e.clientY-p0.y)/r.height;
        if(Math.abs(e.clientX-p0.x)>4||Math.abs(e.clientY-p0.y)>4) mosso=true;
        if(!mosso) return;
        if(!segnato){ segnato=true; a.x=p0.ax; a.y=p0.ay; ricordaPrima(n); }
        a.x=Math.max(0,Math.min(0.97,p0.ax+dx)); a.y=Math.max(0,Math.min(0.985,p0.ay+dy));
        el.style.left=(a.x*100)+'%'; el.style.top=(a.y*100)+'%';
      };
      const su=()=>{
        document.removeEventListener('pointermove',muovi);
        document.removeEventListener('pointerup',su);
        document.removeEventListener('pointercancel',su);
        el.classList.remove('presa');
        if(mosso) salva(); else modificaTestoLez(n,k);
      };
      document.addEventListener('pointermove',muovi);
      document.addEventListener('pointerup',su);
      document.addEventListener('pointercancel',su);
    };
  });
  f.querySelectorAll('.let-tx .tx-h').forEach(h=>{
    h.onclick=e=>e.stopPropagation();
    h.onpointerdown=ev=>{
      ev.preventDefault(); ev.stopPropagation();
      const el=h.parentElement, k=+el.dataset.k, a=noteDi(n)[k];
      if(!a) return;
      const r=f.getBoundingClientRect(), tipo=h.dataset.h;
      const p0={x:ev.clientX,y:ev.clientY,ax:a.x,ay:a.y,aw:a.w||0.42};
      const muovi=e=>{
        const dx=(e.clientX-p0.x)/r.width, dy=(e.clientY-p0.y)/r.height;
        if(tipo==='m'){ a.x=Math.max(0,Math.min(0.97,p0.ax+dx)); a.y=Math.max(0,Math.min(0.985,p0.ay+dy)); }
        else a.w=Math.max(0.08,Math.min(0.96,p0.aw+dx));
        el.style.left=(a.x*100)+'%'; el.style.top=(a.y*100)+'%'; el.style.maxWidth=((a.w||0.42)*100)+'%';
      };
      const su=()=>{ document.removeEventListener('pointermove',muovi);
        document.removeEventListener('pointerup',su); document.removeEventListener('pointercancel',su); salva(); };
      document.addEventListener('pointermove',muovi);
      document.addEventListener('pointerup',su);
      document.addEventListener('pointercancel',su);
    };
  });
}
/* ---------- annulla e rifai ---------- */
const STORIA={ indietro:[], avanti:[] };
function ricordaPrima(n){
  STORIA.indietro.push({n, dati:JSON.parse(JSON.stringify(noteDi(n)))});
  if(STORIA.indietro.length>60) STORIA.indietro.shift();
  STORIA.avanti.length=0;
  aggiornaAnnulla();
}
function scriviNote(n,dati){
  const l=LET.lez;
  stato.appunti=stato.appunti||{};
  const g=(stato.appunti[gruppoNote(l)]=stato.appunti[gruppoNote(l)]||{});
  g[chiaveNota(l,n)]=dati;
}
function annullaAppunto(){
  const p=STORIA.indietro.pop();
  if(!p){ avvisa('Non c\'è niente da annullare','no'); return; }
  STORIA.avanti.push({n:p.n, dati:JSON.parse(JSON.stringify(noteDi(p.n)))});
  scriviNote(p.n,p.dati); salva();
  vaiEDisegna(p.n); aggiornaAnnulla();
  avvisa('Annullato','ok');
}
function rifaiAppunto(){
  const p=STORIA.avanti.pop();
  if(!p){ avvisa('Non c\'è niente da rifare','no'); return; }
  STORIA.indietro.push({n:p.n, dati:JSON.parse(JSON.stringify(noteDi(p.n)))});
  scriviNote(p.n,p.dati); salva();
  vaiEDisegna(p.n); aggiornaAnnulla();
}
function vaiEDisegna(n){
  if(LET.modo==='scorrimento'){ if(n!==LET.pag) vaiPag(n); }
  else if(n!==LET.pag){ mostraPag(n); return; }
  disegnaNote(n); mostraTesti(n);
}
function aggiornaAnnulla(){
  const b=$('#letAnnulla'); if(b) b.classList.toggle('spento',!STORIA.indietro.length);
}
/* ---------- l'elenco degli appunti, per cancellarli uno a uno ---------- */
function nomeAppunto(a){
  if(a.t==='evid') return 'Evidenziato';
  if(a.t==='sott') return 'Sottolineato';
  if(a.t==='penna') return 'Scritto a mano';
  return 'Scritta: “'+(a.txt||'').slice(0,42)+((a.txt||'').length>42?'…':'')+'”';
}
/* a ogni scorrimento: disegno quello che si vede e libero il resto */
function aggiornaVista(){
  if(LET.modo!=='scorrimento') return;
  const viste=pagineInVista();
  if(!viste.length) return;
  const centro=viste[0];
  if(centro!==LET.pag){ LET.pag=centro; const c=$('#letPag'); if(c) c.value=centro; ricordaPagina(); }
  const da=Math.max(1,viste[0]-1), a=Math.min(LET.tot,viste[viste.length-1]+1);
  for(let n=da;n<=a;n++) disegnaPagina(n);
  liberaLontane(centro,viste);
}
/* quali pagine sto guardando adesso */
function pagineInVista(){
  if(LET.modo!=='scorrimento') return [LET.pag];
  const area=$('#letArea'); if(!area) return [LET.pag];
  const rA=area.getBoundingClientRect(), out=[];
  $$('.let-foglio').forEach(f=>{
    const r=f.getBoundingClientRect();
    if(r.bottom>rA.top+8 && r.top<rA.bottom-8) out.push(+f.dataset.p);
  });
  return out.length?out:[LET.pag];
}
function apriAppunti(){
  const pagine=pagineInVista();
  const righe=[];
  pagine.forEach(n=>noteDi(n).forEach((a,k)=>righe.push({n,k,a})));
  apri(pagine.length>1?`Appunti delle pagine ${pagine[0]}–${pagine[pagine.length-1]}`:`Appunti della pagina ${pagine[0]}`,
    righe.length? `<div class="lez-el">${righe.map(({n,k,a})=>`
      <div class="lez-riga">
        <span class="nn" style="background:${a.c};color:transparent">.</span>
        <span class="cc"><b>${esc(nomeAppunto(a))}</b>
          <span>pagina ${n}${a.t==='evid'?' · colore al '+Math.round((a.o!=null?a.o:1)*100)+'%':''}${a.t==='sott'?' · grossezza '+(a.s||3):''}</span></span>
        <button class="lez-cest" style="position:static" onclick="togliAppunto(${n},${k})">🗑</button>
      </div>`).join('')}</div>`
      : `<div class="vuoto"><span class="em">✍️</span>Su queste pagine non hai ancora appunti.</div>`,
    `<button class="bt pi" style="margin-right:auto" onclick="chiudi();rifaiAppunto()">↷ Rifai</button>
     ${righe.length?`<button class="bt pi" style="color:#ff8b9c" onclick="chiudi();pulisciPagina()">Cancella tutti</button>`:''}
     <button class="bt pr" onclick="chiudi()">Chiudi</button>`,560,'alto');
}
function togliAppunto(n,k){
  ricordaPrima(n);
  noteDi(n).splice(k,1); salva();
  disegnaNote(n); mostraTesti(n);
  chiudi(); apriAppunti();
}
/* il riquadro tratteggiato mentre lo trascini */
function disegnaScelta(n){
  disegnaNote(n);
  const f=document.querySelector(`.let-foglio[data-p="${n}"]`), dim=LET.pagine[n];
  if(!f||!dim||!LET.pulizia) return;
  const x=f.querySelector('.let-note').getContext('2d'); const {w,h}=dim;
  const a=LET.pulizia.a, b=LET.pulizia.b;
  const X=Math.min(a[0],b[0])*w, Y=Math.min(a[1],b[1])*h;
  const L2=Math.abs(b[0]-a[0])*w, H2=Math.abs(b[1]-a[1])*h;
  x.save();
  x.fillStyle='rgba(200,16,46,.14)'; x.fillRect(X,Y,L2,H2);
  x.strokeStyle='#c8102e'; x.lineWidth=1.5; x.setLineDash([6,4]); x.strokeRect(X,Y,L2,H2);
  x.restore();
}
/* toglie soltanto gli appunti che stanno dentro al riquadro scelto */
function pulisciDentro(n,a,b){
  const x0=Math.min(a[0],b[0]), y0=Math.min(a[1],b[1]);
  const x1=Math.max(a[0],b[0]), y1=Math.max(a[1],b[1]);
  if(x1-x0<0.005 && y1-y0<0.005){ disegnaNote(n); avvisa('Trascina un riquadro sopra quello che vuoi togliere','ok'); return; }
  const dentroR=r=> r[0]<x1 && r[0]+r[2]>x0 && r[1]<y1 && r[1]+r[3]>y0;
  const el=noteDi(n);
  const resta=el.filter(z=>{
    if(z.t==='evid'||z.t==='sott') return !rettDi(z,n).some(dentroR);
    if(z.t==='penna') return !(z.p||[]).some(q=>q[0]>=x0&&q[0]<=x1&&q[1]>=y0&&q[1]<=y1);
    return !(z.x>=x0-0.02&&z.x<=x1&&z.y>=y0-0.02&&z.y<=y1);
  });
  const tolti=el.length-resta.length;
  if(!tolti){ disegnaNote(n); avvisa('Dentro al riquadro non c\'era niente','no'); return; }
  ricordaPrima(n);
  scriviNote(n,resta); salva();
  disegnaNote(n); mostraTesti(n);
  avvisa(tolti===1?'Tolto 1 appunto':`Tolti ${tolti} appunti`,'ok');
}
function pulisciPagina(){
  const pagine=pagineInVista().filter(n=>noteDi(n).length);
  if(!pagine.length){ avvisa('Qui non ci sono appunti da togliere','no'); return; }
  conferma(`Cancello tutti gli appunti ${pagine.length>1?'delle pagine '+pagine.join(', '):'della pagina '+pagine[0]}?`,()=>{
    pagine.forEach(n=>{ ricordaPrima(n); scriviNote(n,[]); disegnaNote(n); mostraTesti(n); });
    salva(); avvisa('Fatto','ok');
  },'Cancella');
}

/* ---------- il dito sulla pagina ---------- */
function pagDaEvento(ev){
  const f=(ev.target.closest?ev.target.closest('.let-foglio'):null);
  return f?+f.dataset.p:LET.pag;
}
function letPunto(ev,n){
  const f=document.querySelector(`.let-foglio[data-p="${n}"]`);
  const nt=f&&f.querySelector('.let-note'); if(!nt) return [0,0];
  const r=nt.getBoundingClientRect();
  const t=ev.touches&&ev.touches[0]?ev.touches[0]:ev;
  return [ (t.clientX-r.left)/r.width, (t.clientY-r.top)/r.height ];
}
/* Il PDF non dà le lettere una per una: dà pezzi di testo, spesso una riga
   intera in un colpo solo. Per potermi fermare a metà riga taglio ogni pezzo
   nelle sue parole, spartendo la larghezza fra le lettere. */
function paroleDiRiga(r){
  if(r._pz) return r._pz;
  const out=[];
  (r.el||[]).forEach(it=>{
    const t=it.s||'';
    const nl=t.length;
    if(!t.trim()){ return; }
    if(nl<2 || !/\s/.test(t)){ out.push({x:it.x,w:it.w,y:it.y,h:it.h,t:t.trim()}); return; }
    const rx=/\S+/g; let m;
    while((m=rx.exec(t))){
      const da=m.index/nl, a=(m.index+m[0].length)/nl;
      out.push({x:it.x+it.w*da, w:it.w*(a-da), y:it.y, h:it.h, t:m[0]});
    }
  });
  out.sort((x,y)=>x.x-y.x);
  return (r._pz=out);
}
/* ================= ANCORARE GLI APPUNTI AL TESTO =================
   Un appunto non deve stare «a due terzi della pagina»: deve stare SULLE
   PAROLE che hai segnato. Le due edizioni spezzano le pagine in punti
   diversi — la stessa frase in italiano finisce a pagina 87 e in rumeno
   comincia a pagina 87 e finisce a pagina 88 — perciò conto i paragrafi
   di TUTTO IL GIORNO, non di una pagina sola, e ricucio i capoversi
   tagliati dal cambio di pagina. */
function _mediana(v){ const x=v.slice().sort((a,b)=>a-b); return x[Math.floor(x.length/2)]||0; }
function righeSubito(n){
  if(LET.righe[n] && LET.righe[n].length) return LET.righe[n];
  return (LET.altrui && LET.altrui[n]) || [];
}
/* le righe di una pagina anche se non è disegnata: mi servono per ricucire
   i capoversi che continuano sulla pagina dopo */
async function righeDi(n){
  const gia=righeSubito(n);
  if(gia.length) return gia;
  LET.altrui=LET.altrui||{};
  if(LET.altrui[n]) return LET.altrui[n];
  try{
    const daCop=n<=LET.nCop, doc=daCop?LET.docCop:LET.doc, num=daCop?n:(n-LET.nCop);
    if(!doc) return (LET.altrui[n]=[]);
    const pg=await doc.getPage(num);
    const v=pg.getViewport({scale:1});
    const tc=await pg.getTextContent();
    const el=[];
    tc.items.forEach(it=>{
      if(!it.str||!it.str.trim()) return;
      const t=pdfjsLib.Util.transform(v.transform,it.transform);
      const h=Math.hypot(t[2],t[3])||it.height;
      el.push({x:t[4]/v.width,y:(t[5]-h)/v.height,w:it.width/v.width,h:h/v.height,s:it.str});
    });
    return (LET.altrui[n]=raggruppaRighe(el));
  }catch(e){ return (LET.altrui[n]=[]); }
}
/* le pagine del giorno a cui appartiene questa pagina */
function pagineDelGiorno(l,pag){
  const lez=(l.lezioni||[]).filter(x=>x.pag<=pag).pop();
  if(!lez) return [pag];
  const fine=(lez.fine||(l.pagine||pag+1))-1;
  const gg=(lez.giorni||[]).slice().sort((a,b)=>a.pag-b.pag);
  let da=lez.pag, a=fine;
  gg.forEach((g,i)=>{ if(g.pag<=pag){ da=g.pag; a=(i+1<gg.length? gg[i+1].pag-1 : fine); } });
  if(gg.length && pag<gg[0].pag){ da=lez.pag; a=gg[0].pag-1; }
  const out=[];
  for(let p=Math.max(1,da); p<=Math.min(a, l.pagine||a); p++) out.push(p);
  return out.length?out:[pag];
}
/* mi assicuro di avere sottomano le righe di tutte le pagine del giorno */
let _preparando={};
async function preparaGiorno(pag){
  const l=LET.lez; if(!l) return;
  const pagine=pagineDelGiorno(l,pag);
  const manca=pagine.filter(p=>!righeSubito(p).length);
  if(!manca.length) return;
  const ch=pagine.join(',');
  if(_preparando[ch]) return _preparando[ch];
  _preparando[ch]=(async()=>{
    for(const p of manca) await righeDi(p);
    delete _preparando[ch];
    if(LET.pagine[pag]) disegnaNote(pag);
  })();
  return _preparando[ch];
}
function paragrafiPagina(n){
  const righe=righeSubito(n);
  if(!righe.length) return [];
  const c=LET._par&&LET._par[n];
  if(c && c.q===righe.length) return c.v;
  const hMed=_mediana(righe.map(r=>r.h))||0.012;
  const sx=righe.map(r=>Math.min.apply(null,r.el.map(e=>e.x)));
  const dx=righe.map(r=>Math.max.apply(null,r.el.map(e=>e.x+e.w)));
  const marg=Math.min.apply(null,sx), bordo=Math.max.apply(null,dx);
  const par=[]; let cur=null;
  righe.forEach((r,i)=>{
    const pre=righe[i-1];
    let nuovo=!cur;
    if(pre){
      const salto=(r.y-(pre.y+pre.h))/hMed;
      const rientro=(sx[i]-marg)>hMed*0.9;
      /* la riga di prima finiva molto prima del margine: era la fine di un capoverso */
      const cortaPrima=(bordo-dx[i-1])>(bordo-marg)*0.26;
      if(salto>0.6 || rientro || cortaPrima) nuovo=true;
    }
    if(nuovo){ cur={righe:[],y:r.y}; par.push(cur); }
    cur.righe.push(r);
    cur.y2=r.y+r.h;
  });
  par.forEach(p=>{
    p.parole=[]; let off=0;
    p.righe.forEach(r=>{
      paroleDiRiga(r).forEach(w=>{
        const t=w.t||'';
        p.parole.push({x:w.x,y:w.y,w:w.w,h:w.h,a:off,b:off+t.length,t:t});
        off+=t.length+1;
      });
    });
    p.n=Math.max(1,off-1);
    p.testo=p.parole.map(w=>w.t).join(' ');
  });
  LET._par=LET._par||{}; LET._par[n]={q:righe.length,v:par};
  return par;
}
/* i capoversi di tutto il giorno, ricuciti dove il cambio di pagina li spezza */
function paragrafiGiorno(pag){
  const l=LET.lez;
  const pagine = l ? pagineDelGiorno(l,pag) : [pag];
  const par=[];
  pagine.forEach(p=>{
    const pp=paragrafiPagina(p);
    pp.forEach((q,k)=>{
      const ult=par[par.length-1];
      /* se il capoverso di prima non finiva con un punto, questo è il suo seguito */
      const continua = k===0 && ult && !/[.!?:;»”"]\s*$/.test(ult.testo||'');
      if(continua){
        const off=ult.n+1;
        q.parole.forEach(w=>ult.parole.push({pag:p,x:w.x,y:w.y,w:w.w,h:w.h,a:w.a+off,b:w.b+off,t:w.t}));
        ult.n=off+q.n; ult.testo+=' '+q.testo; ult.pagine.push(p);
      } else {
        par.push({parole:q.parole.map(w=>({pag:p,x:w.x,y:w.y,w:w.w,h:w.h,a:w.a,b:w.b,t:w.t})),
                  n:q.n, testo:q.testo, pagine:[p], y:q.y, y2:q.y2, pag:p});
      }
    });
  });
  return {par,pagine};
}
/* Le frasi di un capoverso. È il segreto per far combaciare le due lingue:
   una traduzione può essere più lunga o più corta del testo di partenza, ma
   ha lo stesso numero di frasi, e ogni frase dice la stessa cosa. Perciò non
   conto le lettere sul capoverso intero (che sbanda), ma sulla singola frase. */
function frasiDi(p){
  if(p._fr) return p._fr;
  const t=p.testo||'';
  const fr=[]; let da=0;
  const rx=/[.!?;:]["»”'\u2019]?\s+/g; let m;
  while((m=rx.exec(t))){ fr.push([da,m.index+m[0].length]); da=m.index+m[0].length; }
  if(da<t.length) fr.push([da,t.length]);
  if(!fr.length) fr.push([0,Math.max(1,t.length)]);
  return (p._fr=fr);
}
function _indFrase(fr,x){
  for(let i=0;i<fr.length;i++) if(x<fr[i][1]) return i;
  return fr.length-1;
}
/* Tutte le frasi del giorno, una dietro l'altra. Se le due edizioni non
   dividono i capoversi allo stesso modo, le frasi restano comunque quelle:
   sono la misura più sicura che ho per far combaciare le due lingue. */
function frasiGiorno(par){
  const out=[];
  par.forEach((p,k)=>frasiDi(p).forEach((f,j)=>out.push({p:k,j,da:f[0],a:f[1],par:p})));
  return out;
}
/* a che lettera corrisponde questa x dentro alla parola */
function _offLettera(w,x,fine){
  const len=(w.t||' ').length||1;
  const f=Math.max(0,Math.min(1,(x-w.x)/(w.w||1e-6)));
  return w.a + Math.round(f*len);
}
/* da dove a dove arriva il segno, detto in lettere e non in centimetri */
function ancoraDa(n,rr){
  const {par}=paragrafiGiorno(n);
  if(!par.length || !rr || !rr.length) return null;
  let best=null;
  par.forEach((p,k)=>{
    const tocc=p.parole.filter(w=>{
      const cx=w.x+w.w/2, cy=w.y+w.h/2;
      return w.pag===n && rr.some(r=>cx>=r[0]-0.004 && cx<=r[0]+r[2]+0.004 &&
                                     cy>=r[1]-0.004 && cy<=r[1]+r[3]+0.004);
    });
    if(tocc.length && (!best || tocc.length>best.q)) best={p:k,par:p,tocc,q:tocc.length};
  });
  if(best){
    const w0=best.tocc[0], w1=best.tocc[best.tocc.length-1];
    const x0=Math.min.apply(null,rr.map(r=>r[0]));
    const x1=Math.max.apply(null,rr.map(r=>r[0]+r[2]));
    let a=Math.min(_offLettera(w0,Math.max(x0,w0.x)),w0.b);
    let b=Math.max(_offLettera(w1,Math.min(x1,w1.x+w1.w)),w1.a);
    if(a>b){ const t=a; a=b; b=t; }
    const fr=frasiDi(best.par);
    const iF=_indFrase(fr,a), iL=_indFrase(fr,Math.max(a,b-1));
    const lung=i=>Math.max(1,fr[i][1]-fr[i][0]);
    const tutte=frasiGiorno(par);
    const gF=tutte.findIndex(x=>x.p===best.p && x.j===iF);
    const gL=tutte.findIndex(x=>x.p===best.p && x.j===iL);
    return {p:best.p, np:par.length, a, b, n:best.par.n,
            ns:fr.length, sF:iF, oF:+((a-fr[iF][0])/lung(iF)).toFixed(4),
            sL:iL, oL:+((b-fr[iL][0])/lung(iL)).toFixed(4),
            gF, gL, ng:tutte.length};
  }
  /* nessuna parola sotto: è una riga vuota da riempire (la risposta alla domanda).
     La lego al capoverso che sta sopra, alla stessa distanza. */
  const y0=Math.min.apply(null,rr.map(r=>r[1]));
  let sopra=-1;
  par.forEach((p,k)=>{ if(p.pagine[p.pagine.length-1]<=n && (p.pag!==n || p.y2<=y0+0.002)) sopra=k; });
  const base = sopra>=0 && par[sopra].pag===n ? par[sopra].y2 : 0;
  return {vuota:1,p:sopra,np:par.length,dy:+(y0-base).toFixed(4),
          rr:rr.map(r=>[+(r[0]).toFixed(4),+(r[1]-y0).toFixed(4),+(r[2]).toFixed(4),+(r[3]).toFixed(4)])};
}
/* e qui il contrario: dall'ancora ricavo i rettangoli su QUESTA pagina */
function rettDaAncora(n,an){
  const {par}=paragrafiGiorno(n);
  if(!par.length || !an) return null;
  let k=an.p, viaFrasi=null;
  if(an.np && an.np!==par.length && an.np>1){
    /* i capoversi non si contano allo stesso modo: mi affido alle frasi,
       che nelle due lingue sono le stesse */
    const tutte=frasiGiorno(par);
    if(an.ng && tutte.length && an.gF!=null){
      const m=i=> Math.max(0,Math.min(tutte.length-1,
        an.ng<2 ? i : Math.round(i*(tutte.length-1)/(an.ng-1))));
      const fA=tutte[m(an.gF)], fB=tutte[m(an.gL!=null?an.gL:an.gF)];
      if(fA && fB && fA.par===fB.par) viaFrasi={p:fA.par, fA, fB};
      else if(fA) viaFrasi={p:fA.par, fA, fB:fA};
    }
    if(!viaFrasi) k=Math.round(an.p*(par.length-1)/(an.np-1));
  }
  k=Math.max(0,Math.min(par.length-1,k));
  const p=viaFrasi?viaFrasi.p:par[k];
  if(an.vuota){
    const base=(p&&p.pag===n)?p.y2:0;
    const y0=base+(an.dy||0);
    return (an.rr||[]).map(r=>[r[0],y0+r[1],r[2],r[3]]);
  }
  if(!p || !p.parole.length) return null;
  /* la frase che corrisponde, e dentro alla frase la stessa porzione */
  let a,b;
  if(viaFrasi){
    const lA=Math.max(1,viaFrasi.fA.a-viaFrasi.fA.da), lB=Math.max(1,viaFrasi.fB.a-viaFrasi.fB.da);
    a=viaFrasi.fA.da+Math.max(0,Math.min(1,an.oF||0))*lA;
    b=viaFrasi.fB.da+Math.max(0,Math.min(1,an.oL!=null?an.oL:1))*lB;
    if(b<=a) b=viaFrasi.fB.a;
  } else if(an.ns){
    const fr=frasiDi(p);
    const mappa=i=> (fr.length===an.ns || an.ns<2) ? Math.min(i,fr.length-1)
                    : Math.round(i*(fr.length-1)/(an.ns-1));
    const iF=Math.max(0,Math.min(fr.length-1,mappa(an.sF)));
    const iL=Math.max(0,Math.min(fr.length-1,mappa(an.sL)));
    const lF=Math.max(1,fr[iF][1]-fr[iF][0]), lL=Math.max(1,fr[iL][1]-fr[iL][0]);
    a=fr[iF][0]+Math.max(0,Math.min(1,an.oF))*lF;
    b=fr[iL][0]+Math.max(0,Math.min(1,an.oL))*lL;
    if(b<=a) b=Math.min(p.n,fr[iL][1]);
  } else {
    a=(an.a/Math.max(1,an.n))*p.n;
    b=(an.b/Math.max(1,an.n))*p.n;
  }
  const qui=p.parole.filter(w=>w.pag===n && w.b>a && w.a<b);
  if(!qui.length) return null;
  const perRiga={};
  qui.forEach(w=>{ const key=w.y.toFixed(4); (perRiga[key]=perRiga[key]||[]).push(w); });
  return Object.keys(perRiga).sort((x,y)=>+x-+y).map(key=>{
    const g=perRiga[key];
    const pri=g[0], ult=g[g.length-1];
    /* taglio la prima e l'ultima parola alla lettera giusta */
    const fa=Math.max(0,Math.min(1,(a-pri.a)/Math.max(1,pri.b-pri.a)));
    const fb=Math.max(0,Math.min(1,(b-ult.a)/Math.max(1,ult.b-ult.a)));
    const x0=pri.x + (a>pri.a ? pri.w*fa : 0);
    const x1=(ult.x+ult.w) - (b<ult.b ? ult.w*(1-fb) : 0);
    const y0=Math.min.apply(null,g.map(w=>w.y)), y1=Math.max.apply(null,g.map(w=>w.y+w.h));
    const alt=y1-y0;
    return [x0-0.001,y0+alt*0.14,Math.max(0.004,x1-x0)+0.002,alt*1.06];
  });
}
/* i rettangoli buoni per questa pagina: quelli veri se il segno è nato qui,
   quelli ritrovati sul testo se viene dall'altra lingua */
/* I rettangoli di un segno su QUESTA pagina. Se il segno sa su quali parole
   sta, lo ritrovo sul testo — e allora finisce sulla pagina dove quelle parole
   stanno davvero, anche se nell'altra edizione è la pagina dopo. */
function rettDi(a,n){
  if(a.an){
    const r=rettDaAncora(n,a.an);
    if(r && r.length) return r;
    if(a.dl && LET.lez && a.dl!==LET.lez.i) return [];
    /* nella sua edizione, se non lo ritrovo, uso i rettangoli veri */
    return (paginaDelSegno(a,n)) ? (a.rr||[]) : [];
  }
  return paginaDelSegno(a,n) ? (a.rr||[]) : [];
}
/* i segni senza parole sotto (righe vuote, penna) stanno sulla pagina in cui
   sono nati, contata dall'inizio del giorno */
function paginaDelSegno(a,n){
  if(a.off==null) return true;
  const l=LET.lez; if(!l) return true;
  const pagine=pagineDelGiorno(l,n);
  return pagine[0]+a.off===n;
}
function rettangoliSelezione(n,a,b){
  const righe=LET.righe[n]||[];
  if(!righe.length) return [[Math.min(a[0],b[0]),Math.min(a[1],b[1]),Math.abs(b[0]-a[0]),Math.abs(b[1]-a[1])]];
  let p1=a,p2=b;
  if(p2[1]<p1[1] || (Math.abs(p2[1]-p1[1])<0.004 && p2[0]<p1[0])){ p1=b; p2=a; }
  /* prendo solo le righe che il dito ha davvero attraversato */
  const su=Math.min(p1[1],p2[1]), giu=Math.max(p1[1],p2[1]);
  const dentro=r=> r.y < giu+0.001 && (r.y+r.h) > su-0.001;
  const sel=righe.filter(dentro);
  const out=[];
  sel.forEach((r,i)=>{
    const parole=paroleDiRiga(r);
    if(!parole.length) return;
    const rx0=Math.min.apply(null,parole.map(w=>w.x));
    const rx1=Math.max.apply(null,parole.map(w=>w.x+w.w));
    /* Il segno si ferma ESATTAMENTE dove si è fermato il dito, anche in
       mezzo a una parola: non salta più alla parola intera. */
    const sola=sel.length===1;
    let da=rx0, fino=rx1;
    if(sola){ da=Math.max(rx0,Math.min(rx1,Math.min(p1[0],p2[0])));
              fino=Math.min(rx1,Math.max(rx0,Math.max(p1[0],p2[0]))); }
    else if(i===0) da=Math.max(rx0,Math.min(rx1,p1[0]));
    else if(i===sel.length-1) fino=Math.min(rx1,Math.max(rx0,p2[0]));
    if(fino-da < 0.0015){
      /* movimento cortissimo: prendo almeno la lettera che ho toccato */
      const c=(da+fino)/2;
      const w=parole.reduce((m,x)=>Math.abs((x.x+x.w/2)-c)<Math.abs((m.x+m.w/2)-c)?x:m,parole[0]);
      da=w.x; fino=w.x+w.w;
    }
    const toccate=parole.filter(w=>(w.x+w.w)>da+1e-6 && w.x<fino-1e-6);
    const rif = toccate.length?toccate:parole;
    const y0=Math.min.apply(null,rif.map(w=>w.y)), y1=Math.max.apply(null,rif.map(w=>w.y+w.h));
    const alt=y1-y0;
    /* la striscia è alta come una riga sola: parte poco sopra le lettere
       e finisce poco sotto le code, senza entrare nella riga vicina */
    out.push([da-0.001,y0+alt*0.14,(fino-da)+0.002,alt*1.06]);
  });
  return out;
}
function letGiu(ev){
  const s=LET.strumento;
  if(s==='mano') return;
  const n=pagDaEvento(ev);
  ev.preventDefault();
  const p=letPunto(ev,n);
  LET.pagAttiva=n;
  if(s==='testo'){ nuovoTestoLez(n,p); return; }
  if(s==='gomma'){ cancellaVicino(n,p); return; }
  if(s==='pulisci'){ LET.disegna=true; LET.pulizia={n,a:p,b:p}; disegnaScelta(n); return; }
  ricordaPrima(n);
  LET.disegna=true;
  if(s==='evid') LET.tratto={t:'evid',c:LET.colore,o:(LET.opacita!=null?LET.opacita:1),rr:[],_a:p};
  else if(s==='sott') LET.tratto={t:'sott',c:LET.colore,s:LET.spessoreRiga,rr:[],_a:p};
  else LET.tratto={t:'penna',c:LET.colore,s:LET.spessore,p:[p]};
  noteDi(n).push(LET.tratto);
}
function letMuovi(ev){
  if(LET.disegna&&LET.pulizia){
    ev.preventDefault();
    LET.pulizia.b=letPunto(ev,LET.pulizia.n);
    disegnaScelta(LET.pulizia.n);
    return;
  }
  if(!LET.disegna||!LET.tratto) return;
  ev.preventDefault();
  const n=LET.pagAttiva, p=letPunto(ev,n);
  if(LET.tratto.t==='evid'||LET.tratto.t==='sott') LET.tratto.rr=rettangoliSelezione(n,LET.tratto._a,p);
  else LET.tratto.p.push(p);
  disegnaNote(n);
}
function letSu(){
  if(LET.disegna&&LET.pulizia){
    LET.disegna=false;
    const {n,a,b}=LET.pulizia; LET.pulizia=null;
    pulisciDentro(n,a,b);
    return;
  }
  if(!LET.disegna) return;
  LET.disegna=false;
  const n=LET.pagAttiva, a=LET.tratto;
  if(a){ delete a._a;
    const vuoto = ((a.t==='evid'||a.t==='sott') && !(a.rr||[]).length) || (a.t==='penna' && a.p.length<2);
    if(vuoto) noteDi(n).pop();
    else {
      /* di quale lezionario è figlio, e su quali parole sta: così nell'altra
         lingua lo rimetto sulle stesse parole e non nello stesso punto del foglio */
      a.dl = LET.lez ? LET.lez.i : '';
      a.off = LET.lez ? (n - pagineDelGiorno(LET.lez,n)[0]) : 0;
      if(a.t==='evid'||a.t==='sott'){ const an=ancoraDa(n,a.rr); if(an) a.an=an; }
    }
    LET.tratto=null; salva(); disegnaNote(n); }
}
/* il riquadro che sta attorno a un tratto di penna */
function riquadroDi(pt){
  if(!pt||!pt.length) return [];
  const x=pt.map(q=>q[0]), y=pt.map(q=>q[1]);
  const x0=Math.min.apply(null,x), x1=Math.max.apply(null,x);
  const y0=Math.min.apply(null,y), y1=Math.max.apply(null,y);
  return [[x0,y0,Math.max(0.004,x1-x0),Math.max(0.004,y1-y0)]];
}
function cancellaVicino(n,p){
  const el=noteDi(n);
  let tolto=false;
  for(let k=el.length-1;k>=0;k--){
    const a=el[k]; let dentro=false;
    if(a.t==='evid'||a.t==='sott') dentro=rettDi(a,n).some(r=>p[0]>=r[0]&&p[0]<=r[0]+r[2]&&p[1]>=r[1]&&p[1]<=r[1]+r[3]);
    else if(a.t==='penna') dentro=a.p.some(q=>Math.hypot(q[0]-p[0],q[1]-p[1])<0.022);
    else dentro=Math.hypot(a.x-p[0],a.y-p[1])<0.06;
    if(dentro){ ricordaPrima(n); noteDi(n).splice(k,1); salva(); disegnaNote(n); mostraTesti(n); return; }
  }
}

/* ---------- scrivere un testo, anche dettandolo ---------- */
let _voce=null;
function nuovoTestoLez(n,p){ finestraTesto(n,null,p); }
function modificaTestoLez(n,k){ if(LET.strumento==='gomma'){ const el=noteDi(n); el.splice(k,1); salva(); mostraTesti(n); return; } finestraTesto(n,k); }
function finestraTesto(n,k,p){
  const el=noteDi(n);
  const a = k!=null ? el[k] : {t:'testo',c:LET.colore,s:LET.grandezza||4,f:LET.carattere||'serif',
        x:p[0],y:p[1],w:0.42,txt:'', dl:(LET.lez?LET.lez.i:''),
        off:(LET.lez? n-pagineDelGiorno(LET.lez,n)[0] : 0)};
  const soloVoce = !!(window.SpeechRecognition||window.webkitSpeechRecognition);
  apri(k!=null?'Modifica l\'appunto':'Scrivi un appunto',`
    <div class="tx-barra">
      ${soloVoce?`<button class="bt or mini" id="txMic" onclick="dettaTesto()">🎤 Detta</button>`
                :`<span style="font-size:12.5px;color:var(--tx3)">Il microfono non funziona su questo browser</span>`}
      <span style="flex:1"></span>
      <span style="font-size:12.5px;color:var(--tx3)">Colore</span>
      ${COL_PENNA_LEZ.concat(COL_EVID_LEZ).map(c=>`<button class="col-g pic" style="background:${c}" onclick="setCol('${c}');document.getElementById('txArea').style.color='${c}'"></button>`).join('')}
    </div>
    <div class="campo" style="margin-bottom:10px"><label>Carattere</label>
      <select id="txFont" onchange="cambiaCarattere(this.value)">
        ${Object.keys(FAMIGLIE).map(k=>`<option value="${k}" ${((a.f||'serif')===k)?'selected':''}
          style="font-family:${FAMIGLIE[k]}">${esc(NOMI_FAM[k]||k)}</option>`).join('')}
      </select></div>
    <div id="txArea" contenteditable="true" class="tx-area"
      style="color:${a.c};font-family:${FAMIGLIE[a.f||'serif']}">${esc(a.txt).replace(/\n/g,'<br>')}</div>
    <div class="campo" style="margin-top:12px"><label>Grandezza</label>
      <input type="range" min="2" max="20" value="${a.s||LET.grandezza||4}" id="txDim" oninput="document.getElementById('txArea').style.fontSize=(this.value*4)+'px'"></div>`,
    `${k!=null?`<button class="bt pi" style="margin-right:auto;color:#ff8b9c" onclick="togliTestoLez(${n},${k})">Elimina</button>`:''}
     <button class="bt pi" onclick="fermaVoce();chiudi()">Annulla</button>
     <button class="bt pr" onclick="salvaTestoLez(${n},${k==null?-1:k})">Salva</button>`,620);
  const t=$('#txArea');
  if(t){ t.style.fontSize=((a.s||LET.grandezza||4)*4)+'px'; t.focus();
    const r=document.createRange(); r.selectNodeContents(t); r.collapse(false);
    const s=getSelection(); s.removeAllRanges(); s.addRange(r); }
  LET._testo={n,k,a};
}
function cambiaCarattere(f){
  LET.carattere=f;
  const t=$('#txArea'); if(t) t.style.fontFamily=FAMIGLIE[f]||FAMIGLIE.moderno;
}
function salvaTestoLez(n,k){
  const t=$('#txArea'); if(!t) return;
  ricordaPrima(n);
  const txt=t.innerText.replace(/ /g,' ').trimEnd();
  fermaVoce();
  const el=noteDi(n);
  const s=+($('#txDim')||{}).value||LET.grandezza||4;
  LET.grandezza=s;
  if(!txt.trim()){ if(k>=0) el.splice(k,1); }
  const f=($('#txFont')||{}).value||LET.carattere||'moderno';
  if(k>=0){ el[k].txt=txt; el[k].c=LET.colore; el[k].s=s; el[k].f=f; }
  else { const a=LET._testo.a; a.txt=txt; a.c=LET.colore; a.s=s; a.f=f; el.push(a); }
  salva(); chiudi(); mostraTesti(n);
}
function togliTestoLez(n,k){ ricordaPrima(n); noteDi(n).splice(k,1); salva(); fermaVoce(); chiudi(); mostraTesti(n); }
function dettaTesto(){
  const R=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!R){ avvisa('Il microfono non funziona su questo browser','no'); return; }
  const b=$('#txMic');
  if(_voce){ fermaVoce(); return; }
  _voce=new R();
  _voce.lang = (LET.lez&&LET.lez.lg==='ro') ? 'ro-RO' : 'it-IT';
  _voce.continuous=true; _voce.interimResults=true;
  let fisso='';
  _voce.onresult=e=>{
    let prov='';
    for(let i=e.resultIndex;i<e.results.length;i++){
      const r=e.results[i];
      if(r.isFinal) fisso+=r[0].transcript+' '; else prov+=r[0].transcript;
    }
    const t=$('#txArea'); if(!t) return;
    if(!t.dataset.base) t.dataset.base=t.innerText;
    t.innerText=(t.dataset.base+' '+fisso+prov).replace(/\s+/g,' ').trim();
  };
  _voce.onerror=()=>{ avvisa('Non riesco a sentire: controlla il permesso del microfono','no'); fermaVoce(); };
  _voce.onend=()=>{ if(_voce) fermaVoce(); };
  try{ _voce.start(); if(b){ b.textContent='⏹ Ferma'; b.classList.add('pr'); } avvisa('Parla pure…','ok'); }
  catch(e){ fermaVoce(); }
}
function fermaVoce(){
  const b=$('#txMic'); if(b){ b.textContent='🎤 Detta'; b.classList.remove('pr'); }
  const t=$('#txArea'); if(t) delete t.dataset.base;
  if(_voce){ try{ _voce.onend=null; _voce.stop(); }catch(e){} _voce=null; }
}

document.addEventListener('touchstart',e=>{ if($('#lettore')&&$('#lettore').classList.contains('on')&&e.touches.length===2) pizzicoGiu(e); },{passive:false});
document.addEventListener('touchmove',e=>{ if(LET._pz) pizzicoMuovi(e); },{passive:false});
document.addEventListener('touchend',e=>{ if(LET._pz&&e.touches.length<2) pizzicoSu(); });
/* toccare la pagina (senza strumenti in mano) fa sparire tutti i pulsanti:
   il dito arriva sul foglio, non sulla tela degli appunti, e prima si perdeva */
function toccoFoglio(e){
  if(LET.strumento!=='mano') return;
  if(e.target.closest('.let-tx')) return;
  nudo();
}
document.addEventListener('click',e=>{
  const b=$('#lettore'); if(!b||!b.classList.contains('on')) return;
  if(e.target.closest('.let-sx')||e.target.closest('.let-pie')||e.target.closest('#letEsc')) return;
  if(e.target.closest('.let-foglio')||e.target.closest('#letArea')) toccoFoglio(e);
});
document.addEventListener('mousedown',e=>{ if(e.target&&e.target.classList&&e.target.classList.contains('let-note')) letGiu(e); });
document.addEventListener('mousemove',e=>{ if(LET.disegna) letMuovi(e); });
document.addEventListener('mouseup',letSu);
document.addEventListener('touchstart',e=>{ if(e.target&&e.target.classList&&e.target.classList.contains('let-note')) letGiu(e); },{passive:false});
document.addEventListener('touchmove',e=>{ if(LET.disegna) letMuovi(e); },{passive:false});
document.addEventListener('touchend',letSu);
document.addEventListener('keydown',e=>{
  if(!$('#lettore')||!$('#lettore').classList.contains('on')) return;
  if(e.key==='ArrowRight'||e.key==='PageDown') vaiPag(LET.pag+1);
  else if(e.key==='ArrowLeft'||e.key==='PageUp') vaiPag(LET.pag-1);
  else if(e.key==='Escape') chiudiLet();
});

/* --- esporta il lezionario unito, con gli appunti --- */
async function salvaLezUnito(i){
  const l=trovaLez(i); if(!l) return;
  avvisa('Preparo il PDF unito… può richiedere un minuto');
  try{
    await caricaPdfJs();
    const b1=await kvGet('all:'+l.fid);
    const doc=await pdfjsLib.getDocument({data:new Uint8Array(await b1.arrayBuffer())}).promise;
    let docCop=null;
    if(l.cid){ const b2=await kvGet('all:'+l.cid);
      if(b2) docCop=await pdfjsLib.getDocument({data:new Uint8Array(await b2.arrayBuffer())}).promise; }
    const nCop=docCop?docCop.numPages:0, tot=nCop+doc.numPages;
    const imgs=[]; let L=0,H=0;
    for(let n=1;n<=tot;n++){
      const daCop=n<=nCop, d=daCop?docCop:doc, num=daCop?n:(n-nCop);
      const pg=await d.getPage(num);
      const v0=pg.getViewport({scale:1});
      const sc=1800/v0.width, v=pg.getViewport({scale:sc});   /* più fitto: le lettere restano nitide */
      const c=document.createElement('canvas');
      c.width=Math.round(v.width); c.height=Math.round(v.height);
      if(!L){ L=c.width; H=c.height; }
      const x=c.getContext('2d'); x.fillStyle='#fff'; x.fillRect(0,0,c.width,c.height);
      await pg.render({canvasContext:x,viewport:v}).promise;
      const w=c.width,h=c.height;
      (noteDi(n,l)||[]).forEach(a=>{
        if(a.t==='evid'){ x.save(); x.globalCompositeOperation='multiply';
          x.globalAlpha=(a.o!=null?a.o:1); x.fillStyle=a.c;
          (rettDi(a,n)||[]).forEach(r=>x.fillRect(r[0]*w,r[1]*h,r[2]*w,r[3]*h)); x.restore(); }
        else if(a.t==='sott'){ x.strokeStyle=a.c; x.lineWidth=Math.max(2,(a.s||3)*w/900); x.lineCap='round';
          (rettDi(a,n)||[]).forEach(r=>{ const y=(r[1]+r[3])*h + Math.max(1,r[3]*h*0.06);
            x.beginPath(); x.moveTo(r[0]*w,y); x.lineTo((r[0]+r[2])*w,y); x.stroke(); }); }
        else if(a.t==='penna'){ x.strokeStyle=a.c; x.lineWidth=a.s*w/900; x.lineCap='round'; x.lineJoin='round';
          x.beginPath(); a.p.forEach((q,k)=>k?x.lineTo(q[0]*w,q[1]*h):x.moveTo(q[0]*w,q[1]*h)); x.stroke(); }
        else if(a.t==='testo'){
          const fs=(a.s||4)*4*w/900;
          x.fillStyle=a.c; x.font=`600 ${fs}px ${FAMIGLIE[a.f||'serif']}`; x.textBaseline='top';
          const largo=(a.w||0.42)*w;
          let y=a.y*h;
          a.txt.split('\n').forEach(par=>{
            let riga='';
            par.split(' ').forEach(pa=>{
              const prova=riga?riga+' '+pa:pa;
              if(x.measureText(prova).width>largo && riga){ x.fillText(riga,a.x*w,y); y+=fs*1.25; riga=pa; }
              else riga=prova;
            });
            x.fillText(riga,a.x*w,y); y+=fs*1.25;
          });
        }
      });
      imgs.push(c.toDataURL('image/jpeg',0.82));
    }
    scarica(pdfDaImmagini(imgs,L,H),`${l.titolo||'Lezionario'} ${l.anno}-${l.trim}.pdf`,'application/pdf');
    avvisa(`PDF unito pronto — ${imgs.length} pagine`,'ok');
  }catch(e){ console.error(e); avvisa('Errore: '+e.message,'no'); }
}
