/* ================= ZIP e PDF scritti a mano ================= */
/* --- CRC32 --- */
const _crcT=(()=>{ const t=new Uint32Array(256);
  for(let n=0;n<256;n++){ let c=n; for(let k=0;k<8;k++) c=c&1?0xEDB88320^(c>>>1):c>>>1; t[n]=c>>>0; } return t; })();
function crc32(u8){ let c=0xFFFFFFFF; for(let i=0;i<u8.length;i++) c=_crcT[(c^u8[i])&0xFF]^(c>>>8); return (c^0xFFFFFFFF)>>>0; }
const _te=new TextEncoder();
/* --- ZIP senza compressione (metodo "stored") --- */
function zip(file){
  const parti=[], centr=[]; let off=0;
  const u16=n=>[n&255,(n>>8)&255], u32=n=>[n&255,(n>>8)&255,(n>>16)&255,(n>>24)&255];
  file.forEach(f=>{
    const nome=_te.encode(f.nome);
    const dati = f.dati instanceof Uint8Array ? f.dati : _te.encode(f.dati);
    const c=crc32(dati);
    const loc=[...u32(0x04034b50),...u16(20),...u16(0),...u16(0),...u16(0),...u16(0),
      ...u32(c),...u32(dati.length),...u32(dati.length),...u16(nome.length),...u16(0)];
    parti.push(new Uint8Array(loc),nome,dati);
    centr.push({nome,c,len:dati.length,off});
    off+=loc.length+nome.length+dati.length;
  });
  const cd=[]; let cdLen=0;
  centr.forEach(e=>{
    const h=[...u32(0x02014b50),...u16(20),...u16(20),...u16(0),...u16(0),...u16(0),...u16(0),
      ...u32(e.c),...u32(e.len),...u32(e.len),...u16(e.nome.length),...u16(0),...u16(0),...u16(0),...u16(0),
      ...u32(0),...u32(e.off)];
    cd.push(new Uint8Array(h),e.nome); cdLen+=h.length+e.nome.length;
  });
  const fine=new Uint8Array([...u32(0x06054b50),...u16(0),...u16(0),...u16(centr.length),...u16(centr.length),
    ...u32(cdLen),...u32(off),...u16(0)]);
  let tot=off+cdLen+fine.length, out=new Uint8Array(tot), p=0;
  [...parti,...cd,fine].forEach(a=>{ out.set(a,p); p+=a.length; });
  return out;
}
/* --- PDF da immagini JPEG (una pagina per immagine) --- */
function pdfDaImmagini(imgs,L,H){
  const enc=s=>_te.encode(s);
  let oggetti=[], buf=[], pos=0;
  const push=u8=>{ buf.push(u8); pos+=u8.length; };
  push(enc('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n'));
  const nPag=imgs.length;
  const idPagine=1, idCat=2;
  let id=3, rif=[];
  const off={};
  const scrivi=(n,corpo)=>{ off[n]=pos; push(enc(`${n} 0 obj\n${corpo}\nendobj\n`)); };
  const scriviFlusso=(n,dict,dati)=>{ off[n]=pos;
    push(enc(`${n} 0 obj\n${dict}\nstream\n`)); push(dati); push(enc('\nendstream\nendobj\n')); };
  const pagine=[];
  imgs.forEach(b64=>{
    const bin=atob(b64.split(',')[1]); const u8=new Uint8Array(bin.length);
    for(let i=0;i<bin.length;i++) u8[i]=bin.charCodeAt(i);
    const idImg=id++, idCon=id++, idPag=id++;
    scriviFlusso(idImg,`<< /Type /XObject /Subtype /Image /Width ${L} /Height ${H} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${u8.length} >>`,u8);
    const cont=`q ${L} 0 0 ${H} 0 0 cm /I0 Do Q`;
    scriviFlusso(idCon,`<< /Length ${cont.length} >>`,enc(cont));
    scrivi(idPag,`<< /Type /Page /Parent ${idPagine} 0 R /MediaBox [0 0 ${L} ${H}] /Resources << /XObject << /I0 ${idImg} 0 R >> >> /Contents ${idCon} 0 R >>`);
    pagine.push(idPag);
  });
  scrivi(idPagine,`<< /Type /Pages /Count ${nPag} /Kids [${pagine.map(p=>p+' 0 R').join(' ')}] >>`);
  scrivi(idCat,`<< /Type /Catalog /Pages ${idPagine} 0 R >>`);
  const nOgg=id;
  const xref=pos;
  let x=`xref\n0 ${nOgg}\n0000000000 65535 f \n`;
  for(let n=1;n<nOgg;n++) x+=String(off[n]||0).padStart(10,'0')+' 00000 n \n';
  x+=`trailer\n<< /Size ${nOgg} /Root ${idCat} 0 R >>\nstartxref\n${xref}\n%%EOF`;
  push(enc(x));
  let tot=0; buf.forEach(b=>tot+=b.length);
  const out=new Uint8Array(tot); let p=0; buf.forEach(b=>{ out.set(b,p); p+=b.length; });
  return out;
}
/* Salva un file lasciandoti scegliere la cartella.
   La finestra «Salva con nome» va chiesta SUBITO dopo il clic, prima di preparare
   il file: altrimenti il browser non la apre più. Perciò prima si sceglie dove
   salvare, poi si costruisce il PDF, poi si scrive. */
