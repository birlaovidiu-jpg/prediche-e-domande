/* ================= HOME ================= */
const TESSERE_D=[
  {ic:'🎮',et:'Giochi biblici',su:'cruciverba, vero o falso, impiccato…',c:'#e6203f',sf:'nebulosa',
   az:"vai('giochi')"},
  {ic:'📖',et:'Domande bibliche',su:()=>{const c=contaLingue(tutteDomande());
     return `🇮🇹 ${c.it.toLocaleString('it-IT')} · 🇷🇴 ${c.ro.toLocaleString('it-IT')}`;},c:'#ff7a5c',sf:'oro',
   az:"vai('domande')",n:()=>tutteDomande().length},
];
const TESSERE_P=[
  {ic:'✍️',et:'Prediche',   su:'leggi, modifica, proietta',c:'#8b7bff',sf:'luce',   az:"vai('prediche')",  n:()=>tuttePrediche().length},
  {ic:'🎼',et:'Cantici',    su:'quattro innari',           c:'#e0b25c',sf:'aurora', az:"vai('cantici')",   n:()=>tuttiCantici().length},
  {ic:'🪶',et:'Poesie',     su:'versi da proiettare',      c:'#4fd1a5',sf:'prato',  az:"vai('poesie')",    n:()=>tuttePoesie().length},
  {ic:'🌟',et:'Esperienze', su:'testimonianze',            c:'#ffd166',sf:'grano',  az:"vai('esperienze')",n:()=>tutteEsperienze().length},
  {ic:'📚',et:'Scuola del Sabato',su:'lezionari da studiare',c:'#5bb8f0',sf:'mare', az:"vai('sabato')",    n:()=>(stato.lezionari||[]).length}
];
function tessera(x){
  const n = x.n ? x.n() : null;
  return `<button class="tz" style="--tc:${x.c}" onclick="${x.az}">
    <span class="tz-sf">${sfondoHtml(x.sf).replace('class="sfondo"','style="width:100%;height:100%;display:block"')}</span>
    <span class="tz-vel"></span>
    <span class="tz-glow"></span>
    <span class="tz-ic">${x.ic}</span>
    <span class="tz-tx"><b>${x.et}</b><i>${typeof x.su==='function'?x.su():x.su}</i></span>
    ${n!=null?`<span class="tz-n">${n.toLocaleString('it-IT')}</span>`:'<span class="tz-fr">›</span>'}
  </button>`;
}
function vHome(){
  document.body.classList.add('home-fissa');
  pinta(`
  <div class="hm">
    <div id="tzSole" class="hm-cielo">${pannelloSole()}</div>

    <div class="hm-riga">
      <div class="hm-eti dom"><i></i>Domande bibliche</div>
      <div class="hm-gr g3">${TESSERE_D.map(tessera).join('')}
        <button class="tz" style="--tc:#ffa94d" onclick="vai('chihadetto')">
          <span class="tz-sf">${sfondoHtml('oro').replace('class="sfondo"','style="width:100%;height:100%;display:block"')}</span>
          <span class="tz-vel"></span><span class="tz-glow"></span>
          <span class="tz-ic">💬</span>
          <span class="tz-tx"><b>Chi ha detto?</b><i>🇮🇹 ${contaLingue(CITAZIONI).it.toLocaleString('it-IT')} · 🇷🇴 ${contaLingue(CITAZIONI).ro.toLocaleString('it-IT')}</i></span>
          <span class="tz-n">${CITAZIONI.length.toLocaleString('it-IT')}</span></button>
      </div>
    </div>

    <div class="hm-riga">
      <div class="hm-eti pre"><i></i>Predicazione e culto</div>
      <div class="hm-gr g5">${TESSERE_P.map(tessera).join('')}</div>
    </div>

    <div class="hm-pie">
      <button class="tzp" onclick="cercaOvunque()"><span>🔎</span>Cerca ovunque</button>
      <button class="tzp" onclick="vai('dati')"><span>☁️</span>Dati e copie</button>
      <button class="tzp" onclick="vai('guida')"><span>📘</span>Guida</button>
    </div>
  </div>`);
  avviaOrologioSole();
}

