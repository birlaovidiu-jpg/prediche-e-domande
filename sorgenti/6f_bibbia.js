/* ================= LE BIBBIE ================= */
/* I testi stanno dentro al file, compressi. Si aprono la prima volta che servono. */
const BIB={ pronte:{}, inCorso:{} };
const _OFFCAP=(()=>{ const o=[0]; for(const n of _BIBD.cpl) o.push(o[o.length-1]+n); return o; })();
const _OFFVER=(()=>{ const o=[0]; for(const n of _BIBD.cap) o.push(o[o.length-1]+n); return o; })();
function versettiDelCapitolo(L,c){
  if(!(L>=1&&L<=66)) return 0;
  if(!(c>=1&&c<=_BIBD.cpl[L-1])) return 0;
  return _BIBD.cap[_OFFCAP[L-1]+c-1];
}
function indiceVersetto(L,c,v){
  const n=versettiDelCapitolo(L,c);
  if(!n||v<1||v>n) return -1;
  return _OFFVER[_OFFCAP[L-1]+c-1]+v-1;
}
async function apriBibbia(cod){
  if(BIB.pronte[cod]) return BIB.pronte[cod];
  if(BIB.inCorso[cod]) return BIB.inCorso[cod];
  BIB.inCorso[cod]=(async()=>{
    const b64=_BIBD.v[cod].z;
    const bin=atob(b64); const u8=new Uint8Array(bin.length);
    for(let i=0;i<bin.length;i++) u8[i]=bin.charCodeAt(i);
    let testo;
    if(typeof DecompressionStream==='function'){
      const ds=new DecompressionStream('gzip');
      const s=new Blob([u8]).stream().pipeThrough(ds);
      testo=await new Response(s).text();
    } else { throw new Error('questo browser non sa decomprimere'); }
    BIB.pronte[cod]=testo.split('\n');
    delete BIB.inCorso[cod];
    return BIB.pronte[cod];
  })();
  return BIB.inCorso[cod];
}
function bibbiaPronta(cod){ return !!BIB.pronte[cod]; }
function nomeLibroBib(cod,L){ const b=_BIBD.v[cod]; return b?b.libri[L-1]:''; }
/* ---------- dal riferimento ai versetti ---------- */
function leggiRiferimento(rif){
  if(!rif) return null;
  const L=trovaLibro(rif); if(!L) return null;
  const m=/(\d{1,3})\s*[:,\.]\s*([\d\s,\-–]+)$/.exec(rif);
  if(!m){
    const m2=/(\d{1,3})\s*$/.exec(rif);
    return m2?{L,cap:+m2[1],vv:null}:{L,cap:null,vv:null};
  }
  const cap=+m[1], vv=[];
  m[2].trim().split(/[,\s]+/).forEach(p=>{
    if(!p) return;
    const r=/^(\d{1,3})[-–](\d{1,3})$/.exec(p);
    if(r){ const a=+r[1],b=+r[2]; if(b>=a&&b-a<40) for(let i=a;i<=b;i++) vv.push(i); }
    else if(/^\d+$/.test(p)) vv.push(+p);
  });
  return {L,cap,vv:vv.length?vv:null};
}
/* il libro dal nome scritto nel riferimento, in una qualsiasi delle lingue */
let _MAPLIB=null;
function trovaLibro(rif){
  if(!_MAPLIB){
    _MAPLIB={};
    LIBRI.forEach(L=>{ [L[1],L[2]].forEach(n=>{ _MAPLIB[ck(n)]=L[0]; }); });
    ['it','ro','en'].forEach(c=>{ (_BIBD.v[c]?_BIBD.v[c].libri:[]).forEach((n,i)=>{ _MAPLIB[ck(n)]=i+1; }); });
    /* forme brevi e varianti che usi tu */
    Object.entries({'1 re':11,'2 re':12,'1re':11,'2re':12,'1 regi':11,'2 regi':12,
      'salmo':19,'psalmul':19,'psalmii':19,'apoc':66,'atti':44,'fapte':44,
      '1 tes':52,'2 tes':53,'esra':15,'ezeciele':26,'leviticuo':3,'gioiele':29,'miche':33,
      'cantico dei cantici':22,'plangerile':25,'faptele apostolilor':44}).forEach(([k,v])=>_MAPLIB[k]=v);
  }
  let s=ck(rif).replace(/\s*\d+\s*[:,].*$/,'').replace(/\s+\d+$/,'').trim();
  if(_MAPLIB[s]) return _MAPLIB[s];
  const p=s.split(' ');
  for(let n=Math.min(4,p.length);n>=1;n--){
    const k=p.slice(0,n).join(' ');
    if(_MAPLIB[k]) return _MAPLIB[k];
  }
  return null;
}
async function testoDelRiferimento(rif,cod){
  const r=leggiRiferimento(rif); if(!r||!r.cap) return null;
  const B=await apriBibbia(cod);
  const vv = r.vv || [...Array(versettiDelCapitolo(r.L,r.cap)).keys()].map(i=>i+1).slice(0,6);
  const pezzi=[];
  vv.forEach(v=>{ const i=indiceVersetto(r.L,r.cap,v); if(i>=0) pezzi.push({v,t:B[i]}); });
  if(!pezzi.length) return null;
  return { rif:`${nomeLibroBib(cod,r.L)} ${r.cap}:${vv[0]}${vv.length>1?'-'+vv[vv.length-1]:''}`,
           versetti:pezzi,
           testo:pezzi.map(p=>p.t).join(' ') };
}
/* testo già pronto in memoria, senza attendere (per la proiezione) */
function testoSubito(rif,cod){
  const r=leggiRiferimento(rif); if(!r||!r.cap||!BIB.pronte[cod]) return null;
  const B=BIB.pronte[cod];
  const vv=r.vv||[1];
  const pezzi=[];
  vv.forEach(v=>{ const i=indiceVersetto(r.L,r.cap,v); if(i>=0) pezzi.push(B[i]); });
  return pezzi.length?pezzi.join(' '):null;
}

