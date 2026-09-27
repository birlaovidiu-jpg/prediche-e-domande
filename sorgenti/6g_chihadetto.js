/* ================= CHI HA DETTO? ================= */
const FCD={ lg:'it', amb:'tutta', dif:0, chi:0, n:20, q:'', modo:'solo' };
const CITAZIONI=_CHD.d.map((x,i)=>Object.assign({i},x));
/* ogni lingua ha la sua lista di personaggi: i nomi non si traducono a mano.
   Con «tutte» (nessuna vera lingua) si legge come italiano, stesso comportamento di nomeLibro() */
function nomeParlante(k,lg){ const l=_CHD.p[lg==='ro'?'ro':'it']; return (l&&l[k])||''; }
function filtraCit(){
  const q=ck(FCD.q);
  return CITAZIONI.filter(c=>{
    if(FCD.lg!=='tutte' && c.lg!==FCD.lg) return false;
    if(FCD.amb==='at' && c.L>39) return false;
    if(FCD.amb==='nt' && c.L<=39) return false;
    if(FCD.dif && (c.dif||2)!==FCD.dif) return false;
    if(FCD.chi && c.chi!==FCD.chi-1) return false;
    if(q && !ck(c.q+' '+nomeParlante(c.chi,c.lg)).includes(q)) return false;
    return true;
  });
}
function rifCit(c){ return `${nomeLibro(c.L,c.lg)} ${c.c}:${c.v}`; }
function vChiHaDetto(){
  const perAmbCit=a=>CITAZIONI.filter(c=>(FCD.lg==='tutte'||c.lg===FCD.lg)&&
    (a==='at'?c.L<=39:a==='nt'?c.L>39:true)).length.toLocaleString('it-IT');
  const nelAmbito=CITAZIONI.filter(c=>(FCD.lg==='tutte'||c.lg===FCD.lg)&&
    (FCD.amb==='at'?c.L<=39:FCD.amb==='nt'?c.L>39:true));
  const perDifCit=n2=>nelAmbito.filter(c=>(c.dif||2)===n2).length;
  const conta={};
  nelAmbito.filter(c=>!FCD.dif||(c.dif||2)===FCD.dif)
           .forEach(c=>{ conta[c.chi]=(conta[c.chi]||0)+1; });
  /* se chi parla non compare in questo ambito si torna a «Tutti» */
  if(FCD.chi && !conta[FCD.chi-1]) FCD.chi=0;
  const el=filtraCit();
  const ordinati=Object.keys(conta).map(Number).sort((a,b)=>conta[b]-conta[a]);
  pinta(`
  <div class="quiz-pagina">
  <h1>Chi ha detto?</h1>

  <div class="scelte scelte-4">
    <div class="scelta" style="--ac:#5fd48f">
      <div class="scelta-tit">🌐 Lingua</div>
      <div class="scelta-op">
        <button class="op ${FCD.lg==='tutte'?'on':''}" onclick="setCD('lg','tutte')">Tutte</button>
        <button class="op ${FCD.lg==='it'?'on':''}" onclick="setCD('lg','it')">🇮🇹 Italiano</button>
        <button class="op ${FCD.lg==='ro'?'on':''}" onclick="setCD('lg','ro')">🇷🇴 Română</button>
      </div>
    </div>
    ${strisciaViste('chd',el,chiaveFrase)}
    <div class="scelta" style="--ac:#7fb0ff">
      <div class="scelta-tit">📖 Ambito</div>
      <div class="scelta-op">
        <button class="op ${FCD.amb==='tutta'?'on':''}" onclick="setCD('amb','tutta')">Tutta · ${perAmbCit('tutta')}</button>
        <button class="op ${FCD.amb==='at'?'on':''}" onclick="setCD('amb','at')">Antico · ${perAmbCit('at')}</button>
        <button class="op ${FCD.amb==='nt'?'on':''}" onclick="setCD('amb','nt')">Nuovo · ${perAmbCit('nt')}</button>
      </div>
    </div>
    <div class="scelta" style="--ac:#ffb37a">
      <div class="scelta-tit">🎯 Difficoltà</div>
      <div class="scelta-op">
        <button class="op ${!FCD.dif?'on':''}" onclick="setCD('dif',0)">🎲 Tutte · ${nelAmbito.length.toLocaleString('it-IT')}</button>
        ${[1,2,3].map(x=>`<button class="op ${FCD.dif===x?'on':''}" onclick="setCD('dif',${x})">${DIFF3[x].ic} ${DIFF3[x].et} · ${perDifCit(x)}</button>`).join('')}
      </div>
    </div>
    <div class="scelta" style="--ac:#c9a6ff">
      <div class="scelta-tit">🗣️ Chi parla</div>
      <select onchange="setCD('chi',+this.value)">
        <option value="0">Tutti · ${nelAmbito.length}</option>
        ${ordinati.map(k=>`<option value="${k+1}" ${FCD.chi===k+1?'selected':''}>${esc(nomeParlante(k,FCD.lg))} · ${conta[k]}</option>`).join('')}
      </select>
    </div>
    <div class="scelta" style="--ac:#ff9ecb">
      <div class="scelta-tit">🎬 Come presentare</div>
      <div class="scelta-op">
        <button class="op ${FCD.modo==='solo'?'on':''}" onclick="setCD('modo','solo')">👁 Solo risposta</button>
        <button class="op ${FCD.modo==='varianti'?'on':''}" onclick="setCD('modo','varianti')">abc Tre risposte</button>
      </div>
    </div>
    <div class="scelta" style="--ac:#d7a6ff">
      <div class="scelta-tit">🔢 Quante</div>
      <div class="scelta-op">
        ${[10,15,20,30,50,0].map(n=>`<button class="op ${FCD.n===n?'on':''}" onclick="setCD('n',${n})">${n||'Tutte'}</button>`).join('')}
      </div>
    </div>
    <div class="scelta" style="--ac:#8de08d">
      <div class="scelta-tit">🔍 Cerca</div>
      <div class="cerca"><input type="search" placeholder="una parola della frase…" value="${esc(FCD.q)}"
        oninput="FCD.q=this.value; clearTimeout(window._tcd); window._tcd=setTimeout(vChiHaDetto,250)"></div>
    </div>
  </div>

  <div>${strisciaLingue(CITAZIONI)}</div>

  <div class="az-quiz">
    <div class="az-conta"><b>${(FCD.n?Math.min(FCD.n,el.length):el.length).toLocaleString('it-IT')}</b>
      <span>frasi su ${el.length.toLocaleString('it-IT')}</span></div>
    <div class="az-bt una-riga">
      <button class="bt pr" onclick="avviaCit()">▶︎ Presenta</button>
      <button class="bt" onclick="avviaCit(true)">🖥 Regia</button>
      <button class="bt or" onclick="pdfCit()">📄 PDF</button>
      <button class="bt" onclick="pptxCit()">📊 PowerPoint</button>
    </div>
  </div>
  </div>`);
}
function setCD(k,v){ FCD[k]=v; vChiHaDetto(); }
function slideCit(c,solo){
  const s={ t:'domanda', d:'«'+c.q+'»', o:c.o, g:c.g, v:rifCit(c), lg:c.lg,
            libro: c.lg==='ro'?'Cine a spus?':'Chi ha detto?', fase:0 };
  if(solo){
    s.solo=true; s.fasi=1;
    s.o=[nomeParlante(c.chi,c.lg)]; s.g=0;
    s.etRisposta = c.lg==='ro'?'A spus':'L\'ha detto';
  }
  return s;
}
function avviaCit(regia){
  let el=filtraCit();
  if(!el.length){ avvisa('Nessuna frase con questi filtri','no'); return; }
  /* le frasi già presentate le salto: me le ricordo per sempre */
  const p=pescaNuove(el,FCD.n,'chd',chiaveFrase,seme(Date.now()&0xffffff));
  el=p.lista;
  if(p.girato) avvisa('Le hai presentate tutte: ricomincio il giro','ok');
  segnaViste('chd',el.map(chiaveFrase));
  const solo=FCD.modo==='solo';
  const sl=el.map((c,k)=>Object.assign(slideCit(c,solo),{n:`${k+1} / ${el.length}`}));
  PROI.lingua=FCD.lg;
  if(regia) apriRegia(sl,stato.imp.sfondoProi,'Chi ha detto?');
  else proietta(sl,stato.imp.sfondoProi,'Chi ha detto?');
}
function proiettaCit(i){
  const c=CITAZIONI[i]; if(!c) return;
  PROI.lingua=c.lg;
  proietta([slideCit(c,FCD.modo==='solo')],stato.imp.sfondoProi,'Chi ha detto?');
}
async function vediVersetto(rif,lg){
  const t=await testoDelRiferimento(rif,lg||'it');
  apri(rif, t? `<div class="vers-box">${t.versetti.map(p=>
      `<p><span class="bib-n">${p.v}</span>${esc(p.t)}</p>`).join('')}</div>`
    : '<p class="sotto">Non trovo questo versetto.</p>',
    `<button class="bt pi" onclick="chiudi()">Chiudi</button>
     <button class="bt pr" onclick="chiudi();proiettaRif('${esc(rif)}','${lg||'it'}')">▶︎ Proietta</button>`,640);
}
async function proiettaRif(rif,lg){
  const t=await testoDelRiferimento(rif,lg||'it');
  proietta([{t:'versetto',rif,txt:t?t.testo:''}],stato.imp.sfondoProi,'Versetto');
}
function pdfCit(){
  let el=filtraCit(); if(!el.length) return;
  const p=pescaNuove(el,FCD.n,'chd',chiaveFrase,seme(Date.now()&0xffffff));
  el=p.lista;
  if(p.girato) avvisa('Le hai presentate tutte: ricomincio il giro','ok');
  segnaViste('chd',el.map(chiaveFrase));
  salvaFile(`Chi ha detto (${FCD.lg.toUpperCase()}).pdf`,'application/pdf',async()=>{
    const L=1600,H=900,imgs=[], solo=FCD.modo==='solo';
    el.forEach((c,k)=>{
      const s=slideCit(c,solo);
      const d={d:s.d,o:s.o,g:s.g,v:s.v,libro:s.libro,solo:s.solo,etRisposta:s.etRisposta};
      const fasi = solo?[0,4]:[3,4];
      fasi.forEach(f=>imgs.push(telaDomanda(d,f,k+1,el.length,L,H).toDataURL('image/jpeg',.86)));
    });
    avvisa(`PDF pronto — ${imgs.length} pagine`,'ok');
    return pdfDaImmagini(imgs,L,H);
  });
}
function pptxCit(){
  let el=filtraCit(); if(!el.length) return;
  const p=pescaNuove(el,FCD.n,'chd',chiaveFrase,seme(Date.now()&0xffffff));
  el=p.lista;
  if(p.girato) avvisa('Le hai presentate tutte: ricomincio il giro','ok');
  segnaViste('chd',el.map(chiaveFrase));
  salvaFile(`Chi ha detto (${FCD.lg.toUpperCase()}).pptx`,_TIPI.pptx[1],async()=>{
    const sl=[], solo=FCD.modo==='solo';
    el.forEach((c,k)=>{
      const s=slideCit(c,solo);
      const d={d:s.d,o:s.o,g:s.g,v:s.v,libro:s.libro,solo:s.solo,etRisposta:s.etRisposta};
      const fasi = solo?[0,4]:[0,1,2,3,4];
      fasi.forEach(f=>sl.push(ppDomanda(d,f,k+1,el.length)));
    });
    avvisa(`PowerPoint pronto — ${sl.length} diapositive`,'ok');
    return pptx(sl,'Chi ha detto');
  });
}
