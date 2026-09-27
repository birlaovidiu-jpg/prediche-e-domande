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
  const ann=stato.predAnnot||{};
  /* una predica d'archivio non si può cambiare (viene dal file), ma titolo/
     tema/riferimento si possono correggere: restano un'annotazione a parte
     (meta) che qui si sovrappone da sola a quello che c'era prima */
  return PREDICHE.concat(stato.prediche).filter(p=>!via[p.i]).map(p=>{
    const m=(ann[p.i]||{}).meta;
    return m?Object.assign({},p,m):p;
  });
}
function vPrediche(){
  const q=ck(FP.q);
  document.body.classList.remove('pred-fissa');
  /* torno alla griglia: se ero rimasto "in modifica" su una predica (es.
     salvando da ⚙ senza passare da «‹ Prediche»/Annulla), quel modo non deve
     restare acceso — altrimenti la PROSSIMA predica aperta dalla griglia si
     apriva già in modifica, senza che tu abbia toccato «✎ Modifica» */
  PR_MOD=false; _predAperta=null; PR_LG=null;
  const c=contaLingue(tuttePrediche());
  /* cercando, prima vengono quelle che hanno la parola nel TITOLO, poi le
     altre (trovate solo dentro al testo) — dentro ad ogni gruppo, alfabetico */
  const el=tuttePrediche().filter(p=>(FP.lg==='tutte'||p.lg===FP.lg) &&
    (!q||ck(p.tit+' '+(p.tema||'')+' '+(p.rif||'')+' '+(p.testo||'')).includes(q)))
    .sort((a,b)=>{
      if(q){ const at=ck(a.tit).includes(q)?0:1, bt=ck(b.tit).includes(q)?0:1;
        if(at!==bt) return at-bt; }
      return a.tit.localeCompare(b.tit,'it',{sensitivity:'base',numeric:true});
    });
  pinta(`
  <h1>Prediche</h1>
  <div class="filtri" style="margin-top:20px">
    <div class="campo" style="flex:0 0 auto"><label>Lingua</label>
      <div class="segm">
        <button class="${FP.lg==='tutte'?'on':''}" onclick="setP('lg','tutte')">Tutte <b>${c.tot}</b></button>
        <button class="${FP.lg==='it'?'on':''}" onclick="setP('lg','it')">🇮🇹 Italiano <b>${c.it}</b></button>
        <button class="${FP.lg==='ro'?'on':''}" onclick="setP('lg','ro')">🇷🇴 Română <b>${c.ro}</b></button>
      </div></div>
    <div class="campo" style="flex:1 1 260px"><label>Cerca</label>
      <div class="cerca"><input type="search" placeholder="Titolo, tema o parola del testo…" value="${esc(FP.q)}"
        oninput="FP.q=this.value; clearTimeout(window._tp); window._tp=setTimeout(cercaPrediche,260)"></div></div>
    <button class="bt pr" onclick="nuovaPredica()">✚ Nuova predica</button>
    <button class="bt pi" onclick="apriImportaPptx('predica')" title="Importa da un file PowerPoint">📥 Importa PowerPoint</button>
    <button class="bt pi" onclick="apriImportaDoc('pdf')" title="Importa da un file PDF, identico all'originale">📄 Importa PDF</button>
    <button class="bt pi" onclick="apriImportaDoc('word')" title="Importa da un file Word (.docx), com'è">📝 Importa Word</button>
  </div>
  ${(sotto(`${tuttePrediche().length} prediche in tutto · ${el.length} qui`),'')}
  ${el.length?`<div class="griglia g-pred">${el.map(p=>cartaPredica(p)).join('')}</div>`
    :`<div class="vuoto"><span class="em">📖</span>Non c'è ancora nessuna predica.<br>
      <button class="bt pr" style="margin-top:16px" onclick="nuovaPredica()">✚ Scrivi la prima</button></div>`}`);
  attaccaCopertinePrediche();
}
function setP(k,v){ FP[k]=v; vPrediche(); }
/* vPrediche() rifà tutta la pagina (pinta sostituisce #vista), quindi la
   casella di ricerca è un elemento nuovo ogni volta: il browser le toglie da
   solo il focus, e digitare la lettera dopo non andava più da nessuna parte
   ("scrivo una lettera e poi esce"). Rimetto io il focus e il cursore in
   fondo, subito dopo che si è ridisegnata. */
function cercaPrediche(){
  vPrediche();
  const inp=document.querySelector('.filtri .cerca input');
  if(inp){ inp.focus(); const n=inp.value.length; inp.setSelectionRange(n,n); }
}
function cartaPredica(p){
  const n=blocchiUtili(p).length;
  const lg=p.lg==='it'?'it':'ro';
  const meta=[p.rif&&('📖 '+esc(p.rif)), `${n} bl.`, `${slidePredica(p).length} diap.`].filter(Boolean).join(' · ');
  return `<div class="scheda-min" data-apre-pred="1" data-i="${p.i}">
    <div class="cm-cop pr-${lg}">
      <div class="cm-tit grande">${esc(p.tit)}</div>
      <span class="tag ${lg} cm-tag">${lg==='it'?'IT':'RO'}</span>
      <button class="cm-loc" onclick="event.stopPropagation();aggiungiLuogo('${p.i}')" title="${etichettaLuogo(p.i)}">📍${numeroLuoghi(p.i)?` ${numeroLuoghi(p.i)}`:''}</button>
    </div>
    <div class="cm-info">
      <span class="cm-meta">${meta}</span>
      <span class="cm-az">
        <button class="bt mini pr" onclick="event.stopPropagation();proiettaPredica('${p.i}')" title="Proietta">▶︎</button>
        <button class="bt mini pi" onclick="event.stopPropagation();pdfPredica('${p.i}')" title="PDF">📄</button>
        <button class="bt mini pi" style="color:#ff8b9c" onclick="event.stopPropagation();eliminaPredica('${p.i}')" title="Elimina">🗑</button>
      </span>
    </div></div>`;
}
/* tocco sulla copertina = apre la predica in lettura, come il vecchio pulsante «Leggi»;
   i pulsanti dentro alla copertina (📍) restano loro perché interazioneCarta
   ignora i tocchi che arrivano su un <button> */
function attaccaCopertinePrediche(){
  $$('[data-apre-pred][data-i]').forEach(el=>{
    const i=el.dataset.i;
    interazioneCarta(el, ()=>leggiPredica(i), ()=>{});
  });
}
/* il foglio di lettura serve anche a esperienze e poesie: le cerco anche fra quelle */
function trovaPredica(i){
  return tuttePrediche().find(p=>p.i===i) ||
         (typeof tutteEsperienze==='function' ? tutteEsperienze().find(p=>p.i===i) : null) ||
         (typeof tuttePoesie==='function' ? tuttePoesie().find(p=>p.i===i) : null);
}
function eUnEsperienza(i){
  return typeof tutteEsperienze==='function' && tutteEsperienze().some(x=>x.i===i);
}
function eUnaPoesia(i){
  return typeof tuttePoesie==='function' && tuttePoesie().some(x=>x.i===i);
}

