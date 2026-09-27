/* ======================= 🏛️ IL TEMPIO IN 3D =======================
   Il Tempio della conoscenza non è più un disegno simbolico: è il Tempio di Salomone in tre
   dimensioni, con le misure della Bibbia (1 Re 6-7; 2 Cronache 3-4), in cubiti:
   la casa lunga 60, larga 20, alta 30 (il Luogo Santissimo un cubo di 20); il portico largo 20 e
   profondo 10; le camere laterali su tre piani attorno; le due colonne di bronzo Jachin e Boaz
   (18 cubiti, capitelli di 5, con i melograni); dentro, cedro coperto d'oro, dieci candelabri,
   dieci tavole, l'altare dei profumi, il velo, i due cherubini di 10 cubiti con le ali che si
   toccano, l'arca; fuori l'altare di bronzo (20×20×10), il mare di bronzo sui dodici buoi, le dieci
   basi con le conche, il cortile interno con tre ordini di pietre e uno di travi di cedro.
   Ogni fase superata costruisce la sua parte (le fasi sono le stesse otto di prima), che sale dal
   basso. Si gira con un dito, si avvicina con due dita (o con la rotella); «Dentro» toglie il tetto.
   Il motore è scritto qui (WebGL, niente da scaricare, funziona anche senza Internet): luce del
   sole con le ombre, cielo, nebbia, materiali disegnati dal programma (pietra, cedro, oro, bronzo…).
   Se il dispositivo non ha WebGL resta il disegno di prima (tplSvg). */
const T3D={ ok:null, canvas:null, gl:null, gruppi:[], fatte:-1, oro:false, anima:null, dentro:false,
  cam:{yaw:0.62, pitch:0.36, dist:200, tgt:[8,11,0]}, gira:true, fermo:0, punti:{}, raf:0, ultimo:0, box:null };

/* ---------- piccola matematica ---------- */
const _v={ sub:(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]], add:(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]],
  cross:(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]], dot:(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],
  norm:a=>{ const l=Math.hypot(a[0],a[1],a[2])||1; return [a[0]/l,a[1]/l,a[2]/l]; }, scala:(a,k)=>[a[0]*k,a[1]*k,a[2]*k] };
const _m4={
  per(f,a,n,l){ const t=1/Math.tan(f/2); return [t/a,0,0,0, 0,t,0,0, 0,0,(l+n)/(n-l),-1, 0,0,2*l*n/(n-l),0]; },
  orto(l,r,b,t,n,f){ return [2/(r-l),0,0,0, 0,2/(t-b),0,0, 0,0,-2/(f-n),0, -(r+l)/(r-l),-(t+b)/(t-b),-(f+n)/(f-n),1]; },
  guarda(e,c,u){ const z=_v.norm(_v.sub(e,c)), x=_v.norm(_v.cross(u,z)), y=_v.cross(z,x);
    return [x[0],y[0],z[0],0, x[1],y[1],z[1],0, x[2],y[2],z[2],0, -_v.dot(x,e),-_v.dot(y,e),-_v.dot(z,e),1]; },
  mul(a,b){ const r=new Array(16); for(let c=0;c<4;c++) for(let w=0;w<4;w++){ let s=0; for(let k=0;k<4;k++) s+=a[k*4+w]*b[c*4+k]; r[c*4+w]=s; } return r; }
};

/* ---------- i materiali (colore disegnato + come riflettono la luce) ---------- */
const T3D_MAT={
  pietra:{tex:'pietra',size:12,spec:.07,shin:14}, pietraGr:{tex:'pietraGr',size:24,spec:.06,shin:12},
  pav:{tex:'pav',size:16,spec:.12,shin:24}, legno:{tex:'cedro',size:6,spec:.14,shin:22},
  oro:{tex:'oro',size:8,spec:1.3,shin:70,metal:.72}, oroInciso:{tex:'oroInciso',size:10,spec:1.1,shin:55,metal:.6},
  bronzo:{tex:'bronzo',size:6,spec:.9,shin:42,metal:.55}, terra:{tex:'terra',size:40,spec:0,shin:8},
  colle:{tex:'terra',size:90,spec:0,shin:8,col:[.86,.9,.8]}, velo:{tex:'velo',size:20,spec:.05,shin:10},
  acqua:{tex:'acqua',size:10,spec:1.6,shin:90,metal:.35}, foglia:{tex:'foglia',size:4,spec:.05,shin:8},
  tronco:{tex:'cedro',size:4,spec:.02,shin:8,col:[.55,.48,.42]}, scuro:{tex:'bianco',col:[.06,.05,.05],spec:.1,shin:10},
  fuoco:{tex:'bianco',col:[1,.55,.16],emis:1.7}, brace:{tex:'bianco',col:[.9,.25,.05],emis:1.2},
  pane:{tex:'bianco',col:[.86,.7,.45],spec:.05,shin:8}, luce:{tex:'bianco',col:[1,.9,.6],emis:1.4},
  nube:{tex:'bianco',col:[1,.98,.92],emis:.9,alpha:.55}, fumo:{tex:'bianco',col:[.55,.55,.55],emis:.25,alpha:.28},
  raggio:{tex:'bianco',col:[1,.85,.45],emis:1.3,alpha:.4}, corda:{tex:'bianco',col:[.8,.7,.5],spec:0,shin:4},
  cielo:{cielo:true}
};

