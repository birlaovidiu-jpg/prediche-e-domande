/* ================= PREDICHE ================= */
const FP={ lg:'ro', q:'' };

/* --- riconoscimento automatico della struttura del testo --- */
const RIF=/((?:[1-3]\s*°?\s*)?[A-ZÀ-ÖØ-Þ][a-zà-öø-þA-ZÀ-Þ\.\s]{2,24}?)\s+(\d+)\s*[:,]\s*(\d+(?:\s*[-–]\s*\d+)?)/;
function pareRif(r){ return RIF.test(r) && r.length<60; }
/* riferimento biblico all'inizio di un blocco: "1Samuel 15:13 ...", "Matteo 19:16 ..." */
const RIF_INIZIO=/^\s*((?:[1-3]\s*°?\s*)?[A-ZÀ-Þ][A-Za-zà-þ\.]{1,16}(?:\s+[A-Za-zà-þ]{2,16}){0,2})\s+(\d{1,3})\s*[:,]\s*(\d{1,3}(?:\s*[-–]\s*\d{1,3})?)/;
function analizzaPredica(testo){
  /* i blocchi sono separati da una riga vuota: rispetto come hai scritto tu */
  const blocchi=String(testo||'').split(/\n\s*\n/).map(b=>b.replace(/[ \t]+/g,' ').trim()).filter(Boolean);
  const out=[];
  blocchi.forEach(b=>{
    const righe=b.split('\n').map(r=>r.trim()).filter(Boolean);
    if(!righe.length) return;
    /* passo biblico: il blocco comincia con libro capitolo:versetto */
    const m=RIF_INIZIO.exec(righe[0]);
    if(m && m.index===0){
      const rif=`${m[1].trim()} ${m[2]}:${m[3]}`.replace(/\s+/g,' ');
      const corpo=righe.join('\n').slice(m[0].length).replace(/^\s*[.,;:–-]?\s*/,'').trim();
      if(corpo){ out.push({t:'cit',rif,testo:corpo}); return; }
    }
    /* elenco numerato o puntato */
    const tuttiElenco = righe.length>1 && righe.every(r=>/^\s*(?:\d{1,2}[\.\)]|[-–•*])\s+/.test(r));
    if(tuttiElenco){
      out.push({t:'punti',tit:'',punti:righe.map(r=>r.replace(/^\s*(?:\d{1,2}[\.\)]|[-–•*])\s+/,'').trim())});
      return;
    }
    righe.forEach(r=>{
      const titolo = r.length<=72 && (/[:：]\s*$/.test(r) ||
        (r===r.toUpperCase() && /[A-ZÀ-Þ]/.test(r) && r.length>3));
      if(titolo){ out.push({t:'titolo',testo:r.replace(/[:：]\s*$/,'').replace(/^[«"“]|[»"”]$/g,'')}); return; }
      const el=/^\s*(?:\d{1,2}[\.\)]|[-–•*])\s+(.{2,})$/.exec(r);
      if(el){
        const ult=out[out.length-1];
        if(ult && ult.t==='punti') ult.punti.push(el[1].trim());
        else out.push({t:'punti',tit:'',punti:[el[1].trim()]});
        return;
      }
      /* citazione fra virgolette col riferimento in fondo */
      const virg=/^[«"“](.+)[»"”]\s*[\(\[]?\s*([^\(\)\[\]]{3,40})?\s*[\)\]]?\s*$/.exec(r);
      if(virg && (!virg[2] || RIF_INIZIO.test(virg[2]))){
        out.push({t:'cit',testo:virg[1].trim(),rif:(virg[2]||'').trim()}); return;
      }
      out.push({t:'testo',testo:r});
    });
  });
  /* se la prima riga ripete il titolo del documento, la tolgo */
  return out;
}
/* spezza un paragrafo lungo in diapositive leggibili */
function spezza(t,max){
  max=max||230;
  if(t.length<=max) return [t];
  let fr=t.match(/[^.!?…;]+[.!?…;]*\s*/g)||[t];
  /* un frammento più lungo del limite viene diviso per parole */
  fr=fr.flatMap(f=>{
    if(f.length<=max) return [f];
    /* una parola più lunga del limite viene tagliata di netto */
    const par=f.split(/\s+/).flatMap(v=>{
      if(v.length<=max) return [v];
      const t2=[]; for(let k=0;k<v.length;k+=max) t2.push(v.slice(k,k+max)); return t2;
    });
    const pezzi=[]; let r='';
    par.forEach(v=>{ if((r+' '+v).trim().length>max && r){ pezzi.push(r+' '); r=v; } else r=(r?r+' ':'')+v; });
    if(r.trim()) pezzi.push(r);
    return pezzi;
  });
  const out=[]; let cur='';
  fr.forEach(f=>{ if((cur+f).length>max && cur){ out.push(cur.trim()); cur=f; } else cur+=f; });
  if(cur.trim()) out.push(cur.trim());
  return out;
}
/* i blocchi da mostrare: salto la prima riga se ripete il titolo */
function blocchiUtili(p){
  const b=(p.blocchi||[]).slice();
  while(b.length && (b[0].t==='testo'||b[0].t==='titolo') && ck(b[0].testo||'')===ck(p.tit||'')) b.shift();
  return b;
}
function slidePredica(p){
  const s=[{t:'p-tit',tit:p.tit,occ:p.tema||'',rif:p.rif||''}];
  (p.blocchiScelti||blocchiUtili(p)).forEach(b=>{
    if(b.t==='titolo') s.push({t:'p-tit',tit:b.testo});
    else if(b.t==='cit') s.push({t:'p-cit',testo:b.testo,rif:b.rif});
    else if(b.t==='punti'){
      for(let i=0;i<b.punti.length;i+=4) s.push({t:'p-punti',tit:b.tit||'',punti:b.punti.slice(i,i+4)});
    }
    else if(b.t==='mia'){
      const x=b.sl||{};
      if(x.tipo==='titolo') s.push({t:'p-tit',tit:x.testo||''});
      else if(x.tipo==='cit') s.push({t:'p-cit',testo:x.testo||'',rif:x.rif||''});
      else if(x.tipo==='img') s.push({t:'p-img',src:fileUrl[x.id]||'',testo:x.rif||'',tit:x.testo||''});
      else spezza(x.testo||'').forEach(t=>s.push({t:'p-testo',testo:t}));
    }
    else spezza(b.testo).forEach(x=>s.push({t:'p-testo',testo:x}));
  });
  return s;
}
/* sfondo suggerito dal tema */
const CHIAVI=[
  [/notte|stell|veglia|noapte|stele/i,'notte'], [/alba|matt|risveglio|dimineat|zori/i,'alba'],
  [/luce|lumin|gloria|splend|lumin/i,'luce'], [/croce|calvario|sacrific|cruce|jertf/i,'croce'],
  [/acqua|battesim|mare|fiume|apa|botez|rau/i,'acqua'], [/desert|prova|tentazion|pustie|ispit/i,'deserto'],
  [/fuoco|spirito|pentecost|zelo|foc|duh/i,'fuoco'], [/cielo|nube|ritorno|venuta|cer|nor|revenire/i,'cielo'],
  [/tesoro|corona|ricompens|oro|rasplat|cunun/i,'oro'], [/roccia|fondament|legge|piatra|lege|temelie/i,'pietra'],
  [/messe|semin|racc|frutto|secer|saman|rod/i,'grano']
];
function sfondoDaTema(t){
  const s=(t||'');
  for(const [re,v] of CHIAVI) if(re.test(s)) return v;
  /* se il tema non dice nulla, scelgo comunque uno sfondo diverso per ogni titolo */
  const giro=['notte','alba','luce','cielo','pietra','grano','acqua','oro','deserto','croce'];
  let h=0; for(let i=0;i<s.length;i++) h=(h*31+s.charCodeAt(i))>>>0;
  return giro[h%giro.length];
}

