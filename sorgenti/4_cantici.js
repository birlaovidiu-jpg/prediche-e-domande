/* ================= CANTICI ================= */
const FC={ cat:'tutti', lg:'tutte', q:'' };
function tuttiCantici(){ return CANTICI.concat(stato.cantici); }
function filtraCantici(){
  const q=ck(FC.q);
  return tuttiCantici().filter(c=>{
    if(FC.cat!=='tutti' && c.cat!==FC.cat) return false;
    if(FC.lg!=='tutte' && c.lg!==FC.lg) return false;
    if(q){
      if(ck(c.num||'')===q) return true;
      if(!ck((c.num||'')+' '+c.tit+' '+c.str.join(' ')+' '+(c.rit||'')).includes(q)) return false;
    }
    return true;
  }).sort((a,b)=>{
    const na=parseInt(a.num)||99999, nb=parseInt(b.num)||99999;
    return na-nb || a.tit.localeCompare(b.tit,'it');
  });
}
function vCantici(){
  const el=filtraCantici();
  const conta=c=>tuttiCantici().filter(x=>x.cat===c).length;
  pinta(`
  <div class="occhiello">Innari</div>
  <h1>Cantici</h1>
  <p class="sotto">Cerca per titolo, per numero o per una parola qualsiasi del testo. In proiezione il ritornello torna dopo ogni strofa e l'ultima diapositiva porta l'<i>Amen!</i></p>
  <p class="sotto" style="font-size:12.5px;color:var(--tx3)">Fonti: rumeno <b>azsmr.ro</b> · italiano <b>Edizioni ADV</b>.</p>

  <div class="filtri" style="margin-top:18px">
    <div class="campo" style="flex:1 1 100%"><label>Raccolta</label>
      <div class="segm" style="flex-wrap:wrap">
        <button class="${FC.cat==='tutti'?'on':''}" onclick="setC('cat','tutti')">Tutte · ${tuttiCantici().length}</button>
        ${Object.keys(RACCOLTE).map(k=>`<button class="${FC.cat===k?'on':''}" onclick="setC('cat','${k}')">
          ${RACCOLTE[k].ic} ${RACCOLTE[k].br} · ${conta(k)}</button>`).join('')}
      </div></div>
    <div class="campo" style="flex:0 0 auto"><label>Lingua</label>
      <div class="segm">
        <button class="${FC.lg==='tutte'?'on':''}" onclick="setC('lg','tutte')">Tutte</button>
        <button class="${FC.lg==='it'?'on':''}" onclick="setC('lg','it')">🇮🇹</button>
        <button class="${FC.lg==='ro'?'on':''}" onclick="setC('lg','ro')">🇷🇴</button></div></div>
    <div class="campo" style="flex:1 1 240px"><label>Cerca</label>
      <div class="cerca"><input type="search" placeholder="Titolo, numero o una parola del testo…" value="${esc(FC.q)}"
        oninput="FC.q=this.value; clearTimeout(window._tc); window._tc=setTimeout(elencoCantici,220)"></div></div>
    <button class="bt pi" onclick="nuovoCantico()">✚ Nuovo</button>
    <button class="bt pi" onclick="caricaMusica()">🎵 Musica</button>
  </div>

  <h2>Elenco <span class="pill" id="cntC">${el.length.toLocaleString('it-IT')}</span></h2>
  <div id="elC"></div>`);
  elencoCantici();
}
function setC(k,v){ FC[k]=v; vCantici(); }
function elencoCantici(){
  const el=filtraCantici(), m=el.slice(0,150);
  const c=$('#elC'); if(!c) return;
  const n=$('#cntC'); if(n) n.textContent=el.length.toLocaleString('it-IT');
  c.innerHTML = el.length ? `<div class="el">${m.map(c=>`
    <div class="rg" onclick="vediCantico('${c.i}')">
      <div class="num">${esc(c.num||'—')}</div>
      <div class="cp"><b>${esc(c.tit)}</b>
        <span>${c.str.length} strofe${c.rit?' · con ritornello':''} · ${esc((c.str[0]||'').split('\n')[0])}</span></div>
      <div class="az">
        <span class="tag ${c.lg==='it'?'it':'ro'}">${c.lg==='it'?'IT':'RO'}</span>
        <span class="tag">${RACCOLTE[c.cat]?RACCOLTE[c.cat].br:esc(c.cat)}</span>
        ${haMusica(c)?`<button class="bt mini or" onclick="event.stopPropagation();suona('${c.i}')" title="Ascolta">▶︎♪</button>`:''}
        <button class="bt mini pr" onclick="event.stopPropagation();proiettaCantico('${c.i}')">▶︎</button>
      </div></div>`).join('')}</div>
    ${el.length>m.length?`<p style="text-align:center;color:var(--tx3);margin-top:16px;font-size:13px">Mostrati i primi ${m.length} di ${el.length.toLocaleString('it-IT')} — usa la ricerca.</p>`:''}`
    : `<div class="vuoto"><span class="em">🎵</span>Nessun cantico trovato.</div>`;
}
function trovaCantico(id){ return tuttiCantici().find(c=>c.i===id); }

