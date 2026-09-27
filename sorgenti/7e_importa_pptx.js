/* ================= IMPORTA DA POWERPOINT =================
   Un file .pptx è uno zip con dentro dei file xml, uno per diapositiva.
   Qui lo apriamo da soli (senza librerie: sul programma non ce ne sono),
   ne tiriamo fuori il testo diapositiva per diapositiva, e lo prepariamo
   come una predica/poesia/esperienza nuova, pronta da rifinire sul foglio. */

/* ---------- lo zip, letto a mano ---------- */
function leggiZip(u8){
  const dv=new DataView(u8.buffer,u8.byteOffset,u8.byteLength);
  let fine=-1;
  const min=Math.max(0,u8.length-22-65557);
  for(let i=u8.length-22;i>=min;i--){ if(dv.getUint32(i,true)===0x06054b50){ fine=i; break; } }
  if(fine<0) throw new Error('Non sembra un file .pptx valido (non trovo la fine dello zip).');
  const nVoci=dv.getUint16(fine+10,true);
  let cdOff=dv.getUint32(fine+16,true);
  const td=new TextDecoder(), file={};
  for(let k=0;k<nVoci;k++){
    if(dv.getUint32(cdOff,true)!==0x02014b50) break;
    const metodo=dv.getUint16(cdOff+10,true);
    const compLen=dv.getUint32(cdOff+20,true);
    const nomeLen=dv.getUint16(cdOff+28,true);
    const extraLen=dv.getUint16(cdOff+30,true);
    const commLen=dv.getUint16(cdOff+32,true);
    const locOff=dv.getUint32(cdOff+42,true);
    const nome=td.decode(u8.subarray(cdOff+46,cdOff+46+nomeLen));
    const locNomeLen=dv.getUint16(locOff+26,true);
    const locExtraLen=dv.getUint16(locOff+28,true);
    const datiOff=locOff+30+locNomeLen+locExtraLen;
    file[nome]={metodo,compresso:u8.subarray(datiOff,datiOff+compLen)};
    cdOff+=46+nomeLen+extraLen+commLen;
  }
  return file;
}
async function decomprimiVoce(v){
  if(!v) return null;
  if(v.metodo===0) return v.compresso;               /* «stored», già senza compressione */
  if(v.metodo!==8) throw new Error('Metodo di compressione dello zip non gestito ('+v.metodo+').');
  const ds=new DecompressionStream('deflate-raw');
  const w=ds.writable.getWriter(); w.write(v.compresso); w.close();
  return new Uint8Array(await new Response(ds.readable).arrayBuffer());
}
/* «../media/image1.png» scritto dentro a slide3.xml.rels è relativo a
   ppt/slides/: lo riporto al percorso vero dentro allo zip */
