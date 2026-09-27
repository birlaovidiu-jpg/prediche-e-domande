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

/* ---- copertine: sempre e solo il FRONTE, in verticale ----
   I file «copertina» sono spesso doppi: retro e fronte affiancati in una pagina larga
   (in rumeno il retro sta a sinistra, in certi file italiani a destra). In anteprima si
   vede solo il fronte, come una copertina vera. */
const COP_DOPPIA=1.15;         /* più larga che alta di così = retro e fronte affiancati */
const _RX_COP_RETRO=/offert|primo sabato|darul sabatului|[iî]nt[aâ]i|\bi\s*s\s*s\s*n\b|dipartiment|departament|\bvedi pag|\bvezi pag/i;
const _RX_COP_FRONTE=/lezionario|lec[țţt]ii?\s+biblice|scuola del sabato|[șş]coala de sabat|\bvol\b|adulti|adul[țţt]i/i;
function _luminosita(ctx,x,y,w,h){
  const d=ctx.getImageData(x,y,w,h).data; let s=0;
  for(let i=0;i<d.length;i+=4) s+=0.299*d[i]+0.587*d[i+1]+0.114*d[i+2];
  return s/(d.length/4);
}
/* quale metà è il fronte, 'sx' o 'dx'. Prima le scritte (il retro ha le offerte e l'ISSN, il
   fronte il nome del lezionario), poi la luce (il retro ha lo sfondo chiaro, il fronte la
   foto e il blocco col titolo), e in mancanza di tutto la destra, com'è nei file di stampa */
function metaFronte(lumSx,lumDx,testoSx,testoDx){
  const pt=t=>(_RX_COP_FRONTE.test(t)?1:0)-(_RX_COP_RETRO.test(t)?1:0);
  const a=pt(testoSx||''), b=pt(testoDx||'');
  if(a!==b) return a>b?'sx':'dx';
  if(Math.abs(lumSx-lumDx)>=15) return lumSx<lumDx?'sx':'dx';
  return 'dx';
}
/* la tela con la pagina doppia → una tela con il solo fronte */
function fronteDaCanvas(c,testoSx,testoDx){
  const W=c.width, H=c.height, m=W>>1, ctx=c.getContext('2d');
  const lato=metaFronte(_luminosita(ctx,0,0,m,H),_luminosita(ctx,m,0,W-m,H),testoSx,testoDx);
  const o=document.createElement('canvas'); o.width=m; o.height=H;
  o.getContext('2d').drawImage(c,lato==='sx'?0:m,0,m,H,0,0,m,H);
  return o;
}
/* la prima pagina del file come copertina: se è doppia, solo il fronte (largo `larghezza`) */
async function copertinaInImmagine(doc,larghezza){
  const pg=await doc.getPage(1), v0=pg.getViewport({scale:1});
  if(v0.width/v0.height<=COP_DOPPIA) return paginaInImmagine(doc,1,larghezza);
  const v=pg.getViewport({scale:(larghezza||520)*2/v0.width});
  const c=document.createElement('canvas'); c.width=Math.round(v.width); c.height=Math.round(v.height);
  await pg.render({canvasContext:c.getContext('2d'),viewport:v}).promise;
  let sx='', dx='';
  try{ (await pg.getTextContent()).items.forEach(t=>{ if(t.transform[4]<v0.width/2) sx+=' '+t.str; else dx+=' '+t.str; }); }catch(e){}
  return fronteDaCanvas(c,sx,dx).toDataURL('image/jpeg',0.84);
}
/* una copertina già salvata come immagine larga: ne ritaglio il fronte */
async function fronteDaImmagine(src){
  const im=await new Promise((ok,no)=>{ const i=new Image(); i.onload=()=>ok(i); i.onerror=()=>no(new Error('immagine')); i.src=src; });
  if(im.naturalWidth/im.naturalHeight<=COP_DOPPIA) return src;
  const c=document.createElement('canvas'); c.width=im.naturalWidth; c.height=im.naturalHeight;
  c.getContext('2d').drawImage(im,0,0);
  return fronteDaCanvas(c,'','').toDataURL('image/jpeg',0.86);
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
        s:_sv('<path d="M4 21h16"/><path d="M6 21V9l6-6 6 6v12"/><path d="M10 21v-6h4v6"/>')},
  copia:{t:'Copia tutti gli appunti di una lezione, per incollarli nell\'altra lingua',
        s:_sv('<rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h2"/>')},
  incolla:{t:'Incolla qui gli appunti copiati, sulle stesse parole',
        s:_sv('<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V2.5h6V4"/><path d="M9 11h6"/><path d="M9 15h4"/>')}
};
/* i colori con cui si può tingere la carta della pagina */
const COL_PAGINA=[['#ffffff','Bianca'],['#fffdf7','Bianco panna chiaro'],['#fdf6e3','Panna'],
                  ['#f6e9cf','Sabbia'],['#f0ead6','Avorio'],['#e8f5e9','Verde chiaro'],
                  ['#e9efe6','Verde tenue'],['#e6f2fb','Azzurra'],['#f3eefb','Lilla chiaro'],
                  ['#fdeaf0','Rosa'],['#ededed','Grigia']];
/* i colori degli appunti, in ordine di tonalità (rossi, arancioni, gialli, verdi,
   azzurri, blu, viola, rosa, e in fondo grigi e nero), senza quelli quasi bianchi:
   sono 30, così nella finestra dei colori fanno righe tutte piene da 10 */
const COL_APPUNTI_LEZ=['#b3122a','#e02b3c','#ff7f7f','#ff3f34','#c23616','#ffb37a','#8a5a2b','#e07b00','#c8a02e','#ffd23f',
                       '#ffe98a','#8de08d','#3ae374','#128a3c','#0a5c2a','#00b894','#01a3a4','#0abde3','#7fc9ff','#1f6feb',
                       '#0b3f9e','#7158e2','#6a2fa0','#a24bd8','#f368e0','#6d214f','#b33771','#555f6e','#2d3436','#111111'];

/* La barra degli strumenti e «esc» stanno tutte sulla carta, proprio al suo
   bordo sinistro (mai sulla striscia scura fuori dalla pagina): leggo dove
   comincia il primo foglio e ce le metto. Lo rifaccio quando scorri, ingrandisci
   o giri lo schermo. */
function posBarraLet(){
  const box=document.getElementById('lettore'); if(!box||!box.classList.contains('on')) return;
  /* mi regolo sulla pagina che si vede davvero, cioè una già disegnata: le
     altre, ancora vuote, all'apertura sono un po' più larghe (la barra di
     scorrimento arriva solo dopo) e la barra finiva fuori dalla pagina bianca */
  const f=[...box.querySelectorAll('.let-foglio')].find(z=>LET.pagine[+z.dataset.p]) || box.querySelector('.let-foglio');
  if(!f) return;
  const x=Math.max(0,Math.round(f.getBoundingClientRect().left));
  if(box._x!==x){ box._x=x; box.style.setProperty('--let-x',x+'px'); }
}
if(!window._posBarraLet){ window._posBarraLet=setInterval(posBarraLet,300); window.addEventListener('resize',posBarraLet); }

/* ---------- apertura ---------- */
async function apriLez(i,pagina,opz){
  /* anche i Libri si leggono qui, con la stessa barra per gli appunti (opz.libro) */
  const libro=!!(opz&&opz.libro);
  const l=libro?lbTrova(i):trovaLez(i); if(!l) return;
  /* «Annulla» non deve portare gli appunti di un lezionario dentro a un libro, o viceversa */
  const qui=libro?'lb'+l.i:'lezionari';
  if(LET._storiaDi!==qui){ STORIA.indietro.length=0; STORIA.avanti.length=0; LET._storiaDi=qui; }
  LET.libro=libro;
  /* le misure delle pagine valgono per UN lezionario: l'italiano e il rumeno hanno fogli di misura diversa */
  if(LET._dimDi!==l.i){ LET.dim={}; LET._dimDi=l.i; }
  LET.lez=l; LET.zoom=1; LET.strumento='mano'; LET.righe={}; LET.pagine={};
  LET.altrui={}; LET._par={};
  /* i Libri si ricordano il loro modo (scorrere in giù o sfogliare), separato dai lezionari */
  LET.modo=(libro?stato.imp.modoLibri:stato.imp.modoLettore)||'scorrimento';
  /* colore, spessori e trasparenza restano come li hai lasciati l'ultima
     volta, non tornano al valore di partenza ogni volta che riapri */
  LET.colori=Object.assign({evid:'#e02b3c',sott:'#e02b3c',penna:'#e02b3c',testo:'#e02b3c'},stato.imp.coloriLettore||{});
  LET.opacita=stato.imp.opacitaLettore!=null?stato.imp.opacitaLettore:0.56;
  LET.spessoreRiga=stato.imp.spessoreRigaLettore||1;
  LET.spessore=stato.imp.spessoreLettore||3;
  LET.carattere=stato.imp.carattereLettore||'serif';
  let box=$('#lettore');
  if(!box){ box=document.createElement('div'); box.id='lettore'; document.body.appendChild(box); }
  /* un Libro si apre a tutto schermo, senza la barra a sinistra: un tocco sulla
     pagina la fa comparire (e un altro la nasconde di nuovo) */
  box.className=libro?'on libro nudo':'on';
  box.innerHTML=`
   <button id="letEsc" onclick="chiudiLet()" title="Esci">esc</button>
   <div class="let-sx" id="letSx">
     ${[['evid','Evidenzia'],['sott','Sottolinea'],['penna','Penna'],['testo','Scrivi'],['gomma','Cancella']].map(([k,et])=>
       `<button class="lst" data-s="${k}" onclick="setStru('${k}')" title="${ICO[k].t}">${ICO[k].s}<i>${et}</i></button>`).join('')}
     <div class="lst-sep"></div>
     <button class="lst" id="letColore" onclick="apriColoriLet()" title="Scegli il colore"><span class="pallino"></span><i>Colore</i></button>
     <div class="lst-sep"></div>
     ${libro?'':`<button class="lst" onclick="apriIndiceLez()" title="${ICO.indice.t}">${ICO.indice.s}<i>Indice</i></button>
     <button class="lst" onclick="vaiAlSabato()" title="${ICO.sabato.t}">${ICO.sabato.s}<i>Sabato</i></button>`}
     <button class="lst" id="letModo" onclick="cambiaModo()" title="Pagina singola o scorrimento">${ICO.scorri.s}<i id="letModoEt">Scorri</i></button>
     <div class="lst-sep"></div>
     <button class="lst" id="letAnnulla" onclick="annullaAppunto()" title="${ICO.annulla.t}">${ICO.annulla.s}<i>Annulla</i></button>
     <button class="lst" onclick="apriAppunti()" title="${ICO.lista.t}">${ICO.lista.s}<i>Appunti</i></button>
     <button class="lst" data-s="pulisci" onclick="setStru('pulisci')" title="${ICO.pulisci.t}">${ICO.pulisci.s}<i>Pulisci</i></button>
     ${libro?`<div class="lst-sep"></div>
     <button class="lst" id="lbSegnaBt" onclick="lbSegna()" title="Metti o togli il segnalibro su questa pagina"><b class="lst-em">🔖</b><i>Segnalibro</i></button>
     <button class="lst" id="lbVaiSegno" onclick="lbElencoSegni()" title="I tuoi segnalibri: tocca per andarci"><b class="lst-em">📑</b><i>Segnalibri</i></button>`:''}
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
   <div class="let-carico" id="letCarico">${libro?'Apro il libro…':'Apro il lezionario…'}</div>`;
  document.documentElement.style.overflow='hidden';
  setStru('mano');
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
    if(libro){ if(l.pagine!==LET.tot){ l.pagine=LET.tot; salva(); } }
    else { if(!l.lezioni||!l.lezioni.length) analizzaLezionario(l);
      portaAppuntiVecchi(l); }
    const p = pagina || (libro?lbPaginaDaAprire(l):paginaDaAprire(l));
    $('#letCarico').style.display='none';
    if(LET.modo==='scorrimento') await apriScorrimento(p); else await mostraPag(p);
    if(libro) lbSegnoBarra();
    /* «la lezione di oggi»: dentro alla pagina scorro fino al punto dove comincia il giorno di oggi */
    if(opz && opz.giorno && pagina) portaAlGiorno(LET.pag,opz.giorno,opz.quale);
  }catch(e){ console.error(e); const c=$('#letCarico'); if(c) c.textContent='Errore: '+e.message; }
}
/* Dentro a una pagina un giorno comincia in un punto preciso, di solito a metà pagina, dopo la fine del giorno
   prima. Cerco fra le righe di testo della pagina quella dove sta scritta la data e ne do la posizione
   (0 = in cima alla pagina, 1 = in fondo); null se non la trovo. Se la stessa data c'è più volte,
   «quale» dice quale prendere (0 = la prima). */
function rigaDelGiorno(righe,data,quale){
  const rx=_rxDataDiOggi(data.getDate(),data.getMonth());
  let resta=quale||0;
  for(const r of (righe||[])){
    const t=_senzaAccenti(ricuci(r.el.map(x=>x.s).join(' ')));
    rx.lastIndex=0; let m;
    while((m=rx.exec(t))){ if(!m[2] || +m[2]===data.getFullYear()){ if(resta--<=0) return r.y; break; } }
  }
  return null;
}
/* Dove comincia DAVVERO il titolo del giorno sulla pagina disegnata: i titoli stanno dentro a una
   fascia colorata (grigia, con la data in un riquadro scuro) che sporge sopra alle lettere di quanto
   vuole chi ha impaginato — diverso in italiano e in rumeno. Parto dall'alto delle lettere e salgo
   finché la riga di punti è piena di colore; la prima riga bianca è il bordo. Senza fascia resta
   l'alto delle lettere. (0 = cima della pagina, 1 = fondo) */
function cimaDelTitolo(f,r){
  const c=f&&f.querySelector('.let-pdf');
  if(!c||c.width<2||c.height<2||!r||!r.el||!r.el.length) return r?r.y:0;
  try{
    const cx=c.getContext('2d');
    const x0=Math.max(0,Math.floor(Math.min(...r.el.map(e=>e.x))*c.width));
    const x1=Math.min(c.width,Math.ceil(Math.max(...r.el.map(e=>e.x+e.w))*c.width));
    const w=x1-x0; if(w<4) return r.y;
    const pieno=yy=>{ const d=cx.getImageData(x0,yy,w,1).data; let n=0;
      for(let i=0;i<d.length;i+=4) if(d[i]<235||d[i+1]<235||d[i+2]<235) n++; return n/w; };
    let y=Math.round(r.y*c.height);
    const lim=Math.max(0,y-Math.round(r.h*c.height*1.5));
    while(y>lim && pieno(y-1)>0.5) y--;
    return y/c.height;
  }catch(e){ return r.y; }
}
/* scorro fino al punto della pagina dove comincia il giorno: il lezionario si apre ESATTAMENTE al giorno di oggi,
   con il bordo alto della fascia del titolo proprio contro il bordo alto dello schermo, in tutte e due le lingue.
   Le pagine vicine si disegnano subito dopo: se nel frattempo non hai toccato niente, ricontrollo e rimetto a posto. */
function portaAlGiorno(n,data,quale,ancora){
  const y=rigaDelGiorno(LET.righe[n],data,quale); if(y==null) return false;
  const area=$('#letArea'), f=document.querySelector(`.let-foglio[data-p="${n}"]`);
  if(!area||!f) return false;
  const rA=area.getBoundingClientRect(), rF=f.getBoundingClientRect();
  const r=(LET.righe[n]||[]).find(x=>x.y===y);
  /* proprio al limite alto dello schermo (chiesto così: senza lasciare lo spazio della barra dell'ora) */
  area.scrollTop += Math.round((rF.top-rA.top) + cimaDelTitolo(f,r)*rF.height);
  const fermo=area.scrollTop;
  if(!ancora) [400,1200,2500].forEach(ms=>setTimeout(()=>{
    const a=$('#letArea');
    if(a===area && a.scrollTop===fermo && LET.righe[n]) portaAlGiorno(n,data,quale,true);
  },ms));
  return true;
}
function chiudiLet(){
  ricordaPagina();
  clearInterval(LET._tv);
  const b=$('#lettore'); if(b){ b.className=''; b.innerHTML=''; }
  document.documentElement.style.overflow='';
  LET.doc=LET.docCop=null; salva();
  const eraLibro=LET.libro; LET.libro=false;
  if(eraLibro){ if(sezione==='libri') vLibri(); return; }
  if(sezione==='sabato') vSabato();
}
function ricordaPagina(){ if(LET.lez){ LET.lez.ultimaPag=LET.pag; LET.lez.quandoLetto=new Date().toISOString(); }
  if(LET.libro && typeof lbSegnoBarra==='function') lbSegnoBarra(); }

/* ---------- strumenti ---------- */
function setStru(s){
  const prima=LET.strumento;
  /* toccando di nuovo lo stesso pulsante lo si spegne: torna la mano libera */
  if(s===prima && s!=='mano') s='mano';
  LET.strumento=s;
  if(['evid','sott','penna','testo'].includes(s)){ stato.imp.ultimoStrumentoColore=s; salva(); }

  $$('.lst').forEach(b=>b.classList.toggle('on',b.dataset.s===s));
  if(LET.libro && typeof lbSegnoBarra==='function') lbSegnoBarra();
  /* il pulsante Scorri/Pagina non è uno strumento: il giro qui sopra lo spegneva, lo rimetto com'è */
  aggiornaModo();
  $$('.let-note').forEach(n=>n.style.pointerEvents = s==='mano'?'none':'auto');
  const a=$('#letArea'); if(a) a.classList.toggle('con-strumento',s!=='mano');
  mostraColore();
  if(s==='testo') avvisa('Tocca la pagina dove vuoi scrivere','ok');
  else if(s==='mano'&&prima!=='mano') avvisa('Strumento spento','ok');
}
/* ogni strumento si ricorda il suo colore: l'evidenziatore giallo,
   la riga rossa, la penna nera… senza pestarsi i piedi. Quando lo strumento
   attivo è la manina (sempre, appena riapri il lettore) mostro il colore
   dell'ULTIMO strumento colorato che avevi usato, non sempre quello della
   penna — altrimenti il pallino sembrava "dimenticare" il colore appena
   scelto per l'evidenziatore ogni volta che riaprivi. */