/* --- annotazioni personali su una predica (anche su quelle d'archivio) --- */
function annot(i){ stato.predAnnot=stato.predAnnot||{};
  return (stato.predAnnot[i]=stato.predAnnot[i]||{luoghi:[],stile:{},html:''}); }
/* Il giallo panna che Ovidiu vuole di partenza per la pagina di tutte le
   sezioni (prediche, poesie, esperienze, cantici, in tutte le lingue). Prima
   di v7.70 il fondo di partenza era beige (#f7f1e3) o bianco (importate e
   nuove): quei due valori, se non li hai scelti tu a mano dalla tavolozza
   (`pagS`), vengono letti come «il colore di partenza» e diventano questo. */
const PAG_BASE='#fdf6e3';
const STILE_BASE={fam:'serif',dim:22,col:'#241d10',all:'left',interl:1.75,pag:PAG_BASE};
function stilePredica(i){
  const p=trovaPredica(i);
  /* le prediche prese dai tuoi file partono col carattere e il colore che
     avevano in Pages, ma la MISURA di lettura è sempre 22 per tutte, italiano
     e rumeno — non quella del file originale; poi puoi cambiarla tu con A− e A+ */
  const suo = p && p.html ? {fam:p.fam||'helvetica', dim:22, col:p.col||'#241d10',
                             interl:1.45} : {};
  const st=annot(i).stile||{};
  const out=Object.assign({},STILE_BASE,suo,st);
  if(!st.pagS && (out.pag==='#f7f1e3' || out.pag==='#ffffff')) out.pag=PAG_BASE;
  return out;
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
const COL_PAG  =['#fdf6e3','#f7f1e3','#ffffff','#f2efe6','#eaf2f6','#f7eef4','#eef5ec','#e8e2d2'];

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
  /* in lettura (non mentre scrivi) il foglio prende tutto lo schermo: spariscono
     la barra in alto e il menu a sinistra, resta solo la barra della predica */
  document.body.classList.toggle('pred-legge',!PR_MOD);
  if(_predAperta!==i){ PN.on=false; PN.storia=[]; }   /* un foglio nuovo si apre con la penna posata */
  _predAperta=i;
  const luoghi=(a.luoghi||[]).length;
  const esp=eUnEsperienza(i);
  const poe=!esp && eUnaPoesia(i);
  if(esp){ sezione='esperienze'; $('#titSez').textContent='Esperienza'; }
  else if(poe){ sezione='poesie'; $('#titSez').textContent='Poesia'; }
  pinta(`
  <div class="pr-pagina">
  <div class="pr-barra no-stampa" id="prTop">
    <button class="bt pi mini" onclick="chiudiPredica()">‹ ${esp?'Esperienze':poe?'Poesie':'Prediche'}</button>
    ${esp?bolloEsp(p):''}
    ${esp&&p.rif?`<span class="esp-rif">📖 ${esc(p.rif)}</span>`:''}
    ${poe&&p.autore?`<span class="esp-rif">✍️ ${esc(p.autore)}</span>`:''}
    ${PR_MOD?'':`<button class="bt mini pi${PN.on?' on':''}" id="pnBt" onclick="pennaPredica()" title="Scrivi a mano sulla pagina, come nei lezionari">✏️ Penna</button>`}
    <button class="bt mini pi" onclick="aggiungiLuogo('${i}')" title="${etichettaLuogo(i)}">
      📍 ${etichettaLuogo(i)}${luoghi?` <b class="pl-n">${luoghi}</b>`:''}</button>

    <span class="bs" id="prScrivi" ${PR_MOD?'':'hidden'}>
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
      <button class="bx" onmousedown="ingrandisci(event,-1)" title="Rimpicciolisce quello che hai scelto">A−</button>
      <input type="number" class="bnum" id="selDim" title="Scrivi la misura di quello che hai scelto"
        placeholder="–" min="6" max="200" onmousedown="salvaSelPerDim()" onchange="impostaDimSel(this)">
      <button class="bx" onmousedown="ingrandisci(event,1)" title="Ingrandisce quello che hai scelto">A+</button>
      <button class="bx col-bt" onclick="apriColori(event,'Colore di quello che hai scelto',COL_TESTO,'#000000',c=>document.execCommand('foreColor',false,c))" title="Colore"><b style="color:#e6203f">A</b>▾</button>
      <button class="bx col-bt" onclick="apriColori(event,'Evidenziatore',COL_EVID,'#ffe14d',c=>evidenziaCol(c))" title="Evidenziatore">🖍▾</button>
      <button class="bx" onmousedown="evidenziaCol('transparent',event)" title="Togli l'evidenziatore">⌫</button>
      <button class="bx" onmousedown="cmd(event,'justifyLeft')" title="A sinistra">⬅︎</button>
      <button class="bx" onmousedown="cmd(event,'justifyCenter')" title="Al centro">↔︎</button>
      <button class="bx" onmousedown="cmd(event,'justifyFull')" title="Giustificato">☰</button>
      <button class="bx" onmousedown="cmd(event,'justifyRight')" title="A destra">➡︎</button>
      <button class="bx" onmousedown="cmd(event,'outdent')" title="Diminuisce il rientro">⇤</button>
      <button class="bx" onmousedown="cmd(event,'indent')" title="Aumenta il rientro">⇥</button>
      <button class="bx" onmousedown="cmdLista(event,'insertUnorderedList')" title="Elenco puntato">•</button>
      <button class="bx" onmousedown="cmdLista(event,'insertOrderedList')" title="Elenco numerato">1.</button>
      <button class="bx" onmousedown="cmdLista(event,'insertOrderedList','lower-alpha')" title="Elenco a lettere">a.</button>
      <button class="bx" onmousedown="cmd(event,'formatBlock','blockquote')" title="Segna come versetto">❝</button>
      <button class="bx" onmousedown="cmd(event,'formatBlock','h3')" title="Titoletto">H</button>
      <button class="bx" onmousedown="ordinaRighe(event)" title="Ordina le righe scelte dalla A alla Z">A⇣Z</button>
      <button class="bx" onclick="toggleSegniParagrafo()" title="Mostra/nascondi dove finisce ogni riga">¶</button>
      <button class="bx" onclick="mettiImmagine('${i}')" title="Metti una figura">🖼</button>
      <button class="bx" onmousedown="cmd(event,'removeFormat')" title="Togli la formattazione">✕</button>
    </span>

    <span class="bs" ${PR_MOD?'':'hidden'}>
      <select class="bsel" onchange="setStile('${i}','fam',this.value)" title="Carattere di tutto il foglio">
        ${Object.keys(FAMIGLIE).map(k=>`<option value="${k}" ${s.fam===k?'selected':''}>${NOMI_FAM[k]}</option>`).join('')}
      </select>
      <button class="bx" onclick="setStile('${i}','dim',${Math.max(13,s.dim-2)})" title="Più piccolo">A−</button>
      <input type="number" class="bnum" title="Scrivi la misura di tutto il foglio" min="13" max="48"
        value="${s.dim}" onchange="setStile('${i}','dim',Math.max(13,Math.min(48,Math.round(+this.value)||${s.dim})))">
      <button class="bx" onclick="setStile('${i}','dim',${Math.min(48,s.dim+2)})" title="Più grande">A+</button>
      <button class="bx col-bt" onclick="apriColori(event,'Colore della pagina',COL_PAG,'${s.pag}',c=>setStile('${i}','pag',c))" title="Colore della pagina">
        <i class="pt" style="background:${s.pag}"></i>Pagina ▾</button>
      <select class="bsel pic" onchange="setStile('${i}','interl',+this.value)" title="Interlinea">
        ${[1.2,1.4,1.75,2.1,2.5].map(v=>`<option value="${v}" ${s.interl===v?'selected':''}>↕ ${v}</option>`).join('')}</select>
      <button class="bx ${s.all==='left'?'on':''}" onclick="setStile('${i}','all','left')" title="Tutto il foglio a sinistra">⬅︎</button>
      <button class="bx ${s.all==='center'?'on':''}" onclick="setStile('${i}','all','center')" title="Tutto il foglio al centro">↔︎</button>
      <button class="bx ${s.all==='right'?'on':''}" onclick="setStile('${i}','all','right')" title="Tutto il foglio a destra">➡︎</button>
    </span>

    <span style="flex:1"></span>
    ${PR_MOD?`<button class="bt mini pi" onclick="annullaTesto('${i}')">Annulla</button>
       <button class="bt mini vd" onclick="salvaTesto('${i}')">✓ Salva</button>`
      :`<button class="bt mini" onclick="modificaTesto('${i}')">✎ Modifica</button>`}
    <button class="bt pr mini" onclick="${esp?`proiettaEsperienza('${i}')`:poe?`proiettaPoesia('${i}')`:`componiProiezione('${i}')`}">▶︎ Proietta</button>
    ${p.diapoPptx&&p.diapoPptx.length?`<button class="bt mini pi" onclick="presentaPptxOriginale('${i}')" title="Presenta le diapositive tali e quali al PowerPoint originale">🖼 Diapositive originali</button>`:''}
    ${poe?'':`<button class="bt or mini" onclick="pdfPredica('${i}')">📄 PDF</button>`}
    <button class="bt mini pi" style="color:#ff8b9c" onclick="${esp?`eliminaEsperienza('${i}')`:poe?`eliminaPoesia('${i}')`:`eliminaPredica('${i}')`}" title="Elimina">🗑</button>
    ${esp||poe?'':`<button class="bt mini pi" onclick="diapositive('${i}')" title="Diapositive tue, come in PowerPoint">🎞 Diapositive${(annot(i).slide||[]).length?' <b class="pl-n">'+(annot(i).slide||[]).length+'</b>':''}</button>`}
    <button class="bt mini pi" onclick="stampaPredica('${i}')" title="Stampa">🖨</button>
    ${testoLingua(i,lg)?`<button class="bt pi mini" onclick="ripristinaTesto('${i}')" title="Torna al testo originale">↺</button>`:''}
    ${esp?`<button class="bt pi mini" onclick="nuovaEsperienza('${i}')" title="Titolo, persona, testo biblico">⚙</button>`
        :poe?`<button class="bt pi mini" onclick="nuovaPoesia('${i}')" title="Titolo, autore, lingua">⚙</button>`
        :`<button class="bt pi mini" onclick="nuovaPredica('${i}')" title="Titolo, tema, testo biblico">⚙</button>`}
  </div>

  <div class="pr-zona" style="--fp-pag:${s.pag}">
    <div class="foglio-panna foglio-pieno" id="foglioPr" style="font-family:${FAMIGLIE[s.fam]};font-size:${s.dim}px;
         color:${s.col};text-align:${s.all};line-height:${s.interl};background:${s.pag}">
      ${corpoLingua(p,a,lg)}
    </div>
  </div>
  </div>`);
  risolviImmagini();
  attaccaTocchoPagina();
  pnMonta();   /* i segni fatti con la penna (5b_penna.js) */
}
/* un tocco sulla pagina in anteprima nasconde la barra sopra (schermo pieno
   per leggere), un altro la rimette; mentre scrivo (PR_MOD) niente proprio:
   interazioneCarta chiama sempre preventDefault() sul tocco pulito, e quello
   toglieva al browser la possibilità di mettere il cursore dove tocchi per
   scrivere — bastava controllare PR_MOD dentro al tocco(), troppo tardi */
