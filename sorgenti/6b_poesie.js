/* ================= POESIE ================= */
const FQ={ lg:'tutte', q:'' };
/* mancava il modo di "nascondere" una poesia dell'archivio (a differenza di
   Prediche/Esperienze, che hanno predVia/espVia): Elimina toglieva solo da
   stato.poesie, che una poesia d'archivio non tocca mai — restava sempre lì,
   sembrava che «non elimina» */
function tuttePoesie(){
  const via=stato.poeVia||{};
  return POESIE.concat(stato.poesie||[]).filter(p=>!via[p.i]);
}
/* una poesia si divide in strofe separate da una riga vuota */
function analizzaPoesia(testo){
  const b=String(testo||'').split(/\n\s*\n/).map(s=>s.replace(/[ \t]+/g,' ').trim()).filter(Boolean);
  /* se non ci sono righe vuote, raggruppo a quattro versi */
  if(b.length<=1){
    const r=String(testo||'').split('\n').map(x=>x.trim()).filter(Boolean), out=[];
    for(let i=0;i<r.length;i+=4) out.push(r.slice(i,i+4).join('\n'));
    return out;
  }
  return b;
}
/* le strofe da proiettare/contare: se hai scritto o cambiato i versi sul
   foglio (come le prediche, da «✎ Modifica»), quello vince — altrimenti
   quelle riconosciute dal testo incollato all'inizio */