/* ================= SEZIONE: BIBBIA ================= */
const FB={ cod:'it', L:1, cap:1, q:'', modo:'leggi' };
function vBibbia(){
  const v=_BIBD.v[FB.cod];
  pinta(`
  <div class="occhiello">Sacre Scritture</div>
  <h1>Bibbia</h1>
  <p class="sotto">Tre versioni dentro al programma, senza internet: ${Object.keys(_BIBD.v).map(c=>`<b>${esc(_BIBD.v[c].nome)}</b>`).join(' · ')}.</p>

  <div class="filtri" style="margin-top:16px">
    <div class="campo" style="flex:0 0 auto"><label>Versione</label>
      <div class="segm">${Object.keys(_BIBD.v).map(c=>
        `<button class="${FB.cod===c?'on':''}" onclick="setB('cod','${c}')">${
          ({it:'🇮🇹',ro:'🇷🇴',en:'🇬🇧'})[c]||''} ${esc(_BIBD.v[c].sig)}</button>`).join('')}</div></div>
    <div class="campo" style="flex:0 0 auto"><label>Modo</label>
      <div class="segm">
        <button class="${FB.modo==='leggi'?'on':''}" onclick="setB('modo','leggi')">📖 Leggi</button>
        <button class="${FB.modo==='cerca'?'on':''}" onclick="setB('modo','cerca')">🔎 Cerca</button></div></div>
    ${FB.modo==='leggi'?`
    <div class="campo" style="flex:0 0 auto"><label>&nbsp;</label>
      <button class="bt" onclick="apriGriglia()">📖 ${esc(v.libri[FB.L-1])} ${FB.cap} ▾</button></div>`
    :`<div class="campo" style="flex:1 1 280px"><label>Cerca una parola o una frase</label>
      <div class="cerca"><input type="search" id="qBib" placeholder="es. amore, pastore, «non temere»" value="${esc(FB.q)}"
        onkeydown="if(event.key==='Enter'){FB.q=this.value;cercaBibbia()}"></div></div>
      <button class="bt pr" onclick="FB.q=document.getElementById('qBib').value;cercaBibbia()">Cerca</button>`}
  </div>
  <div id="corpoBib"><p class="sotto" style="text-align:center;padding:30px 0">Apro la Bibbia…</p></div>`);
  if(FB.modo==='leggi') mostraCapitolo(); else if(FB.q) cercaBibbia(); else
    document.getElementById('corpoBib').innerHTML='<p class="sotto" style="text-align:center;padding:30px 0">Scrivi una parola e premi Cerca.</p>';
}
function setB(k,v){
  FB[k]=v;
  if(k==='L') FB.cap=1;
  vBibbia();
}
async function mostraCapitolo(){
  const c=document.getElementById('corpoBib'); if(!c) return;
  try{
    const B=await apriBibbia(FB.cod);
    const n=versettiDelCapitolo(FB.L,FB.cap);
    const i0=indiceVersetto(FB.L,FB.cap,1);
    const righe=[];
    for(let v=1;v<=n;v++) righe.push({v,t:B[i0+v-1]});
    const v=_BIBD.v[FB.cod];
    c.innerHTML=`
      <div class="fila" style="margin-bottom:12px">
        <button class="bt pi mini" onclick="capPrec()">‹ Precedente</button>
        <span style="flex:1"></span>
        <button class="bt pi mini" onclick="proiettaCapitolo()">▶︎ Proietta il capitolo</button>
        <button class="bt pi mini" onclick="capSucc()">Successivo ›</button>
      </div>
      <div class="bib-testo">
        <h2 class="bib-tit">${esc(v.libri[FB.L-1])} ${FB.cap}</h2>
        ${righe.map(r=>`<p class="bib-v" onclick="proiettaVersetto(${FB.L},${FB.cap},${r.v})">
          <span class="bib-n">${r.v}</span>${esc(r.t)}</p>`).join('')}
      </div>`;
  }catch(e){ c.innerHTML=`<div class="vuoto"><span class="em">⚠️</span>${esc(e.message)}</div>`; }
}
function capPrec(){ if(FB.cap>1){ FB.cap--; vBibbia(); } else if(FB.L>1){ FB.L--; FB.cap=_BIBD.cpl[FB.L-1]; vBibbia(); } }
function capSucc(){ if(FB.cap<_BIBD.cpl[FB.L-1]){ FB.cap++; vBibbia(); } else if(FB.L<66){ FB.L++; FB.cap=1; vBibbia(); } }
async function cercaBibbia(){
  const c=document.getElementById('corpoBib'); if(!c) return;
  const q=ck(FB.q);
  if(q.length<3){ c.innerHTML='<p class="sotto" style="text-align:center;padding:30px 0">Scrivi almeno tre lettere.</p>'; return; }
  c.innerHTML='<p class="sotto" style="text-align:center;padding:30px 0">Cerco…</p>';
  const B=await apriBibbia(FB.cod);
  const v=_BIBD.v[FB.cod];
  const tr=[];
  for(let i=0;i<B.length && tr.length<300;i++){
    if(ck(B[i]).includes(q)) tr.push(i);
  }
  /* dall'indice assoluto al riferimento */
  const rifDi=i=>{
    let ic=0; while(ic+1<_OFFVER.length && _OFFVER[ic+1]<=i) ic++;
    let L=0; while(L+1<_OFFCAP.length && _OFFCAP[L+1]<=ic) L++;
    return {L:L+1, cap:ic-_OFFCAP[L]+1, v:i-_OFFVER[ic]+1};
  };
  c.innerHTML = tr.length? `<h2>Trovati <span class="pill">${tr.length}${tr.length>=300?'+':''}</span></h2>
    <div class="el">${tr.slice(0,150).map(i=>{ const r=rifDi(i);
      const t=B[i].replace(new RegExp('('+FB.q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')','ig'),'<mark>$1</mark>');
      return `<div class="rg" onclick="vaiA(${r.L},${r.cap},${r.v})">
        <div class="cp"><b style="font-weight:600;color:var(--oro);font-family:var(--serif)">${esc(v.libri[r.L-1])} ${r.cap}:${r.v}</b>
          <span style="white-space:normal;color:var(--tx2);font-size:14px;line-height:1.5">${t}</span></div></div>`;}).join('')}</div>`
    : `<div class="vuoto"><span class="em">🔍</span>Nessun versetto con «${esc(FB.q)}».</div>`;
}
function vaiA(L,cap,v){ FB.L=L; FB.cap=cap; FB.modo='leggi'; vBibbia();
  setTimeout(()=>{ const el=document.querySelectorAll('.bib-v')[v-1];
    if(el){ el.scrollIntoView({block:'center'}); el.classList.add('acceso'); } },200); }
