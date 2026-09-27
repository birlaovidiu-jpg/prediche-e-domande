/* ================= POWERPOINT IDENTICO ALL'ORIGINALE =================
   Per «▶︎ Diapositive originali»: ogni diapositiva disegnata come la disegna PowerPoint, su una tela
   larga 1280 (poi adattaPptx la porta alla misura dello schermo). Prima si vedevano solo i riquadri
   di testo e le immagini; ora anche:
   · i colori del TEMA (quelli che PowerPoint scrive come «colore 1 del tema, più chiaro del 40%»),
     con le loro sfumature (lumMod/lumOff/tint/shade/trasparenza);
   · tutte le forme, anche senza testo: rettangoli, arrotondati, ovali, cornici, triangoli, frecce,
     rombi, stelle… e quelle disegnate a mano (custGeom), con il loro riempimento (pieno o sfumato,
     o un'immagine), il bordo (colore, spessore, tratteggio) e l'ombra;
   · lo stile che la forma prende dal tema quando non ne scrive uno suo (p:style);
   · i testi con caratteri, grandezze, colori, grassetti, elenchi, rientri, interlinea, spazi fra i
     capoversi e margini interni — anche quando li ereditano dal layout e dal modello (come succede
     quasi sempre), e rimpiccioliti quando PowerPoint li rimpicciolisce per farli stare nel riquadro;
   · le immagini ritagliate come nell'originale, ruotate e specchiate;
   · lo sfondo (colore, sfumatura, immagine) della diapositiva, del layout o del modello;
   · le forme e le immagini fisse del layout e del modello (loghi, cornici, strisce).
   Restano fuori: animazioni e transizioni, grafici, SmartArt, video. */

const _PF_NS_A='http://schemas.openxmlformats.org/drawingml/2006/main';
function _pf(el,nome){ if(!el) return null; for(const c of el.children) if(c.localName===nome) return c; return null; }
function _pfs(el,nome){ return el?[...el.children].filter(c=>c.localName===nome):[]; }
function _pfGiu(el,nome){ if(!el) return null; const t=el.getElementsByTagNameNS('*',nome); return t.length?t[0]:null; }
function _pfA(el,k,d){ if(!el) return d; const v=el.getAttribute(k); return v==null||v===''?d:v; }
function _pfN(el,k,d){ const v=_pfA(el,k,null); return v==null?d:+v; }

/* ---------- colori ---------- */
function _pfHex(h){ h=String(h||'000000').replace('#',''); return [0,2,4].map(k=>parseInt(h.slice(k,k+2),16)||0); }
function _pfRgbHsl(r,g,b){ r/=255; g/=255; b/=255; const M=Math.max(r,g,b), m=Math.min(r,g,b); let h=0,s=0; const l=(M+m)/2;
  if(M!==m){ const d=M-m; s=l>0.5?d/(2-M-m):d/(M+m);
    h=M===r?(g-b)/d+(g<b?6:0):M===g?(b-r)/d+2:(r-g)/d+4; h/=6; }
  return [h,s,l]; }
function _pfHslRgb(h,s,l){ if(s===0){ const v=Math.round(l*255); return [v,v,v]; }
  const f=(p,q,t)=>{ if(t<0)t+=1; if(t>1)t-=1; if(t<1/6)return p+(q-p)*6*t; if(t<1/2)return q; if(t<2/3)return p+(q-p)*(2/3-t)*6; return p; };
  const q=l<0.5?l*(1+s):l+s-l*s, p=2*l-q; return [f(p,q,h+1/3),f(p,q,h),f(p,q,h-1/3)].map(v=>Math.round(v*255)); }
const _PF_PRST={black:'000000',white:'FFFFFF',red:'FF0000',green:'008000',blue:'0000FF',yellow:'FFFF00',gray:'808080',
  grey:'808080',darkGray:'A9A9A9',lightGray:'D3D3D3',orange:'FFA500',purple:'800080',navy:'000080',silver:'C0C0C0'};
/* un elemento colore (srgbClr, schemeClr…) → {rgb:[r,g,b], a} */
function _pfColoreEl(el,T,ph){
  if(!el) return null;
  let rgb=null; const k=el.localName;
  if(k==='srgbClr') rgb=_pfHex(_pfA(el,'val','000000'));
  else if(k==='sysClr') rgb=_pfHex(_pfA(el,'lastClr',_pfA(el,'val')==='window'?'FFFFFF':'000000'));
  else if(k==='prstClr') rgb=_pfHex(_PF_PRST[_pfA(el,'val','black')]||'000000');
  else if(k==='scrgbClr') rgb=['r','g','b'].map(x=>Math.round(Math.min(1,_pfN(el,x,0)/100000)**(1/2.2)*255));
  else if(k==='hslClr') rgb=_pfHslRgb(_pfN(el,'hue',0)/21600000,_pfN(el,'sat',0)/100000,_pfN(el,'lum',0)/100000);
  else if(k==='schemeClr'){
    let v=_pfA(el,'val','tx1');
    if(v==='phClr'){ if(ph) rgb=ph.rgb.slice(); else v='tx1'; }
    if(!rgb){ const m=(T&&T.mappa&&T.mappa[v])||{bg1:'lt1',tx1:'dk1',bg2:'lt2',tx2:'dk2'}[v]||v;
      rgb=_pfHex((T&&T.colori&&T.colori[m])||'000000'); }
  } else return null;
  let a=1;
  for(const m of el.children){
    const v=_pfN(m,'val',0)/100000, n=m.localName;
    if(n==='alpha') a=v;
    else if(n==='lumMod'||n==='lumOff'||n==='satMod'||n==='hueMod'||n==='hueOff'||n==='satOff'){
      const h=_pfRgbHsl(...rgb);
      if(n==='lumMod') h[2]*=v; else if(n==='lumOff') h[2]+=v; else if(n==='satMod') h[1]*=v; else if(n==='satOff') h[1]+=v;
      else if(n==='hueMod') h[0]*=v; else if(n==='hueOff') h[0]+=_pfN(m,'val',0)/21600000;
      h[1]=Math.max(0,Math.min(1,h[1])); h[2]=Math.max(0,Math.min(1,h[2])); h[0]=((h[0]%1)+1)%1;
      rgb=_pfHslRgb(...h);
    }
    else if(n==='tint') rgb=rgb.map(c=>Math.round(255-(255-c)*v));
    else if(n==='shade') rgb=rgb.map(c=>Math.round(c*v));
    else if(n==='inv') rgb=rgb.map(c=>255-c);
    else if(n==='gray'){ const g=Math.round(rgb[0]*.3+rgb[1]*.59+rgb[2]*.11); rgb=[g,g,g]; }
  }
  return {rgb:rgb.map(c=>Math.max(0,Math.min(255,c))), a};
}
function _pfCss(c){ if(!c) return 'transparent'; const [r,g,b]=c.rgb; return c.a<0.999?`rgba(${r},${g},${b},${+c.a.toFixed(3)})`:`rgb(${r},${g},${b})`; }
/* un colore del tema per nome (tx1, bg1, accent1…), come elemento da risolvere */
function _pfSchema(v){ const d=document.implementation.createDocument(_PF_NS_A,'schemeClr',null); d.documentElement.setAttribute('val',v); return d.documentElement; }
/* il primo figlio-colore dentro a un elemento (solidFill, buClr, fgClr…) */
function _pfColoreDi(el,T,ph){ if(!el) return null; for(const c of el.children){ const x=_pfColoreEl(c,T,ph); if(x) return x; } return null; }