function risolviPercorsoZip(baseFile,target){
  if(/^[a-z]+:\/\//i.test(target)) return null;         /* link esterno, non incorporato: salto */
  const parti=(baseFile.replace(/\/[^/]*$/,'')+'/'+target).split('/'), out=[];
  parti.forEach(p=>{ if(p===''||p==='.') return; if(p==='..') out.pop(); else out.push(p); });
  return out.join('/');
}
async function leggiRelazioni(zip,percorsoSlide){
  const percorsoRels=percorsoSlide.replace(/^(.*)\/([^/]+)$/,'$1/_rels/$2.rels');
  const v=zip[percorsoRels]; if(!v) return {};
  const doc=new DOMParser().parseFromString(new TextDecoder().decode(await decomprimiVoce(v)),'application/xml');
  const mappa={};
  [...doc.getElementsByTagName('Relationship')].forEach(r=>{ mappa[r.getAttribute('Id')]=r.getAttribute('Target'); });
  return mappa;
}
const MIME_IMG={png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',gif:'image/gif',
  bmp:'image/bmp',webp:'image/webp',svg:'image/svg+xml'};
/* come leggiRelazioni, ma tiene anche il Type di ogni relazione — serve
   solo per trovare QUALE relazione porta al layout/al modello (le altre
   sono quasi sempre immagini), leggiRelazioni normale non lo teneva e non
   volevo cambiarla per non toccare le altre chiamate che già la usano */
async function leggiRelazioniTipizzate(zip,percorso){
  const percorsoRels=percorso.replace(/^(.*)\/([^/]+)$/,'$1/_rels/$2.rels');
  const v=zip[percorsoRels]; if(!v) return [];
  const doc=new DOMParser().parseFromString(new TextDecoder().decode(await decomprimiVoce(v)),'application/xml');
  return [...doc.getElementsByTagName('Relationship')].map(r=>
    ({id:r.getAttribute('Id'), tipo:r.getAttribute('Type')||'', target:r.getAttribute('Target')}));
}

/* ---------- il testo di una diapositiva, CON i suoi colori e caratteri —
   Ovidiu vuole che l'importazione resti identica all'originale, non solo
   le parole: grassetto, corsivo, sottolineato, colore del testo,
   allineamento ed elenchi puntati/numerati vengono presi dall'xml di ogni
   «pezzo» di testo (<a:r>) e dell'intero paragrafo (<a:pPr>), non buttati via */
function runsDiParagrafo(elP){
  return [...elP.getElementsByTagName('a:r')].map(r=>{
    const rPr=r.getElementsByTagName('a:rPr')[0];
    const t=[...r.getElementsByTagName('a:t')].map(x=>x.textContent).join('');
    let b=false,i=false,u=false,colore=null,pt=null;
    if(rPr){
      b=rPr.getAttribute('b')==='1';
      i=rPr.getAttribute('i')==='1';
      u=(rPr.getAttribute('u')||'none')!=='none';
      /* il colore sta dentro a <a:solidFill><a:srgbClr val="RRGGBB"/></a:solidFill>,
         diretto dentro a rPr — non dentro a un eventuale altro solidFill più giù
         (per esempio nello sfondo di un elenco), perciò guardo solo i figli diretti */
      const fill=[...rPr.children].find(c=>c.tagName==='a:solidFill');
      const clr=fill&&[...fill.getElementsByTagName('a:srgbClr')][0];
      if(clr) colore='#'+clr.getAttribute('val');
      /* «sz» è in centesimi di punto (es. 2400 = 24pt) — serve solo alla
         copia esatta (vedi leggiFormeEsatte): l'importazione normale nel
         foglio usa sempre la misura di lettura del programma, non questa */
      const szAttr=rPr.getAttribute('sz');
      if(szAttr) pt=(+szAttr)/100;
    }
    return {t,b,i,u,colore,pt};
  }).filter(r=>r.t);
}
/* solo il testo, senza formattazione — usato per riconoscere il titolo */
function testoParagrafi(el){
  return [...el.getElementsByTagName('a:p')].map(p=>runsDiParagrafo(p).map(r=>r.t).join(''));
}
function htmlDiRun(r){
  let h=esc(r.t);
  if(r.colore) h=`<span style="color:${esc(r.colore)}">${h}</span>`;
  if(r.u) h=`<u>${h}</u>`;
  if(r.i) h=`<i>${h}</i>`;
  if(r.b) h=`<b>${h}</b>`;
  return h;
}
const ALLINEA={ctr:'center',r:'right',just:'justify',justLow:'justify'};
function paragrafoConFormato(elP){
  const runs=runsDiParagrafo(elP);
  const testo=runs.map(r=>r.t).join('').trim();
  if(!testo) return null;
  const pPr=elP.getElementsByTagName('a:pPr')[0];
  const algn=pPr&&pPr.getAttribute('algn');
  const elenco = !!(pPr && (pPr.getElementsByTagName('a:buChar').length || pPr.getElementsByTagName('a:buAutoNum').length));
  const numerato = !!(pPr && pPr.getElementsByTagName('a:buAutoNum').length);
  return {html:runs.map(htmlDiRun).join(''), allinea:ALLINEA[algn]||null, elenco, numerato};
}
/* misura di una figura rispetto alla diapositiva intera → una delle
   quattro misure che usa già «metti immagine» a mano (mezza di default
   se manca la misura vera, stessa scelta prudente di lì) */
function misuraDaFrazione(fraz){
  if(fraz==null) return 'mezza';
  if(fraz>=0.75) return 'piena';
  if(fraz>=0.50) return 'grande';
  if(fraz>=0.28) return 'mezza';
  return 'piccola';
}
/* cammina le forme di una diapositiva (o di un gruppo dentro di essa)
   NELL'ORDINE IN CUI STANNO NELL'XML, così testo e figure restano
   mescolati nello stesso ordine della diapositiva originale invece di
   «prima tutto il testo, poi tutte le figure» */
async function elaboraForme(contenitore,zip,rel,percorsoSlide,largSlide,out){
  for(const forma of [...contenitore.children]){
    const tag=forma.tagName;
    if(tag==='p:sp'){
      const ph=forma.getElementsByTagName('p:ph')[0];
      const tipo=ph&&ph.getAttribute('type');
      const testoPiano=testoParagrafi(forma).map(s=>s.trim()).filter(Boolean);
      if(!testoPiano.length) continue;
      if((tipo==='title'||tipo==='ctrTitle') && !out.titolo){ out.titolo=testoPiano.join(' '); continue; }
      [...forma.getElementsByTagName('a:p')].forEach(p=>{
        const q=paragrafoConFormato(p); if(q) out.corpo.push(q);
      });
    } else if(tag==='p:pic'){
      const blip=forma.getElementsByTagName('a:blip')[0];
      const rId=blip&&blip.getAttribute('r:embed');
      const target=rId&&rel[rId];
      const percorso=target&&risolviPercorsoZip(percorsoSlide,target);
      const ext=percorso&&(percorso.match(/\.(\w+)$/)||[])[1];
      const v=percorso&&zip[percorso];
      if(!v || !ext || !MIME_IMG[ext.toLowerCase()]){ if(percorso) out.saltate++; continue; }
      try{
        const dati=await decomprimiVoce(v);
        const xfrm=forma.getElementsByTagName('a:xfrm')[0];
        const extEl=xfrm&&xfrm.getElementsByTagName('a:ext')[0];
        const cx=extEl&&+extEl.getAttribute('cx');
        out.corpo.push({immagine:true,dati,ext:ext.toLowerCase(),misura:misuraDaFrazione(cx&&largSlide?cx/largSlide:null)});
      }catch(e){ out.saltate++; }
    } else if(tag==='p:grpSp'){
      await elaboraForme(forma,zip,rel,percorsoSlide,largSlide,out);
    }
  }
}
/* ---------- la copia ESATTA di ogni diapositiva, per poterla presentare
   com'era nel PowerPoint originale (non solo il testo nel foglio) —
   ogni forma finisce con la sua posizione vera, già convertita in una tela
   virtuale larga 1280 (larghezza fissa, l'altezza segue la proporzione
   vera della diapositiva): a schermo basta un solo transform:scale.
   Limiti onesti, per non promettere più di quanto faccio davvero: niente
   rotazione delle forme, niente sfumature/tabelle/grafici/SmartArt/animazioni,
   e i colori «di tema» (schemeClr) non sono risolti — solo i colori scritti
   diretti (srgbClr). Per i gruppi la posizione è calcolata per bene
   (scala+spostamento composti, anche annidati), non solo spostata. */
function leggiXfrmForma(forma){
  const spPr=forma.getElementsByTagName('p:spPr')[0]; if(!spPr) return null;
  const xfrm=spPr.getElementsByTagName('a:xfrm')[0]; if(!xfrm) return null;
  const off=xfrm.getElementsByTagName('a:off')[0], ext=xfrm.getElementsByTagName('a:ext')[0];
  if(!off||!ext) return null;
  return {x:+off.getAttribute('x'),y:+off.getAttribute('y'),cx:+ext.getAttribute('cx'),cy:+ext.getAttribute('cy')};
}
/* trasforma un punto/misura dallo spazio locale (dentro a un eventuale
   gruppo) allo spazio della diapositiva intera, già in pixel virtuali:
   t = {tx,ty,sx,sy} tale che pxAssoluto = t.tx + emuLocale*t.sx */
function applicaTrasf(t,xf){
  return { x:t.tx+xf.x*t.sx, y:t.ty+xf.y*t.sy, w:xf.cx*t.sx, h:xf.cy*t.sy };
}
async function leggiFormeEsatte(contenitore,zip,rel,percorsoSlide,t,out,placeholders){
  for(const forma of [...contenitore.children]){
    const tag=forma.tagName;
    if(tag==='p:sp'){
      const testoPiano=testoParagrafi(forma).map(s=>s.trim()).filter(Boolean);
      if(!testoPiano.length) continue;   /* forme senza testo (rettangoli decorativi ecc.): non renderizzate, per ora */
      /* la maggior parte dei titoli/corpi VERI non scrivono la propria
         posizione sulla diapositiva: la ereditano dal segnaposto (p:ph)
         corrispondente nel layout, e se manca anche lì dal modello —
         senza questo, sparivano quasi tutti i testi dei file veri */
      let xf=leggiXfrmForma(forma);
      if(!xf){
        const ph=forma.getElementsByTagName('p:ph')[0];
        if(ph) xf=trovaXfrmEreditato(placeholders, ph.getAttribute('type')||'body', ph.getAttribute('idx')||'');
      }
      if(!xf) continue;
      const box=applicaTrasf(t,xf);
      const par=[...forma.getElementsByTagName('a:p')].map(p=>{
        const runs=runsDiParagrafo(p); if(!runs.length) return null;
        const pPr=p.getElementsByTagName('a:pPr')[0];
        const algn=pPr&&pPr.getAttribute('algn');
        const elenco=!!(pPr&&(pPr.getElementsByTagName('a:buChar').length||pPr.getElementsByTagName('a:buAutoNum').length));
        const numerato=!!(pPr&&pPr.getElementsByTagName('a:buAutoNum').length);
        /* la misura del carattere, già in pixel della tela virtuale (non più in punti) */
        const scalaFont=(t.sx+t.sy)/2;
        const runsPx=runs.map(r=>({t:r.t,b:r.b,i:r.i,u:r.u,colore:r.colore,
          px:Math.max(6,Math.round((r.pt||18)*12700*scalaFont))}));
        return {allinea:ALLINEA[algn]||null,elenco,numerato,runs:runsPx};
      }).filter(Boolean);
      if(!par.length) continue;
      const bodyPr=forma.getElementsByTagName('a:bodyPr')[0];
      const anc=bodyPr&&bodyPr.getAttribute('anchor');
      out.push({tipo:'testo',x:box.x,y:box.y,w:box.w,h:box.h,
        anc:anc==='ctr'?'ctr':anc==='b'?'b':'t',par});
    } else if(tag==='p:pic'){
      const blip=forma.getElementsByTagName('a:blip')[0];
      const rId=blip&&blip.getAttribute('r:embed');
      const target=rId&&rel[rId];
      const percorso=target&&risolviPercorsoZip(percorsoSlide,target);
      const ext=percorso&&(percorso.match(/\.(\w+)$/)||[])[1];
      const v=percorso&&zip[percorso];
      if(!v||!ext||!MIME_IMG[ext.toLowerCase()]) continue;
      const xf=leggiXfrmForma(forma); if(!xf) continue;
      const box=applicaTrasf(t,xf);
      try{
        const dati=await decomprimiVoce(v);
        const id='im'+uid();
        await salvaAllegato(id,new Blob([dati],{type:MIME_IMG[ext.toLowerCase()]}));
        out.push({tipo:'immagine',x:box.x,y:box.y,w:box.w,h:box.h,id});
      }catch(e){ /* immagine non leggibile: la salto, non blocco tutta la diapositiva */ }
    } else if(tag==='p:grpSp'){
      const grpPr=forma.getElementsByTagName('p:grpSpPr')[0];
      const xfrm=grpPr&&grpPr.getElementsByTagName('a:xfrm')[0];
      const off=xfrm&&xfrm.getElementsByTagName('a:off')[0], ext=xfrm&&xfrm.getElementsByTagName('a:ext')[0];
      const chOff=xfrm&&xfrm.getElementsByTagName('a:chOff')[0], chExt=xfrm&&xfrm.getElementsByTagName('a:chExt')[0];
      if(!off||!ext||!chOff||!chExt){ await leggiFormeEsatte(forma,zip,rel,percorsoSlide,t,out,placeholders); continue; }
      const gAssoluto=applicaTrasf(t,{x:+off.getAttribute('x'),y:+off.getAttribute('y'),
        cx:+ext.getAttribute('cx'),cy:+ext.getAttribute('cy')});
      const ccx=+chExt.getAttribute('cx')||1, ccy=+chExt.getAttribute('cy')||1;
      const nsx=gAssoluto.w/ccx, nsy=gAssoluto.h/ccy;
      const nt={ tx:gAssoluto.x-(+chOff.getAttribute('x'))*nsx, ty:gAssoluto.y-(+chOff.getAttribute('y'))*nsy, sx:nsx, sy:nsy };
      await leggiFormeEsatte(forma,zip,rel,percorsoSlide,nt,out,placeholders);
    }
  }
}
/* lo sfondo: un colore pieno o un'immagine — provato prima sulla
   diapositiva stessa, poi sul layout, poi sul modello (come farebbe
   davvero PowerPoint: la maggior parte dei file veri lo scrive una volta
   sola sul modello, non ripetuto su ogni singola diapositiva) */
function leggiSfondoDa(doc,zip,percorso,rel){
  const bg=doc.getElementsByTagName('p:bg')[0]; if(!bg) return null;
  const bgPr=bg.getElementsByTagName('p:bgPr')[0]; if(!bgPr) return null;
  const solid=[...bgPr.children].find(c=>c.tagName==='a:solidFill');
  if(solid){ const clr=solid.getElementsByTagName('a:srgbClr')[0]; if(clr) return {tipo:'colore',val:'#'+clr.getAttribute('val')}; }
  const blip=bgPr.getElementsByTagName('a:blip')[0];
  if(blip){
    const rId=blip.getAttribute('r:embed');
    const target=rId&&rel[rId];
    const perc=target&&risolviPercorsoZip(percorso,target);
    const ext=perc&&(perc.match(/\.(\w+)$/)||[])[1];
    const v=perc&&zip[perc];
    if(v&&ext&&MIME_IMG[ext.toLowerCase()]) return {tipo:'immagine-src',zip,perc,ext:ext.toLowerCase()}; /* risolta dopo, è async */
  }
  return null;
}
async function leggiSfondoSlide(doc,zip,percorsoSlide,rel,fallback){
  let s=leggiSfondoDa(doc,zip,percorsoSlide,rel);
  if(!s && fallback&&fallback.layout) s=leggiSfondoDa(fallback.layout.doc,zip,fallback.layout.percorso,fallback.layout.rel);
  if(!s && fallback&&fallback.master) s=leggiSfondoDa(fallback.master.doc,zip,fallback.master.percorso,fallback.master.rel);
  if(!s) return null;
  if(s.tipo==='colore') return s;
  try{
    const dati=await decomprimiVoce(zip[s.perc]);
    const id='bg'+uid();
    await salvaAllegato(id,new Blob([dati],{type:MIME_IMG[s.ext]}));
    return {tipo:'immagine',id};
  }catch(e){ return null; }
}
/* i segnaposto (titolo/corpo/…) del layout e del modello di una diapositiva
   — servono per ereditare la posizione quando la diapositiva stessa non la
   scrive (il caso più comune nei file veri), e per lo sfondo ereditato */
function leggiPlaceholder(doc){
  const out=[];
  const spTree=doc&&doc.getElementsByTagName('p:spTree')[0]; if(!spTree) return out;
  [...spTree.getElementsByTagName('p:sp')].forEach(sp=>{
    const ph=sp.getElementsByTagName('p:ph')[0]; if(!ph) return;
    const xf=leggiXfrmForma(sp); if(!xf) return;
    out.push({type:ph.getAttribute('type')||'body', idx:ph.getAttribute('idx')||'', xf});
  });
  return out;
}
function trovaXfrmEreditato(lista,type,idx){
  if(!lista||!lista.length) return null;
  let m=lista.find(p=>p.type===type&&p.idx===idx); if(m) return m.xf;
  m=lista.find(p=>p.type===type); if(m) return m.xf;
  if(type==='ctrTitle'){ m=lista.find(p=>p.type==='title'); if(m) return m.xf; }
  if(type==='title'){ m=lista.find(p=>p.type==='ctrTitle'); if(m) return m.xf; }
  return null;
}
async function leggiLayoutEModello(zip,percorsoSlide){
  try{
    const td=new TextDecoder();
    const relsSlide=await leggiRelazioniTipizzate(zip,percorsoSlide);
    const relLayout=relsSlide.find(r=>/\/slideLayout$/.test(r.tipo));
    if(!relLayout) return {placeholders:[],layout:null,master:null};
    const percorsoLayout=risolviPercorsoZip(percorsoSlide,relLayout.target);
    const vLayout=percorsoLayout&&zip[percorsoLayout];
    if(!vLayout) return {placeholders:[],layout:null,master:null};
    const docLayout=new DOMParser().parseFromString(td.decode(await decomprimiVoce(vLayout)),'application/xml');
    const relLayoutMappa=await leggiRelazioni(zip,percorsoLayout);
    const placeLayout=leggiPlaceholder(docLayout);

    const relsLayout=await leggiRelazioniTipizzate(zip,percorsoLayout);
    const relMaster=relsLayout.find(r=>/\/slideMaster$/.test(r.tipo));
    let docMaster=null, percorsoMaster=null, relMasterMappa={}, placeMaster=[];
    if(relMaster){
      percorsoMaster=risolviPercorsoZip(percorsoLayout,relMaster.target);
      const vMaster=percorsoMaster&&zip[percorsoMaster];
      if(vMaster){
        docMaster=new DOMParser().parseFromString(td.decode(await decomprimiVoce(vMaster)),'application/xml');
        relMasterMappa=await leggiRelazioni(zip,percorsoMaster);
        placeMaster=leggiPlaceholder(docMaster);
      }
    }
    return {
      placeholders:placeLayout.concat(placeMaster),
      layout:{doc:docLayout,percorso:percorsoLayout,rel:relLayoutMappa},
      master:docMaster?{doc:docMaster,percorso:percorsoMaster,rel:relMasterMappa}:null
    };
  }catch(e){ return {placeholders:[],layout:null,master:null}; }
}
async function leggiSlideXml(xmlTesto,zip,percorsoSlide,largSlide,altSlide,cache){
  const doc=new DOMParser().parseFromString(xmlTesto,'application/xml');
  if(doc.getElementsByTagName('parsererror').length) return {titolo:'',corpo:[],saltate:0,sfondo:null,forme:[],alt:720};
  const rel=await leggiRelazioni(zip,percorsoSlide);
  const spTree=doc.getElementsByTagName('p:spTree')[0];
  const out={titolo:'',corpo:[],saltate:0};
  if(spTree) await elaboraForme(spTree,zip,rel,percorsoSlide,largSlide,out);
  /* tela virtuale larga sempre 1280: la K converte ogni EMU in un pixel di quella tela */
  const K=1280/(largSlide||12192000);
  const {placeholders,layout,master}=await leggiLayoutEModello(zip,percorsoSlide);
  const forme=[];
  if(spTree) await leggiFormeEsatte(spTree,zip,rel,percorsoSlide,{tx:0,ty:0,sx:K,sy:K},forme,placeholders);
  const sfondo=await leggiSfondoSlide(doc,zip,percorsoSlide,rel,{layout,master});
  out.sfondo=sfondo; out.forme=forme; out.alt=Math.round((altSlide||6858000)*K);
  /* la copia fedele (7g_pptx_fedele.js): forme, colori del tema, caratteri, ombre… come in PowerPoint */
  try{ out.fedele=await pptxFedele(zip,percorsoSlide,doc,rel,largSlide,altSlide,cache||{}); }
  catch(e){ console.warn('diapositiva fedele',percorsoSlide,e); }
  return out;
}

/* ---------- tutto il file: l'ordine vero delle diapositive viene da
   presentation.xml + le sue relazioni, non dal nome dei file ---------- */
async function leggiDiapositivePptx(buf){
  const zip=leggiZip(buf), td=new TextDecoder();
  const presV=zip['ppt/presentation.xml'];
  let percorsi=[], largSlide=12192000, altSlide=6858000, docP=null;    /* 12192000×6858000 EMU = 16:9 standard, ripiego se manca */
  if(presV){
    docP=new DOMParser().parseFromString(td.decode(await decomprimiVoce(presV)),'application/xml');
    const sldSz=docP.getElementsByTagName('p:sldSz')[0];
    if(sldSz && sldSz.getAttribute('cx')) largSlide=+sldSz.getAttribute('cx');
    if(sldSz && sldSz.getAttribute('cy')) altSlide=+sldSz.getAttribute('cy');
  }
  const relV=zip['ppt/_rels/presentation.xml.rels'];
  if(docP && relV){
    const docR=new DOMParser().parseFromString(td.decode(await decomprimiVoce(relV)),'application/xml');
    const mappa={};
    [...docR.getElementsByTagName('Relationship')].forEach(r=>{ mappa[r.getAttribute('Id')]=r.getAttribute('Target'); });
    percorsi=[...docP.getElementsByTagName('p:sldId')]
      .map(s=>mappa[s.getAttribute('r:id')]).filter(Boolean)
      .map(t=>'ppt/'+t.replace(/^\.?\//,''));
  }
  /* se manca qualcosa (file fuori standard), mi arrangio con i nomi slideN.xml in ordine numerico */
  if(!percorsi.length){
    percorsi=Object.keys(zip).filter(n=>/^ppt\/slides\/slide\d+\.xml$/.test(n))
      .sort((a,b)=>(+a.match(/\d+/)[0])-(+b.match(/\d+/)[0]));
  }
  if(!percorsi.length) throw new Error('Non trovo nessuna diapositiva dentro al file.');
  const slides=[]; let saltate=0; const cache={};
  for(const p of percorsi){
    const v=zip[p]; if(!v) continue;
    const s=await leggiSlideXml(td.decode(await decomprimiVoce(v)),zip,p,largSlide,altSlide,cache);
    saltate+=s.saltate;
    slides.push(s);
  }
  return {slides,saltate};
}
/* dalle diapositive lette, il foglio html pronto per il "mio" testo —
   stessa forma di apertura usata da predicaVuota/poesiaVuota/esperienzaVuota */
/* i paragrafi di un elenco, uno via l'altro, diventano UN SOLO <ul>/<ol> —
   non un <p> per ogni punto, come farebbe Word/PowerPoint stesso */
async function corpoInHtml(corpo){
  const parti=[]; let elencoAperto=null;
  for(const q of corpo){
    if(q.immagine){
      if(elencoAperto){ parti.push(`</${elencoAperto.tag}>`); elencoAperto=null; }
      const id='im'+uid();
      await salvaAllegato(id,new Blob([q.dati],{type:MIME_IMG[q.ext]||'image/png'}));
      parti.push(`<figure class="fp-fig" contenteditable="false"><img class="fp-img ${q.misura}" data-all="${id}" src="" alt=""></figure>`);
      continue;
    }
    if(q.elenco){
      const tag=q.numerato?'ol':'ul';
      if(!elencoAperto || elencoAperto.tag!==tag){
        if(elencoAperto) parti.push(`</${elencoAperto.tag}>`);
        parti.push(`<${tag}>`); elencoAperto={tag};
      }
      parti.push(`<li>${q.html}</li>`);
      continue;
    }
    if(elencoAperto){ parti.push(`</${elencoAperto.tag}>`); elencoAperto=null; }
    const stile=q.allinea?` style="text-align:${q.allinea}"`:'';
    parti.push(`<p${stile}>${q.html}</p>`);
  }
  if(elencoAperto) parti.push(`</${elencoAperto.tag}>`);
  return parti.join('');
}
async function pptxInFoglio(slides,titoloFile){
  const primo=slides.find(s=>s.titolo)||{};
  const titolo=primo.titolo||titoloFile;
  const parti=[`<div class="fp-cap"><h2 class="fp-tit">${esc(titolo)}</h2></div>`];
  for(const s of slides){
    if(s.titolo && s.titolo!==titolo) parti.push(`<p><b>${esc(s.titolo)}</b></p>`);
    parti.push(await corpoInHtml(s.corpo));
  }
  if(parti.length===1) parti.push('<p><br></p>');
  return {titolo,html:parti.join('')};
}

/* ---------- il dialogo: scegli il file e la lingua ---------- */
const ETICH_IMPORT={predica:'la predica',poesia:'la poesia',esperienza:'l\'esperienza'};
let _ipLg='it', _ipTipo=null;
function apriImportaPptx(tipo){
  _ipTipo=tipo;
  _ipLg = tipo==='predica' ? (FP.lg==='ro'?'ro':'it') : tipo==='poesia' ? (FQ.lg==='ro'?'ro':'it') : (FE.lg==='ro'?'ro':'it');
  apri('Importa da PowerPoint',`
    <p class="sotto" style="margin-top:0">Scelgo il file <b>.pptx</b>, ne prendo tutto il testo
      diapositiva per diapositiva, e te lo preparo come ${ETICH_IMPORT[tipo]} nuova —
      pronta da rifinire sul foglio con «✎ Modifica».</p>
    <input type="file" id="ipF" accept=".pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation"
      style="display:none" onchange="scegliPptx('${tipo}')">
    <div class="vuoto" id="ipZona" style="cursor:pointer;border:2px dashed var(--bordo2);border-radius:var(--r)" onclick="$('#ipF').click()">
      <span class="em">📥</span>Tocca qui, oppure trascina qui il file .pptx</div>
    <div class="campo" style="margin-top:14px"><label>In che lingua nasce</label>
      <div class="segm">
        <button class="${_ipLg==='it'?'on':''}" id="ipItBt" onclick="_ipLg='it';$('#ipItBt').classList.add('on');$('#ipRoBt').classList.remove('on')">🇮🇹 Italiano</button>
        <button class="${_ipLg==='ro'?'on':''}" id="ipRoBt" onclick="_ipLg='ro';$('#ipRoBt').classList.add('on');$('#ipItBt').classList.remove('on')">🇷🇴 Română</button>
      </div></div>
    <div id="ipStato" style="margin-top:14px;font-size:13.5px;color:var(--tx3)"></div>`,
    `<button class="bt pi" onclick="chiudi()">Annulla</button>`,540);
}
/* si può trascinare il file .pptx da fuori, in qualsiasi momento su Prediche/
   Poesie/Esperienze: se il dialogo è già aperto lo prende lì, altrimenti lo
   apre da solo con il file già scelto — stessa idea già usata per i PDF dei
   lezionari nella Scuola del Sabato (vedi assegnaFileScelti in 6c_sabato.js) */
function paginaConImportaPptx(){
  /* sezione resta "prediche" anche leggendo una poesia o un'esperienza (uno
     stesso foglio per tutte e tre): il trascinamento serve solo nell'elenco,
     non mentre stai leggendo/scrivendo un foglio già aperto */
  if(document.body.classList.contains('pred-fissa')) return null;
  return sezione==='prediche'?'predica':sezione==='poesie'?'poesia':sezione==='esperienze'?'esperienza':null;
}
/* Safari (anche su iPad) decide già al «dragenter» se il punto dove sei
   entrato accetta un trascinamento: se qui non si chiama preventDefault(),
   può rifiutare tutto il gesto e il «drop» non arriva mai — anche se poi
   il dragover qui sotto sarebbe stato gestito bene. Serve gestirli insieme. */
document.addEventListener('dragenter',e=>{
  if(!paginaConImportaPptx()) return;
  e.preventDefault();
  if(e.dataTransfer) e.dataTransfer.dropEffect='copy';
  document.body.classList.add('imp-trascina');
});
document.addEventListener('dragover',e=>{
  if(!paginaConImportaPptx()) return;
  e.preventDefault();
  if(e.dataTransfer) e.dataTransfer.dropEffect='copy';
  document.body.classList.add('imp-trascina');
});
document.addEventListener('dragleave',e=>{
  if(!e.relatedTarget || e.relatedTarget.nodeName==='HTML') document.body.classList.remove('imp-trascina');
});
document.addEventListener('drop',e=>{
  const tipoOra=paginaConImportaPptx();
  if(!tipoOra){ document.body.classList.remove('imp-trascina'); return; }
  e.preventDefault();
  document.body.classList.remove('imp-trascina');
  const f=[...(e.dataTransfer&&e.dataTransfer.files||[])].filter(x=>/\.pptx$/i.test(x.name)||
    x.type==='application/vnd.openxmlformats-officedocument.presentationml.presentation');
  if(!f.length){ avvisa('Trascina un file .pptx','no'); return; }
  if(!$('#ipF')) apriImportaPptx(tipoOra);
  const inp=$('#ipF'); if(!inp) return;
  try{
    const dt=new DataTransfer(); dt.items.add(f[0]);
    inp.files=dt.files;
    scegliPptx(_ipTipo||tipoOra);
  }catch(e){ avvisa('Qui il trascinamento non funziona: tocca il riquadro per scegliere il file','no'); }
});
async function scegliPptx(tipo){
  const f=$('#ipF').files[0]; if(!f) return;
  const st=$('#ipStato');
  if(typeof DecompressionStream==='undefined'){
    st.textContent='Questo Safari/browser è troppo vecchio per leggere i PowerPoint: aggiorna il sistema e riprova.';
    st.style.color='#ff8b9c'; return;
  }
  st.textContent='Leggo «'+f.name+'»…';
  $('#ipZona').style.pointerEvents='none';
  try{
    const buf=new Uint8Array(await f.arrayBuffer());
    const {slides,saltate}=await leggiDiapositivePptx(buf);
    const nomeFile=f.name.replace(/\.pptx$/i,'').replace(/[_-]+/g,' ').trim()||'Importata da PowerPoint';
    const {titolo,html}=await pptxInFoglio(slides,nomeFile);
    /* la copia esatta delle diapositive, per «▶︎ Diapositive originali» —
       solo posizione/sfondo/testo formattato, non tutto l'oggetto slide */
    const diapoPptx=slides.map(s=>s.fedele?{alt:s.alt,fedele:s.fedele}:{sfondoPptx:s.sfondo,alt:s.alt,forme:s.forme});
    chiudi();
    creaDaPptx(tipo,titolo,html,_ipLg,diapoPptx);
    const msgSalt=saltate?` (${saltate} immagine${saltate>1?'i':''} in un formato non leggibile, saltat${saltate>1?'e':'a'})`:'';
    avvisa(`Importate ${slides.length} diapositive con testo e immagini${msgSalt} — controlla e sistema come vuoi. Con «▶︎ Diapositive originali» le presenti anche tali e quali al PowerPoint.`,'ok');
  }catch(e){
    console.error(e);
    st.textContent='Non ci sono riuscito: '+e.message;
    st.style.color='#ff8b9c';
    $('#ipZona').style.pointerEvents='';
  }
}
/* crea il nuovo elemento — stessa forma di predicaVuota/poesiaVuota/esperienzaVuota,
   solo che il titolo e il foglio partono già pieni invece che vuoti */
function creaDaPptx(tipo,titolo,html,lg,diapoPptx){
  let i;
  const conDiapo=diapoPptx&&diapoPptx.length?{diapoPptx}:{};
  if(tipo==='predica'){
    const dati=Object.assign({ tit:titolo, num:prossimoNumero(), lg, tema:'', rif:'', data:oggi(),
                 sfondo:'notte', testo:'', blocchi:[] },conDiapo);
    dati.i=uid(); dati.mia=true; i=dati.i;
    stato.prediche.push(dati);
  } else if(tipo==='poesia'){
    const dati=Object.assign({ tit:titolo, lg, autore:'', sfondo:'alba', testo:'', mia:true },conDiapo);
    dati.i='y'+uid(); i=dati.i;
    stato.poesie=stato.poesie||[]; stato.poesie.push(dati);
  } else {
    const dati=Object.assign({ tit:titolo, lg, tipo:'racconto', chi:'', rif:'', data:oggi(),
                 sfondo:'alba', testo:'', all:[], mia:true },conDiapo);
    dati.i=uid(); i=dati.i;
    stato.esperienze.push(dati);
  }
  const a=annot(i);
  a.stile=Object.assign({},a.stile||{},{pag:'#ffffff',fam:'serif',dim:22,interl:1.5});
  a.html=html;
  salva();
  leggiPredica(i);
}
