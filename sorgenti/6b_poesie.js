/* ================= POESIE ================= */
const FQ={ lg:'tutte', q:'' };
function tuttePoesie(){ return POESIE.concat(stato.poesie||[]); }
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
function slidePoesia(p){
  const s=[{t:'p-tit',tit:p.tit,occ:p.autore||'Poesia'}];
  (p.blocchi||analizzaPoesia(p.testo)).forEach(st=>s.push({t:'cantico-str',testo:st,eti:''}));
  return s;
}
function vPoesie(){
  const q=ck(FQ.q);
  const el=tuttePoesie().filter(p=>(FQ.lg==='tutte'||p.lg===FQ.lg) &&
    (!q||ck(p.tit+' '+(p.autore||'')+' '+p.testo).includes(q)));
  pinta(`
  <div class="occhiello">Versi</div>
  <h1>Poesie</h1>
  <p class="sotto">Da leggere o da proiettare, una strofa per volta, con il testo che riempie sempre lo schermo.</p>
  <div class="filtri" style="margin-top:20px">
    <div class="campo" style="flex:0 0 auto"><label>Lingua</label>
      <div class="segm">
        <button class="${FQ.lg==='tutte'?'on':''}" onclick="setQ('lg','tutte')">Tutte</button>
        <button class="${FQ.lg==='it'?'on':''}" onclick="setQ('lg','it')">🇮🇹 Italiano</button>
        <button class="${FQ.lg==='ro'?'on':''}" onclick="setQ('lg','ro')">🇷🇴 Română</button></div></div>
    <div class="campo" style="flex:1 1 220px"><label>Cerca</label>
      <div class="cerca"><input type="search" placeholder="Titolo o parola dei versi…" value="${esc(FQ.q)}"
        oninput="FQ.q=this.value; clearTimeout(window._tpo); window._tpo=setTimeout(vPoesie,260)"></div></div>
    <button class="bt pr" onclick="nuovaPoesia()">✚ Nuova poesia</button>
  </div>
  ${el.length?`<div class="griglia g2">${el.map(p=>{
    const st=p.blocchi||analizzaPoesia(p.testo);
    return `<div class="scheda" style="padding:0;overflow:hidden">
      <div style="height:96px;position:relative;background:#05070c">
        <div style="position:absolute;inset:0">${sfondoHtml(p.sfondo||'alba').replace('class="sfondo"','style="width:100%;height:100%;display:block"')}</div>
        <div style="position:absolute;left:16px;right:16px;bottom:12px">
          <div style="font-family:var(--serif);font-size:19px;color:#fff;text-shadow:0 2px 12px #000">${esc(p.tit)}</div></div>
        <span class="tag ${p.lg==='it'?'it':'ro'}" style="position:absolute;top:10px;right:11px">${p.lg==='it'?'IT':'RO'}</span>
      </div>
      <div style="padding:13px 16px">
        <div style="font-size:12.5px;color:var(--tx3);margin-bottom:10px">${st.length} strofe · ${p.testo.length} caratteri</div>
        <div class="fila">
          <button class="bt mini pr" onclick="proiettaPoesia('${p.i}')">▶︎ Proietta</button>
          <button class="bt mini" onclick="leggiPoesia('${p.i}')">👁 Leggi</button>
          <button class="bt mini pi" onclick="nuovaPoesia('${p.i}')">✎</button>
        </div></div></div>`;}).join('')}</div>`
   :`<div class="vuoto"><span class="em">🪶</span>Nessuna poesia.<br>
     <button class="bt pr" style="margin-top:16px" onclick="nuovaPoesia()">✚ Aggiungi la prima</button></div>`}`);
}
function setQ(k,v){ FQ[k]=v; vPoesie(); }
function trovaPoesia(i){ return tuttePoesie().find(p=>p.i===i); }
function proiettaPoesia(i){ const p=trovaPoesia(i); if(p) proietta(slidePoesia(p),p.sfondo||'alba',p.tit); }
function leggiPoesia(i){
  const p=trovaPoesia(i); if(!p) return;
  const st=p.blocchi||analizzaPoesia(p.testo);
  apri(p.tit,`<div style="font-size:18px;line-height:1.8;white-space:pre-line">${
    st.map(s=>`<div style="margin-bottom:20px">${esc(s)}</div>`).join('')}</div>`,
    `<button class="bt pi" onclick="chiudi()">Chiudi</button>
     <button class="bt pr" onclick="chiudi();proiettaPoesia('${p.i}')">▶︎ Proietta</button>`,660);
}
function nuovaPoesia(i){
  const p = i ? trovaPoesia(i) : null, mia = !p || p.mia;
  apri(p?'Modifica poesia':'Nuova poesia',`
   <div class="griglia" style="gap:13px">
    ${!mia?`<p class="sotto" style="margin:0;color:var(--oro)">Questa viene dall'archivio: salvando ne creo una tua copia.</p>`:''}
    <div class="fila">
      <div class="campo" style="flex:2"><label>Titolo</label><input type="text" id="nyT" value="${esc(p?p.tit:'')}"></div>
      <div class="campo" style="flex:0 0 130px"><label>Lingua</label><select id="nyL">
        <option value="it" ${p&&p.lg==='it'?'selected':''}>Italiano</option>
        <option value="ro" ${!p||p.lg==='ro'?'selected':''}>Română</option></select></div>
    </div>
    <div class="fila">
      <div class="campo" style="flex:1"><label>Autore</label><input type="text" id="nyA" value="${esc(p?p.autore||'':'')}"></div>
      <div class="campo" style="flex:1"><label>Sfondo</label><select id="nyS">
        ${Object.keys(SFONDI).map(k=>`<option value="${k}" ${(p?p.sfondo:'alba')===k?'selected':''}>${SFONDI[k].ic} ${SFONDI[k].et}</option>`).join('')}</select></div>
    </div>
    <div class="campo"><label>Versi — una riga vuota fra una strofa e l'altra</label>
      <textarea id="nyX" style="min-height:230px">${esc(p?p.testo:'')}</textarea></div>
   </div>`,
   `${p&&p.mia?`<button class="bt pi" style="margin-right:auto;color:#ff8b9c" onclick="eliminaPoesia('${p.i}')">Elimina</button>`:''}
    <button class="bt pi" onclick="chiudi()">Annulla</button>
    <button class="bt pr" onclick="salvaPoesia(${p&&p.mia?`'${p.i}'`:'null'})">Salva</button>`,660);
}
function salvaPoesia(i){
  const tit=$('#nyT').value.trim(), testo=$('#nyX').value.trim();
  if(!tit||!testo){ avvisa('Servono titolo e versi','no'); return; }
  stato.poesie=stato.poesie||[];
  const d={tit,lg:$('#nyL').value,autore:$('#nyA').value.trim(),sfondo:$('#nyS').value,testo,mia:true};
  if(i){ const p=stato.poesie.find(x=>x.i===i); Object.assign(p,d); p._b=null; }
  else { d.i='y'+uid(); stato.poesie.push(d); }
  stato.poesie.forEach(p=>{ p.blocchi=analizzaPoesia(p.testo); });
  salva(); chiudi(); vPoesie(); avvisa('Poesia salvata','ok');
}
function eliminaPoesia(i){
  conferma('Vuoi eliminare questa poesia?',()=>{
    stato.poesie=(stato.poesie||[]).filter(p=>p.i!==i); salva(); chiudi(); vPoesie(); avvisa('Eliminata','ok');
  },'Elimina');
}
