/* ================= PDF DELLA PREDICA ================= */
function pdfPredica(i){
  const p=trovaPredica(i); if(!p) return;
  apri('Salva la predica in PDF',
    `<p class="sotto" style="margin-top:0">Come lo vuoi?</p>
     <div class="griglia g2">
       <div class="tess" onclick="chiudi();pdfPredicaSlide('${i}')">
         <span class="ti">🖥</span><b>Diapositive 16:9</b><span>Le stesse schermate della proiezione, una per pagina. Per chi guarda.</span></div>
       <div class="tess" onclick="chiudi();pdfPredicaFoglio('${i}')">
         <span class="ti">📄</span><b>Foglio A4 da leggere</b><span>Il testo impaginato con caratteri grandi. Per chi predica.</span></div>
     </div>`,`<button class="bt pi" onclick="chiudi()">Annulla</button>`,560);
}
/* --- 16:9, come la proiezione --- */
function telaSlidePredica(s,tema,L,H){
  const c=document.createElement('canvas'); c.width=L; c.height=H;
  const x=c.getContext('2d'), S=L/1600, M=L*0.09;
  const fondi={notte:['#1b2a52','#04060f'],alba:['#7a3b52','#2b1a18'],luce:['#8a7a5c','#0a0a12'],
    croce:['#2c3350','#05060d'],acqua:['#0d3b57','#041420'],deserto:['#6b4a35','#3a2415'],
    fuoco:['#b32d10','#0a0403'],cielo:['#3f74a8','#0e1c2c'],oro:['#4a3a18','#080602'],
    pietra:['#2c2d31','#0c0d10'],grano:['#9a7a3c','#241a08'],sobrio:['#191c26','#05060a']};
  const [a,b]=fondi[tema]||fondi.notte;
  const g=x.createRadialGradient(L/2,H*0.28,0,L/2,H*0.55,L*0.82);
  g.addColorStop(0,a); g.addColorStop(1,b); x.fillStyle=g; x.fillRect(0,0,L,H);
  x.textAlign='center'; x.textBaseline='middle';
  const scrivi=(t,fs,font,col,y,maxR)=>{
    x.font=font.replace('%s',fs); x.fillStyle=col;
    let r=avvolgi(x,t,L-2*M), f=fs;
    while(r.length>(maxR||6)&&f>18){ f-=2; x.font=font.replace('%s',f); r=avvolgi(x,t,L-2*M); }
    const h=f*1.35, y0=y-(r.length-1)*h/2;
    r.forEach((q,k)=>x.fillText(q,L/2,y0+k*h));
    return r.length*h;
  };
  const F=n=>`600 ${n}px -apple-system, Helvetica, Arial, sans-serif`.replace(n,'%s');
  const SER=`%spx Georgia, serif`, SERI=`italic %spx Georgia, serif`;
  if(s.t==='p-tit'){
    if(s.occ){ x.font=`600 ${22*S}px -apple-system, Helvetica, sans-serif`; x.fillStyle='rgba(255,255,255,.6)';
      x.fillText(String(s.occ).toUpperCase(),L/2,H*0.34); }
    scrivi(s.tit,Math.round(78*S),`%spx Georgia, serif`,'#fff',H*0.5,4);
    if(s.rif){ x.font=`${30*S}px Georgia, serif`; x.fillStyle='#e0b25c'; x.fillText(s.rif,L/2,H*0.70); }
  } else if(s.t==='p-cit'){
    scrivi('“'+s.testo+'”',Math.round(50*S),SERI,'#fff',H*0.47,6);
    if(s.rif){ x.font=`${30*S}px Georgia, serif`; x.fillStyle='#e0b25c'; x.fillText(s.rif,L/2,H*0.80); }
  } else if(s.t==='p-punti'){
    if(s.tit){ x.font=`600 ${22*S}px -apple-system, Helvetica, sans-serif`; x.fillStyle='rgba(255,255,255,.6)';
      x.fillText(String(s.tit).toUpperCase(),L/2,H*0.17); }
    x.textAlign='left';
    const fs=Math.round(44*S); x.font=`${fs}px -apple-system, Helvetica, Arial, sans-serif`;
    let y=H*0.34;
    s.punti.forEach((t,k)=>{
      x.fillStyle='#e0b25c'; x.font=`700 ${fs}px Georgia, serif`; x.fillText((k+1)+'.',M,y);
      x.fillStyle='#fff'; x.font=`${fs}px -apple-system, Helvetica, Arial, sans-serif`;
      const r=avvolgi(x,t,L-2*M-90*S);
      r.forEach((q,j)=>x.fillText(q,M+90*S,y+j*fs*1.3));
      y+=r.length*fs*1.3+fs*0.7;
    });
  } else if(s.t==='versetto'){
    x.font=`${34*S}px Georgia, serif`; x.fillStyle='#e0b25c'; x.fillText(s.rif,L/2,H*0.30);
    scrivi(s.txt||'',Math.round(48*S),SER,'#fff',H*0.55,7);
  } else if(s.t==='cantico-tit'){
    if(s.num){ x.font=`${110*S}px Georgia, serif`; x.fillStyle='#e0b25c'; x.fillText(s.num,L/2,H*0.36); }
    scrivi(s.tit,Math.round(70*S),SER,'#fff',H*0.60,3);
  } else if(s.t==='cantico-str'){
    if(s.eti){ x.textAlign='left'; x.font=`600 ${20*S}px -apple-system, Helvetica, sans-serif`;
      x.fillStyle='rgba(255,255,255,.45)'; x.fillText(String(s.eti).toUpperCase(),M,H*0.09); x.textAlign='center'; }
    scrivi(s.testo,Math.round(48*S),s.rit?SERI:`%spx -apple-system, Helvetica, Arial, sans-serif`,
      s.rit?'#ffe9b0':'#fff',H*0.5,9);
  } else {
    scrivi(s.testo||'',Math.round(46*S),`%spx -apple-system, Helvetica, Arial, sans-serif`,'#fff',H*0.5,8);
  }
  return c;
}
function pdfPredicaSlide(i){
  const p=trovaPredica(i); if(!p) return;
  salvaFile(`${p.tit} — diapositive.pdf`,'application/pdf',async()=>{
      const L=1600,H=900;
      const imgs=slidePredica(p).map(s=>telaSlidePredica(s,p.sfondo||'notte',L,H).toDataURL('image/jpeg',0.85));
      avvisa(`PDF pronto — ${imgs.length} diapositive`,'ok');
      return pdfDaImmagini(imgs,L,H);
  });
}
/* --- A4 da leggere --- */
function pdfPredicaFoglio(i){
  const p=trovaPredica(i); if(!p) return;
  salvaFile(`${p.tit}.pdf`,'application/pdf',async()=>{
      const L=1240,H=1754, M=110, LARG=L-2*M;
      const pagine=[]; let c,x,y;
      const nuova=()=>{ c=document.createElement('canvas'); c.width=L; c.height=H;
        x=c.getContext('2d'); x.fillStyle='#fff'; x.fillRect(0,0,L,H); x.textBaseline='top'; y=M; pagine.push(c); };
      const spazio=n=>{ if(y+n>H-M-40) nuova(); };
      nuova();
      /* testata */
      x.fillStyle='#c8102e'; x.fillRect(M,y,LARG,5); y+=26;
      if(p.tema){ x.font='600 20px -apple-system, Helvetica, Arial, sans-serif'; x.fillStyle='#c8102e';
        x.fillText(p.tema.toUpperCase(),M,y); y+=32; }
      x.font='600 46px Georgia, serif'; x.fillStyle='#111';
      avvolgi(x,p.tit,LARG).forEach(r=>{ x.fillText(r,M,y); y+=56; });
      if(p.rif){ x.font='italic 26px Georgia, serif'; x.fillStyle='#8a6a20'; x.fillText(p.rif,M,y+6); y+=44; }
      y+=14; x.fillStyle='#ddd'; x.fillRect(M,y,LARG,1); y+=30;
      (p.blocchi||[]).forEach(b=>{
        if(b.t==='titolo'){ spazio(120); y+=14;
          x.font='600 32px Georgia, serif'; x.fillStyle='#8a1224';
          avvolgi(x,b.testo,LARG).forEach(r=>{ x.fillText(r,M,y); y+=42; }); y+=10; }
        else if(b.t==='cit'){ spazio(150);
          x.font='italic 27px Georgia, serif'; x.fillStyle='#222';
          const r=avvolgi(x,'“'+b.testo+'”',LARG-40);
          const h=r.length*38+(b.rif?32:0)+12;
          x.fillStyle='#c8102e'; x.fillRect(M,y,4,h); x.fillStyle='#222';
          r.forEach(q=>{ x.fillText(q,M+24,y); y+=38; });
          if(b.rif){ x.font='22px Georgia, serif'; x.fillStyle='#8a6a20'; x.fillText(b.rif,M+24,y+4); y+=32; }
          y+=16; }
        else if(b.t==='punti'){ b.punti.forEach((t,k)=>{ spazio(80);
          x.font='700 27px Georgia, serif'; x.fillStyle='#c8102e'; x.fillText((k+1)+'.',M,y);
          x.font='27px -apple-system, Helvetica, Arial, sans-serif'; x.fillStyle='#111';
          avvolgi(x,t,LARG-56).forEach(q=>{ x.fillText(q,M+56,y); y+=40; }); y+=8; }); y+=10; }
        else { x.font='27px -apple-system, Helvetica, Arial, sans-serif'; x.fillStyle='#111';
          avvolgi(x,b.testo,LARG).forEach(r=>{ spazio(50); x.fillText(r,M,y); y+=42; }); y+=18; }
      });
      /* piede su ogni pagina */
      pagine.forEach((pg,k)=>{ const q=pg.getContext('2d');
        q.font='18px -apple-system, Helvetica, Arial, sans-serif'; q.fillStyle='#999'; q.textBaseline='alphabetic';
        q.fillText(stato.imp.chiesa||'',M,H-52);
        q.textAlign='right'; q.fillText(`${k+1} / ${pagine.length}`,L-M,H-52); q.textAlign='left'; });
      avvisa(`PDF pronto — ${pagine.length} pagine`,'ok');
      return pdfDaImmagini(pagine.map(pg=>pg.toDataURL('image/jpeg',0.92)),L,H);
  });
}
