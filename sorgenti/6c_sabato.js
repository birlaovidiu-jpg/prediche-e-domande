/* ================= SCUOLA DEL SABATO — lezionari ================= */
const FL={ lg:'', anno:0, q:'' };
const TRIM=[['1','Gen–Mar','gennaio · febbraio · marzo'],['2','Apr–Giu','aprile · maggio · giugno'],
            ['3','Lug–Set','luglio · agosto · settembre'],['4','Ott–Dic','ottobre · novembre · dicembre']];
const TRIM_RO=['Ian–Mar','Apr–Iun','Iul–Sep','Oct–Dec'];
function lezionari(){ return (stato.lezionari||[]).slice(); }
function annoUltimo(){ const a=lezionari().map(l=>+l.anno||0); return a.length?Math.max(...a):0; }

/* i lezionari caricati prima possono avere il trimestre sbagliato,
   perché il riconoscimento di allora si confondeva con la parola «mai».
   Li ricontrollo una volta sola, senza toccare quelli corretti a mano. */
function ricontrollaTrimestri(){
  let cambiati=0;
  lezionari().forEach(l=>{
    if(l.trimRifatto || l.trimMano || !(l.testo||[]).length) return;
    const tr=trimestreDelTesto((l.testo||[]).slice(0,6).join(' '), l.lg);
    if(tr>=1 && tr<=4 && tr!==+l.trim){ l.trim=tr; cambiati++; }
    l.trimRifatto=true;
  });
  if(cambiati) salva();
  return cambiati;
}
function vSabato(){
  ricontrollaTrimestri();
  ricontrollaDate();
  const tutti=lezionari();
  const anni=[...new Set(tutti.map(l=>+l.anno||0))].filter(Boolean).sort((a,b)=>b-a);
  /* sempre UN anno e UNA lingua alla volta: mai «tutte/tutti» */
  if(FL.lg!=='it' && FL.lg!=='ro') FL.lg = stato.imp.lingua==='ro' ? 'ro' : 'it';
  if(!anni.includes(FL.anno)) FL.anno = anni[0] || new Date().getFullYear();
  const q=ck(FL.q);
  const corrisponde=l=> !q || ck((l.titolo||'')+' '+l.anno+' '+(l.mesi||'')+' '+(l.testo||[]).join(' ')).includes(q);
  /* «contiene il sabato di oggi» va cercato DENTRO alla lingua che sto
     guardando: «lezionarioDiOggi()» sceglie una sola lingua per tutto il
     programma (quella di stato.imp.lingua) e in rumeno restava sempre
     vuoto, perché l'italiano vinceva sempre il confronto. */
  const sabatoDiOggi=prossimoSabato();
  const contieneOggi=l=>{
    const lez=(l.lezioni||[]).filter(x=>x.data);
    if(!lez.length) return false;
    const s=iso(sabatoDiOggi);
    return lez.some(x=>x.data===s) || (lez.some(x=>x.data<=s) && lez.some(x=>x.data>=s));
  };
  /* se le date dentro a un lezionario mancano o non tornano (succede coi lezionari messi dentro
     tempo fa, soprattutto in italiano, dove le lezioni non hanno l'anno scritto), conta il posto
     in cui è messo: l'anno e il trimestre del sabato che viene */
  const delTrimestreDiOggi=l=>+l.anno===sabatoDiOggi.getFullYear() && +l.trim===Math.floor(sabatoDiOggi.getMonth()/3)+1;
  const delFiltro=tutti.filter(l=>l.lg===FL.lg && +l.anno===FL.anno);
  /* (fra due dello stesso trimestre, quello con più pagine: non una copertina sola) */
  const diOggiFiltro = delFiltro.find(contieneOggi)
    || delFiltro.filter(delTrimestreDiOggi).sort((a,b)=>(b.pagine||0)-(a.pagine||0))[0] || null;
  const inEvidenza = diOggiFiltro || delFiltro.slice().sort((a,b)=>b.trim-a.trim)[0] || null;
  const lezOggi = inEvidenza ? lezioneDelSabato(inEvidenza) : null;

  document.body.classList.add('sab-fissa');
  pinta(`
  <div class="sab-pagina">
  <div class="sab-testa">
    <div><h1>Scuola del Sabato</h1></div>
  </div>

  ${inEvidenza?`
  <div class="lez-hero">
    <div class="lez-cop" data-i="${inEvidenza.i}" data-apre="1">
      ${inEvidenza.cop?`<img src="${inEvidenza.cop}" alt="">`:`<div class="lez-noco">📘</div>`}
    </div>
    <div class="lez-info">
      <h2 class="lez-tit">${esc(inEvidenza.titolo||('Lezionario '+inEvidenza.anno))}</h2>
      <div class="lez-anno">${esc(inEvidenza.anno)}</div>
      ${lezOggi?`<div class="lez-sabato" onclick="apriLez('${inEvidenza.i}',${lezOggi.pag})">
        <span>Lezione di questo sabato</span>
        <b>${lezOggi.n}. ${esc(lezOggi.tit)}</b>
        <i>${esc(dataLunga(lezOggi.data,inEvidenza.lg))}</i></div>`:''}
      <div class="fila lez-bt">
        <button class="bt pr" onclick="apriLez('${inEvidenza.i}')">📖 ${lezOggi?'Apri alla lezione di sabato':'Apri e studia'}</button>
        <button class="bt pi" onclick="apriIndiceDaFuori('${inEvidenza.i}')">☰ Indice</button>
        <button class="bt pi" onclick="condividiLez('${inEvidenza.i}')">📤 Condividi</button>
        <button class="bt pi" onclick="modificaLez('${inEvidenza.i}')">✎</button>
        <button class="bt pi" style="color:#ff8b9c" onclick="eliminaLez('${inEvidenza.i}')">🗑 Elimina</button>
      </div>
      <div class="lez-pie">
        ${inEvidenza.pagine||'?'} pagine${inEvidenza.note&&Object.keys(inEvidenza.note).length?` · ${Object.keys(inEvidenza.note).length} pagine con appunti`:''}</div>
    </div>
  </div>`:''}

  <div class="filtri sab-filtri">
    <div class="campo" style="flex:0 0 auto"><label>Lingua</label>
      <div class="segm">
        <button class="${FL.lg==='it'?'on':''}" onclick="setL('lg','it')">🇮🇹 Italiano</button>
        <button class="${FL.lg==='ro'?'on':''}" onclick="setL('lg','ro')">🇷🇴 Română</button></div></div>
    <div class="campo" style="flex:0 0 auto"><label>Anno</label>
      <select class="tendina" onchange="setL('anno',+this.value)">
        ${anni.length?anni.map(a=>`<option value="${a}" ${FL.anno===a?'selected':''}>${a}</option>`).join('')
          :`<option value="${FL.anno}" selected>${FL.anno}</option>`}
      </select></div>
    <div class="campo sab-cerca-campo" style="flex:1 1 150px;max-width:320px"><label>Cerca</label>
      <div class="cerca senza-lente"><input type="search" placeholder="Una parola dentro al lezionario…"
        value="${esc(FL.q)}" oninput="FL.q=this.value; clearTimeout(window._tl); window._tl=setTimeout(vSabato,300)"></div></div>
    <button class="bt pr" style="margin-left:auto" onclick="nuovoLez()">✚ Aggiungi lezionario</button>
  </div>

  <div class="sab-elenco">
    <div class="griglia g4 sab-griglia">${TRIM.map(([n,br,mesi])=>{
      const etichetta=FL.lg==='ro'?TRIM_RO[+n-1]:br;
      /* se nello stesso trimestre ce n'è più di uno, mostro quello di oggi (non una copertina sola) */
      const stessi=delFiltro.filter(x=>+x.trim===+n);
      const l=stessi.find(x=>diOggiFiltro && x.i===diOggiFiltro.i) || stessi[0];
      if(!l || !corrisponde(l)) return `
        <div class="tess lez-carta lez-vuota" onclick="nuovoLezPer(${FL.anno},'${FL.lg}',${n})"
          title="Aggiungi il lezionario di ${esc(etichetta)}">
          <span class="lv-piu">✚</span><b>${esc(etichetta)}</b><span>${esc(mesi)}</span></div>`;
      const oggi=diOggiFiltro && diOggiFiltro.i===l.i;
      return `
        <div class="tess lez-carta${oggi?' oggi':''}" style="padding:0" data-i="${l.i}" data-apre="1"${oggi?' data-oggi="1"':''}>
          <div class="lez-mini">${l.cop?`<img src="${l.cop}" alt="">`:'<div class="lez-noco">📘</div>'}
            <span class="lez-bollo">${esc(etichetta)}</span>${oggi?'<span class="lez-oggi">Oggi</span>':''}
            <div class="lez-piede">
              <span class="lez-pt"><b class="lez-nome">${esc(l.titolo||('Lezionario '+l.anno))}</b>
                <span>${l.pagine||'?'} pagine</span></span>
              <button class="lez-cest" title="Elimina" onclick="event.stopPropagation();eliminaLez('${l.i}')">🗑</button>
            </div>
          </div></div>`;
    }).join('')}</div>
  </div>
  </div>`);
  attaccaPressioneLunga();
  copertineSoloFronte();
}
/* Le copertine messe dentro prima erano la pagina intera: se il file era doppio (retro e
   fronte affiancati) si vedeva un pezzo di qua e un pezzo di là. Le rifaccio col solo
   fronte, una volta sola per lezionario. Prima subito, ritagliando l'immagine che ho
   (così l'errore sparisce all'istante); poi con calma, dal PDF della copertina se c'è
   ancora, per averla nitida. Il PDF lo provo UNA volta sola: se un file enorme mandasse in
   crisi l'iPad, non lo riprovo a ogni apertura. */