const _TIPI={pdf:['Documento PDF','application/pdf'],pptx:['Presentazione PowerPoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
  json:['File del programma','application/json'],txt:['Testo','text/plain']};
function sceltaCartellaDisponibile(){ return typeof window.showSaveFilePicker==='function'; }
async function salvaFile(nome,tipo,produci){
  const est=(nome.match(/\.([a-z0-9]+)$/i)||[,''])[1].toLowerCase();
  let maniglia=null;
  if(stato.imp.scegliCartella!==false && sceltaCartellaDisponibile()){
    try{
      maniglia=await window.showSaveFilePicker({suggestedName:nome,
        types:[{description:(_TIPI[est]||['File'])[0],accept:{[tipo]:['.'+est]}}]});
    }catch(e){ if(e&&e.name==='AbortError'){ avvisa('Annullato'); return; } }
  }
  avvisa('Preparo il file…');
  const u8=await produci();
  const b=new Blob([u8],{type:tipo});
  if(maniglia){
    try{ const w=await maniglia.createWritable(); await w.write(b); await w.close();
      avvisa('Salvato dove hai scelto','ok'); return; }
    catch(e){ console.warn('scrittura',e); }
  }
  const u=URL.createObjectURL(b), a=document.createElement('a');
  a.href=u; a.download=nome; document.body.appendChild(a); a.click();
  setTimeout(()=>{ a.remove(); URL.revokeObjectURL(u); },900);
  if(!sceltaCartellaDisponibile() && !stato.imp.avvisoCartella){
    stato.imp.avvisoCartella=true; salva();
    setTimeout(()=>apri('Dove finiscono i file',
      `<p class="sotto" style="margin-top:0">Questo browser non lascia scegliere la cartella a un programma.
       Il file è andato nei <b>Download</b>.</p>
       <p class="sotto"><b>Per farti chiedere ogni volta dove salvare</b>, in Safari:<br>
       <b>Safari ▸ Impostazioni ▸ Generali ▸ Posizione dei download</b> e scegli
       <b>«Chiedi per ogni download»</b>.</p>
       <p class="sotto" style="color:var(--tx3);font-size:12.5px">Con Chrome, invece, la finestra
       «Salva con nome» si apre da sola.</p>`,
      `<button class="bt pr" onclick="chiudi()">Ho capito</button>`,560),400);
  }
}
/* vecchia forma, ancora usata dove il file è già pronto */
async function scarica(u8,nome,tipo){
  return salvaFile(nome,tipo||'application/octet-stream',async()=>u8);
}
