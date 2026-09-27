/* ================= IMPORTA UNA PREDICA DA PDF O DA WORD =================
   Due pulsanti nella pagina delle Prediche, accanto a «Importa PowerPoint».
   · PDF: ogni pagina entra nel foglio come l'immagine esatta della pagina originale
     (caratteri, colori, impaginazione: identica). Il testo del PDF lo leggo lo stesso,
     per la ricerca e per la proiezione.
   · Word (.docx): lo converto io, senza librerie (lo zip si apre con leggiZip/decomprimiVoce
     di 7e_importa_pptx.js): caratteri, misure, grassetto/corsivo/sottolineato, colori ed
     evidenziatore, allineamento, rientri, spazi fra i capoversi, interlinea, elenchi puntati
     e numerati, tabelle e figure. Le misure le tengo in proporzione (em) al testo normale
     del documento, così A− A+ del foglio ingrandiscono tutto insieme. */
let _idLg='it';
function apriImportaDoc(tipo){
  _idLg = FP.lg==='ro'?'ro':'it';
  const pdf = tipo==='pdf';
  apri(pdf?'Importa da PDF':'Importa da Word',`
    <p class="sotto" style="margin-top:0">${pdf
      ? 'Scelgo il file <b>.pdf</b> e lo metto sul foglio della predica come <b>testo che puoi cambiare</b>, con i caratteri, le grandezze e i colori dell\'originale.'
      : 'Scelgo il file <b>.docx</b> di Word e lo metto sul foglio della predica <b>com\'è</b>: caratteri, misure, colori, rientri, elenchi, tabelle e figure.'}</p>
    <input type="file" id="idF" accept="${pdf?'.pdf,application/pdf':'.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document'}"
      style="display:none" onchange="scegliDoc('${tipo}')">
    <div class="vuoto" id="idZona" style="cursor:pointer;border:2px dashed var(--bordo2);border-radius:var(--r)" onclick="$('#idF').click()">
      <span class="em">${pdf?'📄':'📝'}</span>Tocca qui per scegliere il file ${pdf?'.pdf':'.docx'}</div>
    <div class="campo" style="margin-top:14px"><label>In che lingua è la predica</label>
      <div class="segm">
        <button class="${_idLg==='it'?'on':''}" id="idItBt" onclick="_idLg='it';$('#idItBt').classList.add('on');$('#idRoBt').classList.remove('on')">🇮🇹 Italiano</button>
        <button class="${_idLg==='ro'?'on':''}" id="idRoBt" onclick="_idLg='ro';$('#idRoBt').classList.add('on');$('#idItBt').classList.remove('on')">🇷🇴 Română</button>
      </div></div>
    <div id="idStato" style="margin-top:14px;font-size:13.5px;color:var(--tx3)"></div>`,
    `<button class="bt pi" onclick="chiudi()">Annulla</button>`,540);
}
async function scegliDoc(tipo){
  const f=$('#idF').files[0]; if(!f) return;
  const st=$('#idStato');
  st.style.color=''; st.textContent='Leggo «'+f.name+'»…';
  $('#idZona').style.pointerEvents='none';
  try{
    const nome=f.name.replace(/\.(pdf|docx)$/i,'').replace(/[_]+/g,' ').trim()||'Predica importata';
    const r = tipo==='pdf' ? await pdfInFoglio(f,(n,t)=>{ st.textContent=`Pagina ${n} di ${t}…`; })
                           : await docxInFoglio(f);
    chiudi();
    creaPredicaImportata(r.titolo||nome, r.html, r.testo, _idLg, r.pag);
    avvisa(tipo==='pdf'?`Importate ${r.pagine} pagine: il testo si può modificare`:'Documento Word importato','ok');
  }catch(e){
    console.error(e);
    st.textContent='Non ci sono riuscito: '+e.message;
    st.style.color='#ff8b9c';
    $('#idZona').style.pointerEvents='';
  }
}
function creaPredicaImportata(titolo,html,testo,lg,pag){
  const dati={ tit:titolo.slice(0,120), num:prossimoNumero(), lg, tema:'', rif:'', data:oggi(),
               sfondo:sfondoDaTema(titolo), testo:testo||'', blocchi:analizzaPredica(testo||'') };
  dati.i=uid(); dati.mia=true;
  stato.prediche.push(dati);
  const a=annot(dati.i);
  a.stile=Object.assign({},a.stile||{},{pag:pag||'#ffffff',pagS:1,fam:'serif',dim:22,interl:1.15});
  a.html=html;
  salva();
  leggiPredica(dati.i);
}

/* ---------- PDF ----------
   Prima ogni pagina entrava come un'immagine: identica, ma non si poteva cambiare una parola.
   Ora il PDF diventa TESTO VERO, modificabile sul foglio, con quello che aveva l'originale:
   · ogni pezzo di testo con il suo carattere (famiglia, grassetto, corsivo) e la sua grandezza
     (in proporzione al testo normale del documento, come per Word, così A− A+ ingrandiscono tutto);
   · il colore: il PDF non lo scrive vicino al testo, allora disegno la pagina e guardo di che
     colore sono i punti delle lettere;
   · le righe rimesse insieme nei loro capoversi (anche quando un capoverso passa alla pagina
     dopo), con allineamento (sinistra, centro, destra, giustificato), rientri, interlinea e spazi;
   · le immagini vere, ritagliate dalla pagina al loro posto;
   · i numeri di pagina in cima o in fondo li tolgo (in un foglio unico non servono).
   Una pagina senza testo (una scansione, una foto) resta un'immagine: lì non c'è testo da leggere. */