/* ---------- le immagini dei materiali, disegnate dal programma ---------- */
function _t3dRnd(seme){ let s=seme>>>0||1; return ()=>((s=Math.imul(s^(s>>>15),2246822519)^Math.imul(s^(s>>>13),3266489917)^(s+=0x6D2B79F5))>>>0)/4294967296; }
function _t3dTela(n){ const c=document.createElement('canvas'); c.width=c.height=n||512; return c; }
function _t3dGrana(x,r,n,alfa,col){ for(let i=0;i<n;i++){ x.fillStyle=col?col(r()):`rgba(${r()<.5?0:255},${r()<.5?0:255},${r()<.5?0:255},${alfa*r()})`; x.fillRect(r()*512,r()*512,1+r()*2,1+r()*2); } }
function _t3dBlocchi(c,alto,minL,maxL,base,giunto,seme){
  const x=c.getContext('2d'), r=_t3dRnd(seme);
  x.fillStyle=base; x.fillRect(0,0,512,512);
  for(let y=0;y<512;y+=alto){
    let px=-Math.floor(r()*maxL);
    while(px<512){
      const w=minL+Math.floor(r()*(maxL-minL)), t=(r()-.5)*22;
      x.fillStyle=`hsl(40,${24+t*.4}%,${80+t*.35}%)`;
      x.globalAlpha=.55; x.fillRect(px,y,w,alto); x.globalAlpha=1;
      /* la faccia della pietra: un po' più chiara in alto, scura in basso */
      const g=x.createLinearGradient(0,y,0,y+alto); g.addColorStop(0,'rgba(255,255,255,.18)'); g.addColorStop(1,'rgba(60,40,10,.14)');
      x.fillStyle=g; x.fillRect(px,y,w,alto);
      x.fillStyle=giunto; x.fillRect(px,y,w,3); x.fillRect(px,y,3,alto);
      px+=w;
    }
  }
  _t3dGrana(x,r,26000,.09);
  for(let i=0;i<260;i++){ x.fillStyle=`rgba(90,70,40,${.05+r()*.08})`; x.beginPath(); x.arc(r()*512,r()*512,1+r()*5,0,7); x.fill(); }
  return c;
}
function _t3dTexture(nome){
  const c=_t3dTela(), x=c.getContext('2d');
  if(nome==='pietra') return _t3dBlocchi(c,64,120,230,'#dccfb3','rgba(110,95,70,.75)',11);
  if(nome==='pietraGr') return _t3dBlocchi(c,128,210,330,'#e4d8bd','rgba(115,100,72,.7)',23);
  if(nome==='bianco'){ x.fillStyle='#fff'; x.fillRect(0,0,512,512); return c; }
  const r=_t3dRnd(nome.length*977+nome.charCodeAt(0));
  if(nome==='pav'){
    x.fillStyle='#cfc1a2'; x.fillRect(0,0,512,512);
    for(let i=0;i<4;i++) for(let j=0;j<4;j++){ const t=(r()-.5)*18; x.fillStyle=`hsl(38,${22+t*.3}%,${74+t*.4}%)`; x.fillRect(i*128+3,j*128+3,122,122); }
    _t3dGrana(x,r,30000,.1);
    x.fillStyle='rgba(95,80,60,.6)'; for(let i=0;i<=4;i++){ x.fillRect(i*128-2,0,4,512); x.fillRect(0,i*128-2,512,4); }
    return c;
  }
  if(nome==='cedro'){
    x.fillStyle='#8b5a36'; x.fillRect(0,0,512,512);
    for(let p=0;p<8;p++){ const t=(r()-.5)*16; x.fillStyle=`hsl(24,${45+t}%,${34+t*.5}%)`; x.fillRect(0,p*64,512,64); }
    for(let i=0;i<260;i++){ const y=r()*512, a=r()*8, f=.01+r()*.02; x.strokeStyle=`rgba(${r()<.5?40:150},${r()<.5?20:90},10,${.12+r()*.18})`;
      x.lineWidth=.6+r()*1.4; x.beginPath(); for(let px=0;px<=512;px+=16) x.lineTo(px,y+Math.sin(px*f+a)*3); x.stroke(); }
    x.fillStyle='rgba(30,15,5,.55)'; for(let p=0;p<=8;p++) x.fillRect(0,p*64-1,512,2);
    return c;
  }
  if(nome==='oro'||nome==='oroInciso'){
    const g=x.createLinearGradient(0,0,512,512); g.addColorStop(0,'#f4d27a'); g.addColorStop(.5,'#d9a93d'); g.addColorStop(1,'#f0c865');
    x.fillStyle=g; x.fillRect(0,0,512,512);
    _t3dGrana(x,r,20000,.08,v=>`rgba(${v<.5?120:255},${v<.5?80:230},${v<.5?10:150},${.06+v*.1})`);
    if(nome==='oroInciso'){
      /* intagli di palme, cherubini e fiori aperti (1 Re 6:29) */
      const linea=(w,col)=>{ x.lineWidth=w; x.strokeStyle=col; x.lineCap='round'; };
      const palma=(cx,cy)=>{ linea(6,'rgba(120,80,15,.55)'); x.beginPath(); x.moveTo(cx,cy+110); x.quadraticCurveTo(cx+6,cy+40,cx,cy-20); x.stroke();
        for(let k=0;k<7;k++){ const a=-Math.PI/2+(k-3)*.42; x.beginPath(); x.moveTo(cx,cy-20);
          x.quadraticCurveTo(cx+Math.cos(a)*40,cy-20+Math.sin(a)*40-10,cx+Math.cos(a)*70,cy-20+Math.sin(a)*70+18); x.stroke(); } };
      const cherubino=(cx,cy)=>{ linea(5,'rgba(120,80,15,.55)'); x.beginPath(); x.arc(cx,cy-40,13,0,7); x.stroke();
        x.beginPath(); x.moveTo(cx,cy-27); x.lineTo(cx,cy+60); x.stroke();
        for(const s of [-1,1]){ x.beginPath(); x.moveTo(cx,cy-18); x.quadraticCurveTo(cx+s*50,cy-80,cx+s*95,cy-30); x.quadraticCurveTo(cx+s*60,cy-20,cx,cy+5); x.stroke(); } };
      const fiore=(cx,cy)=>{ linea(4,'rgba(120,80,15,.5)'); for(let k=0;k<8;k++){ const a=k*Math.PI/4; x.beginPath(); x.ellipse(cx+Math.cos(a)*14,cy+Math.sin(a)*14,12,6,a,0,7); x.stroke(); } };
      palma(128,150); cherubino(384,150); fiore(128,400); fiore(384,400); palma(384,370); cherubino(128,380);
      x.globalCompositeOperation='overlay'; x.fillStyle='rgba(255,240,190,.25)'; x.fillRect(0,0,512,512); x.globalCompositeOperation='source-over';
    }
    return c;
  }
  if(nome==='bronzo'){
    x.fillStyle='#8a5c33'; x.fillRect(0,0,512,512);
    for(let i=0;i<900;i++){ x.fillStyle=r()<.25?`rgba(70,110,85,${.05+r()*.12})`:`rgba(${150+r()*60},${95+r()*40},${40+r()*30},${.06+r()*.12})`;
      x.beginPath(); x.arc(r()*512,r()*512,2+r()*16,0,7); x.fill(); }
    _t3dGrana(x,r,20000,.07);
    return c;
  }
  if(nome==='terra'){
    x.fillStyle='#b9a07a'; x.fillRect(0,0,512,512);
    for(let i=0;i<1400;i++){ const v=r(); x.fillStyle=v<.3?`rgba(110,125,70,${.08+r()*.14})`:`rgba(${120+r()*80},${100+r()*60},${60+r()*40},${.06+r()*.1})`;
      x.beginPath(); x.arc(r()*512,r()*512,2+r()*14,0,7); x.fill(); }
    _t3dGrana(x,r,40000,.12);
    return c;
  }
  if(nome==='velo'){
    const col=['#23377f','#5e2a73','#9c1a2f','#23377f','#5e2a73','#9c1a2f'];
    for(let i=0;i<6;i++){ x.fillStyle=col[i]; x.fillRect(i*86,0,86,512); }
    for(let y=0;y<512;y+=3){ x.fillStyle='rgba(255,255,255,.05)'; x.fillRect(0,y,512,1); }
    for(let px=0;px<512;px+=3){ x.fillStyle='rgba(0,0,0,.06)'; x.fillRect(px,0,1,512); }
    x.strokeStyle='rgba(230,190,90,.45)'; x.lineWidth=3;
    for(const [cx,cy] of [[128,180],[384,180],[256,390]]){ x.beginPath(); x.arc(cx,cy-40,12,0,7); x.stroke();
      for(const s of [-1,1]){ x.beginPath(); x.moveTo(cx,cy-20); x.quadraticCurveTo(cx+s*50,cy-80,cx+s*90,cy-20); x.stroke(); } }
    return c;
  }
  if(nome==='acqua'){
    const g=x.createRadialGradient(256,256,20,256,256,360); g.addColorStop(0,'#5d9cbc'); g.addColorStop(1,'#2b5e7c'); x.fillStyle=g; x.fillRect(0,0,512,512);
    for(let i=0;i<500;i++){ x.strokeStyle=`rgba(255,255,255,${.04+r()*.08})`; x.lineWidth=1+r()*2; const y=r()*512, px=r()*512; x.beginPath(); x.moveTo(px,y); x.quadraticCurveTo(px+15,y-4,px+30,y); x.stroke(); }
    return c;
  }
  if(nome==='foglia'){
    x.fillStyle='#4a5b30'; x.fillRect(0,0,512,512);
    for(let i=0;i<2600;i++){ x.fillStyle=r()<.5?`rgba(150,170,110,${.1+r()*.2})`:`rgba(20,35,10,${.1+r()*.25})`; x.beginPath(); x.ellipse(r()*512,r()*512,2+r()*6,1+r()*2,r()*3,0,7); x.fill(); }
    return c;
  }
  x.fillStyle='#fff'; x.fillRect(0,0,512,512); return c;
}

