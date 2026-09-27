/* ================= LIBRI =================
   I tuoi libri in PDF: li trascini qui (o li scegli con «Aggiungi libro») e restano dentro
   al programma, su questo dispositivo, come i lezionari. Si leggono nello stesso lettore dei
   lezionari, con la stessa barra a sinistra per gli appunti (evidenzia, sottolinea, penna,
   scrivi, cancella, colore, annulla, appunti, pulisci): ogni pagina sta tutta intera sullo
   schermo. Il colore della carta dei libri è a parte da quello dei lezionari.
   I segnalibri: quanti vuoi, ognuno con la data del giorno in cui l'hai messo, e restano lì
   finché non li togli tu (🔖 sulla stessa pagina lo toglie). Il libro si riapre sull'ultimo messo. */
function libri(){ stato.libri=stato.libri||[]; return stato.libri; }
function lbTrova(i){ return libri().find(x=>x.i===i); }
function lbData(q){
  try{ return new Date(q).toLocaleDateString('it-IT',{day:'numeric',month:'long',year:'numeric'}); }catch(e){ return ''; }
}
function vLibri(){
  const el=libri();
  pinta(`
  <div class="lib-pagina">
    <div class="lib-testa">
      <button class="bt pr" onclick="$('#lbF').click()">✚ Aggiungi libro</button>
      <input type="file" id="lbF" accept="application/pdf" multiple style="display:none"
        onchange="lbAggiungi([...this.files]);this.value=''">
    </div>
    ${el.length?`<div class="griglia g4 lib-griglia">${el.map(b=>`
      <div class="tess lez-carta lib-carta" style="padding:0" onclick="lbApri('${b.i}')" title="${esc(b.titolo)}">
        <div class="lez-mini">${b.cop?`<img src="${b.cop}" alt="">`:'<div class="lez-noco">📗</div>'}
          ${lbSegni(b).length?`<span class="lib-segno" title="Segnalibri">🔖 ${lbSegni(b).length>1?lbSegni(b).length+' · ':''}pag. ${lbUltimo(b).pag}</span>`:''}
          <div class="lez-piede">
            <span class="lez-pt"><b class="lez-nome lib-nome" title="Tocca per cambiare il nome" onclick="event.stopPropagation();lbNomina('${b.i}')">${esc(b.titolo)}</b>
              <span>${b.pagine||'?'} pagine</span>
              ${lbSegni(b).length?`<span>🔖 ${lbSegni(b).length>1?lbSegni(b).length+' segnalibri · ultimo ':''}pagina ${lbUltimo(b).pag} · messo il ${esc(lbData(lbUltimo(b).quando))}</span>`:''}</span>
            <button class="lez-cest lib-nomina" title="Dai un nome al libro" onclick="event.stopPropagation();lbNomina('${b.i}')">✏️</button>
            <button class="lez-cest" title="Elimina" onclick="event.stopPropagation();lbElimina('${b.i}')">🗑</button>
          </div>
        </div></div>`).join('')}</div>`
    :`<div class="lib-vuoto" onclick="$('#lbF').click()"><span>📗</span><b>Nessun libro ancora</b>
        <i>Trascina qui un PDF o tocca per sceglierlo</i></div>`}
  </div>`);
}
/* aggiunge uno o più PDF: il titolo è il nome del file, la copertina la prima pagina */
async function lbAggiungi(files){
  files=(files||[]).filter(x=>x.type==='application/pdf'||/\.pdf$/i.test(x.name));
  if(!files.length){ avvisa('Scegli un file PDF','no'); return; }
  try{ await caricaPdfJs(); }catch(e){ avvisa('Non riesco a leggere i PDF: '+e.message,'no'); return; }
  let messi=0;
  for(const f of files){
    try{
      avvisa(`Aggiungo «${f.name}»…`,'ok');
      const doc=await pdfjsLib.getDocument({data:new Uint8Array(await f.arrayBuffer())}).promise;
      const id=uid(), fid='lb'+id;
      let cop=''; try{ cop=await paginaInImmagine(doc,1,360); }catch(e){}
      await salvaAllegato(fid,f);
      libri().push({i:id, titolo:f.name.replace(/\.pdf$/i,'').replace(/[_]+/g,' ').trim()||'Libro',
        fid, cop, pagine:doc.numPages, quando:new Date().toISOString(), segni:[]});
      messi++;
      try{ doc.destroy(); }catch(e){}
    }catch(e){ console.error(e); avvisa(`Non riesco a leggere «${f.name}»: ${e.message}`,'no'); }
  }
  salva();
  if(sezione==='libri') vLibri();
  menu();
  if(messi) avvisa(messi===1?'Libro aggiunto':`${messi} libri aggiunti`,'ok');
  /* appena aggiunto un libro solo, gli dai subito il nome (c'è già scritto quello del file) */
  if(messi===1) lbNomina(libri()[libri().length-1].i);
}
/* dare o cambiare il nome di un libro */
function lbNomina(i){
  const b=lbTrova(i); if(!b) return;
  apri('Nome del libro',`<div class="campo"><label>Come si chiama questo libro</label>
      <input type="text" id="lbNome" value="${esc(b.titolo)}" onkeydown="if(event.key==='Enter')lbSalvaNome('${i}')"></div>`,
    `<button class="bt pi" onclick="chiudi()">Annulla</button>
     <button class="bt pr" onclick="lbSalvaNome('${i}')">Salva</button>`,460);
  const inp=$('#lbNome'); if(inp){ inp.focus(); inp.select(); }
}
function lbSalvaNome(i){
  const b=lbTrova(i), inp=$('#lbNome'); if(!b||!inp) return;
  const nome=inp.value.trim();
  if(!nome){ avvisa('Scrivi il nome del libro','no'); return; }
  b.titolo=nome; salva(); chiudi();
  if(sezione==='libri' && !lbAperto()) vLibri();
  avvisa('Nome salvato','ok');
}
function lbElimina(i){
  const b=lbTrova(i); if(!b) return;
  conferma(`Vuoi eliminare il libro «${b.titolo}»?`,async()=>{
    try{ await kvDel('all:'+b.fid); }catch(e){}
    stato.libri=libri().filter(x=>x.i!==i);
    if(stato.appunti) delete stato.appunti['lb'+i];
    salva(); vLibri(); menu(); avvisa('Eliminato','ok');
  },'Elimina');
}
/* trascinare i PDF sulla sezione Libri */
function lbAperto(){ const b=$('#lettore'); return !!(b&&b.classList.contains('on')&&LET.libro); }
document.addEventListener('dragover',e=>{
  if(sezione!=='libri' || lbAperto()) return;
  e.preventDefault();
  if(e.dataTransfer) e.dataTransfer.dropEffect='copy';
  document.body.classList.add('lib-trascina');
});
document.addEventListener('dragleave',e=>{
  if(!e.relatedTarget || e.relatedTarget.nodeName==='HTML') document.body.classList.remove('lib-trascina');
});
document.addEventListener('drop',e=>{
  if(sezione!=='libri' || lbAperto()){ document.body.classList.remove('lib-trascina'); return; }
  e.preventDefault();
  document.body.classList.remove('lib-trascina');
  lbAggiungi([...(e.dataTransfer&&e.dataTransfer.files||[])]);
});

