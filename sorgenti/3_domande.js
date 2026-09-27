/* ================= DOMANDE BIBLICHE ================= */
const FD={ lg:'it', ambito:'tutta', libro:0, n:20, ordine:'casuale', q:'', dif:0, scheda:'quiz' };

function tutteDomande(){ return DOMANDE.concat(stato.domandeMie); }
function nomeLibro(id,lg){ const L=LIBRI[id-1]; return L?(lg==='ro'?L[2]:L[1]):''; }
/* «tutte» come lingua vuol dire: non scartare nessuna delle due */
function codLg(l){ return (l&&l!=='tutte')?l:'it'; }
function libriConDomande(lg){
  const s=new Set(); tutteDomande().forEach(q=>{ if(lg==='tutte'||q.lg===lg) s.add(q.L); });
  return LIBRI.filter(L=>s.has(L[0]));
}
function filtra(){
  const q=ck(FD.q);
  return tutteDomande().filter(d=>{
    if(FD.lg!=='tutte' && d.lg!==FD.lg) return false;
    if(FD.dif && (d.dif||2)!==FD.dif) return false;
    if(FD.ambito==='libro' && d.L!==FD.libro) return false;
    if(FD.ambito==='at' && d.L>39) return false;
    if(FD.ambito==='nt' && d.L<=39) return false;
    if(q){ const t=ck(d.d+' '+d.o.join(' ')+' '+(d.v||'')+' '+nomeLibro(d.L,d.lg)); if(!t.includes(q)) return false; }
    return true;
  });
}
function vDomande(){
  const lib=libriConDomande(FD.lg);
  if(FD.ambito==='libro' && !lib.some(L=>L[0]===FD.libro)) FD.libro=lib.length?lib[0][0]:0;
  const el=filtra();
  const perDif=n=>tutteDomande().filter(d=>(FD.lg==='tutte'||d.lg===FD.lg)&&(d.dif||2)===n).length;
  const perAmb=a=>tutteDomande().filter(d=>(FD.lg==='tutte'||d.lg===FD.lg)&&
    (a==='at'?d.L<=39:a==='nt'?d.L>39:true)).length.toLocaleString('it-IT');
  const quante=FD.n?Math.min(FD.n,el.length):el.length;
  pinta(`
  <div class="quiz-pagina">
  <h1>Domande bibliche</h1>

  <div class="scelte scelte-3">
    <div class="scelta" style="--ac:#5fd48f">
      <div class="scelta-tit">🌐 Lingua</div>
      <div class="scelta-op">
        <button class="op ${FD.lg==='tutte'?'on':''}" onclick="setD('lg','tutte')">Tutte</button>
        <button class="op ${FD.lg==='it'?'on':''}" onclick="setD('lg','it')">🇮🇹 Italiano</button>
        <button class="op ${FD.lg==='ro'?'on':''}" onclick="setD('lg','ro')">🇷🇴 Română</button>
      </div>
    </div>
    ${strisciaViste('dom',el,chiaveDomanda)}
    <div class="scelta larga" style="--ac:#7fb0ff">
      <div class="scelta-tit">📖 Ambito</div>
      <div class="scelta-op">
        <button class="op ${FD.ambito==='tutta'?'on':''}" onclick="setD('ambito','tutta')">Tutta la Bibbia · ${perAmb('tutta')}</button>
        <button class="op ${FD.ambito==='at'?'on':''}" onclick="setD('ambito','at')">Antico · ${perAmb('at')}</button>
        <button class="op ${FD.ambito==='nt'?'on':''}" onclick="setD('ambito','nt')">Nuovo · ${perAmb('nt')}</button>
        <button class="op ${FD.ambito==='libro'?'on':''}" onclick="setD('ambito','libro')">Un libro</button>
      </div>
      ${FD.ambito==='libro'?`<select style="margin-top:12px" onchange="setD('libro',+this.value)">${lib.map(L=>
        `<option value="${L[0]}" ${L[0]===FD.libro?'selected':''}>${esc(FD.lg==='ro'?L[2]:L[1])} (${tutteDomande().filter(d=>(FD.lg==='tutte'||d.lg===FD.lg)&&d.L===L[0]).length})</option>`).join('')}</select>`:''}
    </div>
    <div class="scelta larga" style="--ac:#ffb37a">
      <div class="scelta-tit">🎯 Difficoltà</div>
      <div class="scelta-op">
        <button class="op ${!FD.dif?'on':''}" onclick="setD('dif',0)">Tutte</button>
        ${[1,2,3,4].map(n=>`<button class="op ${FD.dif===n?'on':''}" onclick="setD('dif',${n})">${DIFF[n].ic} ${DIFF[n].et} · ${perDif(n)}</button>`).join('')}
      </div>
    </div>
    <div class="scelta" style="--ac:#d7a6ff">
      <div class="scelta-tit">🔢 Quante</div>
      <div class="scelta-op">
        ${[10,15,20,25,30,40,50,100,0].map(n=>`<button class="op ${FD.n===n?'on':''}" onclick="setD('n',${n})">${n||'Tutte'}</button>`).join('')}
      </div>
    </div>
    <div class="scelta" style="--ac:#ff9ecb">
      <div class="scelta-tit">↕️ Ordine</div>
      <div class="scelta-op">
        <button class="op ${FD.ordine==='casuale'?'on':''}" onclick="setD('ordine','casuale')">🎲 Casuale</button>
        <button class="op ${FD.ordine==='ordine'?'on':''}" onclick="setD('ordine','ordine')">📖 In ordine</button>
      </div>
    </div>
    <div class="scelta" style="--ac:#8de08d">
      <div class="scelta-tit">🔍 Cerca</div>
      <div class="cerca"><input type="search" placeholder="Domanda, risposta o versetto…"
        value="${esc(FD.q)}" oninput="FD.q=this.value; clearTimeout(window._tq); window._tq=setTimeout(vDomande,260)"></div>
    </div>
  </div>

  <div>${strisciaLingue(tutteDomande())}</div>

  <div class="az-quiz">
    <div class="az-conta">
      <b>${quante.toLocaleString('it-IT')}</b>
      <span>${FS.sel.size?`scelte a mano su ${el.length.toLocaleString('it-IT')}`:`domande su ${el.length.toLocaleString('it-IT')} disponibili`}</span>
    </div>
    <div class="az-bt una-riga">
      <button class="bt pr" onclick="avviaQuiz()">▶︎ Presenta il quiz</button>
      <button class="bt" onclick="espPptx()">📊 PowerPoint</button>
      <button class="bt or" onclick="espPdf()">📄 PDF</button>
      <button class="bt" onclick="espPdfRisposte()" title="PDF con le risposte su fogli a parte">📋 PDF + risposte</button>
      <button class="bt pi" onclick="espTesto()">📝 Testo</button>
      ${FS.sel.size?`<button class="bt pi" onclick="selNessuna()" title="Togli la scelta a mano">✕ Scelta a mano</button>`:''}
      <button class="bt pi" onclick="nuovaDomanda()" title="Scrivi una domanda tua">✚ Nuova domanda</button>
    </div>
  </div>
  </div>`);
}
function setD(k,v){ FD[k]=v; vDomande(); }
function testoVers(rif,lg){
  const cod = codLg(lg||FD.lg);
  return (stato.versetti&&stato.versetti[rif]) || testoSubito(rif,cod) || TESTI[rif] || '';
}