function tuttePrediche(){
  const via=stato.predVia||{};
  return PREDICHE.concat(stato.prediche).filter(p=>!via[p.i]);
}
function vPrediche(){
  const q=ck(FP.q);
  document.body.classList.remove('pred-fissa');
  const el=tuttePrediche().filter(p=>(FP.lg==='tutte'||p.lg===FP.lg) &&
    (!q||ck(p.tit+' '+(p.tema||'')+' '+(p.rif||'')+' '+(p.testo||'')).includes(q)))
    .sort((a,b)=>a.tit.localeCompare(b.tit,'it',{sensitivity:'base',numeric:true}));
  pinta(`
  <div class="occhiello">Predicazione</div>
  <h1>Prediche</h1>
  <p class="sotto">Incolla il testo e il programma lo prepara da solo: la lettura a schermo con caratteri grandi e le diapositive per lo schermo della chiesa.</p>
  <div class="filtri" style="margin-top:20px">
    <div class="campo" style="flex:0 0 auto"><label>Lingua</label>
      <div class="segm">
        <button class="${FP.lg==='tutte'?'on':''}" onclick="setP('lg','tutte')">Tutte</button>
        <button class="${FP.lg==='it'?'on':''}" onclick="setP('lg','it')">🇮🇹 Italiano</button>
        <button class="${FP.lg==='ro'?'on':''}" onclick="setP('lg','ro')">🇷🇴 Română</button>
      </div></div>
    <div class="campo" style="flex:1 1 220px"><label>Cerca</label>
      <div class="cerca"><input type="search" placeholder="Titolo, tema o parola del testo…" value="${esc(FP.q)}"
        oninput="FP.q=this.value; clearTimeout(window._tp); window._tp=setTimeout(vPrediche,260)"></div></div>
    <button class="bt pr" onclick="nuovaPredica()">✚ Nuova predica</button>
  </div>
  ${(sotto(`${tuttePrediche().length} prediche in tutto · ${el.length} qui`),'')}
  ${el.length?`<div class="griglia g2">${el.map(p=>cartaPredica(p)).join('')}</div>`
    :`<div class="vuoto"><span class="em">📖</span>Non c'è ancora nessuna predica.<br>
      <button class="bt pr" style="margin-top:16px" onclick="nuovaPredica()">✚ Scrivi la prima</button></div>`}`);
}
function setP(k,v){ FP[k]=v; vPrediche(); }
function cartaPredica(p){
  const n=blocchiUtili(p).length;
  return `<div class="scheda" style="padding:0;overflow:hidden">
    <div style="height:132px;position:relative;background:#05070c">
      <div style="position:absolute;inset:0">${sfondoHtml(p.sfondo||'notte').replace('class="sfondo"','style="width:100%;height:100%;display:block"')}</div>
      <div style="position:absolute;left:16px;right:16px;bottom:12px">
        <div style="font-size:10.5px;letter-spacing:2.4px;text-transform:uppercase;color:rgba(255,255,255,.7);font-weight:600">${esc(p.tema||'')}</div>
        <div class="cp-tit">${esc(p.tit)}</div>
      </div>
      <span class="tag ${p.lg==='it'?'it':'ro'}" style="position:absolute;top:11px;right:12px">${p.lg==='it'?'IT':'RO'}</span>
    </div>
    <div style="padding:14px 16px">
      <div style="font-size:12.5px;color:var(--tx3);margin-bottom:11px">
        ${p.rif?'📖 '+esc(p.rif)+' · ':''}${n} blocchi · ${slidePredica(p).length} diapositive${p.data?' · '+dataIt(p.data):''}</div>
      <div class="fila">
        <button class="bt mini pr" onclick="proiettaPredica('${p.i}')">▶︎ Proietta</button>
        <button class="bt mini" onclick="leggiPredica('${p.i}')">👁 Leggi</button>
        <button class="bt mini pi" onclick="pdfPredica('${p.i}')">📄 PDF</button>
      </div>
    </div></div>`;
}
/* il foglio di lettura serve anche alle esperienze: le cerco anche fra quelle */
function trovaPredica(i){
  return tuttePrediche().find(p=>p.i===i) ||
         (typeof tutteEsperienze==='function' ? tutteEsperienze().find(p=>p.i===i) : null);
}
function eUnEsperienza(i){
  return typeof tutteEsperienze==='function' && tutteEsperienze().some(x=>x.i===i);
}

/* --- annotazioni personali su una predica (anche su quelle d'archivio) --- */
function annot(i){ stato.predAnnot=stato.predAnnot||{};
  return (stato.predAnnot[i]=stato.predAnnot[i]||{luoghi:[],stile:{},html:''}); }
const STILE_BASE={fam:'serif',dim:21,col:'#241d10',all:'left',interl:1.75,pag:'#f7f1e3'};
function stilePredica(i){
  const p=trovaPredica(i);
  /* le prediche prese dai tuoi file partono con il carattere, la misura e il
     colore che avevano in Pages; poi puoi cambiarli tu con A− e A+ */
  const suo = p && p.html ? {fam:p.fam||'helvetica', dim:p.px||21, col:p.col||'#241d10',
                             pag:'#ffffff', interl:1.45} : {};
  return Object.assign({},STILE_BASE,suo,annot(i).stile||{});
}
/* virgolette singole: questi valori finiscono dentro un attributo style */
const FAMIGLIE={
  serif:"'Iowan Old Style',Palatino,Georgia,serif",
  classico:"'Times New Roman',Times,serif",
  georgia:"Georgia,'Times New Roman',serif",
  palatino:"Palatino,'Palatino Linotype',Georgia,serif",
  baskerville:"Baskerville,'Iowan Old Style',Georgia,serif",
  moderno:"'SF Pro Text','Avenir Next',-apple-system,Helvetica,Arial,sans-serif",
  umanista:"Optima,'Gill Sans','Avenir Next',sans-serif",
  avenir:"'Avenir Next',Avenir,'Helvetica Neue',sans-serif",
  helvetica:"'Helvetica Neue',Helvetica,Arial,sans-serif",
  verdana:"Verdana,Geneva,sans-serif",
  macchina:"'Courier New',Courier,monospace"};
const NOMI_FAM={serif:'Elegante',classico:'Times',georgia:'Georgia',palatino:'Palatino',
  baskerville:'Baskerville',moderno:'Moderno',umanista:'Optima',avenir:'Avenir',
  helvetica:'Helvetica',verdana:'Verdana',macchina:'Macchina da scrivere'};
const COL_TESTO=['#241d10','#000000','#7a1020','#1a3d6b','#2e5b34','#6b3f8a','#8a5a10','#4a4a4a'];
const COL_EVID =['#ffe14d','#a8f0a0','#9fd8ff','#ffb3c8','#e0c0ff','#ffd39f','#b8f2ea','#e8e8e8'];
const COL_PAG  =['#f7f1e3','#ffffff','#fdf3dc','#f2efe6','#eaf2f6','#f7eef4','#eef5ec','#e8e2d2'];