/* ---------- il tema: colori, caratteri, stili di riempimento e di linea ---------- */
async function _pfTema(zip,percorsoMaster,docMaster){
  const T={colori:{},mappa:{},fontMaj:'',fontMin:'',riemp:[],linee:[],sfondi:[],doc:null,percorso:null};
  try{
    const rels=await leggiRelazioniTipizzate(zip,percorsoMaster);
    const r=rels.find(x=>/\/theme$/.test(x.tipo));
    const perc=r&&risolviPercorsoZip(percorsoMaster,r.target);
    if(perc&&zip[perc]){
      const d=new DOMParser().parseFromString(new TextDecoder().decode(await decomprimiVoce(zip[perc])),'application/xml');
      T.doc=d; T.percorso=perc; T.rel=await leggiRelazioni(zip,perc);
      const cs=_pfGiu(d,'clrScheme');
      if(cs) for(const c of cs.children){ const x=c.firstElementChild; if(!x) continue;
        T.colori[c.localName]=x.localName==='sysClr'?(_pfA(x,'lastClr',_pfA(x,'val')==='window'?'FFFFFF':'000000')):_pfA(x,'val','000000'); }
      const fs=_pfGiu(d,'fontScheme');
      if(fs){ const mj=_pf(fs,'majorFont'), mn=_pf(fs,'minorFont');
        T.fontMaj=_pfA(_pf(mj,'latin'),'typeface',''); T.fontMin=_pfA(_pf(mn,'latin'),'typeface',''); }
      const fm=_pfGiu(d,'fmtScheme');
      if(fm){ T.riemp=[..._pf(fm,'fillStyleLst')?.children||[]]; T.linee=[..._pf(fm,'lnStyleLst')?.children||[]];
        T.sfondi=[..._pf(fm,'bgFillStyleLst')?.children||[]]; }
    }
  }catch(e){}
  const cm=docMaster&&_pfGiu(docMaster,'clrMap');
  if(cm) for(const at of cm.attributes) T.mappa[at.name]=at.value;
  return T;
}

/* ---------- riempimenti e linee ---------- */
let _pfUid=0;
/* un riempimento → {tipo:'pieno'|'sfumato'|'immagine'|'nessuno', …} */
function _pfRiempimento(el,T,ph){
  if(!el) return null;
  const k=el.localName;
  if(k==='noFill') return {tipo:'nessuno'};
  if(k==='solidFill'){ const c=_pfColoreDi(el,T,ph); return c?{tipo:'pieno',c}:null; }
  if(k==='gradFill'){
    const gs=_pfs(_pf(el,'gsLst'),'gs').map(g=>({pos:_pfN(g,'pos',0)/1000,c:_pfColoreDi(g,T,ph)})).filter(g=>g.c).sort((a,b)=>a.pos-b.pos);
    if(!gs.length) return null;
    const lin=_pf(el,'lin'), path=_pf(el,'path');
    return {tipo:'sfumato', gs, ang:lin?_pfN(lin,'ang',0)/60000:90, radiale:!!path&&!lin};
  }
  if(k==='blipFill') return {tipo:'immagine', el, ph};
  if(k==='pattFill'){ const c=_pfColoreDi(_pf(el,'fgClr'),T,ph)||_pfColoreDi(_pf(el,'bgClr'),T,ph); return c?{tipo:'pieno',c}:null; }
  if(k==='grpFill') return {tipo:'gruppo'};
  return null;
}
function _pfRiempimentoDi(spPr,T,ph){
  if(!spPr) return null;
  for(const c of spPr.children){ const r=_pfRiempimento(c,T,ph); if(r) return r; }
  return null;
}
/* lo stile del tema (p:style): fillRef/lnRef/effectRef/fontRef con il loro colore */
function _pfStileRif(sp,T){
  const st=_pf(sp,'style'); if(!st) return {};
  const ref=n=>{ const r=_pf(st,n); if(!r) return null; return {idx:_pfN(r,'idx',0), c:_pfColoreDi(r,T,null), font:_pfA(r,'idx','')}; };
  return {fill:ref('fillRef'), ln:ref('lnRef'), font:ref('fontRef')};
}
function _pfCssRiempimento(r,defs){
  if(!r||r.tipo==='nessuno'||r.tipo==='gruppo') return 'none';
  if(r.tipo==='pieno') return _pfCss(r.c);
  if(r.tipo==='sfumato'){
    const id='pg'+(++_pfUid);
    const st=r.gs.map(g=>`<stop offset="${g.pos}%" stop-color="rgb(${g.c.rgb.join(',')})" stop-opacity="${g.c.a}"/>`).join('');
    if(r.radiale) defs.push(`<radialGradient id="${id}" cx="50%" cy="50%" r="70%">${st}</radialGradient>`);
    else { const a=r.ang*Math.PI/180, x=Math.cos(a), y=Math.sin(a);
      defs.push(`<linearGradient id="${id}" x1="${50-x*50}%" y1="${50-y*50}%" x2="${50+x*50}%" y2="${50+y*50}%">${st}</linearGradient>`); }
    return `url(#${id})`;
  }
  return 'none';
}
function _pfCssSfondo(r){
  if(!r||r.tipo==='nessuno') return '';
  if(r.tipo==='pieno') return 'background:'+_pfCss(r.c);
  if(r.tipo==='sfumato'){
    const st=r.gs.map(g=>`${_pfCss(g.c)} ${g.pos}%`).join(',');
    return r.radiale?`background:radial-gradient(circle,${st})`:`background:linear-gradient(${r.ang+90}deg,${st})`;
  }
  return '';
}
function _pfLinea(ln,T,ph){
  if(!ln) return null;
  const w=_pfN(ln,'w',12700);
  let c=null, nessuna=false;
  for(const x of ln.children){
    if(x.localName==='noFill') nessuna=true;
    else if(x.localName==='solidFill') c=_pfColoreDi(x,T,ph);
    else if(x.localName==='gradFill'){ const g=_pfRiempimento(x,T,ph); if(g&&g.gs) c=g.gs[0].c; }
  }
  if(nessuna) return {nessuna:true};
  const d=_pf(ln,'prstDash'), dash=d?_pfA(d,'val','solid'):'solid';
  return {w, c, dash};
}