/* ---------- lettura normale, testo grande ---------- */
function vediCantico(id){
  const c=trovaCantico(id); if(!c) return;
  apri(`${c.num?c.num+'. ':''}${c.tit}`,
    `<div id="muBar" class="mu-bar"></div>
     <div class="cantico-testo" id="cantTesto">${
      c.str.map((s,k)=>`
        <div class="cs-str">
          <div class="cs-eti">Strofa ${k+1}</div>
          <div class="cs-tx">${esc(s)}</div></div>
        ${c.rit?`<div class="cs-str rit">
          <div class="cs-eti">Ritornello</div>
          <div class="cs-tx">${esc(c.rit)}</div></div>`:''}`).join('')}
      <div class="cs-amen">Amen!</div></div>`,
    `${c.mio?`<button class="bt pi" style="color:#ff8b9c" onclick="eliminaCantico('${c.i}')">Elimina</button>`:''}
     <div class="segm pic"><button onclick="zoomCantico(-2)">A−</button><button onclick="zoomCantico(2)">A+</button></div>
     <button class="bt pi" onclick="nuovoCantico('${c.i}')">✎ Modifica</button>
     <button class="bt pr" onclick="chiudi();proiettaCantico('${c.i}')">▶︎ Proietta</button>`,760,'alto');
  barraMusica(c.i);
}
/* ---------- la base musicale, dentro alla finestra del cantico ---------- */
async function barraMusica(id){
  const b=$('#muBar'), c=trovaCantico(id);
  if(!b||!c) return;
  const url=await urlMusica(c);
  b.innerHTML = url
    ? `<audio class="mu-let" controls preload="none" src="${esc(url)}"></audio>
       <button class="bt pi mini" onclick="cambiaBase('${c.i}')" title="Metti un altro file">🎵 Cambia</button>`
    : `<span class="mu-no">Base musicale non ancora messa</span>
       <button class="bt or mini" onclick="cambiaBase('${c.i}')">🎵 Aggiungi la base</button>`;
  const a=b.querySelector('audio');
  if(a) a.onerror=()=>{ b.innerHTML=`<span class="mu-no">Il file non si trova più</span>
      <button class="bt or mini" onclick="cambiaBase('${c.i}')">🎵 Rimetti la base</button>`; };
}
function cambiaBase(id){
  const f=document.createElement('input');
  f.type='file'; f.accept='audio/*,video/mp4';
  f.onchange=async()=>{
    const file=f.files[0]; if(!file) return;
    const chiave='mu'+uid();
    try{
      await salvaAllegato(chiave,file);
      stato.musica=stato.musica||{}; stato.musica[id]=chiave;
      salva(); avvisa('Base musicale aggiunta','ok');
      barraMusica(id);
      const el=document.querySelector('#vista');
      if(el&&sezione==='cantici') elencoCantici();
    }catch(e){ avvisa('Non sono riuscito a salvare il file','no'); }
  };
  f.click();
}
async function urlMusica(c){
  const salvato = stato.musica && stato.musica[c.i];
  if(salvato){
    if(!fileUrl[salvato]){ try{ const b=await kvGet('all:'+salvato); if(b) fileUrl[salvato]=URL.createObjectURL(b); }catch(e){} }
    if(fileUrl[salvato]) return fileUrl[salvato];
  }
  if(c.audio){
    const cart=(stato.imp.cartellaMusica||'').replace(/\/+$/,'');
    const rac=RACCOLTE[c.cat] ? {avventista:'Innario avventista',riformista:'Nuovo innario riformista',azsmr:'Imnuri azsmr',ovidiu:''}[c.cat] : '';
    return (cart?cart+'/':'') + (rac?rac+'/':'') + c.audio;
  }
  return null;
}
function zoomCantico(d){ const b=$('#cantTesto'); if(!b) return;
  const c=parseFloat(getComputedStyle(b).fontSize);
  b.style.fontSize=Math.max(14,Math.min(46,c+d))+'px'; }