function rimettiPredica(i){ if(stato.predVia) delete stato.predVia[i]; salva(); vDati(); avvisa('Rimessa nell\'elenco','ok'); }
function rimettiEsperienza(i){ if(stato.espVia) delete stato.espVia[i]; salva(); vDati(); avvisa('Rimessa nell\'elenco','ok'); }
function rimettiPoesia(i){ if(stato.poeVia) delete stato.poeVia[i]; salva(); vDati(); avvisa('Rimessa nell\'elenco','ok'); }
function rimettiCantico(i){ if(stato.cantVia) delete stato.cantVia[i]; salva(); vDati(); avvisa('Rimesso nell\'elenco','ok'); }
/* elimina per sempre UNA voce sola tolta dall'elenco (non tutte in blocco):
   resta "tolta" com'era già (invisibile), ma sparisce anche da qui sotto e
   non si può più rimettere — il campo *ViaDef ricorda quali non offrire più */
function eliminaDefinitiva(campo,i,tit){
  conferma('Vuoi eliminare definitivamente «'+(tit||'questa voce')+'»?\n\nNon la potrai più rimettere nell\'elenco.',()=>{
    stato[campo]=stato[campo]||{}; stato[campo][i]=1;
    salva(); vDati(); avvisa('Eliminata definitivamente','ok');
  },'Elimina definitivamente');
}
/* ================= DATI ================= */
function vDati(){
  const peso=(()=>{ try{ return Math.round(localStorage.getItem(LS).length/1024); }catch(e){ return 0; } })();
  pinta(`
  <div class="occhiello">Archivio</div>
  <h1>Dati e copie di sicurezza <span class="tag at" style="vertical-align:middle">Versione ${esc(VER)}</span></h1>
  <p class="sotto">Tutto quello che scrivi resta su questo dispositivo. Le domande e i cantici dell'archivio sono già dentro al programma.</p>

  <div class="griglia g3" style="margin:20px 0">
    <div class="kpi" style="--qc:var(--ross-c)"><div class="n">${peso}<small style="font-size:14px"> KB</small></div><div class="e">le tue aggiunte</div></div>
    <div class="kpi" style="--qc:var(--oro)"><div class="n">${stato.domandeMie.length+stato.cantici.length+stato.prediche.length+stato.esperienze.length+(stato.poesie||[]).length+(stato.lezionari||[]).length}</div><div class="e">voci tue</div></div>
    <div class="kpi" style="--qc:#786eff"><div class="n">${Object.keys(stato.versetti).length}</div><div class="e">versetti scritti</div></div>
  </div>

  <h2>Copia di sicurezza</h2>
  <div class="scheda">
    <p class="sotto" style="margin-top:0">Il file contiene tutto: le tue prediche, i cantici, le esperienze, le domande che hai scritto, i testi dei versetti, i lezionari con i loro PDF e i tuoi appunti, i libri con il segnalibro, gli allegati e la musica. Ricaricandolo su un altro dispositivo ritrovi tutto. Conservalo ogni tanto.</p>
    <div class="fila">
      <button class="bt pr" onclick="salvaCopia()">💾 Backup</button>
      <button class="bt" onclick="$('#fileCopia').click()">📂 Carica backup</button>
      <input type="file" id="fileCopia" accept=".zip,.json,application/zip,application/json" style="display:none" onchange="leggiCopia(this)">
    </div>
  </div>

  <h2>PDF dei lezionari</h2>
  <div class="scheda">
    <p class="sotto" style="margin-top:0">I PDF dei lezionari (originali e copertine) sono già dentro al backup qui sopra.
      Qui li scarichi da soli, tutti insieme in un unico file .zip — per esempio per portarli sul Mac
      e pubblicarli col sito.</p>
    <button class="bt pr" onclick="esportaLezionariPdf()">📦 Scarica tutti i PDF dei lezionari</button>
  </div>

  <h2>Impostazioni</h2>
  <div class="scheda">
    <div class="griglia g2" style="gap:14px">
      <div class="campo"><label>Intestazione della chiesa</label>
        <input type="text" value="${esc(stato.imp.chiesa)}" onchange="stato.imp.chiesa=this.value;salva()"></div>
      <div class="campo"><label>Chiesa locale</label>
        <input type="text" value="${esc(stato.imp.locale)}" onchange="stato.imp.locale=this.value;salva()"></div>
      <div class="campo"><label>Sfondo per il quiz e i cantici</label>
        <select onchange="stato.imp.sfondoProi=this.value;salva();avvisa('Sfondo cambiato','ok')">
          ${Object.keys(SFONDI).map(k=>`<option value="${k}" ${stato.imp.sfondoProi===k?'selected':''}>${SFONDI[k].ic} ${SFONDI[k].et}</option>`).join('')}</select></div>
      <div class="campo"><label>Nella proiezione</label>
        <label style="text-transform:none;letter-spacing:0;color:var(--tx2);font-weight:400;display:flex;gap:8px;align-items:center;margin-top:4px">
          <input type="checkbox" ${stato.imp.mostraNum?'checked':''} onchange="stato.imp.mostraNum=this.checked;salva()"> mostra il numero della domanda</label>
        <label style="text-transform:none;letter-spacing:0;color:var(--tx2);font-weight:400;display:flex;gap:8px;align-items:center">
          <input type="checkbox" ${stato.imp.quizMescOpz?'checked':''} onchange="stato.imp.quizMescOpz=this.checked;salva()"> mescola anche l'ordine delle risposte</label></div>
    </div>
  </div>

  <h2>Prediche, esperienze, poesie e cantici tolti</h2>
  <div class="scheda">
    <p class="sotto" style="margin-top:0">Quando togli dall'elenco una predica, un'esperienza, una
      poesia o un cantico che viene dai tuoi file, non lo butto via: resta qui e lo puoi rimettere quando vuoi.</p>
    ${(()=>{ const noDef=(via,def)=>Object.keys(via||{}).filter(k=>!(def&&def[k]));
      const via=noDef(stato.predVia,stato.predViaDef), ve=noDef(stato.espVia,stato.espViaDef),
            vp=noDef(stato.poeVia,stato.poeViaDef), vc=noDef(stato.cantVia,stato.cantViaDef);
      if(!via.length && !ve.length && !vp.length && !vc.length) return '<p style="color:var(--tx3);font-size:13px;margin:0">Non hai tolto niente.</p>';
      const coppia=(tit,btRimetti,btDef)=>`<span class="via-coppia"><button class="bt mini pi" onclick="${btRimetti}">↺ ${esc(tit)}</button><button class="bt mini pi" style="color:#ff8b9c" onclick="${btDef}" title="Elimina definitivamente">🗑</button></span>`;
      return `<div class="fila" style="flex-wrap:wrap;gap:7px">${via.map(k=>{
        const p=PREDICHE.concat(stato.prediche).find(x=>x.i===k)||{tit:k}, t=esc(p.tit).replace(/'/g,"\\'");
        return coppia(p.tit,`rimettiPredica('${k}')`,`eliminaDefinitiva('predViaDef','${k}','${t}')`);}).join('')}
        ${ve.map(k=>{ const e=ESPERIENZE.concat(stato.esperienze).find(x=>x.i===k)||{tit:k}, t=esc(e.tit).replace(/'/g,"\\'");
        return coppia(e.tit,`rimettiEsperienza('${k}')`,`eliminaDefinitiva('espViaDef','${k}','${t}')`);}).join('')}
        ${vp.map(k=>{ const q=POESIE.concat((stato.poesie||[])).find(x=>x.i===k)||{tit:k}, t=esc(q.tit).replace(/'/g,"\\'");
        return coppia(q.tit,`rimettiPoesia('${k}')`,`eliminaDefinitiva('poeViaDef','${k}','${t}')`);}).join('')}
        ${vc.map(k=>{ const n=CANTICI.find(x=>x.i===k)||{tit:k}, t=esc(n.tit).replace(/'/g,"\\'");
        return coppia(n.tit,`rimettiCantico('${k}')`,`eliminaDefinitiva('cantViaDef','${k}','${t}')`);}).join('')}</div>`;
    })()}
  </div>

  <h2>Prova degli sfondi</h2>
  <div class="griglia g4">${Object.keys(SFONDI).map(k=>`
    <div class="tess" style="padding:0;overflow:hidden" onclick="provaSfondo('${k}')">
      <div style="height:82px;position:relative">${sfondoHtml(k).replace('class="sfondo"','style="width:100%;height:100%;display:block"')}</div>
      <div style="padding:9px 11px"><b style="font-size:12.5px">${SFONDI[k].ic} ${SFONDI[k].et}</b></div></div>`).join('')}</div>

  <h2>Controllo interno</h2>
  <div class="scheda"><div class="fila">
    <button class="bt pi" onclick="mostraTest()">🔎 Esegui i controlli</button>
    <span id="esitoTest" style="color:var(--tx3);font-size:13.5px"></span></div></div>

  <p class="sotto dati-firma">Questa app è stata realizzata da Ovidiu Birla.</p>`);
}
function provaSfondo(k){ proietta([{t:'p-tit',tit:SFONDI[k].et,occ:'Prova dello sfondo'}],k,'Sfondo'); }
/* Il backup, invece di andare sempre nei Download, prova prima il foglio di condivisione del sistema:
   da lì «Salva in File» lascia scegliere DAVVERO la cartella, su Mac come su iPad e iPhone. Il file è UNO
   solo e si chiama sempre «prediche.zip» (prima «prediche.json», che si ricarica ancora). Al foglio di
   condivisione passo SOLO il file, senza titolo: con il titolo l'iPad salvava accanto un «Testo.txt». */
/* Il backup contiene TUTTO: lo stato (prediche, cantici, esperienze, domande, versetti, lezionari con i
   loro appunti, libri con il segnalibro, giocatori, impostazioni) E tutti i file veri che stanno a parte
   nella memoria del dispositivo — i PDF dei lezionari e delle copertine, i PDF dei libri, gli allegati
   delle prediche e delle esperienze, la musica dei cantici. Prima c'era solo lo stato: sul dispositivo
   nuovo i lezionari si vedevano in copertina ma non si aprivano. È uno .zip (senza compressione) con
   dentro «stato.json» e una cartella «allegati»: i file restano dove sono in memoria finché non si
   scrive, senza doverli copiare tutti insieme (anche con molti PDF l'iPhone ce la fa). */
async function zipBlob(voci,passo){
  const parti=[], centr=[]; let off=0;
  const u16=n=>[n&255,(n>>8)&255], u32=n=>[n&255,(n>>>8)&255,(n>>>16)&255,(n>>>24)&255];
  for(let k=0;k<voci.length;k++){
    const v=voci[k], nome=_te.encode(v.nome);
    const blob = v.blob instanceof Blob ? v.blob : new Blob([v.blob]);
    const c=crc32(new Uint8Array(await blob.arrayBuffer())), len=blob.size;
    const loc=new Uint8Array([...u32(0x04034b50),...u16(20),...u16(0x0800),...u16(0),...u16(0),...u16(0),
      ...u32(c),...u32(len),...u32(len),...u16(nome.length),...u16(0)]);
    parti.push(loc,nome,blob);
    centr.push({nome,c,len,off});
    off+=loc.length+nome.length+len;
    if(passo) passo(k+1,voci.length);
  }
  let cdLen=0;
  centr.forEach(e=>{
    const h=new Uint8Array([...u32(0x02014b50),...u16(20),...u16(20),...u16(0x0800),...u16(0),...u16(0),...u16(0),
      ...u32(e.c),...u32(e.len),...u32(e.len),...u16(e.nome.length),...u16(0),...u16(0),...u16(0),...u16(0),
      ...u32(0),...u32(e.off)]);
    parti.push(h,e.nome); cdLen+=h.length+e.nome.length;
  });
  parti.push(new Uint8Array([...u32(0x06054b50),...u16(0),...u16(0),...u16(centr.length),...u16(centr.length),
    ...u32(cdLen),...u32(off),...u16(0)]));
  return new Blob(parti,{type:'application/zip'});
}
/* legge uno .zip senza compressione (come quelli scritti qui): per ogni file il nome e il suo pezzo */
async function leggiZipBlob(f){
  const dv=async(da,n)=>new DataView(await f.slice(da,da+n).arrayBuffer());
  const fine=await dv(f.size-22,22);
  if(fine.getUint32(0,true)!==0x06054b50) throw new Error('lo zip non si legge');
  const quanti=fine.getUint16(10,true), cdLen=fine.getUint32(12,true), cdOff=fine.getUint32(16,true);
  const cd=await dv(cdOff,cdLen), td=new TextDecoder(), out=[];
  let p=0;
  for(let k=0;k<quanti;k++){
    if(cd.getUint32(p,true)!==0x02014b50) throw new Error('lo zip è rovinato');
    const metodo=cd.getUint16(p+10,true), len=cd.getUint32(p+20,true);
    const nl=cd.getUint16(p+28,true), el=cd.getUint16(p+30,true), cl=cd.getUint16(p+32,true), lo=cd.getUint32(p+42,true);
    const nome=td.decode(new Uint8Array(cd.buffer,cd.byteOffset+p+46,nl));
    if(metodo!==0) throw new Error('questo zip è compresso: usa il backup fatto dal programma');
    const lh=await dv(lo,30), inizio=lo+30+lh.getUint16(26,true)+lh.getUint16(28,true);
    out.push({nome, dati:f.slice(inizio,inizio+len)});
    p+=46+nl+el+cl;
  }
  return out;
}
async function salvaCopia(){
  avvisa('Preparo il backup con tutti i file…');
  let blob;
  try{
    const chiavi=(await kvChiavi()).filter(k=>typeof k==='string' && k.startsWith('all:'));
    const elenco=[], voci=[];
    for(const k of chiavi){
      try{ const b=await kvGet(k); if(!(b instanceof Blob)) continue;
        elenco.push({k, tipo:b.type||'', nome:b.name||''});
        voci.push({nome:'allegati/'+encodeURIComponent(k.slice(4)), blob:b}); }catch(e){}
    }
    const d={ programma:'Prediche e Domande', versione:VER, quando:new Date().toISOString(), stato, allegati:elenco };
    voci.unshift({nome:'stato.json', blob:new Blob([_te.encode(JSON.stringify(d))],{type:'application/json'})});
    blob=await zipBlob(voci,(n,t)=>{ if(t>5 && n%5===0) avvisa(`Backup: ${n} file su ${t}…`); });
  }catch(e){ console.error(e); avvisa('Non riesco a fare il backup: '+e.message,'no'); return; }
  const nome='prediche.zip';
  try{
    const file=new File([blob],nome,{type:'application/zip'});
    if(navigator.canShare && navigator.canShare({files:[file]})){
      await navigator.share({files:[file]});
      avvisa('Backup condiviso','ok'); return;
    }
  }catch(e){ if(e && e.name==='AbortError') return; }
  await salvaFile(nome,'application/zip',async()=>blob);
}
function rimettiStato(nuovo){
  stato=Object.assign(JSON.parse(JSON.stringify(BASE)),nuovo);
  stato.imp=Object.assign({},BASE.imp,nuovo.imp||{});
}
async function leggiCopia(inp){
  const f=inp.files[0]; if(!f) return;
  inp.value='';
  try{
    const testa=new Uint8Array(await f.slice(0,4).arrayBuffer());
    /* il backup nuovo, con tutti i file dentro */
    if(testa[0]===0x50 && testa[1]===0x4b){
      const voci=await leggiZipBlob(f);
      const st=voci.find(v=>v.nome==='stato.json');
      if(!st) throw new Error('non è un backup di questo programma');
      const d=JSON.parse(await st.dati.text());
      if(!d.stato) throw new Error('non è un backup di questo programma');
      const tipi={}; (d.allegati||[]).forEach(a=>{ tipi[a.k]=a; });
      const file=voci.filter(v=>v.nome.startsWith('allegati/'));
      conferma(`Ricaricando il backup, quello che hai adesso viene sostituito.\nDentro ci sono anche ${file.length} file (PDF dei lezionari e dei libri, allegati, musica). Vuoi procedere?`,async()=>{
        try{
          const ids=[];
          for(let k=0;k<file.length;k++){
            const id=decodeURIComponent(file[k].nome.slice('allegati/'.length)), a=tipi['all:'+id]||{};
            let b=new Blob([await file[k].dati.arrayBuffer()],{type:a.tipo||''});
            if(a.nome){ try{ b=new File([b],a.nome,{type:a.tipo||''}); }catch(e){} }
            await kvSet('all:'+id,b); ids.push(id);
            if(file.length>5 && (k+1)%5===0) avvisa(`Rimetto i file: ${k+1} su ${file.length}…`);
          }
          rimettiStato(d.stato);
          salva();
          await riprendiAllegati(ids);
          vai('home'); avvisa(`Backup ricaricato, con ${file.length} file`,'ok');
        }catch(e){ console.error(e); avvisa('Non riesco a ricaricare il backup: '+e.message,'no'); }
      },'Sì, ricarica');
      return;
    }
    const d=JSON.parse(await f.text());
    if(d.tipo==='archivio'&&!d.stato){ caricaArchivio(d); return; }
    if(d.domande&&!d.stato){ /* file di un quiz condiviso */
      let n=0;
      d.domande.forEach(q=>{
        const L=(LIBRI.find(x=>x[1]===q.libro||x[2]===q.libro)||[0])[0];
        stato.domandeMie.push({i:uid(),d:q.d,o:q.o,g:q.g,L:L||1,v:q.v||'',lg:q.lg||'it',mia:true}); n++;
        if(q.v&&q.testo) stato.versetti[q.v]=q.testo;
      });
      salva(); avvisa(`Importate ${n} domande`,'ok'); vai('domande'); return;
    }
    if(!d.stato) throw new Error('non è una copia di questo programma');
    /* un backup vecchio (prediche.json): c'è solo lo stato, i PDF non c'erano */
    conferma('Ricaricando la copia, quello che hai adesso viene sostituito. Questo è un backup vecchio: dentro non ci sono i PDF dei lezionari e dei libri. Vuoi procedere?',()=>{
      rimettiStato(d.stato);
      salva(); vai('home'); avvisa('Copia ricaricata','ok');
    },'Sì, ricarica');
  }catch(e){ avvisa('File non valido: '+e.message,'no'); }
}

/* Il file con le prediche, le poesie e le esperienze che prima stavano dentro al programma
   (strumenti/archivio/esporta.py): si AGGIUNGONO alle tue, senza sostituire niente, e da lì
   in poi sono tue come le altre (anche nel backup). Hanno gli stessi identificativi di prima,
   così i tuoi appunti/stili/luoghi/diapositive su quelle voci si ritrovano; quelle che hai
   già (o che avevi eliminato per sempre) non si aggiungono una seconda volta. */
function caricaArchivio(d){
  const pr=d.prediche||[], po=d.poesie||[], es=d.esperienze||[];
  conferma(`In questo file ci sono ${pr.length} prediche, ${po.length} poesie e ${es.length} esperienze.\nLe aggiungo a quelle che hai già (quelle che ci sono già non si doppiano). Vuoi procedere?`,()=>{
    stato.poesie=stato.poesie||[]; stato.predAnnot=stato.predAnnot||{};
    const c={pr:0,po:0,es:0};
    const gia=(el,i)=>el.some(x=>x.i===i);
    pr.forEach(p=>{
      if(gia(stato.prediche,p.i) || (stato.predViaDef||{})[p.i]) return;
      /* titolo/tema/riferimento che avevi corretto da ⚙ restavano a parte (meta): ora vanno dentro */
      const an=stato.predAnnot[p.i], m=an&&an.meta;
      const x=Object.assign({},p,m||{}); if(m) delete an.meta;
      x.sfondo=x.sfondo||sfondoDaTema(x.tit); x.blocchi=analizzaPredica(x.testo||'');
      stato.prediche.push(x); c.pr++;
    });
    po.forEach(p=>{
      if(gia(stato.poesie,p.i) || (stato.poeViaDef||{})[p.i]) return;
      const x=Object.assign({},p); x.blocchi=analizzaPoesia(x.testo||'');
      stato.poesie.push(x); c.po++;
    });
    es.forEach(e=>{
      if(gia(stato.esperienze,e.i) || (stato.espViaDef||{})[e.i]) return;
      stato.esperienze.push(Object.assign({},e)); c.es++;
    });
    salva(); menu(); vai('dati');
    avvisa(`Aggiunte ${c.pr} prediche, ${c.po} poesie e ${c.es} esperienze`,'ok');
  },'Sì, aggiungi');
}

/* ================= GUIDA ================= */
const CAP=[
 ['Che cos\'è questo programma',`Raccoglie in un unico file tutto quello che serve per il programma della chiesa: le <b>domande bibliche</b> con il quiz, i <b>cantici</b>, le <b>prediche</b> e le <b>esperienze</b>. Funziona senza internet, su Mac, iPad e iPhone. Basta aprirlo con Safari e, se vuoi, aggiungerlo alla schermata Home.`],
 ['Il quiz biblico',`In <b>❓ Domande bibliche</b> scegli la lingua, poi se vuoi tutta la Bibbia, solo l'Antico o il Nuovo Testamento, oppure un libro solo. Decidi quante domande e se in ordine o a caso, e premi <b>Avvia il quiz</b>.<br><br>
   In proiezione ogni domanda si apre in <b>cinque passi</b>, un tocco per volta sulla parte destra dello schermo:<br>
   1. solo la <b>domanda</b><br>2. la risposta <b>a</b><br>3. la risposta <b>b</b><br>4. la risposta <b>c</b><br>
   5. la <b>risposta giusta in verde</b>, con sotto il testo del versetto.<br><br>
   Il testo del versetto <b>non compare mai prima</b> della risposta. A <b>sinistra</b> torni indietro di un passo. Le due frecce in basso fanno la stessa cosa.`],
 ['Il versetto che si proietta',`In basso a destra c'è sempre il riferimento del versetto. <b>Toccalo</b> e si apre una diapositiva con il testo del versetto; tornando indietro sei di nuovo alla domanda.<br><br>I testi dei versetti si scrivono una volta sola da <b>📜 Testi dei versetti</b> e restano salvati. Puoi anche incollarne molti insieme, una riga per versetto, nella forma <code>Genesi 1:1 = Nel principio…</code>`],
 ['Lo schermo della chiesa',`Premi <b>🖥</b> nella barra dei comandi: si apre una <b>seconda finestra</b>, da trascinare sullo schermo grande e mettere a tutto schermo. Su quella finestra non compaiono né frecce né comandi: solo il contenuto. Tu continui a comandare dalla tua finestra, e le due restano sempre insieme.<br><br>Se invece proietti dallo stesso schermo, i comandi in basso <b>spariscono da soli</b> dopo qualche secondo; ricompaiono muovendo il dito o il mouse.`],
 ['I cantici',`Due raccolte: <b>Cantici Ovidiu</b> e <b>Cantici SDARM</b>, in italiano e in rumeno. Cerca per <b>titolo</b>, per <b>numero</b> o per una <b>parola qualsiasi</b> del testo.<br><br>In proiezione il <b>ritornello torna dopo ogni strofa</b>, così basta andare sempre avanti senza tornare indietro. Con <b>✚ Nuovo cantico</b> ne aggiungi altri: separa le strofe con una riga vuota e scrivi il ritornello nel suo campo.`],
 ['Le prediche',`Con <b>✚ Nuova predica</b> incolli il testo così com'è. Il programma riconosce da solo i <b>titoli</b> (righe che finiscono con i due punti o tutte in maiuscolo), le <b>citazioni bibliche</b> fra virgolette o con il riferimento fra parentesi, e gli <b>elenchi</b> numerati o con il trattino.<br><br>Da lì ottieni tre cose: la <b>lettura a schermo</b> con caratteri grandi (e i tasti A− A+ per ingrandirli ancora), la <b>proiezione</b> con lo sfondo scelto, e il <b>PDF</b>.`],
 ['Gli sfondi',`Dodici sfondi disegnati dal programma — notte stellata, alba, raggi di luce, croce, acque, deserto, fuoco, cielo, oro, pietra, campo di grano e uno sobrio. Sono <b>animati</b> e non appesantiscono il file perché non sono fotografie.<br><br>Scrivendo il tema della predica lo sfondo viene proposto da solo. Li puoi provare tutti da <b>☁️ Dati</b>.`],
 ['Condividere il quiz',`In <b>📤 Condividi quiz</b> scegli tutte le domande oppure solo quelle che vuoi, toccandole una per una. Poi:<br>
   • <b>PowerPoint</b> — due diapositive per domanda: prima la domanda, poi la risposta in verde. Funziona come il quiz.<br>
   • <b>PDF</b> — le stesse due pagine per domanda.<br>
   • <b>Testo semplice</b> — per stamparlo o mandarlo per messaggio.<br>
   • <b>File del quiz</b> — un file che un'altra persona può ricaricare nel suo programma da ☁️ Dati.`],
 ['Le esperienze',`In <b>🌟 Esperienze</b> raccogli le testimonianze. Puoi allegare foto o documenti e proiettarle esattamente come le prediche.`],
 ['Le poesie',`In <b>🪶 Poesie</b> trovi i testi da leggere o da proiettare. In proiezione va una strofa per volta e il testo <b>riempie sempre lo schermo</b>, qualunque sia la lunghezza della strofa.`],
 ['La Scuola del Sabato',`In <b>📚 Scuola del Sabato</b> tieni i lezionari in italiano e in rumeno.<br><br>
   Entrando vedi l'<b>ultimo anno</b> con la copertina grande e i quattro trimestri con i mesi; quello in corso è evidenziato.<br><br>
   <b>Aggiungi lezionario</b>: scegli il PDF. Se scegli <b>due file</b> — il lezionario e la copertina — li unisco io: quello con meno pagine diventa la copertina e va davanti, e da lì in poi vedi sempre la copertina.<br><br>
   <b>Apri e studia</b>: puoi <b>evidenziare</b> 🖍, <b>scrivere a mano</b> ✏️, <b>aggiungere un appunto scritto</b> 🅣 e <b>cancellare</b> 🧽, scegliendo il colore e lo spessore — come fai con uPDF. Tutto resta salvato pagina per pagina.<br><br>
   La <b>ricerca</b> guarda dentro al testo di tutti i lezionari: puoi cercare un anno, un trimestre o una parola qualsiasi.<br><br>
   <b>Condividi</b> ti dà due strade: un <b>solo PDF</b> con copertina, lezionario e i tuoi appunti stampati sopra, oppure il <b>file originale</b>.`],
 ['Le copie di sicurezza',`Quello che scrivi resta su questo dispositivo. Da <b>☁️ Dati</b> scarica ogni tanto la <b>copia di sicurezza</b>: è un file solo, che rimette tutto a posto se cambi dispositivo o se cancelli per sbaglio.`]
];
function vGuida(){
  pinta(`<div class="occhiello">Manuale</div><h1>Guida</h1>
  <p class="sotto">Dieci capitoli brevi. Tocca un titolo per aprirlo.</p>
  <div class="el" style="margin-top:20px">${CAP.map((c,i)=>`
    <div style="background:var(--sup);border:1px solid var(--bordo);border-radius:var(--r2);overflow:hidden">
      <div class="rg" style="border:0;background:none;border-radius:0" onclick="apreCap(${i})">
        <div class="num">${i+1}</div><div class="cp"><b>${c[0]}</b></div><div style="color:var(--tx3)" id="fr${i}">▾</div></div>
      <div id="cap${i}" style="display:none;padding:0 16px 16px 74px;color:var(--tx2);line-height:1.72;font-size:14.5px">${c[1]}</div>
    </div>`).join('')}</div>`);
}
function apreCap(i){
  const c=$('#cap'+i), f=$('#fr'+i), ap=c.style.display==='none';
  c.style.display=ap?'block':'none'; f.textContent=ap?'▴':'▾';
}
