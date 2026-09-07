/* ================= CONDIVIDI IL QUIZ ================= */
const FS={ sel:new Set() };
function elencoCondiv(){ return filtra(); }
function chiaveD(d){ return (d.mia?'m':'d')+d.i; }

function renderCondividi(){
  const el=elencoCondiv();
  $('#scDom').innerHTML=`
  <p class="sotto" style="margin-top:0">Scegli le domande qui sotto — valgono i filtri qui sopra — poi esportale.
  Il PowerPoint e il PDF mantengono il funzionamento del quiz: una diapositiva per ogni passaggio, fino alla risposta in verde.</p>

  <div class="scheda" style="margin:16px 0">
    <div class="fila">
      <div><div style="font-family:var(--serif);font-size:26px;line-height:1.1" id="nSel">${FS.sel.size}</div>
        <div style="font-size:11.5px;color:var(--tx3);text-transform:uppercase;letter-spacing:.9px;font-weight:600">domande scelte</div></div>
      <span style="flex:1"></span>
      <button class="bt pi mini" onclick="selTutte()">Scegli tutte (${el.length})</button>
      <button class="bt pi mini" onclick="selNessuna()">Togli tutte</button>
      <button class="bt pi mini" onclick="selCasuali(10)">🎲 10</button>
      <button class="bt pi mini" onclick="selCasuali(20)">🎲 20</button>
      <button class="bt pi mini" onclick="selCasuali(30)">🎲 30</button>
    </div>
    <div class="fila" style="margin-top:14px">
      <button class="bt pr" onclick="espPptx()">📊 PowerPoint</button>
      <button class="bt or" onclick="espPdf()">📄 PDF del quiz</button>
      <button class="bt" onclick="espPdfRisposte()">📋 PDF con le risposte a parte</button>
      <button class="bt pi" onclick="espTesto()">📝 Testo</button>
      <button class="bt pi" onclick="espFile()">💾 File del quiz</button>
      <button class="bt pi" onclick="provaSel()">▶︎ Prova</button>
    </div>
    <div class="avz"><i style="width:${el.length?Math.min(100,FS.sel.size/el.length*100):0}%"></i></div>
  </div>

  <h2>Domande <span class="pill">${el.length.toLocaleString('it-IT')}</span></h2>
  <div class="el">${el.slice(0,200).map(d=>{
    const k=chiaveD(d);
    return `<div class="rg ${FS.sel.has(k)?'sel':''}" onclick="tog('${k}')">
      <div class="spunta">✓</div>
      <div class="cp"><b>${esc(d.d)}</b>
        <span>${esc(nomeLibro(d.L,d.lg))}${d.v?' · '+esc(d.v):''} · ${DIFF[d.dif||2].ic} ${DIFF[d.dif||2].et} · risposta: ${esc(d.o[d.g])}</span></div></div>`;}).join('')}</div>
  ${el.length>200?`<p style="text-align:center;color:var(--tx3);margin-top:16px;font-size:13px">Mostrate le prime 200. «Scegli tutte» prende comunque tutte le ${el.length.toLocaleString('it-IT')}.</p>`:''}`;
}
function tog(k){ FS.sel.has(k)?FS.sel.delete(k):FS.sel.add(k); vDomande(); }
function selTutte(){ elencoCondiv().forEach(d=>FS.sel.add(chiaveD(d))); vDomande(); }
function selNessuna(){ FS.sel.clear(); vDomande(); }
/* «a caso» pesca solo fra quelle che non hai ancora presentato */
function selCasuali(n){
  FS.sel.clear();
  const p=pescaNuove(elencoCondiv(),n,'dom',chiaveDomanda,seme(Date.now()&0xffffff));
  if(p.girato) avvisa('Le hai presentate tutte: ricomincio il giro','ok');
  p.lista.forEach(d=>FS.sel.add(chiaveD(d)));
  vDomande();
}
/* le domande da esportare: quelle scelte a mano, oppure quelle dei filtri
   nella quantità e nell'ordine che hai indicato */