/* ---------- avvio del quiz ---------- */
function avviaQuiz(sorpresa){
  let el = sorpresa ? tutteDomande().filter(d=>FD.lg==='tutte'||d.lg===FD.lg) : filtra();
  if(!el.length){ avvisa('Nessuna domanda da proiettare','no'); return; }
  const rnd=seme(Date.now()&0xffffff);
  const n=(sorpresa?20:FD.n)||el.length;
  /* le domande già presentate le salto: me le ricordo per sempre */
  const p=pescaNuove(el,n,'dom',chiaveDomanda,rnd);
  el=p.lista;
  if(p.girato) avvisa('Le hai presentate tutte: ricomincio il giro','ok');
  if(!(sorpresa||FD.ordine==='casuale'))
    el=el.slice().sort((a,b)=> a.L-b.L || capVers(a.v)-capVers(b.v));
  segnaViste('dom',el.map(chiaveDomanda));
  const slide=el.map((d,k)=>{
    let o=d.o, g=d.g;
    if(stato.imp.quizMescOpz){ const idx=mescola([0,1,2],rnd); o=idx.map(i=>d.o[i]); g=idx.indexOf(d.g); }
    /* ogni domanda porta la SUA lingua: con «Tutte» attivo, italiano e
       rumeno si mescolano nello stesso quiz, e il versetto giusto (e il
       riferimento toccabile in basso) restano nella lingua di quella
       domanda, non in quella (eventualmente «tutte») del filtro */
    /* il libro in alto si vede solo se hai scelto tu «Un libro»: con «Tutta
       la Bibbia»/Antico/Nuovo la domanda è generica, non serve scriverlo */
    return { t:'domanda', d:d.d, o, g, v:d.v, lg:d.lg, txt:testoVers(d.v,d.lg),
             libro:FD.ambito==='libro'?nomeLibro(d.L,d.lg):'', n:`${k+1} / ${el.length}`, fase:0 };
  });
  PROI.lingua=FD.lg;
  proietta(slide, stato.imp.sfondoProi, 'Quiz biblico');
}
function capVers(v){ const m=/(\d+)\s*:/.exec(v||''); return m?+m[1]:0; }
function proiettaUna(key){
  const mia=key[0]==='m', i=+key.slice(1);
  const d = mia ? stato.domandeMie.find(x=>x.i===i) : DOMANDE[i];
  if(!d) return;
  proietta([{t:'domanda',d:d.d,o:d.o,g:d.g,v:d.v,lg:d.lg,txt:testoVers(d.v,d.lg),
             libro:nomeLibro(d.L,d.lg),fase:0}], stato.imp.sfondoProi,'Domanda');
}
/* il versetto in basso a destra apre la sua diapositiva */
function mostraVersetto(rif,lg){
  const cod=codLg(lg||PROI.lingua||FD.lg);
  const s={t:'versetto',rif,txt:testoVers(rif,cod)};
  if(!s.txt){
    /* la Bibbia non è ancora aperta: la apro e poi ridisegno */
    apriBibbia(cod).then(()=>{ s.txt=testoVers(rif,cod); pDisegna(); }).catch(()=>{});
  }
  PROI.slide.splice(PROI.i+1,0,s); PROI.i++; pDisegna();
}