function _pdfFamiglia(nome,serif){
  let n=String(nome||'').replace(/^[A-Z]{6}\+/,'').replace(/[-,](Bold|Italic|Oblique|Regular|Roman|Medium|Light|Black|Heavy|Semibold|Demi|BoldItalic|BoldOblique|Book|MT|PS|PSMT).*$/i,'');
  n=n.replace(/(PSMT|MT|PS)$/,'').replace(/([a-z])([A-Z])/g,'$1 $2').trim();
  const noti={'Times':'Times New Roman','Times New Roman':'Times New Roman','Arial':'Arial','Helvetica':'Helvetica',
    'Courier':'Courier New','Courier New':'Courier New','Symbol':'','Zapf Dingbats':''};
  if(noti[n]!=null) n=noti[n];
  if(!n || /^g_d|^F\d+$|^T\d|^TT\d/i.test(n)) return serif?'serif':'';
  return n;
}
function _pdfColore(px,w,h){
  /* il colore più frequente nel riquadro è lo sfondo; le lettere sono i punti più lontani da lui */
  const conta=new Map(); let best=null, nb=0;
  for(let k=0;k<px.length;k+=4){ const key=(px[k]>>3)+','+(px[k+1]>>3)+','+(px[k+2]>>3); const v=(conta.get(key)||0)+1; conta.set(key,v); if(v>nb){ nb=v; best=[px[k],px[k+1],px[k+2]]; } }
  if(!best) return null;
  const d=[]; let max=0;
  for(let k=0;k<px.length;k+=4){ const q=Math.abs(px[k]-best[0])+Math.abs(px[k+1]-best[1])+Math.abs(px[k+2]-best[2]); d.push(q); if(q>max) max=q; }
  if(max<60) return null;
  let r=0,g=0,b=0,n=0;
  for(let k=0,j=0;k<px.length;k+=4,j++) if(d[j]>=max*0.8){ r+=px[k]; g+=px[k+1]; b+=px[k+2]; n++; }
  r=Math.round(r/n); g=Math.round(g/n); b=Math.round(b/n);
  if(Math.max(r,g,b)-Math.min(r,g,b)<28 && r<90) return '#000000';   /* nero (le lettere sfumate ai bordi lo schiariscono) */
  const hx=v=>v.toString(16).padStart(2,'0');
  return '#'+hx(r)+hx(g)+hx(b);
}
async function pdfInFoglio(file,passo){
  await caricaPdfJs();
  const doc=await pdfjsLib.getDocument({data:new Uint8Array(await file.arrayBuffer())}).promise;
  const OPS=pdfjsLib.OPS, pezzi=[];      /* righe e immagini, nell'ordine della lettura */
  /* i colori già visti: uno quasi uguale (le lettere sfumate cambiano di poco) diventa lo stesso */
  const tavolozza=[];
  const unisciCol=h=>{ if(!h) return h;
    const q=[1,3,5].map(k=>parseInt(h.slice(k,k+2),16));
    for(const t of tavolozza){ if(Math.abs(t.q[0]-q[0])+Math.abs(t.q[1]-q[1])+Math.abs(t.q[2]-q[2])<=36) return t.h; }
    tavolozza.push({h,q}); return h; };
  let colPag='';
  try{
    for(let n=1;n<=doc.numPages;n++){
      if(passo) passo(n,doc.numPages);
      const pg=await doc.getPage(n);
      const v=pg.getViewport({scale:1});
      const ops=await pg.getOperatorList();
      const tc=await pg.getTextContent();
      /* la pagina disegnata: per i colori delle lettere e per ritagliare le immagini */
      const S=Math.min(3,Math.max(1.5,1500/v.width));
      const vs=pg.getViewport({scale:S});
      const c=document.createElement('canvas'); c.width=Math.round(vs.width); c.height=Math.round(vs.height);
      const cx=c.getContext('2d',{alpha:false,willReadFrequently:true}); cx.fillStyle='#fff'; cx.fillRect(0,0,c.width,c.height);
      await pg.render({canvasContext:cx,viewport:vs}).promise;
      if(n===1){ const q=cx.getImageData(4,4,1,1).data; if(q[0]<245||q[1]<245||q[2]<245) colPag='#'+[q[0],q[1],q[2]].map(x=>x.toString(16).padStart(2,'0')).join(''); }
      const H=v.height;
      /* i pezzi di testo */
      const it=[];
      for(const x of tc.items){
        if(!x.str || !x.str.length) continue;
        const tr=pdfjsLib.Util.transform(v.transform,x.transform);
        const size=Math.hypot(tr[2],tr[3]); if(size<2) continue;
        let fo=null; try{ if(pg.commonObjs.has(x.fontName)) fo=pg.commonObjs.get(x.fontName); }catch(e){}
        const st=tc.styles[x.fontName]||{};
        const nome=(fo&&fo.name)||st.fontFamily||'';
        const serif=fo?!!fo.isSerifFont:/serif/.test(st.fontFamily||'')&&!/sans/.test(st.fontFamily||'');
        const w=x.width||x.str.length*size*0.5;
        const X=tr[4], Y=tr[5];
        const base={size, fam:_pdfFamiglia(nome,serif),
          b:!!(fo&&(fo.bold||fo.black)) || /bold|black|heavy|semibold|demi/i.test(nome),
          i:!!(fo&&fo.italic) || /italic|oblique/i.test(nome)};
        /* il colore parola per parola: dentro allo stesso pezzo di testo il PDF può cambiare colore
           a metà («e una parte in rosso»); le parole vicine dello stesso colore tornano insieme */
        const colDi=(xa,xb)=>{ try{ const x0=Math.max(0,Math.floor(xa*S)), y0=Math.max(0,Math.floor((Y-size*0.8)*S)),
            ww=Math.max(1,Math.min(c.width-x0,Math.ceil((xb-xa)*S))), hh=Math.max(1,Math.min(c.height-y0,Math.ceil(size*0.95*S)));
            return unisciCol(_pdfColore(cx.getImageData(x0,y0,ww,hh).data,ww,hh)); }catch(e){ return null; } };
        const parole=x.str.match(/\s*\S+\s*|\s+/g)||[x.str], L=x.str.length||1;
        let pos=0, cur=null;
        for(const p of parole){
          const xa=X+w*pos/L, xb=X+w*(pos+p.length)/L; pos+=p.length;
          const col=p.trim()?colDi(xa+(w*(p.length-p.trimStart().length)/L),xb-(w*(p.length-p.trimEnd().length)/L)):(cur?cur.col:null);
          if(cur && cur.col===col){ cur.t+=p; cur.w=xb-cur.x; }
          else { cur=Object.assign({t:p, x:xa, y:Y, w:xb-xa, col},base); it.push(cur); }
        }
      }
      /* le immagini: dove le mette la pagina (seguo le trasformazioni dei disegni) */
      const imm=[];
      try{
        let ctm=[1,0,0,1,0,0]; const pila=[];
        const mul=(m,q)=>[m[0]*q[0]+m[2]*q[1], m[1]*q[0]+m[3]*q[1], m[0]*q[2]+m[2]*q[3], m[1]*q[2]+m[3]*q[3], m[0]*q[4]+m[2]*q[5]+m[4], m[1]*q[4]+m[3]*q[5]+m[5]];
        for(let k=0;k<ops.fnArray.length;k++){
          const fn=ops.fnArray[k], ar=ops.argsArray[k];
          if(fn===OPS.save) pila.push(ctm.slice());
          else if(fn===OPS.restore){ if(pila.length) ctm=pila.pop(); }
          else if(fn===OPS.transform) ctm=mul(ctm,ar);
          else if(fn===OPS.paintImageXObject||fn===OPS.paintInlineImageXObject||fn===OPS.paintImageXObjectRepeat||fn===OPS.paintJpegXObject){
            const m=mul(v.transform,ctm);
            const pts=[[0,0],[1,0],[0,1],[1,1]].map(([a,b])=>[m[0]*a+m[2]*b+m[4], m[1]*a+m[3]*b+m[5]]);
            const x0=Math.min(...pts.map(p=>p[0])), x1=Math.max(...pts.map(p=>p[0])), y0=Math.min(...pts.map(p=>p[1])), y1=Math.max(...pts.map(p=>p[1]));
            if(x1-x0>24 && y1-y0>24 && !(x1-x0>v.width*0.97 && y1-y0>H*0.97)) imm.push({x0:Math.max(0,x0),x1:Math.min(v.width,x1),y0:Math.max(0,y0),y1:Math.min(H,y1)});
          }
        }
      }catch(e){}
      /* una pagina senza testo (scansione, foto): resta un'immagine, com'era */
      if(!it.some(x=>x.t.trim())){
        const blob=await new Promise((ok,no)=>c.toBlob(b=>b?ok(b):no(new Error('pagina '+n+' non disegnata')),'image/jpeg',0.9));
        const id='im'+uid(); await salvaAllegato(id,blob);
        pezzi.push({tipo:'img', pag:n, html:`<figure class="fp-fig fp-pdfpag" contenteditable="false"><img class="fp-img fp-pdfpag" data-all="${id}" alt="Pagina ${n}"></figure>`});
        c.width=c.height=1; try{ pg.cleanup(); }catch(e){} continue;
      }
      /* le righe: pezzi alla stessa altezza */
      it.sort((a,b)=>a.y-b.y||a.x-b.x);
      const righe=[];
      it.forEach(x=>{
        const r=righe.find(r=>Math.abs(r.y-x.y)<Math.max(r.size,x.size)*0.4);
        if(r){ r.el.push(x); r.size=Math.max(r.size,x.size); } else righe.push({y:x.y,size:x.size,el:[x]});
      });
      righe.forEach(r=>{ r.el.sort((a,b)=>a.x-b.x); r.x0=r.el[0].x; r.x1=Math.max(...r.el.map(e=>e.x+e.w)); });
      righe.sort((a,b)=>a.y-b.y);
      /* i numeri di pagina (soli, in cima o in fondo): via */
      const tieni=righe.filter(r=>{ const s=r.el.map(e=>e.t).join('').trim();
        return !(/^[-–\s]*\d{1,4}[-–\s]*$/.test(s) && (r.y>H*0.9 || r.y<H*0.08)); });
      imm.forEach(q=>{
        try{
          const k=document.createElement('canvas'); k.width=Math.round((q.x1-q.x0)*S); k.height=Math.round((q.y1-q.y0)*S);
          k.getContext('2d').drawImage(c,q.x0*S,q.y0*S,k.width,k.height,0,0,k.width,k.height);
          q.url=k.toDataURL('image/jpeg',0.9);
        }catch(e){}
      });
      for(const q of imm){
        if(!q.url) continue;
        const blob=await (await fetch(q.url)).blob(); const id='im'+uid(); await salvaAllegato(id,blob);
        pezzi.push({tipo:'img', pag:n, y:q.y0, wPag:v.width, larg:(q.x1-q.x0)/v.width,
          html:`<figure class="fp-fig" contenteditable="false"><img class="fp-img" data-all="${id}" alt="" style="width:${Math.round((q.x1-q.x0)/v.width*1000)/10}%;max-width:100%"></figure>`});
      }
      tieni.forEach(r=>pezzi.push({tipo:'riga', pag:n, y:r.y, size:r.size, x0:r.x0, x1:r.x1, el:r.el, wPag:v.width}));
      c.width=c.height=1;
      try{ pg.cleanup(); }catch(e){}
    }
  } finally { try{ doc.destroy(); }catch(e){} }
  /* l'ordine giusto: pagina per pagina, dall'alto in basso */
  pezzi.forEach((p,k)=>p.k=k);
  pezzi.sort((a,b)=>a.pag-b.pag||(a.y==null?-1:b.y==null?1:a.y-b.y)||a.k-b.k);
  const righe=pezzi.filter(p=>p.tipo==='riga');
  if(!righe.length) return { html:pezzi.map(p=>p.html).join('')+'<p><br></p>', testo:'', pagine:doc.numPages||0, pag:colPag };
  /* il testo normale: la grandezza usata per più lettere */
  const conta={};
  righe.forEach(r=>r.el.forEach(e=>{ const k=Math.round(e.size*2)/2; conta[k]=(conta[k]||0)+e.t.length; }));
  const BASE=+Object.keys(conta).sort((a,b)=>conta[b]-conta[a])[0]||12;
  /* i margini del testo, pagina per pagina */
  /* i margini del testo: presi da tutto il documento (una pagina con poche righe da sola sbaglia);
     una pagina con abbastanza righe e margini suoi diversi (un'altra impaginazione) tiene i suoi */
  const marg={};
  const margDi=rr=>{ const xs=rr.map(r=>r.x0).sort((a,b)=>a-b), xe=rr.map(r=>r.x1).sort((a,b)=>a-b);
    return {L:xs[Math.floor(xs.length*0.1)], R:xe[Math.floor(xe.length*0.85)]}; };
  const tutti=margDi(righe);
  [...new Set(righe.map(r=>r.pag))].forEach(p=>{
    const rr=righe.filter(r=>r.pag===p);
    const m=rr.length>=12?margDi(rr):null;
    marg[p]=m && (Math.abs(m.L-tutti.L)>20 || Math.abs(m.R-tutti.R)>20) ? m : tutti;
  });
  const allin=r=>{ const m=marg[r.pag], w=m.R-m.L||1, lm=r.x0-m.L, rm=m.R-r.x1, mezzo=(r.x0+r.x1)/2;
    /* centrato rispetto al testo, oppure rispetto al foglio (tanti documenti centrano sulla pagina) */
    if(lm>w*0.06 && (Math.abs(lm-rm)<w*0.05 || Math.abs(mezzo-r.wPag/2)<r.wPag*0.03)) return 'center';
    if(rm<w*0.03 && lm>w*0.25) return 'right';
    return 'left'; };
  const piena=r=>{ const m=marg[r.pag]; return r.x1>=m.R-(m.R-m.L)*0.06; };
  /* una riga che non arriva al margine finisce il capoverso solo se la prima parola della riga
     dopo ci sarebbe stata: se no è il testo allineato a sinistra che va a capo prima (bandiera) */
  const finisce=(r,dopo)=>{
    if(piena(r)) return false;
    const m=marg[r.pag], resto=m.R-r.x1;
    const car=r.el.reduce((s,e)=>s+e.t.length,0)||1, medio=(r.x1-r.x0)/car;
    const w1=((dopo&&dopo.el[0].t.trim().split(/\s+/)[0])||'').length*medio;
    return resto > w1+medio*3;
  };
  const stileDi=e=>[Math.round(e.size*2)/2,e.fam,e.b,e.i,e.col].join('|');
  /* i capoversi */
  const cap=[]; let cur=null, prec=null;
  for(const p of pezzi){
    if(p.tipo==='img'){ cur=null; prec=null; cap.push({img:p.html}); continue; }
    const al=allin(p);
    let nuovo=!cur;
    if(cur && prec){
      const stessaPag=p.pag===prec.pag, salto=p.y-prec.y, m=marg[p.pag], w=m.R-m.L||1;
      if(stessaPag && salto>Math.max(p.size,prec.size)*1.5) nuovo=true;
      if(Math.abs(p.size-prec.size)>Math.max(p.size,prec.size)*0.15) nuovo=true;
      if(al!==cur.al) nuovo=true;
      if(cur.al==='left' && finisce(prec,p)) nuovo=true;                        /* la riga prima finiva corta: fine del capoverso */
      if(al==='left' && p.x0>m.L+w*0.03 && !finisce(prec,p) && cur.righe.length && p.x0>prec.x0+w*0.02) nuovo=true;   /* rientro della prima riga */
      if(!stessaPag && finisce(prec,p)) nuovo=true;
    }
    if(nuovo){ cur={al, righe:[], sopra: prec&&p.pag===prec.pag ? p.y-prec.y : null}; cap.push(cur); }
    cur.righe.push(p); prec=p;
  }
  const em=v=>(Math.round(v*1000)/1000)+'em';
  const testo=[]; let titolo='';
  const html=cap.map(cp=>{
    if(cp.img) return cp.img;
    const rr=cp.righe, prima=rr[0], m=marg[prima.pag], w=m.R-m.L||1;
    /* la grandezza del capoverso: quella con più lettere */
    const cz={}; rr.forEach(r=>r.el.forEach(e=>{ const k=Math.round(e.size*2)/2; cz[k]=(cz[k]||0)+e.t.length; }));
    const PS=+Object.keys(cz).sort((a,b)=>cz[b]-cz[a])[0]||BASE;
    let al=cp.al;
    if(al==='left' && rr.length>2 && rr.slice(0,-1).every(piena)) al='justify';
    const st=['font-size:'+em(PS/BASE)];
    if(al!=='left') st.push('text-align:'+al);
    const sx=Math.min(...rr.slice(1).map(r=>r.x0).concat(rr.length===1?[prima.x0]:[]))-m.L;
    if(al==='left'||al==='justify'){
      if(sx>w*0.03) st.push('margin-left:'+em(sx/PS));
      const rient=prima.x0-m.L-Math.max(0,sx);
      if(rr.length>1 && Math.abs(rient)>w*0.02) st.push('text-indent:'+em(rient/PS));
    }
    if(rr.length>1){
      const salti=[]; for(let k=1;k<rr.length;k++) if(rr[k].pag===rr[k-1].pag) salti.push(rr[k].y-rr[k-1].y);
      if(salti.length){ salti.sort((a,b)=>a-b); st.push('line-height:'+(Math.round(salti[Math.floor(salti.length/2)]/PS*100)/100)); }
    } else st.push('line-height:1.2');
    /* all'inizio di una pagina nuova non so quanto spazio c'era: metto quello di un capoverso normale */
    const sopra = cp.sopra!=null ? Math.max(0,cp.sopra-PS*1.25) : (cp!==cap.find(x=>!x.img) ? PS*0.8 : 0);
    st.push('margin-top:'+em(sopra/PS)); st.push('margin-bottom:0');
    /* i pezzi di testo, uniti quando hanno lo stesso aspetto */
    const runs=[]; let piano='';
    rr.forEach((r,k)=>{
      r.el.forEach((e,j)=>{
        let t=e.t;
        if(j>0){ const pr=r.el[j-1], gap=e.x-(pr.x+pr.w);
          if(gap>e.size*0.18 && !/\s$/.test(pr.t) && !/^\s/.test(t)) t=' '+t; }
        const u=runs[runs.length-1];
        if(u && (u.k===stileDi(e) || !t.trim())) u.t+=t; else runs.push({k:stileDi(e),e,t});
        piano+=t;
      });
      if(k<rr.length-1){
        const u=runs[runs.length-1];
        /* a capo nel mezzo di una parola spezzata col trattino: la riunisco */
        if(u && /[a-zà-ÿăâîșțş]-$/i.test(u.t) && /^[a-zà-ÿăâîșțş]/.test(rr[k+1].el[0].t)){ u.t=u.t.slice(0,-1); piano=piano.slice(0,-1); }
        else if(u && !/\s$/.test(u.t)){ u.t+=' '; piano+=' '; }
      }
    });
    testo.push(piano.trim());
    if(!titolo && piano.trim() && piano.trim().length<=120) titolo=piano.trim();
    const pezziHtml=runs.map(u=>{
      const e=u.e, s=[];
      if(Math.abs(e.size-PS)>PS*0.04) s.push('font-size:'+em(e.size/PS));
      if(e.fam) s.push('font-family:'+_nomeFont(e.fam));
      if(e.b) s.push('font-weight:bold');
      if(e.i) s.push('font-style:italic');
      if(e.col) s.push('color:'+e.col);
      const h=esc(u.t);
      return s.length?`<span style="${s.join(';')}">${h}</span>`:h;
    }).join('');
    return `<p style="${st.join(';')}">${pezziHtml||'<br>'}</p>`;
  }).join('');
  return { html:html+'<p><br></p>', testo:testo.join('\n\n'), pagine:doc.numPages||0, titolo, pag:colPag };
}