let _copertineInCorso=false;
const _rapportoImmagine=src=>new Promise(ok=>{ const i=new Image();
  i.onload=()=>ok(i.naturalWidth/i.naturalHeight); i.onerror=()=>ok(0); i.src=src; });
async function copertineSoloFronte(){
  if(_copertineInCorso) return 0;
  const vecchie=lezionari().filter(l=>l.cop && !l.copFronte);
  const daAffinare=()=>lezionari().filter(l=>l.copRifare && !l.copProve);
  if(!vecchie.length && !daAffinare().length) return 0;
  _copertineInCorso=true;
  const aggiorna=()=>{ if(sezione==='sabato' && !nelLettore() && $('.sab-pagina')) vSabato(); };
  let rifatte=0;
  try{
    for(const l of vecchie){
      try{
        if(await _rapportoImmagine(l.cop)>COP_DOPPIA){
          l.cop=await fronteDaImmagine(l.cop); rifatte++;
          if(l.cid||l.fid) l.copRifare=true;
        }
      }catch(e){}
      l.copFronte=true;
    }
    salva();
    if(rifatte) aggiorna();
    for(const l of daAffinare()){
      l.copProve=1; salva();
      try{
        await caricaPdfJs();
        let nuova=null;
        for(const id of [l.cid,l.fid]){
          if(!id || nuova) continue;
          const b=await kvGet('all:'+id); if(!b) continue;
          const doc=await pdfjsLib.getDocument({data:new Uint8Array(await b.arrayBuffer())}).promise;
          const img=await copertinaInImmagine(doc,520);
          try{ doc.destroy(); }catch(e){}
          if(await _rapportoImmagine(img)<=COP_DOPPIA) nuova=img;
        }
        if(nuova) l.cop=nuova;
      }catch(e){}
      l.copRifare=false; salva();
      aggiorna();
    }
  }finally{ _copertineInCorso=false; }
  return rifatte;
}
function setL(k,v){ FL[k]=v; vSabato(); }
/* clicco su un trimestre vuoto: apro «Aggiungi lezionario» già pronto */
function nuovoLezPer(anno,lg,trim){
  nuovoLez();
  const l=$('#nlL'), a=$('#nlA'), t=$('#nlT');
  if(l) l.value=lg; if(a) a.value=anno; if(t) t.value=trim;
}
/* Tocco per aprire, pressione lunga per condividere — su una copertina
   (in griglia o nel riquadro grande). Niente più «onclick» in linea qui:
   con l'onclick in linea il tocco apriva SEMPRE il lezionario prima ancora
   che questo listener potesse fermarlo, perché l'attributo scatta per primo.
   Il tocco del cestino resta suo (il touchstart lo salta, `stato_='mossa'`),
   così il tap sul 🗑 non fa partire anche l'apertura del lezionario. */
function attaccaPressioneLunga(){
  $$('[data-apre][data-i]').forEach(el=>{
    const i=el.dataset.i, oggi=el.dataset.oggi==='1';
    interazioneCarta(el, ()=>oggi?apriLezDiOggi(i):apriLez(i), ()=>condividiLez(i));
  });
}
/* la carta con «Oggi» apre il lezionario proprio alla pagina del giorno di oggi
   (il riquadro verde in alto, invece, apre la lezione di questo sabato) */
function apriLezDiOggi(i){
  const l=trovaLez(i); if(!l) return;
  const p=paginaDiOggi(l), g=giornoDiOggi(l);
  if(p) apriLez(i,p,(g&&g.pag===p)?{giorno:g.data,quale:g.k}:{giorno:new Date()}); else apriLez(i);
}
function interazioneCarta(el,tocco,lunga,ms){
  let timer=null, stato_='pronta';
  const via=()=>clearTimeout(timer);
  el.addEventListener('touchstart',e=>{
    if(e.target.closest('button')){ stato_='mossa'; return; }
    stato_='pronta';
    timer=setTimeout(()=>{ stato_='lunga';
      if(navigator.vibrate) try{ navigator.vibrate(12); }catch(err){} lunga(); },ms||550);
  },{passive:true});
  el.addEventListener('touchmove',()=>{ stato_='mossa'; via(); },{passive:true});
  el.addEventListener('touchend',e=>{ via();
    if(stato_==='pronta'){ e.preventDefault(); tocco(); } });
  el.addEventListener('touchcancel',()=>{ via(); stato_='mossa'; });
  el.addEventListener('click',e=>{
    if(e.target.closest('button')) return;
    if(stato_==='lunga'){ stato_='pronta'; return; }
    if(stato_==='mossa') return;
    tocco();
  });
  el.addEventListener('contextmenu',e=>{ e.preventDefault(); lunga(); });
}
/* l'indice si può guardare anche senza entrare nel lezionario */
function apriIndiceDaFuori(i){
  const l=trovaLez(i); if(!l) return;
  if(!l.lezioni||!l.lezioni.length) analizzaLezionario(l);
  LET.lez=l;
  apriIndiceLez(true);
}
function trovaLez(i){ return lezionari().find(l=>l.i===i); }

/* ---------- si può trascinare un PDF dal desktop, in qualsiasi momento
   mentre si è nella Scuola del Sabato: se il dialogo è già aperto lo
   prendo lì, altrimenti lo apro io con il file già scelto ---------- */