/* --- lettura su foglio: schermo intero, una barra sola --- */
/* la lingua in cui sto leggendo questa predica adesso */
let PR_LG=null;
function linguaPredica(i){
  const p=trovaPredica(i);
  return PR_LG || (p?p.lg:'ro');
}
/* il testo della predica nella lingua scelta:
   ogni lingua ha il suo foglio, ma lo stile del foglio è lo stesso */
function testoLingua(i,lg){
  const a=annot(i), p=trovaPredica(i);
  a.testi=a.testi||{};
  if(a.testi[lg]!=null) return a.testi[lg];
  /* la prima volta: la lingua della predica prende il testo che c'era */
  if(p && lg===p.lg) return a.html||'';
  return null;
}
function scriviLingua(i,lg,html){
  const a=annot(i), p=trovaPredica(i);
  a.testi=a.testi||{};
  a.testi[lg]=html;
  if(p && lg===p.lg) a.html=html;   /* la lingua di casa resta anche dov'era prima */
}
function cambiaLinguaPredica(i,lg){
  const p=trovaPredica(i); if(!p) return;
  const gia=testoLingua(i,lg);
  if(gia!=null && gia!==''){ PR_LG=lg; leggiPredica(i); return; }
  const altra = lg==='it' ? 'italiano' : 'rumeno';
  conferma(`Questa predica non c'è ancora in ${altra}.<br><br>
     Te la copio uguale — stessi caratteri, stessi colori, stessa impaginazione —
     e tu cambi solo le parole.`,()=>{
    const f=$('#foglioPr');
    scriviLingua(i,lg, f?f.innerHTML:corpoPredica(p,annot(i)));
    salva(); PR_LG=lg; leggiPredica(i);
    setTimeout(()=>modificaTesto(i),200);
  },'Copiala');
}
function leggiPredica(i){
  const p=trovaPredica(i); if(!p) return;
  const a=annot(i), s=stilePredica(i);
  const lg=linguaPredica(i);
  sezione='prediche';
  $('#titSez').textContent='Predica'; $('#sottoSez').textContent=p.tit;
  document.body.classList.remove('home-fissa','sab-fissa');
  document.body.classList.add('pred-fissa');
  _predAperta=i;
  const luoghi=(a.luoghi||[]).length;
  const esp=eUnEsperienza(i);
  if(esp){ sezione='esperienze'; $('#titSez').textContent='Esperienza'; }
  pinta(`
  <div class="pr-pagina">
  <div class="pr-barra no-stampa" id="prTop">
    <button class="bt pi mini" onclick="chiudiPredica()">‹ ${esp?'Esperienze':'Prediche'}</button>
    ${esp
      ? `${bolloEsp(p)}${p.rif?`<span class="esp-rif">📖 ${esc(p.rif)}</span>`:''}`
      : `<button class="bt mini pi" onclick="aggiungiLuogo('${i}')" title="Chiese e date in cui l'hai predicata">
          📍 Dove ho predicato${luoghi?` <b class="pl-n">${luoghi}</b>`:''}</button>`}

    <span class="bs" id="prScrivi" ${PR_MOD?'':'hidden'}>
      <button class="bx" onmousedown="cmd(event,'bold')" title="Grassetto"><b>B</b></button>
      <button class="bx" onmousedown="cmd(event,'italic')" title="Corsivo"><i>I</i></button>
      <button class="bx" onmousedown="cmd(event,'underline')" title="Sottolineato"><u>U</u></button>
      <button class="bx" onmousedown="cmd(event,'strikeThrough')" title="Barrato"><s>S</s></button>
      <select class="bsel" onchange="cmdVal(event,'fontName',FAMIGLIE[this.value])" title="Carattere di quello che hai scelto">
        <option value="">Aa</option>
        ${Object.keys(FAMIGLIE).map(k=>`<option value="${k}">${NOMI_FAM[k]}</option>`).join('')}</select>
      <button class="bx" onmousedown="ingrandisci(event,1)" title="Fai più grande questa parola">A▲</button>
      <button class="bx" onmousedown="ingrandisci(event,-1)" title="Fai più piccola questa parola">A▼</button>
      <button class="bx col-bt" onclick="apriColori(event,'Colore di quello che hai scelto',COL_TESTO,'#000000',c=>document.execCommand('foreColor',false,c))" title="Colore"><b style="color:#e6203f">A</b>▾</button>
      <button class="bx col-bt" onclick="apriColori(event,'Evidenziatore',COL_EVID,'#ffe14d',c=>evidenziaCol(c))" title="Evidenziatore">🖍▾</button>
      <button class="bx" onmousedown="evidenziaCol('transparent',event)" title="Togli l'evidenziatore">⌫</button>
      <button class="bx" onmousedown="cmd(event,'justifyLeft')" title="A sinistra">⬅︎</button>
      <button class="bx" onmousedown="cmd(event,'justifyCenter')" title="Al centro">↔︎</button>
      <button class="bx" onmousedown="cmd(event,'justifyFull')" title="Giustificato">☰</button>
      <button class="bx" onmousedown="cmd(event,'justifyRight')" title="A destra">➡︎</button>
      <button class="bx" onmousedown="cmd(event,'insertUnorderedList')" title="Elenco puntato">•</button>
      <button class="bx" onmousedown="cmd(event,'insertOrderedList')" title="Elenco numerato">1.</button>
      <button class="bx" onmousedown="cmd(event,'formatBlock','blockquote')" title="Segna come versetto">❝</button>
      <button class="bx" onmousedown="cmd(event,'formatBlock','h3')" title="Titoletto">H</button>
      <button class="bx" onclick="mettiImmagine('${i}')" title="Metti una figura">🖼</button>
      <button class="bx" onmousedown="cmd(event,'removeFormat')" title="Togli la formattazione">✕</button>
    </span>

    <span class="bs">
      <select class="bsel" onchange="setStile('${i}','fam',this.value)" title="Carattere di tutto il foglio">
        ${Object.keys(FAMIGLIE).map(k=>`<option value="${k}" ${s.fam===k?'selected':''}>${NOMI_FAM[k]}</option>`).join('')}
      </select>
      <button class="bx" onclick="setStile('${i}','dim',${Math.max(13,s.dim-2)})" title="Più piccolo">A−</button>
      <span class="bnum">${s.dim}</span>
      <button class="bx" onclick="setStile('${i}','dim',${Math.min(48,s.dim+2)})" title="Più grande">A+</button>
      <button class="bx col-bt" onclick="apriColori(event,'Colore della pagina',COL_PAG,'${s.pag}',c=>setStile('${i}','pag',c))" title="Colore della pagina">
        <i class="pt" style="background:${s.pag}"></i>Pagina ▾</button>
      <select class="bsel pic" onchange="setStile('${i}','interl',+this.value)" title="Interlinea">
        ${[1.2,1.4,1.75,2.1,2.5].map(v=>`<option value="${v}" ${s.interl===v?'selected':''}>↕ ${v}</option>`).join('')}</select>
    </span>

    <span style="flex:1"></span>
    ${PR_MOD?`<button class="bt mini pi" onclick="annullaTesto('${i}')">Annulla</button>
       <button class="bt mini vd" onclick="salvaTesto('${i}')">✓ Salva</button>`
      :`<button class="bt mini" onclick="modificaTesto('${i}')">✎ Modifica</button>`}
    <button class="bt pr mini" onclick="${esp?`proiettaEsperienza('${i}')`:`componiProiezione('${i}')`}">▶︎ Proietta</button>
    <button class="bt or mini" onclick="pdfPredica('${i}')">📄 PDF</button>
    <button class="bt mini pi" style="color:#ff8b9c" onclick="${esp?`eliminaEsperienza('${i}')`:`eliminaPredica('${i}')`}" title="Elimina">🗑</button>
    ${esp?'':`<button class="bt mini pi" onclick="diapositive('${i}')" title="Diapositive tue, come in PowerPoint">🎞 Diapositive${(annot(i).slide||[]).length?' <b class="pl-n">'+(annot(i).slide||[]).length+'</b>':''}</button>`}
    <button class="bt mini pi" onclick="stampaPredica('${i}')" title="Stampa">🖨</button>
    ${testoLingua(i,lg)?`<button class="bt pi mini" onclick="ripristinaTesto('${i}')" title="Torna al testo originale">↺</button>`:''}
    ${esp?`<button class="bt pi mini" onclick="nuovaEsperienza('${i}')" title="Titolo, persona, testo biblico">⚙</button>`
        :(p.mia?`<button class="bt pi mini" onclick="nuovaPredica('${i}')" title="Titolo, tema, testo biblico">⚙</button>`:'')}
  </div>

  <div class="pr-zona">
    <div class="foglio-panna foglio-pieno" id="foglioPr" style="font-family:${FAMIGLIE[s.fam]};font-size:${s.dim}px;
         color:${s.col};text-align:${s.all};line-height:${s.interl};background:${s.pag}">
      ${corpoLingua(p,a,lg)}
    </div>
  </div>
  </div>`);
  risolviImmagini();
}
/* ---------- pizzicare con due dita per ingrandire la pagina ----------
   Mentre pizzichi il foglio si allarga subito; quando stacchi le dita
   la misura del carattere resta quella, così le lettere restano nitide
   e il testo va a capo come si deve. */
