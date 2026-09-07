/* ================= ESPERIENZE ================= */
const FE={ q:'', tipo:'tutte', lg:'tutte' };
/* Ogni esperienza dice da sola che cos'è:
   «vera» = fatto realmente accaduto, con nomi e date che si possono controllare;
   «racconto» = storia scritta per illustrare un pensiero, vera nel senso che
   può succedere e che la morale è giusta, ma non è una testimonianza documentata. */
function tipoEsp(e){ return (e && e.tipo==='vera') ? 'vera' : 'racconto'; }
const ETI_ESP={ vera:{et:'Storia vera',ic:'📗',su:'fatto realmente accaduto'},
                racconto:{et:'Racconto',ic:'📘',su:'storia scritta per illustrare'} };
function bolloEsp(e){
  const t=tipoEsp(e), x=ETI_ESP[t];
  return `<span class="esp-bollo ${t}" title="${x.su}">${x.ic} ${x.et}</span>`;
}
function vEsperienze(){
  const q=ck(FE.q);
  const tutte=tutteEsperienze();
  const perTipo=t=>tutte.filter(e=>tipoEsp(e)===t).length;
  const el=tutte.filter(e=>
      (FE.tipo==='tutte'||tipoEsp(e)===FE.tipo) &&
      (FE.lg==='tutte'||(e.lg||'it')===FE.lg) &&
      (!q||ck(e.tit+' '+(e.chi||'')+' '+(e.testo||'')).includes(q)))
    .sort((a,b)=>(b.data||'').localeCompare(a.data||'')||a.tit.localeCompare(b.tit,'it'));
  pinta(`
  <div class="occhiello">Testimonianze</div>
  <h1>Esperienze</h1>
  <p class="sotto">Le esperienze da raccontare in chiesa. Ognuna dice se è un <b>fatto realmente accaduto</b>
     o un <b>racconto</b> scritto per illustrare un pensiero, e porta il suo testo biblico.</p>
  ${strisciaLingue(tutte)}
  <div class="filtri filtri2" style="margin-top:14px">
    <div class="fila-f">
      <div class="campo stretto"><label>Che cosa sono</label>
        <div class="segm">
          <button class="${FE.tipo==='tutte'?'on':''}" onclick="setE('tipo','tutte')">Tutte · ${tutte.length}</button>
          <button class="${FE.tipo==='vera'?'on':''}" onclick="setE('tipo','vera')">📗 Vere · ${perTipo('vera')}</button>
          <button class="${FE.tipo==='racconto'?'on':''}" onclick="setE('tipo','racconto')">📘 Racconti · ${perTipo('racconto')}</button>
        </div></div>
      <div class="campo stretto"><label>Lingua</label>
        <div class="segm">
          <button class="${FE.lg==='tutte'?'on':''}" onclick="setE('lg','tutte')">Tutte</button>
          <button class="${FE.lg==='it'?'on':''}" onclick="setE('lg','it')">🇮🇹</button>
          <button class="${FE.lg==='ro'?'on':''}" onclick="setE('lg','ro')">🇷🇴</button>
        </div></div>
      <div class="campo largo"><label>Cerca</label>
        <div class="cerca"><input type="search" placeholder="Titolo, persona o parola…" value="${esc(FE.q)}"
          oninput="FE.q=this.value; clearTimeout(window._te); window._te=setTimeout(vEsperienze,260)"></div></div>
      <button class="bt pr" onclick="nuovaEsperienza()">✚ Nuova</button>
    </div>
  </div>
  ${el.length?`<div class="el">${el.map(e=>`
    <div class="rg" onclick="vediEsperienza('${e.i}')">
      <div style="font-size:22px">${e.all&&e.all.length?'📎':'🌟'}</div>
      <div class="cp"><b>${esc(e.tit)}</b>
        <span>${bolloEsp(e)}${e.rif?' · 📖 '+esc(e.rif):''}${e.chi?' · '+esc(e.chi):''}</span></div>
      <div class="az">
        <span class="tag ${(e.lg||'it')==='it'?'it':'ro'}">${(e.lg||'it')==='it'?'IT':'RO'}</span>
        <button class="bt mini pr" onclick="event.stopPropagation();proiettaEsperienza('${e.i}')">▶︎</button>
        <button class="bt mini pi" onclick="event.stopPropagation();nuovaEsperienza('${e.i}')">✎</button>
      </div></div>`).join('')}</div>`
    :`<div class="vuoto"><span class="em">🌟</span>Non c'è ancora nessuna esperienza.<br>
      <button class="bt pr" style="margin-top:16px" onclick="nuovaEsperienza()">✚ Aggiungi la prima</button></div>`}`);
}
function setE(k,v){ FE[k]=v; vEsperienze(); }
function tutteEsperienze(){
  const via=stato.espVia||{};
  return ESPERIENZE.concat(stato.esperienze).filter(e=>!via[e.i]);
}
function trovaEsp(i){ return tutteEsperienze().find(e=>e.i===i); }
function vediEsperienza(i){
  const e=trovaEsp(i); if(!e) return;
  /* si apre a foglio pieno, uguale alle prediche */
  leggiPredica(i);
}
function proiettaEsperienza(i){
  const e=trovaEsp(i); if(!e) return;
  proietta(slidePredica({tit:e.tit,tema:e.chi||'Esperienza',rif:'',blocchi:analizzaPredica(e.testo||'')}),
           e.sfondo||'alba', e.tit);
}
function nuovaEsperienza(i){
  const e = i ? trovaEsp(i) : null;
  apri(e?'Modifica esperienza':'Nuova esperienza',`
   <div class="griglia" style="gap:13px">
    <div class="campo"><label>Titolo</label><input type="text" id="neT" value="${esc(e?e.tit:'')}"></div>
    <div class="fila">
      <div class="campo" style="flex:2"><label>Chi l'ha vissuta o raccontata</label><input type="text" id="neC" value="${esc(e?e.chi||'':'')}"></div>
      <div class="campo" style="flex:0 0 140px"><label>Data</label><input type="text" id="neD" value="${esc(e?e.data||oggi():oggi())}"></div>
    </div>
    <div class="campo"><label>Sfondo per la proiezione</label>
      <select id="neS">${Object.keys(SFONDI).map(k=>`<option value="${k}" ${(e?e.sfondo:'alba')===k?'selected':''}>${SFONDI[k].ic} ${SFONDI[k].et}</option>`).join('')}</select></div>
    <div class="campo"><label>Racconto</label><textarea id="neX" style="min-height:200px">${esc(e?e.testo||'':'')}</textarea></div>
    <div class="campo"><label>Allegati — foto o documenti</label><input type="file" id="neF" multiple></div>
    <div id="neEl" style="font-size:12.5px;color:var(--tx3)">${(e&&e.all||[]).map(a=>'📎 '+esc(a.nome)).join(' · ')}</div>
   </div>`,
   `${e&&e.i[0]!=='e'?`<button class="bt pi" style="margin-right:auto;color:#ff8b9c" onclick="eliminaEsperienza('${e.i}')">Elimina</button>`:''}
    <button class="bt pi" onclick="chiudi()">Annulla</button>
    <button class="bt pr" onclick="salvaEsperienza(${e?`'${e.i}'`:'null'})">Salva</button>`,660);
}
async function salvaEsperienza(i){
  const tit=$('#neT').value.trim();
  if(!tit){ avvisa('Serve almeno il titolo','no'); return; }
  const mia = i && stato.esperienze.some(x=>x.i===i);
  const e = mia ? trovaEsp(i) : {i:uid(), all:[]};
  Object.assign(e,{ tit, chi:$('#neC').value.trim(), data:$('#neD').value.trim(),
                    sfondo:$('#neS').value, testo:$('#neX').value.trim() });
  e.all=e.all||[];
  const f=$('#neF').files;
  for(const file of f){
    const id=uid();
    try{ await salvaAllegato(id,file); e.all.push({id,nome:file.name,tipo:file.type||'',peso:file.size}); }
    catch(err){ avvisa('Allegato non salvato: '+file.name,'no'); }
  }
  if(!mia) stato.esperienze.push(e);
  salva(); chiudi(); vEsperienze(); avvisa('Esperienza salvata','ok');
}
function eliminaEsperienza(i){
  const e=trovaEsp(i);
  conferma('Vuoi togliere «'+((e&&e.tit)||'questa esperienza')+'» dall\'elenco?\n\nSe è una delle tue sparisce; se viene dall\'archivio la puoi rimettere da ☁️ Dati.',()=>{
    stato.esperienze=stato.esperienze.filter(x=>x.i!==i);
    stato.espVia=stato.espVia||{}; stato.espVia[i]=1;
    salva(); chiudi();
    document.body.classList.remove('pred-fissa'); _predAperta=null;
    vai('esperienze'); avvisa('Tolta dall\'elenco','ok');
  },'Elimina');
}