/* Toccando un versetto proietto TUTTO il capitolo e mi fermo su quello:
   così con le frecce vado avanti e indietro fra i versetti senza uscire. */
async function proiettaVersetto(L,cap,v){
  const B=await apriBibbia(FB.cod);
  const i0=indiceVersetto(L,cap,1); if(i0<0) return;
  const n=versettiDelCapitolo(L,cap);
  const nome=nomeLibroBib(FB.cod,L);
  const sl=[];
  for(let k=1;k<=n;k++) sl.push({t:'versetto',rif:`${nome} ${cap}:${k}`,txt:B[i0+k-1]});
  proietta(sl,stato.imp.sfondoProi,`${nome} ${cap}`);
  PROI.i=Math.max(0,Math.min(sl.length-1,v-1));
  pDisegna();
}
async function proiettaCapitolo(){
  const B=await apriBibbia(FB.cod);
  const n=versettiDelCapitolo(FB.L,FB.cap), i0=indiceVersetto(FB.L,FB.cap,1);
  const sl=[{t:'p-tit',tit:`${nomeLibroBib(FB.cod,FB.L)} ${FB.cap}`,occ:_BIBD.v[FB.cod].nome}];
  for(let v=1;v<=n;v++) sl.push({t:'versetto',rif:`${nomeLibroBib(FB.cod,FB.L)} ${FB.cap}:${v}`,txt:B[i0+v-1]});
  proietta(sl,stato.imp.sfondoProi,'Bibbia');
}