function scelte(soloProva){
  const el=elencoCondiv();
  if(FS.sel.size){
    const s=el.filter(d=>FS.sel.has(chiaveD(d)));
    if(s.length){ if(!soloProva) segnaViste('dom',s.map(chiaveDomanda)); return s; }
  }
  if(!el.length){ avvisa('Con questi filtri non c\'è nessuna domanda','no'); return null; }
  const rnd=seme(Date.now()&0xffffff);
  /* anche qui: quelle già presentate le salto */
  const p=pescaNuove(el,FD.n,'dom',chiaveDomanda,rnd);
  if(p.girato && !soloProva) avvisa('Le hai presentate tutte: ricomincio il giro','ok');
  let l=p.lista;
  if(FD.ordine!=='casuale') l=l.slice().sort((a,b)=> a.L-b.L || capVers(a.v)-capVers(b.v));
  if(!soloProva) segnaViste('dom',l.map(chiaveDomanda));
  return l;
}
function provaSel(){
  const s=scelte(true); if(!s) return;
  proietta(s.map((d,k)=>({t:'domanda',d:d.d,o:d.o,g:d.g,v:d.v,txt:testoVers(d.v),
    libro:nomeLibro(d.L,d.lg),n:`${k+1} / ${s.length}`,fase:0})), stato.imp.sfondoProi,'Anteprima');
}
function nomeFile(est){
  const p = FD.ambito==='libro' ? nomeLibro(FD.libro,FD.lg)
    : (FD.ambito==='at'?'Antico Testamento':FD.ambito==='nt'?'Nuovo Testamento':'Tutta la Bibbia');
  const d = FD.dif? ' — '+DIFF[FD.dif].et : '';
  return `Domande — ${p}${d} (${FD.lg.toUpperCase()}).${est}`;
}

/* ---------- PowerPoint ---------- */
function espPptx(){
  const s=scelte(); if(!s) return;
  salvaFile(nomeFile('pptx'),_TIPI.pptx[1],async()=>{
      const sl=[];
      s.forEach((d,k)=>{
        const dd={d:d.d,o:d.o,g:d.g,v:d.v,txt:testoVers(d.v),libro:nomeLibro(d.L,d.lg)};
        /* le stesse 5 fasi del programma: domanda · a · b · c · risposta */
        for(let f=0;f<=4;f++) sl.push(ppDomanda(dd,f,k+1,s.length));
      });
      avvisa(`PowerPoint pronto — ${s.length} domande, ${sl.length} diapositive`,'ok');
      return pptx(sl,'Domande bibliche');
  });
}