let PR_PZ=null;
function _dist(e){ const [a,b]=e.touches; return Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY); }
function pizzicoPrGiu(e){
  if(e.touches.length!==2 || !$('#foglioPr')) return;
  PR_PZ={d0:_dist(e), k:1};
  const f=$('#foglioPr'); f.style.transformOrigin='top center';
}
function pizzicoPrMuovi(e){
  if(!PR_PZ || e.touches.length!==2) return;
  e.preventDefault();
  PR_PZ.k=Math.max(0.5,Math.min(3,_dist(e)/PR_PZ.d0));
  const f=$('#foglioPr'); if(f) f.style.transform='scale('+PR_PZ.k.toFixed(3)+')';
}
function pizzicoPrSu(){
  if(!PR_PZ) return;
  const k=PR_PZ.k; PR_PZ=null;
  const f=$('#foglioPr'); if(f){ f.style.transform=''; f.style.transformOrigin=''; }
  if(Math.abs(k-1)<0.06 || !_predAperta) return;
  const s=stilePredica(_predAperta);
  setStile(_predAperta,'dim',Math.max(10,Math.min(60,Math.round(s.dim*k))));
}
document.addEventListener('touchstart',e=>{ if(document.body.classList.contains('pred-fissa')) pizzicoPrGiu(e); },{passive:false});
document.addEventListener('touchmove', e=>{ if(PR_PZ) pizzicoPrMuovi(e); },{passive:false});
document.addEventListener('touchend', ()=>{ if(PR_PZ) pizzicoPrSu(); });
document.addEventListener('touchcancel',()=>{ if(PR_PZ) pizzicoPrSu(); });
/* ================= LE TUE DIAPOSITIVE =================
   Oltre a quelle che il programma ricava dal testo, puoi aggiungere le tue:
   un titolo, un pensiero, un versetto o una figura, e decidere dove metterle
   dentro alla predica. Come in PowerPoint. */
function slideMie(i){ const a=annot(i); return (a.slide=a.slide||[]); }
const TIPI_SL={ titolo:{et:'Titolo',ic:'🅣'}, testo:{et:'Pensiero',ic:'📝'},
                cit:{et:'Versetto',ic:'❝'}, img:{et:'Figura',ic:'🖼'} };
function diapositive(i){
  const p=trovaPredica(i); if(!p) return;
  const mie=slideMie(i);
  const b=blocchiDaProiettare(p).filter(x=>x.t!=='mia');
  const dove=n=>`<select onchange="setSlide('${i}',${n},'dopo',+this.value)">
      <option value="0" ${!mie[n].dopo?'selected':''}>All'inizio</option>
      ${b.map((x,k)=>`<option value="${k+1}" ${mie[n].dopo===k+1?'selected':''}>Dopo: ${esc((x.testo||(x.punti||[]).join(' ')||'').slice(0,42))}…</option>`).join('')}
      <option value="9999" ${mie[n].dopo>=9999?'selected':''}>Alla fine</option>
    </select>`;
  apri('Le tue diapositive',`
    <p class="sotto" style="margin-top:0">Le aggiungi tu e le metti dove vuoi dentro alla predica.
      Restano attaccate a questa predica e si proiettano insieme al resto.</p>
    <div class="fila" style="margin:12px 0">
      ${Object.keys(TIPI_SL).map(t=>`<button class="bt pi mini" onclick="nuovaSlide('${i}','${t}')">✚ ${TIPI_SL[t].ic} ${TIPI_SL[t].et}</button>`).join('')}
    </div>
    ${mie.length?`<div class="el" style="max-height:52vh;overflow:auto">${mie.map((x,n)=>`
      <div class="rg sl-r">
        <div class="sl-ic">${TIPI_SL[x.tipo]?TIPI_SL[x.tipo].ic:'📝'}</div>
        <div class="cp">
          ${x.tipo==='img'
            ? `<img class="sl-mini" src="${esc(fileUrl[x.id]||'')}" alt="">`
            : `<textarea class="sl-tx" rows="2" oninput="setSlide('${i}',${n},'testo',this.value)"
                 placeholder="${x.tipo==='titolo'?'Il titolo della diapositiva':x.tipo==='cit'?'Il versetto, parola per parola':'Quello che vuoi far vedere'}">${esc(x.testo||'')}</textarea>`}
          ${x.tipo==='cit'||x.tipo==='img'?`<input class="sl-rif" type="text" value="${esc(x.rif||'')}"
             oninput="setSlide('${i}',${n},'rif',this.value)" placeholder="${x.tipo==='img'?'didascalia':'riferimento — es. Giovanni 3:16'}">`:''}
          <div class="sl-dove">Dove: ${dove(n)}</div>
        </div>
        <div class="az">
          <button class="bt mini pi" onclick="muoviSlide('${i}',${n},-1)" ${n?'':'disabled'}>↑</button>
          <button class="bt mini pi" onclick="muoviSlide('${i}',${n},1)" ${n<mie.length-1?'':'disabled'}>↓</button>
          <button class="bt mini pi" style="color:#ff8b9c" onclick="togliSlide('${i}',${n})">🗑</button>
        </div></div>`).join('')}</div>`
     :`<div class="vuoto" style="padding:26px"><span class="em">🎞</span>Non hai ancora aggiunto diapositive tue.</div>`}`,
    `<button class="bt pi" onclick="chiudi()">Chiudi</button>
     <button class="bt pr" onclick="chiudi();componiProiezione('${i}')">▶︎ Proietta</button>`,760,'alto');
}
function nuovaSlide(i,tipo){
  const mie=slideMie(i);
  if(tipo==='img'){
    const f=document.createElement('input'); f.type='file'; f.accept='image/*';
    f.onchange=async()=>{
      const file=f.files[0]; if(!file) return;
      const id='sl'+uid();
      try{ await salvaAllegato(id,file);
        mie.push({tipo:'img',id,testo:'',rif:'',dopo:9999}); salva(); diapositive(i);
      }catch(e){ avvisa('Non sono riuscito a salvare la figura','no'); }
    };
    f.click(); return;
  }
  mie.push({tipo,testo:'',rif:'',dopo:9999}); salva(); diapositive(i);
}
function setSlide(i,n,k,v){ const mie=slideMie(i); if(!mie[n]) return; mie[n][k]=v; salva();
  if(k==='dopo') diapositive(i); }
