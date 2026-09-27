/* ================= GIOCHI BIBLICI DAL 9 AL 16 (seconda parte) =================
   Parola misteriosa, Tempio della conoscenza, Bibbia Sprint, Scalata biblica.
   Gli aiuti in comune (gnT, gnRifBt, gnPescaDomande, gnFinePartita, gnProgressi…) sono in 6l_giochi3.js. */

/* ======================= 13. 💡 PAROLA MISTERIOSA ======================= */
const PMI_CAT={
  personaggi:{ic:'👤',it:'Personaggi',ro:'Personaje'}, re:{ic:'👑',it:'Re',ro:'Împărați'}, profeti:{ic:'🔥',it:'Profeti',ro:'Proroci'},
  apostoli:{ic:'✝️',it:'Apostoli',ro:'Apostoli'}, luoghi:{ic:'🌍',it:'Luoghi',ro:'Locuri'}, libri:{ic:'📖',it:'Libri biblici',ro:'Cărți biblice'},
  oggetti:{ic:'🏺',it:'Oggetti',ro:'Obiecte'}, popoli:{ic:'🏕️',it:'Popoli',ro:'Popoare'}
};
const PMI_VITE=5;
const PMI={ lg:'it', w:null, parola:'', indovinate:[], errori:0, indizi:0, lettere:0, finito:false, vinto:false, punti:0, pid:null, tentativo:false };
function pmiParole(){ return (typeof GIOCHI_NUOVI!=='undefined' && GIOCHI_NUOVI.parole)||[]; }
function nuovaParola(){
  if(garaPassa('parola',nuovaParola)) return;           /* in gara: la parola dopo è del prossimo giocatore */
  const liv=livelloGioco('parola'), lg=PMI.lg;
  const w=pescaNuovePesate(pmiParole(),1,'gnparola'+lg,x=>x.id,x=>gnPesoDif(x.difficulty,liv)).lista[0];
  segnaVisteGioco('gnparola'+lg,[w.id]);
  Object.assign(PMI,{w, parola:_pulisciParola(gnT(w.answer,lg)), indovinate:[], errori:0, indizi:0, lettere:0,
                     finito:false, vinto:false, punti:0, pid:uid(), tentativo:false});
  vParola();
}
function pmiLingua(lg){ PMI.lg=lg; nuovaParola(); }
function pmiVinta(){ return PMI.parola.split('').every(c=>PMI.indovinate.includes(c)); }
/* meno lettere e meno indizi usi, più punti prendi */
function pmiCalcolaPunti(){ return Math.max(50, 1000-PMI.indizi*150-PMI.lettere*40-PMI.errori*60); }
function pmiChiudi(vinto){
  PMI.finito=true; PMI.vinto=vinto;
  PMI.punti = vinto ? pmiCalcolaPunti() : 0;
  PMI.fine=gnFinePartita('parola',PMI.pid,PMI.punti/10,{punti:PMI.punti,parola:PMI.parola,vinto,indizi:PMI.indizi,errori:PMI.errori});
  garaFatto('parola',vinto,PMI.punti);
}
function pmiLettera(c){
  if(PMI.finito || PMI.indovinate.includes(c)) return;
  PMI.indovinate.push(c); PMI.lettere++;
  if(!PMI.parola.includes(c)) PMI.errori++;
  if(pmiVinta()) pmiChiudi(true);
  else if(PMI.errori>=PMI_VITE) pmiChiudi(false);
  vParola();
}
function pmiIndizio(){
  const h=(PMI.w.hints[PMI.lg]||PMI.w.hints.it);
  if(PMI.finito || PMI.indizi>=h.length) return;
  PMI.indizi++; vParola();
}
function pmiDiLaParola(){
  if(PMI.finito) return;
  apri('Dì la parola',`<div class="campo"><label>Qual è la parola misteriosa?</label>
      <input type="text" id="pmiInput" autocomplete="off" autocapitalize="characters" onkeydown="if(event.key==='Enter'){event.preventDefault();pmiProva();}"></div>
    <p class="sotto" style="margin:10px 0 0">Se sbagli si spegne una lampada.</p>`,
    `<button class="bt pi" onclick="chiudi()">Annulla</button><button class="bt pr" onclick="pmiProva()">Prova</button>`,420);
  setTimeout(()=>{ const i=$('#pmiInput'); if(i) i.focus(); },150);
}
function pmiProva(){
  const i=$('#pmiInput'); const t=_pulisciParola(i?i.value:''); if(!t) return;
  chiudi();
  if(t===PMI.parola){ PMI.parola.split('').forEach(c=>{ if(!PMI.indovinate.includes(c)) PMI.indovinate.push(c); }); pmiChiudi(true); }
  else { PMI.errori++; avvisa('Non è questa la parola','no'); if(PMI.errori>=PMI_VITE) pmiChiudi(false); }
  vParola();
}
function vParola(){
  if(GIO.giocatore) return vPaginaGiocatore();
  if(!PMI.w) return nuovaParola();
  const lg=PMI.lg, w=PMI.w, cat=PMI_CAT[w.category]||{ic:'❓',it:w.category}, hints=w.hints[lg]||w.hints.it;
  const mostra=PMI.parola.split('').map(c=>PMI.finito||PMI.indovinate.includes(c)?c:'_');
  const TASTI='ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  pinta(`
  <div class="gio-pagina gn-pagina">
  ${gnTesta('parola','💡','Parola Misteriosa')}
  <div class="scelte scelte-3">
    ${gnLingua(PMI,'pmiLingua')}
    ${gnRicomincia('nuovaParola()','Nuova parola')}
  </div>
  <div class="scheda pmi-card">
    <p class="pmi-cat">CATEGORIA: <b>${cat.ic} ${esc((cat[lg]||cat.it).toUpperCase())}</b></p>
    <div class="pmi-lampade" title="${PMI_VITE-PMI.errori} lampade accese">${Array.from({length:PMI_VITE},(_,k)=>`<span class="${k<PMI_VITE-PMI.errori?'accesa':'spenta'}">🪔</span>`).join('')}</div>
    <p class="imp-parola pmi-parola">${mostra.join(' ')}</p>
    <div class="pmi-indizi">${hints.slice(0,PMI.indizi).map((h,k)=>`<p>💡 <b>${k+1}.</b> ${esc(h)}</p>`).join('')}</div>
    ${PMI.finito?`
      <div class="gn-esito ${PMI.vinto?'si':'no'}"><b>${PMI.vinto?'✓ PAROLA TROVATA!':'✗ Le lampade si sono spente'}</b>
        <span class="gn-punti">${PMI.vinto?`${gnNum(PMI.punti)} punti`:`La parola era: ${esc(gnT(w.answer,lg))}`}</span>
        ${gnRifBt(w.biblicalReference,lg)}</div>
      ${gnRigaRecord(PMI.fine)}
      <div class="gn-centro"><button class="bt blu" onclick="nuovaParola()">🔄 Gioca ancora</button></div>
      ${htmlPremio('parola',PMI.punti/10,{chiave:PMI.pid})}`
    :`<div class="gn-centro pmi-az">
        <button class="bt pi" ${PMI.indizi>=hints.length?'disabled':''} onclick="pmiIndizio()">💡 Indizio ${PMI.indizi}/${hints.length} <small>(−150)</small></button>
        <button class="bt pi" onclick="pmiDiLaParola()">✍️ Dì la parola</button>
        <span class="pmi-valore">Vale adesso: <b>${gnNum(pmiCalcolaPunti())}</b> punti</span></div>
      <div class="imp-tastiera">${TASTI.map(c=>`<button class="imp-tasto ${PMI.indovinate.includes(c)?(PMI.parola.includes(c)?'giusta':'sbagliata'):''}"
        ${PMI.indovinate.includes(c)?'disabled':''} onclick="pmiLettera('${c}')">${c}</button>`).join('')}</div>`}
  </div>
  </div>`);
}

/* ======================= 14. 🏛️ IL TEMPIO DELLA CONOSCENZA ======================= */
const TPL_FASI=[
  {it:'Fondamenta',ro:'Temelia'},{it:'Colonne',ro:'Coloane'},{it:'Pareti',ro:'Pereți'},{it:'Ingresso',ro:'Intrarea'},
  {it:'Sala',ro:'Sala'},{it:'Tetto',ro:'Acoperișul'},{it:'Decorazioni',ro:'Podoabele'},{it:'Completamento',ro:'Desăvârșirea'}
];
const TPL_TIPI=['quiz','vf','associa','sequenza','personaggio','luogo'];
const TPL_ET={quiz:'❓ Quiz',vf:'✔️ Vero o falso',associa:'🔗 Associazioni',sequenza:'🔢 Sequenza',personaggio:'👤 Personaggi',luogo:'🌍 Luoghi'};
const TPL_PROVE=5, TPL_SOGLIA=4;
const TPL={ lg:'it', prove:null, i:0, giuste:0, esito:null, cur:null, animaFase:null, esitoFase:null, pid:null };
function tplStato(){ const p=gnProgressi('tempio'); if(p.fase==null){ p.fase=0; p.maestro=false; p.faseM=0; } return p; }
function tplMaestroAttivo(){ const p=tplStato(); return p.fase>=TPL_FASI.length && p.modo==='maestro'; }
function tplLingua(lg){ TPL.lg=lg; TPL.prove=null; TPL.esitoFase=null; vTempio(); }
function tplDifficile(){ return tplMaestroAttivo() || livelloGioco('tempio')===3; }
/* le 5 prove di una fase: tipi diversi, da contenuti già nel programma e da quelli nuovi */
function tplCreaProva(tipo){
  const lg=TPL.lg, dura=tplDifficile(), liv=livelloGioco('tempio');
  const centro=dura?3.5:liv;
  if(tipo==='quiz'||tipo==='vf'){
    const d=pescaNuovePesate(domandeTutte(lg),1,'gd'+lg,chiaveDomanda,x=>pesoDomanda(x,dura?3:liv)).lista[0];
    segnaDomandaGioco(d);
    if(tipo==='quiz'){ const ord=mescola([0,1,2]); return {tipo, testo:d.d, opz:ord.map(k=>d.o[k]), g:ord.indexOf(d.g), rif:gnRifDaTesto(d.v)}; }
    const vero=Math.random()<0.5, mostrata=vero?d.o[d.g]:d.o[(d.g+1+Math.floor(Math.random()*2))%3];
    return {tipo, testo:d.d, risposta:mostrata, vero};
  }
  if(tipo==='luogo'){
    const q=gnPescaDomande('tempio',lg,1,x=>x.category==='luoghi',x=>gnPesoDif(x.difficulty,centro))[0];
    return {tipo, testo:q.testo, opz:q.opz, g:q.g, rif:q.rif, spieg:q.spieg};
  }
  if(tipo==='personaggio'){
    const c=pescaNuovePesate(CITAZIONI.filter(x=>x.lg===lg),1,'gf'+lg,chiaveFrase,x=>Math.pow(0.35,Math.abs((x.dif||2)-(dura?3:liv)))).lista[0];
    segnaVisteGioco('gf'+lg,[chiaveFrase(c)]);
    const ord=mescola([0,1,2]);
    return {tipo, testo:`${lg==='ro'?'Cine a zis':'Chi ha detto'}: «${truncaTesto(c.q,170)}»?`, opz:ord.map(k=>c.o[k]), g:ord.indexOf(c.g), rif:[c.L,c.c,c.v]};
  }
  const pool=tipo==='sequenza'?GIOCHI_NUOVI.sequenze:GIOCHI_NUOVI.associazioni;
  const x=pescaNuovePesate(pool,1,'gntempio'+tipo+lg,y=>y.id,()=>1).lista[0];
  segnaVisteGioco('gntempio'+tipo+lg,[x.id]);
  const voci=x.items[lg]||x.items.it;
  if(tipo==='sequenza') return {tipo, testo:lg==='ro'?'Pune în ordine, de la primul la ultimul:':'Metti in ordine, dal primo all\'ultimo:', ord:gnOrdinaNuovo(voci), rif:x.biblicalReference};
  const coppie=voci.map(s=>s.split('=').map(z=>z.trim()));
  return {tipo, testo:lg==='ro'?'Potrivește fiecare element din stânga cu cel potrivit din dreapta:':'Abbina ogni elemento di sinistra a quello giusto di destra:', coppie, destra:mescola(coppie.map((_,i)=>i)),
          scelta:null, fatte:{}, sbagli:0, rif:x.biblicalReference};
}
function tplIniziaFase(){
  const p=tplStato(), f=tplMaestroAttivo()?p.faseM:p.fase;
  TPL.prove=Array.from({length:TPL_PROVE},(_,k)=>TPL_TIPI[(f+k)%TPL_TIPI.length]).map(tplCreaProva);
  TPL.i=0; TPL.giuste=0; TPL.esito=null; TPL.esitoFase=null; TPL.animaFase=null; TPL.pid=uid();
  vTempio();
}
function tplEsito(giusta,sc){
  if(TPL.esito) return;
  TPL.esito={giusta,sc}; if(giusta) TPL.giuste++;
  garaFatto('tempio',giusta,giusta?100:0);
  vTempio();
}
function tplRispondi(i){ const P=TPL.prove[TPL.i]; tplEsito(i===P.g,i); }
function tplVF(v){ const P=TPL.prove[TPL.i]; tplEsito(v===P.vero,v); }
function tplOrdina(k){
  const P=TPL.prove[TPL.i]; if(TPL.esito) return;
  const r=gnOrdinaTocca(P.ord,k);
  if(r===null) return vTempio();
  tplEsito(r);
}
function tplAssocia(lato,k){
  const P=TPL.prove[TPL.i]; if(TPL.esito) return;
  if(lato==='s'){ if(P.fatte[k]==null) P.scelta=k; return vTempio(); }
  if(P.scelta==null || Object.values(P.fatte).includes(k)) return;
  if(P.scelta===k){ P.fatte[k]=k; } else { P.sbagli++; P.flash=k; }
  P.scelta=null;
  if(Object.keys(P.fatte).length===P.coppie.length) return tplEsito(P.sbagli===0);
  vTempio();
}
function tplAvanti(){
  if(garaPassa('tempio',tplAvanti)) return;            /* in gara: la prova dopo è del prossimo giocatore */
  TPL.i++; TPL.esito=null;
  if(TPL.i<TPL.prove.length) return vTempio();
  const p=tplStato(), maestro=tplMaestroAttivo(), f=maestro?p.faseM:p.fase, passata=TPL.giuste>=TPL_SOGLIA;
  salvaRisultatoAttuale('tempio',TPL.pid,TPL.giuste/TPL_PROVE*100,{fase:f+1,giuste:TPL.giuste,maestro:maestro?1:0,passata:passata?1:0});
  if(passata){
    if(maestro) p.faseM++; else p.fase++;
    TPL.animaFase=f;
    if(!maestro && p.fase>=TPL_FASI.length){ p.maestroSbloccato=true; gnDaiTrofeo('tempio','Tempio della conoscenza','🏛️'); }
    if(maestro && p.faseM>=TPL_FASI.length) gnDaiTrofeo('tempio-maestro','Maestro del Tempio','🏆');
    salva();
  }
  TPL.esitoFase={passata,giuste:TPL.giuste,fase:f};
  TPL.prove=null; vTempio();
}
function tplModo(m){ const p=tplStato(); p.modo=m; salva(); TPL.prove=null; TPL.esitoFase=null; vTempio(); }
function tplRicomincia(){
  conferma('Vuoi ricominciare la costruzione dalle fondamenta?',()=>{
    const p=tplStato(); if(tplMaestroAttivo()) p.faseM=0; else { p.fase=0; } salva(); TPL.prove=null; TPL.esitoFase=null; vTempio();
  },'Ricomincia');
}
/* l'edificio: simbolico (non una ricostruzione del Tempio vero), si completa una parte alla volta */
function tplSvg(fatte,anima,oro){
  const c=oro?'#f5c542':'#e0b25c', chiaro=oro?'#fff1c2':'#f3e3c0', scuro=oro?'#a67c17':'#8a6a33';
  const parti=[
    `<rect x="40" y="300" width="320" height="26" rx="3" fill="${scuro}"/><rect x="24" y="326" width="352" height="18" rx="3" fill="${scuro}" opacity=".85"/>`,
    [80,130,180,220,270,320].map(x=>`<rect x="${x-9}" y="150" width="18" height="150" rx="4" fill="${chiaro}"/><rect x="${x-13}" y="146" width="26" height="8" rx="2" fill="${c}"/>`).join(''),
    `<rect x="60" y="160" width="280" height="140" fill="${c}" opacity=".45"/>`,
    `<path d="M180 300 L180 220 Q200 196 220 220 L220 300 Z" fill="#2a2215" stroke="${c}" stroke-width="3"/><rect x="170" y="296" width="60" height="6" fill="${chiaro}"/>`,
    `<rect x="100" y="190" width="40" height="30" rx="4" fill="#ffe7a3" opacity=".75"/><rect x="260" y="190" width="40" height="30" rx="4" fill="#ffe7a3" opacity=".75"/>`,
    `<path d="M40 150 L200 70 L360 150 Z" fill="${c}"/><rect x="36" y="146" width="328" height="10" fill="${scuro}"/>`,
    `<circle cx="200" cy="118" r="14" fill="none" stroke="${chiaro}" stroke-width="4"/><path d="M60 146 L340 146" stroke="${chiaro}" stroke-width="3" stroke-dasharray="6 6"/>`,
    `<path d="M200 70 L200 40" stroke="${chiaro}" stroke-width="4"/><path d="M200 40 L226 48 L200 56 Z" fill="#ff6b81"/><circle cx="200" cy="200" r="150" fill="url(#tplLuce)"/>`
  ];
  return `<svg viewBox="0 0 400 360" class="tpl-svg">
    <defs><radialGradient id="tplLuce"><stop offset="0" stop-color="#fff5d0" stop-opacity=".35"/><stop offset="1" stop-color="#fff5d0" stop-opacity="0"/></radialGradient></defs>
    <rect x="30" y="80" width="340" height="250" rx="10" fill="none" stroke="rgba(255,255,255,.08)" stroke-dasharray="6 8"/>
    ${parti.map((s,k)=>k<fatte?`<g class="tpl-parte ${anima===k?'nuova':''}">${s}</g>`:'').join('')}
  </svg>`;
}
function vTempio(){
  if(GIO.giocatore) return vPaginaGiocatore();
  const lg=TPL.lg, p=tplStato(), maestro=tplMaestroAttivo(), fatte=maestro?p.faseM:p.fase, n=TPL_FASI.length;
  const P=TPL.prove&&TPL.prove[TPL.i];
  let area='';
  if(P){
    const e=TPL.esito;
    let corpo='';
    if(P.tipo==='vf') corpo=`<p class="dom-testo">${esc(P.testo)}</p><p class="vf-risposta">→ ${esc(P.risposta)}</p>
      <div class="vf-bt"><button class="bt ${e?(P.vero?'giusta':(e.sc===true?'sbagliata':'spenta')):''}" ${e?'disabled':''} onclick="tplVF(true)">✔️ Vero</button>
      <button class="bt ${e?(!P.vero?'giusta':(e.sc===false?'sbagliata':'spenta')):''}" ${e?'disabled':''} onclick="tplVF(false)">✖️ Falso</button></div>`;
    else if(P.tipo==='sequenza') corpo=`<p class="dom-testo">${esc(P.testo)}</p>${gnOrdinaHtml(P.ord,'tplOrdina')}`;
    else if(P.tipo==='associa') corpo=`<p class="dom-testo">${esc(P.testo)}</p>
      <div class="tpl-ass"><div>${P.coppie.map((c,k)=>`<button class="bt ${P.fatte[k]!=null?'giusta':''} ${P.scelta===k?'scelto':''}" ${P.fatte[k]!=null||e?'disabled':''} onclick="tplAssocia('s',${k})">${esc(c[0])}</button>`).join('')}</div>
        <div>${P.destra.map(k=>`<button class="bt ${Object.values(P.fatte).includes(k)?'giusta':''} ${P.flash===k?'sbagliata':''}" ${Object.values(P.fatte).includes(k)||e?'disabled':''} onclick="tplAssocia('d',${k})">${esc(P.coppie[k][1])}</button>`).join('')}</div></div>
      ${!e?`<p class="sotto gn-centro">${P.scelta!=null?'Ora tocca quello giusto a destra':'Tocca un elemento a sinistra'}${P.sbagli?` · ${P.sbagli} sbagli`:''}</p>`:''}`;
    else corpo=`<p class="dom-testo">${esc(P.testo)}</p>${gnOpzHtml(P.opz,'tplRispondi',e,P.g)}`;
    P.flash=null;
    area=`<div class="scheda dom-card tpl-card">
      <p class="dom-sopra">${esc(TPL_FASI[fatte][lg]||TPL_FASI[fatte].it)} · Prova ${TPL.i+1} di ${TPL_PROVE} · ${TPL_ET[P.tipo]} · ✓ ${TPL.giuste}</p>
      ${corpo}
      ${e?`<div class="gn-esito ${e.giusta?'si':'no'}"><b>${e.giusta?'✓ RISPOSTA CORRETTA':'✗ RISPOSTA SBAGLIATA'}</b>
        ${P.tipo==='vf'&&!e.giusta?`<span class="gn-giusta">Era ${P.vero?'vero':'falso'}.</span>`:''}
        ${P.tipo==='sequenza'&&!e.giusta?`<span class="gn-giusta">L'ordine giusto: ${P.ord.voci.map(esc).join(' → ')}</span>`:''}
        ${P.spieg?`<span class="gn-spieg">${esc(P.spieg)}</span>`:''}${gnRifBt(P.rif,lg)}</div>
        <button class="bt blu gn-avanti" onclick="tplAvanti()">${TPL.i+1<TPL_PROVE?'Avanti →':'Vedi com\'è andata la fase'}</button>`:''}
    </div>`;
  } else {
    const ef=TPL.esitoFase, finito=fatte>=n;
    area=`<div class="scheda tpl-info">
      ${ef?`<div class="gn-esito ${ef.passata?'si':'no'}"><b>${ef.passata?`✓ FASE SUPERATA: ${esc(TPL_FASI[ef.fase][lg]||TPL_FASI[ef.fase].it)}!`:'✗ Fase non superata'}</b>
        <span class="gn-giusta">${ef.giuste} risposte giuste su ${TPL_PROVE}${ef.passata?'':` — ne servono almeno ${TPL_SOGLIA}. Riprova!`}</span></div>`:''}
      ${finito?`<h2>${maestro?'🏆 Hai completato anche la modalità Maestro!':'🏛️ Il Tempio della conoscenza è completo!'}</h2>
        ${!maestro?`<p class="tpl-maestro">🏆 MODALITÀ MAESTRO SBLOCCATA</p><p class="sotto">Ricostruisci il tempio d'oro con prove più difficili.</p>
        <button class="bt blu" onclick="tplModo('maestro')">🏆 Entra nella modalità Maestro</button>`:''}`
      :`<p class="dom-sopra">${maestro?'🏆 Modalità Maestro · ':''}Fase ${fatte+1} di ${n}</p>
        <h2 class="tpl-fase">${esc(TPL_FASI[fatte][lg]||TPL_FASI[fatte].it)}</h2>
        <p class="sotto">${TPL_PROVE} prove: quiz, vero o falso, associazioni, sequenze, personaggi e luoghi. Per costruire questa parte ne servono almeno <b>${TPL_SOGLIA}</b> giuste.</p>
        <button class="bt blu" onclick="tplIniziaFase()">▶ ${ef&&!ef.passata?'Riprova la fase':'Inizia la fase'}</button>`}
      ${p.maestroSbloccato?`<div class="gn-centro tpl-modi"><button class="op ${!maestro?'on':''}" onclick="tplModo('normale')">🏛️ Tempio</button><button class="op ${maestro?'on':''}" onclick="tplModo('maestro')">🏆 Maestro</button></div>`:''}
      <div class="gn-centro"><button class="bt pi mini" onclick="tplRicomincia()">↺ Ricomincia dalle fondamenta</button></div>
    </div>`;
  }
  pinta(`
  <div class="gio-pagina gn-pagina">
  ${gnTesta('tempio','🏛️','Il Tempio della Conoscenza')}
  <div class="scelte scelte-3">
    ${gnLingua(TPL,'tplLingua',!!P)}
    <div class="scelta" style="--ac:#ffb37a"><div class="scelta-tit">💾 Costruzione</div>
      <div class="scelta-op"><span class="sotto" style="margin:0">Salvata da sola per ${esc(gnChiGioca())}</span></div></div>
  </div>
  <div class="tpl-campo">
    <div class="scheda tpl-edificio">
      ${T3D.ok!==false&&t3dPrepara()?tpl3dHtml():tplSvg(fatte,TPL.animaFase,maestro)}
      <div class="tpl-fasi">${TPL_FASI.map((f,k)=>`<span class="${k<fatte?'fatta':k===fatte?'ora':''}">${k<fatte?'✓':k+1} ${esc(f[lg]||f.it)}</span>`).join('')}</div>
    </div>
    ${area}
  </div>
  </div>`);
  /* il Tempio in 3D (6p_tempio3d.js): le fasi costruite, e quella appena superata che sale dal basso */
  if(document.getElementById('tpl3dPosto')) tpl3dMonta(fatte,TPL.animaFase,maestro);
  TPL.animaFase=null;
}

