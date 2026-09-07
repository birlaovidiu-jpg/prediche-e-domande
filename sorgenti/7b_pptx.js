/* ================= POWERPOINT (.pptx) scritto a mano ================= */
const EMU_L=12192000, EMU_H=6858000;
const xe=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const XML='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n';
const NSp='xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"';

function ppTesto(t,o){
  o=o||{};
  const righe=String(t).split('\n');
  const rpr=`<a:rPr lang="it-IT" sz="${o.sz||2400}"${o.b?' b="1"':''}${o.i?' i="1"':''} dirty="0">`+
    `<a:solidFill><a:srgbClr val="${o.col||'FFFFFF'}"/></a:solidFill>`+
    `<a:latin typeface="${o.font||'Helvetica Neue'}"/><a:cs typeface="${o.font||'Helvetica Neue'}"/></a:rPr>`;
  return righe.map(r=>`<a:p><a:pPr algn="${o.algn||'ctr'}"/>`+
    (r?`<a:r>${rpr}<a:t>${xe(r)}</a:t></a:r>`:`<a:endParaRPr lang="it-IT" sz="${o.sz||2400}"/>`)+`</a:p>`).join('');
}
function ppForma(id,x,y,cx,cy,testo,o){
  o=o||{};
  const riemp = o.fill ? `<a:solidFill><a:srgbClr val="${o.fill}">${o.alpha!=null?`<a:alpha val="${o.alpha}"/>`:''}</a:srgbClr></a:solidFill>` : '<a:noFill/>';
  const linea = o.line ? `<a:ln w="${o.lw||28575}"><a:solidFill><a:srgbClr val="${o.line}"/></a:solidFill></a:ln>` : '<a:ln><a:noFill/></a:ln>';
  return `<p:sp><p:nvSpPr><p:cNvPr id="${id}" name="f${id}"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr>`+
    `<p:spPr><a:xfrm><a:off x="${Math.round(x)}" y="${Math.round(y)}"/><a:ext cx="${Math.round(cx)}" cy="${Math.round(cy)}"/></a:xfrm>`+
    `<a:prstGeom prst="${o.geom||'roundRect'}"><a:avLst>${o.geom==='rect'?'':'<a:gd name="adj" fmla="val 12000"/>'}</a:avLst></a:prstGeom>`+
    riemp+linea+`</p:spPr>`+
    `<p:txBody><a:bodyPr anchor="${o.anchor||'ctr'}" lIns="${o.lIns||137160}" rIns="${o.lIns||137160}" tIns="45720" bIns="45720" wrap="square"><a:normAutofit/></a:bodyPr><a:lstStyle/>`+
    ppTesto(testo,o)+`</p:txBody></p:sp>`;
}
function ppSlide(forme,sfondo){
  return XML+`<p:sld ${NSp}><p:cSld>`+
    `<p:bg><p:bgPr><a:solidFill><a:srgbClr val="${sfondo||'080B14'}"/></a:solidFill><a:effectLst/></p:bgPr></p:bg>`+
    `<p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>`+
    `<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>`+
    forme.join('')+`</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>`;
}
/* --- diapositiva di una domanda; fase 0..4 come nel programma --- */
function ppDomanda(d,fase,num,tot){
  const f = fase===true?4:(fase===false?3:(fase|0));
  const ris = f>=4;
  const fo=[]; let id=10;
  const M=700000, LARG=EMU_L-2*M;
  if(d.libro) fo.push(ppForma(id++, EMU_L*0.42, 150000, EMU_L*0.58-M, 900000, d.libro,
    {sz:3600,b:1,col:'E8BE6E',algn:'r',font:'Optima',anchor:'ctr',geom:'rect',lIns:0}));
  if(num) fo.push(ppForma(id++, M, 260000, 2200000, 560000, `${num} / ${tot}`,
    {sz:1400,col:'7C8399',algn:'l',geom:'rect',lIns:0}));
  const conTesto = ris && d.txt;
  fo.push(ppForma(id++, M, 1180000, LARG, 1350000, d.d,
    {sz:3000,b:1,col:'FFFFFF',anchor:'ctr',geom:'rect'}));
  if(d.solo){
    if(ris){
      fo.push(ppForma(id++, EMU_L*0.17, 3650000, EMU_L*0.66, 1400000, d.o[d.g],
        {sz:4400,b:1,col:'FFFFFF',anchor:'ctr',font:'Optima',
         fill:'1FA463',alpha:'34000',line:'27C47A',lw:38100}));
      if(d.v) fo.push(ppForma(id++, EMU_L*0.52, EMU_H-800000, EMU_L*0.48-M, 500000, d.v,
        {sz:1700,b:1,col:'E0B25C',algn:'r',font:'Optima',geom:'rect',lIns:0}));
    }
    return ppSlide(fo);
  }
  const y0=2780000, h=conTesto?720000:820000, gap=conTesto?150000:200000;
  d.o.forEach((t,i2)=>{
    if(f<=i2) return;                      /* le risposte compaiono una alla volta */
    const giusta = ris && i2===d.g;
    const y=y0+i2*(h+gap);
    fo.push(ppForma(id++, M, y, 880000, h, 'abc'[i2],
      {sz:2600,b:1,col:giusta?'27C47A':'E0B25C',font:'Optima',
       fill:giusta?'1FA463':'FFFFFF', alpha:giusta?'30000':'6000', line:giusta?'27C47A':'4A5170', lw:19050}));
    fo.push(ppForma(id++, M+990000, y, LARG-990000, h, t,
      {sz:2300,col:'FFFFFF',algn:'l',lIns:274320,b:giusta?1:0,
       fill:giusta?'1FA463':'FFFFFF', alpha:giusta?'30000':'6000', line:giusta?'27C47A':'4A5170', lw:19050}));
  });
  /* il testo del versetto solo insieme alla risposta, mai prima */
  if(conTesto) fo.push(ppForma(id++, M+600000, y0+3*(h+gap)+120000, LARG-1200000, 900000,
    '“'+d.txt+'”', {sz:1500,i:1,col:'F0F2F8',algn:'ctr',font:'Georgia',geom:'rect'}));
  if(d.v) fo.push(ppForma(id++, EMU_L*0.52, EMU_H-800000, EMU_L*0.48-M, 500000, d.v,
    {sz:1700,b:1,col:'E0B25C',algn:'r',font:'Optima',geom:'rect',lIns:0}));
  return ppSlide(fo);
}
/* --- pacchetto completo --- */
function pptx(slides,titolo){
  const n=slides.length;
  const ct=XML+`<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">`+
    `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>`+
    `<Default Extension="xml" ContentType="application/xml"/>`+
    `<Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>`+
    `<Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>`+
    `<Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>`+
    `<Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>`+
    slides.map((_,i)=>`<Override PartName="/ppt/slides/slide${i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`).join('')+
    `<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>`+
    `<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>`+
    `</Types>`;
  const rels=XML+`<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">`+
    `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>`+
    `<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>`+
    `<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>`+
    `</Relationships>`;
  const pres=XML+`<p:presentation ${NSp} saveSubsetFonts="1">`+
    `<p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst>`+
    `<p:sldIdLst>${slides.map((_,i)=>`<p:sldId id="${256+i}" r:id="rId${i+2}"/>`).join('')}</p:sldIdLst>`+
    `<p:sldSz cx="${EMU_L}" cy="${EMU_H}"/><p:notesSz cx="${EMU_H}" cy="${EMU_L}"/></p:presentation>`;
  const presRels=XML+`<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">`+
    `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>`+
    slides.map((_,i)=>`<Relationship Id="rId${i+2}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${i+1}.xml"/>`).join('')+
    `<Relationship Id="rId${n+2}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="theme/theme1.xml"/>`+
    `</Relationships>`;
  const vuoto=`<p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>`+
    `<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree>`;
  const cmap=`<p:clrMap bg1="dk1" tx1="lt1" bg2="dk2" tx2="lt2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>`;
  const master=XML+`<p:sldMaster ${NSp}><p:cSld>`+
    `<p:bg><p:bgPr><a:solidFill><a:srgbClr val="080B14"/></a:solidFill><a:effectLst/></p:bgPr></p:bg>`+
    vuoto+`</p:cSld>${cmap}<p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst></p:sldMaster>`;
  const masterRels=XML+`<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">`+
    `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>`+
    `<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/>`+
    `</Relationships>`;
  const layout=XML+`<p:sldLayout ${NSp} type="blank" preserve="1"><p:cSld name="Vuota">`+vuoto+
    `</p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sldLayout>`;
  const layoutRels=XML+`<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">`+
    `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/>`+
    `</Relationships>`;
  const sldRels=XML+`<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">`+
    `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>`+
    `</Relationships>`;
  const cl=(n,v)=>`<a:${n}><a:srgbClr val="${v}"/></a:${n}>`;
  const tema2=XML+`<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="SDARM"><a:themeElements>`+
    `<a:clrScheme name="SDARM"><a:dk1><a:sysClr val="windowText" lastClr="000000"/></a:dk1><a:lt1><a:sysClr val="window" lastClr="FFFFFF"/></a:lt1>`+
    cl('dk2','080B14')+cl('lt2','EEF1F8')+cl('accent1','C8102E')+cl('accent2','E0B25C')+cl('accent3','1FA463')+
    cl('accent4','4A5170')+cl('accent5','786EFF')+cl('accent6','E6203F')+cl('hlink','E0B25C')+cl('folHlink','9AA0B0')+`</a:clrScheme>`+
    `<a:fontScheme name="SDARM">`+
    `<a:majorFont><a:latin typeface="Helvetica Neue"/><a:ea typeface=""/><a:cs typeface=""/></a:majorFont>`+
    `<a:minorFont><a:latin typeface="Helvetica Neue"/><a:ea typeface=""/><a:cs typeface=""/></a:minorFont></a:fontScheme>`+
    `<a:fmtScheme name="SDARM">`+
    `<a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst>`+
    `<a:lnStyleLst><a:ln w="6350"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln><a:ln w="12700"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln><a:ln w="19050"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln></a:lnStyleLst>`+
    `<a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst>`+
    `<a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst>`+
    `</a:fmtScheme></a:themeElements></a:theme>`;
  const core=XML+`<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">`+
    `<dc:title>${xe(titolo||'Domande bibliche')}</dc:title><dc:creator>SDARM</dc:creator><cp:lastModifiedBy>SDARM</cp:lastModifiedBy>`+
    `<dcterms:created xsi:type="dcterms:W3CDTF">${new Date().toISOString().slice(0,19)}Z</dcterms:created></cp:coreProperties>`;
  const app=XML+`<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">`+
    `<Application>SDARM</Application><Slides>${n}</Slides></Properties>`;
  const f=[
    {nome:'[Content_Types].xml',dati:ct},
    {nome:'_rels/.rels',dati:rels},
    {nome:'docProps/core.xml',dati:core},
    {nome:'docProps/app.xml',dati:app},
    {nome:'ppt/presentation.xml',dati:pres},
    {nome:'ppt/_rels/presentation.xml.rels',dati:presRels},
    {nome:'ppt/slideMasters/slideMaster1.xml',dati:master},
    {nome:'ppt/slideMasters/_rels/slideMaster1.xml.rels',dati:masterRels},
    {nome:'ppt/slideLayouts/slideLayout1.xml',dati:layout},
    {nome:'ppt/slideLayouts/_rels/slideLayout1.xml.rels',dati:layoutRels},
    {nome:'ppt/theme/theme1.xml',dati:tema2}
  ];
  slides.forEach((s,i)=>{
    f.push({nome:`ppt/slides/slide${i+1}.xml`,dati:s});
    f.push({nome:`ppt/slides/_rels/slide${i+1}.xml.rels`,dati:sldRels});
  });
  return zip(f);
}