function muoviSlide(i,n,d){ const mie=slideMie(i); const j=n+d;
  if(j<0||j>=mie.length) return; const t=mie[n]; mie[n]=mie[j]; mie[j]=t; salva(); diapositive(i); }
function togliSlide(i,n){ const mie=slideMie(i); mie.splice(n,1); salva(); diapositive(i); }
function chiudiPredica(){
  const era=_predAperta;
  document.body.classList.remove('pred-fissa');
  PR_MOD=false; PR_LG=null; _predAperta=null;
  if(era && eUnEsperienza(era)) vai('esperienze'); else vPrediche();
}
/* il corpo nella lingua scelta */
function corpoLingua(p,a,lg){
  const t=testoLingua(p.i,lg);
  if(t) return t;
  return corpoPredica(p,a);
}
/* fare più grande o più piccola una parola sola, senza toccare il resto */
function ingrandisci(e,verso){
  e.preventDefault();
  const sel=window.getSelection();
  if(!sel||sel.isCollapsed){ avvisa('Prima scegli la parola con il dito','no'); return; }
  const d=document.createElement('span');
  const misure=[0.7,0.85,1,1.2,1.45,1.75,2.1,2.6];
  document.execCommand('styleWithCSS',false,true);
  /* uso la misura relativa: così resta legata alla misura del foglio */
  const box=$('#foglioPr');
  const base=parseFloat(getComputedStyle(box).fontSize)||21;
  const nodo=sel.anchorNode&&sel.anchorNode.parentElement;
  const ora=nodo?parseFloat(getComputedStyle(nodo).fontSize)/base:1;
  let k=0, dist=9;
  misure.forEach((m,j)=>{ const q=Math.abs(m-ora); if(q<dist){dist=q;k=j;} });
  k=Math.max(0,Math.min(misure.length-1,k+verso));
  document.execCommand('fontSize',false,7);
  const box2=$('#foglioPr');
  if(box2) box2.querySelectorAll('font[size="7"]').forEach(f=>{
    const sp=document.createElement('span');
    sp.style.fontSize=misure[k]+'em';
    sp.innerHTML=f.innerHTML; f.replaceWith(sp);
  });
}
/* mettere una figura dentro alla predica, come in una presentazione */
function mettiImmagine(i){
  const f=document.createElement('input');
  f.type='file'; f.accept='image/*';
  f.onchange=async()=>{
    const file=f.files[0]; if(!file) return;
    const id='im'+uid();
    try{
      await salvaAllegato(id,file);
      const url=URL.createObjectURL(file); fileUrl[id]=url;
      const html=`<figure class="fp-fig" contenteditable="false"><img class="fp-img mezza" data-all="${id}" src="${url}" alt=""></figure><p><br></p>`;
      const box=$('#foglioPr');
      if(box && PR_MOD){ box.focus(); document.execCommand('insertHTML',false,html); }
      else if(box){ box.insertAdjacentHTML('beforeend',html); }
      salvaTesto(i,true);
      risolviImmagini();
      avvisa('Figura messa — toccala per cambiarne la misura','ok');
    }catch(e){ avvisa('Non sono riuscito a salvare la figura','no'); }
  };
  f.click();
}
/* le figure stanno nel magazzino del programma: qui le riaggancio */
async function risolviImmagini(){
  const box=$('#foglioPr'); if(!box) return;
  for(const im of [...box.querySelectorAll('img[data-all]')]){
    const id=im.dataset.all;
    if(!fileUrl[id]){
      try{ const b=await kvGet('all:'+id); if(b) fileUrl[id]=URL.createObjectURL(b); }catch(e){}
    }
    if(fileUrl[id]) im.src=fileUrl[id];
    im.onclick=e=>{ e.stopPropagation(); misuraImmagine(im); };
  }
}
const MISURE_IMG=['piccola','mezza','grande','piena'];
function misuraImmagine(im){
  const ora=MISURE_IMG.findIndex(m=>im.classList.contains(m));
  const nuova=MISURE_IMG[(ora+1)%MISURE_IMG.length];
  MISURE_IMG.forEach(m=>im.classList.remove(m));
  im.classList.add(nuova);
  if(_predAperta) salvaTesto(_predAperta,true);
  avvisa('Figura '+nuova);
}
function corpoPredica(p,a){
  if(a.html) return a.html;
  /* il testo com'era nel file di Pages: colori, caratteri, misure, corsivi */
  if(p.html) return p.html;
  if(eUnEsperienza(p.i)) return `<div class="fp-cap">
      <h2 class="fp-tit">${esc(p.tit)}</h2>
      ${p.rif?`<div class="fp-rif">${esc(p.rif)}</div>`:''}
    </div>
    <p class="fp-nota">${tipoEsp(p)==='vera'
      ? 'Fatto realmente accaduto: nomi e date si possono controllare.'
      : 'Racconto scritto per illustrare un pensiero. Non è una testimonianza documentata.'}</p>` +
    analizzaPredica(p.testo||'').map(b=>{
      if(b.t==='titolo') return `<h3 class="fp-h">${esc(b.testo)}</h3>`;
      if(b.t==='cit') return `<blockquote class="fp-cit">${esc(b.testo)}${b.rif?`<span class="fp-crif">${esc(b.rif)}</span>`:''}</blockquote>`;
      if(b.t==='punti') return `<ol class="fp-ol">${b.punti.map(x=>`<li>${esc(x)}</li>`).join('')}</ol>`;
      return `<p>${esc(b.testo)}</p>`; }).join('');
  return `<div class="fp-cap">
      ${p.tema?`<div class="fp-tema">${esc(p.tema)}</div>`:''}
      <h2 class="fp-tit">${esc(p.tit)}</h2>
      ${p.rif?`<div class="fp-rif">${esc(p.rif)}</div>`:''}
      ${(a.luoghi||[]).length?`<div class="fp-luo">${(a.luoghi||[]).map(esc).join(' · ')}</div>`:''}
    </div>` +
    blocchiUtili(p).map(b=>{
      if(b.t==='titolo') return `<h3 class="fp-h">${esc(b.testo)}</h3>`;
      if(b.t==='cit')    return `<blockquote class="fp-cit">${esc(b.testo)}${b.rif?`<span class="fp-crif">${esc(b.rif)}</span>`:''}</blockquote>`;
      if(b.t==='punti')  return `<ol class="fp-ol">${b.punti.map(x=>`<li>${esc(x)}</li>`).join('')}</ol>`;
      return `<p>${esc(b.testo)}</p>`; }).join('');
}
function setStile(i,k,v){
  if(PR_MOD){ const f=$('#foglioPr'); if(f) salvaTesto(i,true); }
  const a=annot(i); a.stile=Object.assign(stilePredica(i),{[k]:v}); salva(); ricaricaPredica();
}