function nelLettore(){ const b=$('#lettore'); return !!(b&&b.classList.contains('on')); }
function assegnaFileScelti(files){
  const inp=$('#nlF'); if(!inp) return;
  try{
    const dt=new DataTransfer(); files.forEach(f=>dt.items.add(f));
    inp.files=dt.files;
    anteprimaLez();
  }catch(e){ avvisa('Qui il trascinamento non funziona: tocca l\'immagine per scegliere il file','no'); }
}
document.addEventListener('dragover',e=>{
  if(sezione!=='sabato' || nelLettore()) return;
  e.preventDefault();
  if(e.dataTransfer) e.dataTransfer.dropEffect='copy';
  document.body.classList.add('sab-trascina');
});
document.addEventListener('dragleave',e=>{
  if(!e.relatedTarget || e.relatedTarget.nodeName==='HTML') document.body.classList.remove('sab-trascina');
});
document.addEventListener('drop',e=>{
  if(sezione!=='sabato' || nelLettore()){ document.body.classList.remove('sab-trascina'); return; }
  e.preventDefault();
  document.body.classList.remove('sab-trascina');
  const f=[...(e.dataTransfer&&e.dataTransfer.files||[])].filter(x=>x.type==='application/pdf'||/\.pdf$/i.test(x.name));
  if(!f.length){ avvisa('Trascina un file PDF','no'); return; }
  if($('#nlF')) assegnaFileScelti(f);
  else { nuovoLez(); setTimeout(()=>assegnaFileScelti(f),0); }
});
/* ---------- inserimento: lezionario + copertina uniti ---------- */
function nuovoLez(){
  const a=new Date().getFullYear();
  apri('Aggiungi un lezionario',`
   <div class="griglia" style="gap:13px">
    <div class="campo"><label>File PDF — puoi sceglierne due insieme: la copertina e il lezionario.
      Li unisco io in un solo lezionario. Tocca l'immagine qui sotto, oppure trascina i file dal desktop.</label>
      <input type="file" id="nlF" accept="application/pdf" multiple onchange="anteprimaLez()" style="display:none"></div>
    <div class="nl-ant"><div class="nl-cop" id="nlCop" onclick="$('#nlF').click()" title="Tocca per scegliere il PDF">
        <span>📘</span><i>Tocca qui<br>o trascina<br>il PDF</i></div>
      <div id="nlAnt" style="font-size:12.5px;color:var(--tx3);flex:1"></div></div>
    <div class="fila">
      <div class="campo" style="flex:0 0 130px"><label>Lingua</label><select id="nlL">
        <option value="it">Italiano</option><option value="ro">Română</option></select></div>
      <div class="campo" style="flex:0 0 110px"><label>Anno</label><input type="number" id="nlA" value="${a}"></div>
      <div class="campo" style="flex:0 0 130px"><label>Trimestre</label><select id="nlT">
        ${TRIM.map(([n,br])=>`<option value="${n}">${n} · ${br}</option>`).join('')}</select></div>
      <div class="campo" style="flex:1"><label>Titolo</label><input type="text" id="nlTi" placeholder="riconosciuto dal file"></div>
    </div>
   </div>`,
   `<button class="bt pi" onclick="chiudi()">Annulla</button>
    <button class="bt pr" id="nlSalva" onclick="salvaLez()">Salva</button>`,660);
}
async function anteprimaLez(){
  const f=[...$('#nlF').files];
  const ant=$('#nlAnt');
  ant.innerHTML = f.length? f.map(x=>`📄 ${esc(x.name)} — ${Math.round(x.size/1024)} KB`).join('<br>')
    + (f.length>1?'<br><span style="color:var(--verde-c)">Il file con meno pagine sarà usato come copertina e messo davanti.</span>':'') : '';
  if(!f.length) return;
  /* il nome del file dice spesso qualcosa («Lec RO 4-26», «T4 2026»): lo metto subito nei campi,
     poi leggo il file e correggo */
  const hint=suggerimentiDaiNomi(f.map(x=>x.name));
  if(hint.anno) $('#nlA').value=hint.anno;
  if(hint.trim) $('#nlT').value=hint.trim;
  if(hint.lg) $('#nlL').value=hint.lg;
  /* leggo davvero le prime pagine e capisco lingua, anno e trimestre */
  ant.innerHTML+='<br>Leggo il file per capire di che lezionario si tratta…';
  try{
    await caricaPdfJs();
    let testo=''; const docs=[];
    for(const x of f){
      const doc=await pdfjsLib.getDocument({data:new Uint8Array(await x.arrayBuffer())}).promise;
      docs.push({nome:x.name,doc,n:doc.numPages});
      /* otto pagine: bastano per arrivare alla prima lezione e ai suoi sabati */
      for(let n=1;n<=Math.min(8,doc.numPages);n++){
        const tc=await (await doc.getPage(n)).getTextContent();
        testo+=' '+tc.items.map(z=>z.str).join(' ');
      }
    }
    /* la copertina è il file con meno pagine; la faccio vedere subito */
    docs.sort((a,b)=>a.n-b.n);
    const cop=docs.length>1?docs[0]:docs[0];
    try{
      const img=await copertinaInImmagine(cop.doc,300);
      const box=$('#nlCop'); if(box) box.innerHTML=`<img src="${img}" alt="">`;
    }catch(e){}
    if(docs.length>1) ant.dataset.unione=`Copertina: ${docs[0].nome} (${docs[0].n} pag.) · Lezionario: ${docs[docs.length-1].nome} (${docs[docs.length-1].n} pag.)`;
    else ant.dataset.unione='';
    /* la lingua si legge dal testo; se dentro non c'è testo (copertina fatta di immagine) mi
       fido del nome del file, e solo in fondo scelgo «italiano» */
    const sicuraLg=linguaSicura(testo);
    const lg = sicuraLg ? linguaDelTesto(testo) : (hint.lg || linguaDelTesto(testo));
    const per=leggiPeriodo(testo,lg,hint);
    const an=per.anno||hint.anno||+$('#nlA').value;
    const tr=per.trim||hint.trim||+$('#nlT').value;
    const de=deduciTitolo(testo);
    $('#nlL').value=lg; $('#nlA').value=an; $('#nlT').value=tr;
    ant.dataset.auto=lg+'|'+an+'|'+tr;         /* per sapere, quando salvi, se li hai cambiati tu */
    if(!$('#nlTi').value.trim() && de.titolo) $('#nlTi').value=de.titolo;
    const dubbi=[];
    if(!sicuraLg && !hint.lg) dubbi.push('la lingua');
    if(!per.trim && !hint.trim) dubbi.push('il trimestre');
    if(!per.anno && !hint.anno) dubbi.push('l\'anno');
    const elencoDubbi=dubbi.length>1 ? dubbi.slice(0,-1).join(', ')+' e '+dubbi[dubbi.length-1] : dubbi.join('');
    ant.innerHTML=ant.innerHTML.replace('Leggo il file per capire di che lezionario si tratta…',
      (dubbi.length===3
        ? '<span style="color:var(--oro)">Non sono riuscito a leggerlo da solo: controlla lingua, anno e trimestre qui sotto.</span>'
        : `<b style="color:var(--verde-c)">Riconosciuto:</b> ${lg==='ro'?'română':'italiano'} · ${an} · ${tr}º trimestre${de.titolo?' · '+esc(de.titolo):''}`
          + (dubbi.length?`<br><span style="color:var(--oro)">⚠ Nel file non ho trovato ${elencoDubbi}: controlla qui sotto.</span>`:''))
      + (ant.dataset.unione?`<br><span style="color:var(--oro)">🔗 ${esc(ant.dataset.unione)} — diventano un lezionario solo</span>`:''));
  }catch(e){ ant.innerHTML=ant.innerHTML.replace('Leggo il file per capire di che lezionario si tratta…',
      '<span style="color:var(--oro)">Non sono riuscito a leggerlo da solo: controlla lingua, anno e trimestre qui sotto.</span>'); }
}
async function salvaLez(){
  const f=[...$('#nlF').files];
  if(!f.length){ avvisa('Scegli almeno un file PDF','no'); return; }
  const bt=$('#nlSalva'); bt.disabled=true; bt.textContent='Leggo il PDF…';
  try{
    await caricaPdfJs();
    /* un file solo, di poche pagine: quasi certamente è una copertina.
       Invece di farne un lezionario a parte, la attacco a uno che c'è già. */
    if(f.length===1 && lezionari().length){
      const d0=await pdfjsLib.getDocument({data:new Uint8Array(await f[0].arrayBuffer())}).promise;
      if(d0.numPages<=4){ bt.disabled=false; bt.textContent='Salva'; scegliDoveCopertina(f[0]); return; }
    }
    /* conto le pagine per capire quale è la copertina */
    const info=[];
    for(const x of f){
      const buf=await x.arrayBuffer();
      const doc=await pdfjsLib.getDocument({data:new Uint8Array(buf)}).promise;
      info.push({file:x,buf,doc,n:doc.numPages});
    }
    info.sort((a,b)=>a.n-b.n);
    const cop = info.length>1 ? info[0] : null;
    const corpo = info.length>1 ? info[info.length-1] : info[0];
    const id=uid();
    const fid='lz'+id, cid=cop?('lc'+id):null;
    await salvaAllegato(fid, corpo.file);
    if(cop) await salvaAllegato(cid, cop.file);
    /* copertina: prima pagina del file copertina, altrimenti del lezionario */
    bt.textContent='Preparo la copertina…';
    const copDoc = cop?cop.doc:corpo.doc;
    const cimg = await copertinaInImmagine(copDoc,520);
    /* testo di tutte le pagine, per la ricerca */
    bt.textContent='Indicizzo il testo…';
    const testo=[];
    for(let n=1;n<=corpo.n;n++){
      try{ const pg=await corpo.doc.getPage(n);
        const tc=await pg.getTextContent();
        testo.push(tc.items.map(z=>z.str).join(' '));
      }catch(e){ testo.push(''); }
    }
    const dedotto = deduciTitolo(testo[0]||'');
    /* Ora che ho tutto il testo ricontrollo dove va messo: se lingua, anno e trimestre sono ancora
       quelli che avevo riconosciuto io (non li hai cambiati tu) e le date di tutte le lezioni dicono
       un'altra cosa, credo al testo. Se li hai cambiati tu, restano i tuoi. */
    let lgS=$('#nlL').value, anS=+$('#nlA').value, trS=+$('#nlT').value, corretto=false;
    const ant0=$('#nlAnt');
    if(ant0 && ant0.dataset.auto && ant0.dataset.auto===lgS+'|'+anS+'|'+trS){
      const tutto=testo.join(' ');
      const hint=suggerimentiDaiNomi(f.map(x=>x.name));
      const lgT=linguaSicura(tutto)?linguaDelTesto(tutto):lgS;
      const per=leggiPeriodo(tutto,lgT,hint);
      if(lgT!==lgS){ lgS=lgT; corretto=true; }
      if(per.peso>=5 && per.margine>=3){
        if(per.trim && per.trim!==trS){ trS=per.trim; corretto=true; }
        if(per.anno && per.anno!==anS){ anS=per.anno; corretto=true; }
      }
    }
    stato.lezionari=stato.lezionari||[];
    stato.lezionari.push({ i:id, lg:lgS, anno:anS, trim:trS, trimRifatto:true,
      titolo:$('#nlTi').value.trim()||dedotto.titolo, mesi:dedotto.mesi||'', vol:dedotto.vol||'',
      fid, cid, cop:cimg, copFronte:true, pagine:corpo.n + (cop?cop.n:0), pagCop:cop?cop.n:0,
      testo, note:{}, ultimaPag:1, quando:new Date().toISOString() });
    const nuovo=stato.lezionari[stato.lezionari.length-1];
    bt.textContent='Cerco le lezioni…';
    try{ analizzaLezionario(nuovo); }catch(e){}
    /* mi sposto sull'anno e sulla lingua di quello appena aggiunto: altrimenti,
       con un anno e una lingua alla volta, sparirebbe dalla vista */
    FL.anno=nuovo.anno; FL.lg=nuovo.lg;
    salva(); chiudi(); vSabato();
    avvisa((corretto?`Messo nel ${trS}º trimestre ${anS} (${lgS==='ro'?'română':'italiano'}), come dice il testo — `:'')
      + (nuovo.lezioni&&nuovo.lezioni.length ? `Lezionario aggiunto — trovate ${nuovo.lezioni.length} lezioni` : 'Lezionario aggiunto'),'ok');
  }catch(e){ console.error(e); avvisa('Non riesco a leggere il PDF: '+e.message,'no'); bt.disabled=false; bt.textContent='Salva'; }
}
function deduciTitolo(t){
  const r={titolo:'',mesi:'',vol:''};
  const m=/Vol\.?\s*(\d+)[,\s]*N\.?\s*(\d+)/i.exec(t); if(m) r.vol=m[1];
  const ms=/(GEN|FEB|MAR|APR|MAG|GIU|LUG|AGO|SET|OTT|NOV|DIC|IAN|IUN|IUL|OCT)[A-Z]*\s*[-–]\s*([A-Z]{3})/i.exec(t);
  if(ms) r.mesi=ms[0];
  /* il titolo: le prime righe utili, senza le diciture di copertina */
  const scarta=/lezionario|lec[tţț]i|scuola|sezione|adulti|scoala|școala|sabat|vol\.?\s*\d|trimestr|^della\b|^delle\b|^per\b|^studi/i;
  const righe=t.split(/\s{2,}|\n/).map(x=>x.trim())
    .filter(x=>x.length>7&&x.length<48&&!/\d/.test(x)&&!scarta.test(x));
  let ti=righe[0]||'';
  if(ti && ti.length<28 && righe[1] && (ti+' '+righe[1]).length<70) ti+=' '+righe[1];
  ti=ti.replace(/^(sezione|secţiunea|secțiunea|sectiunea)\s+(adulti|adulţi|adulți)\s*/i,'');
  r.titolo=ti.trim();
  return r;
}
/* la copertina arrivata da sola: a quale lezionario la metto? */
function scegliDoveCopertina(file){
  const el=lezionari().sort((a,b)=>(b.anno-a.anno)||(b.trim-a.trim));
  _copertinaInArrivo=file;
  apri('Sembra una copertina',
    `<p class="sotto" style="margin-top:0">Questo file ha poche pagine: è la copertina di un lezionario.
      Dimmi di quale e li metto insieme — resterà un lezionario solo.</p>
     <div class="lez-el">${el.map(l=>`
       <div class="lez-riga" onclick="metticopertina('${l.i}')">
         <span class="nn">📘</span>
         <span class="cc"><b>${esc(l.titolo||('Lezionario '+l.anno))}</b>
           <span>${esc(l.anno)} · ${l.trim}º trimestre · ${l.lg==='ro'?'română':'italiano'}${l.cid?' · ha già una copertina':''}</span></span>
       </div>`).join('')}</div>`,
    `<button class="bt pi" onclick="_copertinaInArrivo=null;chiudi()">Annulla</button>
     <button class="bt pi" onclick="copertinaANuovo()">No, è un lezionario a sé</button>`,600,'alto');
}
let _copertinaInArrivo=null;
async function metticopertina(i){
  const l=trovaLez(i), file=_copertinaInArrivo;
  if(!l||!file) return;
  avvisa('Unisco la copertina al lezionario…');
  try{
    await caricaPdfJs();
    const doc=await pdfjsLib.getDocument({data:new Uint8Array(await file.arrayBuffer())}).promise;
    const cid='lc'+uid();
    if(l.cid){ try{ await kvDel('all:'+l.cid); }catch(e){} }
    await salvaAllegato(cid,file);
    /* le pagine della copertina vanno davanti: le lezioni si spostano in avanti */
    const prima=l.pagCop||0, adesso=doc.numPages, sposta=adesso-prima;
    l.cid=cid; l.pagCop=adesso; l.pagine=(l.pagine||0)-prima+adesso;
    l.cop=await copertinaInImmagine(doc,520); l.copFronte=true; l.copRifare=false;
    if(sposta && l.lezioni) l.lezioni.forEach(x=>{ x.pag+=sposta; if(x.fine) x.fine+=sposta;
      (x.giorni||[]).forEach(g=>g.pag+=sposta); });
    if(l.ultimaPag) l.ultimaPag+=sposta;
    _copertinaInArrivo=null;
    salva(); chiudi(); vSabato(); avvisa('Copertina messa: adesso è un lezionario solo','ok');
  }catch(e){ avvisa('Non riesco a leggere la copertina: '+e.message,'no'); }
}
function copertinaANuovo(){
  chiudi();
  avvisa('Va bene: apri di nuovo «Aggiungi lezionario» e scegli i due file insieme','ok');
  _copertinaInArrivo=null;
}
function cambiaCopertina(i){
  const f=document.createElement('input');
  f.type='file'; f.accept='application/pdf';
  f.onchange=()=>{ if(f.files[0]){ _copertinaInArrivo=f.files[0]; metticopertina(i); } };
  f.click();
}
function modificaLez(i){
  const l=trovaLez(i); if(!l) return;
  apri('Modifica lezionario',`
   <div class="griglia" style="gap:13px">
    <div class="fila">
      <div class="campo" style="flex:0 0 130px"><label>Lingua</label><select id="mlL">
        <option value="it" ${l.lg==='it'?'selected':''}>Italiano</option>
        <option value="ro" ${l.lg==='ro'?'selected':''}>Română</option></select></div>
      <div class="campo" style="flex:0 0 110px"><label>Anno</label><input type="number" id="mlA" value="${l.anno}"></div>
      <div class="campo" style="flex:0 0 130px"><label>Trimestre</label><select id="mlT">
        ${TRIM.map(([n,br])=>`<option value="${n}" ${+l.trim===+n?'selected':''}>${n} · ${br}</option>`).join('')}</select></div>
    </div>
    <div class="campo"><label>Titolo</label><input type="text" id="mlTi" value="${esc(l.titolo||'')}"></div>
   </div>`,
   `<button class="bt pi" style="margin-right:auto;color:#ff8b9c" onclick="eliminaLez('${i}')">Elimina</button>
    <button class="bt pi" onclick="chiudi();cambiaCopertina('${i}')">🖼 Copertina</button>
    <button class="bt pi" onclick="chiudi()">Annulla</button>
    <button class="bt pr" onclick="salvaModLez('${i}')">Salva</button>`,600);
}
function salvaModLez(i){
  const l=trovaLez(i); if(!l) return;
  l.lg=$('#mlL').value; l.anno=+$('#mlA').value;
  if(+l.trim!==+$('#mlT').value) l.trimMano=true;
  l.trim=+$('#mlT').value; l.titolo=$('#mlTi').value.trim();
  FL.anno=l.anno; FL.lg=l.lg;
  salva(); chiudi(); vSabato(); avvisa('Salvato','ok');
}
function eliminaLez(i){
  conferma('Vuoi eliminare questo lezionario e i suoi appunti?',async()=>{
    const l=trovaLez(i);
    if(l){ try{ await kvDel('all:'+l.fid); if(l.cid) await kvDel('all:'+l.cid); }catch(e){} }
    stato.lezionari=lezionari().filter(x=>x.i!==i); salva(); chiudi(); vSabato(); avvisa('Eliminato','ok');
  },'Elimina');
}
/* tutti i pdf dei lezionari (originale + copertina) in un solo file .zip da
   scaricare — servono fuori dal programma, per esempio per pubblicarli sul
   sito (pubblica.py li va a cercare in una cartella apposta, vedi lì) —
   i pdf stanno solo dentro a questo dispositivo (IndexedDB), un programma
   scritto in Python come pubblica.py non può leggerli da solo */