/* ======================= 15. ⚡ BIBBIA SPRINT ======================= */
const SPR={ lg:'it', tempo:60, timer:null, attivo:false, domande:0, giuste:0, errori:[], combo:0, miglior:0, punti:0,
            corrente:null, esito:null, pid:null, fine:null, bonus:false, prossimoBonus:6, visti:[] };
function sprMolt(c){ return c>=10?5:c>=5?3:c>=3?2:1; }
function sprComboEt(c){ return c>=10?'⚡ SUPER COMBO':c>=5?'🔥 COMBO ×3':c>=3?'🔥 COMBO ×2':''; }
function sprProssima(){
  const liv=livelloGioco('sprint');
  const d=gnPescaDomande('sprint',SPR.lg,1,q=>q.question[SPR.lg].length<=95,q=>gnPesoDif(q.difficulty,liv))[0];
  SPR.corrente=d;
  SPR.bonus = SPR.domande+1>=SPR.prossimoBonus;
  if(SPR.bonus) SPR.prossimoBonus+=6+Math.floor(Math.random()*4);
}
function avviaSprint(){
  gnFermaTimer();
  Object.assign(SPR,{tempo:60,attivo:true,domande:0,giuste:0,errori:[],combo:0,miglior:0,punti:0,esito:null,pid:uid(),fine:null,prossimoBonus:6+Math.floor(Math.random()*3)});
  sprProssima();
  sprOrologio();
  vSprint();
}
function sprOrologio(){
  clearInterval(SPR.timer);
  SPR.timer=setInterval(()=>{
    SPR.tempo--;
    if(SPR.tempo<=0) sprStop();
    if(GIO.vista==='sprint') sprAggiorna();
  },1000);
}
/* in gara l'orologio di ognuno si ferma quando non è il suo turno: quando torna, riparte da qui */
function sprRiprendi(){ if(!SPR.attivo) return; SPR.inPausa=false; sprOrologio(); vSprint(); }
function sprStop(){
  clearInterval(SPR.timer); SPR.timer=null; SPR.attivo=false; SPR.tempo=Math.max(0,SPR.tempo);
  const perc=SPR.domande?SPR.giuste/SPR.domande*100:0;
  SPR.fine=gnFinePartita('sprint',SPR.pid,perc,{punti:SPR.punti,domande:SPR.domande,giuste:SPR.giuste,combo:SPR.miglior});
  SPR.fine.perc=perc;
  vSprint();
}
function sprAggiorna(){
  const t=$('#sprTempo');
  if(t && SPR.attivo){ t.textContent='00:'+String(SPR.tempo).padStart(2,'0'); t.classList.toggle('poco',SPR.tempo<=10); }
  else if(!SPR.attivo) vSprint();
}
function sprRispondi(i){
  const d=SPR.corrente; if(!SPR.attivo||!d||SPR.esito) return;
  SPR.domande++;
  const giusta=i===d.g;
  if(giusta){
    SPR.giuste++; SPR.combo++; SPR.miglior=Math.max(SPR.miglior,SPR.combo);
    SPR.punti+=100*d.dif*sprMolt(SPR.combo);
    if(SPR.bonus) SPR.tempo+=5;
  } else { SPR.combo=0; SPR.errori.push({d,sc:i}); }
  SPR.esito={sc:i,giusta,bonus:SPR.bonus&&giusta};
  garaFatto('sprint',giusta,giusta?100*d.dif*sprMolt(SPR.combo):0);
  vSprint();
  const avanti=()=>{ SPR.esito=null; if(SPR.attivo){ sprProssima(); if(GIO.vista==='sprint') vSprint(); } };
  /* in gara: dopo la risposta tocca al prossimo (il tuo orologio si ferma) */
  dopoPausa(garaDi('sprint')?700:(GIOCHI_PAUSA.blitz?250:0),()=>{ if(garaPassa('sprint',avanti)) return; avanti(); });
}
function vSprint(){
  if(GIO.giocatore) return vPaginaGiocatore();
  const c=SPR.corrente, lg=SPR.lg, et=sprComboEt(SPR.combo);
  pinta(`
  <div class="gio-pagina gn-pagina">
  ${gnTesta('sprint','⚡','Bibbia Sprint')}
  <div class="scelte scelte-3">
    ${gnLingua(SPR,'sprLingua',SPR.attivo)}
    <div class="scelta" style="--ac:#ffb37a"><div class="scelta-tit">▶️ Partita</div>
      <div class="scelta-op"><button class="op nuovo" onclick="avviaSprint()">${SPR.attivo||SPR.fine?'🔄 Ricomincia':'▶️ INIZIA'}</button></div></div>
  </div>
  ${SPR.attivo&&SPR.inPausa?`
  <div class="scheda spr-inizio spr-pausa">
    <div class="spr-tempo grande">00:${String(Math.max(0,SPR.tempo)).padStart(2,'0')}</div>
    <p class="sotto">Tocca a <b>${esc(gnChiGioca())}</b>: il tuo orologio è fermo. ${gnNum(SPR.punti)} punti finora.</p>
    <button class="bt blu spr-via" onclick="sprRiprendi()">▶ CONTINUA</button>
  </div>`:SPR.attivo&&c?`
  <div class="scheda dom-card spr-card ${SPR.bonus?'bonus':''}">
    <div class="spr-testa">
      <span class="spr-tempo ${SPR.tempo<=10?'poco':''}" id="sprTempo">00:${String(SPR.tempo).padStart(2,'0')}</span>
      <span class="spr-combo ${et?'on':''}">${et||`Combo ${SPR.combo}`}</span>
      <span class="spr-punti">${gnNum(SPR.punti)}</span>
    </div>
    ${SPR.bonus?`<p class="spr-bonus">⏱️ DOMANDA BONUS: +5 SECONDI se rispondi giusto</p>`:''}
    <p class="dom-testo">${esc(c.testo)}</p>
    ${gnOpzHtml(c.opz,'sprRispondi',SPR.esito,c.g)}
  </div>`:SPR.fine?`
  <div class="scheda gn-fine">
    <h2>⚡ Tempo scaduto!</h2>
    <div class="gn-kpi">
      ${gnKpi(esc(gnChiGioca()),'Giocatore','#8b7bff')}${gnKpi(SPR.domande,'Domande','#5bb8f0')}
      ${gnKpi(SPR.giuste,'Corrette','#5fd48f')}${gnKpi(SPR.errori.length,'Errori','#ff6b81')}
      ${gnKpi(SPR.miglior,'Migliore combo','#ffd166')}${gnKpi(gnNum(SPR.punti),'Punteggio','#4fd1a5')}
    </div>
    ${gnRigaRecord(SPR.fine)}
    ${htmlPremio('sprint',SPR.fine.perc,{chiave:SPR.pid})}
    <button class="bt blu" onclick="avviaSprint()">🔄 Gioca ancora</button>
    ${SPR.errori.length?`<details class="spr-errori"><summary>📖 Rivedi gli errori (${SPR.errori.length})</summary>
      ${SPR.errori.map(x=>`<div class="spr-err"><b>${esc(x.d.testo)}</b>
        <span>La tua risposta: <s>${esc(x.d.opz[x.sc])}</s> · Giusta: <b>${esc(x.d.opz[x.d.g])}</b></span>
        <span class="gn-spieg">${esc(x.d.spieg)}</span>${gnRifBt(x.d.rif,x.d.lg)}</div>`).join('')}</details>`:''}
  </div>`:`
  <div class="scheda spr-inizio">
    <div class="spr-tempo grande">00:60</div>
    <p class="sotto">60 secondi per rispondere a più domande che puoi. Tre giuste di fila: <b>🔥 COMBO ×2</b>, cinque: <b>×3</b>, dieci: <b>⚡ SUPER COMBO</b>. Ogni tanto una domanda bonus regala <b>+5 secondi</b>.</p>
    <button class="bt blu spr-via" onclick="avviaSprint()">▶️ INIZIA</button>
  </div>`}
  </div>`);
  if(SPR.attivo&&c) adattaCard('s|'+c.testo+'|'+(SPR.esito?1:0));
}
function sprLingua(lg){ if(SPR.attivo) return; SPR.lg=lg; SPR.fine=null; vSprint(); }

