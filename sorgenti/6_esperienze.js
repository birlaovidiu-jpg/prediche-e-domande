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
  document.body.classList.remove('pred-fissa');
  /* stesso motivo di vPrediche(): se resto "in modifica" da un salvataggio
     fatto da ⚙ senza passare da «‹ Esperienze», la prossima aperta dalla
     griglia si aprirebbe già in modifica da sola */
  PR_MOD=false; _predAperta=null; PR_LG=null;
  const q=ck(FE.q);
  const tutte=tutteEsperienze();
  const c=contaLingue(tutte);
  const perTipo=t=>tutte.filter(e=>tipoEsp(e)===t).length;
  const el=tutte.filter(e=>
      (FE.tipo==='tutte'||tipoEsp(e)===FE.tipo) &&
      (FE.lg==='tutte'||(e.lg||'it')===FE.lg) &&
      (!q||ck(e.tit+' '+(e.chi||'')+' '+(e.testo||'')).includes(q)))
    .sort((a,b)=>a.tit.localeCompare(b.tit,'it',{sensitivity:'base',numeric:true}));
  pinta(`
  <h1>Esperienze</h1>
  <div class="filtri filtri2" style="margin-top:14px">
    <div class="fila-f">
      <div class="campo stretto"><label>Che cosa sono</label>
        <div class="segm">
          <button class="${FE.tipo==='tutte'?'on':''}" onclick="setE('tipo','tutte')">Tutte <b>${tutte.length}</b></button>
          <button class="${FE.tipo==='vera'?'on':''}" onclick="setE('tipo','vera')">📗 Vere <b>${perTipo('vera')}</b></button>
          <button class="${FE.tipo==='racconto'?'on':''}" onclick="setE('tipo','racconto')">📘 Racconti <b>${perTipo('racconto')}</b></button>
        </div></div>
      <div class="campo stretto"><label>Lingua</label>
        <div class="segm">
          <button class="${FE.lg==='tutte'?'on':''}" onclick="setE('lg','tutte')">Tutte <b>${c.tot}</b></button>
          <button class="${FE.lg==='it'?'on':''}" onclick="setE('lg','it')">🇮🇹 <b>${c.it}</b></button>
          <button class="${FE.lg==='ro'?'on':''}" onclick="setE('lg','ro')">🇷🇴 <b>${c.ro}</b></button>
        </div></div>
      <div class="campo largo"><label>Cerca</label>
        <div class="cerca"><input type="search" placeholder="Titolo, persona o parola…" value="${esc(FE.q)}"
          oninput="FE.q=this.value; clearTimeout(window._te); window._te=setTimeout(cercaEsperienze,260)"></div></div>
      <button class="bt pr" onclick="esperienzaVuota()">✚ Nuova</button>
      <button class="bt pi" onclick="apriImportaPptx('esperienza')" title="Importa da un file PowerPoint">📥 Importa PowerPoint</button>
    </div>
  </div>
  ${el.length?`<div class="griglia g-pred">${el.map(e=>cartaEsperienza(e)).join('')}</div>`
    :`<div class="vuoto"><span class="em">🌟</span>Non c'è ancora nessuna esperienza.<br>
      <button class="bt pr" style="margin-top:16px" onclick="esperienzaVuota()">✚ Aggiungi la prima</button></div>`}`);
  attaccaCopertinePrediche();
}
function setE(k,v){ FE[k]=v; vEsperienze(); }
/* stesso motivo della ricerca nelle prediche: pinta() rifà la casella da capo,
   il fuoco va rimesso a mano dopo, altrimenti una lettera sì e una no si perde */
function cercaEsperienze(){
  vEsperienze();
  const inp=document.querySelector('.filtri .cerca input');
  if(inp){ inp.focus(); const n=inp.value.length; inp.setSelectionRange(n,n); }
}
function cartaEsperienza(e){
  const lg=(e.lg||'it')==='it'?'it':'ro';
  const meta=[e.chi&&esc(e.chi), e.rif&&('📖 '+esc(e.rif))].filter(Boolean).join(' · ');
  return `<div class="scheda-min" data-apre-pred="1" data-i="${e.i}">
    <div class="cm-cop es-${lg}">
      <div class="cm-tit grande">${esc(e.tit)}</div>
      <span class="tag ${lg} cm-tag">${lg==='it'?'IT':'RO'}</span>
      <button class="cm-loc" onclick="event.stopPropagation();aggiungiLuogo('${e.i}')" title="${etichettaLuogo(e.i)}">📍${numeroLuoghi(e.i)?` ${numeroLuoghi(e.i)}`:''}</button>
    </div>
    <div class="cm-info">
      <span class="cm-meta">${bolloEsp(e)}${meta?' · '+meta:''}</span>
      <span class="cm-az">
        <button class="bt mini pr" onclick="event.stopPropagation();proiettaEsperienza('${e.i}')" title="Proietta">▶︎</button>
        <button class="bt mini pi" style="color:#ff8b9c" onclick="event.stopPropagation();eliminaEsperienza('${e.i}')" title="Elimina">🗑</button>
      </span>
    </div></div>`;
}
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
/* nuova esperienza: niente modulo da riempire, si scrive dritti sul foglio
   come in Word — titolo/tipo/persona/testo biblico si sistemano poi con ⚙,
   stessa idea già usata per le prediche */
