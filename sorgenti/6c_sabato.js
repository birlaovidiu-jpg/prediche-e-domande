/* ================= SCUOLA DEL SABATO — lezionari ================= */
const FL={ lg:'tutte', anno:0, q:'', scelto:'' };
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
  if(FL.anno && !anni.includes(FL.anno)) FL.anno=0;
  const q=ck(FL.q);
  const filtro=l=> (FL.lg==='tutte'||l.lg===FL.lg) && (!FL.anno || +l.anno===FL.anno) &&
    (!q || ck((l.titolo||'')+' '+l.anno+' '+(l.mesi||'')+' '+(l.testo||[]).join(' ')).includes(q));
  const elenco=tutti.filter(filtro).sort((a,b)=> (b.anno-a.anno)||(b.trim-a.trim));
  const diOggi=lezionarioDiOggi();
  const aMano = FL.scelto ? elenco.find(x=>x.i===FL.scelto) : null;
  const inEvidenza = q ? null : aMano || (elenco.includes(diOggi)?diOggi:null) || elenco[0];
  const lezOggi = inEvidenza ? lezioneDelSabato(inEvidenza) : null;

  document.body.classList.add('sab-fissa');
  pinta(`
  <div class="sab-pagina">
  <div class="sab-testa">
    <div><span class="occhiello">Studio</span><h1>Scuola del Sabato</h1></div>
    <p class="sotto">I lezionari in italiano e in rumeno. Puoi leggerli, evidenziare,
      scrivere e cambiare i colori, come fai con uPDF.</p>
  </div>

  ${inEvidenza?`
  <div class="lez-hero">
    <div class="lez-cop" onclick="apriLez('${inEvidenza.i}')">
      ${inEvidenza.cop?`<img src="${inEvidenza.cop}" alt="">`:`<div class="lez-noco">📘</div>`}
    </div>
    <div class="lez-info">
      <div class="occhiello">${esc(inEvidenza.lg==='ro'?'Școala de Sabat':'Lezionario della Scuola del Sabato')}</div>
      <h2 class="lez-tit">${esc(inEvidenza.titolo||('Lezionario '+inEvidenza.anno))}</h2>
      <div class="lez-anno">${esc(inEvidenza.anno)}</div>
      <div class="lez-tri">${TRIM.map(([n,br,mesi])=>{
        const qui=tutti.filter(x=>+x.anno===+inEvidenza.anno && +x.trim===+n);
        return `<div class="tri ${String(inEvidenza.trim)===n?'on':''}${qui.length?' c-e':''}">
          <b>${inEvidenza.lg==='ro'?TRIM_RO[+n-1]:br}</b><span>${esc(mesi)}</span>
          ${qui.length?`<div class="tri-lg">${qui.map(x=>
            `<button class="${x.i===inEvidenza.i?'on':''}" title="${esc(x.titolo||'')}"
              onclick="event.stopPropagation();scegliLez('${x.i}')">${x.lg==='ro'?'🇷🇴':'🇮🇹'}</button>`).join('')}</div>`:''}
        </div>`;}).join('')}</div>
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
        ${inEvidenza.pagine||'?'} pagine${inEvidenza.note&&Object.keys(inEvidenza.note).length?` · ${Object.keys(inEvidenza.note).length} pagine con appunti`:''}
        <span class="tag ${inEvidenza.lg==='it'?'it':'ro'}" style="margin-left:8px">${inEvidenza.lg==='it'?'Italiano':'Română'}</span></div>
    </div>
  </div>`:''}

  <div class="filtri sab-filtri">
    <div class="campo" style="flex:0 0 auto"><label>Lingua</label>
      <div class="segm">
        <button class="${FL.lg==='tutte'?'on':''}" onclick="setL('lg','tutte')">Tutte</button>
        <button class="${FL.lg==='it'?'on':''}" onclick="setL('lg','it')">🇮🇹</button>
        <button class="${FL.lg==='ro'?'on':''}" onclick="setL('lg','ro')">🇷🇴</button></div></div>
    ${anni.length?`<div class="campo" style="flex:0 0 auto"><label>Anno</label>
      <div class="segm" style="flex-wrap:wrap">
        <button class="${!FL.anno?'on':''}" onclick="setL('anno',0)">Tutti</button>
        ${anni.map(a=>`<button class="${FL.anno===a?'on':''}" onclick="setL('anno',${a})">${a}</button>`).join('')}
      </div></div>`:''}
    <div class="campo" style="flex:1 1 150px;max-width:420px"><label>Cerca</label>
      <div class="cerca"><input type="search" placeholder="Anno, trimestre o una parola dentro al lezionario…"
        value="${esc(FL.q)}" oninput="FL.q=this.value; clearTimeout(window._tl); window._tl=setTimeout(vSabato,300)"></div></div>
    <button class="bt pr" onclick="nuovoLez()">✚ Aggiungi lezionario</button>
  </div>

  ${elenco.length?`<div class="sab-elenco">
    <h2>Tutti i lezionari <span class="pill">${elenco.length}</span></h2>
    <div class="griglia g4 sab-griglia">${elenco.map(l=>`
      <div class="tess lez-carta" style="padding:0" onclick="apriLez('${l.i}')">
        <div class="lez-mini">${l.cop?`<img src="${l.cop}" alt="">`:'<div class="lez-noco">📘</div>'}
          <span class="lez-bollo">${esc(l.lg.toUpperCase())}</span></div>
        <div style="padding:10px 12px;position:relative">
          <b class="lez-nome">${esc(l.titolo||('Lezionario '+l.anno))}</b>
          <span style="font-size:11.5px;color:var(--tx3)">${esc(l.anno)} · ${esc(l.lg==='ro'?TRIM_RO[(+l.trim||1)-1]:(TRIM[(+l.trim||1)-1]||[])[1]||'')}</span>
          <button class="lez-cest" title="Elimina" onclick="event.stopPropagation();eliminaLez('${l.i}')">🗑</button>
        </div></div>`).join('')}</div></div>`
   :`<div class="vuoto"><span class="em">📚</span>${q?'Nessun lezionario trovato.':"Non c'è ancora nessun lezionario."}<br>
     ${q?'':'<button class="bt pr" style="margin-top:16px" onclick="nuovoLez()">✚ Aggiungi il primo</button>'}</div>`}
  </div>`);
}
function setL(k,v){ FL[k]=v; vSabato(); }
/* toccando la bandiera dentro al trimestre si passa a quel lezionario */
function scegliLez(i){ FL.scelto=i; vSabato(); }
/* l'indice si può guardare anche senza entrare nel lezionario */
function apriIndiceDaFuori(i){
  const l=trovaLez(i); if(!l) return;
  if(!l.lezioni||!l.lezioni.length) analizzaLezionario(l);
  LET.lez=l;
  apriIndiceLez(true);
}
function trovaLez(i){ return lezionari().find(l=>l.i===i); }