/* ---------- proiezione: ritornello dopo ogni strofa, Amen! alla fine ---------- */
function slideCantico(c){
  const s=[{t:'cantico-tit',tit:c.tit,num:c.num}];
  c.str.forEach((st,k)=>{
    s.push({t:'cantico-str',testo:st});
    if(c.rit) s.push({t:'cantico-str',testo:c.rit,rit:true});
  });
  if(s.length>1) s[s.length-1].amen=true;   /* l'Amen! va sull'ultima diapositiva */
  return s;
}
function proiettaCantico(id,conRegia){
  const c=trovaCantico(id); if(!c) return;
  /* mi ricordo di che cantico si tratta: serve per il pulsante della base */
  PROI.cantico=c.i; PROI._tienCantico=true;
  if(conRegia) apriRegia(slideCantico(c),'nero',c.tit);
  else proietta(slideCantico(c), 'nero', c.tit, true);   /* fondo nero e strofe tutte uguali */
}

/* ---------- musica ---------- */
function haMusica(c){ return !!(c.audio || (stato.musica&&stato.musica[c.i])); }
async function suona(id){
  const c=trovaCantico(id); if(!c) return;
  const url=await urlMusica(c);
  if(!url){ avvisa('Per questo cantico non c\'è musica','no'); return; }
  apri(`${c.num?c.num+'. ':''}${c.tit}`,
    `<audio id="lettoreAudio" controls autoplay style="width:100%" src="${esc(url)}"></audio>
     <p class="sotto" style="margin-top:12px;font-size:12.5px">Se non parte, il file non è raggiungibile da qui:
     aggiungilo con <b>🎵 Musica</b> e resterà dentro al programma.</p>`,
    `<button class="bt pi" onclick="chiudi()">Chiudi</button>`,520);
  const a=$('#lettoreAudio');
  if(a) a.onerror=()=>{ avvisa('File audio non raggiungibile','no'); };
}
function caricaMusica(){
  const conNome=tuttiCantici().filter(c=>c.audio).length;
  const salvati=Object.keys(stato.musica||{}).length;
  apri('Musica dei cantici',`
    <p class="sotto" style="margin-top:0">Di <b>${conNome}</b> cantici conosco già il nome del file audio; ne hai messi dentro al programma <b>${salvati}</b>.</p>
    <div class="campo"><label>Aggiungi i file audio — puoi sceglierne molti insieme, li abbino io dal numero</label>
      <input type="file" id="muF" accept="audio/*,video/mp4" multiple></div>
    <div id="muAnt" style="font-size:12.5px;color:var(--tx3);margin-top:10px"></div>
    <div style="margin-top:16px;border-top:1px solid var(--bordo);padding-top:14px">
      <div class="campo"><label>Oppure: cartella dove tieni gli innari, se il programma sta lì vicino</label>
        <input type="text" id="muC" value="${esc(stato.imp.cartellaMusica||'')}" placeholder="es. inni">
        <span style="font-size:12px;color:var(--tx3)">Lasciala vuota se il programma sta già dentro la cartella degli innari.</span></div>
    </div>`,
    `<button class="bt pi" onclick="chiudi()">Chiudi</button>
     <button class="bt pr" onclick="salvaMusica()">Salva</button>`,640);
}
async function salvaMusica(){
  stato.imp.cartellaMusica=$('#muC').value.trim();
  const f=[...$('#muF').files];
  let n=0;
  stato.musica=stato.musica||{};
  for(const file of f){
    const m=/(\d{1,4})/.exec(file.name);
    if(!m) continue;
    const num=m[1].replace(/^0+/,'')||'0';
    /* abbino per numero, nella raccolta che ha quel nome di file */
    let c=tuttiCantici().find(x=>x.audio===file.name)
       || tuttiCantici().find(x=>String(x.num)===num && ck(x.tit).slice(0,10)&&ck(file.name).includes(ck(x.tit).slice(0,10)))
       || tuttiCantici().find(x=>String(x.num)===num);
    if(!c) continue;
    const id='mu'+uid();
    try{ await salvaAllegato(id,file); stato.musica[c.i]=id; n++; }catch(e){}
  }
  salva(); chiudi(); vCantici();
  avvisa(n?`Aggiunti ${n} file di musica`:'Impostazione salvata','ok');
}