function versiPoesia(p){
  /* leggo l'annotazione senza crearla (come già fa cartaPredica per i
     luoghi): scorrendo la griglia non deve nascere un'annotazione vuota
     per ogni poesia solo perché è comparsa in vista */
  const a=(stato.predAnnot||{})[p.i];
  const html=a&&(a.testi&&a.testi[p.lg]!=null?a.testi[p.lg]:a.html);
  if(html){
    const d=document.createElement('div'); d.innerHTML=html;
    const testi=[...d.querySelectorAll('p')].filter(el=>!el.closest('.fp-cap'))
      .map(el=>(el.innerText||el.textContent||'').replace(/\s+/g,' ').trim()).filter(Boolean);
    if(testi.length) return testi;
  }
  return p.blocchi||analizzaPoesia(p.testo||'');
}
function slidePoesia(p){
  const s=[{t:'p-tit',tit:p.tit,occ:p.autore||'Poesia'}];
  versiPoesia(p).forEach(st=>s.push({t:'cantico-str',testo:st,eti:''}));
  return s;
}
function vPoesie(){
  document.body.classList.remove('pred-fissa');
  /* stesso motivo di vPrediche()/vEsperienze() */
  PR_MOD=false; _predAperta=null; PR_LG=null;
  const q=ck(FQ.q);
  const tutte=tuttePoesie();
  const c=contaLingue(tutte);
  const el=tutte.filter(p=>(FQ.lg==='tutte'||p.lg===FQ.lg) &&
    (!q||ck(p.tit+' '+(p.autore||'')+' '+p.testo).includes(q)))
    .sort((a,b)=>a.tit.localeCompare(b.tit,'it',{sensitivity:'base',numeric:true}));
  pinta(`
  <h1>Poesie</h1>
  <div class="filtri" style="margin-top:20px">
    <div class="campo" style="flex:0 0 auto"><label>Lingua</label>
      <div class="segm">
        <button class="${FQ.lg==='tutte'?'on':''}" onclick="setQ('lg','tutte')">Tutte <b>${c.tot}</b></button>
        <button class="${FQ.lg==='it'?'on':''}" onclick="setQ('lg','it')">🇮🇹 Italiano <b>${c.it}</b></button>
        <button class="${FQ.lg==='ro'?'on':''}" onclick="setQ('lg','ro')">🇷🇴 Română <b>${c.ro}</b></button></div></div>
    <div class="campo" style="flex:1 1 220px"><label>Cerca</label>
      <div class="cerca"><input type="search" placeholder="Titolo o parola dei versi…" value="${esc(FQ.q)}"
        oninput="FQ.q=this.value; clearTimeout(window._tpo); window._tpo=setTimeout(cercaPoesie,260)"></div></div>
    <button class="bt pr" onclick="poesiaVuota()">✚ Nuova poesia</button>
    <button class="bt pi" onclick="apriImportaPptx('poesia')" title="Importa da un file PowerPoint">📥 Importa PowerPoint</button>
  </div>
  ${el.length?`<div class="griglia g-pred">${el.map(p=>cartaPoesia(p)).join('')}</div>`
   :`<div class="vuoto"><span class="em">🪶</span>Nessuna poesia.<br>
     <button class="bt pr" style="margin-top:16px" onclick="poesiaVuota()">✚ Aggiungi la prima</button></div>`}`);
  attaccaCopertinePrediche();
}
function setQ(k,v){ FQ[k]=v; vPoesie(); }
/* stesso motivo della ricerca nelle prediche: pinta() rifà la casella da capo */
function cercaPoesie(){
  vPoesie();
  const inp=document.querySelector('.filtri .cerca input');
  if(inp){ inp.focus(); const n=inp.value.length; inp.setSelectionRange(n,n); }
}
function cartaPoesia(p){
  const st=versiPoesia(p);
  const lg=p.lg==='it'?'it':'ro';
  const meta=[p.autore&&esc(p.autore), `${st.length} strofe`].filter(Boolean).join(' · ');
  return `<div class="scheda-min" data-apre-pred="1" data-i="${p.i}">
    <div class="cm-cop po-${lg}">
      <div class="cm-tit grande">${esc(p.tit)}</div>
      <span class="tag ${lg} cm-tag">${lg==='it'?'IT':'RO'}</span>
      <button class="cm-loc" onclick="event.stopPropagation();aggiungiLuogo('${p.i}')" title="${etichettaLuogo(p.i)}">📍${numeroLuoghi(p.i)?` ${numeroLuoghi(p.i)}`:''}</button>
    </div>
    <div class="cm-info">
      <span class="cm-meta">${meta}</span>
      <span class="cm-az">
        <button class="bt mini pr" onclick="event.stopPropagation();proiettaPoesia('${p.i}')" title="Proietta">▶︎</button>
        <button class="bt mini pi" style="color:#ff8b9c" onclick="event.stopPropagation();eliminaPoesia('${p.i}')" title="Elimina">🗑</button>
      </span>
    </div></div>`;
}
function trovaPoesia(i){ return tuttePoesie().find(p=>p.i===i); }
function proiettaPoesia(i){ const p=trovaPoesia(i); if(p) proietta(slidePoesia(p),p.sfondo||'alba',p.tit); }
/* poesia nuova: niente modulo da riempire, si scrive dritti sul foglio come
   in Word — titolo/autore/lingua/sfondo si sistemano poi con ⚙ */
function poesiaVuota(){
  const dati={ tit:'Nuova poesia', lg:(FQ.lg==='it'?'it':'ro'), autore:'', sfondo:'alba', testo:'', mia:true };
  dati.i='y'+uid();
  stato.poesie=stato.poesie||[];
  stato.poesie.push(dati);
  const a=annot(dati.i);
  a.stile=Object.assign({},a.stile||{},{fam:'serif',dim:22,interl:1.5});
  a.html=`<div class="fp-cap"><h2 class="fp-tit">${esc(dati.tit)}</h2></div><p><br></p>`;
  salva();
  leggiPredica(dati.i);
  setTimeout(()=>{ modificaTesto(dati.i); setTimeout(selezionaTitoloFoglio,30); },160);
  avvisa('Scrivi qui i versi: hai tutti i comandi in alto','ok');
}
/* qui si sistemano solo titolo/autore/lingua/sfondo — i versi si scrivono da
   «✎ Modifica» sul foglio */