/* ---------- inserimento e modifica ---------- */
function nuovaDomanda(id){
  const d = id!=null ? stato.domandeMie.find(x=>x.i===id) : null;
  const lib=LIBRI.map(L=>`<option value="${L[0]}" ${d&&d.L===L[0]?'selected':(!d&&L[0]===(FD.libro||1)?'selected':'')}>${esc(L[1])} · ${esc(L[2])}</option>`).join('');
  apri(d?'Modifica domanda':'Nuova domanda',`
   <div class="griglia" style="gap:13px">
    <div class="fila">
      <div class="campo" style="flex:1"><label>Lingua</label>
        <select id="nqLg"><option value="it" ${!d||d.lg==='it'?'selected':''}>Italiano</option>
        <option value="ro" ${d&&d.lg==='ro'?'selected':''}>Română</option></select></div>
      <div class="campo" style="flex:2"><label>Libro</label><select id="nqL">${lib}</select></div>
    </div>
    <div class="campo"><label>Domanda</label><textarea id="nqD" style="min-height:70px">${esc(d?d.d:'')}</textarea></div>
    ${[0,1,2].map(i=>`<div class="campo"><label>Risposta ${'abc'[i]}
      <label style="text-transform:none;letter-spacing:0;color:var(--tx2);font-weight:400;margin-left:8px">
      <input type="radio" name="nqg" value="${i}" ${(d?d.g:0)===i?'checked':''}> è quella giusta</label></label>
      <input type="text" id="nqO${i}" value="${esc(d?d.o[i]:'')}"></div>`).join('')}
    <div class="campo"><label>Versetto (es. Genesi 1:1)</label><input type="text" id="nqV" value="${esc(d?d.v:'')}"></div>
    <div class="campo"><label>Testo del versetto — facoltativo, serve per la proiezione</label>
      <textarea id="nqT" style="min-height:70px">${esc(d?testoVers(d.v):'')}</textarea></div>
   </div>`,
   `${d?`<button class="bt pi" style="margin-right:auto;color:#ff8b9c" onclick="eliminaDomanda(${d.i})">Elimina</button>`:''}
    <button class="bt pi" onclick="chiudi()">Annulla</button>
    <button class="bt pr" onclick="salvaDomanda(${d?d.i:'null'})">Salva</button>`,620);
}
function salvaDomanda(id){
  const dd=$('#nqD').value.trim(), o=[0,1,2].map(i=>$('#nqO'+i).value.trim());
  if(!dd||o.some(x=>!x)){ avvisa('Domanda e tre risposte sono obbligatorie','no'); return; }
  const g=+($('input[name=nqg]:checked')||{value:0}).value;
  const v=$('#nqV').value.trim(), t=$('#nqT').value.trim();
  const dati={ d:dd, o, g, L:+$('#nqL').value, v, lg:$('#nqLg').value, mia:true };
  if(id!=null){ const q=stato.domandeMie.find(x=>x.i===id); Object.assign(q,dati); }
  else { dati.i=uid(); stato.domandeMie.push(dati); }
  if(v&&t) stato.versetti[v]=t;
  salva(); chiudi(); vDomande(); avvisa('Domanda salvata','ok');
}
function eliminaDomanda(id){
  conferma('Vuoi eliminare questa domanda?',()=>{
    stato.domandeMie=stato.domandeMie.filter(x=>x.i!==id); salva(); chiudi(); vDomande(); avvisa('Eliminata','ok');
  },'Elimina');
}