/* ---------- la lettura: nel lettore dei lezionari (6d_lettore.js, apriLez con {libro:true}) ---------- */
function lbApri(i){ apriLez(i,null,{libro:true}); }
/* i segnalibri di un libro; quello di prima (uno solo, «segno») diventa il primo della lista */
function lbSegni(b){
  if(!b) return [];
  if(!b.segni){ b.segni=b.segno?[b.segno]:[]; }
  if(b.segno){ if(!b.segni.some(s=>s.pag===b.segno.pag)) b.segni.push(b.segno); delete b.segno; }
  return b.segni;
}
function lbUltimo(b){ return lbSegni(b).slice().sort((x,y)=>String(x.quando).localeCompare(String(y.quando))).pop()||null; }
function lbPaginaDaAprire(b){ const u=lbUltimo(b); return u?u.pag:1; }
function lbSegna(){
  const b=LET.libro&&LET.lez; if(!b) return;
  const el=lbSegni(b), n=LET.pag, k=el.findIndex(s=>s.pag===n);
  if(k>=0){ el.splice(k,1); salva(); avvisa('Segnalibro tolto','ok'); }
  else { const s={pag:n, quando:new Date().toISOString()}; el.push(s); el.sort((x,y)=>x.pag-y.pag); salva();
    avvisa(`Segnalibro messo a pagina ${n}, il ${lbData(s.quando)}`,'ok'); }
  lbNastro(n); lbSegnoBarra();
}
function lbElencoSegni(){
  const b=LET.libro&&LET.lez; if(!b) return;
  const el=lbSegni(b);
  apri('Segnalibri',el.length?`<div class="lez-el">${el.map(s=>`
      <div class="lez-riga" onclick="chiudi();vaiPag(${s.pag})" style="cursor:pointer">
        <span class="nn">🔖</span>
        <span class="cc"><b>Pagina ${s.pag}</b><span>messo il ${esc(lbData(s.quando))}</span></span>
        <button class="lez-cest" style="position:static" title="Togli questo segnalibro" onclick="event.stopPropagation();lbTogliSegno(${s.pag})">🗑</button>
      </div>`).join('')}</div>`
    :`<div class="vuoto"><span class="em">🔖</span>In questo libro non hai ancora messo segnalibri.<br>Tocca «🔖 Segnalibro» sulla pagina che vuoi.</div>`,
    `<button class="bt pi" style="margin-right:auto" onclick="chiudi();lbNomina('${b.i}')" title="Cambia il nome del libro">✏️ ${esc(b.titolo)}</button>
     <button class="bt pr" onclick="chiudi()">Chiudi</button>`,460);
}
function lbTogliSegno(pag){
  const b=LET.libro&&LET.lez; if(!b) return;
  const el=lbSegni(b), k=el.findIndex(s=>s.pag===pag); if(k<0) return;
  el.splice(k,1); salva(); lbNastro(pag); lbSegnoBarra();
  chiudi(); lbElencoSegni(); avvisa('Segnalibro tolto','ok');
}
/* il nastro del segnalibro, con la data in cui l'hai messo, appeso in alto a destra della pagina */
function lbNastro(n){
  const f=document.querySelector(`#lettore .let-foglio[data-p="${n}"]`); if(!f) return;
  const v=f.querySelector('.lib-nastro'); if(v) v.remove();
  const b=LET.libro&&LET.lez, s=b&&lbSegni(b).find(x=>x.pag===n);
  if(!s) return;
  f.insertAdjacentHTML('beforeend',`<div class="lib-nastro let-nastro">🔖 ${esc(lbData(s.quando))}</div>`);
}
function lbSegnoBarra(){
  const b=LET.libro&&LET.lez, el=b?lbSegni(b):[], bt=$('#lbSegnaBt'), vai=$('#lbVaiSegno');
  if(bt) bt.classList.toggle('on',el.some(s=>s.pag===LET.pag));
  if(vai) vai.classList.toggle('spento',!el.length);
}
/* ---------- sfogliare come un libro ----------
   Nel modo «Sfoglia» (pulsante Scorri/Sfoglia della barra) si vede una pagina alla volta: trascinando
   il dito verso sinistra la pagina gira verso sinistra e arriva la dopo; verso destra si torna indietro.
   Funziona con la mano libera (con uno strumento in mano il dito scrive), e con le frecce della tastiera. */