/* ---------- le forme: tutto è fatto di quadrilateri, cilindri e forme «al tornio» ---------- */
let _t3dCorr=null;       /* il gruppo (fase, materiale, etichetta) dove sto costruendo */
function _t3dGr(fase,mat,tag){
  const k=fase+'|'+mat+'|'+(tag||'');
  let g=T3D.gruppi.find(x=>x.k===k);
  if(!g){ g={k,fase,mat,tag:tag||'',v:[]}; T3D.gruppi.push(g); }
  return g;
}
let _t3dFase=0, _t3dTag='';
function _t3dPush(mat,p,n,u,v){ _t3dGr(_t3dFase,mat,_t3dTag).v.push(p[0],p[1],p[2],n[0],n[1],n[2],u,v); }
function _t3dUv(p,n,mat){
  const s=(T3D_MAT[mat]&&T3D_MAT[mat].size)||8, ax=Math.abs(n[0]), ay=Math.abs(n[1]), az=Math.abs(n[2]);
  if(ay>=ax&&ay>=az) return [p[0]/s,p[2]/s];
  if(ax>=az) return [p[2]/s,-p[1]/s];
  return [p[0]/s,-p[1]/s];
}
function _t3dQuad(a,b,c,d,mat){
  const n=_v.norm(_v.cross(_v.sub(b,a),_v.sub(d,a)));
  for(const p of [a,b,c,a,c,d]){ const uv=_t3dUv(p,n,mat); _t3dPush(mat,p,n,uv[0],uv[1]); }
}
function _t3dTri(a,b,c,mat){
  const n=_v.norm(_v.cross(_v.sub(b,a),_v.sub(c,a)));
  for(const p of [a,b,c]){ const uv=_t3dUv(p,n,mat); _t3dPush(mat,p,n,uv[0],uv[1]); }
}
/* trasformazione: rotazione attorno all'asse verticale (ry, radianti) e spostamento */
function _t3dTr(p,tr){
  if(!tr) return p;
  let [x,y,z]=p;
  if(tr.rx){ const c=Math.cos(tr.rx), s=Math.sin(tr.rx); [y,z]=[y*c-z*s,y*s+z*c]; }
  if(tr.rz){ const c=Math.cos(tr.rz), s=Math.sin(tr.rz); [x,y]=[x*c-y*s,x*s+y*c]; }
  if(tr.ry){ const c=Math.cos(tr.ry), s=Math.sin(tr.ry); [x,z]=[x*c+z*s,-x*s+z*c]; }
  return [x+(tr.x||0),y+(tr.y||0),z+(tr.z||0)];
}
function _t3dBox(x0,y0,z0,x1,y1,z1,mat,tr){
  const P=(x,y,z)=>_t3dTr([x,y,z],tr);
  const q=(a,b,c,d)=>_t3dQuad(P(...a),P(...b),P(...c),P(...d),mat);
  q([x1,y0,z0],[x1,y1,z0],[x1,y1,z1],[x1,y0,z1]); q([x0,y0,z0],[x0,y0,z1],[x0,y1,z1],[x0,y1,z0]);
  q([x0,y1,z0],[x0,y1,z1],[x1,y1,z1],[x1,y1,z0]); q([x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1]);
  q([x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]); q([x0,y0,z0],[x0,y1,z0],[x1,y1,z0],[x1,y0,z0]);
}
/* forma al tornio attorno all'asse verticale: prof = [[raggio, altezza], …] dal basso in alto */
function _t3dTornio(cx,cy,cz,prof,seg,mat,tr,chiudi){
  seg=seg||16;
  const s=(T3D_MAT[mat]&&T3D_MAT[mat].size)||8;
  const P=(r,y,a)=>_t3dTr([cx+Math.cos(a)*r,cy+y,cz+Math.sin(a)*r],tr);
  const nor=(i,a)=>{ const p0=prof[Math.max(0,i-1)], p1=prof[Math.min(prof.length-1,i+1)];
    const dr=p1[0]-p0[0], dy=p1[1]-p0[1]; const n=_v.norm([dy,-dr,0]); const v=[Math.cos(a)*n[0],n[1],Math.sin(a)*n[0]];
    return tr?_v.norm(_v.sub(_t3dTr(v,Object.assign({},tr,{x:0,y:0,z:0})),[0,0,0])):v; };
  for(let i=0;i<prof.length-1;i++) for(let k=0;k<seg;k++){
    const a0=k/seg*Math.PI*2, a1=(k+1)/seg*Math.PI*2;
    const pts=[[i,a0],[i+1,a0],[i+1,a1],[i,a1]];
    const vs=pts.map(([j,a])=>({p:P(prof[j][0],prof[j][1],a), n:nor(j,a), u:a*Math.max(.5,prof[j][0])/s, v:-(cy+prof[j][1])/s}));
    for(const w of [vs[0],vs[1],vs[2],vs[0],vs[2],vs[3]]) _t3dPush(mat,w.p,w.n,w.u,w.v);
  }
  if(chiudi){ const top=prof[prof.length-1], bot=prof[0];
    for(let k=0;k<seg;k++){ const a0=k/seg*Math.PI*2, a1=(k+1)/seg*Math.PI*2;
      if(top[0]>0) _t3dTri(P(0,top[1],0),P(top[0],top[1],a1),P(top[0],top[1],a0),mat);
      if(bot[0]>0) _t3dTri(P(0,bot[1],0),P(bot[0],bot[1],a0),P(bot[0],bot[1],a1),mat); } }
}
function _t3dCil(cx,cz,y0,y1,r0,r1,seg,mat,tr){ _t3dTornio(cx,y0,cz,[[r0,0],[r1,y1-y0]],seg,mat,tr,true); }
function _t3dSfera(cx,cy,cz,r,seg,mat,sy){
  const prof=[]; const n=Math.max(4,Math.round((seg||10)/2));
  for(let i=0;i<=n;i++){ const a=-Math.PI/2+i/n*Math.PI; prof.push([Math.max(.0001,Math.cos(a)*r),Math.sin(a)*r*(sy||1)]); }
  _t3dTornio(cx,cy,cz,prof,seg||10,mat);
}

