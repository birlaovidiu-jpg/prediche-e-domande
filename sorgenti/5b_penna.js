/* ================= LA PENNA SUL FOGLIO (prediche, poesie, esperienze) =================
   Come nei lezionari e nei libri: si scrive a mano sopra la pagina che leggi, con la penna,
   l'evidenziatore e la gomma, nei colori che vuoi, con «Annulla» e «Pulisci». Quello che scrivi
   resta salvato (dentro alle annotazioni della predica, quindi anche nel backup), una lingua per
   volta: l'italiano e il rumeno hanno ognuno i suoi segni, perché il testo è diverso.
   Con la Apple Pencil scrive la matita e il dito fa scorrere la pagina; senza matita scrive il dito.
   Il foglio NON è un'immagine fissa come il PDF del lezionario: se ingrandisci le lettere o giri
   l'iPad il testo va a capo in un altro punto. Per questo ogni segno è attaccato al capoverso
   dove l'hai fatto (in proporzione alla sua larghezza e alla sua altezza) e lo segue: se la pagina
   resta com'era, il segno torna esattamente dove l'avevi messo. */
const PN={on:false, strumento:'penna', colori:{penna:'#e02b3c',evid:'#ffd23f'}, storia:[], tratto:null, matita:false};
const PN_COLORI=['#e02b3c','#1f6feb','#128a3c','#111111','#6a2fa0','#e07b00','#ffd23f','#3ae374','#7fc9ff','#ffb3c8'];
const PN_SPESSORE={penna:3, evid:20};

