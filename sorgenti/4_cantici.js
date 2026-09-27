/* ================= CANTICI ================= */
const FC={ cat:'tutti', lg:'tutte', q:'' };
/* trovati doppi veri nell'archivio azsmr (lo stesso cantico due volte, con
   numeri diversi o con il numero incollato dentro al titolo) — tengo quello
   con il testo più pulito, questi id restano nascosti. Non li tolgo dal file
   dei dati per non spostare gli id (posizionali, 'a'+indice) di tutti quelli
   che vengono dopo — vedi HANDOFF sugli id posizionali delle prediche */
const CANT_VIA=new Set(['a563','a579','a596','a600','a849','a1452','a1430','a1395']);
function tuttiCantici(){
  const via=stato.cantVia||{};
  return CANTICI.concat(stato.cantici).filter(c=>!CANT_VIA.has(c.i) && !via[c.i]);
}
/* le strofe/il ritornello di un cantico sono quasi sempre testo semplice
   (1541 su 1549 non sono mai stati toccati dal foglio nuovo), ma da oggi
   possono anche essere html con la formattazione — questi tre aiutano a
   passare dall'uno all'altro senza dover controllare ogni volta quale dei
   due sia */
function eHtml(s){ return /<[a-z][\s\S]*>/i.test(String(s||'')); }
function plainText(s){
  if(!eHtml(s)) return String(s||'');
  const d=document.createElement('div'); d.innerHTML=String(s).replace(/<br\s*\/?>/gi,' ');
  return (d.textContent||'').replace(/\s+/g,' ').trim();
}
/* un blocco di testo (una strofa, o il ritornello) mostrato dentro a un
   contentEditable: se è già html lo mette così com'è, se è testo semplice
   lo spezza sulle righe vere (una riga = un &lt;p&gt;, come già fa il foglio
   delle prediche) */
function htmlDiBlocco(s){
  if(!s) return '<p><br></p>';
  if(eHtml(s)) return s;
  return String(s).split('\n').map(r=>`<p>${esc(r)||'<br>'}</p>`).join('')||'<p><br></p>';
}
/* la casella "Strofe" tiene tutte le strofe insieme, una riga vuota (un
   &lt;p&gt; vuoto) le separa — esattamente come prima con le righe vuote nel
   testo semplice, solo che qui i paragrafi sono elementi veri */
/* un cantico nuovo parte con le Strofe vuote — ma vuoto vuol dire proprio
   '' (nessun tag), e senza un blocco iniziale a cui agganciarsi il tasto
   Invio dentro al campo non sapeva dove spezzare la riga (provato: le due
   righe scritte restavano incollate una dietro l'altra, senza nemmeno un
   ritorno a capo). Come il foglio delle prediche, che non parte mai vuoto
   sul serio, anche qui ci va sempre almeno un &lt;p&gt;&lt;br&gt;&lt;/p&gt; */