/* ---------- inserimento e modifica ---------- */
function nuovoCantico(id){
  const c = id ? trovaCantico(id) : null;
  apri(c?'Modifica cantico':'Nuovo cantico',`
   <div class="griglia" style="gap:13px">
    ${c&&!c.mio?`<p class="sotto" style="margin:0;color:var(--oro)">Questo viene dall'archivio: salvando ne creo una tua copia.</p>`:''}
    <div class="fila">
      <div class="campo" style="flex:0 0 110px"><label>Numero</label><input type="text" id="ncN" value="${esc(c?c.num||'':'')}"></div>
      <div class="campo" style="flex:1"><label>Titolo</label><input type="text" id="ncT" value="${esc(c?c.tit:'')}"></div>
    </div>
    <div class="fila">
      <div class="campo" style="flex:1"><label>Raccolta</label><select id="ncC">
        ${Object.keys(RACCOLTE).map(k=>`<option value="${k}" ${(c?c.cat:'ovidiu')===k?'selected':''}>${RACCOLTE[k].et}</option>`).join('')}</select></div>
      <div class="campo" style="flex:1"><label>Lingua</label><select id="ncL">
        <option value="it" ${c&&c.lg==='it'?'selected':''}>Italiano</option>
        <option value="ro" ${!c||c.lg==='ro'?'selected':''}>Română</option></select></div>
    </div>
    <div class="campo"><label>Strofe — lascia una riga vuota fra una strofa e l'altra</label>
      <textarea id="ncS" style="min-height:200px">${esc(c?c.str.join('\n\n'):'')}</textarea></div>
    <div class="campo"><label>Ritornello — se c'è, viene proiettato dopo ogni strofa</label>
      <textarea id="ncR" style="min-height:80px">${esc(c?c.rit||'':'')}</textarea></div>
   </div>`,
   `<button class="bt pi" onclick="chiudi()">Annulla</button>
    <button class="bt pr" onclick="salvaCantico(${c&&c.mio?`'${c.i}'`:'null'})">Salva</button>`,660);
}
function salvaCantico(id){
  const tit=$('#ncT').value.trim();
  const str=$('#ncS').value.split(/\n\s*\n/).map(s=>s.trim()).filter(Boolean);
  if(!tit||!str.length){ avvisa('Servono il titolo e almeno una strofa','no'); return; }
  const dati={ cat:$('#ncC').value, lg:$('#ncL').value, num:$('#ncN').value.trim(),
               tit, str, rit:$('#ncR').value.trim(), mio:true, audio:'' };
  if(id){ Object.assign(stato.cantici.find(c=>c.i===id), dati); }
  else { dati.i='m'+uid(); stato.cantici.push(dati); }
  salva(); chiudi(); vCantici(); avvisa('Cantico salvato','ok');
}
function eliminaCantico(id){
  conferma('Vuoi eliminare questo cantico?',()=>{
    stato.cantici=stato.cantici.filter(c=>c.i!==id); salva(); chiudi(); vCantici(); avvisa('Eliminato','ok');
  },'Elimina');
}