/* ---------- le geometrie: un tracciato SVG dentro al riquadro w×h ---------- */
function _pfAdj(prstEl,nome,def){
  const av=_pf(prstEl,'avLst'); if(!av) return def;
  for(const g of _pfs(av,'gd')) if(_pfA(g,'name')===nome){ const m=/val\s+(-?\d+)/.exec(_pfA(g,'fmla','')); if(m) return +m[1]; }
  return def;
}
function _pfTracciato(prst,w,h,el){
  const ss=Math.min(w,h), P=pts=>'M'+pts.map(p=>p.map(v=>+v.toFixed(2)).join(' ')).join('L')+'Z';
  const a=(n,d)=>_pfAdj(el,n,d);
  switch(prst){
    case 'rect': case 'flowChartProcess': case 'snip1Rect': case 'snip2SameRect': case 'snipRoundRect': case 'round1Rect': case 'round2SameRect':
      if(prst==='rect'||prst==='flowChartProcess') return P([[0,0],[w,0],[w,h],[0,h]]);
      { const r=ss*a('adj1',16667)/100000; return `M${r} 0H${w-r}Q${w} 0 ${w} ${r}V${h-r}Q${w} ${h} ${w-r} ${h}H${r}Q0 ${h} 0 ${h-r}V${r}Q0 0 ${r} 0Z`; }
    case 'roundRect': case 'flowChartAlternateProcess': {
      const r=Math.min(ss/2,ss*a('adj',16667)/100000);
      return `M${r} 0H${w-r}A${r} ${r} 0 0 1 ${w} ${r}V${h-r}A${r} ${r} 0 0 1 ${w-r} ${h}H${r}A${r} ${r} 0 0 1 0 ${h-r}V${r}A${r} ${r} 0 0 1 ${r} 0Z`; }
    case 'ellipse': case 'flowChartConnector':
      return `M0 ${h/2}A${w/2} ${h/2} 0 1 1 ${w} ${h/2}A${w/2} ${h/2} 0 1 1 0 ${h/2}Z`;
    case 'triangle': { const x=w*a('adj',50000)/100000; return P([[x,0],[w,h],[0,h]]); }
    case 'rtTriangle': return P([[0,0],[w,h],[0,h]]);
    case 'diamond': case 'flowChartDecision': return P([[w/2,0],[w,h/2],[w/2,h],[0,h/2]]);
    case 'parallelogram': { const x=ss*a('adj',25000)/100000; return P([[x,0],[w,0],[w-x,h],[0,h]]); }
    case 'trapezoid': { const x=ss*a('adj',25000)/100000; return P([[x,0],[w-x,0],[w,h],[0,h]]); }
    case 'pentagon': return P([[w/2,0],[w,h*0.38],[w*0.81,h],[w*0.19,h],[0,h*0.38]]);
    case 'hexagon': { const x=ss*a('adj',25000)/100000; return P([[x,0],[w-x,0],[w,h/2],[w-x,h],[x,h],[0,h/2]]); }
    case 'octagon': { const x=ss*a('adj',29289)/100000; return P([[x,0],[w-x,0],[w,x],[w,h-x],[w-x,h],[x,h],[0,h-x],[0,x]]); }
    case 'homePlate': { const x=w-ss*a('adj',50000)/100000; return P([[0,0],[x,0],[w,h/2],[x,h],[0,h]]); }
    case 'chevron': { const x=ss*a('adj',50000)/100000; return P([[0,0],[w-x,0],[w,h/2],[w-x,h],[0,h],[x,h/2]]); }
    case 'rightArrow': case 'leftArrow': case 'upArrow': case 'downArrow': {
      const vert=prst==='upArrow'||prst==='downArrow', L=vert?h:w, S=vert?w:h;
      const t=S*a('adj1',50000)/100000, hl=Math.min(L,ss*a('adj2',50000)/100000), y0=(S-t)/2;
      let pts=[[0,y0],[L-hl,y0],[L-hl,0],[L,S/2],[L-hl,S],[L-hl,y0+t],[0,y0+t]];
      if(prst==='leftArrow') pts=pts.map(([x,y])=>[L-x,y]);
      if(vert){ pts=pts.map(([x,y])=>[y,x]); if(prst==='upArrow') pts=pts.map(([x,y])=>[x,h-y]); }
      return P(pts); }
    case 'leftRightArrow': { const t=h*a('adj1',50000)/100000, hl=Math.min(w/2,ss*a('adj2',50000)/100000), y0=(h-t)/2;
      return P([[0,h/2],[hl,0],[hl,y0],[w-hl,y0],[w-hl,0],[w,h/2],[w-hl,h],[w-hl,y0+t],[hl,y0+t],[hl,h]]); }
    case 'frame': { const t=ss*a('adj1',12500)/100000;
      return `M0 0H${w}V${h}H0Z M${t} ${t}V${h-t}H${w-t}V${t}Z`; }
    case 'donut': { const t=ss*a('adj',25000)/100000, rx=w/2, ry=h/2, ix=rx-t, iy=ry-t;
      return `M0 ${ry}A${rx} ${ry} 0 1 1 ${w} ${ry}A${rx} ${ry} 0 1 1 0 ${ry}Z M${t} ${ry}A${ix} ${iy} 0 1 0 ${w-t} ${ry}A${ix} ${iy} 0 1 0 ${t} ${ry}Z`; }
    case 'plus': case 'mathPlus': { const t=ss*a('adj',25000)/100000;
      return P([[t,0],[w-t,0],[w-t,t],[w,t],[w,h-t],[w-t,h-t],[w-t,h],[t,h],[t,h-t],[0,h-t],[0,t],[t,t]].map(([x,y])=>[x,y])); }
    case 'star5': case 'star4': case 'star6': case 'star8': case 'star10': case 'star12': case 'star16': case 'star24': case 'star32': {
      const n=+prst.slice(4), inn=n===4?0.38:n===5?0.38:0.5, pts=[];
      for(let k=0;k<n*2;k++){ const ang=-Math.PI/2+k*Math.PI/n, r=k%2?inn:1; pts.push([w/2+Math.cos(ang)*w/2*r, h/2+Math.sin(ang)*h/2*r]); }
      return P(pts); }
    case 'heart': return `M${w/2} ${h*0.25}C${w/2} 0 0 0 0 ${h*0.3}C0 ${h*0.6} ${w/2} ${h*0.8} ${w/2} ${h}C${w/2} ${h*0.8} ${w} ${h*0.6} ${w} ${h*0.3}C${w} 0 ${w/2} 0 ${w/2} ${h*0.25}Z`;
    case 'line': case 'straightConnector1': case 'bentConnector2': case 'bentConnector3': case 'curvedConnector3':
      return `M0 0L${w} ${h}`;
    case 'wedgeRectCallout': case 'wedgeRoundRectCallout': case 'wedgeEllipseCallout': case 'cloudCallout': case 'cloud':
      if(prst==='wedgeEllipseCallout'||prst==='cloud'||prst==='cloudCallout') return `M0 ${h/2}A${w/2} ${h/2} 0 1 1 ${w} ${h/2}A${w/2} ${h/2} 0 1 1 0 ${h/2}Z`;
      { const r=prst==='wedgeRoundRectCallout'?ss*0.16:0;
        return r?`M${r} 0H${w-r}A${r} ${r} 0 0 1 ${w} ${r}V${h-r}A${r} ${r} 0 0 1 ${w-r} ${h}H${r}A${r} ${r} 0 0 1 0 ${h-r}V${r}A${r} ${r} 0 0 1 ${r} 0Z`:P([[0,0],[w,0],[w,h],[0,h]]); }
    default: return P([[0,0],[w,0],[w,h],[0,h]]);
  }
}
/* una forma disegnata a mano (a:custGeom) */
function _pfTracciatoLibero(cg,w,h){
  const lst=_pf(cg,'pathLst'); if(!lst) return '';
  let d='';
  for(const p of _pfs(lst,'path')){
    const pw=_pfN(p,'w',0)||w, ph=_pfN(p,'h',0)||h, sx=w/pw, sy=h/ph;
    const pt=e=>{ const q=_pf(e,'pt')||e; return (_pfN(q,'x',0)*sx).toFixed(2)+' '+(_pfN(q,'y',0)*sy).toFixed(2); };
    for(const c of p.children){
      const k=c.localName, pts=_pfs(c,'pt');
      if(k==='moveTo') d+='M'+pt(c);
      else if(k==='lnTo') d+='L'+pt(c);
      else if(k==='cubicBezTo') d+='C'+pts.map(q=>(_pfN(q,'x',0)*sx).toFixed(2)+' '+(_pfN(q,'y',0)*sy).toFixed(2)).join(' ');
      else if(k==='quadBezTo') d+='Q'+pts.map(q=>(_pfN(q,'x',0)*sx).toFixed(2)+' '+(_pfN(q,'y',0)*sy).toFixed(2)).join(' ');
      else if(k==='close') d+='Z';
      else if(k==='arcTo'){ /* un arco: lo approssimo con una linea fino al suo punto finale */
        d+=''; }
    }
  }
  return d;
}

/* ---------- l'ombra ---------- */
function _pfOmbra(spPr,T){
  const ef=_pf(spPr,'effectLst'); if(!ef) return '';
  const o=_pf(ef,'outerShdw'); if(!o) return '';
  const c=_pfColoreDi(o,T,null)||{rgb:[0,0,0],a:0.4};
  const dist=_pfN(o,'dist',0), dir=_pfN(o,'dir',0)/60000*Math.PI/180, blur=_pfN(o,'blurRad',0);
  return {dx:Math.cos(dir)*dist, dy:Math.sin(dir)*dist, blur, c};
}