function nuovaPoesia(i){
  if(!i){ poesiaVuota(); return; }
  /* quello che stavi scrivendo sul foglio si salva prima di aprire ⚙ (come nelle prediche) */
  salvaFoglioAperto();
  const p=trovaPoesia(i); if(!p) return;
  const mia=(stato.poesie||[]).some(x=>x.i===i);
  apri('Titolo, autore, lingua',`
   <div class="griglia" style="gap:13px">
    ${mia?'':`<p class="sotto" style="margin:0;color:var(--oro)">Questa viene dall'archivio: salvando ne creo una tua copia.</p>`}
    <div class="fila">
      <div class="campo" style="flex:2"><label>Titolo</label><input type="text" id="nyT" value="${esc(p.tit)}"></div>
      <div class="campo" style="flex:0 0 130px"><label>Lingua</label><select id="nyL">
        <option value="it" ${p.lg==='it'?'selected':''}>Italiano</option>
        <option value="ro" ${p.lg!=='it'?'selected':''}>Română</option></select></div>
    </div>
    <div class="fila">
      <div class="campo" style="flex:1"><label>Autore</label><input type="text" id="nyA" value="${esc(p.autore||'')}"></div>
      <div class="campo" style="flex:1"><label>Sfondo</label><select id="nyS">
        ${Object.keys(SFONDI).map(k=>`<option value="${k}" ${(p.sfondo||'alba')===k?'selected':''}>${SFONDI[k].ic} ${SFONDI[k].et}</option>`).join('')}</select></div>
    </div>
    <p class="sotto" style="margin:0">I versi si scrivono da «✎ Modifica» sul foglio — qui sistemi solo questi dati.</p>
   </div>`,
   `${mia?`<button class="bt pi" style="margin-right:auto;color:#ff8b9c" onclick="eliminaPoesia('${p.i}')">Elimina</button>`:''}
    <button class="bt pi" onclick="chiudi()">Annulla</button>
    <button class="bt pr" onclick="salvaPoesia('${p.i}')">Salva</button>`,660);
}
function salvaPoesia(i){
  const tit=$('#nyT').value.trim();
  if(!tit){ avvisa('Serve almeno il titolo','no'); return; }
  stato.poesie=stato.poesie||[];
  const mia=stato.poesie.some(x=>x.i===i);
  const orig=trovaPoesia(i);
  /* se sto copiando una dell'archivio, i versi già scritti lì non vanno
     persi — restano quelli finché non li cambi tu da «✎ Modifica» */
  const p = mia ? orig : {testo:(orig&&orig.testo)||'', mia:true};
  Object.assign(p,{tit,lg:$('#nyL').value,autore:$('#nyA').value.trim(),sfondo:$('#nyS').value});
  p._b=null;
  /* il titolo nuovo va anche sul foglio: se no, al salvataggio dopo, il foglio rimetteva quello vecchio */
  if(mia) titoloSulFoglio(i,tit);
  if(!mia){ p.i='y'+uid(); stato.poesie.push(p); }
  stato.poesie.forEach(x=>{ x.blocchi=analizzaPoesia(x.testo); });
  salva(); chiudi(); vPoesie(); avvisa('Dati salvati','ok');
}
function eliminaPoesia(i){
  const p=trovaPoesia(i);
  conferma('Vuoi togliere «'+((p&&p.tit)||'questa poesia')+'» dall\'elenco?\n\nSe è una delle tue sparisce; se viene dall\'archivio la puoi rimettere da ☁️ Dati.',()=>{
    stato.poesie=(stato.poesie||[]).filter(x=>x.i!==i);
    stato.poeVia=stato.poeVia||{}; stato.poeVia[i]=1;
    salva(); chiudi();
    document.body.classList.remove('pred-fissa'); PR_MOD=false; _predAperta=null;
    vai('poesie'); avvisa('Tolta dall\'elenco','ok');
  },'Elimina');
}