function nomeFilePdfLez(l,cosa){
  const pulito=s=>String(s||'').replace(/[\/\\:*?"<>|]/g,' ').replace(/\s+/g,' ').trim();
  const base=pulito(`${l.anno||''}-T${l.trim||''} ${l.lg==='ro'?'RO':'IT'} ${pulito(l.titolo)||'lezionario'}`);
  return base+(cosa==='cop'?' (copertina)':'')+'.pdf';
}
async function esportaLezionariPdf(){
  const ll=lezionari();
  if(!ll.length){ avvisa('Non hai ancora nessun lezionario','no'); return; }
  await salvaFile('Lezionari PDF.zip','application/zip',async()=>{
    const usati={};
    const nomeUnico=base=>{ usati[base]=(usati[base]||0)+1;
      return usati[base]===1?base:base.replace(/\.pdf$/,` (${usati[base]}).pdf`); };
    const file=[];
    for(const l of ll){
      if(!l.fid) continue;
      try{
        const b=await kvGet('all:'+l.fid);
        if(b) file.push({nome:nomeUnico(nomeFilePdfLez(l)), dati:new Uint8Array(await b.arrayBuffer())});
        if(l.cid){
          const bc=await kvGet('all:'+l.cid);
          if(bc) file.push({nome:nomeUnico(nomeFilePdfLez(l,'cop')), dati:new Uint8Array(await bc.arrayBuffer())});
        }
      }catch(e){}
    }
    if(!file.length) throw new Error('non ho trovato nessun file da esportare');
    return zip(file);
  });
}
/* Condividi: si apre SUBITO il foglio del sistema (Mail, WhatsApp, Cartelle,
   Stampa…), senza nessuna finestra mia in mezzo — sia dal pulsante sia
   tenendo premuto sulla copertina. Leggere il file dall'archivio è cosa da
   millisecondi, quindi il tocco è ancora «vivo» quando chiedo il foglio:
   è la condizione che iPad e iPhone pretendono. Se il foglio non c'è
   (browser che non lo sa fare) o va storto, salva il file come prima. */
async function condividiLez(i){
  const l=trovaLez(i); if(!l) return;
  let blob=null, nome=`${l.titolo||'Lezionario'} ${l.anno}-${l.trim}.pdf`;
  try{ blob=await kvGet('all:'+l.fid); }catch(e){}
  if(!blob){ avvisa('Il file di questo lezionario non è più disponibile','no'); return; }
  try{
    const file=new File([blob],nome,{type:'application/pdf'});
    if(navigator.canShare && navigator.canShare({files:[file]})){
      /* SOLO il file, senza titolo: con il titolo l'iPad salva accanto al PDF
         un secondo file, «Testo.txt» (come succedeva col backup) */
      await navigator.share({files:[file]});
      return;
    }
  }catch(e){ if(e && e.name==='AbortError') return; }
  await scarica(blob,nome,'application/pdf');
}

/* ================= riconoscere il lezionario da solo ================= */
const MESI_LEZ={ it:['gennaio','febbraio','marzo','aprile','maggio','giugno','luglio','agosto','settembre','ottobre','novembre','dicembre'],
             ro:['ianuarie','februarie','martie','aprilie','mai','iunie','iulie','august','septembrie','octombrie','noiembrie','decembrie'] };
const GIORNI_LEZ={ it:['domenica','lunedì','martedì','mercoledì','giovedì','venerdì','sabato'],
               ro:['duminică','luni','marţi','miercuri','joi','vineri','sâmbătă'] };
function ckl(s){ return ck(s||'').replace(/\s+/g,''); }
/* certi PDF staccano le lettere con i segni: «Lec ţ ia 1». Ricucio. */
function ricuci(s){ return (s||'').replace(/(\S) ([ăâîşșţțĂÂÎŞȘŢȚ]) (?=\S)/g,'$1$2').replace(/\s{2,}/g,' '); }
/* una parola che si lascia trovare anche se è scritta con le lettere staccate */
function elastica(p){ return p.split('').map(c=>c.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('\\s*'); }
/* la lingua: la riconosco dalle parole e dalle lettere con i segni */
function _provaLingua(t){
  t=(t||'').slice(0,60000);
  return {
    segni:(t.match(/[ăâîşșţț]/gi)||[]).length,
    ro:(t.match(/\b(şi|și|pentru|este|Dumnezeu|Domnul|Sabat|lecţia|lecția|studiul|săptămâna|către|nostru)\b/gi)||[]).length,
    it:(t.match(/\b(che|della|degli|dalla|Dio|Signore|sabato|lezione|settimana|nostro|perché|questo)\b/gi)||[]).length };
}
function linguaDelTesto(t){
  const p=_provaLingua(t);
  return (p.segni*0.5 + p.ro*3) > (p.it*3) ? 'ro' : 'it';
}
/* con poco testo (una copertina fatta di immagine) la lingua non si può leggere: meglio dirlo
   che indovinare «italiano» */
function linguaSicura(t){ const p=_provaLingua(t); return (p.ro+p.it)>=4 || p.segni>=8; }

/* i mesi come si scrivono davvero sui lezionari — per esteso e abbreviati, nelle due lingue
   (e in inglese: sulle copertine c'è anche «OCT–DEC»): parola → numero del mese */
const MESE_DA_PAROLA=(()=>{
  const m={};
  const dai=(n,...p)=>p.forEach(x=>{ m[x]=n; });
  dai(1,'gennaio','gen','ianuarie','ian','january','jan');
  dai(2,'febbraio','feb','februarie','february');
  dai(3,'marzo','mar','martie','march');
  dai(4,'aprile','apr','aprilie','april');
  dai(5,'maggio','mag','mai','may');
  dai(6,'giugno','giu','iunie','iun','june','jun');
  dai(7,'luglio','lug','iulie','iul','july','jul');
  dai(8,'agosto','ago','august','aug');
  dai(9,'settembre','set','sett','septembrie','sep','sept','september');
  dai(10,'ottobre','ott','octombrie','oct','october');
  dai(11,'novembre','nov','noiembrie','november');
  dai(12,'dicembre','dic','decembrie','dec','december');
  return m;
})();
/* le stesse parole, che si lasciano trovare anche con le lettere staccate («I U L I E») */
const RX_MESE=Object.keys(MESE_DA_PAROLA).sort((a,b)=>b.length-a.length).map(elastica).join('|');
function _senzaAccenti(s){
  return String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[șşŞȘ]/g,'s').replace(/[țţŢȚ]/g,'t').toLowerCase();
}
function _meseDi(tok){ return MESE_DA_PAROLA[String(tok||'').replace(/[\s.]+/g,'')]||0; }
const _trimDelMese=m=>Math.floor((m-1)/3)+1;

/* Leggo il trimestre e l'anno di un lezionario da TUTTO quello che il testo dice, e li faccio
   votare — così una scritta sbagliata non decide da sola:
   · l'intervallo dei mesi con il suo anno, anche abbreviato («2026 APR - GIU», «OTT-DIC»,
     «IULIE - SEPTEMBRIE, 2026»); a ogni intervallo si dà l'anno più vicino, e ogni anno serve
     a un intervallo solo (sulla copertina di «2 trim» ci sono «2025 OCT–DEC» e «2026 APR - GIU»);
   · «Vol. 102, N. 4» (il numero è il trimestre);
   · le parole «trimestre», «trimestrul»;
   · i SABATI scritti sulle lezioni («SABATO, 4 APRILE 2026», «SÂMBĂTĂ, 26 SEPTEMBRIE»): sono
     la prova più solida, perché le lezioni vanno di sabato in sabato;
   · come ultima risorsa il primo mese scritto per intero.
   `hint` = quello che dice il nome del file (peso piccolo). Torna anche quanto è sicuro. */
function leggiPeriodo(t,lg,hint){
  const testo=_senzaAccenti(ricuci(t||''));
  const testa=testo.slice(0,30000);
  const voti={1:0,2:0,3:0,4:0}, coppie={}, soloAnno={};
  const aggiungiCoppia=(y,q,p)=>{ coppie[y+'-'+q]=(coppie[y+'-'+q]||0)+p; };
  /* gli anni scritti nelle prime pagine, con dove stanno */
  const anni=[]; let m;
  const rxA=/(^|[^0-9])(20[2-9]\d)(?![0-9])/g;
  while((m=rxA.exec(testa))) anni.push({y:+m[2],ini:m.index+m[1].length});
  /* 1) gli intervalli di mesi («luglio - settembre», «OTT-DIC»): devono essere un trimestre preciso */
  const rxI=new RegExp('(^|[^a-z])('+RX_MESE+')\\.?\\s*[-–—]\\s*('+RX_MESE+')(?![a-z])','g');
  const intervalli=[];
  while((m=rxI.exec(testa))){
    const m1=_meseDi(m[2]), m2=_meseDi(m[3]);
    if(m1&&m2 && m1%3===1 && m2===m1+2) intervalli.push({q:_trimDelMese(m1), ini:m.index+m[1].length, fin:m.index+m[0].length});
  }
  const usati=new Set();
  intervalli.map(iv=>{
    const c=[];
    anni.forEach((a,k)=>{
      const dist = a.ini<iv.ini ? iv.ini-(a.ini+4) : a.ini-iv.fin;
      if(dist>=0 && dist<=12) c.push({k,dist,y:a.y});
    });
    c.sort((x,y)=>x.dist-y.dist);
    return {iv,c};
  }).sort((x,y)=>x.c.length-y.c.length).forEach(o=>{
    const sc=o.c.find(z=>!usati.has(z.k));
    if(sc){ usati.add(sc.k); aggiungiCoppia(sc.y,o.iv.q,3); } else voti[o.iv.q]+=2;
  });
  /* 2) «Vol. 102, N. 4»: il numero è il trimestre, il volume dice l'anno (102 = 2026) */
  const mv=/vol\.?\s*(\d{2,3})\s*[,.;]?\s*n\.?\s*([1-4])(?![0-9])/.exec(testa);
  if(mv){ voti[+mv[2]]+=3; const ay=1924+(+mv[1]); if(ay>=2020&&ay<=2099) soloAnno[ay]=(soloAnno[ay]||0)+1; }
  /* 3) le parole «trimestre» / «trimestrul» */
  const romani={i:1,ii:2,iii:3,iv:4};
  let mt=/trimestrul\s*(?:al\s*)?(iv|iii|ii|i)(?![a-z])/.exec(testa) || /trimestrul\s*(?:al\s*)?([1-4])(?![0-9])/.exec(testa)
      || /([1-4])\s*[°º.]?\s*trimestre/.exec(testa) || /trimestre\s*([1-4])(?![0-9])/.exec(testa);
  if(mt){ const k=romani[mt[1]]||+mt[1]; if(k>=1&&k<=4) voti[k]+=3; }
  else { const mo=/(primo|secondo|terzo|quarto)\s+trimestre/.exec(testa);
    if(mo) voti[{primo:1,secondo:2,terzo:3,quarto:4}[mo[1]]]+=3; }
  /* 4) i sabati scritti sulle lezioni (i primi otto, tutte date diverse) */
  const rxS=new RegExp('(?:sabato|sabat|sambata)[,:.\\s]+(\\d{1,2})\\s*('+RX_MESE+')\\.?(?![a-z])\\s*(20[2-9]\\d)?','g');
  const viste=new Set();
  while((m=rxS.exec(testo)) && viste.size<8){
    const g=+m[1], me=_meseDi(m[2]);
    if(!me||g<1||g>31) continue;
    const k=g+'-'+me+'-'+(m[3]||'');
    if(viste.has(k)) continue;
    viste.add(k);
    voti[_trimDelMese(me)]+=2;
    if(m[3]) aggiungiCoppia(+m[3],_trimDelMese(me),2);
  }
  /* 5) senza altro: il primo mese scritto per intero, saltando «mai» in rumeno (vuol dire «più») */
  const nessuno=!voti[1]&&!voti[2]&&!voti[3]&&!voti[4]&&!Object.keys(coppie).length;
  if(nessuno){
    const lista=MESI_LEZ[lg]||MESI_LEZ.it, dubbi=lg==='ro'?['mai']:[];
    let primo=-1, dove=1e9;
    lista.forEach((nome,k)=>{
      if(dubbi.includes(_senzaAccenti(nome))) return;
      const i=testa.search(new RegExp('(^|[^a-z])'+elastica(_senzaAccenti(nome))+'([^a-z]|$)'));
      if(i>=0&&i<dove){ dove=i; primo=k; }
    });
    if(primo<0 && dubbi.length){
      const i=testa.search(/(^|[^a-z])m\s*a\s*i([^a-z]|$)/); if(i>=0) primo=4;
    }
    if(primo>=0) voti[Math.floor(primo/3)+1]+=0.5;
  }
  /* 6) quello che dice il nome del file, con poco peso */
  if(hint && hint.trim) voti[hint.trim]+=2;
  if(hint && hint.anno){ soloAnno[hint.anno]=(soloAnno[hint.anno]||0)+1; if(hint.trim) aggiungiCoppia(hint.anno,hint.trim,1); }
  /* il verdetto: il trimestre con più voti, l'anno più votato PER QUEL trimestre */
  const tot={1:voti[1],2:voti[2],3:voti[3],4:voti[4]};
  /* (a parità, un pizzico in più all'anno più recente: un anno vecchio sulla copertina è quasi sempre
     un avanzo del modello del trimestre prima) */
  Object.keys(coppie).forEach(k=>{ const [y,q]=k.split('-'); tot[+q]+=coppie[k]+(+y-2000)*0.001; });
  let trim=0, primo=0, secondo=0;
  [1,2,3,4].forEach(k=>{
    if(tot[k]>primo){ secondo=primo; primo=tot[k]; trim=k; } else if(tot[k]>secondo) secondo=tot[k];
  });
  let anno=0, pa=0;
  Object.keys(coppie).forEach(k=>{
    const [y,q]=k.split('-');
    if(+q===trim && coppie[k]>pa){ pa=coppie[k]; anno=+y; }
  });
  if(!anno){ Object.keys(soloAnno).forEach(y=>{ if(soloAnno[y]>pa){ pa=soloAnno[y]; anno=+y; } }); }
  if(!anno && anni.length) anno=anni[0].y;
  return {trim, anno, peso:Math.floor(primo), margine:Math.floor(primo-secondo)};
}
function trimestreDelTesto(t,lg){ return leggiPeriodo(t,lg).trim; }
function annoDelTesto(t){ return leggiPeriodo(t).anno; }
/* il nome del file dice spesso lingua, trimestre e anno («Lec RO 4-26», «Lezionario T4 2026»,
   «2 trim», «Coperta Ro 3-2026»): serve quando dentro al file non c'è testo (copertine fatte
   di immagine) e come conferma */
function suggerimentiDalNome(nome){
  const n=_senzaAccenti(nome).replace(/\.pdf$/,'');
  const h={lg:'',trim:0,anno:0};
  if(/(^|[^a-z])(ro|rum|rumeno|romana|lec|lectia|lectii|coperta|scoala)([^a-z]|$)/.test(n)) h.lg='ro';
  else if(/(^|[^a-z])(it|ita|italiano|lezionario|copertina|scuola)([^a-z]|$)/.test(n)) h.lg='it';
  let mq=/(^|[^a-z0-9])[tq]\s*([1-4])(?![0-9])/.exec(n) || /([1-4])\s*[°º]?\s*trim/.exec(n) || /trim\w*\s*([1-4])(?![0-9])/.exec(n)
      || /lec\w*\s*([1-4])(?![0-9])/.exec(n);
  if(mq) h.trim=+mq[mq.length-1];
  const mc=/(^|[^0-9])([1-4])\s*[-_./]\s*((?:20)?[2-9]\d)(?![0-9])/.exec(n);
  if(mc){ if(!h.trim) h.trim=+mc[2]; h.anno=mc[3].length===2?2000+(+mc[3]):+mc[3]; }
  if(!h.anno){ const ma=/(20[2-9]\d)/.exec(n); if(ma) h.anno=+ma[1]; }
  return h;
}
function suggerimentiDaiNomi(nomi){
  const h={lg:'',trim:0,anno:0};
  (nomi||[]).forEach(n=>{ const x=suggerimentiDalNome(n); ['lg','trim','anno'].forEach(k=>{ if(!h[k]&&x[k]) h[k]=x[k]; }); });
  return h;
}
/* le lezioni: numero, titolo, pagina e il sabato in cui si studiano */
function analizzaLezionario(l){
  const lg=l.lg||'it', mesi=MESI_LEZ[lg]||MESI_LEZ.it;
  const parole = lg==='ro' ? ['lectia','lecţia','lecția','studiul'] : ['lezione','studio'];
  const rxN=new RegExp('(?:'+parole.map(elastica).join('|')+')\\s*(\\d{1,2})(?!\\d)','i');
  const rxD=new RegExp('(\\d{1,2})\\s+('+mesi.map(elastica).join('|')+')\\s*(\\d{4})?','i');
  const out=[];
  (l.testo||[]).forEach((pagina,k)=>{
    const n=k+1+(l.pagCop||0);
    const m=rxN.exec(pagina||'');
    if(!m) return;
    if(out.some(x=>x.n===+m[1])) return;
    const dopo=(pagina||'').slice(m.index+m[0].length,m.index+m[0].length+160);
    const md=rxD.exec(dopo) || rxD.exec((pagina||'').slice(0,400));
    let data='';
    if(md){
      const g=+md[1], me=mesi.findIndex(x=>ckl(x)===ckl(md[2]));
      const an=md[3]?+md[3]:(l.anno||new Date().getFullYear());
      if(me>=0) data=`${an}-${String(me+1).padStart(2,'0')}-${String(g).padStart(2,'0')}`;
    }
    let tit=ricuci(dopo).replace(rxD,' ').replace(/[^\wàèéìòùăâîşșţț' .,:;-]/gi,' ').replace(/\s+/g,' ').trim();
    tit=tit.split(/\b(?:sabato|sabat|s\s*a\s*b\s*a\s*t)\b/i)[0].trim() || tit;
    tit=tit.replace(/[\s,;:.-]+$/,'');
    if(tit.length>60) tit=tit.slice(0,60).replace(/\s\S*$/,'')+'…';
    out.push({n:+m[1],tit:tit||('Lezione '+m[1]),pag:n,data});
  });
  /* certe edizioni non scrivono «Lezione N»: allora mi baso sui sabati,
     che ci sono sempre in cima a ogni lezione */
  if(!out.length){
    const gior = lg==='ro' ? 's[âa]mb[ăa]t[ăa]|sabat' : 'sabato';
    const rxS=new RegExp('(?:'+gior+')[,:\\s]+'+'(\\d{1,2})\\s+('+mesi.map(elastica).join('|')+')\\s*(\\d{4})?','i');
    (l.testo||[]).forEach((pagina,k)=>{
      const n2=k+1+(l.pagCop||0);
      const rip=ricuci(pagina||'');
      const m2=rxS.exec(rip);
      if(!m2) return;
      const g=+m2[1], me=mesi.findIndex(x=>ckl(x)===ckl(m2[2]));
      const an=m2[3]?+m2[3]:(l.anno||new Date().getFullYear());
      const data = me>=0 ? `${an}-${String(me+1).padStart(2,'0')}-${String(g).padStart(2,'0')}` : '';
      if(out.some(x=>x.data===data && data)) return;
      /* il titolo: la riga più lunga prima della data */
      const testa=rip.slice(0,Math.max(0,m2.index)).replace(/\s+/g,' ').trim();
      /* tengo l'ultima frase prima della data: è il titolo della lezione */
      const pezzi=testa.split(/[.!?]\s+/);
      let tit=(pezzi[pezzi.length-1]||testa);
      tit=tit.replace(/^\d+[.)]?\s*/,'').slice(0,70).trim();
      out.push({n:out.length+1, tit:tit||('Lezione '+(out.length+1)), pag:n2, data});
    });
    out.forEach((x,i)=>x.n=i+1);
  }
  out.sort((a,b)=>a.pag-b.pag);
  /* i giorni dentro a ogni lezione */
  const gg=GIORNI_LEZ[lg]||GIORNI_LEZ.it;
  const BREVI={ it:['dom','lun','mar','mer','gio','ven','sab'],
                ro:['dum','lun','mar','mie','joi','vin','sam'] };
  const brevi=BREVI[lg]||BREVI.it;
  const senza=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  out.forEach((lez,i)=>{
    const fine = i+1<out.length ? out[i+1].pag : (l.pagine||9999);
    const giorni=[];
    for(let n=lez.pag;n<fine;n++){
      const pag=ricuci((l.testo||[])[n-1-(l.pagCop||0)]||'');
      const testo=senza(pag), testa=testo.slice(0,90);
      gg.forEach((g,k)=>{
        if(giorni.some(x=>x.k===k)) return;
        const nome=senza(g), br=brevi[k];
        /* «DUMINICĂ, 6 SEPTEMBRIE» oppure «Dom, 6 Set»: giorno seguito dal numero */
        const conData=new RegExp('(^|[^a-z])(' + nome + '|' + br + ')\\.?,?\\s{0,3}\\d{1,2}([^0-9]|$)');
        const inCima=new RegExp('(^|[^a-z])' + nome + '([^a-z]|$)');
        if(conData.test(testo) || inCima.test(testa))
          giorni.push({k,nome:g.charAt(0).toUpperCase()+g.slice(1),pag:n});
      });
    }
    lez.giorni=giorni.sort((a,b)=>a.pag-b.pag);
    lez.fine=fine;
  });
  completaDate(out);
  l.lezioni=out;
  return out;
}
/* Le due edizioni non scrivono la data allo stesso modo, e in qualcuna non
   si legge affatto. Ma le lezioni vanno di sabato in sabato: basta una data
   riconosciuta e tutte le altre si contano da quella, sette giorni per volta.
   Così l'italiano e il rumeno arrivano allo stesso sabato e gli appunti si
   ritrovano. */
function completaDate(out){
  if(!out||!out.length) return out;
  const noti=[];
  out.forEach((x,i)=>{
    if(!x.data) return;
    const p=x.data.split('-');
    const d=new Date(+p[0],+p[1]-1,+p[2]);
    if(!isNaN(d)) noti.push({i,d});
  });
  if(!noti.length) return out;
  /* le date lette dal foglio restano come sono: riempio solo i buchi */
  out.forEach((x,i)=>{
    if(x.data) return;
    let vicino=noti[0];
    noti.forEach(k=>{ if(Math.abs(k.i-i)<Math.abs(vicino.i-i)) vicino=k; });
    const d=new Date(vicino.d.getFullYear(),vicino.d.getMonth(),vicino.d.getDate()+(i-vicino.i)*7);
    x.data=iso(d);
  });
  return out;
}
/* i lezionari messi dentro prima non hanno le date su tutte le lezioni:
   gliele completo una volta sola, senza rifare il riconoscimento */
function ricontrollaDate(){
  let toccati=0;
  lezionari().forEach(l=>{
    if(l.dateRifatte) return;
    l.dateRifatte=true;
    const lez=l.lezioni||[];
    if(!lez.length) return;
    const senza=lez.filter(x=>!x.data).length;
    if(!lez.some(x=>x.data)){
      /* nessuna data: riprovo il riconoscimento da capo, magari ora la trovo */
      if((l.testo||[]).length){ l.lezioni=null; analizzaLezionario(l); toccati++; }
      return;
    }
    completaDate(lez);
    if(senza) toccati++;
  });
  if(toccati) salva();
  return toccati;
}
/* il sabato che conta adesso: oggi se è sabato e il sole non è ancora tramontato */
function prossimoSabato(adesso){
  const d=adesso||new Date();
  const oggi=new Date(d.getFullYear(),d.getMonth(),d.getDate());
  if(d.getDay()===6){
    const l=luogoAttuale();
    if(!l) return oggi;
    const la=l.lat!=null?l.lat:l.la, lo=l.lon!=null?l.lon:l.lo;      /* il punto vero dove sei, non il paese più vicino dell'elenco */
    const s=calcolaSole(d,la,lo);
    if(s.sempre||d<s.tramonto) return oggi;
  }
  const q=(6-d.getDay()+7)%7 || 7;
  return new Date(d.getFullYear(),d.getMonth(),d.getDate()+q);
}
function iso(d){ return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
function lezioneDelSabato(l,adesso){
  const lez=(l.lezioni||[]).filter(x=>x.data);
  if(!lez.length) return null;
  const s=iso(prossimoSabato(adesso));
  const date=lez.map(x=>x.data).sort();
  /* se il sabato che viene non cade dentro a questo lezionario
     (per esempio è un trimestre futuro) non c'è nessuna lezione da mostrare */
  if(s<date[0] || s>date[date.length-1]) return null;
  return lez.find(x=>x.data===s) || lez.filter(x=>x.data<=s).pop() || null;
}
/* La pagina del GIORNO di oggi. Dentro alla lezione di questo sabato cerco la pagina dove è
   scritta la data di oggi: sui lezionari sta in cima a ogni giorno («20 Set», «DUMINICĂ, 20
   SEPTEMBRIE», «23 SEPT.»). Se la data non c'è uso il giorno della settimana e, in fondo,
   la prima pagina della lezione. Una data con un altro anno («22 ottobre 1844») non conta. */
function _rxDataDiOggi(g,mese0){
  const nomi=Object.keys(MESE_DA_PAROLA).filter(k=>MESE_DA_PAROLA[k]===mese0+1).sort((a,b)=>b.length-a.length);
  return new RegExp('(^|[^0-9])0?'+g+'\\s*(?:'+nomi.map(elastica).join('|')+')\\.?(?![a-z])(?:\\s*(\\d{4})(?![0-9]))?','g');
}
/* Il GIORNO di oggi dentro alla lezione: la pagina, la data stampata sul suo titolo e, se in quella
   pagina la stessa data c'è più di una volta, quale delle due (0 = la prima). Di solito è la data di
   oggi. Ma a volte il lezionario sbaglia la data di un giorno (luglio-settembre 2026: giovedì 24 è
   stampato «Mer, 23 Set», uguale al mercoledì): allora conto i titoli dei giorni in ordine, dal primo
   della settimana — quello di oggi è il quinto se il primo è domenica e oggi è giovedì. null se non so. */
function giornoDiOggi(l,adesso){
  adesso=adesso||new Date();
  const q=lezioneDelSabato(l,adesso); if(!q) return null;
  const tot=l.pagine||((l.testo||[]).length+(l.pagCop||0));
  const fine=Math.min(q.fine||tot+1,tot+1);
  const oggi=new Date(adesso.getFullYear(),adesso.getMonth(),adesso.getDate());
  /* tutte le date da domenica a venerdì di questa settimana, dove sono scritte, in ordine */
  const settimana=[];
  for(let g=0;g<6;g++) settimana.push(new Date(oggi.getFullYear(),oggi.getMonth(),oggi.getDate()-oggi.getDay()+g));
  const teste=[];
  for(let n=q.pag;n<fine;n++){
    const t=_senzaAccenti(ricuci((l.testo||[])[n-1-(l.pagCop||0)]||'')); if(!t) continue;
    const qui=[];
    settimana.forEach(d=>{
      const rx=_rxDataDiOggi(d.getDate(),d.getMonth()); let m;
      while((m=rx.exec(t))){ if(!m[2] || +m[2]===d.getFullYear()) qui.push({pag:n,d,pos:m.index}); }
    });
    qui.sort((a,b)=>a.pos-b.pos).forEach(x=>{
      x.k=teste.filter(y=>y.pag===n && +y.d===+x.d).length; teste.push(x);
    });
  }
  if(!teste.length) return null;
  const esatta=teste.find(x=>+x.d===+oggi);
  if(esatta) return {pag:esatta.pag,data:esatta.d,k:esatta.k};
  /* la data di oggi non c'è: il titolo che per ordine è quello di oggi, se porta la data di un giorno prima */
  const quanti=Math.round((oggi-teste[0].d)/864e5), h=teste[quanti];
  if(quanti>0 && h && h.d<oggi) return {pag:h.pag,data:h.d,k:h.k};
  return null;
}
function paginaDiOggi(l,adesso){
  adesso=adesso||new Date();
  const gOggi=giornoDiOggi(l,adesso); if(gOggi) return gOggi.pag;
  const q=lezioneDelSabato(l,adesso);
  const tot=l.pagine||((l.testo||[]).length+(l.pagCop||0));
  /* senza la lezione (date mancanti o sbagliate) cerco la data di oggi in tutto il lezionario */
  const da=q?q.pag:1+(l.pagCop||0);
  const fine=q?Math.min(q.fine||tot+1,tot+1):tot+1;
  const testi={};
  for(let n=da;n<fine;n++) testi[n]=_senzaAccenti(ricuci((l.testo||[])[n-1-(l.pagCop||0)]||''));
  /* le pagine dove sta scritta una data (ne restano fuori le date di altri anni) */
  const pagineDel=d=>{
    const rx=_rxDataDiOggi(d.getDate(),d.getMonth()), trovate=[];
    for(let n=da;n<fine;n++){
      if(!testi[n]) continue;
      rx.lastIndex=0; let m;
      while((m=rx.exec(testi[n]))){ if(!m[2] || +m[2]===d.getFullYear()){ trovate.push(n); break; } }
    }
    return trovate;
  };
  const oggi=pagineDel(adesso);
  if(oggi.length) return oggi[0];
  if(!q) return null;
  /* la data di oggi non c'è (un giorno senza titolo, o stampato con la data sbagliata): il giorno
     più vicino prima di oggi che c'è nella lezione — e ne prendo l'ultima pagina di seguito */
  for(let k=1;k<7;k++){
    const pp=pagineDel(new Date(adesso.getFullYear(),adesso.getMonth(),adesso.getDate()-k));
    if(pp.length){ let ult=pp[0]; for(const x of pp.slice(1)){ if(x===ult+1) ult=x; else break; } return ult; }
  }
  const g=(q.giorni||[]).find(x=>x.k===adesso.getDay());
  return g ? g.pag : q.pag;
}
function paginaDaAprire(l){
  /* se stavo leggendo oggi, riprendo esattamente da dove ero rimasto */
  if(l.ultimaPag && l.quandoLetto && l.quandoLetto.slice(0,10)===iso(new Date())) return l.ultimaPag;
  const q=lezioneDelSabato(l);
  if(q){
    if(l.ultimaPag && l.ultimaPag>=q.pag && l.ultimaPag<(q.fine||1e9)) return l.ultimaPag;
    return q.pag;
  }
  return l.ultimaPag||1;
}
/* il lezionario giusto per il sabato che viene */
function lezionarioDiOggi(){
  const s=iso(prossimoSabato());
  const con=lezionari().filter(l=>(l.lezioni||[]).some(x=>x.data));
  let migliore=null;
  con.forEach(l=>{
    const dentro=(l.lezioni||[]).some(x=>x.data===s) ||
      ((l.lezioni||[]).some(x=>x.data<=s) && (l.lezioni||[]).some(x=>x.data>=s));
    if(dentro && (!migliore || l.lg===(stato.imp.lingua||'it'))) migliore=l;
  });
  return migliore;
}
/* ---------- l'indice: tutti i sabati ---------- */
function apriIndiceLez(daFuori){
  const l=LET.lez; if(!l) return;
  if(!l.lezioni||!l.lezioni.length) analizzaLezionario(l);
  const lez=l.lezioni||[];
  const oggi=lezioneDelSabato(l);
  const vai = daFuori ? (p=>`chiudi();apriLez('${l.i}',${p})`) : (p=>`chiudi();vaiPag(${p})`);
  apri(l.lg==='ro'?'Lecţiile':'Le lezioni',
    lez.length? `<div class="lez-el">${lez.map(x=>`
      <div class="lez-riga ${oggi&&oggi.n===x.n?'oggi':''}">
        <span class="nn" onclick="${vai(x.pag)}">${x.n}</span>
        <span class="cc" onclick="${vai(x.pag)}">
          <b>${esc(x.tit)}</b>
          <span>${x.data?esc(dataLunga(x.data,l.lg)):''}${oggi&&oggi.n===x.n?' · questo sabato':''}</span>
          ${x.giorni&&x.giorni.length?`<span class="lez-gg">${x.giorni.map(g=>
            `<button onclick="event.stopPropagation();${vai(g.pag)}">${esc(g.nome)}</button>`).join('')}</span>`:''}
        </span>
        <span class="pp" onclick="${vai(x.pag)}">p. ${x.pag}</span>
      </div>`).join('')}</div>`
     : `<p class="sotto" style="margin-top:0">In questo file non ho riconosciuto le lezioni
          ${(l.testo||[]).join('').trim().length<200?'(sembra fatto di immagini, senza testo dentro)':''}.
          Qui sotto ci sono tutte le pagine: tocca quella che vuoi.</p>
        <div class="fila" style="margin-bottom:12px">
          <button class="bt pi mini" onclick="rifaiIndice('${l.i}')">🔎 Cerca di nuovo le lezioni</button></div>
        <div class="lez-el">${elencoPagine(l)}</div>`,
    `<button class="bt pi" onclick="chiudi()">Chiudi</button>`,640,'alto');
}
/* quando le lezioni non si riconoscono: l'elenco di tutte le pagine,
   con la prima riga di ognuna, così si trova lo stesso quello che si cerca */
function elencoPagine(l){
  const tot=l.pagine||((l.testo||[]).length+(l.pagCop||0));
  let out='';
  for(let n=1;n<=tot;n++){
    const t=((l.testo||[])[n-1-(l.pagCop||0)]||'').replace(/\s+/g,' ').trim().slice(0,70);
    out+=`<div class="lez-riga" onclick="chiudi();${LET.lez&&LET.lez.i===l.i?`vaiPag(${n})`:`apriLez('${l.i}',${n})`}">
      <span class="nn">${n}</span><span class="cc"><b>${t?esc(t):'pagina '+n}</b></span></div>`;
  }
  return out;
}
function rifaiIndice(i){
  const l=trovaLez(i); if(!l) return;
  l.lezioni=null; analizzaLezionario(l); salva(); chiudi();
  LET.lez=l;
  if(l.lezioni&&l.lezioni.length) avvisa(`Trovate ${l.lezioni.length} lezioni`,'ok');
  else avvisa('Ancora niente: questo file non ha i titoli scritti in modo riconoscibile','no');
  apriIndiceLez(!($('#lettore')&&$('#lettore').classList.contains('on')));
}
function dataLunga(s,lg){
  const [a,m,g]=s.split('-').map(Number);
  const d=new Date(a,m-1,g);
  try{ return d.toLocaleDateString(lg==='ro'?'ro-RO':'it-IT',{weekday:'long',day:'numeric',month:'long',year:'numeric'}); }
  catch(e){ return s; }
}