/* ---------- il testo, con tutto quello che eredita ---------- */
function _pfLivello(lst,lv){ return lst?_pf(lst,'lvl'+(lv+1)+'pPr'):null; }
/* le proprietà di un capoverso e del suo testo, una sopra l'altra (dalla più generale alla più precisa) */
function _pfUnisciP(dst,el,T){
  if(!el) return dst;
  ['algn','marL','indent','rtl','fontAlgn'].forEach(k=>{ const v=el.getAttribute(k); if(v!=null) dst[k]=v; });
  const sp=(n)=>{ const x=_pf(el,n); if(!x) return undefined; const pc=_pf(x,'spcPct'), pt=_pf(x,'spcPts');
    return pc?{pct:_pfN(pc,'val',100000)/100000}:pt?{pt:_pfN(pt,'val',0)/100}:undefined; };
  const ls=sp('lnSpc'), sb=sp('spcBef'), sa=sp('spcAft');
  if(ls) dst.lnSpc=ls; if(sb) dst.spcBef=sb; if(sa) dst.spcAft=sa;
  if(_pf(el,'buNone')) dst.bu={tipo:'nessuno'};
  const bc=_pf(el,'buChar'), ba=_pf(el,'buAutoNum'), bb=_pf(el,'buBlip');
  if(bc) dst.bu={tipo:'car',car:_pfA(bc,'char','•')};
  if(ba) dst.bu={tipo:'num',t:_pfA(ba,'type','arabicPeriod'),da:_pfN(ba,'startAt',1)};
  if(bb) dst.bu={tipo:'car',car:'•'};
  const bclr=_pf(el,'buClr'); if(bclr) dst.buClr=_pfColoreDi(bclr,T,null);
  const bsz=_pf(el,'buSzPct'); if(bsz) dst.buSz=_pfN(bsz,'val',100000)/100000;
  const bf=_pf(el,'buFont'); if(bf) dst.buFont=_pfA(bf,'typeface','');
  if(_pf(el,'buClrTx')) delete dst.buClr;
  const d=_pf(el,'defRPr'); if(d) dst.r=_pfUnisciR(Object.assign({},dst.r||{}),d,T);
  return dst;
}
function _pfUnisciR(dst,el,T){
  if(!el) return dst;
  ['sz','b','i','u','strike','cap','baseline','spc'].forEach(k=>{ const v=el.getAttribute(k); if(v!=null) dst[k]=v; });
  for(const c of el.children){
    const k=c.localName;
    if(k==='solidFill'){ const x=_pfColoreDi(c,T,null); if(x) dst.col=x; }
    else if(k==='gradFill'){ const g=_pfRiempimento(c,T,null); if(g&&g.gs) dst.col=g.gs[0].c; }
    else if(k==='noFill') dst.col={rgb:[0,0,0],a:0};
    else if(k==='latin'){ const f=_pfA(c,'typeface',''); if(f){ dst.font=f; dst.pf=_pfN(c,'pitchFamily',-1); } }
    else if(k==='ln'){ const l=_pfLinea(c,T,null); dst.contorno=l&&!l.nessuna&&l.c?l:null; }
    else if(k==='highlight'){ const x=_pfColoreDi(c,T,null); if(x) dst.evid=x; }
    else if(k==='effectLst'){ const o=_pf(c,'outerShdw'); if(o){ const cc=_pfColoreDi(o,T,null)||{rgb:[0,0,0],a:.5};
      const dist=_pfN(o,'dist',0), dir=_pfN(o,'dir',0)/60000*Math.PI/180; dst.ombra={dx:Math.cos(dir)*dist,dy:Math.sin(dir)*dist,blur:_pfN(o,'blurRad',0),c:cc}; } }
  }
  return dst;
}
function _pfFont(f,T,titolo,pf){
  if(!f) f=titolo?T.fontMaj:T.fontMin;
  if(f==='+mj-lt') f=T.fontMaj; else if(f==='+mn-lt') f=T.fontMin;
  if(!f) return "Calibri,'Helvetica Neue',Arial,sans-serif";
  const alt={'Calibri':"'Helvetica Neue',Arial",'Calibri Light':"'Helvetica Neue',Arial",'Cambria':"Georgia,'Times New Roman'",
    'Candara':"Optima,'Helvetica Neue'",'Century Gothic':"Futura,'Avenir Next'",'Segoe UI':"'Helvetica Neue',Arial",'Aptos':"'Helvetica Neue',Arial",
    'Franklin Gothic Medium':"'Avenir Next',Arial",'Gill Sans MT':"'Gill Sans',Optima",'Tw Cen MT':"Futura,'Avenir Next'",'Book Antiqua':"Palatino,Georgia",
    'Garamond':"Garamond,'Times New Roman'",'Trebuchet MS':"'Trebuchet MS',Verdana",'Tahoma':"Tahoma,Verdana",
    'Constantia':"Georgia,'Times New Roman'",'Bookman Old Style':"Georgia,'Times New Roman'",'Century Schoolbook':"Georgia,'Times New Roman'",
    'Rockwell':"Georgia,'Times New Roman'",'Perpetua':"Palatino,Georgia",'Baskerville Old Face':"Baskerville,Georgia",'Bodoni MT':"Didot,Georgia",
    'Corbel':"'Avenir Next',Optima",'Arial Black':"'Arial Black','Helvetica Neue'",'Impact':"Impact,'Arial Black'",'Comic Sans MS':"'Comic Sans MS','Chalkboard SE'",
    'Monotype Corsiva':"'Apple Chancery','Snell Roundhand',cursive",'Lucida Handwriting':"'Apple Chancery','Snell Roundhand',cursive",
    'Brush Script MT':"'Brush Script MT','Snell Roundhand',cursive",'Edwardian Script ITC':"'Snell Roundhand',cursive"};
  /* un carattere che l'iPad non ha: al suo posto uno dello stesso tipo — lo dice il file stesso
     (pitchFamily: 1x con le grazie, 2x senza, 3x a spaziatura fissa, 4x corsivo a mano); se non lo dice,
     lo capisco dal nome, e se il nome non dice niente uso uno con le grazie, come fa il Mac */
  const fam=pf>=0?(pf>>4):-1;
  const sans=/sans|arial|helvetica|gothic|verdana|tahoma|segoe|calibri|candara|corbel|futura|avenir|optima|gill|franklin|trebuchet|lucida sans|century gothic|myriad|frutiger|univers|montserrat|roboto|open sans|lato/i.test(f);
  const gen=fam===2?'sans-serif':fam===3?'monospace':fam===4?'cursive':fam===1?'serif':
    /script|corsiva|handwriting|brush/i.test(f)?'cursive':/courier|mono|consolas/i.test(f)?'monospace':sans?'sans-serif':'serif';
  return `'${f.replace(/'/g,'')}',${alt[f]||''}${alt[f]?',':''}${gen}`;
}
function _pfNumero(n,t){
  const lett=k=>{ let s=''; k--; do{ s=String.fromCharCode(97+k%26)+s; k=Math.floor(k/26)-1; }while(k>=0); return s; };
  const rom=k=>{ const v=[[1000,'m'],[900,'cm'],[500,'d'],[400,'cd'],[100,'c'],[90,'xc'],[50,'l'],[40,'xl'],[10,'x'],[9,'ix'],[5,'v'],[4,'iv'],[1,'i']];
    let s=''; v.forEach(([a,b])=>{ while(k>=a){ s+=b; k-=a; } }); return s; };
  let b=/alpha/i.test(t)?lett(n):/roman/i.test(t)?rom(n):String(n);
  if(/Uc/.test(t)) b=b.toUpperCase();
  if(/ParenBoth/.test(t)) return '('+b+')';
  if(/ParenR/.test(t)) return b+')';
  if(/Period/.test(t)) return b+'.';
  return b;
}
/* il corpo del testo di una forma → html; K = pixel per EMU, eredi = [liste di stili dal più generale] */
function _pfTesto(txBody,T,K,eredi,titolo,scalaAuto,ridLin,colRif){
  const lst=_pf(txBody,'lstStyle');
  const contatori={};
  let h='';
  for(const p of _pfs(txBody,'p')){
    const pPr=_pf(p,'pPr'), lv=_pfN(pPr,'lvl',0);
    const P={r:{}};
    eredi.forEach(l=>_pfUnisciP(P,_pfLivello(l,lv),T));
    /* il colore dello stile della forma (fontRef) vale più di quello generale del modello */
    if(colRif) P.r.col=colRif;
    _pfUnisciP(P,_pfLivello(lst,lv),T);
    _pfUnisciP(P,pPr,T);
    const runs=[];
    for(const c of p.children){
      const k=c.localName;
      if(k==='r'||k==='fld'){ const R=_pfUnisciR(Object.assign({},P.r),_pf(c,'rPr'),T); const t=_pf(c,'t'); runs.push({t:t?t.textContent:'',R}); }
      else if(k==='br'){ const R=_pfUnisciR(Object.assign({},P.r),_pf(c,'rPr'),T); runs.push({br:true,R}); }
    }
    const fine=_pfUnisciR(Object.assign({},P.r),_pf(p,'endParaRPr'),T);
    const sz0=(runs.find(r=>r.t)||{R:fine}).R.sz;
    const pxDi=R=>((+R.sz||+sz0||1800)/100)*12700*K*scalaAuto;
    const pxP=pxDi(runs.length?runs[0].R:fine);
    const vuoto=!runs.some(r=>r.t);
    /* il capoverso */
    const st=[];
    const al={ctr:'center',r:'right',just:'justify',justLow:'justify',dist:'justify'}[P.algn];
    if(al) st.push('text-align:'+al);
    const marL=(+P.marL||0)*K, ind=(+P.indent||0)*K;
    if(marL) st.push('padding-left:'+marL.toFixed(1)+'px');
    if(ind) st.push('text-indent:'+ind.toFixed(1)+'px');
    let lh=1.2;
    if(P.lnSpc){ if(P.lnSpc.pct!=null) lh=1.2*P.lnSpc.pct*(1-(ridLin||0)); else lh=null; }
    else if(ridLin) lh=1.2*(1-ridLin);
    st.push(lh!=null?'line-height:'+lh.toFixed(3):'line-height:'+(P.lnSpc.pt*12700*K*scalaAuto).toFixed(1)+'px');
    const spc=(s)=>s?(s.pct!=null?s.pct*pxP:s.pt*12700*K*scalaAuto):0;
    const sb=spc(P.spcBef), sa=spc(P.spcAft);
    if(sb) st.push('margin-top:'+sb.toFixed(1)+'px'); if(sa) st.push('margin-bottom:'+sa.toFixed(1)+'px');
    st.push('font-size:'+pxP.toFixed(1)+'px');
    /* il pallino o il numero */
    let bu='';
    if(P.bu && P.bu.tipo!=='nessuno' && !vuoto){
      let car;
      if(P.bu.tipo==='num'){ const k='l'+lv; contatori[k]=contatori[k]==null?P.bu.da:contatori[k]+1; car=_pfNumero(contatori[k],P.bu.t); }
      else car=_pallino(P.bu.car);
      const R0=runs.find(r=>r.t)?.R||fine;
      const bcol=P.buClr?_pfCss(P.buClr):(R0.col?_pfCss(R0.col):'');
      const bsz=pxDi(R0)*(P.buSz||1);
      const larg=ind<0?-ind:Math.max(bsz*0.8,4);
      bu=`<span style="display:inline-block;text-indent:0;width:${larg.toFixed(1)}px;font-size:${bsz.toFixed(1)}px;${bcol?'color:'+bcol+';':''}${P.buFont&&!/symbol|wingdings/i.test(P.buFont)?'font-family:'+_pfFont(P.buFont,T,titolo)+';':''}">${esc(car)}</span>`;
    } else Object.keys(contatori).forEach(k=>{ if(+k.slice(1)>=lv) delete contatori[k]; });
    const pezzi=runs.map(u=>{
      if(u.br) return '<br>';
      if(!u.t) return '';
      const R=u.R, s=[];
      s.push('font-size:'+pxDi(R).toFixed(1)+'px');
      s.push('font-family:'+_pfFont(R.font,T,titolo,R.pf));
      if(R.b==='1'||R.b==='true') s.push('font-weight:bold');
      if(R.i==='1'||R.i==='true') s.push('font-style:italic');
      const dec=[]; if(R.u&&R.u!=='none') dec.push('underline'); if(R.strike&&R.strike!=='noStrike') dec.push('line-through');
      if(dec.length) s.push('text-decoration:'+dec.join(' '));
      if(R.cap==='all') s.push('text-transform:uppercase'); else if(R.cap==='small') s.push('font-variant:small-caps');
      s.push('color:'+(R.col?_pfCss(R.col):'#000'));
      if(R.evid) s.push('background:'+_pfCss(R.evid));
      if(R.spc) s.push('letter-spacing:'+((+R.spc/100)*12700*K*scalaAuto).toFixed(2)+'px');
      if(R.contorno) s.push(`-webkit-text-stroke:${Math.max(0.3,(R.contorno.w||12700)*K*scalaAuto*0.5).toFixed(2)}px ${_pfCss(R.contorno.c)};paint-order:stroke fill`);
      if(R.ombra) s.push(`text-shadow:${(R.ombra.dx*K).toFixed(1)}px ${(R.ombra.dy*K).toFixed(1)}px ${(R.ombra.blur*K).toFixed(1)}px ${_pfCss(R.ombra.c)}`);
      let t=esc(u.t);
      if(R.baseline&&+R.baseline>0) t=`<sup>${t}</sup>`; else if(R.baseline&&+R.baseline<0) t=`<sub>${t}</sub>`;
      return `<span style="${s.join(';')}">${t}</span>`;
    }).join('');
    h+=`<p style="${st.join(';')}">${bu}${pezzi||'<br>'}</p>`;
  }
  return h;
}