/* ---------- inserimento: lezionario + copertina uniti ---------- */
function nuovoLez(){
  const a=new Date().getFullYear();
  apri('Aggiungi un lezionario',`
   <div class="griglia" style="gap:13px">
    <div class="campo"><label>File PDF — puoi sceglierne due insieme: la copertina e il lezionario.
      Li unisco io in un solo lezionario.</label>
      <input type="file" id="nlF" accept="application/pdf" multiple onchange="anteprimaLez()"></div>
    <div class="nl-ant"><div class="nl-cop" id="nlCop"><span>📘</span></div>
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
  const m=/(20\d\d)[^\d]{0,3}([1-4])?/.exec(f[0].name);
  if(m){ $('#nlA').value=m[1]; if(m[2]) $('#nlT').value=m[2]; }
  /* leggo davvero le prime pagine e capisco lingua, anno e trimestre */
  ant.innerHTML+='<br>Leggo il file per capire di che lezionario si tratta…';
  try{
    await caricaPdfJs();
    let testo=''; const docs=[];
    for(const x of f){
      const doc=await pdfjsLib.getDocument({data:new Uint8Array(await x.arrayBuffer())}).promise;
      docs.push({nome:x.name,doc,n:doc.numPages});
      for(let n=1;n<=Math.min(4,doc.numPages);n++){
        const tc=await (await doc.getPage(n)).getTextContent();
        testo+=' '+tc.items.map(z=>z.str).join(' ');
      }
    }
    /* la copertina è il file con meno pagine; la faccio vedere subito */
    docs.sort((a,b)=>a.n-b.n);
    const cop=docs.length>1?docs[0]:docs[0];
    try{
      const img=await paginaInImmagine(cop.doc,1,300);
      const box=$('#nlCop'); if(box) box.innerHTML=`<img src="${img}" alt="">`;
    }catch(e){}
    if(docs.length>1) ant.dataset.unione=`Copertina: ${docs[0].nome} (${docs[0].n} pag.) · Lezionario: ${docs[docs.length-1].nome} (${docs[docs.length-1].n} pag.)`;
    else ant.dataset.unione='';
    const lg=linguaDelTesto(testo);
    const an=annoDelTesto(testo)||+$('#nlA').value;
    const tr=trimestreDelTesto(testo,lg)||+$('#nlT').value;
    const de=deduciTitolo(testo);
    $('#nlL').value=lg; $('#nlA').value=an; $('#nlT').value=tr;
    if(!$('#nlTi').value.trim() && de.titolo) $('#nlTi').value=de.titolo;
    ant.innerHTML=ant.innerHTML.replace('Leggo il file per capire di che lezionario si tratta…',
      `<b style="color:var(--verde-c)">Riconosciuto:</b> ${lg==='ro'?'română':'italiano'} · ${an} · ${tr}º trimestre${de.titolo?' · '+esc(de.titolo):''}`
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
    const cimg = await paginaInImmagine(copDoc,1,520);
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
    stato.lezionari=stato.lezionari||[];
    stato.lezionari.push({ i:id, lg:$('#nlL').value, anno:+$('#nlA').value, trim:+$('#nlT').value,
      titolo:$('#nlTi').value.trim()||dedotto.titolo, mesi:dedotto.mesi||'', vol:dedotto.vol||'',
      fid, cid, cop:cimg, pagine:corpo.n + (cop?cop.n:0), pagCop:cop?cop.n:0,
      testo, note:{}, ultimaPag:1, quando:new Date().toISOString() });
    const nuovo=stato.lezionari[stato.lezionari.length-1];
    bt.textContent='Cerco le lezioni…';
    try{ analizzaLezionario(nuovo); }catch(e){}
    salva(); chiudi(); vSabato();
    avvisa(nuovo.lezioni&&nuovo.lezioni.length ? `Lezionario aggiunto — trovate ${nuovo.lezioni.length} lezioni` : 'Lezionario aggiunto','ok');
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
    l.cop=await paginaInImmagine(doc,1,520);
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
  salva(); chiudi(); vSabato(); avvisa('Salvato','ok');
}
function eliminaLez(i){
  conferma('Vuoi eliminare questo lezionario e i suoi appunti?',async()=>{
    const l=trovaLez(i);
    if(l){ try{ await kvDel('all:'+l.fid); if(l.cid) await kvDel('all:'+l.cid); }catch(e){} }
    stato.lezionari=lezionari().filter(x=>x.i!==i); salva(); chiudi(); vSabato(); avvisa('Eliminato','ok');
  },'Elimina');
}
function condividiLez(i){
  const l=trovaLez(i); if(!l) return;
  const u=fileUrl[l.fid];
  apri('Condividi il lezionario',`
    <p class="sotto" style="margin-top:0">${esc(l.titolo||'')} — ${l.anno}, trimestre ${l.trim}</p>
    <div class="griglia g2">
      <div class="tess" onclick="chiudi();salvaLezUnito('${i}')"><span class="ti">📄</span>
        <b>Un solo PDF</b><span>Copertina e lezionario uniti, con i tuoi appunti stampati sopra.</span></div>
      <div class="tess" onclick="chiudi();salvaLezOriginale('${i}')"><span class="ti">💾</span>
        <b>File originale</b><span>Il PDF come l'hai caricato, senza appunti.</span></div>
    </div>`,`<button class="bt pi" onclick="chiudi()">Chiudi</button>`,560);
}
function salvaLezOriginale(i){
  const l=trovaLez(i), u=fileUrl[l.fid];
  if(!u){ avvisa('File non disponibile','no'); return; }
  const a=document.createElement('a'); a.href=u; a.download=`${l.titolo||'Lezionario'} ${l.anno}-${l.trim}.pdf`;
  document.body.appendChild(a); a.click(); setTimeout(()=>a.remove(),600);
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
function linguaDelTesto(t){
  t=(t||'').slice(0,60000);
  const segni=(t.match(/[ăâîşșţț]/gi)||[]).length;
  const paroleRo=(t.match(/\b(şi|și|pentru|este|Dumnezeu|Domnul|Sabat|lecţia|lecția|studiul|săptămâna|către|nostru)\b/gi)||[]).length;
  const paroleIt=(t.match(/\b(che|della|degli|dalla|Dio|Signore|sabato|lezione|settimana|nostro|perché|questo)\b/gi)||[]).length;
  return (segni*0.5 + paroleRo*3) > (paroleIt*3) ? 'ro' : 'it';
}
/* il trimestre: dai mesi scritti sulla copertina o nelle prime pagine */
function trimestreDelTesto(t,lg){
  const grezzo=ricuci((t||'').slice(0,20000));
  const b=ckl(grezzo);
  const m=/trimestrul\s*(i{1,3}v?|iv|[1-4])/.exec(b) || /([1-4])\s*trimestre/.exec(b);
  if(m){ const r={i:1,ii:2,iii:3,iv:4}[m[1]] || +m[1]; if(r>=1&&r<=4) return r; }
  const lista=MESI_LEZ[lg]||MESI_LEZ.it;
  const senza=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const testo=senza(grezzo);
  const rxMese=n2=>'(?:'+senza(n2).split('').join('\\s*')+')';
  const tutti='(?:'+lista.map(rxMese).join('|')+')';
  /* 1) sulle copertine c'è quasi sempre l'intervallo: «IULIE - SEPTEMBRIE» */
  const inter=new RegExp('(^|[^a-z])('+tutti+')\\s*[-–—]\\s*('+tutti+')([^a-z]|$)').exec(testo);
  if(inter){
    const k=lista.findIndex(m=>senza(m)===inter[2].replace(/\s+/g,''));
    if(k>=0) return Math.floor(k/3)+1;
  }
  /* 2) altrimenti il primo mese scritto per intero, saltando «mai»,
        che in rumeno è anche una parola comune («mai mult») */
  const dubbi = lg==='ro' ? ['mai'] : [];
  const cerca=(salta)=>{
    let primo=-1, dove=1e9;
    lista.forEach((nome,k)=>{
      if(salta && dubbi.includes(senza(nome))) return;
      const rx=new RegExp('(^|[^a-z])'+rxMese(nome)+'([^a-z]|$)');
      const i=testo.search(rx);
      if(i>=0&&i<dove){ dove=i; primo=k; }
    });
    return primo;
  };
  let primo=cerca(true);
  if(primo<0) primo=cerca(false);
  return primo>=0 ? Math.floor(primo/3)+1 : 0;
}
function annoDelTesto(t){
  const m=/(20[2-9]\d)/.exec((t||'').slice(0,20000));
  return m?+m[1]:0;
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
function prossimoSabato(){
  const d=new Date();
  const oggi=new Date(d.getFullYear(),d.getMonth(),d.getDate());
  if(d.getDay()===6){
    const l=luogoAttuale();
    if(!l) return oggi;
    const la=l.la!=null?l.la:l.lat, lo=l.lo!=null?l.lo:l.lon;
    const s=calcolaSole(d,la,lo);
    if(s.sempre||d<s.tramonto) return oggi;
  }
  const q=(6-d.getDay()+7)%7 || 7;
  return new Date(d.getFullYear(),d.getMonth(),d.getDate()+q);
}
function iso(d){ return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
function lezioneDelSabato(l){
  const lez=(l.lezioni||[]).filter(x=>x.data);
  if(!lez.length) return null;
  const s=iso(prossimoSabato());
  const date=lez.map(x=>x.data).sort();
  /* se il sabato che viene non cade dentro a questo lezionario
     (per esempio è un trimestre futuro) non c'è nessuna lezione da mostrare */
  if(s<date[0] || s>date[date.length-1]) return null;
  return lez.find(x=>x.data===s) || lez.filter(x=>x.data<=s).pop() || null;
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