function htmlStrofe(str){
  if(!str||!str.length) return '<p><br></p>';
  return str.map(s=>htmlDiBlocco(s)+'<p><br></p>').join('');
}
function strofeDaHtml(html){
  const d=document.createElement('div'); d.innerHTML=html;
  /* di solito sono tutti &lt;p&gt; (una riga ciascuno); ol/ul possono capitare se
     hai usato un pulsante elenco dentro a una strofa (li tengo interi,
     outerHTML, per non perdere la lista). La PRIMISSIMA riga scritta dentro
     a un campo appena aperto, invece, a volte resta testo nudo senza
     nessun tag intorno (scoperto provando davvero: scritta, salvata,
     spariva) — leggo anche quello, con childNodes e non solo children */
  const gruppi=[]; let corrente=[];
  [...d.childNodes].forEach(n=>{
    if(n.nodeType===3){ if(n.textContent.trim()) corrente.push(esc(n.textContent)); return; }
    if(n.nodeType!==1 || !['P','DIV','OL','UL'].includes(n.tagName)) return;
    if(!n.textContent.trim()){ if(corrente.length){ gruppi.push(corrente); corrente=[]; } }
    else corrente.push(n.tagName==='OL'||n.tagName==='UL' ? n.outerHTML : n.innerHTML);
  });
  if(corrente.length) gruppi.push(corrente);
  return gruppi.map(g=>g.join('<br>'));
}
function filtraCantici(){
  const q=ck(FC.q);
  return tuttiCantici().filter(c=>{
    if(FC.cat!=='tutti' && c.cat!==FC.cat) return false;
    if(FC.lg!=='tutte' && c.lg!==FC.lg) return false;
    if(q){
      if(ck(c.num||'')===q) return true;
      if(!ck((c.num||'')+' '+c.tit+' '+plainText(c.str.join(' '))+' '+plainText(c.rit||'')).includes(q)) return false;
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
  <h1>Cantici</h1>

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
        <span>${c.str.length} strofe${c.rit?' · con ritornello':''} · ${esc(plainText(c.str[0]||'').slice(0,70))}</span></div>
      <div class="az">
        <span class="tag ${c.lg==='it'?'it':'ro'}">${c.lg==='it'?'IT':'RO'}</span>
        <span class="tag">${RACCOLTE[c.cat]?RACCOLTE[c.cat].br:esc(c.cat)}</span>
        ${haMusica(c)?`<button class="bt mini or" onclick="event.stopPropagation();suona('${c.i}')" title="Ascolta">▶︎♪</button>`:''}
        <button class="bt mini pr" onclick="event.stopPropagation();proiettaCantico('${c.i}')">▶︎</button>
        <button class="bt mini pi" style="color:#ff8b9c" onclick="event.stopPropagation();eliminaCantico('${c.i}')" title="Togli dall'elenco">🗑</button>
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
          <div class="cs-tx">${eHtml(s)?s:esc(s)}</div></div>
        ${c.rit?`<div class="cs-str rit">
          <div class="cs-eti">Ritornello</div>
          <div class="cs-tx">${eHtml(c.rit)?c.rit:esc(c.rit)}</div></div>`:''}`).join('')}
      <div class="cs-amen">Amen!</div></div>`,
    `${c.mio?`<button class="bt pi" style="color:#ff8b9c" onclick="eliminaCantico('${c.i}')">Elimina</button>`:''}
     <div class="segm pic"><button onclick="zoomCantico(-2)">A−</button><button onclick="zoomCantico(2)">A+</button></div>
     <button class="bt pi" onclick="nuovoCantico('${c.i}')">✎ Modifica</button>
     <button class="bt pr" onclick="chiudi();proiettaCantico('${c.i}')">▶︎ Proietta</button>`,760,'alto chiaro');
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
    s.push({t:'cantico-str',testo:plainText(st)});
    if(c.rit) s.push({t:'cantico-str',testo:plainText(c.rit),rit:true});
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
/* il numero successivo libero in quella raccolta: 1 se è vuota */
function prossimoNumeroCantico(cat){
  const n=tuttiCantici().filter(c=>c.cat===cat).map(c=>parseInt(c.num)||0);
  return (n.length?Math.max.apply(null,n):0)+1;
}
/* cambiando la raccolta di un cantico NUOVO, il numero proposto cambia con
   lei — non tocca i cantici che stai modificando (lì il numero resta libero) */
function aggiornaProssimoNumeroCantico(){
  const n=$('#ncN'); if(!n) return;
  n.value=prossimoNumeroCantico($('#ncC').value);
}
/* la stessa barra di formattazione delle prediche/poesie/esperienze, ma
   senza i pulsanti che lì guardano #foglioPr scritto a mano (misura della
   selezione, il segno ¶) o che servono a un id preciso (la figura): qui
   dentro a un modulo, non nel foglio a schermo intero, e la selezione può
   essere sia nelle Strofe sia nel Ritornello — ⇣Z e ¶ ora cercano da soli il
   campo scritto vero (vedi ordinaRighe/toggleSegniParagrafo in 5_prediche.js),
   quindi funzionano bene anche qui */
function barraCantico(){
  return `<div class="bs" style="flex-wrap:wrap;border-right:0">
    <button class="bx" onmousedown="cmd(event,'undo')" title="Annulla l'ultima azione">↶</button>
    <button class="bx" onmousedown="cmd(event,'bold')" title="Grassetto"><b>B</b></button>
    <button class="bx" onmousedown="cmd(event,'italic')" title="Corsivo"><i>I</i></button>
    <button class="bx" onmousedown="cmd(event,'underline')" title="Sottolineato"><u>U</u></button>
    <button class="bx" onmousedown="cmd(event,'strikeThrough')" title="Barrato"><s>S</s></button>
    <button class="bx" onmousedown="cmd(event,'subscript')" title="Pedice">X₂</button>
    <button class="bx" onmousedown="cmd(event,'superscript')" title="Apice">X²</button>
    <select class="bsel" onchange="cmdVal(event,'fontName',FAMIGLIE[this.value])" title="Carattere di quello che hai scelto">
      <option value="">Aa</option>
      ${Object.keys(FAMIGLIE).map(k=>`<option value="${k}">${NOMI_FAM[k]}</option>`).join('')}</select>
    <button class="bx col-bt" onclick="apriMaiuscole(event)" title="Maiuscole/minuscole">Aa▾</button>
    <button class="bx col-bt" onclick="apriColori(event,'Colore di quello che hai scelto',COL_TESTO,'#000000',c=>document.execCommand('foreColor',false,c))" title="Colore"><b style="color:#e6203f">A</b>▾</button>
    <button class="bx col-bt" onclick="apriColori(event,'Evidenziatore',COL_EVID,'#ffe14d',c=>evidenziaCol(c))" title="Evidenziatore">🖍▾</button>
    <button class="bx" onmousedown="evidenziaCol('transparent',event)" title="Togli l'evidenziatore">⌫</button>
    <button class="bx" onmousedown="cmd(event,'justifyLeft')" title="A sinistra">⬅︎</button>
    <button class="bx" onmousedown="cmd(event,'justifyCenter')" title="Al centro">↔︎</button>
    <button class="bx" onmousedown="cmd(event,'justifyRight')" title="A destra">➡︎</button>
    <button class="bx" onmousedown="cmd(event,'outdent')" title="Diminuisce il rientro">⇤</button>
    <button class="bx" onmousedown="cmd(event,'indent')" title="Aumenta il rientro">⇥</button>
    <button class="bx" onmousedown="cmdLista(event,'insertUnorderedList')" title="Elenco puntato">•</button>
    <button class="bx" onmousedown="cmdLista(event,'insertOrderedList')" title="Elenco numerato">1.</button>
    <button class="bx" onmousedown="cmdLista(event,'insertOrderedList','lower-alpha')" title="Elenco a lettere">a.</button>
    <button class="bx" onmousedown="cmd(event,'formatBlock','h3')" title="Titoletto">H</button>
    <button class="bx" onmousedown="ordinaRighe(event)" title="Ordina le righe scelte dalla A alla Z">A⇣Z</button>
    <button class="bx" onmousedown="event.preventDefault();toggleSegniParagrafo()" title="Mostra/nascondi dove finisce ogni riga">¶</button>
    <button class="bx" onmousedown="cmd(event,'removeFormat')" title="Togli la formattazione">✕</button>
  </div>`;
}
function nuovoCantico(id){
  const c = id ? trovaCantico(id) : null;
  apri(c?'Modifica cantico':'Nuovo cantico',`
   <div class="griglia" style="gap:13px">
    ${c&&!c.mio?`<p class="sotto" style="margin:0;color:var(--oro)">Questo viene dall'archivio: salvando ne creo una tua copia.</p>`:''}
    <div class="fila">
      <div class="campo" style="flex:0 0 110px"><label>Numero</label>
        <input type="text" id="ncN" value="${esc(c?c.num||'':prossimoNumeroCantico('ovidiu'))}" ${c?'':'readonly title="Lo assegna da solo, in base alla raccolta scelta"'}></div>
      <div class="campo" style="flex:1"><label>Titolo</label><input type="text" id="ncT" value="${esc(c?c.tit:'')}"></div>
    </div>
    <div class="fila">
      <div class="campo" style="flex:1"><label>Raccolta</label><select id="ncC" ${c?'':'onchange="aggiornaProssimoNumeroCantico()"'}>
        ${Object.keys(RACCOLTE).map(k=>`<option value="${k}" ${(c?c.cat:'ovidiu')===k?'selected':''}>${RACCOLTE[k].et}</option>`).join('')}</select></div>
      <div class="campo" style="flex:1"><label>Lingua</label><select id="ncL">
        <option value="it" ${c&&c.lg==='it'?'selected':''}>Italiano</option>
        <option value="ro" ${!c||c.lg==='ro'?'selected':''}>Română</option></select></div>
    </div>
    <div class="campo">
      ${barraCantico()}
      <div class="campo" style="margin-top:10px"><label>Strofe — lascia una riga vuota fra una strofa e l'altra</label>
        <div id="ncS" class="ce-campo" contenteditable="true" style="min-height:190px">${htmlStrofe(c?c.str:[])}</div></div>
      <div class="campo" style="margin-top:10px"><label>Ritornello — se c'è, viene proiettato dopo ogni strofa</label>
        <div id="ncR" class="ce-campo" contenteditable="true" style="min-height:70px">${htmlDiBlocco(c?c.rit:'')}</div></div>
    </div>
   </div>`,
   `<button class="bt pi" onclick="chiudi()">Annulla</button>
    <button class="bt pr" onclick="salvaCantico(${c&&c.mio?`'${c.i}'`:'null'})">Salva</button>`,860,'chiaro');
  document.execCommand('styleWithCSS',false,true);
  try{ document.execCommand('defaultParagraphSeparator',false,'p'); }catch(e){}
}
function salvaCantico(id){
  const tit=$('#ncT').value.trim();
  const str=strofeDaHtml($('#ncS').innerHTML);
  if(!tit||!str.length){ avvisa('Servono il titolo e almeno una strofa','no'); return; }
  const rit=$('#ncR').textContent.trim()?$('#ncR').innerHTML.trim():'';
  const dati={ cat:$('#ncC').value, lg:$('#ncL').value, num:$('#ncN').value.trim(),
               tit, str, rit, mio:true, audio:'' };
  if(id){ Object.assign(stato.cantici.find(c=>c.i===id), dati); }
  else { dati.i='m'+uid(); stato.cantici.push(dati); }
  salva(); chiudi(); vCantici(); avvisa('Cantico salvato','ok');
}
function eliminaCantico(id){
  const c=trovaCantico(id);
  conferma('Vuoi togliere «'+((c&&c.tit)||'questo cantico')+'» dall\'elenco?\n\nLo puoi rimettere quando vuoi da ☁️ Dati.',()=>{
    stato.cantici=stato.cantici.filter(x=>x.i!==id);
    stato.cantVia=stato.cantVia||{}; stato.cantVia[id]=1;
    salva(); chiudi(); vCantici(); avvisa('Tolto dall\'elenco','ok');
  },'Elimina');
}