let _lbSf=null, _lbGira=false;
async function lbSfoglia(dir){
  /* da questa versione si sfoglia così anche il lezionario, non solo i libri */
  if(_lbGira || !$('#lettore') || LET.modo!=='pagina') return;
  const n=LET.pag+dir; if(n<1||n>LET.tot) return;
  _lbGira=true; LET._verso=dir;
  try{
    /* la pagina nuova comincia a disegnarsi subito, di nascosto, mentre la vecchia gira:
       quando la vecchia ha finito di girare la nuova è già pronta, e non si vede mai il bianco */
    const pronta=preparaPag(n);
    const st=$('#letStack');
    if(st){
      st.style.transformOrigin = dir>0 ? 'left center' : 'right center';
      st.style.transition='transform .24s ease-in, opacity .24s ease-in';
      st.style.transform=`perspective(1800px) rotateY(${dir>0?-70:70}deg)`; st.style.opacity='.35';
      await new Promise(r=>setTimeout(r,240));
    }
    const metti=await pronta;
    if(!metti){ if(st){ st.style.transition=''; st.style.transform=''; st.style.opacity=''; st.style.transformOrigin=''; } return; }
    metti();
    const nu=$('#letStack');
    if(nu){
      nu.style.transition='none'; nu.style.transformOrigin = dir>0 ? 'right center' : 'left center';
      nu.style.transform=`perspective(1800px) rotateY(${dir>0?55:-55}deg)`; nu.style.opacity='.4';
      nu.getBoundingClientRect();
      nu.style.transition='transform .26s ease-out, opacity .26s ease-out';
      nu.style.transform=''; nu.style.opacity='';
      await new Promise(r=>setTimeout(r,270));
      nu.style.transition=''; nu.style.transformOrigin='';
    }
  } finally { _lbGira=false; }
}
document.addEventListener('touchstart',e=>{
  if(!(LET.modo==='pagina' && LET.strumento==='mano') || e.touches.length!==1) { _lbSf=null; return; }
  if(!e.target.closest || !e.target.closest('#letArea')) return;
  const t=e.touches[0]; _lbSf={x:t.clientX,y:t.clientY,t:Date.now()};
},{passive:true});
document.addEventListener('touchmove',e=>{ if(_lbSf && e.touches.length!==1) _lbSf=null; },{passive:true});
document.addEventListener('touchend',e=>{
  const s=_lbSf; _lbSf=null;
  if(!s || LET.modo!=='pagina') return;
  const t=e.changedTouches&&e.changedTouches[0]; if(!t) return;
  const dx=t.clientX-s.x, dy=t.clientY-s.y;
  if(Math.abs(dx)<50 || Math.abs(dx)<Math.abs(dy)*1.4 || Date.now()-s.t>900) return;
  /* pagina ingrandita: prima si scorre fino al bordo, poi si gira */
  const a=$('#letArea');
  if(a && a.scrollWidth>a.clientWidth+4){
    if(dx<0 && a.scrollLeft+a.clientWidth<a.scrollWidth-4) return;
    if(dx>0 && a.scrollLeft>4) return;
  }
  lbSfoglia(dx<0?1:-1);
});