/* ---------- il Tempio, fase per fase (x = est, z = sud, y = in alto; 1 = un cubito) ---------- */
const T3D_PIANO=7;       /* il pavimento della casa: il basamento è alto 6 più una fila di grandi pietre */
function _t3dAmbiente(){
  _t3dFase=-1; _t3dTag='';
  _t3dBox(-700,-2,-700,700,-.6,700,'terra');
  /* i colli attorno a Gerusalemme (a est il monte degli Ulivi) */
  [[420,0,-60,230,62],[-380,0,180,260,48],[60,0,-430,300,55],[-120,0,470,280,42],[300,0,380,200,50],[-460,0,-300,250,58]].forEach(([x,y,z,r,h])=>
    _t3dTornio(x,-1,z,[[r,0],[r*.82,h*.35],[r*.55,h*.75],[r*.25,h*.96],[0.1,h]],18,'colle'));
  /* ulivi e cipressi fuori dal cortile */
  const r=_t3dRnd(77);
  for(let i=0;i<46;i++){
    const a=r()*Math.PI*2, d=150+r()*170, x=20+Math.cos(a)*d*1.1, z=Math.sin(a)*d*.85;
    if(r()<.55){ _t3dCil(x,z,-1,3.2,.55,.4,6,'tronco'); _t3dSfera(x,5.3,z,3+r()*1.4,8,'foglia',.72); _t3dSfera(x+1.5,4.6,z+1,2.2,7,'foglia',.7); }
    else { _t3dCil(x,z,-1,1.5,.4,.35,6,'tronco'); _t3dTornio(x,1,z,[[1.9,0],[2,3],[1.5,8],[.7,12],[.05,14]],8,'foglia'); }
  }
}
/* il segno del cantiere: dove sorgerà il Tempio (prima delle fondamenta) */
function _t3dCantiere(){
  _t3dFase=-2; _t3dTag='';
  const pali=[[-46,-27],[52,-27],[52,27],[-46,27]];
  pali.forEach(([x,z])=>_t3dBox(x-.4,-.6,z-.4,x+.4,4,z+.4,'legno'));
  for(let i=0;i<4;i++){ const [a,b]=[pali[i],pali[(i+1)%4]];
    const x0=Math.min(a[0],b[0]), x1=Math.max(a[0],b[0]), z0=Math.min(a[1],b[1]), z1=Math.max(a[1],b[1]);
    _t3dBox(x0-.1,3.3,z0-.1,x1+.1,3.5,z1+.1,'corda'); }
  const r=_t3dRnd(5);
  for(let i=0;i<14;i++) _t3dBox(-30+r()*80-3,-.6,-40-r()*10-2,-30+r()*80+3,1.6+r()*1.2,-40-r()*10+2,'pietraGr');
}
function _t3dFasi(oro){
  const P=T3D_PIANO, ORO=oro?'oro':'pietra';
  /* 1 — FONDAMENTA: il basamento di grandi pietre, la scalinata, il lastricato del cortile */
  _t3dFase=0; _t3dTag='';
  _t3dBox(-70,-.6,-56,116,0,56,'pav');
  _t3dBox(-46,0,-27,52,6,27,'pietraGr');
  _t3dBox(-43,6,-23,46,P,23,'pietraGr');
  for(let s=0;s<6;s++) _t3dBox(52,0,-13,52+1.4*(s+1),6-s,13,'pietraGr');
  _t3dBox(46,6,-13,52,P,13,'pietraGr');
  /* 2 — COLONNE: Jachin e Boaz, di bronzo, davanti al portico (1 Re 7:15-22) */
  _t3dFase=1;
  for(const z of [-7,7]){
    _t3dCil(48.5,z,P,P+1,2.6,2.6,20,'bronzo');
    _t3dCil(48.5,z,P+1,P+18,1.95,1.9,24,'bronzo');
    _t3dTornio(48.5,P+18,z,[[1.95,0],[2.5,.8],[2.75,2],[2.6,3.4],[2.3,4.1],[2.9,4.6],[3.1,5]],24,'bronzo',null,true);
    for(const [h,rr] of [[1.2,2.72],[2.6,2.74]]) for(let k=0;k<20;k++){ const a=k/20*Math.PI*2;
      _t3dSfera(48.5+Math.cos(a)*rr,P+18+h,z+Math.sin(a)*rr,.34,6,'bronzo'); }
    /* i gigli in cima */
    for(let k=0;k<12;k++){ const a=k/12*Math.PI*2; _t3dBox(-.18,0,-.5,.18,1.3,.5,'bronzo',{ry:-a,x:48.5+Math.cos(a)*2.8,y:P+22.6,z:z+Math.sin(a)*2.8}); }
  }
  /* 3 — PARETI: la casa (60×20×30 dentro, muri di 5), le finestre alte, le camere laterali su tre piani */
  _t3dFase=2; _t3dTag='';
  const H=P+30;
  _t3dBox(-35,P,-15,-30,H,15,'pietra');
  _t3dBox(-35,P,-15,35,H,-10,'pietra');
  _t3dBox(-35,P,10,35,H,15,'pietra');
  _t3dBox(30,P,-15,35,H,-4.5,'pietra'); _t3dBox(30,P,4.5,35,H,15,'pietra'); _t3dBox(30,P+16,-4.5,35,H,4.5,'pietra');
  /* le finestre strette in alto, sopra alle camere laterali (1 Re 6:4) */
  for(let x=-26;x<=26;x+=8) for(const z of [-15.08,15.08]){ _t3dBox(x-1,P+21,z-.05,x+1,P+27,z+.05,'scuro'); _t3dBox(x-1.4,P+27,z-.2,x+1.4,P+27.8,z+.2,'pietra'); }
  /* le camere laterali: tre piani di 5 cubiti (1 Re 6:5-10) */
  const cam=(x0,z0,x1,z1)=>{ _t3dBox(x0,P,z0,x1,P+16,z1,'pietra');
    for(const y of [P+5,P+10]) _t3dBox(x0-.3,y,z0-.3,x1+.3,y+.5,z1+.3,'pietra');
    _t3dBox(x0-.5,P+16,z0-.5,x1+.5,P+16.8,z1+.5,'pietra'); };
  cam(-42,15,30,22); cam(-42,-22,30,-15); cam(-42,-15,-35,15);
  for(let x=-38;x<=26;x+=6) for(let piano=0;piano<3;piano++) for(const z of [22.05,-22.05]) _t3dBox(x-.6,P+2+piano*5,z-.04,x+.6,P+3.8+piano*5,z+.04,'scuro');
  /* 4 — INGRESSO: il portico (20×10), la facciata, le porte di cipresso coperte d'oro */
  _t3dFase=3;
  _t3dBox(35,P,-15,45,H+4,-10,'pietra'); _t3dBox(35,P,10,45,H+4,15,'pietra');
  _t3dBox(43,P+23,-10,45,H+4,10,'pietra');
  _t3dBox(44.6,P+22,-15.3,45.6,P+23,15.3,ORO==='oro'?'oro':'pietra');
  _t3dBox(35,P,-10,43,P+.3,10,'pav');
  for(const s of [-1,1]) _t3dBox(0,0,s>0?0:-4.2,.35,15,s>0?4.2:0,'oroInciso',{ry:s*1.15,x:35.2,y:P,z:s*4.4});
  _t3dBox(30.2,P+15,-4.5,30.5,P+16,4.5,'oro');
  /* 5 — SALA: dentro, cedro coperto d'oro; il Luogo Santo e il Luogo Santissimo */
  _t3dFase=4; _t3dTag='';
  _t3dBox(-30,P,-10,30,P+.25,10,'oro');
  _t3dBox(-30,P,-10,30,H,-9.8,'oroInciso'); _t3dBox(-30,P,9.8,30,H,10,'oroInciso'); _t3dBox(-30,P,-10,-29.8,H,10,'oroInciso');
  _t3dBox(29.8,P,-10,30,H,-4.5,'oroInciso'); _t3dBox(29.8,P,4.5,30,H,10,'oroInciso');
  /* il muro fra Santo e Santissimo, con le porte d'ulivo e il velo (2 Cron 3:14) */
  _t3dBox(-10.5,P,-10,-10,P+20,-4.2,'oroInciso'); _t3dBox(-10.5,P,4.2,-10,P+20,10,'oroInciso'); _t3dBox(-10.5,P+20,-10,-10,H,10,'oroInciso');
  _t3dBox(-9.9,P,-4.2,-9.7,P+19.5,4.2,'velo');
  _t3dBox(-30,P+20,-10,-10.5,P+20.5,10,'oro');
  /* i due cherubini di 10 cubiti, con le ali che toccano i muri e si toccano in mezzo (1 Re 6:23-28) */
  for(const z of [-5,5]){
    _t3dTornio(-20,P,z,[[1.1,0],[1.2,1.2],[.95,4],[.8,6.5],[.95,7.4],[.55,8.2],[.1,8.3]],12,'oro',null,true);
    _t3dSfera(-20,P+9,z,.8,10,'oro');
    for(const s of [-1,1]){ const z0=z, z1=z+s*5; _t3dBox(-20.6,P+6.6,Math.min(z0,z1),-19.4,P+8.2,Math.max(z0,z1),'oro'); _t3dBox(-20.4,P+5.3,Math.min(z0,z1)+(s>0?0:1),-19.6,P+6.6,Math.max(z0,z1)-(s>0?1:0),'oro'); }
  }
  /* l'arca: due cubiti e mezzo per uno e mezzo, il propiziatorio e le stanghe */
  _t3dBox(-21.25,P,-.75,-18.75,P+1.5,.75,'oro'); _t3dBox(-21.35,P+1.5,-.85,-18.65,P+1.7,.85,'oro');
  for(const x of [-20.8,-19.2]) _t3dBox(x-.2,P+1.7,-.4,x+.2,P+2.5,.4,'oro');
  for(const z of [-.55,.55]) _t3dCil(0,0,0,5.5,.08,.08,6,'oro',{rz:Math.PI/2,x:-17.2,y:P+.9,z});
  /* l'altare dei profumi, i dieci candelabri e le dieci tavole (1 Re 7:48-49) */
  _t3dBox(-8,P,-1,-6,P+2,1,'oro'); for(const [a,b] of [[-8,-1],[-8,.7],[-6.3,-1],[-6.3,.7]]) _t3dBox(a,P+2,b,a+.3,P+2.4,b+.3,'oro');
  for(const x of [-2,5,12,19,26]) for(const z of [-7.6,7.6]){
    _t3dTornio(x,P,z,[[.7,0],[.5,.3],[.14,.6],[.12,3.9],[.3,4.1]],10,'oro',null,true);
    for(let k=1;k<=3;k++){ const w=.42*k, y=P+1.7+k*.5; _t3dBox(x-w,y,z-.07,x+w,y+.14,z+.07,'oro');
      for(const s of [-1,1]){ _t3dCil(x+s*w,z,y,P+3.9,.07,.07,6,'oro'); _t3dSfera(x+s*w,P+4.05,z,.16,6,'oro'); _t3dBox(x+s*w-.05,P+4.2,z-.05,x+s*w+.05,P+4.55,z+.05,'fuoco'); } }
    _t3dBox(x-.05,P+4.2,z-.05,x+.05,P+4.6,z+.05,'fuoco');
    const zt=z*.46;
    _t3dBox(x-1,P+2.2,zt-.55,x+1,P+2.4,zt+.55,'oro');
    for(const [a,b] of [[-.9,-.45],[.8,-.45],[-.9,.35],[.8,.35]]) _t3dBox(x+a,P,zt+b,x+a+.12,P+2.2,zt+b+.12,'oro');
    for(let k=0;k<6;k++) _t3dBox(x-.9+k*.3,P+2.4,zt-.35,x-.66+k*.3,P+2.6,zt+.35,'pane');
  }
  /* 6 — TETTO: le travi e le tavole di cedro (1 Re 6:9), con il parapetto */
  _t3dFase=5; _t3dTag='tetto';
  _t3dBox(-35.5,H,-15.5,35.5,H+1.4,15.5,'legno');
  _t3dBox(-35.5,H+1.4,-15.5,35.5,H+2.8,-14.7,'pietra'); _t3dBox(-35.5,H+1.4,14.7,35.5,H+2.8,15.5,'pietra');
  _t3dBox(-35.5,H+1.4,-15.5,-34.7,H+2.8,15.5,'pietra'); _t3dBox(34.7,H+1.4,-15.5,35.5,H+2.8,15.5,'pietra');
  _t3dBox(35,H+4,-15.5,45.5,H+5.4,15.5,'legno');
  _t3dBox(35,H+5.4,-15.5,45.5,H+6.6,-14.7,'pietra'); _t3dBox(35,H+5.4,14.7,45.5,H+6.6,15.5,'pietra'); _t3dBox(44.7,H+5.4,-15.5,45.5,H+6.6,15.5,'pietra');
  _t3dTag='';
  for(let x=-33;x<=33;x+=3) for(const z of [-15.3,15.3]) _t3dBox(x-.45,H-1.2,z-.4,x+.45,H-.3,z+.4,'legno');
  if(oro) _t3dBox(-35.8,H+2.8,-15.8,45.8,H+3.2,15.8,'oro');
  /* 7 — DECORAZIONI: l'altare di bronzo, il mare sui dodici buoi, le dieci basi, il cortile */
  _t3dFase=6; _t3dTag='';
  _t3dBox(70,0,-10,90,10,10,'bronzo');
  _t3dBox(69.4,4.6,-10.6,90.6,5.4,10.6,'bronzo');
  for(const [x,z] of [[70,-10],[88.6,-10],[70,8.6],[88.6,8.6]]) _t3dBox(x,10,z,x+1.4,11.4,z+1.4,'bronzo');
  /* la rampa a sud, senza gradini (Esodo 20:26) */
  _t3dQuad([70,10,10],[70,0,26],[78,0,26],[78,10,10],'pietra'); _t3dTri([70,10,10],[70,0,10],[70,0,26],'pietra'); _t3dTri([78,10,10],[78,0,26],[78,0,10],'pietra');
  _t3dBox(76,10,-4,84,10.4,4,'brace');
  for(let k=0;k<7;k++){ const a=k/7*Math.PI*2; _t3dTornio(80+Math.cos(a)*1.8,10.4,Math.sin(a)*1.8,[[.9,0],[.6,1.2],[.2,2.4],[.02,3]],6,'fuoco'); }
  _t3dSfera(80,15,0,2.4,16,'fumo'); _t3dSfera(79,19,-1.5,3,16,'fumo'); _t3dSfera(77.5,23.5,-3,3.6,16,'fumo');
  /* il mare di bronzo: 10 cubiti da un orlo all'altro, alto 5, su dodici buoi (1 Re 7:23-26) */
  const mx=60, mz=34;
  for(let q=0;q<4;q++) for(let j=-1;j<=1;j++){
    const a=q*Math.PI/2+j*.38, bx=mx+Math.cos(a)*3.6, bz=mz+Math.sin(a)*3.6, tr={ry:-a,x:bx,y:0,z:bz};
    _t3dBox(-1.3,1.7,-.6,1.3,3,.6,'bronzo',tr); _t3dBox(1.2,2.2,-.45,2.2,3.1,.45,'bronzo',tr);
    _t3dBox(1.9,3.05,-.55,2.05,3.4,-.35,'bronzo',tr); _t3dBox(1.9,3.05,.35,2.05,3.4,.55,'bronzo',tr);
    for(const [lx,lz] of [[-1,-.4],[-1,.25],[.9,-.4],[.9,.25]]) _t3dBox(lx,0,lz,lx+.3,1.8,lz+.25,'bronzo',tr);
  }
  _t3dTornio(mx,3.1,mz,[[3.2,0],[4.2,.8],[4.8,2.4],[5,4],[5.45,5.1]],28,'bronzo',null,false);
  _t3dTornio(mx,3.1,mz,[[5.3,5.1],[4.75,4],[4.55,2.4],[3.9,.9],[2.9,.2]],28,'bronzo',null,false);
  _t3dTornio(mx,7.6,mz,[[4.72,0],[0.01,0]],28,'acqua',null,false);
  /* le dieci basi di bronzo con le ruote e le conche (1 Re 7:27-39), cinque a sud e cinque a nord */
  for(const z of [-34,34]) for(const x of [-28,-14,0,14,28]){
    _t3dBox(x-2,1.3,z-2,x+2,4.3,z+2,'bronzo');
    for(const [a,b] of [[-1.6,-2.15],[1.6,-2.15],[-1.6,2.15],[1.6,2.15]]) _t3dCil(0,0,-.15,.15,.75,.75,12,'bronzo',{rx:Math.PI/2,x:x+a,y:.75,z:z+b});
    _t3dTornio(x,4.3,z,[[.9,0],[1.9,.8],[2.1,1.6]],16,'bronzo',null,false);
    _t3dTornio(x,5.7,z,[[1.95,0],[0.01,0]],16,'acqua',null,false);
  }
  /* il cortile interno: tre ordini di pietre squadrate e un ordine di travi di cedro (1 Re 6:36) */
  const muro=(x0,z0,x1,z1)=>{ _t3dBox(x0,0,z0,x1,4,z1,'pietra'); _t3dBox(x0-.1,4,z0-.1,x1+.1,5,z1+.1,'legno'); };
  muro(-70,-56,116,-54); muro(-70,54,116,56); muro(-70,-56,-68,56); muro(114,-56,116,-9); muro(114,9,116,56);
  _t3dBox(111,0,-15,119,13,-9,'pietra'); _t3dBox(111,0,9,119,13,15,'pietra'); _t3dBox(111,10,-9,119,13,9,'pietra');
  _t3dBox(110.6,13,-15.4,119.4,13.8,15.4,'pietra');
  /* 8 — COMPLETAMENTO: il fuoco scende sull'altare e la nuvola della gloria riempie la casa (2 Cron 5:13-14; 7:1) */
  _t3dFase=7; _t3dTag='';
  for(let x=-26;x<=26;x+=8) for(const z of [-15.12,15.12]) _t3dBox(x-1,P+21,z-.06,x+1,P+27,z+.06,'luce');
  _t3dBox(30.4,P,-4.4,30.6,P+15,4.4,'luce');
  _t3dCil(80,0,10,150,5.5,3,16,'raggio');
  for(let k=0;k<9;k++){ const a=k/9*Math.PI*2; _t3dTornio(80+Math.cos(a)*3,10.4,Math.sin(a)*3,[[1.2,0],[.8,2.2],[.3,4],[.02,5]],6,'fuoco'); }
  const r=_t3dRnd(31);
  for(let k=0;k<22;k++) _t3dSfera(-32+r()*84,H+5+r()*18,-15+r()*30,6+r()*8,20,'nube',.62);
  for(let k=0;k<6;k++) _t3dSfera(37+r()*10,P+6+r()*12,-9+r()*18,4+r()*3,18,'nube',.8);
}