/* ---------- disegno su tela per il PDF ---------- */
function avvolgi(x,t,max){
  const par=String(t).split('\n'); const out=[];
  par.forEach(p=>{
    const w=p.split(' '); let r='';
    w.forEach(v=>{ const p2=r?r+' '+v:v;
      if(x.measureText(p2).width>max && r){ out.push(r); r=v; } else r=p2; });
    out.push(r);
  });
  return out;
}
function telaDomanda(d,fase,num,tot,L,H){
  const f = fase===true?4:(fase===false?3:(fase|0));
  const ris = f>=4, conTesto = ris && d.txt;
  const c=document.createElement('canvas'); c.width=L; c.height=H;
  const x=c.getContext('2d');
  const g=x.createRadialGradient(L*0.5,H*0.2,0,L*0.5,H*0.5,L*0.85);
  g.addColorStop(0,'#151a2b'); g.addColorStop(1,'#05070c');
  x.fillStyle=g; x.fillRect(0,0,L,H);
  const M=L*0.058, S=L/1600;
  x.textBaseline='middle';
  /* nome del libro: grande, dorato, carattere particolare */
  if(d.libro){ x.font=`600 ${Math.round(66*S)}px Optima, "Avenir Next", "Gill Sans", sans-serif`;
    x.textAlign='right'; x.fillStyle='#e8be6e'; x.fillText(d.libro,L-M,H*0.085); }
  if(num){ x.font=`${Math.round(26*S)}px -apple-system, Helvetica, Arial, sans-serif`;
    x.fillStyle='rgba(255,255,255,.42)'; x.textAlign='left'; x.fillText(`${num} / ${tot}`,M,H*0.085); }
  /* domanda */
  x.textAlign='center'; x.fillStyle='#fff';
  let fs=Math.round(58*S); const FD2=n=>`650 ${n}px "SF Pro Display","Avenir Next",-apple-system,Helvetica,Arial,sans-serif`;
  x.font=FD2(fs);
  let rg=avvolgi(x,d.d,L-2*M);
  while(rg.length>3 && fs>26){ fs-=3; x.font=FD2(fs); rg=avvolgi(x,d.d,L-2*M); }
  const hR=fs*1.22, y0=H*0.245-(rg.length-1)*hR/2;
  rg.forEach((r,i)=>x.fillText(r,L/2,y0+i*hR));
  /* senza varianti: si vede solo la risposta, grande e in verde */
  if(d.solo){
    if(ris){
      const bw=L*0.66, bh=H*0.22, bx=(L-bw)/2, by=H*0.60;
      x.textAlign='center';
      const rr=22*S;
      x.beginPath();
      if(x.roundRect) x.roundRect(bx,by,bw,bh,rr);
      else x.rect(bx,by,bw,bh);
      x.fillStyle='rgba(31,164,99,.34)'; x.fill();
      x.lineWidth=4*S; x.strokeStyle='#27c47a'; x.stroke();
      const FS2=n2=>`700 ${n2}px Optima, "Avenir Next", sans-serif`;
      let fn=Math.round(78*S); x.font=FS2(fn);
      while(x.measureText(d.o[d.g]).width>bw-70*S && fn>26){ fn-=3; x.font=FS2(fn); }
      x.fillStyle='#fff'; x.fillText(d.o[d.g],L/2,by+bh/2);
      if(d.v){ x.textAlign='right'; x.font=`600 ${Math.round(34*S)}px Optima, "Avenir Next", sans-serif`;
        x.fillStyle='#e0b25c'; x.fillText(d.v,L-M,H-H*0.06); }
    }
    return c;
  }
  /* opzioni, una alla volta */
  const oy=conTesto?H*0.355:H*0.40, oh=conTesto?H*0.118:H*0.145, gap=conTesto?H*0.028:H*0.038;
  d.o.forEach((t,i)=>{
    if(f<=i) return;
    const y=oy+i*(oh+gap), giusta=ris&&i===d.g, rr=18*S;
    x.beginPath();
    if(x.roundRect) x.roundRect(M,y,L-2*M,oh,rr);
    else { x.moveTo(M+rr,y); x.arcTo(L-M,y,L-M,y+oh,rr); x.arcTo(L-M,y+oh,M,y+oh,rr); x.arcTo(M,y+oh,M,y,rr); x.arcTo(M,y,L-M,y,rr); x.closePath(); }
    x.fillStyle = giusta?'rgba(31,164,99,.34)':'rgba(255,255,255,.05)'; x.fill();
    x.lineWidth=3*S; x.strokeStyle = giusta?'#27c47a':'rgba(255,255,255,.18)'; x.stroke();
    x.textAlign='center'; x.font=`700 ${Math.round(48*S)}px Optima, "Avenir Next", sans-serif`;
    x.fillStyle = giusta?'#27c47a':'#e0b25c';
    x.fillText('abc'[i], M+56*S, y+oh/2);
    x.textAlign='left'; x.fillStyle='#fff';
    let f2=Math.round(44*S);
    const FO=n=>`${giusta?'700':'500'} ${n}px "SF Pro Display","Avenir Next",-apple-system,Helvetica,Arial,sans-serif`;
    x.font=FO(f2);
    const maxT=L-2*M-140*S;
    let rt=avvolgi(x,t,maxT);
    while(rt.length>2 && f2>22){ f2-=2; x.font=FO(f2); rt=avvolgi(x,t,maxT); }
    const th=f2*1.2, ty=y+oh/2-(rt.length-1)*th/2;
    rt.forEach((r,k)=>x.fillText(r,M+118*S,ty+k*th));
  });
  /* il testo del versetto compare solo con la risposta */
  if(conTesto){
    x.textAlign='center'; x.fillStyle='#f0f2f8';
    let ft=Math.round(34*S); x.font=`italic ${ft}px Georgia, serif`;
    let rt=avvolgi(x,'“'+d.txt+'”',L-2*M-160*S);
    while(rt.length>3 && ft>18){ ft-=2; x.font=`italic ${ft}px Georgia, serif`; rt=avvolgi(x,'“'+d.txt+'”',L-2*M-160*S); }
    const ty=H*0.855-(rt.length-1)*ft*0.65;
    rt.forEach((r,k)=>x.fillText(r,L/2,ty+k*ft*1.3));
  }
  if(d.v){ x.textAlign='right'; x.font=`600 ${Math.round(34*S)}px Optima, "Avenir Next", sans-serif`;
    x.fillStyle='#e0b25c'; x.fillText(d.v,L-M,H-H*0.055); }
  return c;
}
function espPdf(){
  const s=scelte(); if(!s) return;
  salvaFile(nomeFile('pdf'),'application/pdf',async()=>{
      const L=1600,H=900, imgs=[];
      const fasi = stato.imp.pdfFasi ? [0,1,2,3,4] : [3,4];
      s.forEach((d,k)=>{
        const dd={d:d.d,o:d.o,g:d.g,v:d.v,txt:testoVers(d.v),libro:nomeLibro(d.L,d.lg)};
        fasi.forEach(f=>imgs.push(telaDomanda(dd,f,k+1,s.length,L,H).toDataURL('image/jpeg',0.86)));
      });
      avvisa(`PDF pronto — ${imgs.length} pagine`,'ok');
      return pdfDaImmagini(imgs,L,H);
  });
}
function espTesto(){
  const s=scelte(); if(!s) return;
  const t=s.map((d,k)=>`${k+1}. ${d.d}\n   a) ${d.o[0]}\n   b) ${d.o[1]}\n   c) ${d.o[2]}\n   ✔ ${'abc'[d.g]}) ${d.o[d.g]}${d.v?'\n   📖 '+d.v:''}`).join('\n\n');
  const testa=`DOMANDE BIBLICHE — ${FD.ambito==='libro'?nomeLibro(FD.libro,FD.lg):'tutta la Bibbia'}\n${s.length} domande\n\n`;
  scarica(_te.encode(testa+t),nomeFile('txt'),'text/plain;charset=utf-8');
  avvisa('Testo salvato','ok');
}
function espFile(){
  const s=scelte(); if(!s) return;
  const dati={ programma:'SDARM — Domande bibliche', versione:VER, quando:new Date().toISOString(),
    domande:s.map(d=>({d:d.d,o:d.o,g:d.g,libro:nomeLibro(d.L,d.lg),v:d.v,lg:d.lg,
                       testo:testoVers(d.v)||undefined})) };
  scarica(_te.encode(JSON.stringify(dati,null,1)),nomeFile('json'),'application/json');
  avvisa('File del quiz salvato — si può ricaricare da ☁️ Dati','ok');
}