function attaccaTocchoPagina(){
  if(PR_MOD) return;
  const zona=$('.pr-zona'); if(!zona) return;
  interazioneCarta(zona, ()=>{
    const pag=$('.pr-pagina'); if(pag) pag.classList.toggle('barra-via');
  }, ()=>{});
}
/* ---------- pizzicare con due dita per ingrandire la pagina ----------
   Mentre pizzichi il foglio si allarga subito; quando stacchi le dita
   la misura del carattere resta quella, così le lettere restano nitide
   e il testo va a capo come si deve. */
let PR_PZ=null;
function _dist(e){ const [a,b]=e.touches; return Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY); }
/* il foglio si ingrandisce attorno al punto fra le due dita, un movimento per
   fotogramma e già pronto per la scheda grafica (will-change): prima veniva
   ridisegnato a ogni movimento delle dita e lo schermo lampeggiava */
let _prPzRaf=0;
function pizzicoPrGiu(e){
  if(e.touches.length!==2 || !$('#foglioPr')) return;
  e.preventDefault();
  const f=$('#foglioPr'), r=f.getBoundingClientRect(), [p,q]=e.touches;
  PR_PZ={d0:_dist(e), k:1};
  f.style.willChange='transform';
  f.style.transformOrigin=`${Math.round((p.clientX+q.clientX)/2-r.left)}px ${Math.round((p.clientY+q.clientY)/2-r.top)}px`;
}
function pizzicoPrMuovi(e){
  if(!PR_PZ || e.touches.length!==2) return;
  e.preventDefault();
  PR_PZ.k=Math.max(0.5,Math.min(3,_dist(e)/PR_PZ.d0));
  if(_prPzRaf) return;
  _prPzRaf=requestAnimationFrame(()=>{ _prPzRaf=0;
    const f=$('#foglioPr'); if(f&&PR_PZ) f.style.transform='scale('+PR_PZ.k.toFixed(3)+')'; });
}
function pizzicoPrSu(){
  if(!PR_PZ) return;
  const k=PR_PZ.k; PR_PZ=null;
  if(_prPzRaf){ cancelAnimationFrame(_prPzRaf); _prPzRaf=0; }
  const f=$('#foglioPr');
  const fine=()=>{ const g=$('#foglioPr'); if(g){ g.style.transform=''; g.style.transformOrigin=''; g.style.willChange=''; } };
  if(Math.abs(k-1)<0.06 || !_predAperta){ fine(); return; }
  /* dopo lo zoom resto allo stesso punto della predica */
  const z=$('.pr-zona'), quota=z&&z.scrollHeight>z.clientHeight ? z.scrollTop/(z.scrollHeight-z.clientHeight) : 0;
  const s=stilePredica(_predAperta);
  setStile(_predAperta,'dim',Math.max(10,Math.min(60,Math.round(s.dim*k))));
  fine();
  const z2=$('.pr-zona'); if(z2) z2.scrollTop=quota*(z2.scrollHeight-z2.clientHeight);
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
  salvaFoglioAperto();
  const era=_predAperta;
  document.body.classList.remove('pred-fissa');
  PR_MOD=false; PR_LG=null; _predAperta=null;
  if(era && eUnEsperienza(era)) vai('esperienze');
  else if(era && eUnaPoesia(era)) vai('poesie');
  else vPrediche();
}
/* il corpo nella lingua scelta */
function corpoLingua(p,a,lg){
  const t=testoLingua(p.i,lg);
  if(t) return t;
  return corpoPredica(p,a);
}
/* mette la misura (in em, rispetto al foglio) sulla selezione attuale: se la
   selezione è già uno degli span fatti da questa stessa casella, cambia lui
   invece di annidarne un altro dentro (altrimenti gli em si moltiplicano fra
   loro e la scritta esplode). Usata sia da ingrandisci() (A+/A−) sia da
   impostaDimSel() (il numero scritto a mano). Ritorna lo span usato. */