/* ---------- scrivere dentro alla pagina, come in Word ---------- */
let PR_MOD=false;
function modificaTesto(i){
  const f=$('#foglioPr'); if(!f) return;
  PR_MOD=true;
  f.contentEditable='true'; f.classList.add('in-modifica'); f.focus();
  const e=$('#prScrivi'); if(e) e.hidden=false;
  leggiPredica(i);
  setTimeout(()=>{ const g=$('#foglioPr');
    if(g){ g.contentEditable='true'; g.classList.add('in-modifica'); g.focus(); } },20);
  document.execCommand('styleWithCSS',false,true);
  avvisa('Ora puoi scrivere, cambiare i caratteri, i colori e mettere le figure.');
}
function cmd(e,c,v){ e.preventDefault(); document.execCommand(c,false,v||null); }
function cmdVal(e,c,v){ e.preventDefault(); if(v) document.execCommand(c,false,v); }
function evidenzia(e,c){ e.preventDefault();
  if(!document.execCommand('hiliteColor',false,c)) document.execCommand('backColor',false,c); }
function salvaTesto(i,zitto){
  const f=$('#foglioPr'); if(!f) return;
  /* le figure le tengo nel magazzino: nel testo resta solo il loro nome */
  const copia=f.cloneNode(true);
  copia.querySelectorAll('img[data-all]').forEach(im=>im.removeAttribute('src'));
  scriviLingua(i,linguaPredica(i),copia.innerHTML);
  salva();
  if(zitto) return;
  PR_MOD=false;
  f.contentEditable='false'; f.classList.remove('in-modifica');
  const e=$('#prScrivi'); if(e) e.hidden=true;
  leggiPredica(i);
  avvisa('Testo salvato','ok');
}
function annullaTesto(i){
  PR_MOD=false; leggiPredica(i); avvisa('Modifiche annullate');
}
function ripristinaTesto(i){
  const lg=linguaPredica(i), p=trovaPredica(i);
  conferma('Vuoi tornare al testo originale, perdendo le tue modifiche?',()=>{
    const a=annot(i); a.testi=a.testi||{};
    delete a.testi[lg];
    if(p && lg===p.lg) a.html='';
    salva(); leggiPredica(i); avvisa('Testo originale ripristinato','ok');
  },'Ripristina');
}
/* i luoghi già usati, per riproporli con un tocco */
function luoghiUsati(){
  const s=new Set();
  Object.values(stato.predAnnot||{}).forEach(a=>(a.luoghi||[]).forEach(l=>{
    const m=/^(.*?)\s+\d{1,2}\s+\w{3}\s+\d{4}$/.exec(l);
    s.add((m?m[1]:l).trim());
  }));
  return [...s].filter(Boolean).sort((a,b)=>a.localeCompare(b,'it')).slice(0,12);
}
function aggiungiLuogo(i){
  const usati=luoghiUsati();
  apri('Dove ho predicato',`
    <div class="griglia" style="gap:13px">
      <div class="fila">
        <div class="campo" style="flex:2"><label>Chiesa o luogo</label>
          <input type="text" id="luC" placeholder="es. Torino" autofocus></div>
        <div class="campo" style="flex:1"><label>Data — tocca per il calendario</label>
          <input type="date" id="luD" value="${oggi()}"></div>
      </div>
      ${usati.length?`<div class="campo"><label>Già usati</label>
        <div class="fila" style="gap:6px">${usati.map(l=>
          `<button class="bt mini pi" onclick="document.getElementById('luC').value=${JSON.stringify(l)}">${esc(l)}</button>`).join('')}</div></div>`:''}
    </div>`,
    `<button class="bt pi" onclick="chiudi()">Annulla</button>
     <button class="bt pr" onclick="salvaLuogo('${i}')">Aggiungi</button>`,560);
  setTimeout(()=>$('#luC').focus(),120);
}
const MESI_BR=['gen','feb','mar','apr','mag','giu','lug','ago','set','ott','nov','dic'];
function dataBreve(iso){
  if(!iso) return '';
  const [a,m,g]=iso.split('-');
  return `${+g} ${MESI_BR[+m-1]} ${a}`;
}
function salvaLuogo(i){
  const c=$('#luC').value.trim(), d=dataBreve($('#luD').value);
  if(!c){ avvisa('Serve almeno il luogo','no'); return; }
  const a=annot(i); a.luoghi=a.luoghi||[]; a.luoghi.push(d?`${c} ${d}`:c);
  a.luoghi.sort((x,y)=>x.localeCompare(y,'it'));
  salva(); chiudi(); ricaricaPredica(); avvisa('Annotato','ok');
}
function togliLuogo(i,k){ const a=annot(i); a.luoghi.splice(k,1); salva(); ricaricaPredica(); if($('#modale').classList.contains('on')) aggiungiLuogo(i); }
function stampaPredica(i){ window.print(); }

/* ---------- i blocchi da proiettare, presi anche dal testo modificato ---------- */
function blocchiDaProiettare(p){
  const a=annot(p.i);
  const html=testoLingua(p.i,linguaPredica(p.i)) || a.html;
  if(!html) return conLeMie(p,blocchiUtili(p));
  const d=document.createElement('div'); d.innerHTML=html;
  const out=[];
  d.querySelectorAll('p,blockquote,h3,h2,li').forEach(el=>{
    const t=(el.innerText||el.textContent||'').replace(/\s+/g,' ').trim();
    if(!t) return;
    if(el.closest('.fp-cap')) return;
    const tag=el.tagName.toLowerCase();
    if(tag==='blockquote'){
      const rif=el.querySelector('.fp-crif');
      const testo=rif? t.replace(rif.textContent.trim(),'').trim() : t;
      out.push({t:'cit',testo,rif:rif?rif.textContent.trim():''});
    }
    else if(tag==='h3'||tag==='h2') out.push({t:'titolo',testo:t});
    else if(tag==='li') out.push({t:'punti',tit:'',punti:[t]});
    else out.push({t:'testo',testo:t});
  });
  const base=out.length?out:blocchiUtili(p);
  return conLeMie(p,base);
}
/* infilo le mie diapositive fra i blocchi, dove ho detto io */
function conLeMie(p,base){
  const mie=(annot(p.i).slide||[]);
  if(!mie.length) return base;
  const out=[];
  const qui=n=>mie.forEach(x=>{ if((x.dopo||0)===n) out.push({t:'mia',sl:x}); });
  qui(0);
  base.forEach((b,k)=>{ out.push(b); qui(k+1); });
  mie.forEach(x=>{ if((x.dopo||0)>base.length) out.push({t:'mia',sl:x}); });
  return out;
}