/* ---------- WebGL ---------- */
const T3D_VS=`attribute vec3 aP;attribute vec3 aN;attribute vec2 aT;
uniform mat4 uVP;uniform mat4 uLVP;uniform float uLift;
varying vec3 vW;varying vec3 vN;varying vec2 vT;varying vec4 vL;
void main(){vec3 p=aP;p.y+=uLift;vW=p;vN=aN;vT=aT;vL=uLVP*vec4(p,1.);gl_Position=uVP*vec4(p,1.);}`;
const T3D_FS=`precision highp float;
uniform sampler2D uTex;uniform sampler2D uOmb;uniform vec3 uCol;uniform vec3 uSun;uniform vec3 uSunCol;uniform vec3 uSky;uniform vec3 uGround;
uniform vec3 uEye;uniform float uSpec;uniform float uShin;uniform float uMetal;uniform float uEmis;uniform float uAlpha;uniform vec3 uFog;uniform float uFogD;
uniform float uCielo;uniform float uPx;uniform vec3 uCieloC;uniform float uClip;
varying vec3 vW;varying vec3 vN;varying vec2 vT;varying vec4 vL;
float unp(vec4 c){return dot(c,vec4(1.,1./255.,1./65025.,1./16581375.));}
float ombra(){vec3 p=vL.xyz/vL.w*.5+.5;if(p.x<0.||p.x>1.||p.y<0.||p.y>1.||p.z>1.)return 1.;float s=0.;
 for(int i=-1;i<=1;i++)for(int j=-1;j<=1;j++){float d=unp(texture2D(uOmb,p.xy+vec2(float(i),float(j))*uPx));s+=(p.z-.0008>d)?0.:1.;}return s/9.;}
void main(){
 if(vW.y>uClip)discard;
 if(uCielo>.5){vec3 d=normalize(vW-uEye);float h=clamp(d.y,0.,1.);vec3 c=mix(uFog,uCieloC,pow(h,.5));
  float sg=max(dot(d,uSun),0.);c+=uSunCol*(pow(sg,300.)*2.+pow(sg,12.)*.18);gl_FragColor=vec4(c,1.);return;}
 vec3 base=texture2D(uTex,vT).rgb*uCol;vec3 N=normalize(vN);vec3 V=normalize(uEye-vW);
 float nl=max(dot(N,uSun),0.);float sh=nl>0.?ombra():0.;
 vec3 amb=mix(uGround,uSky,N.y*.5+.5);
 vec3 col=base*(amb*.62+uSunCol*nl*sh);
 if(uMetal>0.){vec3 R=reflect(-V,N);vec3 env=mix(uGround*.9,uSky*1.25,clamp(R.y*.5+.5,0.,1.));col=mix(col,base*env*1.25+col*.35,uMetal);}
 vec3 H=normalize(uSun+V);col+=uSunCol*pow(max(dot(N,H),0.),uShin)*uSpec*(.25+.75*sh)*mix(vec3(1.),base,uMetal);
 col+=base*uEmis;
 float f=1.-exp(-length(vW-uEye)*uFogD);col=mix(col,uFog,clamp(f,0.,1.));
 float a=uAlpha;if(a<.999)a*=pow(abs(dot(N,V)),1.6);
 gl_FragColor=vec4(col,a);}`;