/* ---------- Word (.docx) ---------- */
const _W='http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const _R='http://schemas.openxmlformats.org/officeDocument/2006/relationships';
function _wa(el,k){ if(!el) return null; const v=el.getAttributeNS(_W,k); return v!=null&&v!==''?v:el.getAttribute('w:'+k); }
function _wk(el,n){ if(!el) return null; for(const c of el.children) if(c.localName===n) return c; return null; }
function _wks(el,n){ return el?[...el.children].filter(c=>c.localName===n):[]; }
function _wOn(el){ if(!el) return undefined; const v=_wa(el,'val'); return !(v==='0'||v==='false'||v==='off'||v==='none'); }
function _xml(u8){ return new DOMParser().parseFromString(new TextDecoder().decode(u8),'application/xml'); }
const _EVID_WORD={yellow:'#ffff00',green:'#00ff00',cyan:'#00ffff',magenta:'#ff00ff',blue:'#0000ff',red:'#ff0000',
  darkBlue:'#000080',darkCyan:'#008080',darkGreen:'#008000',darkMagenta:'#800080',darkRed:'#800000',
  darkYellow:'#808000',darkGray:'#808080',lightGray:'#c0c0c0',black:'#000000',white:'#ffffff'};
/* le proprietà di un pezzo di testo (w:rPr) */
function _rPr(el,tema){
  const o={}; if(!el) return o;
  for(const c of el.children){
    const k=c.localName, v=_wa(c,'val');
    if(k==='b') o.b=_wOn(c);
    else if(k==='i') o.i=_wOn(c);
    else if(k==='u') o.u=!!v && v!=='none';
    else if(k==='strike'||k==='dstrike') o.s=_wOn(c);
    else if(k==='caps') o.caps=_wOn(c);
    else if(k==='smallCaps') o.sc=_wOn(c);
    else if(k==='vanish') o.via=_wOn(c);
    else if(k==='sz') o.sz=+v/2;
    else if(k==='color'){ if(v && v!=='auto') o.col='#'+v; }
    else if(k==='highlight'){ if(v && v!=='none') o.evid=_EVID_WORD[v]||v; }
    else if(k==='shd'){ const f=_wa(c,'fill'); if(f && f!=='auto') o.fondo='#'+f; }
    else if(k==='vertAlign') o.va=v;
    else if(k==='rFonts'){
      let f=_wa(c,'ascii')||_wa(c,'hAnsi');
      const t=_wa(c,'asciiTheme')||_wa(c,'hAnsiTheme');
      if(!f && t && tema) f=/major/i.test(t)?tema.major:tema.minor;
      if(f) o.font=f;
    }
  }
  return o;
}
/* le proprietà di un capoverso (w:pPr) */
function _pPr(el){
  const o={}; if(!el) return o;
  for(const c of el.children){
    const k=c.localName;
    if(k==='jc') o.jc=_wa(c,'val');
    else if(k==='pStyle') o.stile=_wa(c,'val');
    else if(k==='ind'){
      const n=a=>{ const v=_wa(c,a); return v==null?undefined:+v; };
      const l=n('left')!=null?n('left'):n('start'), r=n('right')!=null?n('right'):n('end');
      if(l!=null) o.sx=l; if(r!=null) o.dx=r;
      if(n('firstLine')!=null){ o.prima=n('firstLine'); o.appeso=0; }
      if(n('hanging')!=null){ o.appeso=n('hanging'); o.prima=0; }
    }
    else if(k==='spacing'){
      const b=_wa(c,'before'), a=_wa(c,'after'), l=_wa(c,'line');
      if(b!=null) o.sopra=+b; if(a!=null) o.sotto=+a;
      if(_wa(c,'beforeAutospacing')==='1') o.sopra=280;
      if(_wa(c,'afterAutospacing')==='1') o.sotto=280;
      if(l!=null){ o.riga=+l; o.regola=_wa(c,'lineRule')||'auto'; }
    }
    else if(k==='numPr'){ const id=_wk(c,'numId'), lv=_wk(c,'ilvl');
      if(id) o.num=_wa(id,'val'); if(lv) o.liv=+_wa(lv,'val'); }
    else if(k==='shd'){ const f=_wa(c,'fill'); if(f && f!=='auto') o.fondo='#'+f; }
    else if(k==='rPr') o.rPr=c;
  }
  return o;
}
function _nomeFont(f){
  const q=String(f).replace(/'/g,'');
  const sans=/arial|helvetica|calibri|verdana|tahoma|segoe|aptos|gill|futura|avenir|optima|trebuchet|sans/i.test(q);
  const mono=/courier|mono|consolas/i.test(q);
  return `'${q}',${mono?'monospace':sans?'sans-serif':'serif'}`;
}
function _numero(n,fmt){
  const lett=k=>{ let s=''; k--; do{ s=String.fromCharCode(97+k%26)+s; k=Math.floor(k/26)-1; }while(k>=0); return s; };
  const rom=k=>{ const v=[[1000,'m'],[900,'cm'],[500,'d'],[400,'cd'],[100,'c'],[90,'xc'],[50,'l'],[40,'xl'],[10,'x'],[9,'ix'],[5,'v'],[4,'iv'],[1,'i']];
    let s=''; v.forEach(([a,b])=>{ while(k>=a){ s+=b; k-=a; } }); return s; };
  if(fmt==='lowerLetter') return lett(n);
  if(fmt==='upperLetter') return lett(n).toUpperCase();
  if(fmt==='lowerRoman') return rom(n);
  if(fmt==='upperRoman') return rom(n).toUpperCase();
  if(fmt==='none') return '';
  return String(n);
}
/* i punti degli elenchi di Word sono spesso caratteri del font Symbol/Wingdings */
function _pallino(t){
  return String(t||'').replace(/[]/g,c=>({'':'•','':'▪','':'✓','':'❖','':'➢','':'◦'})[c])
    .replace(/[-]/g,'•');
}
async function docxInFoglio(file){
  if(/\.doc$/i.test(file.name)) throw new Error('questo è un vecchio file .doc: in Word salvalo come .docx e riprova');
  if(typeof DecompressionStream==='undefined') throw new Error('questo Safari è troppo vecchio per leggere i file di Word: aggiorna il sistema');
  const zip=leggiZip(new Uint8Array(await file.arrayBuffer()));
  const leggi=async p=>zip[p]?_xml(await decomprimiVoce(zip[p])):null;
  const doc=await leggi('word/document.xml');
  if(!doc) throw new Error('non è un file di Word (.docx)');
  const stili=await leggi('word/styles.xml'), numXml=await leggi('word/numbering.xml'), temaXml=await leggi('word/theme/theme1.xml');
  const rel=await leggiRelazioni(zip,'word/document.xml');
  /* i due caratteri del tema (titoli e testo) */
  const tema={major:'',minor:''};
  if(temaXml){
    const f=(n)=>{ const e=[...temaXml.getElementsByTagName('*')].find(x=>x.localName===n); const l=e&&_wk(e,'latin'); return l?l.getAttribute('typeface'):''; };
    tema.major=f('majorFont'); tema.minor=f('minorFont');
  }
  /* gli stili, ognuno con quello su cui si basa */
  const ST={}; let stDef=null;
  const docR={}, docP={};
  if(stili){
    const dd=_wk(stili.documentElement,'docDefaults');
    if(dd){ const r=_wk(_wk(dd,'rPrDefault'),'rPr'), p=_wk(_wk(dd,'pPrDefault'),'pPr');
      Object.assign(docR,_rPr(r,tema)); Object.assign(docP,_pPr(p)); }
    _wks(stili.documentElement,'style').forEach(s=>{
      const id=_wa(s,'styleId'), b=_wk(s,'basedOn');
      ST[id]={tipo:_wa(s,'type'), base:b?_wa(b,'val'):null, p:_pPr(_wk(s,'pPr')), r:_rPr(_wk(s,'rPr'),tema)};
      if(_wa(s,'type')==='paragraph' && (_wa(s,'default')==='1'||_wa(s,'default')==='true')) stDef=id;
    });
  }
  const _cacheSt={};
  const stile=id=>{
    if(!id||!ST[id]) return {p:{},r:{}};
    if(_cacheSt[id]) return _cacheSt[id];
    _cacheSt[id]={p:{},r:{}};                       /* contro gli stili che si richiamano a vicenda */
    const b=stile(ST[id].base);
    return (_cacheSt[id]={p:Object.assign({},b.p,ST[id].p), r:Object.assign({},b.r,ST[id].r)});
  };
  /* gli elenchi */
  const ABS={}, NUM={};
  if(numXml){
    _wks(numXml.documentElement,'abstractNum').forEach(a=>{
      const lv={};
      _wks(a,'lvl').forEach(l=>{
        const s=_wk(l,'start'), f=_wk(l,'numFmt'), t=_wk(l,'lvlText');
        lv[+_wa(l,'ilvl')]={start:s?+_wa(s,'val'):1, fmt:f?_wa(f,'val'):'decimal', txt:t?_wa(t,'val'):'',
          p:_pPr(_wk(l,'pPr')), r:_rPr(_wk(l,'rPr'),tema)};
      });
      ABS[_wa(a,'abstractNumId')]=lv;
    });
    _wks(numXml.documentElement,'num').forEach(n=>{
      const a=_wk(n,'abstractNumId'), ov={};
      _wks(n,'lvlOverride').forEach(o=>{ const s=_wk(o,'startOverride'); if(s) ov[+_wa(o,'ilvl')]=+_wa(s,'val'); });
      NUM[_wa(n,'numId')]={abs:a?_wa(a,'val'):null, ov};
    });
  }
  const contatori={};
  const pDef=Object.assign({},docP,stile(stDef).p), rDef=Object.assign({},docR,stile(stDef).r);
  /* il testo normale del documento, in punti: la misura usata per più lettere (non sempre è
     quella dello stile «Normale»: tanti file la scrivono su ogni pezzo di testo) */
  const BASE=(()=>{
    const conta={};
    const corpo0=_wk(doc.documentElement,'body');
    [...(corpo0?corpo0.getElementsByTagNameNS(_W,'r'):[])].forEach(r=>{
      const t=[...r.children].filter(x=>x.localName==='t').map(x=>x.textContent).join(''); if(!t.trim()) return;
      const p=r.closest?r.closest('p'):null, pp=p?_pPr(_wk(p,'pPr')):{};
      const rp=_wk(r,'rPr'), rs=rp&&_wk(rp,'rStyle');
      const z=_rPr(rp,tema).sz || (rs&&stile(_wa(rs,'val')).r.sz) || stile(pp.stile||stDef).r.sz || docR.sz || 11;
      conta[z]=(conta[z]||0)+t.length;
    });
    const k=Object.keys(conta).sort((a,b)=>conta[b]-conta[a])[0];
    return k?+k:(rDef.sz||docR.sz||11);
  })();
  const em=v=>(Math.round(v*1000)/1000)+'em';
  const immagini=[]; let testo=[];

  /* un pezzo di testo con le sue proprietà */
  const spanDi=(t,r,pSz)=>{
    if(!t) return '';
    const st=[];
    if(r.font) st.push('font-family:'+_nomeFont(r.font));
    const sz=r.sz||BASE;
    if(Math.abs(sz-pSz)>0.01) st.push('font-size:'+em(sz/pSz));
    if(r.b) st.push('font-weight:bold');
    if(r.i) st.push('font-style:italic');
    const dec=[]; if(r.u) dec.push('underline'); if(r.s) dec.push('line-through');
    if(dec.length) st.push('text-decoration:'+dec.join(' '));
    if(r.col) st.push('color:'+r.col);
    if(r.evid||r.fondo) st.push('background-color:'+(r.evid||r.fondo));
    if(r.caps) st.push('text-transform:uppercase');
    if(r.sc) st.push('font-variant:small-caps');
    let h=esc(t).replace(/\t/g,'<span style="display:inline-block;width:2em"></span>').replace(/\n/g,'<br>');
    if(r.va==='superscript') h='<sup>'+h+'</sup>'; else if(r.va==='subscript') h='<sub>'+h+'</sub>';
    return st.length?`<span style="${st.join(';')}">${h}</span>`:h;
  };
  const immagineDi=async(el,pSz)=>{
    const blip=[...el.getElementsByTagName('*')].find(x=>x.localName==='blip'||x.localName==='imagedata');
    if(!blip) return '';
    const rid=blip.getAttributeNS(_R,'embed')||blip.getAttributeNS(_R,'id')||blip.getAttribute('r:embed')||blip.getAttribute('r:id');
    const dove=rid&&rel[rid]?risolviPercorsoZip('word/document.xml',rel[rid]):null;
    if(!dove||!zip[dove]) return '';
    const ext=(dove.split('.').pop()||'').toLowerCase();
    if(!MIME_IMG[ext]) return '';
    const b=new Blob([await decomprimiVoce(zip[dove])],{type:MIME_IMG[ext]});
    const id='im'+uid(); await salvaAllegato(id,b); immagini.push(id);
    const ex=[...el.getElementsByTagName('*')].find(x=>x.localName==='extent');
    const cx=ex?+ex.getAttribute('cx'):0;
    const larg=cx?em((cx/9525)/(pSz*4/3)):'';
    return `<img data-all="${id}" alt="" style="${larg?'width:'+larg+';':''}max-width:100%;height:auto;vertical-align:bottom">`;
  };
  /* i pezzi di testo dentro a un capoverso (anche dentro a link, campi, revisioni) */
  const pezzi=async(el,rBase,pSz,out)=>{
    for(const c of el.children){
      const k=c.localName;
      if(k==='r'){
        const rp=_wk(c,'rPr'), rs=rp&&_wk(rp,'rStyle');
        const r=Object.assign({},rBase,rs?stile(_wa(rs,'val')).r:{},_rPr(rp,tema));
        if(r.via) continue;
        for(const x of c.children){
          const kx=x.localName;
          if(kx==='t'){ out.h+=spanDi(x.textContent,r,pSz); out.t+=x.textContent; }
          else if(kx==='tab'){ out.h+=spanDi('\t',r,pSz); out.t+='\t'; }
          else if(kx==='br'||kx==='cr'){ out.h+='<br>'; out.t+='\n'; }
          else if(kx==='noBreakHyphen'){ out.h+=spanDi('‑',r,pSz); out.t+='-'; }
          else if(kx==='sym'){ const ch=_wa(x,'char'); if(ch){ const s=_pallino(String.fromCharCode(parseInt(ch,16))); out.h+=spanDi(s,r,pSz); out.t+=s; } }
          else if(kx==='drawing'||kx==='pict'||kx==='object'){
            out.h+=await immagineDi(x,pSz);
            /* le caselle di testo: il loro testo lo metto dopo il capoverso */
            const tb=[...x.getElementsByTagName('*')].filter(z=>z.localName==='txbxContent');
            for(const z of tb) out.dopo+=`<div style="border:1px solid #999;padding:.4em .6em;margin:.4em 0">${await blocchi(z)}</div>`;
          }
        }
      }
      else if(k==='hyperlink'){
        const rid=c.getAttributeNS(_R,'id')||c.getAttribute('r:id');
        const dentro={h:'',t:'',dopo:''}; await pezzi(c,rBase,pSz,dentro);
        const href=rid&&rel[rid]&&/^(https?:|mailto:)/i.test(rel[rid])?rel[rid]:'';
        out.h+=href?`<a href="${esc(href)}">${dentro.h}</a>`:dentro.h; out.t+=dentro.t; out.dopo+=dentro.dopo;
      }
      else if(k==='del'||k==='moveFrom'||k==='instrText'||k==='delText'||k==='pPr'||k==='proofErr'||k==='bookmarkStart'||k==='bookmarkEnd') continue;
      else if(k==='ins'||k==='moveTo'||k==='smartTag'||k==='fldSimple'||k==='customXml'||k==='sdt'||k==='sdtContent'||k==='dir'||k==='bdo')
        await pezzi(k==='sdt'?(_wk(c,'sdtContent')||c):c,rBase,pSz,out);
    }
  };
  const capoverso=async p=>{
    const dir=_pPr(_wk(p,'pPr'));
    const sp=stile(dir.stile||stDef);
    const pp=Object.assign({},docP,sp.p);
    /* l'elenco: dallo stile o scritto sul capoverso */
    const numId=dir.num!=null?dir.num:pp.num, liv=dir.liv!=null?dir.liv:(pp.liv||0);
    let pref='', lvl=null;
    if(numId!=null && numId!=='0' && NUM[numId] && ABS[NUM[numId].abs]){
      lvl=ABS[NUM[numId].abs][liv];
      if(lvl){
        const cn=(contatori[numId]=contatori[numId]||{});
        Object.keys(cn).forEach(k=>{ if(+k>liv) delete cn[k]; });
        cn[liv]=cn[liv]==null?(NUM[numId].ov[liv]!=null?NUM[numId].ov[liv]:lvl.start):cn[liv]+1;
        pref = lvl.fmt==='bullet' ? _pallino(lvl.txt||'•')
          : String(lvl.txt||'').replace(/%(\d)/g,(m,d)=>{ const L=+d-1, l2=ABS[NUM[numId].abs][L];
              const v=cn[L]!=null?cn[L]:(l2?l2.start:1); return _numero(v,l2?l2.fmt:'decimal'); });
        Object.assign(pp,lvl.p);
      }
    }
    Object.assign(pp,dir);
    const rPar=Object.assign({},docR,sp.r,_rPr(pp.rPr,tema));
    const pSz=rPar.sz||BASE;
    const st=['font-size:'+em(pSz/BASE)];
    if(rPar.font) st.push('font-family:'+_nomeFont(rPar.font));
    if(rPar.col) st.push('color:'+rPar.col);
    const al={center:'center',right:'right',end:'right',both:'justify',distribute:'justify',left:'left',start:'left'}[pp.jc];
    if(al) st.push('text-align:'+al);
    const pt=tw=>em((tw/20)/pSz);
    st.push('margin:'+[pt(pp.sopra||0),pt(pp.dx||0),pt(pp.sotto||0),pt(pp.sx||0)].join(' '));
    if(pp.prima) st.push('text-indent:'+pt(pp.prima));
    else if(pp.appeso) st.push('text-indent:-'+pt(pp.appeso));
    if(pp.riga){
      if(pp.regola==='auto') st.push('line-height:'+(Math.round(pp.riga/240*1.15*100)/100));
      else st.push('line-height:'+pt(pp.riga));
    } else st.push('line-height:1.15');
    if(pp.fondo) st.push('background-color:'+pp.fondo);
    const out={h:'',t:'',dopo:''};
    await pezzi(p,rPar,pSz,out);
    if(pref){
      const rl=Object.assign({},rPar,lvl?lvl.r:{});
      const larg=pp.appeso?pt(pp.appeso):'1.5em';
      out.h=`<span style="display:inline-block;min-width:${larg};text-indent:0">${spanDi(pref,rl,pSz)}</span>`+out.h;
      out.t=pref+' '+out.t;
    }
    testo.push(out.t);
    return `<p style="${st.join(';')}">${out.h||'<br>'}</p>`+out.dopo;
  };
  const tabella=async t=>{
    const tp=_wk(t,'tblPr'), ts=tp&&_wk(tp,'tblStyle');
    const bordi=(()=>{ const b=tp&&_wk(tp,'tblBorders');
      if(b) return [...b.children].some(x=>{ const v=_wa(x,'val'); return v&&v!=='nil'&&v!=='none'; });
      return !!(ts && /grid|table/i.test(_wa(ts,'val')||'')); })();
    /* prima la griglia, per le celle unite in verticale */
    const righe=_wks(t,'tr').map(tr=>_wks(tr,'tc').map(tc=>{
      const pr=_wk(tc,'tcPr'), gs=pr&&_wk(pr,'gridSpan'), vm=pr&&_wk(pr,'vMerge'), sh=pr&&_wk(pr,'shd');
      return {tc, span:gs?+_wa(gs,'val'):1, vm:vm?(_wa(vm,'val')||'continue'):null,
              fondo:sh&&_wa(sh,'fill')&&_wa(sh,'fill')!=='auto'?'#'+_wa(sh,'fill'):'', righe:1};
    }));
    const col=r=>{ let c=0; return r.map(x=>{ x.col=c; c+=x.span; return x; }); };
    righe.forEach(col);
    righe.forEach((r,i)=>r.forEach(x=>{
      if(x.vm!=='restart') return;
      for(let j=i+1;j<righe.length;j++){ const y=righe[j].find(z=>z.col===x.col); if(y&&y.vm==='continue') x.righe++; else break; }
    }));
    let h=`<table style="border-collapse:collapse;width:100%;margin:.4em 0">`;
    for(const r of righe){
      h+='<tr>';
      for(const x of r){
        if(x.vm==='continue') continue;
        const st=['padding:.2em .4em','vertical-align:top'];
        if(bordi) st.push('border:1px solid #000');
        if(x.fondo) st.push('background-color:'+x.fondo);
        h+=`<td${x.span>1?` colspan="${x.span}"`:''}${x.righe>1?` rowspan="${x.righe}"`:''} style="${st.join(';')}">${await blocchi(x.tc)}</td>`;
      }
      h+='</tr>';
    }
    return h+'</table>';
  };
  const blocchi=async el=>{
    let h='';
    for(const c of el.children){
      const k=c.localName;
      if(k==='p') h+=await capoverso(c);
      else if(k==='tbl') h+=await tabella(c);
      else if(k==='sdt'){ const s=_wk(c,'sdtContent'); if(s) h+=await blocchi(s); }
      else if(k==='customXml'||k==='ins'||k==='moveTo') h+=await blocchi(c);
    }
    return h;
  };
  const corpo=_wk(doc.documentElement,'body');
  if(!corpo) throw new Error('il documento è vuoto');
  const html=await blocchi(corpo);
  /* il colore della pagina, se nel documento ce n'è uno */
  const bg=_wk(doc.documentElement,'background'), colPag=bg&&_wa(bg,'color')&&_wa(bg,'color')!=='auto'?'#'+_wa(bg,'color'):'';
  const tit=testo.map(x=>x.trim()).find(Boolean)||'';
  return { html:html||'<p><br></p>', testo:testo.join('\n'), titolo:tit.length<=120?tit:'', pag:colPag };
}