/* ---------- scegliere cosa proiettare ---------- */
function componiProiezione(i){
  const p=trovaPredica(i); if(!p) return;
  const b=blocchiDaProiettare(p);
  if(!PROI.scelta || PROI.scelta.pred!==i)
    PROI.scelta={pred:i, set:new Set(b.map((_,k)=>k)), sf:p.sfondo||'notte'};
  const S=PROI.scelta;
  const ET={cit:['Versetto','ve'],titolo:['Titolo','ti'],punti:['Elenco','el'],testo:['Testo','te'],mia:['Tua diapositiva','mi']};
  apri('Cosa vuoi proiettare',`
    <div class="fila" style="margin-bottom:12px">
      <div class="campo" style="flex:1"><label>Sfondo</label>
        <select onchange="PROI.scelta.sf=this.value">${Object.keys(SFONDI).map(k=>
          `<option value="${k}" ${S.sf===k?'selected':''}>${SFONDI[k].ic} ${SFONDI[k].et}</option>`).join('')}</select></div>
      <button class="bt mini pi" onclick="scegliTutto(true)">Tutto</button>
      <button class="bt mini pi" onclick="scegliTutto(false)">Niente</button>
    </div>
    <div class="fila scelte-tipo" style="margin-bottom:10px">
      <span>Prendi tutti:</span>
      ${Object.keys(ET).map(t=>{
        const q=b.filter(x=>x.t===t).length;
        if(!q) return '';
        const tuttiQui=b.every((x,k)=>x.t!==t||S.set.has(k));
        return `<button class="bt mini ${tuttiQui?'pr':'pi'}" onclick="scegliTipo('${t}')">${ET[t][0]} <b>${q}</b></button>`;
      }).join('')}
    </div>
    <div class="el" id="elComp" style="max-height:46vh;overflow:auto">${b.map((x,k)=>{
      const [et,cl]=ET[x.t]||['Testo','te'];
      const an = x.t==='punti' ? x.punti.join(' · ')
               : x.t==='mia' ? ((x.sl.tipo==='img'?'🖼 figura — ':'')+(x.sl.testo||x.sl.rif||''))
               : (x.testo||'');
      return `<div class="rg cmp ${S.set.has(k)?'sel':''}" onclick="togComp(${k})">
        <div class="spunta">✓</div>
        <div class="cp">
          <span class="cmp-et ${cl}">${et}</span>
          <div class="cmp-tx">${esc(an)}${x.rif?` <span class="cmp-rif">${esc(x.rif)}</span>`:''}</div>
        </div></div>`;}).join('')}</div>`,
    `<span style="margin-right:auto;color:var(--tx3);font-size:13px">${S.set.size} di ${b.length}</span>
     <button class="bt pi" onclick="chiudi()">Annulla</button>
     <button class="bt" onclick="proiettaScelta('${i}',true)">🖥 Regia</button>
     <button class="bt pr" onclick="proiettaScelta('${i}')">▶︎ Proietta</button>`,780);
}
function togComp(k){ const S=PROI.scelta; S.set.has(k)?S.set.delete(k):S.set.add(k); componiProiezione(S.pred); }
function scegliTutto(si){ const S=PROI.scelta, p=trovaPredica(S.pred);
  S.set = si? new Set(blocchiDaProiettare(p).map((_,k)=>k)) : new Set(); componiProiezione(S.pred); }
/* prendere in un colpo solo tutti i versetti, o tutti i testi, o tutti i titoli:
   se ci sono già tutti li toglie, così il pulsante fa e disfa */
function scegliTipo(t){
  const S=PROI.scelta, p=trovaPredica(S.pred), b=blocchiDaProiettare(p);
  const indici=[]; b.forEach((x,k)=>{ if(x.t===t) indici.push(k); });
  if(!indici.length) return;
  const ciSonoTutti=indici.every(k=>S.set.has(k));
  indici.forEach(k=>{ if(ciSonoTutti) S.set.delete(k); else S.set.add(k); });
  componiProiezione(S.pred);
}
function proiettaScelta(i,conRegia){
  const p=trovaPredica(i), S=PROI.scelta;
  const b=blocchiDaProiettare(p).filter((_,k)=>S.set.has(k));
  if(!b.length){ avvisa('Non hai scelto niente','no'); return; }
  chiudi();
  const slide=slidePredica({tit:p.tit,tema:p.tema,rif:p.rif,blocchiScelti:b});
  if(conRegia) apriRegia(slide,S.sf,p.tit);
  else proietta(slide,S.sf,p.tit);
}
function proiettaPredica(i){ componiProiezione(i); }

/* --- inserimento --- */
/* il primo numero libero: se hai 62 prediche, la nuova è la 63 */
function prossimoNumero(){
  const n=tuttePrediche().map(p=>+p.num||0);
  return (n.length?Math.max.apply(null,n):0)+1;
}
function nuovaPredica(i){
  const p = i ? trovaPredica(i) : null;
  apri(p?'Modifica predica':'Nuova predica',`
   <div class="griglia" style="gap:13px">
    <div class="fila">
      <div class="campo" style="flex:0 0 96px"><label>Numero</label>
        <input type="number" id="npN" min="1" value="${p?(p.num||''):prossimoNumero()}"></div>
      <div class="campo" style="flex:2"><label>Titolo</label><input type="text" id="npT" value="${esc(p?p.tit:'')}"></div>
      <div class="campo" style="flex:0 0 130px"><label>Lingua</label><select id="npL">
        <option value="it" ${!p||p.lg==='it'?'selected':''}>Italiano</option>
        <option value="ro" ${p&&p.lg==='ro'?'selected':''}>Română</option></select></div>
    </div>
    <div class="fila">
      <div class="campo" style="flex:1"><label>Tema</label><input type="text" id="npTe" value="${esc(p?p.tema||'':'')}" placeholder="es. La seconda venuta"></div>
      <div class="campo" style="flex:1"><label>Testo biblico</label><input type="text" id="npR" value="${esc(p?p.rif||'':'')}" placeholder="es. Giovanni 14:1-3"></div>
      <div class="campo" style="flex:0 0 130px"><label>Data</label><input type="text" id="npD" value="${esc(p?p.data||oggi():oggi())}"></div>
    </div>
    <div class="campo"><label>Sfondo della proiezione</label>
      <select id="npS">${Object.keys(SFONDI).map(k=>`<option value="${k}" ${p&&p.sfondo===k?'selected':''}>${SFONDI[k].ic} ${SFONDI[k].et}</option>`).join('')}
      </select></div>
    <div class="campo"><label>Testo della predica — incollalo così com'è</label>
      <textarea id="npX" style="min-height:240px" placeholder="Incolla qui il testo.&#10;&#10;Il programma riconosce da solo:&#10;· i titoli (righe che finiscono con i due punti o tutte maiuscole)&#10;· le citazioni bibliche fra virgolette o con il riferimento fra parentesi&#10;· gli elenchi numerati o con il trattino">${esc(p?p.testo||'':'')}</textarea></div>
    <div id="npAnt" style="font-size:12.5px;color:var(--tx3)"></div>
   </div>`,
   `${p&&p.mia?`<button class="bt pi" style="margin-right:auto;color:#ff8b9c" onclick="eliminaPredica('${p.i}')">Elimina</button>`:''}
    <button class="bt pi" onclick="anteprimaPredica()">👁 Anteprima</button>
    <button class="bt pi" onclick="chiudi()">Annulla</button>
    <button class="bt pr" onclick="salvaPredica(${p?`'${p.i}'`:'null'})">Salva</button>`,760);
  const x=$('#npX'), te=$('#npTe');
  const agg=()=>{ const b=analizzaPredica(x.value);
    $('#npAnt').innerHTML=b.length?`Riconosciuti <b>${b.length}</b> blocchi → <b>${slidePredica({tit:'x',blocchi:b}).length}</b> diapositive
      (${b.filter(z=>z.t==='titolo').length} titoli, ${b.filter(z=>z.t==='cit').length} citazioni, ${b.filter(z=>z.t==='punti').length} elenchi)`:''; };
  x.oninput=agg; agg();
  te.oninput=()=>{ const s=sfondoDaTema(te.value+' '+$('#npT').value); const sel=$('#npS'); if(!p) sel.value=s; };
}
function anteprimaPredica(){
  const b=analizzaPredica($('#npX').value);
  if(!b.length){ avvisa('Non c\'è ancora testo','no'); return; }
  const p={tit:$('#npT').value||'Anteprima',tema:$('#npTe').value,rif:$('#npR').value,blocchi:b};
  chiudi(); proietta(slidePredica(p), $('#npS')?$('#npS').value:'notte', p.tit);
}
function salvaPredica(i){
  const tit=$('#npT').value.trim(), testo=($('#npX')?$('#npX').value.trim():'');
  if(!tit){ avvisa('Serve almeno il titolo','no'); return; }
  const dati={ tit, num:+($('#npN')?$('#npN').value:0)||0,
               lg:$('#npL').value, tema:$('#npTe').value.trim(), rif:$('#npR').value.trim(),
               data:$('#npD').value.trim(), sfondo:$('#npS').value, testo, blocchi:analizzaPredica(testo) };
  const mia = i && stato.prediche.some(p=>p.i===i);
  if(mia){ Object.assign(stato.prediche.find(p=>p.i===i),dati); }
  let nuova=null;
  if(!mia){
    dati.i=uid(); dati.mia=true; stato.prediche.push(dati);
    /* la predica nuova nasce sul foglio bianco, con i caratteri di lettura */
    const a=annot(dati.i);
    a.stile=Object.assign({},a.stile||{},{pag:'#ffffff',fam:'helvetica',dim:19,interl:1.5});
    if(testo) a.html='';
    nuova=dati.i;
  }
  salva(); chiudi();
  if(nuova){
    /* si apre subito il foglio, uguale a quando apri una predica: scrivi lì */
    leggiPredica(nuova);
    setTimeout(()=>modificaTesto(nuova),160);
    avvisa('Scrivi qui la predica: hai tutti i comandi in alto','ok');
  } else { vPrediche(); avvisa('Predica salvata','ok'); }
}
function eliminaPredica(i){
  const p=trovaPredica(i);
  conferma('Vuoi togliere «'+((p&&p.tit)||'questa predica')+'» dall\'elenco?\n\nSe è una delle tue, sparisce del tutto. Se viene dai tuoi file di Pages, la puoi rimettere da ☁️ Dati.',()=>{
    stato.prediche=stato.prediche.filter(x=>x.i!==i);
    stato.predVia=stato.predVia||{}; stato.predVia[i]=1;
    salva(); chiudi();
    document.body.classList.remove('pred-fissa'); PR_MOD=false; _predAperta=null;
    vPrediche(); avvisa('Tolta dall\'elenco','ok');
  },'Elimina');
}