function applicaDimSel(sel,em){
  const range=sel.getRangeAt(0);
  const n0=sel.anchorNode;
  const nodo=n0&&(n0.nodeType===1?n0:n0.parentElement);
  const giaMio = nodo && nodo.nodeType===1 && nodo.tagName==='SPAN' && /em$/.test(nodo.style.fontSize||'');
  let sp;
  if(giaMio){
    sp=nodo;
    sp.style.fontSize=em+'em';
  } else {
    sp=document.createElement('span');
    sp.style.fontSize=em+'em';
    sp.appendChild(range.extractContents());
    range.insertNode(sp);
  }
  sel.removeAllRanges();
  const r2=document.createRange(); r2.selectNodeContents(sp);
  sel.addRange(r2);
  return sp;
}
/* fare più grande o più piccola una parola, una riga o quel che hai scelto */
function ingrandisci(e,verso){
  e.preventDefault();
  const sel=window.getSelection();
  if(!sel||sel.isCollapsed){ avvisa('Prima scegli il testo con il dito','no'); return; }
  const misure=[0.7,0.85,1,1.2,1.45,1.75,2.1,2.6];
  /* uso la misura relativa: così resta legata alla misura del foglio */
  const box=$('#foglioPr');
  const base=parseFloat(getComputedStyle(box).fontSize)||21;
  /* se ho appena premuto A+/A− la selezione è già lo <span> di prima (non un
     nodo di testo dentro): allora il nodo giusto da guardare è lui stesso,
     altrimenti salterei sopra alla sua misura e ripartirei sempre da capo */
  const nodo=sel.anchorNode&&(sel.anchorNode.nodeType===1?sel.anchorNode:sel.anchorNode.parentElement);
  const ora=nodo?parseFloat(getComputedStyle(nodo).fontSize)/base:1;
  let k=0, dist=9;
  misure.forEach((m,j)=>{ const q=Math.abs(m-ora); if(q<dist){dist=q;k=j;} });
  k=Math.max(0,Math.min(misure.length-1,k+verso));
  applicaDimSel(sel,misure[k]);
  mostraDimSel(Math.round(base*misure[k]));
}
/* appena tocchi la casella per scriverci, PRIMA che il campo prenda lui il
   focus, la selezione nel foglio sparisce (il browser la toglie quando sposti
   il focus su un altro campo): la salvo qui un attimo prima, con onmousedown,
   così quando scrivi il numero la ritrovo ancora */
let _rangeDimSel=null;
function salvaSelPerDim(){
  const sel=window.getSelection();
  /* un tocco doppio/triplo per selezionare il numero già scritto genera PIÙ
     di un mousedown qui sopra: dal secondo in poi il focus è già nella
     casella, quindi non c'è più nessuna selezione vera nel foglio — se in
     quel momento sovrascrivessi con null perderei quella buona presa al
     primo tocco. Quindi cambio solo quando trovo davvero un testo scelto. */
  if(sel && sel.rangeCount && !sel.isCollapsed) _rangeDimSel = sel.getRangeAt(0).cloneRange();
}
/* il numero scritto a mano nella casella A−[..]A+: la misura esatta che vuole
   lui, in pixel del foglio — non il gradino più vicino fra quelli fissi */
function impostaDimSel(input){
  if(!_rangeDimSel){ avvisa('Prima scegli il testo con il dito','no'); mostraDimSel(null); return; }
  const box=$('#foglioPr');
  const base=parseFloat(getComputedStyle(box).fontSize)||21;
  const n=Math.max(6,Math.min(200,Math.round(+input.value)||base));
  const sel=window.getSelection();
  sel.removeAllRanges(); sel.addRange(_rangeDimSel);
  applicaDimSel(sel,n/base);
  mostraDimSel(n);
  _rangeDimSel=null;
}
/* la casella A−[n.]A+ nella barra: il numero di quello che hai scelto in questo momento */
function mostraDimSel(n){ const el=$('#selDim'); if(el) el.value=(n==null?'':n); }
function aggiornaDimSel(){
  if(!document.body.classList.contains('pred-fissa') || !PR_MOD) return;
  /* scrivere dentro alla casella stessa CAMBIA anche lei la selezione del
     documento (ha un cursore anche lei): senza questo controllo, ogni lettera
     scritta a mano faceva scattare questa funzione, che vedeva "nessun testo
     scelto nel foglio" e si autocancellava da sola, lettera dopo lettera */
  if(document.activeElement && document.activeElement.id==='selDim') return;
  const box=$('#foglioPr'); if(!box) return;
  const sel=window.getSelection();
  const nodo0=sel&&sel.rangeCount&&sel.anchorNode;
  const nodo=nodo0&&(nodo0.nodeType===1?nodo0:nodo0.parentElement);
  if(!nodo||!box.contains(nodo)){ mostraDimSel(null); return; }
  const base=parseFloat(getComputedStyle(box).fontSize)||21;
  mostraDimSel(Math.round(parseFloat(getComputedStyle(nodo).fontSize)||base));
}
document.addEventListener('selectionchange',aggiornaDimSel);
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
    /* le pagine di un PDF importato restano sempre intere: toccarle non le rimpicciolisce */
    if(im.classList.contains('fp-pdfpag')) continue;
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
  if(eUnaPoesia(p.i)) return `<div class="fp-cap">
      ${p.autore?`<div class="fp-tema">${esc(p.autore)}</div>`:''}
      <h2 class="fp-tit">${esc(p.tit)}</h2>
    </div>` +
    (p.blocchi||analizzaPoesia(p.testo||'')).map(st=>`<p>${esc(st).replace(/\n/g,'<br>')}</p>`).join('');
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
  const a=annot(i); a.stile=Object.assign(stilePredica(i),{[k]:v}); if(k==='pag') a.stile.pagS=1; salva(); ricaricaPredica();
}