const T3D_VS_O=`attribute vec3 aP;uniform mat4 uLVP;uniform float uLift;varying float vY;void main(){vec3 p=aP;p.y+=uLift;vY=p.y;gl_Position=uLVP*vec4(p,1.);}`;
const T3D_FS_O=`precision highp float;uniform float uClip;varying float vY;vec4 pk(float d){vec4 e=fract(vec4(1.,255.,65025.,16581375.)*d);e-=e.yzww*vec4(1./255.,1./255.,1./255.,0.);return e;}
void main(){if(vY>uClip)discard;gl_FragColor=pk(gl_FragCoord.z);}`;
function _t3dProg(gl,vs,fs){
  const sh=(t,s)=>{ const o=gl.createShader(t); gl.shaderSource(o,s); gl.compileShader(o); if(!gl.getShaderParameter(o,gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; };
  const p=gl.createProgram(); gl.attachShader(p,sh(gl.VERTEX_SHADER,vs)); gl.attachShader(p,sh(gl.FRAGMENT_SHADER,fs)); gl.linkProgram(p);
  if(!gl.getProgramParameter(p,gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
  const u={}, n=gl.getProgramParameter(p,gl.ACTIVE_UNIFORMS); for(let i=0;i<n;i++){ const a=gl.getActiveUniform(p,i); u[a.name]=gl.getUniformLocation(p,a.name); }
  return {p,u,aP:gl.getAttribLocation(p,'aP'),aN:gl.getAttribLocation(p,'aN'),aT:gl.getAttribLocation(p,'aT')};
}
function t3dPrepara(){
  if(T3D.ok!==null) return T3D.ok;
  try{
    const cv=document.createElement('canvas'); cv.className='tpl-3d';
    const gl=cv.getContext('webgl',{antialias:true,alpha:false,preserveDrawingBuffer:false})||cv.getContext('experimental-webgl');
    if(!gl) return (T3D.ok=false);
    T3D.canvas=cv; T3D.gl=gl;
    T3D.pr=_t3dProg(gl,T3D_VS,T3D_FS); T3D.po=_t3dProg(gl,T3D_VS_O,T3D_FS_O);
    const ani=gl.getExtension('EXT_texture_filter_anisotropic')||gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic');
    T3D.tex={};
    for(const k of ['pietra','pietraGr','pav','cedro','oro','oroInciso','bronzo','terra','velo','acqua','foglia','bianco']){
      const t=gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D,t);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,_t3dTexture(k));
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.REPEAT); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.REPEAT);
      if(ani) gl.texParameterf(gl.TEXTURE_2D,ani.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(8,gl.getParameter(ani.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
      T3D.tex[k]=t;
    }
    /* la mappa delle ombre */
    const N=2048; T3D.ombN=N;
    T3D.ombT=gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D,T3D.ombT);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,N,N,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    T3D.ombF=gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER,T3D.ombF);
    gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,T3D.ombT,0);
    const rb=gl.createRenderbuffer(); gl.bindRenderbuffer(gl.RENDERBUFFER,rb); gl.renderbufferStorage(gl.RENDERBUFFER,gl.DEPTH_COMPONENT16,N,N);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,rb);
    gl.bindFramebuffer(gl.FRAMEBUFFER,null);
    _t3dControlli(cv);
    cv.addEventListener('webglcontextlost',e=>{ e.preventDefault(); T3D.perso=true; });
    T3D.ok=true;
  }catch(e){ console.warn('tempio 3D',e); T3D.ok=false; }
  return T3D.ok;
}
/* costruisce le forme (una volta per il tempio normale e una per quello d'oro) */
function _t3dCostruisci(oro){
  const gl=T3D.gl;
  (T3D.gruppi||[]).forEach(g=>{ if(g.buf) gl.deleteBuffer(g.buf); });
  T3D.gruppi=[];
  _t3dAmbiente(); _t3dCantiere(); _t3dFasi(oro);
  _t3dFase=-1; _t3dTag='cielo'; _t3dSfera(20,0,0,1400,16,'cielo');
  T3D.gruppi.forEach(g=>{ g.n=g.v.length/8; g.buf=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,g.buf); gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(g.v),gl.STATIC_DRAW); g.v=null; });
  T3D.costruito=oro?'oro':'pietra';
}
/* ---------- girare e avvicinare con le dita ---------- */
function _t3dControlli(cv){
  const P=T3D.punti;
  const dist=()=>{ const v=Object.values(P); return v.length<2?0:Math.hypot(v[0].x-v[1].x,v[0].y-v[1].y); };
  cv.addEventListener('pointerdown',e=>{ try{ cv.setPointerCapture(e.pointerId); }catch(x){} P[e.pointerId]={x:e.clientX,y:e.clientY}; T3D.gira=false; T3D.fermo=Date.now(); T3D.d0=dist(); e.preventDefault(); });
  cv.addEventListener('pointermove',e=>{
    const p=P[e.pointerId]; if(!p) return;
    const n=Object.keys(P).length;
    if(n===1){ T3D.cam.yaw-=(e.clientX-p.x)*.0075; T3D.cam.pitch=Math.max(.06,Math.min(1.4,T3D.cam.pitch+(e.clientY-p.y)*.006)); }
    p.x=e.clientX; p.y=e.clientY;
    if(n===2){ const d=dist(); if(T3D.d0>0 && d>0) T3D.cam.dist=Math.max(35,Math.min(430,T3D.cam.dist*T3D.d0/d)); T3D.d0=d; }
    T3D.fermo=Date.now(); e.preventDefault();
  });
  const su=e=>{ delete P[e.pointerId]; T3D.d0=dist(); T3D.fermo=Date.now(); };
  cv.addEventListener('pointerup',su); cv.addEventListener('pointercancel',su);
  cv.addEventListener('wheel',e=>{ e.preventDefault(); T3D.cam.dist=Math.max(35,Math.min(430,T3D.cam.dist*Math.exp(e.deltaY*.0012))); T3D.gira=false; T3D.fermo=Date.now(); },{passive:false});
  cv.addEventListener('dblclick',()=>{ Object.assign(T3D.cam,{yaw:0.62,pitch:.36,dist:200}); T3D.gira=true; });
}
/* ---------- disegnare ---------- */
function _t3dDisegna(t){
  const gl=T3D.gl, cv=T3D.canvas; if(!gl||T3D.perso) return;
  const r=cv.getBoundingClientRect(), dpr=Math.min(2,window.devicePixelRatio||1);
  const W=Math.max(2,Math.round(r.width*dpr)), Hh=Math.max(2,Math.round(r.height*dpr));
  if(cv.width!==W||cv.height!==Hh){ cv.width=W; cv.height=Hh; }
  const dt=Math.min(.1,(t-(T3D.ultimo||t))/1000); T3D.ultimo=t;
  if(!T3D.gira && Date.now()-T3D.fermo>6000) T3D.gira=true;
  if(T3D.gira) T3D.cam.yaw+=dt*.05;
  const c=T3D.cam, eye=[c.tgt[0]+Math.cos(c.pitch)*Math.cos(c.yaw)*c.dist, c.tgt[1]+Math.sin(c.pitch)*c.dist, c.tgt[2]+Math.cos(c.pitch)*Math.sin(c.yaw)*c.dist];
  const VP=_m4.mul(_m4.per(.78,W/Hh,2,3200),_m4.guarda(eye,c.tgt,[0,1,0]));
  /* il sole: di giorno da sud-est; nella modalità Maestro la luce d'oro del tramonto */
  const oro=T3D.oro;
  const sun=_v.norm(oro?[.62,.36,.7]:[.45,.8,.55]), sunCol=oro?[1.25,.92,.58]:[1.12,1.05,.93];
  const sky=oro?[.62,.58,.66]:[.6,.66,.74], ground=oro?[.55,.4,.28]:[.58,.5,.38], fog=oro?[.95,.78,.6]:[.82,.87,.93];
  const cielo=oro?[.45,.5,.78]:[.38,.58,.9];
  const LVP=_m4.mul(_m4.orto(-150,150,-150,150,10,820),_m4.guarda(_v.add([22,0,0],_v.scala(sun,420)),[22,0,0],[0,1,0]));
  const fatte=T3D.fatte, an=T3D.anima, k=an?Math.min(1,(performance.now()-an.t0)/1800):1;
  if(an && k>=1) T3D.anima=null;
  const visibile=g=>{
    if(g.tag==='cielo') return true;
    if(g.fase===-1) return true;
    if(g.fase===-2) return fatte<=0;
    if(g.tag==='tetto' && T3D.dentro) return false;
    if(T3D.dentro && (g.mat==='nube'||g.mat==='luce')) return false;
    return g.fase<fatte;
  };
  const lift=g=>(an&&g.fase===an.fase)?-(1-k)*(1-k)*30:0;
  /* «Dentro»: la casa si apre come un plastico, tagliata sopra ai cherubini (i muri, il portico, il tetto) */
  const taglio=g=>(T3D.dentro && g.fase>=2 && g.fase<=5)?T3D_PIANO+12:1e5;
  const alfa=g=>(an&&g.fase===an.fase)?Math.min(1,k*1.6):1;
  const lega=(pr,g,norm)=>{
    gl.bindBuffer(gl.ARRAY_BUFFER,g.buf);
    gl.enableVertexAttribArray(pr.aP); gl.vertexAttribPointer(pr.aP,3,gl.FLOAT,false,32,0);
    if(norm){ gl.enableVertexAttribArray(pr.aN); gl.vertexAttribPointer(pr.aN,3,gl.FLOAT,false,32,12);
      gl.enableVertexAttribArray(pr.aT); gl.vertexAttribPointer(pr.aT,2,gl.FLOAT,false,32,24); }
  };
  const gruppi=T3D.gruppi.filter(visibile);
  /* 1) le ombre, viste dal sole */
  const po=T3D.po;
  gl.bindFramebuffer(gl.FRAMEBUFFER,T3D.ombF); gl.viewport(0,0,T3D.ombN,T3D.ombN);
  gl.clearColor(1,1,1,1); gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT); gl.enable(gl.DEPTH_TEST); gl.disable(gl.CULL_FACE); gl.disable(gl.BLEND);
  gl.useProgram(po.p); gl.uniformMatrix4fv(po.u.uLVP,false,LVP);
  gruppi.forEach(g=>{ const m=T3D_MAT[g.mat]||{}; if(m.cielo||m.alpha||m.emis||g.tag==='cielo') return; gl.uniform1f(po.u.uLift,lift(g)); gl.uniform1f(po.u.uClip,taglio(g)); lega(po,g,false); gl.drawArrays(gl.TRIANGLES,0,g.n); });
  gl.disableVertexAttribArray(po.aP);
  /* 2) la scena */
  gl.bindFramebuffer(gl.FRAMEBUFFER,null); gl.viewport(0,0,W,Hh);
  gl.clearColor(fog[0],fog[1],fog[2],1); gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  const pr=T3D.pr; gl.useProgram(pr.p);
  gl.uniformMatrix4fv(pr.u.uVP,false,VP); gl.uniformMatrix4fv(pr.u.uLVP,false,LVP);
  gl.uniform3fv(pr.u.uSun,sun); gl.uniform3fv(pr.u.uSunCol,sunCol); gl.uniform3fv(pr.u.uSky,sky); gl.uniform3fv(pr.u.uGround,ground);
  gl.uniform3fv(pr.u.uCieloC,cielo); gl.uniform3fv(pr.u.uEye,eye); gl.uniform3fv(pr.u.uFog,fog); gl.uniform1f(pr.u.uFogD,.0011); gl.uniform1f(pr.u.uPx,1/T3D.ombN);
  gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D,T3D.ombT); gl.uniform1i(pr.u.uOmb,1);
  gl.activeTexture(gl.TEXTURE0); gl.uniform1i(pr.u.uTex,0);
  const trasparenti=[];
  const uno=g=>{
    const m=T3D_MAT[g.mat]||{};
    gl.bindTexture(gl.TEXTURE_2D,T3D.tex[m.tex||'bianco']||T3D.tex.bianco);
    gl.uniform3fv(pr.u.uCol,m.col||[1,1,1]); gl.uniform1f(pr.u.uSpec,m.spec||0); gl.uniform1f(pr.u.uShin,m.shin||10);
    gl.uniform1f(pr.u.uMetal,m.metal||0); gl.uniform1f(pr.u.uEmis,m.emis||0);
    gl.uniform1f(pr.u.uAlpha,(m.alpha||1)*alfa(g)); gl.uniform1f(pr.u.uCielo,m.cielo?1:0); gl.uniform1f(pr.u.uLift,lift(g)); gl.uniform1f(pr.u.uClip,taglio(g));
    lega(pr,g,true); gl.drawArrays(gl.TRIANGLES,0,g.n);
  };
  gl.disable(gl.BLEND); gl.depthMask(true);
  gruppi.forEach(g=>{ const m=T3D_MAT[g.mat]||{}; if(m.alpha||alfa(g)<1){ trasparenti.push(g); return; } uno(g); });
  gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
  trasparenti.sort((a,b)=>((T3D_MAT[a.mat]||{}).alpha?1:0)-((T3D_MAT[b.mat]||{}).alpha?1:0));
  trasparenti.forEach(g=>{ const m=T3D_MAT[g.mat]||{}; gl.depthMask(!m.alpha); uno(g); });
  gl.depthMask(true); gl.disable(gl.BLEND);
}
function _t3dCiclo(t){
  T3D.raf=0;
  if(!T3D.canvas || !T3D.canvas.isConnected || document.hidden) return;
  _t3dDisegna(t||performance.now());
  T3D.raf=requestAnimationFrame(_t3dCiclo);
}
/* ---------- nel gioco ---------- */
function tpl3dHtml(){ return `<div class="tpl-3d-box" id="tpl3dPosto">
  <div class="tpl-3d-bt"><button class="bt pi mini ${T3D.dentro?'on':''}" onclick="tpl3dDentro()" title="Togli il tetto per vedere dentro">👁 Dentro</button>
  <button class="bt pi mini" onclick="tpl3dGrande()" title="Guarda il Tempio a tutto schermo">⤢</button></div>
  <p class="tpl-3d-aiuto">Gira con il dito · avvicina con due dita</p></div>`; }