/* ---------- barre: fissarle o farle sparire ---------- */
function barre(){ stato.imp.barre=stato.imp.barre||{}; return stato.imp.barre; }
function barraNascosta(k){ const b=barre()[k]; return b && b.via; }
function barraFissa(k){ const b=barre()[k]; return !b || b.fissa!==false; }
function spilla(k){
  return `<span class="bpin">
    <button class="bx pin ${barraFissa(k)?'on':''}" onclick="fissaBarra('${k}')"
      title="${barraFissa(k)?'È fissata mentre scorri — tocca per liberarla':'Tocca per fissarla in alto'}">📌</button>
    <button class="bx" onclick="nascondiBarra('${k}')" title="Nascondi questa barra">✕</button>
  </span>`;
}
function fissaBarra(k){ const b=barre(); b[k]=Object.assign({},b[k],{fissa:!barraFissa(k)}); salva(); aggiornaBarre(); }
function nascondiBarra(k){ const b=barre(); b[k]=Object.assign({},b[k],{via:true}); salva(); ricaricaPredica(); }
function mostraBarra(k){ const b=barre(); b[k]=Object.assign({},b[k],{via:false}); salva(); ricaricaPredica(); }
function aggiornaBarre(){
  const top=$('#prTop'); if(!top) return;
  const qualcunaFissa = barraFissa('stile')||barraFissa('editor');
  top.classList.toggle('libera',!qualcunaFissa);
  $$('.pin').forEach(b=>{});
  ricaricaPredica();
}
let _predAperta=null;
function ricaricaPredica(){
  if(!_predAperta) return;
  const era=PR_MOD; leggiPredica(_predAperta);
  if(era) setTimeout(()=>{ const f=$('#foglioPr'); if(f){ PR_MOD=true;
    f.contentEditable='true'; f.classList.add('in-modifica');
    const e=$('#prScrivi'); if(e) e.hidden=false; } },30);
}

/* ---------- pannello dei colori ---------- */
const COL_TUTTI=['#000000','#3a3a3a','#6b6b6b','#9a9a9a','#c9c9c9','#ffffff',
  '#7a1020','#c8102e','#e6203f','#ff7a5c','#ffa94d','#ffd166',
  '#8a5a10','#b8860b','#e0b25c','#f2e2b6','#2e5b34','#1fa463',
  '#4fd1a5','#a8f0a0','#0d3b57','#1a3d6b','#2f7bff','#9fd8ff',
  '#4b2a7a','#6b3f8a','#8b7bff','#e0c0ff','#241d10','#5a3210'];
function apriColori(ev,titolo,rapidi,attuale,poi){
  ev.preventDefault(); ev.stopPropagation();
  chiudiColori();
  const b=ev.currentTarget.getBoundingClientRect();
  const d=document.createElement('div');
  d.className='colpan'; d.id='colpan';
  d.innerHTML=`<div class="cp-t">${esc(titolo)}</div>
    <div class="cp-gr rap">${rapidi.map(c=>`<button style="background:${c}" data-c="${c}" ${c===attuale?'class="on"':''}></button>`).join('')}</div>
    <div class="cp-t2">Altri colori</div>
    <div class="cp-gr">${COL_TUTTI.map(c=>`<button style="background:${c}" data-c="${c}" ${c===attuale?'class="on"':''}></button>`).join('')}</div>
    <div class="cp-pie"><label>Qualsiasi colore <input type="color" value="${/^#[0-9a-f]{6}$/i.test(attuale)?attuale:'#000000'}"></label>
      <button class="bt mini pi" onclick="chiudiColori()">Chiudi</button></div>`;
  document.body.appendChild(d);
  const L=Math.min(Math.max(8,b.left-10), innerWidth-d.offsetWidth-8);
  d.style.left=L+'px'; d.style.top=(b.bottom+8)+'px';
  d.querySelectorAll('.cp-gr button').forEach(x=>x.onclick=e=>{ e.preventDefault(); poi(x.dataset.c); chiudiColori(); });
  d.querySelector('input[type=color]').oninput=e=>poi(e.target.value);
  setTimeout(()=>document.addEventListener('mousedown',fuoriColori),0);
}
function fuoriColori(e){ const d=$('#colpan'); if(d && !d.contains(e.target)) chiudiColori(); }
function chiudiColori(){ const d=$('#colpan'); if(d) d.remove();
  document.removeEventListener('mousedown',fuoriColori); }
function evidenziaCol(c,ev){ if(ev) ev.preventDefault();
  if(!document.execCommand('hiliteColor',false,c)) document.execCommand('backColor',false,c); }