/* ---------- testi dei versetti ---------- */
function gestisciVersetti(){
  const usati=[...new Set(tutteDomande().filter(d=>(FD.lg==='tutte'||d.lg===FD.lg)&&d.v).map(d=>d.v))].sort();
  const con=usati.filter(v=>testoVers(v)).length;
  apri('Testi dei versetti',`
    <p class="sotto" style="margin-top:0">Toccando il versetto in basso a destra durante la proiezione si apre la diapositiva con il testo.
    Ne risultano già inseriti <b>${con}</b> su ${usati.length}.</p>
    <div class="campo"><label>Cerca il riferimento</label>
      <input type="search" id="vCerca" placeholder="Es. Genesi 1:1" oninput="listaVersetti(this.value)"></div>
    <div id="vLista" style="margin-top:12px;max-height:44vh;overflow:auto"></div>
    <div style="margin-top:16px;border-top:1px solid var(--bordo);padding-top:14px">
      <div class="campo"><label>Incolla molti versetti insieme — una riga per versetto: <code>Riferimento = testo</code></label>
        <textarea id="vBulk" placeholder="Genesi 1:1 = Nel principio Iddio creò i cieli e la terra.&#10;Salmi 23:1 = L'Eterno è il mio pastore, nulla mi mancherà."></textarea></div>
      <button class="bt" onclick="importaVersetti()">Importa l'elenco</button>
    </div>`,
    `<button class="bt pi" onclick="chiudi()">Chiudi</button>`,700);
  listaVersetti('');
}
function listaVersetti(q){
  const usati=[...new Set(tutteDomande().filter(d=>(FD.lg==='tutte'||d.lg===FD.lg)&&d.v).map(d=>d.v))].sort();
  const f=ck(q), el=(f?usati.filter(v=>ck(v).includes(f)):usati).slice(0,60);
  $('#vLista').innerHTML=el.map(v=>{
    const t=testoVers(v);
    return `<div class="rg" style="cursor:default"><div class="cp"><b>${esc(v)}</b>
      <span style="color:${t?'var(--tx2)':'var(--tx3)'}">${t?esc(t.slice(0,90))+(t.length>90?'…':''):'— testo non inserito'}</span></div>
      <button class="bt mini pi" onclick="scriviVersetto('${esc(v).replace(/'/g,"\\'")}')">${t?'✎':'✚'}</button></div>`;
  }).join('') || '<div class="vuoto" style="padding:20px">Nessun riferimento.</div>';
}
function scriviVersetto(rif){
  const t=testoVers(rif);
  apri(rif,`<div class="campo"><label>Testo del versetto</label>
    <textarea id="vTxt" style="min-height:130px">${esc(t)}</textarea></div>`,
    `<button class="bt pi" onclick="gestisciVersetti()">Indietro</button>
     <button class="bt pr" onclick="salvaVersetto('${esc(rif).replace(/'/g,"\\'")}')">Salva</button>`,560);
}
function salvaVersetto(rif){
  const t=$('#vTxt').value.trim();
  if(t) stato.versetti[rif]=t; else delete stato.versetti[rif];
  salva(); gestisciVersetti(); avvisa('Versetto salvato','ok');
}
function importaVersetti(){
  const righe=$('#vBulk').value.split('\n').map(r=>r.trim()).filter(Boolean);
  let n=0;
  righe.forEach(r=>{ const i=r.indexOf('=');
    if(i>0){ const k=r.slice(0,i).trim(), v=r.slice(i+1).trim(); if(k&&v){ stato.versetti[k]=v; n++; } } });
  salva(); gestisciVersetti(); avvisa(n?`Importati ${n} versetti`:'Nessuna riga valida',n?'ok':'no');
}