/* dopo aver disegnato la pagina: il riquadro 3D (sempre lo stesso, spostato qui) con le fasi fatte */
function tpl3dMonta(fatte,anima,oro){
  const posto=document.getElementById('tpl3dPosto'); if(!posto || !t3dPrepara()) return false;
  if(T3D.costruito!==(oro?'oro':'pietra')) _t3dCostruisci(oro);
  T3D.oro=!!oro;
  if(anima!=null && anima>=0 && fatte>T3D.fatte && T3D.fatte>=0) T3D.anima={fase:anima,t0:performance.now()};
  else if(anima!=null && anima>=0 && T3D.fatte<0) T3D.anima={fase:anima,t0:performance.now()};
  /* la vista: vicina finché c'è solo la casa, più lontana quando si costruiscono il cortile e l'altare */
  if(fatte!==T3D.fatte && !T3D.dentro) Object.assign(T3D.cam, fatte>=6 ? {dist:190,tgt:[18,10,0]} : {dist:128,tgt:[4,11,0]});
  T3D.fatte=fatte;
  posto.insertBefore(T3D.canvas,posto.firstChild);
  if(!T3D.raf) T3D.raf=requestAnimationFrame(_t3dCiclo);
  return true;
}
function tpl3dDentro(){ T3D.dentro=!T3D.dentro;
  Object.assign(T3D.cam, T3D.dentro ? {pitch:.72,dist:118,tgt:[-2,7,0]} : {pitch:.36,dist:200,tgt:[8,11,0]}); $$('.tpl-3d-bt .bt').forEach((b,i)=>{ if(i===0) b.classList.toggle('on',T3D.dentro); }); }
/* il Tempio a tutto schermo: lo stesso riquadro, sopra a tutto; ✕ lo rimette al suo posto */
function tpl3dGrande(){
  let v=document.getElementById('tpl3dGrande');
  if(v){ const posto=document.getElementById('tpl3dPosto'); if(posto) posto.insertBefore(T3D.canvas,posto.firstChild); v.remove(); return; }
  v=document.createElement('div'); v.id='tpl3dGrande'; v.className='tpl-3d-grande';
  v.innerHTML=`<div class="tpl-3d-bt"><button class="bt pi mini ${T3D.dentro?'on':''}" onclick="tpl3dDentro()">👁 Dentro</button><button class="bt pr mini" onclick="tpl3dGrande()">✕</button></div>`;
  document.body.appendChild(v); v.insertBefore(T3D.canvas,v.firstChild);
  if(!T3D.raf) T3D.raf=requestAnimationFrame(_t3dCiclo);
}
document.addEventListener('visibilitychange',()=>{ if(!document.hidden && T3D.canvas && T3D.canvas.isConnected && !T3D.raf) T3D.raf=requestAnimationFrame(_t3dCiclo); });