function strumentoColore(){
  if(['evid','sott','penna','testo'].includes(LET.strumento)) return LET.strumento;
  return stato.imp.ultimoStrumentoColore || 'penna';
}
function setCol(c){
  LET.colore=c;
  LET.colori=LET.colori||{};
  LET.colori[strumentoColore()]=c;
  stato.imp.coloriLettore=LET.colori; salva();
  mostraColore();
}
/* il colore della carta */
/* i Libri hanno il loro colore della carta, separato da quello dei lezionari */
function coloreCarta(){ return (LET.libro?stato.imp.cartaLibri:stato.imp.cartaLettore)||'#ffffff'; }
function setColPagina(c){
  if(LET.libro) stato.imp.cartaLibri=c; else stato.imp.cartaLettore=c;
  salva();
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
  stato.imp.coloriLettore=LET.colori; salva();
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
  apri('Colore',`<div class="col-griglia dieci">${COL_APPUNTI_LEZ.map(c=>
      `<button class="col-g${c===LET.colore?' on':''}" style="background:${c}" onclick="setCol('${c}');chiudi()"></button>`).join('')}</div>
    <div class="campo" style="margin-top:16px"><label>Colore della pagina</label>
      <div class="col-griglia" id="colPag">${COL_PAGINA.map(([c,nm])=>
        `<button class="col-g pic2${c===coloreCarta()?' on':''}" style="background:${c}" title="${nm}"
          onclick="setColPagina('${c}')"></button>`).join('')}</div></div>
    <div class="campo" style="margin-top:16px"><label>Colore della riga per sottolineare</label>
      <div class="col-griglia dieci piccoli" id="colSott">${COL_APPUNTI_LEZ.map(c=>
        `<button class="col-g pic2${c===(LET.colori&&LET.colori.sott)?' on':''}" style="background:${c}"
          onclick="setColSott('${c}')"></button>`).join('')}</div></div>
    <div class="campo" style="margin-top:14px"><label>Quanto è trasparente l'evidenziatore
      — <b id="etOp">${Math.round(LET.opacita*100)}%</b> di colore</label>
      <input type="range" min="20" max="100" value="${Math.round(LET.opacita*100)}"
        oninput="LET.opacita=+this.value/100;document.getElementById('etOp').textContent=this.value+'%';antTratti();
                 stato.imp.opacitaLettore=LET.opacita;salva()"></div>
    <div class="campo"><label>Grossezza della riga per sottolineare — <b id="etRg">${LET.spessoreRiga}</b></label>
      <input type="range" min="1" max="12" value="${LET.spessoreRiga}"
        oninput="LET.spessoreRiga=+this.value;document.getElementById('etRg').textContent=this.value;antTratti();
                 stato.imp.spessoreRigaLettore=LET.spessoreRiga;salva()"></div>
    <div class="campo"><label>Grossezza della penna — <b id="etSp">${LET.spessore}</b></label>
      <input type="range" min="2" max="20" value="${LET.spessore}"
        oninput="LET.spessore=+this.value;document.getElementById('etSp').textContent=this.value;
                 stato.imp.spessoreLettore=LET.spessore;salva()"></div>
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
  if(LET.libro) stato.imp.modoLibri=LET.modo; else stato.imp.modoLettore=LET.modo;
  salva(); aggiornaModo();
  if(LET.modo==='scorrimento') apriScorrimento(LET.pag); else mostraPag(LET.pag);
}
function aggiornaModo(){
  const b=$('#letModo'); if(!b) return;
  /* libri e lezionari: «Scorri» (le pagine scorrono in giù) o «Sfoglia» (una alla volta verso sinistra, come un libro) */
  const et=$('#letModoEt'); if(et) et.textContent = LET.modo==='scorrimento' ? 'Scorri' : 'Sfoglia';
  b.classList.toggle('on',LET.modo==='scorrimento');
  b.title = LET.modo==='scorrimento' ? 'Adesso le pagine scorrono in giù: tocca per sfogliarle una alla volta verso sinistra, come un libro'
                                     : 'Adesso sfogli una pagina alla volta (trascina verso sinistra): tocca per farle scorrere in giù';
  const a=$('#letArea'); if(a) a.classList.toggle('scorre',LET.modo==='scorrimento');
}
function zoomLez(d){
  LET.zoom=Math.max(0.5,Math.min(3,LET.zoom+d));
  const z=$('#letZoom'); if(z) z.textContent=Math.round(LET.zoom*100)+'%';
  if(LET.modo==='scorrimento') apriScorrimento(LET.pag); else mostraPag(LET.pag);
}
/* Giri l'iPad (o cambia la misura della finestra): le pagine si rifanno larghe
   quanto il nuovo schermo e restano sullo stesso punto della lezione. Conta solo
   la LARGHEZZA: quando compare la tastiera cambia solo l'altezza e non c'è
   niente da rifare. */
let _tRidLet=null, _adattandoLet=false;
function adattaLettoreAlloSchermo(){
  clearTimeout(_tRidLet);
  _tRidLet=setTimeout(rifaiLettoreSeServe,220);
}
async function rifaiLettoreSeServe(){
  const box=document.getElementById('lettore');
  if(!box||!box.classList.contains('on')||!LET.doc||LET._pz||zoomNativo()) return;
  if(_adattandoLet){ adattaLettoreAlloSchermo(); return; }
  if(LET._largLay && Math.abs(largFinestra()-LET._largLay)<2) return;
  _adattandoLet=true;
  try{
    /* dove sono: la pagina in cima allo schermo e quanto ne ho già letto */
    const area=$('#letArea');
    const n=(LET.modo==='scorrimento'?pagineInVista()[0]:LET.pag)||LET.pag;
    const f=document.querySelector(`.let-foglio[data-p="${n}"]`);
    let frac=0;
    if(area&&f&&f.offsetHeight){
      const rA=area.getBoundingClientRect(), rF=f.getBoundingClientRect();
      frac=(rA.top+10-rF.top)/rF.height;
    }
    LET.pag=n;
    if(LET.modo==='scorrimento') await apriScorrimento(n); else await mostraPag(n);
    const a2=$('#letArea'), f2=document.querySelector(`.let-foglio[data-p="${n}"]`);
    if(a2&&f2){
      const rA=a2.getBoundingClientRect(), rF=f2.getBoundingClientRect();
      a2.scrollTop += (rF.top-rA.top-10) + frac*rF.height;
    }
    LET.pag=n; const c=$('#letPag'); if(c) c.value=n;
    LET._firmaVista=''; aggiornaVista(); posBarraLet();
  }catch(e){ console.warn('adatto il lettore allo schermo',e); }
  _adattandoLet=false;
  /* se nel frattempo lo schermo è girato ancora, si rifà */
  if(LET._largLay && Math.abs(largFinestra()-LET._largLay)>=2) adattaLettoreAlloSchermo();
}
window.addEventListener('resize',adattaLettoreAlloSchermo);
window.addEventListener('orientationchange',adattaLettoreAlloSchermo);
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
  LET._verso=1;   /* saltando a una pagina, quella da preparare in anticipo è la dopo */
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
/* Quanto è larga la pagina: sempre quanto lo schermo, a tutta larghezza.
   Prima entrava tutta in altezza: su un iPad orizzontale, con una pagina di
   lezionario alta e stretta, veniva larga quanto la metà dello schermo, con
   due grosse fasce vuote ai lati. Ora si scorre in verticale per vedere il
   resto, come già capita fra una pagina e l'altra. */
function largSchermo(){
  const a=$('#letArea');
  let lw=(a?a.clientWidth:largFinestra())-(largFinestra()<760?8:56);
  /* Un Libro si legge a tutto schermo: in verticale la pagina sta TUTTA intera
     sullo schermo, in orizzontale è larga quanto tutto lo schermo (senza le fasce
     vuote ai lati) e il resto della pagina si vede scorrendo in giù */
  if(LET.libro){
    const W=a?a.clientWidth:largFinestra(), H=a?a.clientHeight:window.innerHeight;
    lw=W-(W<760?4:10);
    const d=LET.dim[LET.pag]||LET.dim[1], h=H-32;
    if(H>=W && d&&d.w&&d.h&&h>120) lw=Math.min(lw,h*d.w/d.h);
  }
  return Math.max(240,lw);
}
/* pizzicare con due dita per ingrandire o rimpicciolire */
function distanza(e){ const [a,b]=e.touches; return Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY); }
/* Mentre pizzichi non ingrandisco le pagine vere (tele enormi, che l'iPad a ogni
   movimento buttava via e ridisegnava: lo schermo lampeggiava per tutto lo zoom):
   faccio una «fotografia» di quello che si vede, grande quanto lo schermo, e
   ingrandisco quella, liscia. Quando stacchi le dita ridisegno le pagine alla
   misura nuova e tolgo la fotografia solo quando sono pronte, così non si vede
   mai il bianco. */
function letLente(){
  const area=$('#letArea'); if(!area) return null;
  const ra=area.getBoundingClientRect(), dpr=Math.min(2,window.devicePixelRatio||1);
  const c=document.createElement('canvas'); c.id='letLente'; c.className='let-lente';
  c.width=Math.max(1,Math.round(ra.width*dpr)); c.height=Math.max(1,Math.round(ra.height*dpr));
  c.style.cssText=`left:${ra.left}px;top:${ra.top}px;width:${ra.width}px;height:${ra.height}px`;
  const x=c.getContext('2d'); x.scale(dpr,dpr);
  area.querySelectorAll('.let-foglio').forEach(f=>{
    const rf=f.getBoundingClientRect();
    if(rf.bottom<ra.top||rf.top>ra.bottom||rf.right<ra.left||rf.left>ra.right) return;
    x.fillStyle='#fff'; x.fillRect(rf.left-ra.left,rf.top-ra.top,rf.width,rf.height);
    f.querySelectorAll('canvas').forEach(t=>{
      if(!t.width||!t.height||t.classList.contains('let-lente')) return;
      try{ x.drawImage(t,rf.left-ra.left,rf.top-ra.top,rf.width,rf.height); }catch(e){}
    });
  });
  document.getElementById('lettore').appendChild(c);
  return c;
}
function togliLente(){ const c=$('#letLente'); if(c) c.remove(); const s=$('#letStack'); if(s) s.style.visibility=''; }
function pizzicoGiu(e){
  if(e.touches.length!==2) return;
  e.preventDefault();
  togliLente();
  const [p,q]=e.touches, area=$('#letArea'), ra=area?area.getBoundingClientRect():{left:0,top:0};
  LET._pz={d0:distanza(e), z0:LET.zoom, k:1,
    ox:(p.clientX+q.clientX)/2-ra.left, oy:(p.clientY+q.clientY)/2-ra.top};
  const c=letLente();
  if(c){ c.style.transformOrigin=LET._pz.ox+'px '+LET._pz.oy+'px'; const s=$('#letStack'); if(s) s.style.visibility='hidden'; }
}
function pizzicoMuovi(e){
  if(!LET._pz||e.touches.length!==2) return;
  e.preventDefault();
  const k=distanza(e)/LET._pz.d0;
  LET._pz.k=Math.max(0.4,Math.min(4/LET._pz.z0,k));
  if(LET._pzRaf) return;
  LET._pzRaf=requestAnimationFrame(()=>{ LET._pzRaf=0;
    const c=$('#letLente'); if(c&&LET._pz) c.style.transform='scale('+LET._pz.k.toFixed(3)+')'; });
}
async function pizzicoSu(){
  if(!LET._pz) return;
  const k=LET._pz.k||1, ox=LET._pz.ox, oy=LET._pz.oy; LET._pz=null;
  const nuovo=Math.max(0.5,Math.min(4,LET.zoom*k));
  if(Math.abs(nuovo-LET.zoom)<0.02){ togliLente(); return; }
  const a0=$('#letArea'), sl=a0?a0.scrollLeft:0, st=a0?a0.scrollTop:0, kk=nuovo/LET.zoom;
  LET.zoom=nuovo;
  const z=$('#letZoom'); if(z) z.textContent=Math.round(LET.zoom*100)+'%';
  try{
    if(LET.modo==='scorrimento') await apriScorrimento(LET.pag);
    else {
      await mostraPag(LET.pag);
      /* il punto che avevi fra le dita resta lì dov'era */
      const a=$('#letArea'); if(a){ a.scrollLeft=Math.max(0,(sl+ox)*kk-ox); a.scrollTop=Math.max(0,(st+oy)*kk-oy); }
    }
  }
  finally{ togliLente(); }
}
/* Quanto fitta è la tela sotto alla pagina: più punti per centimetro,
   più le lettere sono nitide. Prima si disegnava alla misura dello schermo
   e il testo veniva sgranato; adesso si disegna piu' fine e si rimpicciolisce,
   come fa la stampante. */
function fittezza(){
  const d=window.devicePixelRatio||1;
  let f=Math.min(3, Math.max(2, d*1.5));
  /* Da quando la pagina è larga quanto tutto lo schermo, a 3× la tela
     diventava enorme (più di tremila punti di larghezza): tanta memoria e
     tanto lavoro a ogni disegno — di lì gli scatti e le pagine bianche.
     Tengo la tela entro una misura che l'iPad regge, senza scendere sotto
     il doppio dello schermo: le lettere restano nitide lo stesso. */
  const larg=largSchermo()*(LET.zoom||1);
  const tetto=2600;
  if(larg*f>tetto) f=Math.max(2, tetto/larg);
  return Math.round(f*100)/100;
}
/* le tele degli appunti non hanno bisogno di essere altrettanto fitte:
   sono righe e non lettere, e così resta memoria per la pagina */
function fittezzaNote(){ return Math.min(1.5, Math.max(1.25, (window.devicePixelRatio||1))); }
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
  if(LET.libro) lbNastro(n);
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
/* La pagina nuova la disegno di nascosto, sotto a quella che stai guardando, e la
   scambio solo quando è pronta: prima si toglieva la vecchia e per mezzo secondo
   restava il foglio bianco mentre la nuova si disegnava.
   preparaPag() la prepara e dà indietro la funzione che la mette al posto della
   vecchia (la usa anche lo sfogliare dei libri, che la prepara mentre gira la pagina). */
/* una pagina nascosta, pronta a prendere il posto di quella che vedi */
function _stackAttesa(n,larg,alt,chiave){
  const s=document.createElement('div');
  s.className='let-stack in-attesa'; s.dataset.k=chiave; s.innerHTML=foglioHtml(n,larg,alt);
  $('#letArea').appendChild(s);
  s._pronta=disegnaPagina(n);
  return s;
}
async function preparaPag(n){
  n=Math.max(1,Math.min(LET.tot,n));
  const area=$('#letArea'); if(!area) return null;
  const mio=(LET._prep=(LET._prep||0)+1);
  const d=await misuraPagina(n);
  if(mio!==LET._prep) return null;
  const larg=largSchermo()*LET.zoom, alt=larg*d.h/d.w, chiave=n+'|'+Math.round(larg);
  /* se questa pagina l'avevo già disegnata in anticipo (quella dopo, mentre leggevi), la uso subito */
  let nuovo=[...area.querySelectorAll('.let-stack.in-attesa')].find(x=>x.dataset.k===chiave);
  area.querySelectorAll('.let-stack.in-attesa').forEach(x=>{ if(x!==nuovo) x.remove(); });
  const vecchio=area.querySelector('#letStack');
  /* la stessa pagina ridisegnata (dopo lo zoom): la vecchia smette di rispondere al suo numero */
  if(vecchio && !nuovo) vecchio.querySelectorAll(`.let-foglio[data-p="${n}"]`).forEach(f=>f.removeAttribute('data-p'));
  if(!nuovo) nuovo=_stackAttesa(n,larg,alt,chiave);
  nuovo.dataset.primo='1';
  await nuovo._pronta;
  if(mio!==LET._prep) return null;
  return ()=>{
    if(!nuovo.isConnected) return;
    LET.pag=n; const p=$('#letPag'); if(p) p.value=n;
    ricordaPagina();
    LET._largLay=largFinestra();   /* a che larghezza di finestra ho impaginato */
    area.querySelectorAll('.let-stack').forEach(x=>{ if(x!==nuovo) x.remove(); });
    nuovo.classList.remove('in-attesa'); nuovo.id='letStack'; delete nuovo.dataset.k; delete nuovo.dataset.primo;
    area.scrollTop=0;
    /* e intanto disegno di nascosto quella che viene dopo (nel verso in cui stai sfogliando):
       quando giri pagina è già pronta, senza aspettare */
    clearTimeout(LET._tPre);
    LET._tPre=setTimeout(()=>precaricaPag(n+(LET._verso||1)),150);
  };
}
async function precaricaPag(n){
  const area=$('#letArea');
  if(!area || LET.modo!=='pagina' || n<1 || n>LET.tot || n===LET.pag) return;
  const d=await misuraPagina(n);
  const larg=largSchermo()*LET.zoom, alt=larg*d.h/d.w, chiave=n+'|'+Math.round(larg);
  const gia=[...area.querySelectorAll('.let-stack.in-attesa')];
  if(gia.some(x=>x.dataset.k===chiave)) return;
  /* una sola pagina in anticipo (la memoria dell'iPad è poca); quella che sto preparando per te non si tocca */
  gia.forEach(x=>{ if(!x.dataset.primo) x.remove(); });
  _stackAttesa(n,larg,alt,chiave);
}
async function mostraPag(n){
  const metti=await preparaPag(n);
  if(metti) metti();
}
async function apriScorrimento(daPag){
  const area=$('#letArea');
  LET.pag=Math.max(1,Math.min(LET.tot,daPag||1));
  await misuraPagina(LET.pag);
  LET._largLay=largFinestra();
  const larg=largSchermo()*LET.zoom;
  let html='<div id="letStack" class="let-stack">';
  for(let n=1;n<=LET.tot;n++){
    const d=await misuraPagina(n);
    html+=foglioHtml(n,larg,larg*d.h/d.w);
  }
  area.innerHTML=html+'</div>';
  LET._mis=null; LET._firmaVista='';   /* impaginazione rifatta: le misure vecchie non valgono più */
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
  /* gli appunti di un Libro stanno in un cassetto tutto suo, pagina per pagina */
  if(l && (stato.libri||[]).indexOf(l)>=0) return 'lb'+l.i;
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
    else if(a.t==='penna'){ if(!segnoQui(a)||!paginaDelSegno(a,n)) return;
      x.strokeStyle=a.c; x.lineWidth=a.s; x.lineCap='round'; x.lineJoin='round';
      x.beginPath(); a.p.forEach((q,k)=>k?x.lineTo(q[0]*w,q[1]*h):x.moveTo(q[0]*w,q[1]*h)); x.stroke(); }
  });
  schedulaAggiornaAncore(n);
}
/* i segni di prima del 11 settembre 2026 non avevano ancora l'indirizzo per
   parola, quelli di prima del 16 non gestivano un segno a cavallo di due
   capoversi, e quelli di prima del 18 settembre 2026 (v2, per frase) potevano
   finire su una frase sbagliata quando le due edizioni non contavano le frasi
   allo stesso modo — vedi il perché sopra ad ancoraDa. Li aggiorno da soli
   (una volta a testa, guardando il bollino v3 — un indirizzo senza gwF non
   è ancora passato dal conto nuovo), ma DOPO aver disegnato, non durante —
   a farlo nello stesso istante dello scorrimento, con tante evidenziazioni
   vecchie, veniva a scatti sull'iPad. */
const _schedulati={};
const _ridle=window.requestIdleCallback||(fn=>setTimeout(fn,120));
function schedulaAggiornaAncore(n){
  if(_schedulati[n]) return; _schedulati[n]=1;
  _ridle(()=>{
    if(!LET.lez) return;
    let cambiati=0;
    noteDi(n).forEach(a=>{
      if(!a.an || a.an.gwF!=null || a.an.vuota || !a.rr || !a.rr.length) return;
      if(!(LET.lez && a.dl===LET.lez.i && paginaDelSegno(a,n))) return;
      const nuova=ancoraDa(n,a.rr);
      if(nuova && nuova.gwF!=null){ a.an=nuova; cambiati++; }
    });
    if(cambiati){ salva(); disegnaNote(n); }
  },{timeout:1000});
}
/* Quanto è grande una scritta sul foglio. La misura («Grandezza», da 2 a 20)
   vale su una pagina larga 900 punti — la stessa misura che usa il PDF da
   condividere — così la scritta cresce e rimpicciolisce INSIEME alla pagina
   quando ingrandisci, e resta grande come le parole del lezionario. */
function _pxTestoLez(n,s){
  const dim=LET.pagine[n];
  return (s||4)*4*((dim&&dim.w?dim.w:900)/900);
}
/* la grandezza del testo del lezionario proprio lì dove tocchi: una scritta
   nuova nasce grande come le parole che ha intorno */
function grandezzaTestoLez(n,p){
  const dim=LET.pagine[n], righe=righeSubito(n);
  if(!dim || !dim.w || !righe.length) return 0;
  let vicina=null, dist=1e9;
  righe.forEach(r=>{ const d=Math.abs((r.y+r.h/2)-p[1]); if(d<dist){ dist=d; vicina=r; } });
  if(!vicina) return 0;
  const h=_mediana((vicina.el||[]).map(e=>e.h))||vicina.h;
  if(!h) return 0;
  return Math.max(2,Math.min(20,Math.round(h*dim.h*900/(4*dim.w))));
}
function mostraTesti(n){
  const f=document.querySelector(`.let-foglio[data-p="${n}"]`); if(!f) return;
  const box=f.querySelector('.let-testi'); if(!box) return;
  box.innerHTML=noteDi(n).map((a,k)=> (a.t!=='testo'||!segnoQui(a)||!paginaDelSegno(a,n)) ? '' :
    `<div class="let-tx" data-k="${k}"
       style="left:${a.x*100}%;top:${a.y*100}%;max-width:${((a.w||0.42)*100).toFixed(1)}%;color:${a.c};font-size:${_pxTestoLez(n,a.s).toFixed(1)}px;font-family:${FAMIGLIE[a.f||'serif']}"
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
        if(mosso){ LET._dueTocchi=null; salva(); return; }
        /* Un tocco solo SELEZIONA soltanto (mostra le manopole per
           spostare e allargare); per cambiare la scritta si tocca DUE
           volte di seguito, come ha chiesto Ovidiu — prima bisognava
           tenere premuto due secondi. */
        const ora=Date.now(), due=LET._dueTocchi;
        if(due && due.n===n && due.k===k && ora-due.t<500){
          LET._dueTocchi=null; modificaTestoLez(n,k); return;
        }
        LET._dueTocchi={n,k,t:ora};
        selezionaTestoLez(n,k);
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
/* «Incolla appunti» tocca più giorni in un colpo solo: lo ricordo come un
   gruppo, così un solo «Annulla» lo toglie tutto */
function _statoAdesso(p){
  return p.gruppo ? {gruppo:p.gruppo.map(x=>({n:x.n, dati:JSON.parse(JSON.stringify(noteDi(x.n)))}))}
                  : {n:p.n, dati:JSON.parse(JSON.stringify(noteDi(p.n)))};
}
function _rimetti(p){
  if(!p.gruppo){ scriviNote(p.n,p.dati); salva(); vaiEDisegna(p.n); return; }
  p.gruppo.forEach(x=>scriviNote(x.n,x.dati)); salva();
  $$('.let-foglio').forEach(f=>{ if(f.dataset.fatto){ const n=+f.dataset.p; disegnaNote(n); mostraTesti(n); } });
}
function annullaAppunto(){
  const p=STORIA.indietro.pop();
  if(!p){ avvisa('Non c\'è niente da annullare','no'); return; }
  STORIA.avanti.push(_statoAdesso(p));
  _rimetti(p); aggiornaAnnulla();
  avvisa('Annullato','ok');
}
function rifaiAppunto(){
  const p=STORIA.avanti.pop();
  if(!p){ avvisa('Non c\'è niente da rifare','no'); return; }
  STORIA.indietro.push(_statoAdesso(p));
  _rimetti(p); aggiornaAnnulla();
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
  /* finché sto guardando le stesse pagine non c'è niente da rifare:
     durante lo scorrimento questo risparmia lavoro a ogni fotogramma */
  const area=$('#letArea'), st=area?area.scrollTop:0;
  const giu=st>=(LET._cimaPrima||0); LET._cimaPrima=st;
  const firma=viste.join(',')+(giu?'v':'^');
  if(firma===LET._firmaVista) return;
  LET._firmaVista=firma;
  /* prima le pagine che vedi, una alla volta (non tutte insieme, che si rubavano il tempo a
     vicenda e restavano bianche più a lungo), poi quelle che stanno arrivando nel verso in cui
     scorri — così quando ci arrivi sono già disegnate — e infine quella appena passata */
  const R=raggioVivo(), prima=viste[0], ultima=viste[viste.length-1], dopo=[];
  for(let k=1;k<=R;k++) dopo.push(giu?centro+k:centro-k);
  dopo.push(giu?prima-1:ultima+1);
  const ordine=[...viste,...dopo.filter(n=>n>=1&&n<=LET.tot&&!viste.includes(n))];
  const giro=(LET._giroVista=(LET._giroVista||0)+1);
  (async()=>{ for(const n of ordine){ if(giro!==LET._giroVista && !viste.includes(n)) break; await disegnaPagina(n); } })();
  liberaLontane(centro,viste);
}
/* Dove comincia e dove finisce ogni foglio, misurato UNA volta sola.
   Prima si misuravano tutti i fogli (anche cento e passa) a ogni fotogramma
   dello scorrimento: era quello a far venire gli scatti sull'iPad. Le
   misure cambiano solo quando si rifà l'impaginazione (apertura, zoom),
   e in quel caso questa memoria viene buttata via. */
function misureFogli(){
  const st=$('#letStack'); if(!st) return null;
  const alt=st.scrollHeight;
  if(LET._mis && LET._mis.alt===alt && LET._mis.tot===LET.tot) return LET._mis;
  const num=[], cima=[], fondo=[];
  $$('.let-foglio').forEach(f=>{
    num.push(+f.dataset.p); cima.push(f.offsetTop); fondo.push(f.offsetTop+f.offsetHeight);
  });
  return (LET._mis={alt,tot:LET.tot,num,cima,fondo});
}
/* quali pagine sto guardando adesso */
function pagineInVista(){
  if(LET.modo!=='scorrimento') return [LET.pag];
  const area=$('#letArea'); if(!area) return [LET.pag];
  const m=misureFogli(); if(!m||!m.num.length) return [LET.pag];
  const su=area.scrollTop+8, giu=area.scrollTop+area.clientHeight-8;
  const out=[];
  for(let i=0;i<m.num.length;i++) if(m.fondo[i]>su && m.cima[i]<giu) out.push(m.num[i]);
  return out.length?out:[LET.pag];
}
/* ================= LE DUE TRADUZIONI, PAROLA PER PAROLA =================
   Per incollare un appunto sulle STESSE parole nell'altra lingua non basta
   contare le parole (una traduzione ne usa di più o di meno qua e là): le
   due edizioni si allineano usando quello che è uguale in tutte e due —
   i numeri (versetti, pagine, date), i giorni della settimana, le lettere
   delle domande (a. b. c.), il punto di domanda e il resto della
   punteggiatura, i nomi e le parole che si somigliano (profeta/profetul,
   Romani/Romani), più un piccolo vocabolario delle parole che tornano
   sempre nelle lezioni (Dio/Dumnezeu, Signore/Domnul, peccato/păcat…).
   Fra un punto sicuro e l'altro si va in proporzione, e alla fine i bordi
   si fermano sugli stessi segni (inizio e fine della frase, virgole). */
const _AF_CAPO=1, _AF_RIGA=2, _AF_FUORI=4;   /* inizio capoverso · fine riga · testata o piè di pagina */
const _AL_LETT='0-9A-Za-z\u00C0-\u024F';
const _AL_TESTA=new RegExp('^[^'+_AL_LETT+']+'), _AL_CODA=new RegExp('[^'+_AL_LETT+']+$');
const _AL_SOLO_SEGNI=new RegExp('^[^'+_AL_LETT+']+$');
function _nrmAl(s){ return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase(); }
/* parole uguali nelle due lingue ma con un altro significato (o così
   frequenti da non voler dire niente): non servono per allineare */
const _AL_FALSE=new Set(['lui','mai','care','dar','tale','sale','mare','fata','fara','are','ale','din','unde',
  'vine','face','avere','dat','fie','sau','cum','pre','prea','cele','cel','cea','cei','ori','mia','stato',
  'stata','stati','state','dei','del','per','con','non','che','nel','sul','dal','gli','cui']);
/* il piccolo vocabolario: [cosa vuol dire, come comincia in italiano, come comincia in rumeno]
   («=parola» vuol dire la parola esatta, non solo come comincia) */
const _AL_VOC=[
  ['dio',['=dio','=iddio'],['dumnez']], ['signore',['signor'],['domn']], ['gesu',['=gesu'],['=isus']],
  ['cristo',['=cristo','=christ'],['hristo','=cristos']], ['cristiano',['cristian'],['crestin']],
  ['spirito',['spirit'],['duh','spirit']], ['chiesa',['chies'],['biseric']],
  ['fede',['=fede'],['credinta','credintei','credinte']], ['fedele',['fedel'],['credincio']],
  ['grazia',['grazia','=grazie'],['=har','=harul','=harului','=haruri']],
  ['peccato',['peccat','pecca'],['pacat','pacato']], ['salvatore',['salvator'],['mantuitor']],
  ['salvezza',['salvezz','salvat','salvar','=salva','=salvo','=salvi'],['mantui']],
  ['cuore',['cuor'],['inim']], ['amore',['amor','=amare','=ama','=amava','amat'],['iubi','dragost']],
  ['mondo',['mond'],['=lume','=lumea','=lumii','=lumi']], ['luce',['=luce','=luci'],['lumin']],
  ['parola',['parol'],['cuvant']],
  ['preghiera',['preghier','=pregare','=prega','=pregava','=pregate','=preghiamo','=prego','=pregato'],
               ['rugaciun','=ruga','=roaga','=rugati','=rugam','=rugat','=rugand','=rugase']],
  ['uomo',['=uomo','=uomini'],['=om','=omul','=omului','=oameni','=oamenii','=oamenilor']],
  ['figlio',['figli'],['=fiu','=fiul','=fiului','=fii','=fiii','=fiilor','=fiica']],
  ['padre',['=padre','=padri'],['=tata','=tatal','=tatalui','=parinte','=parintele','=parintii']],
  ['cielo',['ciel','celest'],['=cer','=cerul','=cerului','=ceruri','=cerurile','=cerurilor','ceresc','cereas']],
  ['terra',['=terra'],['pamant']], ['santo',['sant'],['sfant','sfint']], ['verita',['verit'],['adevar']],
  ['vero',['=vero','=vera','=veri','=vere','veramente'],['adevarat']],
  ['vita',['=vita','=vite'],['viata','vietii','vieti']], ['tempo',['=tempo','=tempi'],['timp','vrem']],
  ['volonta',['volont'],['voint','=voia','=voie']], ['giustizia',['giustizi','giustif'],['neprihan','dreptat']],
  ['pentimento',['pentiment','pentit','pentir','pento','ravved'],['pocai','pocain']],
  ['perdono',['perdon'],['iert']], ['angelo',['angel'],['inger']], ['croce',['=croce'],['cruc']],
  ['sangue',['=sangue'],['sange','sangel']], ['anima',['=anima','=anime'],['suflet']],
  ['mente',['=mente','=menti'],['minte','mintii']], ['opera',['=opera','=opere','=operare'],['lucrar','lucru']],
  ['popolo',['popol'],['popor','popoar']], ['servo',['serv'],['sluj','=rob','=robul','=robii']],
  ['sempre',['=sempre'],['totdeauna','intotdeauna','=mereu']], ['ogni',['=ogni'],['=orice','=fiecare']],
  ['tutto',['=tutto','=tutti','=tutta','=tutte'],['=tot','=toti','=toata','=toate']],
  ['giorno',['=giorno','=giorni'],['=zi','=ziua','=zile','=zilele']], ['oggi',['=oggi'],['=astazi','=azi']],
  ['bene',['=bene'],['=bine']], ['male',['=male'],['=rau','=raul','=rele']], ['gloria',['glori'],['slav']],
  ['regno',['=regno'],['imparati']], ['legge',['legg'],['=lege','=legea','=legii','=legile','=legilor','=legi']],
  ['comandamento',['comandament'],['porunc']], ['bibbia',['bibbi'],['bibli']], ['scrittura',['scrittur'],['scriptur']],
  ['battesimo',['battes','battez'],['botez']], ['obbedienza',['obbed','ubbid'],['ascult','supun']],
  ['morte',['=morte'],['moart']], ['risurrezione',['risurrez','risorg'],['invier','inviat']],
  ['redenzione',['redenz','redent'],['rascump']], ['sacrificio',['sacrific'],['jertf']],
  ['lezione',['lezion'],['lectia','lectii']], ['domanda',['domand'],['intreb']],
  ['risposta',['rispost','rispond'],['raspun']], ['libro',['=libro','=libri'],['cart']],
  ['nome',['=nome','=nomi'],['=nume','=numele','=numelui']], ['casa',['=casa','=case'],['=casa','=casei','=casele']],
  ['fratello',['fratell'],['frat']], ['sorella',['sorell'],['sora','surori']], ['re',['=re','=regina'],['imparat']],
  ['nemico',['nemic'],['vrajmas','dusman']], ['potere',['poter','potent'],['puter']], ['forza',['forz'],['tari','forta']],
  ['gioia',['gioi'],['bucur']], ['pace',['=pace'],['=pace','=pacea','=pacii']], ['speranza',['speran'],['nadejd','speran']],
  ['cuore2',['=cuori'],['=inimi','=inimile','=inimilor']],
  /* i libri della Bibbia e i nomi che nelle due lingue non si somigliano */
  ['salmi',['salm'],['psalm']], ['esodo',['esod'],['exod']], ['giobbe',['=giobbe'],['=iov']],
  ['giudici',['=giudici'],['judecator']], ['atti',['=atti'],['fapte']], ['matteo',['=matteo'],['=matei']],
  ['pietro',['=pietro'],['=petru']], ['giovanni',['=giovanni'],['=ioan']], ['sofonia',['=sofonia'],['tefania']],
  ['aggeo',['=aggeo'],['=hagai']], ['abdia',['=abdia'],['=obadia']], ['michea',['=michea'],['=mica']],
  ['lamentazioni',['lamentaz'],['plangeril']], ['mose',['=mose'],['=moise']], ['abraamo',['abraam','=abramo'],['avraam']],
  ['elia',['=elia'],['=ilie']], ['giuseppe',['=giuseppe'],['=iosif']], ['paolo',['=paolo'],['=pavel']],
  ['egitto',['egitt','egizi'],['egipt']], ['battista',['battist'],['botezator']]
];
const _AL_VOC_IDX={it:[],ro:[]};
_AL_VOC.forEach(([c,it,ro])=>{
  it.forEach(s=>_AL_VOC_IDX.it.push([s,c])); ro.forEach(s=>_AL_VOC_IDX.ro.push([s,c]));
});
['it','ro'].forEach(lg=>_AL_VOC_IDX[lg].sort((a,b)=>b[0].length-a[0].length));
function _concettoAl(f,lg){
  const el=_AL_VOC_IDX[lg]; if(!el) return null;
  for(const [s,c] of el){
    if(s.charCodeAt(0)===61){ if(f===s.slice(1)) return c; }
    else if(f.length>=s.length && f.slice(0,s.length)===s) return c;
  }
  return null;
}
const _AL_GIORNI={
  it:[['domenica','dom'],['lunedi','lun'],['martedi','mar'],['mercoledi','mer'],['giovedi','gio'],['venerdi','ven'],['sabato','sab']],
  ro:[['duminica','dum'],['luni','lun'],['marti','mar'],['miercuri','mie'],['joi','joi'],['vineri','vin'],['sambata','sam']]
};
function _giornoAl(f,lg){
  const g=_AL_GIORNI[lg]||_AL_GIORNI.it;
  for(let k=0;k<7;k++) if(f===g[k][0]||f===g[k][1]) return k;
  return -1;
}
function _levAl(a,b){
  const m=a.length, n=b.length; if(!m) return n; if(!n) return m;
  let pr=[], cu=[];
  for(let j=0;j<=n;j++) pr[j]=j;
  for(let i=1;i<=m;i++){
    cu[0]=i; const ca=a.charCodeAt(i-1);
    for(let j=1;j<=n;j++) cu[j]=Math.min(pr[j]+1,cu[j-1]+1,pr[j-1]+(ca===b.charCodeAt(j-1)?0:1));
    const t=pr; pr=cu; cu=t;
  }
  return pr[n];
}
/* Le «parole vere» di una lezione, fatte a pezzetti come le vede il segno:
   un pezzo che è solo punteggiatura («,» «:» «—») va con la parola prima,
   una parola spezzata dall'a capo («battez- / zate», «Dumne - / zeu») torna
   intera. Ogni pezzetto dà uno o più segnali da confrontare con l'altra
   lingua, e ognuno sa a quale parola del lezionario appartiene. */
function _segnaliAl(W,F,lg){
  const N=W.length, out=[];
  let i=0, pos=0;
  const it=lg!=='ro';
  const log=[];
  while(i<N){
    if(F.charCodeAt(i)-48 & _AF_FUORI){ i++; continue; }
    let i0=i, testo=W[i]||'';
    /* ricucio l'a capo: «parola-» a fine riga + parola dopo, oppure «-» da solo */
    let j=i;
    for(;;){
      const fr=(F.charCodeAt(j)-48)&_AF_RIGA;
      const t=W[j]||'';
      if(j+1<N && fr && /[A-Za-z\u00C0-\u024F][-\u2010\u00AD]$/.test(t) && /^[a-z\u00DF-\u024F]/.test(W[j+1]||'')){
        testo=testo.replace(/[-\u2010\u00AD]$/,'')+W[j+1]; j++; continue; }
      if(j+2<N && /^[-\u2010\u00AD]$/.test(W[j+1]||'') && ((F.charCodeAt(j+1)-48)&_AF_RIGA) && /^[a-z\u00DF-\u024F]/.test(W[j+2]||'')){
        testo=testo+W[j+2]; j+=2; continue; }
      break;
    }
    /* i pezzi fatti solo di segni vanno con la parola prima (ma ognuno
       ricorda da quale pezzo viene: il bordo è dopo QUEL pezzo) */
    const nucleoFine=j;
    const pezzi=[[j,testo]];
    while(j+1<N && _AL_SOLO_SEGNI.test(W[j+1]||'') && !/^[“"„«‘(\[]+$/.test(W[j+1]||'') && !((F.charCodeAt(j+1)-48)&_AF_CAPO)){
      testo+=W[j+1]; j++; pezzi.push([j,W[j]]); }
    const i1=j;
    log.push({i0,i1,nucleoFine,pezzi,testo,pos});
    i=j+1; pos++;
  }
  /* i segnali */
  const P=log.length;
  log.forEach((q,k)=>{
    const t=q.testo, capo=_capoAl(W,F,q.i0);
    const testa=(t.match(_AL_TESTA)||[''])[0], coda=(t.match(_AL_CODA)||[''])[0];
    const nucleo=t.slice(testa.length, t.length-coda.length);
    /* prima della parola: inizio di capoverso e/o virgolette che si aprono */
    const virg=/[“"„«‘]/.test(testa);
    if(capo||virg) out.push({k:'a',capo:!!capo,virg,pos:q.pos,b:q.i0});
    if(nucleo){
      if(/\d/.test(nucleo)){
        const cif=nucleo.match(/\d+/g).join('.');
        const w = cif.indexOf('.')>0 ? 7 : (cif.length>=2 ? 5 : 2.5);
        out.push({k:'n',s:cif,w,pos:q.pos,b0:q.i0,b1:q.nucleoFine+1});
      } else {
        const pezzi=_nrmAl(nucleo).split(/[’'`\-\u2010\u00AD]+/).map(x=>x.replace(/[^a-z]/g,'')).filter(Boolean);
        let f='';
        if(pezzi.length){
          if(it && /[’'`]/.test(nucleo)) f=pezzi[pezzi.length-1];
          else f=pezzi.reduce((m,x)=>x.length>m.length?x:m,'');
        }
        /* le lettere delle domande: «a.» «b.» all'inizio di un capoverso */
        const primaFinisce = k>0 && _fineFraseAl(log[k-1].testo);
        if(f.length===1 && (capo||primaFinisce) && /^[.)]/.test(coda)) out.push({k:'l',s:f,w:3,pos:q.pos,b0:q.i0,b1:q.nucleoFine+1});
        else if(f.length>=3 || (f.length===2 && _giornoAl(f,lg)>=0)){
          /* il giorno della settimana seguito dalla data: «Dom, 12 Lug» — «DUMINICĂ, 12 IULIE» */
          const g=_giornoAl(f,lg);
          const dopo=log[k+1]?log[k+1].testo:'';
          if(g>=0 && /^\d{1,2}\b/.test(dopo)) out.push({k:'g',s:String(g),w:8,pos:q.pos,b0:q.i0,b1:q.nucleoFine+1});
          else if(!_AL_FALSE.has(f)){
            let f2='';
            if(it && /^gi[aeiou]/.test(f)) f2=f.slice(1);
            else if(it && /^ge/.test(f) && /^[A-Z]/.test(nucleo)) f2='i'+f.slice(1);
            else if(!it && /^hr/.test(f)) f2='c'+f.slice(1);
            out.push({k:'w',f,f2,c:_concettoAl(f,lg),pos:q.pos,b0:q.i0,b1:q.nucleoFine+1});
          }
        }
      }
    }
    if(coda){
      const m = /\?/.test(coda)?'?' : /!/.test(coda)?'!' : /[.…]/.test(coda)?'.' : /:/.test(coda)?':' : /;/.test(coda)?';' : /,/.test(coda)?',' : '';
      /* la fine vera di una frase conta molto: le due traduzioni vanno quasi
         sempre frase per frase (non «p.» o «cap.», che sono abbreviazioni) */
      const peso={'?':3.2,'!':3.2,'.':(_fineFraseAl(t.replace(/[\s\u2014\u2013-]+$/,''))?3.2:0.8),':':0.8,';':0.8,',':0.5}[m];
      /* il bordo è subito dopo il pezzo che porta quel segno */
      const dopoIl=rx=>{ for(const [ix,tx] of q.pezzi) if(rx.test(tx.slice(ix===q.nucleoFine?tx.length-(tx.match(_AL_CODA)||[''])[0].length:0))) return ix+1; return q.i1+1; };
      /* dopo la parola: UN segnale solo per il segno più forte e le
         virgolette che si chiudono (se fossero due, l'ordine «.”» o «”.»
         cambierebbe da una lingua all'altra e si ostacolerebbero) */
      const chiude=/[”"»’]/.test(coda);
      if(m||chiude) out.push({k:'p',s:m,w:m?peso:0,q:chiude,pos:q.pos,
        b:m?dopoIl(m==='.'?/[.…]/:new RegExp('\\'+m)):dopoIl(/[”"»’]/)});
    }
  });
  return {seg:out, P};
}
function _pesoAl(s,t){
  if(s.k!==t.k) return 0;
  if(s.k==='a') return (s.capo&&t.capo?1:0)+(s.virg&&t.virg?0.9:0);
  if(s.k==='p'){
    let v=0;
    if(s.s && s.s===t.s) v=s.w;
    /* una traduzione chiude la frase col punto, l'altra col punto esclamativo */
    else if(((s.s==='.'&&t.s==='!')||(s.s==='!'&&t.s==='.')) && s.w>1 && t.w>1) v=2.4;
    /* «A; B» in una lingua e «A. B» nell'altra */
    else if(((s.s===';'||s.s===':')&&t.s==='.'&&t.w>1) || ((t.s===';'||t.s===':')&&s.s==='.'&&s.w>1)) v=1;
    if(s.q && t.q) v+=0.9;
    return v;
  }
  if(s.k==='g'||s.k==='l') return s.s===t.s ? s.w : 0;
  if(s.k==='n'){
    if(s.s===t.s) return s.w;
    /* «28:16, 17» contro «28:16-17»: basta che cominci uguale */
    if(s.s.indexOf('.')>0 && t.s.indexOf('.')>0){
      const a=s.s+'.', b=t.s+'.';
      if(a.indexOf(b)===0 || b.indexOf(a)===0) return 4;
    }
    return 0;
  }
  if(s.c && s.c===t.c) return 3;
  let best=0;
  const A=s.f2?[s.f,s.f2]:[s.f], B=t.f2?[t.f,t.f2]:[t.f];
  for(const a of A) for(const b of B){
    if(a.charCodeAt(0)!==b.charCodeAt(0)) continue;
    let v=0;
    if(a===b) v=a.length>=5?4:3;
    else {
      const L=Math.min(a.length,b.length), r=L/Math.max(a.length,b.length);
      if(L>=4){
        let p=0; while(p<L && a.charCodeAt(p)===b.charCodeAt(p)) p++;
        /* «primogenitura» e «primit» cominciano uguale ma non c'entrano:
           le parole sorelle hanno anche più o meno la stessa lunghezza */
        if(p>=5 && r>=0.45) v=3; else if(p>=4 && r>=0.6) v=2.2;
        else if(L>=5 && r>=0.6 && _levAl(a.slice(0,6),b.slice(0,6))<=1) v=2;
      }
    }
    if(v>best) best=v;
  }
  return best;
}
/* i segnali che fanno da guida al primo giro (la punteggiatura normale no:
   è troppo fitta per non confondersi) */
function _forteAl(s){
  return (s.k==='n'&&s.w>=4) || s.k==='g' || s.k==='l' || (s.k==='p'&&s.s==='?') || (s.k==='w'&&s.f.length>=5&&!s.c);
}
/* la catena più pesante di coppie in ordine (in tutte e due le lingue) */
function _catenaAl(cand,nT){
  cand.sort((x,y)=>x.a-y.a || y.b-x.b);
  const fv=new Float64Array(nT+2), fi=new Int32Array(nT+2).fill(-1);
  const best=new Float64Array(cand.length), prev=new Int32Array(cand.length);
  let top=-1, topv=0;
  for(let c=0;c<cand.length;c++){
    const b=cand[c].b;
    let v=0, vi=-1;
    for(let i=b;i>0;i-=i&-i) if(fv[i]>v){ v=fv[i]; vi=fi[i]; }
    best[c]=v+cand[c].w; prev[c]=vi;
    for(let i=b+1;i<=nT+1;i+=i&-i) if(best[c]>fv[i]){ fv[i]=best[c]; fi[i]=c; }
    if(best[c]>topv){ topv=best[c]; top=c; }
  }
  const out=[]; for(let c=top;c>=0;c=prev[c]) out.push(cand[c]);
  return out.reverse();
}
/* le coppie possibili, soltanto vicino a dove la guida dice che dovrebbero stare */
function _coppieAl(S,T,PS,PT,guida,banda,filtro){
  const cand=[];
  const tPos=T.map(t=>t.pos);
  for(let a=0;a<S.length;a++){
    const s=S[a]; if(filtro && !filtro(s)) continue;
    const c=guida(s.pos);
    let lo=0, hi=T.length;
    const da=c-banda, fino=c+banda;
    while(lo<hi){ const m=(lo+hi)>>1; if(tPos[m]<da) lo=m+1; else hi=m; }
    for(let b=lo;b<T.length && tPos[b]<=fino;b++){
      const t=T[b]; if(filtro && !filtro(t)) continue;
      const w=_pesoAl(s,t); if(!w) continue;
      const d=Math.abs(t.pos-c)/banda;
      cand.push({a,b,w:w*(1-0.6*d*d)});
    }
  }
  return cand;
}
function _guidaDa(punti,PS,PT){
  const X=[0], Y=[0];
  punti.forEach(q=>{ if(q[0]>X[X.length-1] && q[1]>Y[Y.length-1] && q[0]<PS && q[1]<PT){ X.push(q[0]); Y.push(q[1]); } });
  X.push(PS); Y.push(Math.max(PT,Y[Y.length-1]+1e-6));
  return x=>{
    let lo=0, hi=X.length-1;
    if(x<=0) return 0; if(x>=PS) return Y[Y.length-1];
    while(hi-lo>1){ const m=(lo+hi)>>1; if(X[m]<=x) lo=m; else hi=m; }
    return Y[lo]+(x-X[lo])*(Y[hi]-Y[lo])/Math.max(1e-9,X[hi]-X[lo]);
  };
}
/* Allinea le parole WS (lingua lgS) con WT (lingua lgT). Torna una funzione
   che porta un «bordo» di parola (0 = prima della prima parola, N = dopo
   l'ultima) da una lingua all'altra. */
function allineaParole(WS,FS,lgS,WT,FT,lgT){
  const A=_segnaliAl(WS,FS,lgS), B=_segnaliAl(WT,FT,lgT);
  const S=A.seg, T=B.seg, PS=Math.max(1,A.P), PT=Math.max(1,B.P);
  /* 1) i punti sicuri, con una banda larga intorno alla diagonale */
  const diag=x=>x*PT/PS;
  const c1=_catenaAl(_coppieAl(S,T,PS,PT,diag,Math.max(40,0.25*PT),_forteAl),T.length);
  const guida1=_guidaDa(c1.map(c=>[S[c.a].pos,T[c.b].pos]),PS,PT);
  /* 2) tutto il resto, stretto intorno alla guida */
  const fitti=c1.length/Math.max(1,PS/1000);
  const banda2 = fitti>=5 ? Math.max(30,0.05*PT) : Math.max(60,0.12*PT);
  let c2=_catenaAl(_coppieAl(S,T,PS,PT,guida1,banda2,null),T.length);
  /* 3) tolgo i punti deboli che fanno uno scalino rispetto ai vicini */
  c2=c2.filter((c,k)=>{
    if(c.w>=2.5 || k===0 || k===c2.length-1) return true;
    const p=c2[k-1], n=c2[k+1];
    const xs=S[c.a].pos, xp=S[p.a].pos, xn=S[n.a].pos, yp=T[p.b].pos, yn=T[n.b].pos;
    const atteso=yp+(xs-xp)*(yn-yp)/Math.max(1,xn-xp);
    return Math.abs(T[c.b].pos-atteso) <= Math.max(8,0.5*(yn-yp));
  });
  /* 4) da coppie di segnali a coppie di «bordi» di parola */
  const pt=[];
  c2.forEach(c=>{
    const s=S[c.a], t=T[c.b];
    if(s.k==='p'||s.k==='a'){ pt.push([s.b,t.b]); }
    else { pt.push([s.b0,t.b0]); pt.push([s.b1,t.b1]); }
  });
  pt.sort((x,y)=>x[0]-y[0] || x[1]-y[1]);
  /* Uno stesso bordo può corrispondere a un TRATTO dell'altra lingua, quando
     lì c'è qualcosa in più (per esempio «(cap. 18)» dopo il riferimento):
     per ogni bordo tengo il primo e l'ultimo posto. Un segno che COMINCIA
     lì parte dopo il pezzo in più, uno che FINISCE lì si ferma prima. */
  const NS=WS.length, NT=WT.length;
  const X=[0], Y0=[0], Y1=[0];
  pt.forEach(q=>{
    const x=q[0], y=q[1];
    if(x<=0 || x>=NS || y<=0 || y>=NT) return;
    const u=X.length-1;
    if(x===X[u]){ if(y>=Y0[u]) Y1[u]=Math.max(Y1[u],y); return; }
    if(y<Y1[u]) return;
    X.push(x); Y0.push(y); Y1.push(y);
  });
  X.push(NS); Y0.push(NT); Y1.push(NT);
  /* il tratto dell'altra lingua che corrisponde al bordo x: [primo, ultimo]
     se x è un punto sicuro, altrimenti la proporzione fra i due vicini */
  const f=x=>{
    let lo=0, hi=X.length-1;
    if(x>=X[hi]) return {k:hi,y0:Y0[hi],y1:Y1[hi]};
    while(hi-lo>1){ const m=(lo+hi)>>1; if(X[m]<=x) lo=m; else hi=m; }
    if(X[lo]===x) return {k:lo,y0:Y0[lo],y1:Y1[lo]};
    const y=Y1[lo]+(x-X[lo])*(Y0[hi]-Y1[lo])/Math.max(1e-9,X[hi]-X[lo]);
    return {k:-1,y0:y,y1:y,da:Y1[lo],a:Y0[hi]};
  };
  f.X=X; f.Y0=Y0; f.Y1=Y1;
  f.punti=X.length; f.catena=c2.length; f.forti=c1.length;
  return f;
}
/* ---------- i bordi, sui segni giusti ---------- */
const _AL_ABBR=/^(p|pp|cap|capp|vol|cfr|ecc|ed|nr|n|v|vv|sec|sect|secț|secţ|art|pag|ss|fig|cc|ca|ibid|op|cit|lett|es)\.$/i;
function _fineFraseAl(t){
  t=String(t||'');
  if(!/[.!?…]["'”»’)\]]*$/.test(t)) return false;
  return !_AL_ABBR.test(t.replace(/^[(\[“"„«]+/,''));
}
function _fineIncisoAl(t){ return /[,;:—–]["'”»’)\]]*$/.test(String(t||'')) || /^[—–]$/.test(String(t||'')); }
function _fuoriAl(F,j){ return ((F.charCodeAt(j)-48)&_AF_FUORI)!==0; }
/* la parola vera prima (o dopo) di j, saltando testate, piè di pagina e
   pezzetti di sola punteggiatura */
function _primaAl(W,F,j){ let k=j-1; while(k>=0 && (_fuoriAl(F,k) || (_AL_SOLO_SEGNI.test(W[k]||'') && !/[.!?…]/.test(W[k])))) k--; return k; }
function _dopoAl(W,F,j){ let k=j+1; while(k<W.length && _fuoriAl(F,k)) k++; return k; }
/* un capoverso vero non comincia mai con la lettera minuscola: se succede
   è solo l'a capo di una parola spezzata («consacra- / rea») */
function _capoAl(W,F,j){ return ((F.charCodeAt(j)-48)&_AF_CAPO)!==0 && !/^[a-z\u00DF-\u024F]/.test(W[j]||''); }
function _inizioFraseAl(W,F,j){
  if(j<=0) return true;
  if(_capoAl(W,F,j)) return true;
  if(/^[“"„«]/.test(W[j]||'')) return true;
  /* «(Luca 18:11, 13).» dopo una citazione è il riferimento di quella
     frase, non l'inizio di una frase nuova */
  if(/^\(/.test(W[j]||'')){
    let t=''; for(let k=j;k<W.length && k<j+6;k++){ t+=W[k]+' '; if(/\)/.test(W[k])) break; }
    if(/\d/.test(t)) return false;
  }
  const k=_primaAl(W,F,j);
  return k<0 || _fineFraseAl(W[k]) || (/[.!?…]/.test(W[k]||'') && _AL_SOLO_SEGNI.test(W[k]||''));
}
function _inizioIncisoAl(W,F,j){ if(j<=0) return true; const k=_primaAl(W,F,j); return (k>=0 && _fineIncisoAl(W[k])) || _inizioFraseAl(W,F,j); }
function _fineFraseParola(W,F,j){ const k=_dopoAl(W,F,j); return _fineFraseAl(W[j]) || k>=W.length || (_capoAl(W,F,k) && !/[-\u2010\u00AD]$/.test(W[j]||'')); }
function _fineIncisoParola(W,F,j){ const k=_dopoAl(W,F,j); return _fineIncisoAl(W[j]) || _fineFraseParola(W,F,j) ||
  (k<W.length && /^[,;:—–]$/.test(W[k]||'')); }
function _veraAl(t){ return !_AL_SOLO_SEGNI.test(String(t||'')); }
/* da [iF..iL] (parole della prima lingua) a [jF..jL] nell'altra; null se
   nell'altra lingua quelle parole non ci sono proprio (un versetto saltato) */
function portaTratto(f,WS,FS,WT,FT,iF,iL){
  const NT=WT.length; if(!NT) return null;
  const fuori=j=>_fuoriAl(FT,j), ok=j=>j>=0 && j<NT && !fuori(j);
  const X=f.X, Y0=f.Y0, Y1=f.Y1;
  const sIF=_inizioFraseAl(WS,FS,iF), sII=!sIF && _inizioIncisoAl(WS,FS,iF);
  const sFF=_fineFraseParola(WS,FS,iL), sFI=!sFF && _fineIncisoParola(WS,FS,iL);
  /* se nell'altra lingua la frase è divisa in un altro modo («A; ma B»
     invece di «A. B»), dopo l'inizio di frase provo l'inizio di inciso */
  const iniF=x=>ok(x)&&_veraAl(WT[x])&&_inizioFraseAl(WT,FT,x);
  const iniI=x=>ok(x)&&_veraAl(WT[x])&&_inizioIncisoAl(WT,FT,x);
  const finF=x=>ok(x)&&_fineFraseParola(WT,FT,x);
  const finI=x=>ok(x)&&_fineIncisoParola(WT,FT,x);
  const proveI = sIF ? [[iniF,4],[iniI,3]] : sII ? [[iniI,3]] : [];
  const proveF = sFF ? [[finF,4],[finI,3]] : sFI ? [[finI,3]] : [];
  /* su un punto sicuro, un inciso (virgola) si ferma solo su un'altra
     virgola: «giustificato,» → «neprihănit», non fino al punto dopo */
  const iniV=x=>{ if(!ok(x)||!_veraAl(WT[x])) return false; const k=_primaAl(WT,FT,x); return k>=0 && _fineIncisoAl(WT[k]); };
  const finV=x=>{ if(!ok(x)) return false; const k=_dopoAl(WT,FT,x); return _fineIncisoAl(WT[x]) || (k<NT && /^[,;:\u2014\u2013]$/.test(WT[k]||'')); };
  const proveIs = sII ? [[iniV,3]] : proveI, proveFs = sFI ? [[finV,3]] : proveF;
  /* l'inizio: su un punto sicuro parte dopo quello che l'altra lingua ha
     in più, a meno che la frase cominci già dentro a quel pezzo in più
     («Prin contemplare» per «Contemplando»); fra due punti sicuri va in
     proporzione e poi cerca lì vicino l'inizio della frase o dell'inciso,
     senza mai scavalcare un punto sicuro */
  /* il segno giusto più vicino, dentro allo spazio fra i due punti sicuri */
  const vicino=(j0,prove,giu,su,avanti)=>{
    for(const [prova,raggio] of prove){
      if(prova(j0)) return j0;
      for(let d=1;d<=raggio;d++){
        const x1=avanti?j0+d:j0-d, x2=avanti?j0-d:j0+d;
        if(x1>=giu && x1<=su && prova(x1)) return x1;
        if(x2>=giu && x2<=su && prova(x2)) return x2;
      }
    }
    return j0;
  };
  /* dentro al pezzo che l'altra lingua ha in più: il primo (o l'ultimo) segno buono */
  const nelPezzo=(da,a,passo,prove)=>{
    for(const [prova] of prove) for(let x=da; passo>0?x<=a:x>=a; x+=passo) if(prova(x)) return x;
    return -1;
  };
  let jF;
  const a=f(iF);
  if(a.k>=0){
    jF=a.y1;
    if(proveI.length && !proveI[0][0](jF) && !(sII && iniV(jF))){
      if(a.y0<a.y1){ const x=nelPezzo(jF,a.y0,-1,proveI); if(x>=0) jF=x; }
      else jF=vicino(jF,proveIs, a.k>0?Y1[a.k-1]:0, a.k+1<X.length?Y0[a.k+1]-1:NT-1, false);
    }
  } else {
    jF=Math.round(a.y0);
    if(proveI.length) jF=vicino(jF,proveI,a.da,a.a-1,false);
  }
  /* la fine, allo stesso modo ma verso destra */
  let jL;
  const z=f(iL+1);
  if(z.k>=0){
    jL=z.y0-1;
    if(proveF.length && !proveF[0][0](jL) && !(sFI && finV(jL))){
      if(z.y0<z.y1){ const x=nelPezzo(jL,z.y1-1,1,proveF); if(x>=0) jL=x; }
      else jL=vicino(jL,proveFs, z.k>0?Y1[z.k-1]-1:0, z.k+1<X.length?Y0[z.k+1]-1:NT-1, true);
    }
  } else {
    jL=Math.round(z.y0)-1;
    if(proveF.length) jL=vicino(jL,proveF,z.da-1,z.a-1,true);
  }
  jF=Math.max(0,Math.min(NT-1,jF)); jL=Math.max(0,Math.min(NT-1,jL));
  /* niente bordi su una testata o un piè di pagina, su un pezzetto di
     punteggiatura o a metà di una parola spezzata dall'a capo */
  while(jF<NT-1 && (fuori(jF) || !_veraAl(WT[jF]))) jF++;
  while(jL>0 && fuori(jL)) jL--;
  const riga=j=>((FT.charCodeAt(j)-48)&_AF_RIGA)!==0, minuscola=j=>/^[a-z]/.test(_nrmAl(WT[j]));
  for(;;){
    if(jF>0 && riga(jF-1) && /[A-Za-z\u00C0-\u024F][-\u2010\u00AD]$/.test(WT[jF-1]||'') && minuscola(jF)){ jF--; continue; }
    if(jF>1 && riga(jF-1) && /^[-\u2010\u00AD]$/.test(WT[jF-1]||'') && minuscola(jF)){ jF-=2; continue; }
    break;
  }
  while(jL+1<NT && !fuori(jL+1) && (/[-\u2010\u00AD]$/.test(WT[jL]||'') || /^[,;:.!?”"»’)\]]+$/.test(WT[jL+1]||''))) jL++;
  /* dall'altra parte non c'è niente (per esempio un versetto che una
     traduzione salta): meglio non segnare che segnare a caso */
  let quanteS=0, quanteT=0;
  for(let i=iF;i<=iL;i++) if(!_fuoriAl(FS,i) && _veraAl(WS[i])) quanteS++;
  for(let j=jF;j<=jL;j++) if(!fuori(j) && _veraAl(WT[j])) quanteT++;
  if(quanteS>=6 && quanteT<quanteS*0.25) return null;
  if(jL<jF){ if(quanteS>=3) return null; jL=jF; }
  return [jF,jL];
}

/* le pagine di una lezione */
function pagineLezione(l,lez){
  const ult=l.pagine||lez.pag;
  const fine=Math.min(lez.fine||(ult+1), ult+1);
  const out=[]; for(let p=lez.pag;p<fine;p++) out.push(p);
  return out.length?out:[lez.pag];
}
/* tutte le parole della lezione, nell'ordine di lettura, con il posto dove
   stanno e un segnalino per ognuna (inizio capoverso, fine riga, testata o
   piè di pagina che si ripete su ogni foglio): servono le righe già lette */
function paroleLezione(l,lez){
  const pagine=pagineLezione(l,lez), dentro={};
  pagine.forEach(p=>dentro[p]=1);
  const W=[], G=[], capo={}, fatte={};
  pagine.forEach(p=>{
    if(fatte[p]) return;
    const r=paragrafiGiorno(p);
    r.pagine.forEach(x=>fatte[x]=1);
    r.par.forEach(q=>{
      let primo=true;
      q.parole.forEach(w=>{
        if(!dentro[w.pag]) return;
        if(primo){ capo[W.length]=1; primo=false; }
        W.push(w.t); G.push({pag:w.pag,x:w.x,y:w.y,w:w.w,h:w.h});
      });
    });
  });
  const N=W.length, bit=new Array(N).fill(0);
  const stessaRiga=(a,b)=>a.pag===b.pag && Math.abs(a.y-b.y)<=0.5*Math.max(a.h,b.h);
  for(let i=0;i<N;i++){
    if(capo[i]) bit[i]|=_AF_CAPO;
    if(i===N-1 || !stessaRiga(G[i],G[i+1])) bit[i]|=_AF_RIGA;
  }
  /* testate e piè di pagina: la stessa riga (senza i numeri) su più fogli,
     in cima o in fondo */
  const righe=[]; let da=0;
  for(let i=0;i<N;i++) if(bit[i]&_AF_RIGA){ righe.push([da,i]); da=i+1; }
  const chiave=r=>_nrmAl(W.slice(r[0],r[1]+1).join(' ')).replace(/[^a-z]/g,'');
  const quante={};
  righe.forEach(r=>{ const k=chiave(r); if(!k) return; (quante[k]=quante[k]||{})[G[r[0]].pag]=1; });
  righe.forEach(r=>{
    const k=chiave(r), y=G[r[0]].y, bordo=(y<0.1 || y>0.88);
    /* il numero di pagina da solo, in cima o in fondo */
    const numero=!k && /^\d+$/.test(W.slice(r[0],r[1]+1).join(''));
    if(bordo && ((k && Object.keys(quante[k]).length>=2) || numero))
      for(let i=r[0];i<=r[1];i++) bit[i]|=_AF_FUORI;
  });
  return {W, G, F:bit.map(b=>String.fromCharCode(48+b)).join('')};
}

/* ================= COPIA E INCOLLA DEGLI APPUNTI =================
   «Copia appunti» prende TUTTI gli appunti di una lezione — evidenziato,
   sottolineato, penna e scritte — insieme alle parole di quella lezione
   così come stanno sulle pagine. «Incolla appunti», nel lezionario
   dell'altra lingua, allinea le due lezioni parola per parola (vedi
   allineaParole qui sopra) e rimette ogni segno sulle STESSE parole:
   l'evidenziato e il sottolineato proprio su quelle parole, la penna e le
   scritte accanto alla stessa riga di testo. Quello che hai copiato resta
   in archivio anche se chiudi il programma, finché non copi un'altra
   lezione. Ogni segno incollato è una copia tutta sua (con il suo `dl`),
   che si vede solo nel lezionario dove l'hai incollata. */
let _copiaAppunti=null;
async function leggiCopiaAppunti(){
  if(_copiaAppunti) return _copiaAppunti;
  try{ _copiaAppunti=(await kvGet('copia:appunti'))||null; }catch(e){ _copiaAppunti=null; }
  return _copiaAppunti;
}
/* le righe di tutte le pagine della lezione, lette dal PDF anche se non
   sono ancora disegnate */
async function caricaRigheLezione(l,lez){
  for(const p of pagineLezione(l,lez)){ try{ await righeDi(p); }catch(e){} }
}
function lezioneDellaPagina(l,pag){ return (l.lezioni||[]).filter(x=>x.pag<=pag).pop()||null; }
/* le parole su cui sta un segno: quelle col centro dentro ai suoi rettangoli */
function _paroleSotto(D,n,rr){
  const out=[];
  D.G.forEach((g,i)=>{
    if(g.pag!==n || _fuoriAl(D.F,i)) return;
    const cx=g.x+g.w/2, cy=g.y+g.h/2;
    if(rr.some(r=>cx>=r[0]-0.004 && cx<=r[0]+r[2]+0.004 && cy>=r[1]-0.004 && cy<=r[1]+r[3]+0.004)) out.push(i);
  });
  return out;
}
/* un tratto di penna sopra le parole (un cerchio, una parola cancellata)
   o una riga tirata a mano subito sotto: le parole che tocca */
function _paroleDellaPenna(D,n,p){
  const b=riquadroDi(p)[0]; if(!b) return [];
  const x0=b[0], y0=b[1], x1=b[0]+b[2], y1=b[1]+b[3];
  const out=[];
  D.G.forEach((g,i)=>{
    if(g.pag!==n || _fuoriAl(D.F,i)) return;
    const cx=g.x+g.w/2, cy=g.y+g.h/2;
    if(cx>=x0 && cx<=x1 && cy>=y0 && cy<=y1) out.push(i);
  });
  if(out.length || b[3]>=0.02) return out;
  D.G.forEach((g,i)=>{
    if(g.pag!==n || _fuoriAl(D.F,i)) return;
    const cx=g.x+g.w/2, fondo=g.y+g.h;
    if(cx>=x0 && cx<=x1 && y0>=fondo-0.006 && y0<=fondo+0.02) out.push(i);
  });
  return out;
}
/* la riga di testo a cui si appoggia un segno che non sta sulle parole
   (una scritta sulle righe vuote della risposta, una nota a margine):
   l'ultima parola della riga più vicina sopra di lui, o alla sua altezza */
function _rigaSopra(D,n,y){
  let yMax=-1, h=0.012;
  D.G.forEach((g,i)=>{ if(g.pag===n && !_fuoriAl(D.F,i) && g.y<=y+0.004 && g.y>yMax){ yMax=g.y; h=g.h; } });
  if(yMax<0){
    /* sopra non c'è testo: mi appoggio alla prima parola della pagina */
    let i0=-1;
    D.G.forEach((g,i)=>{ if(i0<0 && g.pag===n && !_fuoriAl(D.F,i)) i0=i; });
    return i0<0 ? null : {i:i0, y:D.G[i0].y};
  }
  let ult=-1;
  D.G.forEach((g,i)=>{ if(g.pag===n && !_fuoriAl(D.F,i) && Math.abs(g.y-yMax)<=0.5*h) ult=i; });
  return {i:ult, y:D.G[ult].y};
}
/* quanti appunti ha una lezione in questo lezionario (per l'elenco) */
function contaAppuntiLezione(l,lez){
  const visti=new Set(), dentro={};
  const pagine=pagineLezione(l,lez);
  pagine.forEach(p=>dentro[p]=1);
  pagine.forEach(p=>noteDi(p,l).forEach(a=>{
    if(!a || visti.has(a) || (a.dl && a.dl!==l.i)) return;
    if(a.dl && a.pg!=null && !dentro[a.pg]) return;
    visti.add(a);
  }));
  return visti.size;
}
/* Tutto quello che serve per incollare altrove: le parole della lezione e,
   per ogni segno, su quali parole sta (o a quale riga si appoggia). */
function preparaCopiaAppunti(l,lez){
  const D=paroleLezione(l,lez);
  const pagine=pagineLezione(l,lez), visti=new Set(), segni=[], pezziDi=new Map();
  pagine.forEach(n=>{
    noteDi(n,l).forEach(a=>{
      if(!a || !segnoQui(a)) return;
      const base={t:a.t, c:a.c, id:(a.id=a.id||uid()), orig:a.da||''};
      if(a.o!=null) base.o=a.o;
      if(a.s!=null) base.s=a.s;
      /* i segni vecchissimi, senza lezionario d'origine: ricordo anche dove
         stanno qui, così dopo l'incolla restano solo in questa edizione */
      if(!a.dl) base.nSrc=n;
      if(a.t==='evid'||a.t==='sott'){
        if(a.pg==null && !a.an && visti.has(a)) return;
        const rr=rettDi(a,n); if(!rr||!rr.length) return;
        visti.add(a);
        pezziDi.set(a,(pezziDi.get(a)||0)+1);
        if(!a.dl) base.rrSrc=rr.map(r=>r.slice());
        const sotto=_paroleSotto(D,n,rr);
        if(sotto.length){ segni.push(Object.assign(base,{come:'parole',iF:sotto[0],iL:sotto[sotto.length-1]})); return; }
        const y0=Math.min.apply(null,rr.map(r=>r[1]));
        const rif=_rigaSopra(D,n,y0); if(!rif) return;
        segni.push(Object.assign(base,{come:'riga',r:rif.i,rr:rr.map(r=>[r[0],r[1]-rif.y,r[2],r[3]])}));
        return;
      }
      if(visti.has(a) || !paginaDelSegno(a,n)) return;
      visti.add(a);
      if(a.t==='penna'){
        if(!a.p || !a.p.length) return;
        const sotto=_paroleDellaPenna(D,n,a.p);
        if(sotto.length){
          const g=D.G[sotto[0]];
          segni.push(Object.assign(base,{come:'sopra',r:sotto[0],p:a.p.map(q=>[q[0]-g.x,q[1]-g.y])}));
          return;
        }
        const rif=_rigaSopra(D,n,riquadroDi(a.p)[0][1]); if(!rif) return;
        segni.push(Object.assign(base,{come:'riga',r:rif.i,p:a.p.map(q=>[q[0],q[1]-rif.y])}));
        return;
      }
      if(a.t==='testo'){
        const rif=_rigaSopra(D,n,a.y); if(!rif) return;
        const g=D.G[rif.i], dopo=a.x-(g.x+g.w);
        /* una scritta messa in fondo alla riga resta in fondo alla riga
           anche se nell'altra lingua quella riga finisce più in là */
        segni.push(Object.assign(base,{come:'riga',r:rif.i,dy:a.y-rif.y,w:a.w||0.42,txt:a.txt||'',f:a.f||'serif'},
          dopo>0?{dx:dopo}:{x:a.x}));
      }
    });
  });
  /* un segno vecchio spezzato su due pagine non lo tocco dopo l'incolla */
  segni.forEach(s=>{ if(s.nSrc!=null){ const a=[...pezziDi.keys()].find(x=>x.id===s.id); if(a && pezziDi.get(a)>1) s.nSrc=null; } });
  return {v:1, quando:new Date().toISOString(), da:{i:l.i, lg:l.lg||'it', titolo:l.titolo||''},
          lez:{n:lez.n, tit:lez.tit||'', data:lez.data||''}, W:D.W, F:D.F, segni};
}
/* la parola dell'altra lingua che corrisponde alla parola i */
function _parolaCorrispondente(f,D,i){
  const N=D.W.length; if(!N) return -1;
  const a=f(i), b=f(i+1);
  const s0=a.k>=0?a.y1:a.y0, s1=b.y0;
  let j = s1>s0 ? Math.floor((s0+s1)/2) : Math.round(s0);
  j=Math.max(0,Math.min(N-1,j));
  for(let d=0;d<N;d++){
    if(j+d<N && !_fuoriAl(D.F,j+d)) return j+d;
    if(j-d>=0 && !_fuoriAl(D.F,j-d)) return j-d;
  }
  return j;
}
/* i rettangoli sopra le parole [jF..jL], pagina per pagina e riga per riga,
   fatti come quelli che disegna il dito (vedi rettangoliSelezione) */
function _rettangoliParole(D,jF,jL){
  const perPag={};
  for(let j=jF;j<=jL;j++){
    if(_fuoriAl(D.F,j)) continue;
    const g=D.G[j], el=(perPag[g.pag]=perPag[g.pag]||[]), u=el[el.length-1];
    if(u && Math.abs(u.y-g.y)<=0.5*Math.max(u.h,g.h)){
      u.x0=Math.min(u.x0,g.x); u.x1=Math.max(u.x1,g.x+g.w); u.y0=Math.min(u.y0,g.y); u.y1=Math.max(u.y1,g.y+g.h);
    } else el.push({x0:g.x, x1:g.x+g.w, y0:g.y, y1:g.y+g.h, y:g.y, h:g.h});
  }
  const out={};
  Object.keys(perPag).forEach(p=>{
    out[p]=perPag[p].map(r=>{ const alt=r.y1-r.y0; return [r.x0-0.001, r.y0+alt*0.14, (r.x1-r.x0)+0.002, alt*1.06]; });
  });
  return out;
}
/* un tratto che finirebbe fuori dal foglio lo riporto dentro, intero */
function _dentroPagina(p){
  const xs=p.map(q=>q[0]), ys=p.map(q=>q[1]);
  const xm=Math.min.apply(null,xs), xM=Math.max.apply(null,xs), ym=Math.min.apply(null,ys), yM=Math.max.apply(null,ys);
  let dx=0, dy=0;
  if(xM>0.995) dx=0.995-xM; if(xm+dx<0) dx=-xm;
  if(yM>0.995) dy=0.995-yM; if(ym+dy<0) dy=-ym;
  return (dx||dy) ? p.map(q=>[q[0]+dx,q[1]+dy]) : p;
}
/* dove va un segno copiato, in questa lezione: una o più note nuove */
function _posaSegno(s,f,c,D,l){
  const out=[];
  const nota=(n,extra)=>Object.assign({t:s.t, c:s.c}, s.o!=null?{o:s.o}:{}, s.s!=null?{s:s.s}:{}, extra,
    {dl:l.i, pg:n, off:n-pagineDelGiorno(l,n)[0], id:uid(), da:s.id});
  if(s.come==='parole'){
    const r=portaTratto(f,c.W,c.F,D.W,D.F,s.iF,s.iL); if(!r) return out;
    const perPag=_rettangoliParole(D,r[0],r[1]);
    Object.keys(perPag).forEach(p=>{
      const n=+p, rr=perPag[p]; if(!rr.length) return;
      const a=nota(n,{rr});
      const an=ancoraDa(n,rr); if(an) a.an=an;
      out.push({n,a});
    });
    return out;
  }
  const j=_parolaCorrispondente(f,D,s.r); if(j<0) return out;
  const g=D.G[j], n=g.pag;
  if(s.come==='sopra'){ out.push({n, a:nota(n,{p:_dentroPagina(s.p.map(q=>[g.x+q[0],g.y+q[1]]))})}); return out; }
  if(s.t==='testo'){
    const x = s.dx!=null ? Math.max(0,Math.min(0.97,g.x+g.w+s.dx)) : s.x;
    out.push({n, a:nota(n,{x, y:Math.max(0,Math.min(0.97,g.y+s.dy)), w:s.w, txt:s.txt, f:s.f})});
    return out;
  }
  if(s.t==='penna'){ out.push({n, a:nota(n,{p:_dentroPagina(s.p.map(q=>[q[0],g.y+q[1]]))})}); return out; }
  /* evidenziato o sottolineato sulle righe vuote della risposta */
  let rr=s.rr.map(r=>[r[0],g.y+r[1],r[2],r[3]]);
  const fondo=Math.max.apply(null,rr.map(r=>r[1]+r[3]));
  if(fondo>0.995) rr=rr.map(r=>[r[0],r[1]-(fondo-0.995),r[2],r[3]]);
  out.push({n, a:nota(n,{rr})});
  return out;
}
/* Il cuore dell'incolla, senza toccare niente: torna le note nuove da
   aggiungere (servono le righe di tutte le pagine della lezione). */
function incollaAppuntiIn(c,l,lez){
  const D=paroleLezione(l,lez);
  const esito={messi:0, gia:0, persi:0, nuovi:[]};
  if(!D.W.length){ esito.persi=c.segni.length; return esito; }
  const f=allineaParole(c.W,c.F,c.da.lg,D.W,D.F,l.lg||'it');
  /* quello che è già qui: incollato un'altra volta, o l'originale stesso */
  const qui=new Set();
  pagineLezione(l,lez).forEach(n=>noteDi(n,l).forEach(a=>{
    if(a && a.dl===l.i){ if(a.id) qui.add(a.id); if(a.da) qui.add(a.da); }
  }));
  c.segni.forEach(s=>{
    if(qui.has(s.id) || (s.orig && qui.has(s.orig))){ esito.gia++; return; }
    const pezzi=_posaSegno(s,f,c,D,l);
    if(!pezzi.length){ esito.persi++; return; }
    pezzi.forEach(x=>esito.nuovi.push(x));
    esito.messi++;
  });
  return esito;
}
/* i segni vecchissimi (senza `dl`) si vedevano in tutte e due le lingue:
   adesso che nell'altra c'è la copia giusta, l'originale resta nella sua */
function _fermaOriginali(c){
  const vecchi={}; c.segni.forEach(s=>{ if(s.nSrc!=null) vecchi[s.id]=s; });
  if(!Object.keys(vecchi).length) return;
  const src=trovaLez(c.da.i); if(!src) return;
  const g=stato.appunti && stato.appunti[gruppoNote(src)]; if(!g) return;
  Object.keys(g).forEach(k=>(g[k]||[]).forEach(a=>{
    const s=a && !a.dl && vecchi[a.id]; if(!s) return;
    a.dl=src.i; a.pg=s.nSrc; a.off=s.nSrc-pagineDelGiorno(src,s.nSrc)[0];
    if(s.rrSrc) a.rr=s.rrSrc.map(r=>r.slice());
  }));
}
/* ---------- i due pulsanti dentro «Appunti» ---------- */
function scegliLezioneCopia(){
  const l=LET.lez; if(!l) return;
  if(!l.lezioni||!l.lezioni.length) analizzaLezionario(l);
  const lez=l.lezioni||[];
  if(!lez.length){ avvisa('In questo lezionario non ho riconosciuto le lezioni: prova «Cerca di nuovo le lezioni» nell\'indice','no'); return; }
  const qui=lezioneDellaPagina(l,LET.pag);
  apri('Copia appunti',
    `<p class="sotto" style="margin-top:0">Tocca la lezione: copio tutti i suoi appunti. Poi apri il lezionario dell'altra lingua e lì premi «Incolla appunti».</p>
     <div class="lez-el">${lez.map((x,k)=>{ const q=contaAppuntiLezione(l,x); return `
       <div class="lez-riga${qui===x?' oggi':''}" onclick="copiaAppuntiLezione(${k})">
         <span class="nn">${esc(x.n)}</span>
         <span class="cc"><b>${esc(x.tit)}</b>
           <span>${x.data?esc(dataLunga(x.data,l.lg)):''}${qui===x?' · la stai guardando':''}</span></span>
         <span class="pp">${q===1?'1 appunto':q+' appunti'}</span>
       </div>`; }).join('')}</div>`,
    `<button class="bt pi" onclick="apriAppunti()">Indietro</button>`,640,'alto');
}
async function copiaAppuntiLezione(k){
  const l=LET.lez, lez=l && (l.lezioni||[])[k]; if(!lez) return;
  chiudi(); avvisa('Copio gli appunti…');
  try{
    await caricaRigheLezione(l,lez);
    const c=preparaCopiaAppunti(l,lez);
    if(!c.segni.length){ avvisa('In questa lezione non ci sono appunti da copiare','no'); return; }
    _copiaAppunti=c;
    try{ await kvSet('copia:appunti',c); }catch(e){}
    salva();
    avvisa(`${c.segni.length===1?'Copiato 1 appunto':'Copiati '+c.segni.length+' appunti'} della lezione ${lez.n}`,'ok');
  }catch(e){ console.error(e); avvisa('Non sono riuscito a copiare: '+e.message,'no'); }
}
async function scegliLezioneIncolla(){
  const l=LET.lez; if(!l) return;
  const c=await leggiCopiaAppunti();
  if(!c || !c.segni || !c.segni.length){ avvisa('Prima copia gli appunti di una lezione con «Copia appunti»','no'); return; }
  if(c.da.i===l.i){ avvisa('Questi appunti vengono proprio da questo lezionario: apri quello dell\'altra lingua e incollali lì','no'); return; }
  if(!l.lezioni||!l.lezioni.length) analizzaLezionario(l);
  const lez=l.lezioni||[];
  if(!lez.length){ avvisa('In questo lezionario non ho riconosciuto le lezioni: prova «Cerca di nuovo le lezioni» nell\'indice','no'); return; }
  const stessa=x=>!!(c.lez.data && x.data && settimanaDi(x.data)===settimanaDi(c.lez.data));
  const quanti=c.segni.length===1?'1 appunto':c.segni.length+' appunti';
  apri('Incolla appunti',
    `<p class="sotto" style="margin-top:0">Hai copiato <b>${quanti}</b> della lezione ${esc(c.lez.n)} «${esc(c.lez.tit)}»
       (${c.da.lg==='ro'?'rumeno':'italiano'}). Tocca la lezione dove li incollo: vanno sulle stesse parole.</p>
     <div class="lez-el">${lez.map((x,k)=>`
       <div class="lez-riga${stessa(x)?' oggi':''}" onclick="incollaAppuntiLezione(${k})">
         <span class="nn">${esc(x.n)}</span>
         <span class="cc"><b>${esc(x.tit)}</b>
           <span>${x.data?esc(dataLunga(x.data,l.lg)):''}${stessa(x)?' · stesso sabato':''}</span></span>
         <span class="pp">p. ${x.pag}</span>
       </div>`).join('')}</div>`,
    `<button class="bt pi" onclick="apriAppunti()">Indietro</button>`,640,'alto');
}
async function incollaAppuntiLezione(k){
  const l=LET.lez, lez=l && (l.lezioni||[])[k]; if(!lez) return;
  const c=await leggiCopiaAppunti(); if(!c) return;
  chiudi(); avvisa('Incollo gli appunti…');
  try{
    await caricaRigheLezione(l,lez);
    const e=incollaAppuntiIn(c,l,lez);
    if(e.nuovi.length){
      /* un solo «Annulla» toglie tutto quello che ho appena incollato */
      const giorni={};
      e.nuovi.forEach(x=>{ const kk=chiaveNota(l,x.n); if(giorni[kk]==null) giorni[kk]=x.n; });
      STORIA.indietro.push({gruppo:Object.keys(giorni).map(kk=>({n:giorni[kk], dati:JSON.parse(JSON.stringify(noteDi(giorni[kk])))}))});
      if(STORIA.indietro.length>60) STORIA.indietro.shift();
      STORIA.avanti.length=0; aggiornaAnnulla();
      e.nuovi.forEach(x=>noteDi(x.n,l).push(x.a));
      _fermaOriginali(c);
      salva();
    }
    const parti=[];
    if(e.messi) parti.push(e.messi===1?'Incollato 1 appunto':`Incollati ${e.messi} appunti`);
    if(e.gia) parti.push(e.gia===1?'1 c\'era già':`${e.gia} c'erano già`);
    if(e.persi) parti.push(e.persi===1?'1 non ritrovato in questa lingua':`${e.persi} non ritrovati in questa lingua`);
    avvisa(parti.join(' — ')||'Non c\'era niente da incollare', e.messi?'ok':'no');
    if(e.nuovi.length){
      const prima=Math.min.apply(null,e.nuovi.map(x=>x.n));
      if(LET.modo==='scorrimento') vaiPag(prima); else await mostraPag(prima);
      $$('.let-foglio').forEach(fg=>{ if(fg.dataset.fatto){ const n=+fg.dataset.p; disegnaNote(n); mostraTesti(n); } });
    }
  }catch(err){ console.error(err); avvisa('Non sono riuscito a incollare: '+err.message,'no'); }
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
    `${LET.libro?'<span style="margin-right:auto"></span>':`<button class="bt pi" style="margin-right:auto" onclick="scegliLezioneCopia()" title="${ICO.copia.t}">${ICO.copia.s} Copia appunti</button>
     <button class="bt pi" onclick="scegliLezioneIncolla()" title="${ICO.incolla.t}">${ICO.incolla.s} Incolla appunti</button>`}
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
/* ---------- vecchio metodo (per frase), tenuto SOLO per leggere gli
   indirizzi già salvati prima del 18 settembre 2026 — rettDaAncora più
   sotto lo usa come ripiego finché schedulaAggiornaAncore non li rifà col
   conto nuovo (per parola, vedi _paroleGlobali/_posDaParolaGlobale). Non
   viene più usato per calcolare un indirizzo NUOVO: si è rivelato troppo
   fragile, vedi il perché nel commento sopra ad ancoraDa qui sotto. ---------- */
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
/* le parole di UNA frase dentro al capoverso: è l'unità che uso per far
   combaciare le due lingue parola per parola, non lettera su lettera —
   una traduzione ha parole più lunghe o più corte, ma quasi sempre lo
   stesso numero di parole nella stessa frase */
function paroleFrase(p,fr,i){
  const rg=fr[i]; if(!rg) return p.parole;
  const el=p.parole.filter(w=>w.a>=rg[0] && w.a<rg[1]);
  return el.length?el:p.parole;
}
/* la stessa posizione (per indice, non per frazione di lettere) dentro
   a un elenco di parole che può essere più corto o più lungo */
function _posParola(idx,quante,tot){
  if(tot<=1) return 0;
  return Math.max(0,Math.min(tot-1,Math.round(idx*(tot-1)/Math.max(1,quante-1))));
}
/* ============ 18 settembre 2026 — indirizzo per PAROLA GLOBALE DEL
   GIORNO, non più per frase. Perché: provando con due lezionari VERI
   (non solo un test scritto a mano) Ovidiu ha trovato appunti finiti su
   una frase completamente sbagliata, non solo imprecisi. Causa trovata:
   il numero di FRASI in uno stesso capoverso spesso NON combacia fra le
   due lingue — un'edizione scrive «Iacov 1:5-7 :» (il due punti prima
   della citazione la spezza in una frase a sé) e l'altra «Giacomo 1:5–7
   "Ora se…» (senza due punti, resta un pezzo solo); oppure una chiude la
   citazione PRIMA del riferimento fra parentesi e l'altra DOPO. Ogni
   frase «in più» o «in meno» sballava tutte quelle dopo nello stesso
   capoverso — e il vecchio metodo, quando i capoversi non contavano le
   frasi allo stesso modo, arrivava perfino a scegliere il capoverso
   giusto ma la frase locale sbagliata (vedi commento sopra a
   _scegliCapoverso: usava la frase trovata per POSIZIONE GLOBALE anche
   per il punto DENTRO al capoverso, ed era proprio lì che si perdeva).
   Le PAROLE invece si contano allo stesso modo in ogni lingua — uno
   spazio separa una parola dall'altra, punto e basta, nessuna
   punteggiatura le sposta. Ora conto quante parole ci sono PRIMA del
   segno su TUTTA LA GIORNATA (non sul solo capoverso: capoversi divisi
   in modo diverso nelle due edizioni si aggiustano da soli, senza dover
   indovinare quale corrisponde a quale) e nell'altra lingua cerco la
   stessa proporzione sul totale delle sue parole di quel giorno.
   **Non è perfetto**: un capoverso tradotto molto più lungo o più corto
   della media di quel giorno può spostare il segno di qualche parola —
   ma resta sempre dentro allo stesso pensiero, non salta più a una frase
   diversa. Provato sui lezionari veri di Ovidiu (settembre 2026, «Cosa
   fare col dubbio»/«Ce să facem cu îndoiala», con `ancoraDa`/
   `rettDaAncora` chiamate per davvero, non solo lette): un'evidenziazione
   di 27 parole («Dio non forza…via.») cade esatta all'inizio e un solo
   posto dopo alla fine; una di 59 parole (tutta la citazione biblica)
   esatta all'inizio e a quattro parole dalla fine — sempre nello stesso
   pensiero, mai più su un'altra frase. ============ */
/* quante parole ci sono PRIMA di ogni capoverso, contando da tutto il
   giorno: cum[k] = parole nei capoversi 0..k-1, tot = parole in tutto il giorno */
function _paroleGlobali(par){
  let tot=0; const cum=[];
  par.forEach(p=>{ cum.push(tot); tot+=p.parole.length; });
  return {cum,tot};
}
function _puntoAncoraParola(tocco,estremo,x0,x1,cum){
  const ww=tocco.tocc;
  const w = estremo==='F' ? ww[0] : ww[ww.length-1];
  let off = estremo==='F' ? Math.min(_offLettera(w,Math.max(x0,w.x)),w.b)
                           : Math.max(_offLettera(w,Math.min(x1,w.x+w.w)),w.a);
  const idxLocale=Math.max(0,tocco.par.parole.indexOf(w));
  const of=Math.max(0,Math.min(1,(off-w.a)/Math.max(1,w.b-w.a)));
  return { gw: cum[tocco.p]+idxLocale, of:+of.toFixed(4) };
}
function ancoraDa(n,rr){
  const {par}=paragrafiGiorno(n);
  if(!par.length || !rr || !rr.length) return null;
  const tocchi=[];
  par.forEach((p,k)=>{
    const tocc=p.parole.filter(w=>{
      const cx=w.x+w.w/2, cy=w.y+w.h/2;
      return w.pag===n && rr.some(r=>cx>=r[0]-0.004 && cx<=r[0]+r[2]+0.004 &&
                                     cy>=r[1]-0.004 && cy<=r[1]+r[3]+0.004);
    });
    if(tocc.length) tocchi.push({p:k,par:p,tocc});
  });
  if(tocchi.length){
    const x0=Math.min.apply(null,rr.map(r=>r[0]));
    const x1=Math.max.apply(null,rr.map(r=>r[0]+r[2]));
    const primo=tocchi[0], ultimo=tocchi[tocchi.length-1];
    const {cum,tot}=_paroleGlobali(par);
    const dF=_puntoAncoraParola(primo,'F',x0,x1,cum);
    const dL=_puntoAncoraParola(ultimo,'L',x0,x1,cum);
    /* v3: bollino per schedulaAggiornaAncore, che deve rifare col conto
       nuovo anche gli indirizzi vecchi (v2, per frase) già marcati "fatti" */
    return { gwF:dF.gw, ofF:dF.of, gwL:dL.gw, ofL:dL.of, gwTot:tot, v3:1 };
  }
  /* nessuna parola sotto: è una riga vuota da riempire (la risposta alla domanda).
     La lego al capoverso che sta sopra, alla stessa distanza. Invariato:
     non dipende da frasi né da parole. */
  const y0=Math.min.apply(null,rr.map(r=>r[1]));
  let sopra=-1;
  par.forEach((p,k)=>{ if(p.pagine[p.pagine.length-1]<=n && (p.pag!==n || p.y2<=y0+0.002)) sopra=k; });
  const base = sopra>=0 && par[sopra].pag===n ? par[sopra].y2 : 0;
  return {vuota:1,p:sopra,np:par.length,dy:+(y0-base).toFixed(4),
          rr:rr.map(r=>[+(r[0]).toFixed(4),+(r[1]-y0).toFixed(4),+(r[2]).toFixed(4),+(r[3]).toFixed(4)])};
}
/* ---------- da qui in giù: ripiego per gli indirizzi salvati PRIMA del
   18 settembre 2026 (per frase/parola, v2) o ancora prima (per frazione
   di lettere sull'intero capoverso) — rettDaAncora li legge ancora così
   finché schedulaAggiornaAncore non li rifà col conto nuovo. Non toccare
   per far funzionare indirizzi NUOVI: quelli passano dal ramo v3 sopra. ---------- */
/* quale capoverso, in QUESTA lingua, corrisponde al capoverso p (su np totali)
   dell'altra — di solito lo stesso numero d'ordine, ma se i capoversi non si
   contano allo stesso modo nelle due lingue guardo anche la frase g (su ng,
   che è la stessa nelle due lingue) e mi fido di quella se il suo capoverso
   ha un numero di frasi più vicino a ns (quello del capoverso originale):
   è il modo più sicuro che ho di capire se ho preso il capoverso giusto,
   non semplicemente uno vicino. Non mi fido mai di un capoverso trovato per
   frase se è lontano più di due posti da quello trovato per posizione — un
   salto così grande vuol dire che mi sono confuso da qualche altra parte. */
/* torna {par, j}: il capoverso, e SE l'ho trovato per frase, anche la frase
   locale esatta già trovata (tutte[m].j) — così chi chiama non deve
   reindovinarla in proporzione da capo, che è dove stava il bug trovato
   provando: ricalcolarla con ns (il numero di frasi del VECCHIO capoverso,
   non più quello giusto per il capoverso nuovo) portava alla frase
   sbagliata. j resta null se ho usato solo la posizione: chi chiama, in
   quel caso, la ricava come sempre da sF/sL e ns. */
function _scegliCapoverso(par,p,np,ns,g,ng){
  let k=p, j=null;
  if(np && np!==par.length && np>1){
    const kIdx=Math.max(0,Math.min(par.length-1,Math.round(p*(par.length-1)/(np-1))));
    k=kIdx;
    if(ng && g!=null){
      const tutte=frasiGiorno(par);
      if(tutte.length){
        const m=Math.max(0,Math.min(tutte.length-1,ng<2?g:Math.round(g*(tutte.length-1)/(ng-1))));
        const cand=tutte[m], kCand=cand?par.indexOf(cand.par):-1;
        if(cand && Math.abs(kCand-kIdx)<=2 && (cand.par===par[kIdx] || !ns ||
           Math.abs(frasiDi(cand.par).length-ns) < Math.abs(frasiDi(par[kIdx]).length-ns)))
          { k=kCand; j=cand.j; }
      }
    }
  }
  k=Math.max(0,Math.min(par.length-1,k));
  return {par:par[k], j};
}
/* il punto (in lettere) dentro a un capoverso di QUESTA lingua, dato
   l'indirizzo per frase/parola preso dall'altra — la stessa cosa che faceva
   rettDaAncora prima, spostata qui perché ora serve due volte (inizio e fine,
   se sono in capoversi diversi). jNoto: la frase locale, se _scegliCapoverso
   l'ha già trovata per frase — altrimenti la ricavo io da s/ns, come prima. */
function _offInCapoverso(p,s,ns,w,wc,of,jNoto){
  const fr=frasiDi(p);
  const j = jNoto!=null ? Math.max(0,Math.min(fr.length-1,jNoto))
          : ns ? Math.max(0,Math.min(fr.length-1, (fr.length===ns||ns<2)?Math.min(s,fr.length-1)
                                                  : Math.round(s*(fr.length-1)/(ns-1))))
               : Math.max(0,Math.min(fr.length-1,s||0));
  if(w!=null){
    const parole=paroleFrase(p,fr,j);
    const ww=parole[_posParola(w,wc,parole.length)];
    return ww.a+Math.max(0,Math.min(1,of))*Math.max(1,ww.b-ww.a);
  }
  const l=Math.max(1,fr[j][1]-fr[j][0]);
  return fr[j][0]+Math.max(0,Math.min(1,of!=null?of:1))*l;
}
function _rettInCapoverso(p,n,a,b){
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
/* il punto (in lettere) dentro a un capoverso di QUESTA lingua, dato
   l'indirizzo per parola globale preso dall'altra */
function _posDaParolaGlobale(par,cum,tot,gw,gwTot,of){
  const g2 = gwTot>1 ? Math.round(gw*(tot-1)/(gwTot-1)) : 0;
  const gc = Math.max(0,Math.min(tot-1,g2));
  let k=0;
  for(let i=0;i<cum.length;i++){ if(cum[i]<=gc) k=i; else break; }
  const p=par[k];
  const locale=Math.max(0,Math.min(p.parole.length-1,gc-cum[k]));
  const ww=p.parole[locale];
  return { par:p, off: ww.a+Math.max(0,Math.min(1,of))*Math.max(1,ww.b-ww.a) };
}
/* e qui il contrario: dall'ancora ricavo i rettangoli su QUESTA pagina. */
function rettDaAncora(n,an){
  const {par}=paragrafiGiorno(n);
  if(!par.length || !an) return null;
  if(an.vuota){
    const dF=_scegliCapoverso(par,an.p,an.np);
    const base=(dF.par&&dF.par.pag===n)?dF.par.y2:0;
    const y0=base+(an.dy||0);
    return (an.rr||[]).map(r=>[r[0],y0+r[1],r[2],r[3]]);
  }
  /* v3 (18 settembre 2026) — per parola su tutta la giornata: il caso
     normale, per ogni indirizzo scritto da oggi in poi */
  if(an.gwF!=null){
    const {cum,tot}=_paroleGlobali(par);
    if(!tot) return null;
    const dF=_posDaParolaGlobale(par,cum,tot,an.gwF,an.gwTot,an.ofF);
    const dL=_posDaParolaGlobale(par,cum,tot,an.gwL,an.gwTot,an.ofL);
    if(dF.par===dL.par){
      let a=dF.off, b=dL.off;
      if(b<=a) b=dF.par.n;
      return _rettInCapoverso(dF.par,n,a,b);
    }
    /* capoversi diversi in questa lingua: dal punto di inizio fino alla
       fine del primo, poi dall'inizio del secondo fino al punto di fine —
       ed evidenzio per intero eventuali capoversi in mezzo */
    const out=(_rettInCapoverso(dF.par,n,dF.off,dF.par.n)||[]).concat(_rettInCapoverso(dL.par,n,0,dL.off)||[]);
    const kF=par.indexOf(dF.par), kL=par.indexOf(dL.par);
    if(kF>=0 && kL>kF+1) for(let k=kF+1;k<kL;k++) out.push(...(_rettInCapoverso(par[k],n,0,par[k].n)||[]));
    return out;
  }
  /* ---------- ripiego: indirizzo salvato prima del 18 settembre 2026
     (per frase/parola, v2, o ancora prima per frazione di lettere) ---------- */
  const dF=_scegliCapoverso(par,an.p,an.np,an.ns,an.gF,an.ng);
  if(!dF.par || !dF.par.parole.length) return null;
  const p2=an.p2!=null?an.p2:an.p, np2=an.p2!=null?an.np2:an.np, ns2=an.p2!=null?an.ns2:an.ns;
  const dL=_scegliCapoverso(par,p2,np2,ns2,an.gL,an.ng);
  if(!dL.par || !dL.par.parole.length) return null;
  if(dF.par===dL.par){
    /* stesso capoverso in questa lingua: come è sempre stato */
    const pF=dF.par;
    let a,b;
    if(!an.ns){
      a=(an.a/Math.max(1,an.n))*pF.n; b=(an.b/Math.max(1,an.n))*pF.n;
    } else if(an.wF!=null){
      a=_offInCapoverso(pF,an.sF,an.ns,an.wF,an.wcF,an.ofF,dF.j);
      b=_offInCapoverso(pF,an.sL,ns2,an.wL,an.wcL,an.ofL,dL.j);
      if(b<=a){ const fr=frasiDi(pF); const j=dL.j!=null?dL.j:Math.min(fr.length-1,an.sL||0); b=fr[j][1]; }
    } else {
      a=_offInCapoverso(pF,an.sF,an.ns,null,null,an.oF,dF.j);
      b=_offInCapoverso(pF,an.sL,ns2,null,null,an.oL!=null?an.oL:1,dL.j);
      if(b<=a){ const fr=frasiDi(pF); const j=dL.j!=null?dL.j:Math.min(fr.length-1,an.sL||0); b=Math.min(pF.n,fr[j][1]); }
    }
    return _rettInCapoverso(pF,n,a,b);
  }
  /* capoversi diversi in questa lingua: dal punto di inizio fino alla fine
     del primo capoverso, poi dall'inizio del secondo fino al punto di fine —
     così non si perde più né l'uno né l'altro pezzo. Se fra i due, in questa
     lingua, ci sono altri capoversi di mezzo, li evidenzio per intero: un
     trascinamento solo, dall'altra parte, li avrebbe toccati tutti */
  const pF=dF.par, pL=dL.par;
  const a=_offInCapoverso(pF,an.sF,an.ns,an.wF!=null?an.wF:null,an.wcF,an.ofF,dF.j);
  const b=an.wF!=null ? _offInCapoverso(pL,an.sL,ns2,an.wL,an.wcL,an.ofL,dL.j)
                       : _offInCapoverso(pL,an.sL,ns2,null,null,an.oL,dL.j);
  const out=(_rettInCapoverso(pF,n,a,pF.n)||[]).concat(_rettInCapoverso(pL,n,0,b)||[]);
  const kF=par.indexOf(pF), kL=par.indexOf(pL);
  if(kF>=0 && kL>kF+1) for(let k=kF+1;k<kL;k++) out.push(...(_rettInCapoverso(par[k],n,0,par[k].n)||[]));
  return out;
}
/* i rettangoli buoni per questa pagina: quelli veri se il segno è nato qui,
   quelli ritrovati sul testo se viene dall'altra lingua */
/* I rettangoli di un segno su QUESTA pagina. Se il segno sa su quali parole
   sta, lo ritrovo sul testo — e allora finisce sulla pagina dove quelle parole
   stanno davvero, anche se nell'altra edizione è la pagina dopo. */
/* Un appunto si disegna SOLO nella sua edizione: se no lo stesso segno si
   vedrebbe due volte, uno incollato e uno rifatto al volo. */
/* Prima un appunto nuovo (con l'indirizzo per parola, «an») si vedeva GIÀ DA
   SOLO nell'altra lingua, ricalcolato al volo. Ovidiu ha chiesto che NON
   sia automatico: un appunto si vede solo nel suo lezionario di origine
   (`a.dl`), finché non lo porti tu con «Copia appunti» e «Incolla appunti»
   (che crea una copia vera con un `dl` suo proprio, quella sì visibile lì). Gli
   appunti vecchissimi, di prima che `dl` venisse scritto sempre, restano
   visibili ovunque come già capitava — non li tocco, per non far sembrare
   che siano "spariti". */
function segnoQui(a){ return !a.dl || (LET.lez && a.dl===LET.lez.i); }
function rettDi(a,n){
  if(!segnoQui(a)) return [];
  /* Nella SUA edizione (nato qui, o incollato qui) uso sempre i
     rettangoli veri, disegnati a mano: sono fissi e giusti per sempre.
     L'ancora per parola serve SOLO a ritrovare il segno in un'ALTRA
     edizione (o per i segni vecchissimi senza dl, di cui non conosco
     l'origine) — ricalcolarla anche qui era il vero bug dietro «evidenzia
     in avanti anche altre frasi a caso»: il conto delle parole di tutta la
     giornata cambia mentre le pagine si caricano una alla volta, quindi lo
     stesso segno, ricalcolato in momenti diversi, poteva spostarsi su un
     punto diverso — sempre più avanti quante più pagine nel frattempo si
     erano aggiunte al conto. */
  if(a.dl && LET.lez && a.dl===LET.lez.i){
    return paginaDelSegno(a,n) ? (a.rr||[]) : [];
  }
  if(a.an){
    const r=rettDaAncora(n,a.an);
    if(r && r.length) return r;
    return [];
  }
  return paginaDelSegno(a,n) ? (a.rr||[]) : [];
}
/* i segni senza parole sotto (righe vuote, penna) stanno sulla pagina in cui
   sono nati, contata dall'inizio del giorno */
function paginaDelSegno(a,n){
  /* Il segno ricorda la pagina esatta dove è nato (pg). Prima contava solo
     «quante pagine dopo l'inizio del giorno» (off), ma il cassetto degli
     appunti è UNO per gruppo di giorni riconosciuti in tutte le edizioni,
     mentre l'inizio del giorno si conta sui giorni di questa edizione: se
     non coincidono, lo stesso «off» combaciava con un'altra pagina e il
     segno si ripeteva in quelle successive. */
  if(a.pg!=null && LET.lez && a.dl===LET.lez.i) return a.pg===n;
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
/* vero se il punto (coordinate 0-1 della pagina) cade su una riga di testo —
   coi margini bianchi ai lati, un tocco lì deve poter scorrere la pagina
   anche con l'evidenziatore (o un altro strumento) scelto, non solo con la
   manina: un po' di tolleranza (0.012) perché il dito non è preciso come
   il mouse */
function puntoSulTesto(n,p){
  const righe=LET.righe[n]||[];
  const [px,py]=p;
  for(const r of righe){
    if(py<r.y-0.012 || py>r.y+r.h+0.012) continue;
    for(const el of (r.el||[])){
      if(px>=el.x-0.012 && px<=el.x+el.w+0.012) return true;
    }
  }
  return false;
}
function letGiu(ev){
  deselezionaTutteLeScritte();
  const s=LET.strumento;
  if(s==='mano') return;
  const n=pagDaEvento(ev);
  const p=letPunto(ev,n);
  if(!puntoSulTesto(n,p)){
    /* Scrivere si può anche dove non c'è testo (le righe vuote sotto la
       domanda): il tocco però apre la casella solo quando il dito si
       stacca senza essersi mosso, così scorrere la pagina non ne apre una */
    if(s==='testo'){ const t=(ev.touches&&ev.touches[0])||ev; LET._tx={n,p,x:t.clientX,y:t.clientY}; }
    return;  // sul margine: lascio scorrere, non disegno
  }
  ev.preventDefault();
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
function letAnnullaTocco(e){
  if(!LET._tx) return;
  const t=(e.touches&&e.touches[0])||e;
  if(Math.hypot(t.clientX-LET._tx.x,t.clientY-LET._tx.y)>10) LET._tx=null;
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
function letSu(ev){
  if(LET._tx){
    const q=LET._tx; LET._tx=null;
    if(ev&&ev.cancelable) ev.preventDefault();
    LET.pagAttiva=q.n; nuovoTestoLez(q.n,q.p);
    return;
  }
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
      a.pg = n;
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
/* seleziona una sola scritta (per allargarla/stringerla/spostarla con le
   manopole) senza aprire "modifica" — un tocco fuori la deseleziona */
function selezionaTestoLez(n,k){
  const f=document.querySelector(`.let-foglio[data-p="${n}"]`); if(!f) return;
  f.querySelectorAll('.let-tx').forEach(el=>el.classList.toggle('selezionata', +el.dataset.k===k));
}
function deselezionaTutteLeScritte(){
  $$('.let-tx.selezionata').forEach(el=>el.classList.remove('selezionata'));
}
/* Quanto è larga la riga di un appunto nuovo: da dove tocchi fino al margine destro del testo
   della lezione, così va a capo quando arriva dove va a capo anche la scritta del lezionario
   (prima era sempre il 42% della pagina). Il margine lo prendo dalle righe di testo della pagina:
   quello dove finisce la maggior parte delle righe lunghe, senza farmi ingannare da un numero
   di pagina o da una riga che sporge. */
function larghezzaAppunto(n,x){
  const righe=(LET.righe&&LET.righe[n])||[];
  const fini=[], inizi=[];
  righe.forEach(r=>{
    if(!r.el||!r.el.length) return;
    const a=Math.min(...r.el.map(e=>e.x)), b=Math.max(...r.el.map(e=>e.x+e.w));
    if(b-a>0.3){ fini.push(b); inizi.push(a); }
  });
  let destra;
  if(fini.length>=3){ fini.sort((u,v)=>u-v); destra=fini[Math.floor(fini.length*0.8)]; }
  /* pagine senza righe di testo leggibili (il testo è salvato come disegno): il margine lo trovo
     guardando la pagina disegnata, riga di pixel per riga di pixel */
  else destra=margineDaPixel(n);
  if(destra==null) return 0.42;
  const w=destra-x;
  /* toccato fuori dal testo, a destra del margine: una riga ragionevole fino al bordo del foglio */
  if(w<0.08) return Math.max(0.08,Math.min(0.42,0.97-x));
  return Math.min(0.96,w);
}
/* dove finisce la scritta della pagina (0…1 della larghezza), guardando il disegno della pagina:
   per ogni riga di pixel con inchiostro prendo il punto più a destra, tenendo solo le righe lunghe
   (almeno un terzo della pagina), e scelgo quello dove finisce la maggior parte delle righe */
function margineDaPixel(n){
  try{
    const c=document.querySelector(`.let-foglio[data-p="${n}"] .let-pdf`); if(!c||!c.width||!c.height) return null;
    const W=600, H=Math.max(1,Math.round(W*c.height/c.width));
    const t=document.createElement('canvas'); t.width=W; t.height=H;
    const x=t.getContext('2d'); x.drawImage(c,0,0,W,H);
    const d=x.getImageData(0,0,W,H).data, lum=new Uint8Array(W*H), conta=new Array(256).fill(0);
    for(let i=0;i<W*H;i++){ const v=(d[i*4]*299+d[i*4+1]*587+d[i*4+2]*114)/1000|0; lum[i]=v; conta[v]++; }
    const fondo=conta.indexOf(Math.max(...conta));                 /* il colore della carta */
    const fini=[];
    for(let y=0;y<H;y++){
      let a=-1,b=-1;
      for(let q=0;q<W;q++) if(Math.abs(lum[y*W+q]-fondo)>60){ if(a<0) a=q; b=q; }
      if(a>=0 && b-a>W*0.3) fini.push((b+1)/W);
    }
    if(fini.length<10) return null;
    fini.sort((u,v)=>u-v);
    return fini[Math.floor(fini.length*0.8)];
  }catch(e){ return null; }
}
function finestraTesto(n,k,p){
  const el=noteDi(n);
  /* una scritta nuova prende quello che hai scelto l'ultima volta (colore,
     carattere, grandezza); la grandezza, se non l'hai mai scelta tu, è quella
     del testo del lezionario lì attorno */
  const a = k!=null ? el[k] : {t:'testo',c:(LET.colori&&LET.colori.testo)||LET.colore,
        s:stato.imp.grandezzaLettore||(p?grandezzaTestoLez(n,p):0)||LET.grandezza||4,f:LET.carattere||'serif',
        x:p[0],y:p[1],w:larghezzaAppunto(n,p[0]),txt:'', dl:(LET.lez?LET.lez.i:''),
        off:(LET.lez? n-pagineDelGiorno(LET.lez,n)[0] : 0), pg:n};
  LET._txCol=a.c; LET._dimScelta=false;
  const soloVoce = !!(window.SpeechRecognition||window.webkitSpeechRecognition);
  apri(k!=null?'Modifica l\'appunto':'Scrivi un appunto',`
    <div class="tx-barra">
      ${soloVoce?`<button class="bt or mini" id="txMic" onclick="dettaTesto()">🎤 Detta</button>`
                :`<span style="font-size:12.5px;color:var(--tx3)">Il microfono non funziona su questo browser</span>`}
      <span style="flex:1"></span>
      <span style="font-size:12.5px;color:var(--tx3)">Colore</span>
      ${COL_APPUNTI_LEZ.map(c=>`<button class="col-g pic" style="background:${c}" onpointerdown="txColore(event,'${c}')" onmousedown="event.preventDefault()" ontouchend="event.preventDefault()" onclick="txColore(event,'${c}')"></button>`).join('')}
    </div>
    <div class="campo" style="margin-bottom:10px"><label>Carattere</label>
      <select id="txFont" onchange="cambiaCarattere(this.value)">
        ${Object.keys(FAMIGLIE).map(k=>`<option value="${k}" ${((a.f||'serif')===k)?'selected':''}
          style="font-family:${FAMIGLIE[k]}">${esc(NOMI_FAM[k]||k)}</option>`).join('')}
      </select></div>
    <div id="txArea" contenteditable="true" class="tx-area"
      style="color:${a.c};font-family:${FAMIGLIE[a.f||'serif']}">${esc(a.txt).replace(/\n/g,'<br>')}</div>
    <div class="campo" style="margin-top:12px"><label>Grandezza — <b id="txDimN">${a.s||LET.grandezza||4}</b></label>
      <input type="range" min="2" max="20" value="${a.s||LET.grandezza||4}" id="txDim" oninput="LET._dimScelta=true;document.getElementById('txArea').style.fontSize=(this.value*4)+'px';numeriDim(this.value)">
      <div class="dim-scala" id="txScala">${scalaDim()}</div></div>`,
    `${k!=null?`<button class="bt pi" style="margin-right:auto;color:#ff8b9c" onclick="togliTestoLez(${n},${k})">Elimina</button>`:''}
     <button class="bt pi" onclick="fermaVoce();chiudi()">Annulla</button>
     <button class="bt pr" onclick="salvaTestoLez(${n},${k==null?-1:k})">Salva</button>`,620,'tx-fin');
  const t=$('#txArea');
  if(t){ t.style.fontSize=((a.s||LET.grandezza||4)*4)+'px'; t.focus();
    const r=document.createRange(); r.selectNodeContents(t); r.collapse(false);
    const s=getSelection(); s.removeAllRanges(); s.addRange(r); }
  numeriDim(($('#txDim')||{}).value);
  LET._testo={n,k,a};
}
/* Sull'iPad la tastiera copriva la finestra dove scrivi l'appunto. Quando la tastiera è
   aperta la finestra sta tutta nello spazio che resta SOPRA la tastiera (la parte di schermo
   che si vede davvero, visualViewport), e il riquadro dove scrivi sale subito sotto al titolo,
   con «Annulla» e «Salva» sempre in vista; colori, carattere e grandezza restano sotto. */
function txSopraTastiera(){
  const m=$('#modale'), v=window.visualViewport; if(!m) return;
  const fin=m.classList.contains('on') && m.querySelector('.foglio.tx-fin');
  const alta=document.documentElement.clientHeight||window.innerHeight;
  const tastiera=!!(fin && v && v.height < alta-120);
  if(fin) fin.classList.toggle('con-tastiera',tastiera);
  if(tastiera){
    m.style.top=Math.round(v.offsetTop)+'px'; m.style.height=Math.round(v.height)+'px'; m.style.bottom='auto';
    m.classList.add('sopra-tastiera');
  } else if(m.classList.contains('sopra-tastiera')){
    m.style.top=m.style.height=m.style.bottom=''; m.classList.remove('sopra-tastiera');
  }
}
if(window.visualViewport){
  visualViewport.addEventListener('resize',txSopraTastiera);
  visualViewport.addEventListener('scroll',txSopraTastiera);
}
document.addEventListener('focusin',e=>{ if(e.target&&e.target.id==='txArea') setTimeout(txSopraTastiera,350); });
/* i numeri da 2 a 20 sotto alla barra «Grandezza»: ognuno cade sotto il punto
   della barra che vale quel numero (i 12px sono circa metà del pallino della barra) */
function scalaDim(){
  let h='';
  for(let v=2;v<=20;v++) h+=`<span data-v="${v}" style="left:calc(12px + (100% - 24px) * ${((v-2)/18).toFixed(4)})">${v}</span>`;
  return h;
}
/* il numero scelto: scritto accanto a «Grandezza» e più forte sotto alla barra */
function numeriDim(v){
  const n=$('#txDimN'); if(n && v!=null) n.textContent=v;
  $$('#txScala span').forEach(s=>s.classList.toggle('on',s.dataset.v===String(v)));
}
function cambiaCarattere(f){
  LET.carattere=f;
  stato.imp.carattereLettore=f; salva();    /* si ricorda anche chiudendo il programma */
  const t=$('#txArea'); if(t) t.style.fontFamily=FAMIGLIE[f]||FAMIGLIE.moderno;
}
/* Il colore scelto DENTRO alla finestra di una scritta è sempre il colore delle
   scritte, qualunque strumento tu abbia in mano: si ricorda per la prossima
   scritta e non tocca il colore dell'evidenziatore o della penna. */
/* toccando un colore la tastiera NON si chiude: il tocco non porta via il cursore dal riquadro
   dove scrivi (e se l'ha portato via, lo rimetto dov'era, nello stesso tocco) */
function txColore(e,c){
  if(e) e.preventDefault();
  const t=$('#txArea'); if(!t) return;
  const s=getSelection(), dentro=s.rangeCount && t.contains(s.getRangeAt(0).startContainer);
  const r=dentro ? s.getRangeAt(0).cloneRange() : null;
  setColTesto(c); t.style.color=c;
  if(document.activeElement!==t) t.focus();
  if(r){ s.removeAllRanges(); s.addRange(r); }
  else if(!dentro){ const q=document.createRange(); q.selectNodeContents(t); q.collapse(false); s.removeAllRanges(); s.addRange(q); }
}
function setColTesto(c){
  LET._txCol=c;
  LET.colori=LET.colori||{};
  LET.colori.testo=c;
  stato.imp.coloriLettore=LET.colori; salva();
  if(strumentoColore()==='testo'){ LET.colore=c; mostraColore(); }
}
function salvaTestoLez(n,k){
  const t=$('#txArea'); if(!t) return;
  ricordaPrima(n);
  const txt=t.innerText.replace(/ /g,' ').trimEnd();
  fermaVoce();
  const el=noteDi(n);
  const s=+($('#txDim')||{}).value||LET.grandezza||4;
  LET.grandezza=s;
  /* la grandezza la ricordo (anche chiudendo il programma) solo se l'hai scelta
     tu con la barra: se l'hai lasciata com'era, la prossima scritta nuova
     torna grande come il testo del lezionario lì attorno */
  if(LET._dimScelta) stato.imp.grandezzaLettore=s;
  /* il colore è quello della scritta stessa (o quello scelto qui dentro), non
     quello che in quel momento ha in mano l'evidenziatore o la penna */
  const col=LET._txCol||LET._testo.a.c||LET.colore;
  if(!txt.trim()){ if(k>=0) el.splice(k,1); }
  const f=($('#txFont')||{}).value||LET.carattere||'moderno';
  if(k>=0){ el[k].txt=txt; el[k].c=col; el[k].s=s; el[k].f=f;
    /* un appunto con la vecchia larghezza fissa (42% della pagina) prende la larghezza del testo del file */
    if(el[k] && (!el[k].w || el[k].w===0.42)) el[k].w=larghezzaAppunto(n,el[k].x); }
  else { const a=LET._testo.a; a.txt=txt; a.c=col; a.s=s; a.f=f; el.push(a); }
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
  /* toccando un punto qualsiasi della pagina la scritta selezionata si
     deseleziona (con gli strumenti in mano ci pensa già letGiu) */
  deselezionaTutteLeScritte();
  nudo();
}
document.addEventListener('click',e=>{
  const b=$('#lettore'); if(!b||!b.classList.contains('on')) return;
  if(e.target.closest('.let-sx')||e.target.closest('.let-pie')||e.target.closest('#letEsc')) return;
  if(e.target.closest('.let-foglio')||e.target.closest('#letArea')) toccoFoglio(e);
});
document.addEventListener('mousedown',e=>{ if(e.target&&e.target.classList&&e.target.classList.contains('let-note')) letGiu(e); });
document.addEventListener('mousemove',e=>{ letAnnullaTocco(e); if(LET.disegna) letMuovi(e); });
document.addEventListener('mouseup',letSu);
document.addEventListener('touchstart',e=>{ if(e.target&&e.target.classList&&e.target.classList.contains('let-note')) letGiu(e); },{passive:false});
document.addEventListener('touchmove',e=>{ letAnnullaTocco(e); if(LET.disegna) letMuovi(e); },{passive:false});
document.addEventListener('touchend',letSu);
document.addEventListener('keydown',e=>{
  if(!$('#lettore')||!$('#lettore').classList.contains('on')) return;
  const sf=LET.modo==='pagina';
  if(e.key==='ArrowRight'||e.key==='PageDown') sf?lbSfoglia(1):vaiPag(LET.pag+1);
  else if(e.key==='ArrowLeft'||e.key==='PageUp') sf?lbSfoglia(-1):vaiPag(LET.pag-1);
  else if(e.key==='Escape') chiudiLet();
});

/* --- esporta il lezionario unito, con gli appunti --- */
/* costruisce il PDF con la copertina, il lezionario e gli appunti stampati
   sopra, e restituisce il file pronto (non lo scarica più da solo: la
   condivisione col foglio del sistema la fa chi chiama, vedi 6c_sabato.js) */
async function costruisciPdfUnito(i){
  const l=trovaLez(i); if(!l) return null;
  await caricaPdfJs();
  const b1=await kvGet('all:'+l.fid);
  if(!b1) throw new Error('il file non è più disponibile');
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
  const u8=pdfDaImmagini(imgs,L,H);
  return {blob:new Blob([u8],{type:'application/pdf'}), nome:`${l.titolo||'Lezionario'} ${l.anno}-${l.trim}.pdf`};
}