/* ---------- scrivere dentro alla pagina, come in Word ---------- */
let PR_MOD=false;
function modificaTesto(i){
  const f=$('#foglioPr'); if(!f) return;
  PR_MOD=true; PN.on=false;
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
/* elenco puntato/numerato normale già c'era; questo è per l'elenco a
   lettere (a. b. c.) — insertOrderedList fa sempre 1.2.3., poi gli cambio
   solo lo stile della lista appena creata */
/* dopo insertOrderedList/insertUnorderedList il browser a volte lascia
   l'<ol>/<ul> annidato dentro il <p> di prima — html non valido, e la
   proiezione (che legge sia i <p> che gli <li>) mostrerebbe l'elenco due
   volte. Lo tiro fuori dal <p>, e tolgo il <p> se resta vuoto */
function eseguiLista(comando){
  document.execCommand(comando,false,null);
  const sel=window.getSelection(); if(!sel.rangeCount) return null;
  let nodo=sel.anchorNode; nodo=nodo&&(nodo.nodeType===1?nodo:nodo.parentElement);
  const lista=nodo&&nodo.closest&&nodo.closest('ol,ul');
  if(lista && lista.parentElement && lista.parentElement.tagName==='P'){
    const p=lista.parentElement;
    p.parentNode.insertBefore(lista,p);
    if(!p.textContent.trim() && !p.querySelector('img')) p.remove();
  }
  return lista;
}
function cmdLista(e,comando,stile){
  e.preventDefault();
  const lista=eseguiLista(comando);
  if(lista && stile) lista.style.listStyleType=stile;
}
/* Maiuscole/minuscole: un pannellino come quello dei colori, ma con le 4
   scelte del menù "Aa" di Word. Cambio lettera per lettera dentro ai nodi di
   testo toccati dalla selezione, non li sostituisco con testo semplice —
   così un pezzo in grassetto o colorato resta tale, cambia solo il testo */
const _CASI=[s=>s.toLocaleUpperCase('it'), s=>s.toLocaleLowerCase('it'),
  s=>s.replace(/\S+/g,w=>w.charAt(0).toLocaleUpperCase('it')+w.slice(1).toLocaleLowerCase('it')),
  s=>s.charAt(0).toLocaleUpperCase('it')+s.slice(1)];
let _selCasoRange=null;
function apriMaiuscole(ev){
  ev.preventDefault(); ev.stopPropagation();
  const sel=window.getSelection();
  if(!sel||sel.isCollapsed){ avvisa('Prima scegli il testo con il dito','no'); return; }
  _selCasoRange=sel.getRangeAt(0).cloneRange();
  chiudiColori();
  const b=ev.currentTarget.getBoundingClientRect();
  const voci=['MAIUSCOLO','minuscolo','Ogni Parola Maiuscola','Prima lettera maiuscola'];
  const d=document.createElement('div');
  d.className='colpan'; d.id='colpan';
  d.innerHTML=`<div class="cp-t">Maiuscole/minuscole</div>
    <div class="el" style="gap:2px">${voci.map((v,k)=>
      `<div class="rg" style="padding:9px 11px" onmousedown="event.preventDefault();cambiaMaiuscole(${k})"><div class="cp"><b style="font-size:13.5px;font-weight:500">${v}</b></div></div>`).join('')}</div>`;
  document.body.appendChild(d);
  const L=Math.min(Math.max(8,b.left-10), innerWidth-d.offsetWidth-8);
  d.style.left=L+'px'; d.style.top=(b.bottom+8)+'px';
  setTimeout(()=>document.addEventListener('mousedown',fuoriColori),0);
}
function cambiaMaiuscole(k){
  const r=_selCasoRange; chiudiColori(); _selCasoRange=null;
  if(!r) return;
  const f=_CASI[k];
  try{
    const nodi=[];
    const w=document.createTreeWalker(r.commonAncestorContainer,NodeFilter.SHOW_TEXT);
    let n; while(n=w.nextNode()) if(r.intersectsNode(n)) nodi.push(n);
    if(!nodi.length) throw 0;
    nodi.forEach(nodo=>{
      const start=nodo===r.startContainer?r.startOffset:0;
      const end=nodo===r.endContainer?r.endOffset:nodo.length;
      if(start>=end) return;
      const t=nodo.textContent;
      nodo.textContent=t.slice(0,start)+f(t.slice(start,end))+t.slice(end);
    });
  }catch(e){
    /* pezzo di testo che il giro qui sopra non sa gestire (capita raramente
       con selezioni a cavallo di più elementi): perdo la formattazione di
       quel pezzo ma il testo cambia comunque, invece di non fare niente */
    const sel=window.getSelection(); sel.removeAllRanges(); sel.addRange(r);
    document.execCommand('insertText',false,f(r.toString()));
  }
}
/* ordina in ordine alfabetico le righe/i punti dell'elenco che hai scelto:
   scambio solo il contenuto di ogni riga, non le righe stesse, così ognuna
   resta con la sua formattazione */
/* il campo scritto vero: il foglio delle prediche/poesie/esperienze ha
   sempre id="foglioPr", ma la stessa barra serve anche al modulo dei
   cantici (due caselle, Strofe e Ritornello) — cerco quindi il più vicino
   antenato scrivibile alla selezione, invece del solo #foglioPr fisso */
function campoScritto(nodo){
  let el=nodo&&(nodo.nodeType===1?nodo:nodo.parentElement);
  return el&&el.closest&&(el.closest('[contenteditable="true"]')||$('#foglioPr'));
}
function ordinaRighe(e){
  e.preventDefault();
  const sel=window.getSelection();
  if(!sel||sel.isCollapsed){ avvisa('Prima scegli le righe da ordinare','no'); return; }
  const r=sel.getRangeAt(0), box=campoScritto(sel.anchorNode); if(!box) return;
  const tutti=[...box.querySelectorAll('p,li')];
  const toccati=tutti.filter(x=>r.intersectsNode(x));
  if(toccati.length<2){ avvisa('Scegli almeno due righe','no'); return; }
  const contenuti=toccati.map(x=>x.innerHTML)
    .sort((a,b)=>{ const d=document.createElement('div');
      const t=h=>{ d.innerHTML=h; return d.textContent; };
      return t(a).localeCompare(t(b),'it',{sensitivity:'base'}); });
  toccati.forEach((x,k)=>{ x.innerHTML=contenuti[k]; });
  avvisa('Righe ordinate','ok');
}
/* mostra/nasconde il segno ¶ alla fine di ogni riga, come in Word — utile
   per vedere dove finisce davvero un paragrafo */
function toggleSegniParagrafo(){
  const f=campoScritto(document.activeElement)||$('#foglioPr');
  if(f) f.classList.toggle('mostra-segni');
}
/* il titolo che si vede in cima al foglio: preferisco il blocco segnato
   .fp-tit (le prediche scritte qui dentro ce l'hanno sempre); per quelle
   prese dai tuoi file di Pages, che non hanno quel segno, prendo il primo
   blocco non vuoto — è sempre lì che sta il titolo */
function titoloDalTesto(html){
  if(!html) return '';
  const d=document.createElement('div'); d.innerHTML=html;
  const tit=d.querySelector('.fp-tit');
  if(tit){ const t=(tit.innerText||tit.textContent||'').replace(/\s+/g,' ').trim(); if(t) return t.slice(0,120); }
  for(const el of d.querySelectorAll('p,h1,h2,h3,blockquote,li')){
    const t=(el.innerText||el.textContent||'').replace(/\s+/g,' ').trim();
    if(t) return t.slice(0,120);
  }
  return '';
}
/* quando scrivi il titolo direttamente sul foglio (come fosse Word, senza
   passare da ⚙) la copertina e l'ordine in elenco restavano quelli vecchi:
   qui riporto il titolo del foglio dentro ai dati della predica, così
   copertina/posizione/ricerca seguono da soli */
function sincronizzaTitolo(i,html){
  const tit=titoloDalTesto(html);
  if(!tit) return;
  /* le "mie" (predica, esperienza o poesia — create da zero da qui dentro)
     hanno il titolo scritto direttamente sul loro oggetto: lo aggiorno lì,
     così la copertina/l'ordine alfabetico/la ricerca lo vedono subito */
  const mioP=stato.prediche.find(x=>x.i===i);
  if(mioP){ if(mioP.tit!==tit) mioP.tit=tit; return; }
  const mioE=(stato.esperienze||[]).find(x=>x.i===i);
  if(mioE){ if(mioE.tit!==tit) mioE.tit=tit; return; }
  const mioQ=(stato.poesie||[]).find(x=>x.i===i);
  if(mioQ){ if(mioQ.tit!==tit) mioQ.tit=tit; return; }
  /* d'archivio: solo le prediche hanno un'annotazione (meta) che si sovrappone
     da sola al file originale senza sdoppiarlo — esperienze/poesie
     d'archivio non ce l'hanno, per quelle il titolo si cambia da ⚙ */
  if(eUnEsperienza(i)||eUnaPoesia(i)) return;
  const p=trovaPredica(i);
  if(!p || p.tit===tit) return;
  const a=annot(i); a.meta=Object.assign({},a.meta||{},{tit});
}
/* Quello che scrivi sul foglio si salvava SOLO con «✓ Salva»: se andavi su ⚙ (il modulo),
   tornavi all'elenco o cambiavi sezione, andava perso. Ora prima di uscire lo salvo io. */
function salvaFoglioAperto(){
  if(PR_MOD && _predAperta && $('#foglioPr')) salvaTesto(_predAperta,true);
}
/* il titolo cambiato dal modulo ⚙ va anche nel titolo scritto sul foglio: se no, al
   salvataggio dopo, il foglio rimetteva il titolo vecchio (vedi sincronizzaTitolo) */
function titoloSulFoglio(i,tit){
  const a=annot(i), cambia=h=>{
    if(!h) return h;
    const d=document.createElement('div'); d.innerHTML=h;
    const t=d.querySelector('.fp-tit'); if(!t) return h;
    t.textContent=tit; return d.innerHTML;
  };
  if(a.html) a.html=cambia(a.html);
  if(a.testi) Object.keys(a.testi).forEach(lg=>{ if(a.testi[lg]) a.testi[lg]=cambia(a.testi[lg]); });
}
/* ---------- incollare un testo sul foglio ----------
   Prima il browser lo metteva dove stava il cursore: in una predica nuova il cursore sta sul
   titolo «Nuova predica» (già scelto), e TUTTO il testo incollato finiva dentro al titolo,
   come un unico titolo gigante. Ora: se incolli sul titolo, la prima riga diventa il titolo
   e il resto va sotto, com'è; altrove il testo va dove sei, con la sua formattazione. */
function pulisciIncollato(html){
  const a=html.indexOf('<!--StartFragment-->'), b=html.indexOf('<!--EndFragment-->');
  if(a>=0 && b>a) html=html.slice(a+20,b);
  const d=document.createElement('div'); d.innerHTML=html;
  d.querySelectorAll('script,style,meta,link,title,head,xml,iframe,object,embed').forEach(x=>x.remove());
  const giro=n=>{
    [...n.childNodes].forEach(c=>{
      if(c.nodeType===8){ c.remove(); return; }
      if(c.nodeType!==1) return;
      /* i tag di Word tipo <o:p> non servono a niente */
      if(/:/.test(c.nodeName)){ c.replaceWith(...c.childNodes); return; }
      [...c.attributes].forEach(at=>{
        const k=at.name.toLowerCase();
        if(k.startsWith('on') || k==='class' || k==='id' || k==='contenteditable' || k==='lang') c.removeAttribute(at.name);
      });
      if(c.style){ ['position','top','left','right','bottom','z-index'].forEach(p=>c.style.removeProperty(p));
        const st=c.getAttribute('style')||''; if(/mso-/i.test(st)) c.setAttribute('style',st.split(';').filter(x=>!/mso-/i.test(x)).join(';')); }
      giro(c);
    });
  };
  giro(d);
  return d;
}
function testoInBlocchi(t){
  const d=document.createElement('div');
  String(t).replace(/\r\n?/g,'\n').split('\n').forEach(r=>{
    const p=document.createElement('p');
    if(r.trim()) p.textContent=r; else p.innerHTML='<br>';
    d.appendChild(p);
  });
  return d;
}
document.addEventListener('paste',e=>{
  const f=e.target&&e.target.closest?e.target.closest('#foglioPr'):null;
  if(!f||!PR_MOD) return;
  const cd=e.clipboardData; if(!cd) return;
  const html=cd.getData('text/html'), txt=cd.getData('text/plain');
  if(!html && !txt) return;          /* una figura sola: ci pensa il browser */
  const sel=window.getSelection();
  const nodo=sel&&sel.rangeCount?sel.getRangeAt(0).startContainer:null;
  const el=nodo?(nodo.nodeType===1?nodo:nodo.parentElement):null;
  const cap=el&&el.closest?el.closest('.fp-cap'):null;
  const d=html?pulisciIncollato(html):testoInBlocchi(txt);
  e.preventDefault();
  if(!cap || !f.contains(cap)){
    document.execCommand('insertHTML',false,d.innerHTML);
    return;
  }
  /* incollato sul titolo: la prima riga con del testo diventa il titolo (se il titolo è
     ancora quello di partenza o l'avevi scelto tutto), il resto va sotto al titolo */
  const tit=cap.querySelector('.fp-tit');
  const tutto=tit && (/^(nuova predica|nuova esperienza|nuova poesia)$/i.test(tit.textContent.trim()) ||
                      (sel.toString().trim() && sel.toString().trim()===tit.textContent.trim()));
  if(tit && tutto){
    let primo=null;
    const cerca=n=>{ for(const c of [...n.childNodes]){
      if(primo) return;
      if(c.nodeType===3 && c.textContent.trim()){ primo=c; return; }
      if(c.nodeType===1) cerca(c); } };
    cerca(d);
    if(primo){
      /* tolgo dal pezzo incollato il blocco che contiene la prima riga */
      let blocco=primo.parentNode;
      while(blocco && blocco.parentNode!==d) blocco=blocco.parentNode;
      const riga=primo.textContent.trim();
      if(blocco && blocco.nodeType===1 && blocco.textContent.trim()===riga) blocco.remove();
      else if(blocco) primo.textContent='';
      tit.textContent=riga;
    }
  }
  /* il resto va subito dopo il titolo, al posto della riga vuota di partenza */
  let dopo=cap.nextSibling;
  while(dopo && dopo.nodeType===3 && !dopo.textContent.trim()) dopo=dopo.nextSibling;
  if(dopo && dopo.nodeType===1 && dopo.nodeName==='P' && !dopo.textContent.trim() && !dopo.querySelector('img')) dopo.remove();
  const ultimo=d.lastChild;
  cap.after(...d.childNodes);
  if(ultimo && ultimo.parentNode){
    const r=document.createRange(); r.selectNodeContents(ultimo); r.collapse(false);
    sel.removeAllRanges(); sel.addRange(r);
  }
  if(_predAperta) salvaTesto(_predAperta,true);
});
function salvaTesto(i,zitto){
  const f=$('#foglioPr'); if(!f) return;
  /* le figure le tengo nel magazzino: nel testo resta solo il loro nome */
  const copia=f.cloneNode(true);
  copia.querySelectorAll('img[data-all]').forEach(im=>im.removeAttribute('src'));
  scriviLingua(i,linguaPredica(i),copia.innerHTML);
  sincronizzaTitolo(i,copia.innerHTML);
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
/* la stessa etichetta/lo stesso elenco luoghi+date servono anche a
   esperienze e poesie ("dove l'ho raccontata"/"dove l'ho detta"), non solo
   alle prediche: annot(i).luoghi è già generico per id, bastava non chiamarlo
   sempre "predicato" */
function etichettaLuogo(i){
  if(eUnEsperienza(i)) return 'Dove l\'ho raccontata';
  if(eUnaPoesia(i)) return 'Dove l\'ho recitata';
  return 'Dove ho predicato';
}
/* per il bollo 📍 sulla carta: leggo senza creare l'annotazione (come
   versiPoesia), altrimenti scorrere la griglia ne creerebbe una vuota per
   ogni predica/esperienza/poesia solo perché è comparsa in vista */
function numeroLuoghi(i){
  const a=(stato.predAnnot||{})[i];
  return (a&&a.luoghi&&a.luoghi.length)||0;
}
function aggiungiLuogo(i){
  const usati=luoghiUsati();
  const miei=annot(i).luoghi||[];
  apri(etichettaLuogo(i),`
    <div class="griglia" style="gap:13px">
      ${miei.length?`<div class="el">${miei.map((l,k)=>`
        <div class="rg" style="cursor:default">
          <div class="cp"><b style="font-size:14.5px;font-weight:550">${esc(l)}</b></div>
          <div class="az"><button class="bt mini pi" style="color:#ff8b9c" onclick="togliLuogo('${i}',${k})" title="Togli">🗑</button></div>
        </div>`).join('')}</div>`
        :`<p class="sotto" style="margin:0">Non risulta ancora segnata da nessuna parte — aggiungi il primo posto qui sotto.</p>`}
      <div class="fila">
        <div class="campo" style="flex:2"><label>Chiesa o luogo</label>
          <input type="text" id="luC" placeholder="es. Torino" autofocus></div>
        <div class="campo" style="flex:1"><label>Data</label>
          <input type="date" id="luD" value="${oggi()}"></div>
      </div>
      ${usati.length?`<div class="campo"><label>Già usati</label>
        <div class="fila" style="gap:6px">${usati.map(l=>
          `<button class="bt mini pi" onclick="document.getElementById('luC').value=${JSON.stringify(l)}">${esc(l)}</button>`).join('')}</div></div>`:''}
    </div>`,
    `<button class="bt pi" onclick="chiudi()">Chiudi</button>
     <button class="bt pr" onclick="salvaLuogo('${i}')">✚ Aggiungi</button>`,560);
  setTimeout(()=>$('#luC').focus(),120);
}
const MESI_BR=['gen','feb','mar','apr','mag','giu','lug','ago','set','ott','nov','dic'];
function dataBreve(iso){
  if(!iso) return '';
  const [a,m,g]=iso.split('-');
  return `${+g} ${MESI_BR[+m-1]} ${a}`;
}
/* dopo aver aggiunto/tolto un luogo, se non sono dentro al foglio torno
   all'elenco giusto — quello della predica, dell'esperienza o della poesia */
function vaiSuSezioneDi(i){
  if(eUnEsperienza(i)) vEsperienze();
  else if(eUnaPoesia(i)) vPoesie();
  else vPrediche();
}
function salvaLuogo(i){
  const c=$('#luC').value.trim(), d=dataBreve($('#luD').value);
  if(!c){ avvisa('Serve almeno il luogo','no'); return; }
  const a=annot(i); a.luoghi=a.luoghi||[]; a.luoghi.push(d?`${c} ${d}`:c);
  a.luoghi.sort((x,y)=>x.localeCompare(y,'it'));
  salva(); aggiungiLuogo(i); avvisa('Annotato','ok');
  if(_predAperta) ricaricaPredica(); else vaiSuSezioneDi(i);
}
function togliLuogo(i,k){
  const a=annot(i); a.luoghi.splice(k,1); salva();
  if($('#modale').classList.contains('on')) aggiungiLuogo(i);
  if(_predAperta) ricaricaPredica(); else vaiSuSezioneDi(i);
}
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
/* predica nuova: niente modulo da riempire, si scrive dritti sul foglio come
   in Word — titolo/tema/testo biblico/sfondo si sistemano poi con ⚙ */
function predicaVuota(){
  /* nasce nella lingua che stai guardando in quel momento (il filtro Italiano/
     Română), non sempre italiano: se no, scrivendone una mentre guardi le
     rumene, spariva dall'elenco che stavi guardando */
  const lg=FP.lg==='ro'?'ro':'it';
  const dati={ tit:'Nuova predica', num:prossimoNumero(), lg, tema:'', rif:'', data:oggi(),
               sfondo:'notte', testo:'', blocchi:[] };
  dati.i=uid(); dati.mia=true;
  stato.prediche.push(dati);
  const a=annot(dati.i);
  a.stile=Object.assign({},a.stile||{},{fam:'serif',dim:22,interl:1.5});
  /* un <p></p> vuoto (senza niente dentro) il browser non lo tratta come una
     riga vera da toccare: il tocco sotto al titolo finiva dentro al titolo
     stesso invece che qui. Con <br> dentro è una riga cliccabile come si deve. */
  a.html=`<div class="fp-cap"><h2 class="fp-tit">${esc(dati.tit)}</h2></div><p><br></p>`;
  salva();
  leggiPredica(dati.i);
  setTimeout(()=>{ modificaTesto(dati.i); setTimeout(selezionaTitoloFoglio,30); },160);
  avvisa('Scrivi qui la predica: hai tutti i comandi in alto','ok');
}
/* dopo aver aperto in modifica una predica/esperienza/poesia NUOVA, seleziono
   tutto il titolo segnaposto ("Nuova predica" ecc.): così la prima lettera
   che scrivi lo sostituisce subito, come un campo con dentro un testo già
   scelto — invece di dover cancellare "Nuova predica" a mano prima */
function selezionaTitoloFoglio(){
  const h=document.querySelector('#foglioPr .fp-tit'); if(!h) return;
  const r=document.createRange(); r.selectNodeContents(h);
  const sel=window.getSelection(); sel.removeAllRanges(); sel.addRange(r);
}
function nuovaPredica(i){
  if(!i){ predicaVuota(); return; }
  salvaFoglioAperto();
  const p = trovaPredica(i);
  /* una predica d'archivio (viene dal file, non è "mia") non ha un testo da
     incollare qui — quello si scrive con «✎ Modifica»; qui si sistemano solo
     titolo/tema/riferimento/lingua/sfondo, che restano un'annotazione a
     parte (vedi tuttePrediche) senza toccare mai il file originale */
  const arch = p && !p.mia;
  apri('Modifica predica',`
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
    ${arch?`<p class="sotto" style="margin:0">Il testo della predica si cambia da «✎ Modifica» — qui sistemi solo titolo, tema, riferimento, lingua e sfondo.</p>`
      :`<div class="campo"><label>Testo della predica — incollalo così com'è</label>
      <textarea id="npX" style="min-height:240px" placeholder="Incolla qui il testo.&#10;&#10;Il programma riconosce da solo:&#10;· i titoli (righe che finiscono con i due punti o tutte maiuscole)&#10;· le citazioni bibliche fra virgolette o con il riferimento fra parentesi&#10;· gli elenchi numerati o con il trattino">${esc(p?p.testo||'':'')}</textarea></div>`}
    <div id="npAnt" style="font-size:12.5px;color:var(--tx3)"></div>
   </div>`,
   `${p&&p.mia?`<button class="bt pi" style="margin-right:auto;color:#ff8b9c" onclick="eliminaPredica('${p.i}')">Elimina</button>`:''}
    ${arch?'':`<button class="bt pi" onclick="anteprimaPredica()">👁 Anteprima</button>`}
    <button class="bt pi" onclick="chiudi()">Annulla</button>
    <button class="bt pr" onclick="salvaPredica(${p?`'${p.i}'`:'null'})">Salva</button>`,760);
  const x=$('#npX'), te=$('#npTe');
  if(x){
    const agg=()=>{ const b=analizzaPredica(x.value);
      $('#npAnt').innerHTML=b.length?`Riconosciuti <b>${b.length}</b> blocchi → <b>${slidePredica({tit:'x',blocchi:b}).length}</b> diapositive
        (${b.filter(z=>z.t==='titolo').length} titoli, ${b.filter(z=>z.t==='cit').length} citazioni, ${b.filter(z=>z.t==='punti').length} elenchi)`:''; };
    x.oninput=agg; agg();
  }
  te.oninput=()=>{ const s=sfondoDaTema(te.value+' '+$('#npT').value); const sel=$('#npS'); if(!p) sel.value=s; };
}
function anteprimaPredica(){
  const b=analizzaPredica($('#npX').value);
  if(!b.length){ avvisa('Non c\'è ancora testo','no'); return; }
  const p={tit:$('#npT').value||'Anteprima',tema:$('#npTe').value,rif:$('#npR').value,blocchi:b};
  chiudi(); proietta(slidePredica(p), $('#npS')?$('#npS').value:'notte', p.tit);
}
function salvaPredica(i){
  const tit=$('#npT').value.trim(), x=$('#npX'), testo=(x?x.value.trim():'');
  if(!tit){ avvisa('Serve almeno il titolo','no'); return; }
  const meta={ tit, num:+($('#npN')?$('#npN').value:0)||0,
               lg:$('#npL').value, tema:$('#npTe').value.trim(), rif:$('#npR').value.trim(),
               data:$('#npD').value.trim(), sfondo:$('#npS').value };
  const mia = i && stato.prediche.some(p=>p.i===i);
  const arch = i && !mia && trovaPredica(i);
  if(mia){
    const rec=stato.prediche.find(p=>p.i===i);
    /* se il testo incollato qui è cambiato davvero, deve sostituire quello
       scritto sul foglio — altrimenti restava lì, invisibile, e il foglio
       non cambiava mai (a.html vince sempre su blocchi/testo in corpoPredica) */
    const testoCambiato = x && testo!==(rec.testo||'');
    Object.assign(rec,meta,{testo,blocchi:analizzaPredica(testo)});
    if(testoCambiato){ const a=annot(i); a.html=''; a.testi={}; }
    else titoloSulFoglio(i,tit);
  }
  else if(arch){
    /* predica d'archivio: mai testo/blocchi qui (quelli restano nel file
       originale, si cambiano solo con «Modifica») — solo l'annotazione coi
       dati corretti, che tuttePrediche() sovrappone da sola al file */
    annot(i).meta=meta; titoloSulFoglio(i,tit); salva();
  }
  let nuova=null;
  if(!mia && !arch){
    const dati=Object.assign({},meta,{testo,blocchi:analizzaPredica(testo)});
    dati.i=uid(); dati.mia=true; stato.prediche.push(dati);
    /* la predica nuova nasce sul foglio bianco, con i caratteri di lettura */
    const a=annot(dati.i);
    a.stile=Object.assign({},a.stile||{},{fam:'serif',dim:22,interl:1.5});
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
/* le diapositive vere del PowerPoint importato, tali e quali all'originale
   (posizione, sfondo e formattazione), invece del testo riversato nel foglio.
   Le immagini stanno nel magazzino del programma (IndexedDB): se il
   programma è stato appena riaperto, prima le risveglio (come già fa
   risolviImmagini per le figure dentro al foglio), poi proietto. */
async function presentaPptxOriginale(i){
  const p=trovaPredica(i); if(!p||!p.diapoPptx||!p.diapoPptx.length) return;
  const ids=new Set();
  p.diapoPptx.forEach(d=>{
    if(d.sfondoPptx&&d.sfondoPptx.tipo==='immagine') ids.add(d.sfondoPptx.id);
    (d.forme||[]).forEach(fo=>{ if(fo.tipo==='immagine') ids.add(fo.id); });
    if(d.fedele) (d.fedele.html+' '+(d.fedele.sfondo||'')).replace(/__PF_([A-Za-z0-9]+)__/g,(m,id)=>{ ids.add(id); return m; });
  });
  const mancano=[...ids].filter(id=>!fileUrl[id]);
  if(mancano.length) await riprendiAllegati(mancano);
  const slide=p.diapoPptx.map(d=>Object.assign({t:'pptxdia'},d));
  proietta(slide, stato.imp.sfondoProi, p.tit);
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
  if(c==='transparent'){
    const sel=window.getSelection();
    if(!sel||sel.isCollapsed){ avvisa('Prima scegli il testo evidenziato con il dito','no'); return; }
  }
  document.execCommand('styleWithCSS',false,true);
  if(!document.execCommand('hiliteColor',false,c)) document.execCommand('backColor',false,c); }