/* ---------- PDF del quiz con le risposte in fondo ---------- */
function espPdfRisposte(){
  const s=scelte(); if(!s) return;
  salvaFile(nomeFile('pdf').replace('.pdf',' — con risposte.pdf'),'application/pdf',async()=>{
      const L=1240,H=1754, M=110, LARG=L-2*M;
      const pag=[]; let c,x,y;
      const nuova=(tit)=>{ c=document.createElement('canvas'); c.width=L; c.height=H;
        x=c.getContext('2d'); x.fillStyle='#fff'; x.fillRect(0,0,L,H); x.textBaseline='top'; y=M; pag.push(c);
        if(tit){ x.fillStyle='#c8102e'; x.fillRect(M,y,LARG,5); y+=24;
          x.font='600 38px Georgia, serif'; x.fillStyle='#111'; x.fillText(tit,M,y); y+=54;
          x.fillStyle='#ddd'; x.fillRect(M,y,LARG,1); y+=26; } };
      const spazio=n=>{ if(y+n>H-M-40) nuova(); };
      const ambito = FD.ambito==='libro'?nomeLibro(FD.libro,FD.lg)
        :(FD.ambito==='at'?'Antico Testamento':FD.ambito==='nt'?'Nuovo Testamento':'Tutta la Bibbia');
      nuova(`Domande bibliche — ${ambito}`);
      /* le domande, senza risposta segnata */
      s.forEach((d,k)=>{
        spazio(230);
        x.font='700 27px -apple-system, Helvetica, Arial, sans-serif'; x.fillStyle='#c8102e';
        x.fillText((k+1)+'.',M,y);
        x.font='600 27px -apple-system, Helvetica, Arial, sans-serif'; x.fillStyle='#111';
        avvolgi(x,d.d,LARG-56).forEach(r=>{ x.fillText(r,M+56,y); y+=38; });
        y+=8;
        d.o.forEach((o,i)=>{
          x.font='700 25px Georgia, serif'; x.fillStyle='#8a6a20'; x.fillText('abc'[i]+')',M+56,y);
          x.font='25px -apple-system, Helvetica, Arial, sans-serif'; x.fillStyle='#222';
          avvolgi(x,o,LARG-120).forEach(r=>{ x.fillText(r,M+114,y); y+=35; });
        });
        if(d.v){ x.font='italic 21px Georgia, serif'; x.fillStyle='#999';
          x.fillText(d.v,M+56,y); y+=30; }
        y+=18;
      });
      /* le risposte, su pagina nuova */
      nuova('Risposte');
      x.font='22px -apple-system, Helvetica, Arial, sans-serif';
      let col=0; const colL=(LARG-40)/2; const yInizio=y;
      s.forEach((d,k)=>{
        if(y+40>H-M-40){ if(col===0){ col=1; y=yInizio; } else { nuova('Risposte (segue)'); col=0; } }
        const px=M+col*(colL+40);
        x.font='700 22px Georgia, serif'; x.fillStyle='#c8102e'; x.fillText((k+1)+'.',px,y);
        x.font='700 22px -apple-system, Helvetica, Arial, sans-serif'; x.fillStyle='#1a7a4a';
        x.fillText('abc'[d.g]+')',px+46,y);
        x.font='22px -apple-system, Helvetica, Arial, sans-serif'; x.fillStyle='#111';
        const r=avvolgi(x,d.o[d.g],colL-110);
        r.forEach((q,j)=>x.fillText(q,px+96,y+j*30));
        y+=Math.max(34,r.length*30+4);
      });
      /* piede */
      pag.forEach((pg,k)=>{ const q=pg.getContext('2d');
        q.font='17px -apple-system, Helvetica, Arial, sans-serif'; q.fillStyle='#999'; q.textBaseline='alphabetic';
        q.fillText(stato.imp.chiesa||'',M,H-52);
        q.textAlign='right'; q.fillText(`${k+1} / ${pag.length}`,L-M,H-52); q.textAlign='left'; });
      avvisa(`PDF pronto — ${pag.length} pagine, risposte in fondo`,'ok');
      return pdfDaImmagini(pag.map(p=>p.toDataURL('image/jpeg',0.92)),L,H);
  });
}