/* ---------- griglia dei libri, dei capitoli e dei versetti ---------- */
function apriGriglia(passo){
  const v=_BIBD.v[FB.cod];
  const at=passo||'libro';
  let corpo='';
  if(at==='libro'){
    const at1=v.libri.slice(0,39), nt=v.libri.slice(39);
    corpo=`<div class="gr-et">Antico Testamento</div>
      <div class="gr-lib">${at1.map((n,i)=>
        `<button class="gb ${FB.L===i+1?'on':''}" onclick="scegliLibro(${i+1})">${esc(n)}</button>`).join('')}</div>
      <div class="gr-et">Nuovo Testamento</div>
      <div class="gr-lib">${nt.map((n,i)=>
        `<button class="gb nt ${FB.L===i+40?'on':''}" onclick="scegliLibro(${i+40})">${esc(n)}</button>`).join('')}</div>`;
  } else if(at==='capitolo'){
    const n=_BIBD.cpl[FB.L-1];
    corpo=`<div class="gr-et">${esc(v.libri[FB.L-1])} — scegli il capitolo</div>
      <div class="gr-num">${[...Array(n).keys()].map(i=>
        `<button class="gn ${FB.cap===i+1?'on':''}" onclick="scegliCapitolo(${i+1})">${i+1}</button>`).join('')}</div>`;
  } else {
    const n=versettiDelCapitolo(FB.L,FB.cap);
    corpo=`<div class="gr-et">${esc(v.libri[FB.L-1])} ${FB.cap} — vai al versetto</div>
      <div class="gr-num">${[...Array(n).keys()].map(i=>
        `<button class="gn" onclick="chiudi();vaiA(${FB.L},${FB.cap},${i+1})">${i+1}</button>`).join('')}</div>`;
  }
  apri('Scegli nella Bibbia',
    `<div class="segm" style="margin-bottom:14px">
       <button class="${at==='libro'?'on':''}" onclick="apriGriglia('libro')">Libro</button>
       <button class="${at==='capitolo'?'on':''}" onclick="apriGriglia('capitolo')">Capitolo</button>
       <button class="${at==='versetto'?'on':''}" onclick="apriGriglia('versetto')">Versetto</button>
     </div>${corpo}`,
    `<button class="bt pi" onclick="chiudi()">Chiudi</button>`,860);
}
function scegliLibro(L){ FB.L=L; FB.cap=1; apriGriglia('capitolo'); }
function scegliCapitolo(c){ FB.cap=c; chiudi(); vBibbia(); }