function esperienzaVuota(){
  const dati={ tit:'Nuova esperienza', lg:(FE.lg==='ro'?'ro':'it'),
               tipo:(FE.tipo==='vera'?'vera':'racconto'),
               chi:'', rif:'', data:oggi(), sfondo:'alba', testo:'', all:[], mia:true };
  dati.i=uid();
  stato.esperienze.push(dati);
  const a=annot(dati.i);
  a.stile=Object.assign({},a.stile||{},{fam:'serif',dim:22,interl:1.5});
  a.html=`<div class="fp-cap"><h2 class="fp-tit">${esc(dati.tit)}</h2></div><p><br></p>`;
  salva();
  leggiPredica(dati.i);
  setTimeout(()=>{ modificaTesto(dati.i); setTimeout(selezionaTitoloFoglio,30); },160);
  avvisa('Scrivi qui l\'esperienza: hai tutti i comandi in alto','ok');
}
/* qui si sistemano solo i dati (titolo/tipo/persona/testo biblico/lingua/
   sfondo/allegati) — il racconto si scrive da «✎ Modifica» sul foglio */
function nuovaEsperienza(i){
  if(!i){ esperienzaVuota(); return; }
  /* quello che stavi scrivendo sul foglio si salva prima di aprire ⚙ (come nelle prediche) */
  salvaFoglioAperto();
  const e=trovaEsp(i); if(!e) return;
  const mia=stato.esperienze.some(x=>x.i===i);
  apri('Titolo, persona, testo biblico',`
   <div class="griglia" style="gap:13px">
    ${mia?'':`<p class="sotto" style="margin:0;color:var(--oro)">Questa viene dall'archivio: salvando ne creo una tua copia.</p>`}
    <div class="fila">
      <div class="campo" style="flex:2"><label>Titolo</label><input type="text" id="neT" value="${esc(e.tit)}"></div>
      <div class="campo" style="flex:0 0 150px"><label>Che cos'è</label><select id="neI">
        <option value="racconto" ${tipoEsp(e)==='racconto'?'selected':''}>📘 Racconto</option>
        <option value="vera" ${tipoEsp(e)==='vera'?'selected':''}>📗 Storia vera</option></select></div>
      <div class="campo" style="flex:0 0 130px"><label>Lingua</label><select id="neL">
        <option value="it" ${(e.lg||'it')==='it'?'selected':''}>Italiano</option>
        <option value="ro" ${e.lg==='ro'?'selected':''}>Română</option></select></div>
    </div>
    <div class="fila">
      <div class="campo" style="flex:2"><label>Chi l'ha vissuta o raccontata</label><input type="text" id="neC" value="${esc(e.chi||'')}"></div>
      <div class="campo" style="flex:1"><label>Testo biblico</label><input type="text" id="neR" value="${esc(e.rif||'')}" placeholder="es. Giovanni 14:1-3"></div>
      <div class="campo" style="flex:0 0 130px"><label>Data</label><input type="text" id="neD" value="${esc(e.data||oggi())}"></div>
    </div>
    <div class="campo"><label>Sfondo per la proiezione</label>
      <select id="neS">${Object.keys(SFONDI).map(k=>`<option value="${k}" ${(e.sfondo||'alba')===k?'selected':''}>${SFONDI[k].ic} ${SFONDI[k].et}</option>`).join('')}</select></div>
    <p class="sotto" style="margin:0">Il racconto si scrive da «✎ Modifica» sul foglio — qui sistemi solo questi dati.</p>
    <div class="campo"><label>Allegati — foto o documenti</label><input type="file" id="neF" multiple></div>
    <div id="neEl" style="font-size:12.5px;color:var(--tx3)">${(e.all||[]).map(a=>'📎 '+esc(a.nome)).join(' · ')}</div>
   </div>`,
   `${mia?`<button class="bt pi" style="margin-right:auto;color:#ff8b9c" onclick="eliminaEsperienza('${e.i}')">Elimina</button>`:''}
    <button class="bt pi" onclick="chiudi()">Annulla</button>
    <button class="bt pr" onclick="salvaEsperienza('${e.i}')">Salva</button>`,660);
}
async function salvaEsperienza(i){
  const tit=$('#neT').value.trim();
  if(!tit){ avvisa('Serve almeno il titolo','no'); return; }
  const mia = i && stato.esperienze.some(x=>x.i===i);
  const orig = i && trovaEsp(i);
  /* se sto copiando una dell'archivio (non è "mia"), il racconto già scritto
     lì non va perso — resta quello finché non lo cambi tu da «✎ Modifica» */
  const e = mia ? orig : {i:uid(), all:[], testo:(orig&&orig.testo)||''};
  Object.assign(e,{ tit, tipo:$('#neI').value, chi:$('#neC').value.trim(), rif:$('#neR').value.trim(),
                    data:$('#neD').value.trim(), sfondo:$('#neS').value });
  e.all=e.all||[];
  /* il titolo nuovo va anche sul foglio: se no, al salvataggio dopo, il foglio rimetteva quello vecchio */
  if(mia) titoloSulFoglio(i,tit);
  const f=$('#neF').files;
  for(const file of f){
    const id=uid();
    try{ await salvaAllegato(id,file); e.all.push({id,nome:file.name,tipo:file.type||'',peso:file.size}); }
    catch(err){ avvisa('Allegato non salvato: '+file.name,'no'); }
  }
  if(!mia) stato.esperienze.push(e);
  salva(); chiudi(); vEsperienze(); avvisa('Dati salvati','ok');
}
function eliminaEsperienza(i){
  const e=trovaEsp(i);
  conferma('Vuoi togliere «'+((e&&e.tit)||'questa esperienza')+'» dall\'elenco?\n\nSe è una delle tue sparisce; se viene dall\'archivio la puoi rimettere da ☁️ Dati.',()=>{
    stato.esperienze=stato.esperienze.filter(x=>x.i!==i);
    stato.espVia=stato.espVia||{}; stato.espVia[i]=1;
    salva(); chiudi();
    document.body.classList.remove('pred-fissa'); PR_MOD=false; _predAperta=null;
    vai('esperienze'); avvisa('Tolta dall\'elenco','ok');
  },'Elimina');
}