/* ---------- una diapositiva intera ---------- */
/* le forme di un albero (slide, layout o modello) → html; salta i segnaposto quando serve */
async function _pfForme(cont,C,t,soloFisse){
  let h='';
  for(const f of [...cont.children]){
    const k=f.localName;
    if(k==='sp'||k==='cxnSp'){
      const nv=_pf(f,'nvSpPr')||_pf(f,'nvCxnSpPr'), ph=nv&&_pfGiu(nv,'ph');
      if(soloFisse && ph) continue;
      h+=await _pfForma(f,C,t,ph);
    } else if(k==='pic'){
      const ph=_pfGiu(_pf(f,'nvPicPr'),'ph');
      if(soloFisse && ph) continue;
      h+=await _pfImmagine(f,C,t);
    } else if(k==='grpSp'){
      const gp=_pf(f,'grpSpPr'), xf=_pf(gp,'xfrm');
      const off=_pf(xf,'off'), ext=_pf(xf,'ext'), cOff=_pf(xf,'chOff'), cExt=_pf(xf,'chExt');
      if(!off||!ext||!cOff||!cExt){ h+=await _pfForme(f,C,t,soloFisse); continue; }
      const g=applicaTrasf(t,{x:_pfN(off,'x',0),y:_pfN(off,'y',0),cx:_pfN(ext,'cx',0),cy:_pfN(ext,'cy',0)});
      const sx=g.w/(_pfN(cExt,'cx',1)||1), sy=g.h/(_pfN(cExt,'cy',1)||1);
      h+=await _pfForme(f,C,{tx:g.x-_pfN(cOff,'x',0)*sx, ty:g.y-_pfN(cOff,'y',0)*sy, sx, sy},soloFisse);
    } else if(k==='graphicFrame'){
      h+=await _pfTabella(f,C,t);
    } else if(k==='AlternateContent'){
      const sc=_pf(f,'Choice')||_pf(f,'Fallback'); if(sc) h+=await _pfForme(sc,C,t,soloFisse);
    }
  }
  return h;
}
/* il segnaposto corrispondente nel layout e nel modello (per posizione, testo e stile ereditati) */
function _pfSegnaposto(C,ph){
  if(!ph) return {lay:null,mas:null};
  const tipo=_pfA(ph,'type','body'), idx=_pfA(ph,'idx','');
  const cerca=(lista)=>{ if(!lista) return null;
    let m=lista.find(p=>p.tipo===tipo&&p.idx===idx&&idx!=='');
    if(!m && idx!=='') m=lista.find(p=>p.idx===idx);
    if(!m) m=lista.find(p=>p.tipo===tipo);
    if(!m && (tipo==='ctrTitle'||tipo==='title')) m=lista.find(p=>p.tipo==='title'||p.tipo==='ctrTitle');
    if(!m && tipo==='subTitle') m=lista.find(p=>p.tipo==='body');
    if(!m && (tipo==='body'||tipo==='obj')) m=lista.find(p=>p.tipo==='body'||p.tipo==='obj');
    return m; };
  return {lay:cerca(C.phLay), mas:cerca(C.phMas)};
}
function _pfPh(doc){
  const out=[];
  if(!doc) return out;
  for(const sp of doc.getElementsByTagNameNS('*','sp')){
    const nv=_pf(sp,'nvSpPr'), ph=nv&&_pfGiu(nv,'ph'); if(!ph) continue;
    out.push({tipo:_pfA(ph,'type','body'), idx:_pfA(ph,'idx',''), sp});
  }
  return out;
}
function _pfXfrm(sp){ const spPr=_pf(sp,'spPr'), xf=_pf(spPr,'xfrm'); if(!xf) return null;
  const off=_pf(xf,'off'), ext=_pf(xf,'ext'); if(!off||!ext) return null;
  return {x:_pfN(off,'x',0),y:_pfN(off,'y',0),cx:_pfN(ext,'cx',0),cy:_pfN(ext,'cy',0),
          rot:_pfN(xf,'rot',0)/60000, fh:_pfA(xf,'flipH')==='1', fv:_pfA(xf,'flipV')==='1'}; }