function pnSegni(i,lg){
  const a=annot(i); a.penna=a.penna||{};
  return (a.penna[lg]=a.penna[lg]||[]);
}
function pnQui(){ return _predAperta ? pnSegni(_predAperta,linguaPredica(_predAperta)) : []; }
/* i capoversi del foglio (i figli diretti): è lì che si attaccano i segni */
function pnBlocchi(f){ return [...f.children].filter(el=>el.offsetHeight>0 || el.offsetWidth>0); }
function pnBloccoVicino(bl,y){
  let k=0, dist=1e9;
  bl.forEach((el,j)=>{ const a=el.offsetTop, b=a+el.offsetHeight;
    const d = y<a ? a-y : (y>b ? y-b : 0); if(d<dist){ dist=d; k=j; } });
  return k;
}
/* il livello dei segni: sta sopra al foglio (non dentro, se no finirebbe nel testo salvato) */
function pnMonta(){
  const f=$('#foglioPr'), z=$('.pr-zona'); if(!f||!z) return;
  let s=$('#pnSvg');
  if(!s){
    s=document.createElementNS('http://www.w3.org/2000/svg','svg');
    s.id='pnSvg'; s.setAttribute('class','pn-svg');
    z.appendChild(s);
    pnAscolta(s);
    if(window.ResizeObserver){ try{ new ResizeObserver(()=>pnDisegna()).observe(f); }catch(e){} }
  }
  pnDisegna();
  pnStato();
}
function pnDisegna(){
  const f=$('#foglioPr'), s=$('#pnSvg'); if(!f||!s||!_predAperta) return;
  s.style.left=f.offsetLeft+'px'; s.style.top=f.offsetTop+'px';
  s.style.width=f.offsetWidth+'px'; s.style.height=f.offsetHeight+'px';
  s.setAttribute('viewBox',`0 0 ${f.offsetWidth} ${f.offsetHeight}`);
  const bl=pnBlocchi(f), dim=parseFloat(f.style.fontSize)||22;
  s.innerHTML=pnQui().map((t,k)=>pnPath(t,k,bl,dim)).join('');
}
function pnPunti(t,bl){
  const el=bl[Math.min(t.b,bl.length-1)];
  if(!el) return [];
  const x0=el.offsetLeft, y0=el.offsetTop, w=el.offsetWidth||1, h=el.offsetHeight||1;
  return t.p.map(q=>[x0+q[0]*w, y0+q[1]*h]);
}
function pnPath(t,k,bl,dim){
  const pt=pnPunti(t,bl); if(!pt.length) return '';
  const d=pt.length===1 ? `M${pt[0][0].toFixed(1)} ${pt[0][1].toFixed(1)}l0.1 0`
                        : 'M'+pt.map(q=>q[0].toFixed(1)+' '+q[1].toFixed(1)).join('L');
  const sp=(t.s||3)*(dim/(t.d||dim));
  return `<path data-k="${k}" class="${t.t==='evid'?'pn-evid':'pn-penna'}" d="${d}" stroke="${t.c}" stroke-width="${sp.toFixed(1)}"/>`;
}
/* ---------- la barra degli strumenti della penna ---------- */
function pennaPredica(){
  if(PR_MOD){ avvisa('Finisci prima di scrivere il testo (✓ Salva), poi prendi la penna','no'); return; }
  PN.on=!PN.on; PN.storia=[];
  pnStato();
  if(PN.on) avvisa(PN.matita?'Scrivi con la matita, scorri col dito':'Scrivi sulla pagina: con la Apple Pencil il dito fa scorrere','ok');
}
function pnStato(){
  const s=$('#pnSvg'); if(s) s.classList.toggle('attiva',PN.on&&!PR_MOD);
  const b=$('#pnBt'); if(b) b.classList.toggle('on',PN.on);
  let bar=$('#pnBarra');
  if(!PN.on||PR_MOD){ if(bar) bar.remove(); return; }
  if(!bar){
    bar=document.createElement('div'); bar.id='pnBarra'; bar.className='pn-barra no-stampa';
    const pag=$('.pr-pagina'); (pag||document.body).appendChild(bar);
  }
  const st=PN.strumento, col=PN.colori[st==='gomma'?'penna':st];
  bar.innerHTML=`
    <button class="pn-b ${st==='penna'?'on':''}" onclick="pnStrumento('penna')" title="Penna">✏️<i>Penna</i></button>
    <button class="pn-b ${st==='evid'?'on':''}" onclick="pnStrumento('evid')" title="Evidenziatore">🖍️<i>Evidenzia</i></button>
    <button class="pn-b ${st==='gomma'?'on':''}" onclick="pnStrumento('gomma')" title="Gomma: passa sopra a un segno per toglierlo">🧽<i>Gomma</i></button>
    <div class="pn-col">${PN_COLORI.map(c=>`<button class="pn-c ${c===col?'on':''}" style="background:${c}" onclick="pnColore('${c}')" title="Colore"></button>`).join('')}</div>
    <button class="pn-b" onclick="pnAnnulla()" title="Annulla l'ultimo segno">↶<i>Annulla</i></button>
    <button class="pn-b" onclick="pnPulisci()" title="Togli tutti i segni di questa pagina">🗑<i>Pulisci</i></button>
    <button class="pn-b pn-fine" onclick="pennaPredica()" title="Posa la penna">✓<i>Fine</i></button>`;
}
function pnStrumento(s){ PN.strumento=s; pnStato(); }
function pnColore(c){ PN.colori[PN.strumento==='evid'?'evid':'penna']=c; if(PN.strumento==='gomma') PN.strumento='penna'; pnStato(); }
function pnAnnulla(){
  const u=PN.storia.pop(); if(!u){ avvisa('Niente da annullare','no'); return; }
  const el=pnQui();
  if(u.tipo==='agg'){ const k=el.indexOf(u.t); if(k>=0) el.splice(k,1); }
  else if(u.tipo==='via') u.tratti.slice().sort((a,b)=>a.k-b.k).forEach(x=>el.splice(Math.min(x.k,el.length),0,x.t));
  else if(u.tipo==='tutto') el.push(...u.tratti);
  salva(); pnDisegna();
}
function pnPulisci(){
  const el=pnQui(); if(!el.length){ avvisa('Su questa pagina non ci sono segni','no'); return; }
  conferma('Vuoi togliere tutti i segni fatti con la penna su questa pagina?',()=>{
    PN.storia.push({tipo:'tutto',tratti:el.slice()}); el.length=0; salva(); pnDisegna(); avvisa('Segni tolti','ok');
  },'Togli tutto');
}
/* ---------- scrivere ---------- */
function pnPuntoFoglio(e){
  const f=$('#foglioPr'), r=f.getBoundingClientRect();
  const k=r.width/(f.offsetWidth||r.width||1);   /* durante il pizzico il foglio è ingrandito */
  return [(e.clientX-r.left)/k, (e.clientY-r.top)/k];
}
function pnPuoScrivere(e){
  if(!PN.on||PR_MOD||!_predAperta) return false;
  if(e.pointerType==='pen'){ PN.matita=true; return true; }
  if(e.pointerType==='touch') return !PN.matita;
  return true;
}
function pnAscolta(s){
  s.addEventListener('pointerdown',e=>{
    if(!pnPuoScrivere(e) || PN.tratto) return;
    e.preventDefault(); e.stopPropagation();
    try{ s.setPointerCapture(e.pointerId); }catch(err){}
    const p=pnPuntoFoglio(e);
    if(PN.strumento==='gomma'){ PN.tratto={gomma:true,id:e.pointerId}; pnCancella(p); return; }
    PN.tratto={id:e.pointerId, pt:[p]};
    pnVivo();
  });
  s.addEventListener('pointermove',e=>{
    const t=PN.tratto; if(!t||t.id!==e.pointerId) return;
    e.preventDefault();
    const p=pnPuntoFoglio(e);
    if(t.gomma){ pnCancella(p); return; }
    const u=t.pt[t.pt.length-1];
    if(Math.hypot(p[0]-u[0],p[1]-u[1])>=1.5){ t.pt.push(p); pnVivo(); }
  });
  const fine=e=>{
    const t=PN.tratto; if(!t||t.id!==e.pointerId) return;
    PN.tratto=null;
    if(t.gomma||e.type==='pointercancel'){ pnDisegna(); return; }
    pnSalvaTratto(t.pt);
  };
  s.addEventListener('pointerup',fine);
  s.addEventListener('pointercancel',fine);
  /* un dito solo sulla pagina con la penna in mano scrive e non fa scorrere (con la matita,
     invece, il dito scorre); due dita restano allo zoom. Il tocco non arriva alla pagina sotto,
     che altrimenti a ogni puntino nasconderebbe o rimetterebbe la barra in alto. */
  s.addEventListener('touchstart',e=>{
    if(!PN.on||PR_MOD) return;
    if(e.touches.length>1){ if(PN.tratto&&!PN.tratto.gomma){ PN.tratto=null; pnDisegna(); } return; }
    const t=e.touches[0], stilo=t&&t.touchType==='stylus';
    if(stilo||!PN.matita){ e.preventDefault(); }
    e.stopPropagation();
  },{passive:false});
  ['touchend','click'].forEach(tp=>s.addEventListener(tp,e=>{ if(PN.on&&!PR_MOD) e.stopPropagation(); }));
}
/* il segno mentre lo fai: una riga sola in cima alle altre, senza ridisegnare tutto */
function pnVivo(){
  const s=$('#pnSvg'), f=$('#foglioPr'), t=PN.tratto; if(!s||!f||!t) return;
  let v=s.querySelector('#pnVivo');
  if(!v){ v=document.createElementNS('http://www.w3.org/2000/svg','path'); v.id='pnVivo'; s.appendChild(v); }
  const ev=PN.strumento==='evid', dim=parseFloat(f.style.fontSize)||22;
  v.setAttribute('class',ev?'pn-evid':'pn-penna');
  v.setAttribute('stroke',PN.colori[ev?'evid':'penna']);
  v.setAttribute('stroke-width',PN_SPESSORE[ev?'evid':'penna']*(dim/22));
  v.setAttribute('d',t.pt.length===1?`M${t.pt[0][0]} ${t.pt[0][1]}l0.1 0`:'M'+t.pt.map(q=>q[0].toFixed(1)+' '+q[1].toFixed(1)).join('L'));
}
function pnSalvaTratto(pt){
  const f=$('#foglioPr'); if(!f||!pt.length) return;
  const bl=pnBlocchi(f); if(!bl.length) return;
  const b=pnBloccoVicino(bl,pt[0][1]), el=bl[b];
  const w=el.offsetWidth||1, h=el.offsetHeight||1;
  const ev=PN.strumento==='evid', dim=parseFloat(f.style.fontSize)||22;
  const t={t:ev?'evid':'penna', c:PN.colori[ev?'evid':'penna'], s:PN_SPESSORE[ev?'evid':'penna']*(dim/22), d:dim, b,
           p:pt.map(q=>[+((q[0]-el.offsetLeft)/w).toFixed(4), +((q[1]-el.offsetTop)/h).toFixed(4)])};
  pnQui().push(t); PN.storia.push({tipo:'agg',t});
  salva(); pnDisegna();
}
/* la gomma: toglie i segni che tocca */
function pnCancella(p){
  const f=$('#foglioPr'); if(!f) return;
  const el=pnQui(), bl=pnBlocchi(f), dim=parseFloat(f.style.fontSize)||22, via=[];
  for(let k=el.length-1;k>=0;k--){
    const t=el[k], r=Math.max(10,((t.s||3)*(dim/(t.d||dim)))/2+6);
    if(pnPunti(t,bl).some(q=>Math.hypot(q[0]-p[0],q[1]-p[1])<=r)){ via.push({k,t}); el.splice(k,1); }
  }
  if(via.length){ PN.storia.push({tipo:'via',tratti:via}); salva(); pnDisegna(); }
}
/* quando cambia la finestra (l'iPad gira) i capoversi vanno a capo altrove: i segni li seguono */
window.addEventListener('resize',()=>{ if(!zoomNativo() && $('#pnSvg')) setTimeout(pnDisegna,120); });