/* ======================= 16. 🏆 LA SCALATA BIBLICA ======================= */
const SCL_SCALA=[100,200,300,500,1000,2000,4000,8000,16000,32000,64000,125000,250000,500000,1000000];
const SCL_SICURI=[4,9];
const SCL={ lg:'it', passo:0, dom:null, scelta:null, confermata:false, esito:null, aiuti:{}, tolte:[], pubblico:null, libro:null,
            fine:null, vinto:false, pid:null, usate:[] };
function sclDif(passo){
  const base = passo<5?1 : passo<10?2 : passo<14?3 : 4;
  return Math.max(1,Math.min(4,base+(livelloGioco('scalata')-2)*(passo<14?1:0)));
}
function sclPesca(){
  const dif=sclDif(SCL.passo), ultima=SCL.passo===SCL_SCALA.length-1;
  /* la domanda da un milione è sempre una delle più difficili (se ne restano) */
  const tutte=q=>!SCL.usate.includes(q.id);
  const filtro=ultima && gnDomande().some(q=>tutte(q)&&q.difficulty>=4) ? q=>tutte(q)&&q.difficulty>=4 : tutte;
  const d=gnPescaDomande('scalata',SCL.lg,1,filtro,q=>gnPesoDif(q.difficulty,dif))[0];
  SCL.usate.push(d.id); return d;
}
function nuovaScalata(){
  if(garaPassa('scalata',nuovaScalata)) return;
  Object.assign(SCL,{passo:0,scelta:null,confermata:false,esito:null,aiuti:{},tolte:[],pubblico:null,libro:null,fine:null,vinto:false,pid:uid(),usate:[]});
  SCL.dom=sclPesca(); vScalata();
}
function sclLingua(lg){ SCL.lg=lg; nuovaScalata(); }
function sclGarantito(){ let g=0; SCL_SICURI.forEach(k=>{ if(SCL.passo>k) g=SCL_SCALA[k]; }); return g; }
function sclScegli(i){ if(SCL.confermata||SCL.fine||SCL.tolte.includes(i)) return; SCL.scelta=i; vScalata(); }
function sclCambia(){ SCL.scelta=null; vScalata(); }
function sclConferma(){
  if(SCL.scelta==null||SCL.confermata) return;
  SCL.confermata=true;
  const giusta=SCL.scelta===SCL.dom.g;
  SCL.esito={giusta};
  garaFatto('scalata',giusta,giusta?SCL_SCALA[SCL.passo]:0);
  if(!giusta) sclChiudi(false,sclGarantito());
  else if(SCL.passo===SCL_SCALA.length-1) sclChiudi(true,SCL_SCALA[SCL.passo]);
  vScalata();
}
function sclAvanti(){
  if(garaPassa('scalata',sclAvanti)) return;           /* in gara: la domanda dopo è del prossimo giocatore */
  SCL.passo++; SCL.scelta=null; SCL.confermata=false; SCL.esito=null; SCL.tolte=[]; SCL.pubblico=null; SCL.libro=null;
  SCL.dom=sclPesca(); vScalata();
}
function sclChiudi(vinto,vincita){
  SCL.vinto=vinto;
  const raggiunti=SCL.passo+(vinto?1:0), perc=raggiunti/SCL_SCALA.length*100;
  SCL.fine=gnFinePartita('scalata',SCL.pid,perc,{vincita,livello:raggiunti,vinto:vinto?1:0},'vincita');
  SCL.fine.vincita=vincita; SCL.fine.perc=perc;
  if(vinto) gnDaiTrofeo('campione','Campione biblico','🏆');
}
/* gli aiuti: ognuno una volta sola per partita */
function sclAiuto(k){
  if(SCL.aiuti[k]||SCL.confermata||SCL.fine) return;
  SCL.aiuti[k]=true;
  const d=SCL.dom;
  if(k==='5050'){ SCL.tolte=mescola([0,1,2,3].filter(x=>x!==d.g)).slice(0,2); if(SCL.tolte.includes(SCL.scelta)) SCL.scelta=null; }
  if(k==='libro'){ SCL.libro=nomeLibro(d.rif[0],SCL.lg); }
  if(k==='pubblico'){
    /* una distribuzione indicativa: più la domanda è difficile, meno il pubblico è sicuro */
    const sicuro=[0,0.72,0.58,0.46,0.38][d.dif]||0.5, v=[0,0,0,0];
    v[d.g]=sicuro+Math.random()*0.15;
    let resto=1-v[d.g]; const altre=[0,1,2,3].filter(x=>x!==d.g&&!SCL.tolte.includes(x));
    altre.forEach((x,j)=>{ const q=j===altre.length-1?resto:resto*Math.random(); v[x]=q; resto-=q; });
    const tot=v.reduce((a,b)=>a+b,0); SCL.pubblico=v.map(x=>Math.round(x/tot*100));
  }
  if(k==='cambia'){ SCL.dom=sclPesca(); SCL.scelta=null; SCL.tolte=[]; SCL.pubblico=null; SCL.libro=null; }
  vScalata();
}
function vScalata(){
  if(GIO.giocatore) return vPaginaGiocatore();
  if(!SCL.dom) return nuovaScalata();
  const d=SCL.dom, lg=SCL.lg, L=['A','B','C','D'], milione=SCL.passo===SCL_SCALA.length-1;
  const scala=SCL_SCALA.map((v,k)=>`<li class="${k===SCL.passo&&!SCL.fine?'ora':''} ${k<SCL.passo||(SCL.vinto&&k===SCL.passo)?'fatto':''} ${SCL_SICURI.includes(k)?'sicuro':''}">
      <span>${k+1}</span><b>${k===SCL_SCALA.length-1?'🏆 ':''}${gnNum(v)}</b>${SCL_SICURI.includes(k)?'<i>🔒</i>':''}</li>`).reverse().join('');
  const aiuto=(k,ic,et)=>`<button class="bt pi scl-aiuto ${SCL.aiuti[k]?'usato':''}" ${SCL.aiuti[k]||SCL.confermata||SCL.fine?'disabled':''} onclick="sclAiuto('${k}')">${ic} ${et}</button>`;
  pinta(`
  <div class="gio-pagina gn-pagina">
  ${gnTesta('scalata','🏆','La Scalata Biblica')}
  <div class="scelte scelte-3">
    ${gnLingua(SCL,'sclLingua')}
    ${gnRicomincia('nuovaScalata()')}
  </div>
  <div class="scl-campo">
    <div class="scl-sx">
      ${SCL.fine?`
      <div class="scheda gn-fine scl-fine ${SCL.vinto?'campione':''}">
        ${SCL.vinto?`<div class="scl-trofeo">🏆</div><h2>CAMPIONE BIBLICO!</h2>`:`<h2>${SCL.esito&&!SCL.esito.giusta?'✗ Risposta sbagliata':'Partita finita'}</h2>`}
        ${SCL.esito&&!SCL.esito.giusta?gnEsitoHtml(false,d):''}
        <p class="sotto">${esc(gnChiGioca())} porta a casa <b>${gnNum(SCL.fine.vincita)}</b> punti · domanda raggiunta: ${SCL.passo+(SCL.vinto?1:0)} su ${SCL_SCALA.length}</p>
        ${gnRigaRecord(SCL.fine)}
        ${htmlPremio('scalata',SCL.fine.perc,{chiave:SCL.pid})}
        <button class="bt blu" onclick="nuovaScalata()">🔄 Gioca ancora</button>
      </div>`:`
      <div class="scheda dom-card scl-card ${milione?'milione':''}">
        <p class="dom-sopra">${milione?'🏆 DOMANDA DA 1.000.000':`Domanda ${SCL.passo+1} di ${SCL_SCALA.length} · per ${gnNum(SCL_SCALA[SCL.passo])} punti`}</p>
        <p class="dom-testo">${esc(d.testo)}</p>
        <div class="dom-opz scl-opz">${d.opz.map((t,i)=>{
          const tolta=SCL.tolte.includes(i);
          const cl=SCL.confermata?(i===d.g?'giusta':(i===SCL.scelta?'sbagliata':'spenta')):(i===SCL.scelta?'scelto':'');
          return `<button class="bt ${cl} ${tolta?'tolta':''}" ${tolta||SCL.confermata?'disabled':''} onclick="sclScegli(${i})"><span class="gn-lett">${L[i]}</span>${tolta?'':esc(t)}
            ${SCL.pubblico&&!tolta?`<span class="scl-pub"><i style="width:${SCL.pubblico[i]}%"></i><em>${SCL.pubblico[i]}%</em></span>`:''}</button>`; }).join('')}</div>
        ${SCL.libro?`<p class="scl-libro">📖 La risposta si trova nel libro di <b>${esc(SCL.libro)}</b></p>`:''}
        ${SCL.scelta!=null&&!SCL.confermata?`<div class="scl-conf"><b>CONFERMI LA RISPOSTA?</b>
          <button class="bt blu" onclick="sclConferma()">CONFERMA</button><button class="bt pi" onclick="sclCambia()">CAMBIA</button></div>`:''}
        ${SCL.confermata&&SCL.esito&&SCL.esito.giusta?`${gnEsitoHtml(true,d,`${gnNum(SCL_SCALA[SCL.passo])} punti`)}
          ${SCL_SICURI.includes(SCL.passo)?`<p class="scl-sicuro">🔒 ${gnNum(SCL_SCALA[SCL.passo])} GARANTITI</p>`:''}
          <button class="bt blu gn-avanti" onclick="sclAvanti()">${SCL.passo+1===SCL_SCALA.length-1?'🏆 Alla domanda da 1.000.000 →':'Avanti →'}</button>`:''}
        <div class="scl-aiuti">${aiuto('5050','✂️','50/50')}${aiuto('libro','📖','Indizio biblico')}${aiuto('pubblico','👥','Aiuto')}${aiuto('cambia','🔄','Cambia domanda')}</div>
      </div>`}
    </div>
    <div class="scheda scl-scala"><p class="dom-sopra">${esc(gnChiGioca())}</p><ol>${scala}</ol></div>
  </div>
  </div>`);
}