async function _pfForma(sp,C,t,ph){
  const T=C.T, K=C.K;
  const seg=_pfSegnaposto(C,ph);
  let xf=_pfXfrm(sp)||(seg.lay&&_pfXfrm(seg.lay.sp))||(seg.mas&&_pfXfrm(seg.mas.sp));
  if(!xf) return '';
  const b=applicaTrasf(t,xf); if(b.w<0.5&&b.h<0.5) return '';
  const spPr=_pf(sp,'spPr'), sr=_pfStileRif(sp,T);
  /* il riempimento: suo, se no quello del segnaposto, se no dallo stile del tema */
  let fill=_pfRiempimentoDi(spPr,T,null);
  if(!fill && seg.lay) fill=_pfRiempimentoDi(_pf(seg.lay.sp,'spPr'),T,null);
  if(!fill && seg.mas) fill=_pfRiempimentoDi(_pf(seg.mas.sp,'spPr'),T,null);
  if(!fill && sr.fill && sr.fill.idx>0){ const x=T.riemp[Math.min(sr.fill.idx,T.riemp.length)-1]; fill=x?_pfRiempimento(x,T,sr.fill.c):null;
    if(fill&&fill.tipo==='nessuno') fill=null; if(!fill && sr.fill.c) fill={tipo:'pieno',c:sr.fill.c}; }
  let ln=_pfLinea(_pf(spPr,'ln'),T,sr.ln&&sr.ln.c);
  if((!ln||(!ln.c&&!ln.nessuna)) && sr.ln && sr.ln.idx>0){ const x=T.linee[Math.min(sr.ln.idx,T.linee.length)-1]; const l2=_pfLinea(x,T,sr.ln.c);
    if(l2) ln=Object.assign({},l2,ln&&ln.w?{w:ln.w}:{},ln&&ln.dash?{dash:ln.dash}:{}); if(ln&&!ln.c) ln.c=sr.ln.c; }
  const cx=sp.localName==='cxnSp';
  /* la geometria */
  const pg=_pf(spPr,'prstGeom'), cg=_pf(spPr,'custGeom');
  const prst=pg?_pfA(pg,'prst','rect'):(cx?'line':'rect');
  const d=cg?_pfTracciatoLibero(cg,b.w,b.h):_pfTracciato(prst,b.w,b.h,pg);
  const defs=[];
  let fillCss=_pfCssRiempimento(fill,defs);
  if(fill&&fill.tipo==='immagine'){
    const id=await _pfSalvaBlip(fill.el,C,fill.ph);
    if(id){ const pid='pp'+(++_pfUid); defs.push(`<pattern id="${pid}" patternUnits="userSpaceOnUse" width="${b.w}" height="${b.h}"><image href="__PF_${id}__" width="${b.w}" height="${b.h}" preserveAspectRatio="none"/></pattern>`); fillCss=`url(#${pid})`; }
    else fillCss='none';
  }
  if(cx||prst==='line') fillCss='none';
  const lw=ln&&!ln.nessuna&&ln.c?Math.max(0.5,(ln.w||12700)*K):0;
  const dash=ln&&ln.dash&&ln.dash!=='solid'?` stroke-dasharray="${/dot/i.test(ln.dash)?`${lw} ${lw*2}`:`${lw*4} ${lw*3}`}"`:'';
  const ombra=_pfOmbra(spPr,T);
  const flip=(xf.fh||xf.fv)?` transform="translate(${xf.fh?b.w:0} ${xf.fv?b.h:0}) scale(${xf.fh?-1:1} ${xf.fv?-1:1})"`:'';
  let svg='';
  if(fillCss!=='none'||lw) svg=`<svg class="pf-g" viewBox="0 0 ${b.w.toFixed(2)} ${b.h.toFixed(2)}" preserveAspectRatio="none">${defs.length?'<defs>'+defs.join('')+'</defs>':''}<path d="${d}" fill="${fillCss}"${lw?` stroke="${_pfCss(ln.c)}" stroke-width="${lw.toFixed(2)}"${dash}`:''} stroke-linejoin="round" fill-rule="evenodd"${flip}/></svg>`;
  /* il testo */
  let testo='';
  const tx=_pf(sp,'txBody');
  if(tx && [...tx.getElementsByTagNameNS('*','t')].some(x=>x.textContent.length)){
    const tipo=ph?_pfA(ph,'type','body'):null, titolo=tipo==='title'||tipo==='ctrTitle';
    const stileMaster=ph?(titolo?C.txTit:(tipo==='body'||tipo==='subTitle'||tipo==='obj'||!tipo?C.txBody:C.txAltro)):C.txAltro;
    const eredi=[C.defTesto,stileMaster];
    if(seg.mas) eredi.push(_pfGiu(_pf(seg.mas.sp,'txBody'),'lstStyle'));
    if(seg.lay) eredi.push(_pfGiu(_pf(seg.lay.sp,'txBody'),'lstStyle'));
    const bp=_pf(tx,'bodyPr'), bpL=seg.lay&&_pfGiu(_pf(seg.lay.sp,'txBody'),'bodyPr'), bpM=seg.mas&&_pfGiu(_pf(seg.mas.sp,'txBody'),'bodyPr');
    const att=(n,d)=>{ for(const e of [bp,bpL,bpM]){ const v=e&&e.getAttribute(n); if(v!=null) return v; } return d; };
    const ins=['lIns','tIns','rIns','bIns'].map((n,k)=>(+att(n,k%2?45720:91440))*K);
    const anc=att('anchor','t'), wrap=att('wrap','square'), vert=att('vert','horz');
    const af=_pf(bp,'normAutofit'), scala=af?(_pfN(af,'fontScale',100000)/100000):1, rid=af?(_pfN(af,'lnSpcReduction',0)/100000):0;
    /* il colore di partenza del testo (quando nessuno stile ne scrive uno): dallo stile del tema
       se la forma ne ha uno, se no il colore «testo 1» del tema (bianco nei temi scuri) */
    const colBase=sr.font&&sr.font.c?_pfCss(sr.font.c):_pfCss(_pfColoreEl(_pfSchema('tx1'),T,null));
    const corpo=_pfTesto(tx,T,K,eredi,titolo,scala,rid,!ph&&sr.font&&sr.font.c?sr.font.c:null).replace(/color:#000(?=[;"])/g,'color:'+colBase);
    /* PowerPoint scrive dentro al «rettangolo del testo» della forma: in un ovale è il rettangolo
       inscritto, in un arrotondato si stacca dagli angoli, in un rombo sta nel mezzo… */
    const ss=Math.min(b.w,b.h), rt={ellipse:[0.1464*b.w,0.1464*b.h,0.1464*b.w,0.1464*b.h],
      roundRect:(()=>{ const r=Math.min(ss/2,ss*_pfAdj(pg,'adj',16667)/100000)*0.29289; return [r,r,r,r]; })(),
      diamond:[b.w/4,b.h/4,b.w/4,b.h/4], triangle:[b.w/4,b.h/2,b.w/4,0], rtTriangle:[b.w/12,b.h*7/12,b.w*5/12,b.h/12],
      frame:(()=>{ const t=ss*_pfAdj(pg,'adj1',12500)/100000; return [t,t,t,t]; })(),
      hexagon:[b.w*0.15,b.h*0.1,b.w*0.15,b.h*0.1], octagon:[b.w*0.15,b.h*0.15,b.w*0.15,b.h*0.15],
      homePlate:[0,0,b.w*0.25,0], chevron:[b.w*0.25,0,b.w*0.25,0], pentagon:[b.w*0.19,b.h*0.3,b.w*0.19,0]}[prst];
    if(rt && !cg) for(let k=0;k<4;k++) ins[k]+=rt[k];
    const giust=anc==='ctr'?'center':anc==='b'?'flex-end':'flex-start';
    const rotT=vert==='vert'?'writing-mode:vertical-rl;':vert==='vert270'?'writing-mode:vertical-rl;transform:rotate(180deg);':'';
    testo=`<div class="pf-t" style="padding:${[ins[1],ins[2],ins[3],ins[0]].map(v=>v.toFixed(1)+'px').join(' ')};justify-content:${giust};${wrap==='none'?'white-space:nowrap;':''}${rotT}">${corpo}</div>`;
  }
  if(!svg && !testo) return '';
  const tr=[]; if(xf.rot) tr.push(`rotate(${xf.rot.toFixed(2)}deg)`);
  const filt=ombra?`filter:drop-shadow(${(ombra.dx*K).toFixed(1)}px ${(ombra.dy*K).toFixed(1)}px ${(ombra.blur*K/2).toFixed(1)}px ${_pfCss(ombra.c)});`:'';
  return `<div class="pf" style="left:${b.x.toFixed(1)}px;top:${b.y.toFixed(1)}px;width:${b.w.toFixed(1)}px;height:${b.h.toFixed(1)}px;${tr.length?'transform:'+tr.join(' ')+';':''}${filt}">${svg}${testo}</div>`;
}
/* un'immagine del file, salvata una volta sola anche se torna in più diapositive */
async function _pfSalvaBlip(blipFill,C,ph){
  const blip=_pf(blipFill,'blip'); if(!blip) return null;
  const rid=blip.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships','embed')||blip.getAttribute('r:embed');
  const target=rid&&C.rel[rid]; const perc=target&&risolviPercorsoZip(C.percorso,target);
  if(!perc) return null;
  /* la «bicromia» di PowerPoint (duotone): l'immagine ricolorata fra due colori, dal più scuro al più chiaro */
  const duo=_pf(blip,'duotone'), cols=duo?[...duo.children].map(c=>_pfColoreEl(c,C.T,ph)).filter(Boolean):[];
  const chiave=perc+(cols.length===2?'|'+cols.map(c=>c.rgb.join(',')).join('|'):'');
  if(C.salvate[chiave]!==undefined) return C.salvate[chiave];
  const ext=((perc.match(/\.(\w+)$/)||[])[1]||'').toLowerCase(), v=C.zip[perc];
  if(!v||!MIME_IMG[ext]){ C.salvate[chiave]=null; C.saltate++; return null; }
  try{
    let blob=new Blob([await decomprimiVoce(v)],{type:MIME_IMG[ext]});
    if(cols.length===2) blob=await _pfBicromia(blob,cols[0].rgb,cols[1].rgb).catch(()=>blob);
    const id='im'+uid(); await salvaAllegato(id,blob); C.salvate[chiave]=id; C.ids.add(id); return id; }
  catch(e){ C.salvate[chiave]=null; return null; }
}
async function _pfBicromia(blob,a,b){
  const im=await createImageBitmap(blob);
  const sc=Math.min(1,2400/Math.max(im.width,im.height));
  const c=document.createElement('canvas'); c.width=Math.round(im.width*sc); c.height=Math.round(im.height*sc);
  const x=c.getContext('2d'); x.drawImage(im,0,0,c.width,c.height);
  const d=x.getImageData(0,0,c.width,c.height), p=d.data;
  for(let k=0;k<p.length;k+=4){ const l=(p[k]*0.299+p[k+1]*0.587+p[k+2]*0.114)/255;
    p[k]=a[0]+(b[0]-a[0])*l; p[k+1]=a[1]+(b[1]-a[1])*l; p[k+2]=a[2]+(b[2]-a[2])*l; }
  x.putImageData(d,0,0);
  return await new Promise((ok,no)=>c.toBlob(z=>z?ok(z):no(new Error('bicromia')),'image/jpeg',0.9));
}
async function _pfImmagine(pic,C,t){
  const K=C.K, xf=_pfXfrm(pic); if(!xf) return '';
  const b=applicaTrasf(t,xf);
  const bf=_pf(pic,'blipFill'); const id=bf&&await _pfSalvaBlip(bf,C); if(!id) return '';
  const src=_pf(bf,'srcRect');
  const l=_pfN(src,'l',0)/100000, tp=_pfN(src,'t',0)/100000, r=_pfN(src,'r',0)/100000, bo=_pfN(src,'b',0)/100000;
  const iw=b.w/Math.max(0.01,1-l-r), ih=b.h/Math.max(0.01,1-tp-bo);
  const spPr=_pf(pic,'spPr'), pg=_pf(spPr,'prstGeom'), prst=pg?_pfA(pg,'prst','rect'):'rect';
  const rad=prst==='ellipse'?'border-radius:50%;':prst==='roundRect'?`border-radius:${(Math.min(b.w,b.h)*_pfAdj(pg,'adj',16667)/100000).toFixed(1)}px;`:'';
  const ln=_pfLinea(_pf(spPr,'ln'),C.T,null), lw=ln&&!ln.nessuna&&ln.c?Math.max(0.5,(ln.w||12700)*K):0;
  const ombra=_pfOmbra(spPr,C.T);
  const tr=[]; if(xf.rot) tr.push(`rotate(${xf.rot.toFixed(2)}deg)`); if(xf.fh) tr.push('scaleX(-1)'); if(xf.fv) tr.push('scaleY(-1)');
  const alfa=_pfGiu(bf,'alphaModFix'), op=alfa?_pfN(alfa,'amt',100000)/100000:1;
  return `<div class="pf pf-im" style="left:${b.x.toFixed(1)}px;top:${b.y.toFixed(1)}px;width:${b.w.toFixed(1)}px;height:${b.h.toFixed(1)}px;${rad}${lw?`box-shadow:0 0 0 ${(lw/2).toFixed(1)}px ${_pfCss(ln.c)} inset,0 0 0 ${(lw/2).toFixed(1)}px ${_pfCss(ln.c)};`:''}${tr.length?'transform:'+tr.join(' ')+';':''}${ombra?`filter:drop-shadow(${(ombra.dx*K).toFixed(1)}px ${(ombra.dy*K).toFixed(1)}px ${(ombra.blur*K/2).toFixed(1)}px ${_pfCss(ombra.c)});`:''}${op<1?'opacity:'+op+';':''}"><img src="__PF_${id}__" alt="" style="left:${(-l*iw).toFixed(1)}px;top:${(-tp*ih).toFixed(1)}px;width:${iw.toFixed(1)}px;height:${ih.toFixed(1)}px"></div>`;
}
/* le tabelle (a:tbl): righe, colonne, riempimento delle celle, bordi e testo */
async function _pfTabella(gf,C,t){
  const tbl=_pfGiu(gf,'tbl'); if(!tbl) return '';
  const xf=_pf(gf,'xfrm'), off=_pf(xf,'off'), ext=_pf(xf,'ext'); if(!off||!ext) return '';
  const b=applicaTrasf(t,{x:_pfN(off,'x',0),y:_pfN(off,'y',0),cx:_pfN(ext,'cx',0),cy:_pfN(ext,'cy',0)});
  const K=t.sx;
  const cols=_pfs(_pf(tbl,'tblGrid'),'gridCol').map(g=>_pfN(g,'w',0)*K);
  let h=`<table class="pf-tab" style="width:${cols.reduce((a,x)=>a+x,0).toFixed(1)}px"><colgroup>${cols.map(w=>`<col style="width:${w.toFixed(1)}px">`).join('')}</colgroup>`;
  for(const tr of _pfs(tbl,'tr')){
    h+=`<tr style="height:${(_pfN(tr,'h',0)*K).toFixed(1)}px">`;
    for(const tc of _pfs(tr,'tc')){
      if(_pfA(tc,'hMerge')==='1'||_pfA(tc,'vMerge')==='1') continue;
      const pr=_pf(tc,'tcPr'), f=_pfRiempimentoDi(pr,C.T,null);
      const st=['vertical-align:'+({ctr:'middle',b:'bottom'}[_pfA(pr,'anchor','t')]||'top'),
        'padding:'+[_pfN(pr,'marT',45720),_pfN(pr,'marR',91440),_pfN(pr,'marB',45720),_pfN(pr,'marL',91440)].map(v=>(v*K).toFixed(1)+'px').join(' ')];
      const sf=_pfCssSfondo(f); if(sf) st.push(sf);
      [['lnL','left'],['lnR','right'],['lnT','top'],['lnB','bottom']].forEach(([n,lato])=>{ const l=_pfLinea(_pf(pr,n),C.T,null);
        if(l&&!l.nessuna&&l.c) st.push(`border-${lato}:${Math.max(0.5,(l.w||12700)*K).toFixed(1)}px solid ${_pfCss(l.c)}`); });
      const tx=_pf(tc,'txBody');
      h+=`<td${_pfA(tc,'gridSpan')?` colspan="${_pfA(tc,'gridSpan')}"`:''}${_pfA(tc,'rowSpan')?` rowspan="${_pfA(tc,'rowSpan')}"`:''} style="${st.join(';')}">${tx?_pfTesto(tx,C.T,K,[C.defTesto,C.txAltro],false,1,0):''}</td>`;
    }
    h+='</tr>';
  }
  return `<div class="pf" style="left:${b.x.toFixed(1)}px;top:${b.y.toFixed(1)}px;width:${b.w.toFixed(1)}px;height:${b.h.toFixed(1)}px">${h}</table></div>`;
}
/* lo sfondo: p:bg con bgPr (riempimento suo) o bgRef (dal tema) */
async function _pfSfondo(doc,C,percorso,rel){
  const bg=doc&&_pfGiu(doc,'bg'); if(!bg) return null;
  const pr=_pf(bg,'bgPr'), rf=_pf(bg,'bgRef');
  let f=null;
  let dalTema=false;
  if(pr) f=_pfRiempimentoDi(pr,C.T,null);
  else if(rf){ const idx=_pfN(rf,'idx',0), c=_pfColoreDi(rf,C.T,null);
    if(idx>=1001){ const x=C.T.sfondi[idx-1001]; f=x?_pfRiempimento(x,C.T,c):null; dalTema=true; }
    else if(idx>0){ const x=C.T.riemp[idx-1]; f=x?_pfRiempimento(x,C.T,c):null; dalTema=true; }
    if(!f && c) f={tipo:'pieno',c}; }
  if(!f) return null;
  if(f.tipo==='immagine'){
    /* un'immagine che viene dal tema (bgFillStyleLst) è scritta rispetto al file del tema */
    const vecchio={rel:C.rel,percorso:C.percorso};
    if(dalTema && C.T.rel){ C.rel=C.T.rel; C.percorso=C.T.percorso; } else { C.rel=rel; C.percorso=percorso; }
    const id=await _pfSalvaBlip(f.el,C,f.ph);
    C.rel=vecchio.rel; C.percorso=vecchio.percorso;
    const tile=_pf(f.el,'tile');
    return id?(tile?`background:#fff url('__PF_${id}__') 0 0/auto repeat`:`background:#fff url('__PF_${id}__') center/100% 100% no-repeat`):null;
  }
  return _pfCssSfondo(f)||null;
}
/* il tutto: chiamata da leggiSlideXml per ogni diapositiva */
async function pptxFedele(zip,percorsoSlide,docSlide,rel,largSlide,altSlide,cache){
  const K=1280/(largSlide||12192000);
  const td=new TextDecoder();
  const apri=async p=>p&&zip[p]?new DOMParser().parseFromString(td.decode(await decomprimiVoce(zip[p])),'application/xml'):null;
  const rs=await leggiRelazioniTipizzate(zip,percorsoSlide);
  const rl=rs.find(r=>/\/slideLayout$/.test(r.tipo));
  const pLay=rl&&risolviPercorsoZip(percorsoSlide,rl.target);
  cache.lay=cache.lay||{}; cache.mas=cache.mas||{};
  if(pLay && !cache.lay[pLay]){
    const d=await apri(pLay), r2=await leggiRelazioniTipizzate(zip,pLay), rm=r2.find(r=>/\/slideMaster$/.test(r.tipo));
    cache.lay[pLay]={doc:d, rel:await leggiRelazioni(zip,pLay), mas:rm&&risolviPercorsoZip(pLay,rm.target)};
  }
  const L=pLay&&cache.lay[pLay], pMas=L&&L.mas;
  if(pMas && !cache.mas[pMas]){
    const d=await apri(pMas);
    cache.mas[pMas]={doc:d, rel:await leggiRelazioni(zip,pMas), T:await _pfTema(zip,pMas,d)};
  }
  const M=pMas&&cache.mas[pMas];
  if(!cache.pres){ cache.pres=await apri('ppt/presentation.xml')||false; }
  const T=M?M.T:{colori:{},mappa:{},fontMaj:'',fontMin:'',riemp:[],linee:[],sfondi:[]};
  /* una diapositiva o un layout possono cambiare la mappa dei colori */
  const ovr=d=>{ const o=d&&_pfGiu(d,'clrMapOvr'), m=o&&_pf(o,'overrideClrMapping'); if(!m) return null; const x={}; for(const a of m.attributes) x[a.name]=a.value; return x; };
  const Tq=Object.assign({},T,{mappa:Object.assign({},T.mappa,ovr(L&&L.doc)||{},ovr(docSlide)||{})});
  const txS=M&&_pfGiu(M.doc,'txStyles');
  const C={zip,K,T:Tq,rel,percorso:percorsoSlide,ids:cache.ids||(cache.ids=new Set()),salvate:cache.salvate||(cache.salvate={}),saltate:0,
    phLay:_pfPh(L&&L.doc), phMas:_pfPh(M&&M.doc),
    txTit:txS&&_pf(txS,'titleStyle'), txBody:txS&&_pf(txS,'bodyStyle'), txAltro:txS&&_pf(txS,'otherStyle'),
    defTesto:cache.pres?_pfGiu(cache.pres,'defaultTextStyle'):null};
  const t0={tx:0,ty:0,sx:K,sy:K};
  let h='';
  /* prima le forme fisse del modello e del layout (se la diapositiva e il layout le vogliono) */
  const mostra=d=>!d||_pfA(_pfGiu(d,'sld')||d.documentElement,'showMasterSp','1')!=='0';
  if(M && L && mostra(docSlide) && _pfA(L.doc&&L.doc.documentElement,'showMasterSp','1')!=='0'){
    const st=_pfGiu(M.doc,'spTree'); if(st){ const s0={rel:C.rel,percorso:C.percorso}; C.rel=M.rel; C.percorso=pMas; h+=await _pfForme(st,C,t0,true); C.rel=s0.rel; C.percorso=s0.percorso; }
  }
  if(L && mostra(docSlide)){
    const st=_pfGiu(L.doc,'spTree'); if(st){ const s0={rel:C.rel,percorso:C.percorso}; C.rel=L.rel; C.percorso=pLay; h+=await _pfForme(st,C,t0,true); C.rel=s0.rel; C.percorso=s0.percorso; }
  }
  const st=_pfGiu(docSlide,'spTree'); if(st) h+=await _pfForme(st,C,t0,false);
  /* lo sfondo: della diapositiva, se no del layout, se no del modello (del tema) */
  let sf=await _pfSfondo(docSlide,C,percorsoSlide,rel);
  if(!sf && L) sf=await _pfSfondo(L.doc,C,pLay,L.rel);
  if(!sf && M) sf=await _pfSfondo(M.doc,C,pMas,M.rel);
  if(!sf && M && M.T.percorso){ /* sfondo con immagine del tema */ }
  cache.saltate=(cache.saltate||0)+C.saltate;
  return {html:h, sfondo:sf||'background:#fff', alt:Math.round((altSlide||6858000)*K)};
}
/* il disegno a schermo: al posto dei segnaposto __PF_id__ metto l'indirizzo vero dell'immagine */
function htmlPptxFedele(s){
  const f=s.fedele; if(!f) return '';
  const url=id=>esc(fileUrl[id]||'');
  const h=f.html.replace(/__PF_([A-Za-z0-9]+)__/g,(m,id)=>url(id));
  const bg=(f.sfondo||'background:#fff').replace(/__PF_([A-Za-z0-9]+)__/g,(m,id)=>url(id));
  return `<div class="pptx-wrap"><div class="pptx-slide pf-slide" id="pptxSlide" style="width:1280px;height:${Math.round(f.alt||720)}px;${bg}">${h}</div></div>`;
}
