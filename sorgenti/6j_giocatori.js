/* ================= GIOCATORI, LIVELLI E STORIA DEI GIOCHI =================
   I giocatori si aggiungono DENTRO a ogni gioco e restano nell'archivio finché
   non li elimini tu; sono gli stessi in tutti i giochi. Ogni partita finita (o
   ogni serie, dove il gioco non ha una fine vera) si salva con il giocatore, la
   data, il livello e il risultato: da lì escono la pagina del giocatore, le
   statistiche, il grafico e la classifica. I tre livelli (facile, medio,
   difficile) scelgono le domande, le frasi, i personaggi e le parole. */

/* ---------- i tre livelli ---------- */
const LIVELLI={
  1:{et:'Facile',    ic:'🟢', c:'#4fd1a5'},
  2:{et:'Medio',     ic:'🔵', c:'#5bb8f0'},
  3:{et:'Difficile', ic:'🔴', c:'#ff6b81'}
};
const GIOCHI_INFO={
  cruciverba:{et:'Cruciverba biblico', ic:'🧩'},
  verofalso: {et:'Vero o Falso',       ic:'❓'},
  impiccato: {et:'Impiccato biblico',  ic:'🔤'},
  memoria:   {et:'Memoria',            ic:'🃏'},
  tris:      {et:'X e O biblico',      ic:'❌'},
  blitz:     {et:'Blitz biblico',      ic:'⏱️'},
  mistero:   {et:'Mistero Biblico',    ic:'🕯️'},
  completa:  {et:'Completa la frase',  ic:'📝'},
  chisono:   {et:'Chi sono io?',       ic:'🕵️'},
  ruota:     {et:'La Ruota Biblica',   ic:'🎡'},
  versetto:  {et:'Costruisci il Versetto', ic:'🧱'},
  viaggio:   {et:'Il Viaggio Biblico', ic:'🧭'},
  codice:    {et:'Codice Segreto Biblico', ic:'🔐'},
  parola:    {et:'Parola Misteriosa',  ic:'💡'},
  tempio:    {et:'Il Tempio della Conoscenza', ic:'🏛️'},
  sprint:    {et:'Bibbia Sprint',      ic:'⚡'},
  scalata:   {et:'La Scalata Biblica', ic:'🏆'}
};
/* il livello scelto in ogni gioco resta salvato: si riparte da dove eri */
function livelloGioco(id){ const l=(stato.imp.livGiochi||{})[id]; return (l>=1&&l<=3)?l:2; }
function impostaLivelloGioco(id,n){ stato.imp.livGiochi=stato.imp.livGiochi||{}; stato.imp.livGiochi[id]=n; salva(); }
/* le domande hanno quattro fasce (facile, medio, forte, esperti): per i giochi
   le ultime due insieme fanno il livello «difficile» */
function livDomanda(d){ const x=d.dif||2; return x<=1?1:x===2?2:3; }
function domandeLivello(lg,liv){ return DOMANDE.filter(d=>d.lg===lg && livDomanda(d)===liv); }
/* Vero o Falso pesca da TUTTE le domande della lingua (5.000): il livello non ne taglia via nessuna, ma decide
   quali escono più spesso — a «facile» soprattutto le facili, a «difficile» soprattutto le difficili, le altre ogni tanto */
const _domTutte={};
function domandeTutte(lg){ return _domTutte[lg]||(_domTutte[lg]=DOMANDE.filter(d=>d.lg===lg)); }
function pesoDomanda(d,liv){
  const centro = liv===1 ? 1 : liv===2 ? 2 : 3.5;
  return Math.pow(0.25,Math.abs((d.dif||2)-centro));
}
/* `n` domande diverse per un gioco (Vero o Falso, X e O, Blitz): tutte e 5.000 di quella lingua, col peso del
   livello, e mai una già uscita in uno di questi giochi finché non sono uscite tutte ('gd' + lingua è la loro
   memoria in comune) */
function pescaDomandeGioco(lg,liv,n){
  return pescaNuovePesate(domandeTutte(lg),n,'gd'+lg,chiaveDomanda,d=>pesoDomanda(d,liv)).lista;
}
function segnaDomandaGioco(d){ segnaVisteGioco('gd'+d.lg,[chiaveDomanda(d)]); }
/* `n` domande diverse, a caso ma col peso del livello (senza memoria: per le prove) */
function scegliDomandePesate(lg,liv,n){
  return domandeTutte(lg).map(d=>({d,k:-Math.log(1-Math.random())/pesoDomanda(d,liv)}))
    .sort((a,b)=>a.k-b.k).slice(0,n).map(x=>x.d);
}
/* le frasi di «Chi ha detto?» hanno già i loro tre livelli */
function citazioniLivello(lg,liv){ return CITAZIONI.filter(c=>c.lg===lg && (c.dif||2)===liv); }
/* quante frasi ha ogni personaggio nella Bibbia: più ne ha, più è famoso */
const _fama={};
function famaPersonaggi(lg){
  if(_fama[lg]) return _fama[lg];
  const m={}; CITAZIONI.forEach(c=>{ if(c.lg===lg) m[c.chi]=(m[c.chi]||0)+1; });
  return (_fama[lg]=m);
}
function livFama(n){ return n>=20?1:n>=8?2:3; }
/* i libri più conosciuti sono i facili, i profeti minori e le lettere i difficili */
const LIBRI_NOTI=[1,2,8,17,18,19,20,23,27,32,40,41,42,43,44,45,49,66];
const LIBRI_MEDI=[3,4,5,6,7,9,10,11,12,21,24,26,46,47,48,50,58,59];
function livLibro(id){ return LIBRI_NOTI.includes(id)?1:LIBRI_MEDI.includes(id)?2:3; }
/* le parole della Bibbia sono in ordine di frequenza: le più usate sono le facili */
function livParola(rango){ return rango<1200?1:rango<4000?2:3; }
/* i tre pulsanti del livello, uguali in ogni gioco: stanno a destra nella
   stessa riga dei giocatori (così la pagina fissa dell'iPad non perde spazio) */
function htmlLivello(id,spento){
  const l=livelloGioco(id);
  return `<div class="gg-liv">
    <span class="gg-tit gg-tit-liv">🎚️ Livello</span>
    <div class="gg-liv-op">${[1,2,3].map(n=>`<button class="op ${l===n?'on':''}" ${spento?'disabled':''} onclick="cambiaLivello('${id}',${n})">${LIVELLI[n].ic} ${LIVELLI[n].et}</button>`).join('')}</div>
  </div>`;
}
/* cambiando livello si ricomincia da capo, come cambiando lingua */
const NUOVA_PARTITA={
  cruciverba:()=>nuovoCruciverbaPagina(), verofalso:()=>nuovoVeroFalso(), impiccato:()=>nuovoImpiccato(),
  memoria:()=>nuovaMemoria(), tris:()=>nuovoTris(), blitz:()=>vBlitz(), mistero:()=>nuovaPartitaMistero(),
  completa:()=>nuovaPartitaCompleta(), chisono:()=>nuovaPartitaChiSono(),
  ruota:()=>nuovaRuota(), versetto:()=>nuovaPartitaVersetto(), viaggio:()=>vViaggio(), codice:()=>{ CDC.liv=null; vCodice(); },
  parola:()=>nuovaParola(), tempio:()=>vTempio(), sprint:()=>{ gnFermaTimer(); SPR.fine=null; vSprint(); }, scalata:()=>nuovaScalata()
};
function cambiaLivello(id,n){
  if(livelloGioco(id)===n) return;
  impostaLivelloGioco(id,n);
  (NUOVA_PARTITA[id]||vGiochi)();
}

/* ---------- i giocatori ---------- */
const COLORI_GIOC=['#ff6b81','#ff9f43','#ffd166','#4fd1a5','#2ec4b6','#5bb8f0','#7f8cff','#b18cff','#ff8fd0','#a3e635'];
function elencoGiocatori(){ if(!Array.isArray(stato.giocatori)) stato.giocatori=[]; return stato.giocatori; }
function elencoPartite(){ if(!Array.isArray(stato.partite)) stato.partite=[]; return stato.partite; }
function trovaGiocatore(i){ return i ? (elencoGiocatori().find(g=>g.i===i)||null) : null; }
function giocatoreAttuale(){ return trovaGiocatore(stato.imp.giocatoreAttuale); }
function trisGiocatore(s){ return trovaGiocatore((stato.imp.trisGiocatori||{})[s]); }
function _rgbTripla(h){ const n=parseInt(String(h||'#888888').slice(1),16)||0; return ((n>>16)&255)+','+((n>>8)&255)+','+(n&255); }
function inizialeGiocatore(g){ return esc((Array.from(String(g.n||'?'))[0]||'?').toUpperCase()); }
function aggiungiGiocatore(nome){
  nome=String(nome||'').replace(/\s+/g,' ').trim().slice(0,24);
  if(!nome) return {errore:'vuoto'};
  const gia=elencoGiocatori().find(g=>ck(g.n)===ck(nome));
  if(gia) return {errore:'esiste',g:gia};
  const usati=new Set(elencoGiocatori().map(g=>g.c));
  const c=COLORI_GIOC.find(x=>!usati.has(x))||COLORI_GIOC[elencoGiocatori().length%COLORI_GIOC.length];
  const g={i:uid(),n:nome,c,q:Date.now()};
  elencoGiocatori().push(g); salva();
  return {g};
}
/* si toglie il giocatore e, con lui, tutte le sue partite */
function eliminaGiocatoreDavvero(i){
  stato.giocatori=elencoGiocatori().filter(g=>g.i!==i);
  stato.partite=elencoPartite().filter(r=>r.p!==i);
  if(stato.imp.giocatoreAttuale===i) stato.imp.giocatoreAttuale=null;
  const t=stato.imp.trisGiocatori; if(t){ ['X','O'].forEach(s=>{ if(t[s]===i) t[s]=null; }); }
  salva();
}
function _gioBlitzAttivo(){ return (typeof BLZ!=='undefined' && BLZ.attivo) || (typeof gnTimerAttivo==='function' && gnTimerAttivo()); }
function scegliGiocatore(i){
  if(_gioBlitzAttivo()) return;
  if(typeof GARA!=='undefined' && GARA.attiva && GARA.gioco===GIO.vista && i!==GARA.ordine[GARA.turno]){
    avvisa('Durante la gara si gioca a turno: quando hai finito tocca «Tocca a …»','no'); return; }
  const cambia=stato.imp.giocatoreAttuale!==i;
  stato.imp.giocatoreAttuale=i; salva();
  /* ogni partita è di UN giocatore: chi entra ne comincia una nuova (il
     cruciverba resta com'è, la griglia si può passare di mano) */
  if(cambia && ['verofalso','impiccato','memoria','completa','chisono','ruota','versetto','parola','scalata','mistero'].includes(GIO.vista)) return NUOVA_PARTITA[GIO.vista]();
  /* nel Viaggio, nel Codice e nel Tempio si vedono subito i progressi di chi entra a giocare */
  if(cambia && ['viaggio','codice','tempio','sprint'].includes(GIO.vista)){
    if(GIO.vista==='viaggio'){ VIA.prova=null; VIA.esito=null; if(VIA.j) viaPreparaProva(); }
    if(GIO.vista==='codice') CDC.liv=null;
    if(GIO.vista==='tempio'){ TPL.prove=null; TPL.esitoFase=null; }
    if(GIO.vista==='sprint') SPR.fine=null;
    return vGiochi();
  }
  aggiornaBarraGiocatori();
}
/* in X e O giocano in due: ogni giocatore si assegna a X o a O */
function scegliSegnoTris(s,i){
  if(!TRIS.finito && (TRIS.totali>0)){ avvisa('Aspetta la fine della partita per cambiare i giocatori','no'); return; }
  const t=stato.imp.trisGiocatori=stato.imp.trisGiocatori||{X:null,O:null};
  const altro=s==='X'?'O':'X';
  if(t[s]===i) t[s]=null; else { t[s]=i; if(t[altro]===i) t[altro]=null; }
  salva(); aggiornaBarraGiocatori(); vTris();
}
/* X e O: chi gioca con la ❌ e chi con il ⭕, scelto da due elenchi (id vuoto = nessuno) */
function assegnaSegnoTris(s,i){
  if(!TRIS.finito && (TRIS.totali>0)){ avvisa('Aspetta la fine della partita per cambiare i giocatori','no'); vTris(); return; }
  const t=stato.imp.trisGiocatori=stato.imp.trisGiocatori||{X:null,O:null};
  const altro=s==='X'?'O':'X';
  t[s]=i||null;
  if(i && t[altro]===i) t[altro]=null;
  salva(); aggiornaBarraGiocatori(); vTris();
}
/* la riga dei giocatori, dentro a ogni gioco: si tocca un giocatore per aprire
   la sua pagina, la freccia ▶ per farlo giocare, ＋ per aggiungerne un altro */
function htmlGiocatori(id){
  const el=elencoGiocatori(), att=stato.imp.giocatoreAttuale;
  const tris=(id==='tris'), t=stato.imp.trisGiocatori||{};
  const blocca=(id==='blitz' && _gioBlitzAttivo());
  const chips=el.map(g=>{
    const n=elencoPartite().reduce((a,r)=>a+((r.g===id&&r.p===g.i)?1:0),0);
    const sel = tris ? (t.X===g.i||t.O===g.i) : g.i===att;
    const az = tris
      ? `<button class="gc-segno ${t.X===g.i?'on':''}" title="${esc(g.n)} gioca con la X" onclick="scegliSegnoTris('X','${g.i}')">❌</button><button class="gc-segno ${t.O===g.i?'on':''}" title="${esc(g.n)} gioca con la O" onclick="scegliSegnoTris('O','${g.i}')">⭕</button>`
      : `<button class="gc-gioca" title="${g.i===att?esc(g.n)+' sta giocando':'Fai giocare '+esc(g.n)}" onclick="scegliGiocatore('${g.i}')">${g.i===att?'✓':'▶'}</button>`;
    return `<div class="gc ${sel?'attivo':''}" style="--gc:${g.c};--gcr:${_rgbTripla(g.c)}">
      <button class="gc-corpo" title="Vedi le partite di ${esc(g.n)}" onclick="apriGiocatore('${id}','${g.i}')"><span class="gc-av">${inizialeGiocatore(g)}</span><span class="gc-nome">${esc(g.n)}</span>${n?`<span class="gc-n">${n}</span>`:''}</button>${az}</div>`;
  }).join('');
  /* i tre livelli stanno SOPRA alla riga dei giocatori (nel Cruciverba non ci sono) */
  const liv = id==='cruciverba' ? '' : `<div class="gio-livelli">${htmlLivello(id,blocca||(typeof garaDi==='function'&&garaDi(id)))}</div>`;
  return `${id==='cruciverba'?'':'<div class="gio-testa-gioc" id="gioGioc">'}${liv}<div class="gio-giocatori"${id==='cruciverba'?' id="gioGioc"':''}>
    <div class="gg-sx ${blocca?'spento':''}">
      <span class="gg-tit">👥 Giocatori</span>
      <button class="gc-nuovo" onclick="nuovoGiocatore()">＋ Nuovo giocatore</button>
      ${tris?'':`<button class="gc-nuovo gc-gara ${typeof garaDi==='function'&&garaDi(id)?'on':''}" onclick="apriGara('${id}')" title="Più giocatori in gara, con la classifica">🏁 Gara</button>`}
      <div class="gg-lista">${chips}</div>
    </div>
  </div>${id==='cruciverba'?'':'</div>'}${typeof htmlGara==='function'?htmlGara(id):''}`;
}
/* cambio solo la riga, senza ridisegnare il gioco (nel Cruciverba si perderebbe
   quello che hai già scritto) */
function aggiornaBarraGiocatori(){
  const b=$('#gioGioc'); if(!b || GIO.vista==='hub') return;
  const s=$('#garaStriscia'); if(s) s.remove();
  b.outerHTML=htmlGiocatori(GIO.vista);
}
function nuovoGiocatore(){
  apri('Nuovo giocatore',
    `<div class="campo"><label>Come si chiama?</label>
       <input type="text" id="ngNome" maxlength="24" placeholder="Il nome del giocatore" autocomplete="off"
         onkeydown="if(event.key==='Enter'){ event.preventDefault(); salvaNuovoGiocatore(); }"></div>
     <p class="sotto" style="margin:12px 0 0">Resta nell'elenco di tutti i giochi finché non lo elimini tu.</p>`,
    `<button class="bt pi" onclick="chiudi()">Annulla</button>
     <button class="bt pr" onclick="salvaNuovoGiocatore()">＋ Aggiungi</button>`,420);
  setTimeout(()=>{ const i=$('#ngNome'); if(i) i.focus(); },150);
}
function salvaNuovoGiocatore(){
  const inp=$('#ngNome'); const r=aggiungiGiocatore(inp?inp.value:'');
  if(r.errore==='vuoto'){ avvisa('Scrivi il nome del giocatore','no'); return; }
  if(r.errore==='esiste'){ avvisa('C\'è già un giocatore che si chiama così','no'); return; }
  chiudi();
  /* il giocatore nuovo è subito quello che gioca (in X e O, il primo segno libero) */
  if(GIO.vista==='tris'){
    const t=stato.imp.trisGiocatori=stato.imp.trisGiocatori||{X:null,O:null};
    if(!t.X) t.X=r.g.i; else if(!t.O) t.O=r.g.i;
    salva(); aggiornaBarraGiocatori(); vTris();
  } else scegliGiocatore(r.g.i);
  avvisa(r.g.n+' è nell\'elenco dei giocatori','ok');
}
function chiediEliminaGiocatore(i){
  const g=trovaGiocatore(i); if(!g) return;
  conferma(`Vuoi eliminare ${g.n}?\n\nSpariscono anche tutte le sue partite, in tutti i giochi. Non si può tornare indietro.`,()=>{
    eliminaGiocatoreDavvero(i);
    GIO.giocatore=null; vGiochi();
    avvisa(g.n+' è stato eliminato','ok');
  },'Elimina');
}

/* ---------- le partite: ognuna col suo giocatore, data, livello e risultato ----------
   `chiave` è il numero di QUELLA partita: dove il risultato cresce mentre giochi
   (una serie di frasi, un cruciverba verificato più volte) si aggiorna la stessa
   riga invece di farne tante. `modo`: «migliore» tiene il risultato più alto,
   «ultimo» tiene sempre l'ultimo. */
function _lgGioco(id){
  const m={cruciverba:()=>CRV.lg, verofalso:()=>VF.lg, impiccato:()=>IMP.lg, memoria:()=>MEM.lg,
           tris:()=>TRIS.lg, blitz:()=>BLZ.lg, mistero:()=>MIS.lg, completa:()=>CPL.lg, chisono:()=>CSI.lg,
           ruota:()=>RUO.lg, versetto:()=>VRS.lg, viaggio:()=>VIA.lg, codice:()=>CDC.lg,
           parola:()=>PMI.lg, tempio:()=>TPL.lg, sprint:()=>SPR.lg, scalata:()=>SCL.lg};
  return m[id]?m[id]():'';
}
function salvaRisultato(gioco,giocatoreId,chiave,perc,det,modo){
  if(!trovaGiocatore(giocatoreId)) return null;
  perc=Math.max(0,Math.min(100,Math.round(+perc||0)));
  const lista=elencoPartite();
  let r=lista.find(x=>x.k===chiave && x.p===giocatoreId && x.g===gioco);
  if(r){
    if(modo==='migliore'){ if(perc>r.perc){ r.perc=perc; r.d=det||r.d; } }
    else { r.perc=perc; r.d=det||r.d; }
  } else {
    r={i:uid(), g:gioco, p:giocatoreId, k:chiave, q:Date.now(), perc, liv:livelloGioco(gioco), lg:_lgGioco(gioco), d:det||{}};
    lista.push(r);
  }
  salva();
  if(typeof garaRegistra==='function') garaRegistra(gioco,giocatoreId,r);   /* in gara: è il punteggio del turno (6n_gara.js) */
  return r;
}
/* il risultato di chi sta giocando (se c'è: senza giocatore la partita non si salva) */
function salvaRisultatoAttuale(gioco,chiave,perc,det,modo){
  const g=giocatoreAttuale(); if(!g) return null;
  return salvaRisultato(gioco,g.i,chiave,perc,det,modo);
}
function partiteDi(gioco,giocatoreId,liv){
  return elencoPartite().filter(r=>r.g===gioco && r.p===giocatoreId && (!liv || r.liv===liv));
}
function classePremio(p){
  const k=PREMI.findIndex(x=>p>=x.min);
  return ['oro','argento','bronzo','no'][k<0?3:k];
}
function statistiche(lista){
  let somma=0, meglio=0; const premi={oro:0,argento:0,bronzo:0,no:0};
  lista.forEach(r=>{ somma+=r.perc; if(r.perc>meglio) meglio=r.perc; premi[classePremio(r.perc)]++; });
  return {n:lista.length, media:lista.length?Math.round(somma/lista.length):0, migliore:meglio, punti:somma, premi};
}
function descrizioneRisultato(r){
  const d=r.d||{};
  switch(r.g){
    case 'cruciverba': return d.tot?`${d.giuste} lettere giuste su ${d.tot}`:'';
    case 'verofalso':  return d.tot?`${d.giuste} giuste su ${d.tot}`:'';
    case 'impiccato':  return d.parola?(d.vinta?`«${d.parola}» indovinata con ${d.sbagli} err${d.sbagli===1?'ore':'ori'}`:`«${d.parola}» non indovinata`):'';
    case 'memoria':    return d.mosse?`${d.coppie} coppie in ${d.mosse} mosse`:'';
    case 'tris':       return (d.segno?`Con ${d.segno==='X'?'❌':'⭕'} · `:'')+(d.esito==='V'?'vittoria':d.esito==='P'?'pareggio':'sconfitta')+(d.tot?` · ${d.giuste} giuste su ${d.tot}`:'');
    case 'blitz':      return d.tot?`${d.giuste} giuste su ${d.tot} in 60 secondi`:'';
    case 'mistero':    { const c=(typeof misTrova==='function')?misTrova(d.caso):null; return `${c?c.ic+' '+gnT(c.titolo,'it'):'Caso'} risolto · ${'⭐'.repeat(d.stelle||1)} · ${gnNum(d.punti)} punti · indizi ${d.indizi}/${d.tot}`; }
    case 'completa':   return d.tot?`${d.giuste} giuste su ${d.tot} frasi`:'';
    case 'chisono':    return d.tot?`${d.punti} punti su ${d.tot*3} · ${d.tot} personagg${d.tot===1?'io':'i'}`:'';
    case 'ruota':      return `${gnNum(d.punti)} punti · ${d.giuste||0} giuste, ${d.sbagliate||0} sbagliate`;
    case 'versetto':   return d.sfida?`${d.versetti} versetti in 60 secondi · ${gnNum(d.punti)} punti`:`${d.versetti||0} versetti · ${gnNum(d.punti)} punti`;
    case 'viaggio':    { const v=(typeof viaViaggi==='function'?viaViaggi():[]).find(x=>x.id===d.viaggio); return `${v?gnT(v.titolo,'it'):'Viaggio'} completato · ${d.errori||0} errori`; }
    case 'codice':     { const c=(typeof cdcTutti==='function'?cdcTutti():[]).find(x=>x.id===d.codice); return `${c?gnT(c.titolo,c.lg||'it'):'Codice'} aperto · ${gnNum(d.punti)} punti`; }
    case 'parola':     return d.parola?(d.vinto?`«${d.parola}» trovata · ${gnNum(d.punti)} punti`:`«${d.parola}» non trovata`):'';
    case 'tempio':     return `${d.maestro?'Maestro · ':''}Fase ${d.fase}: ${d.giuste} su 5${d.passata?' · superata':''}`;
    case 'sprint':     return `${d.giuste} giuste su ${d.domande} · combo ${d.combo} · ${gnNum(d.punti)} punti`;
    case 'scalata':    return `${d.vinto?'🏆 Campione! ':''}Domanda ${d.livello} · ${gnNum(d.vincita)} punti`;
  }
  return '';
}
function dataGioco(q){ return q ? new Date(q).toLocaleDateString('it-IT',{day:'numeric',month:'short'}) : '—'; }
function dataOraGioco(q){
  if(!q) return 'Senza data';
  const d=new Date(q);
  return d.toLocaleDateString('it-IT',{weekday:'short',day:'numeric',month:'short',year:'numeric'})+' · '+
         d.toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit'});
}

/* ---------- classifica di ogni gioco, per livello ----------
   «Azzera» non cancella le partite dei giocatori: dice solo da quando conta la
   classifica, così la storia di ognuno resta intatta. */
function classificaLivello(id,liv){
  const da=(stato.imp.classificaDa||{})[id]||0;
  const migliore={};
  elencoPartite().forEach(r=>{
    if(r.g!==id || (r.liv!==liv && r.liv!==0) || (r.q||0)<da) return;
    if(!(r.p in migliore) || r.perc>migliore[r.p]) migliore[r.p]=r.perc;
  });
  return Object.keys(migliore).map(p=>({g:trovaGiocatore(p),perc:migliore[p]})).filter(x=>x.g)
    .sort((a,b)=>b.perc-a.perc || a.g.n.localeCompare(b.g.n,'it'));
}
function azzeraClassifica(id){
  conferma('Vuoi azzerare la classifica di questo gioco?\n\nLe partite dei giocatori restano salvate nelle loro pagine.',()=>{
    stato.imp.classificaDa=stato.imp.classificaDa||{};
    stato.imp.classificaDa[id]=Date.now();
    salva(); vGiochi();
  },'Azzera');
}
function htmlClassificaGioco(id){
  const liv=livelloGioco(id);
  const righe=classificaLivello(id,liv).slice(0,5);
  if(!righe.length) return '';
  return `<div class="classifica-box">
    <div class="classifica-tit">🏆 Classifica · ${LIVELLI[liv].ic} ${LIVELLI[liv].et}<button class="bt pi mini" onclick="azzeraClassifica('${id}')">Azzera</button></div>
    ${righe.map((x,i)=>`<div class="classifica-riga cr-clic" onclick="apriGiocatore('${id}','${x.g.i}')"><b>${['🥇','🥈','🥉'][i]||(i+1)+'.'}</b> ${esc(x.g.n)}<span>${x.perc}%</span></div>`).join('')}
  </div>${typeof htmlVincitoriGare==='function'?htmlVincitoriGare(id):''}`;
}

/* ---------- da un vecchio archivio: il nome unico e la classifica di prima ----------
   Prima c'era UN nome solo, scritto nella pagina principale dei giochi, e una
   classifica per gioco. Una volta sola, quei nomi diventano giocatori e i
   punteggi di prima le loro prime partite (senza data né livello). */
function migraGiocatori(){
  if(stato.imp.giocatoriMigrati) return;
  stato.imp.giocatoriMigrati=true;
  const nomi=[];
  const aggiungi=n=>{ n=String(n||'').replace(/\s+/g,' ').trim(); if(n && !nomi.some(x=>ck(x)===ck(n))) nomi.push(n); };
  aggiungi(stato.imp.nomeGiocatore);
  const cl=stato.imp.classificheGiochi||{};
  Object.keys(cl).forEach(g=>(cl[g]||[]).forEach(r=>aggiungi(r.nome)));
  nomi.forEach(n=>aggiungiGiocatore(n));
  Object.keys(cl).forEach(g=>(cl[g]||[]).forEach(r=>{
    const p=elencoGiocatori().find(x=>ck(x.n)===ck(r.nome)); if(!p) return;
    elencoPartite().push({i:uid(), g, p:p.i, k:'vecchia', q:0, perc:Math.round(+r.punti||0), liv:0, lg:'', d:{}});
  }));
  const att=elencoGiocatori().find(x=>ck(x.n)===ck(stato.imp.nomeGiocatore||''));
  if(att) stato.imp.giocatoreAttuale=att.i;
  salva();
}

/* ---------- la pagina di un giocatore, dentro a ogni gioco ---------- */
function apriGiocatore(id,pid){
  fermaBlitzSeAttivo(); chiudiProiezioneGioco();
  GIO.vista=id; GIO.giocatore=pid; GIO.gpLiv=0; GIO.gpTutte=false;
  vGiochi(); window.scrollTo(0,0);
}
function chiudiGiocatore(){ GIO.giocatore=null; vGiochi(); window.scrollTo(0,0); }
function giocaConGiocatore(pid,segno){
  if(segno){ const t=stato.imp.trisGiocatori=stato.imp.trisGiocatori||{X:null,O:null};
    const altro=segno==='X'?'O':'X'; t[segno]=pid; if(t[altro]===pid) t[altro]=null; }
  else stato.imp.giocatoreAttuale=pid;
  salva(); chiudiGiocatore();
}
function filtraGiocatore(n){ GIO.gpLiv=n; vGiochi(); }
function mostraTuttePartite(){ GIO.gpTutte=!GIO.gpTutte; vGiochi(); }

/* curva morbida che passa per i punti (senza uscire dal riquadro del grafico) */
function curvaLiscia(pts,minY,maxY){
  const cl=v=>Math.max(minY,Math.min(maxY,v));
  let d='M'+pts[0][0].toFixed(1)+' '+pts[0][1].toFixed(1);
  for(let i=0;i<pts.length-1;i++){
    const p0=pts[i-1]||pts[i], p1=pts[i], p2=pts[i+1], p3=pts[i+2]||p2;
    const c1x=p1[0]+(p2[0]-p0[0])/6, c1y=cl(p1[1]+(p2[1]-p0[1])/6);
    const c2x=p2[0]-(p3[0]-p1[0])/6, c2y=cl(p2[1]-(p3[1]-p1[1])/6);
    d+=` C${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}
/* il grafico del percorso: una partita dopo l'altra, con i premi a colori */
const COL_PREMIO={oro:'#f5c542',argento:'#c7cfdd',bronzo:'#d98b4a',no:'#7b849c'};
function svgPercorso(lista,colore){
  const dati=lista.slice().sort((a,b)=>(a.q||0)-(b.q||0)).slice(-40);
  const n=dati.length; if(!n) return '';
  const W=720,H=300,PL=46,PR=84,PT=24,PB=46, pw=W-PL-PR, ph=H-PT-PB;   /* a destra c'è posto per le scritte dei premi */
  const X=i=>PL+(n<2?pw/2:pw*i/(n-1));
  const Y=v=>PT+ph*(1-Math.max(0,Math.min(100,v))/100);
  const pts=dati.map((r,i)=>[X(i),Y(r.perc)]);
  const linea=n>1?curvaLiscia(pts,PT,PT+ph):'';
  const fondo=(PT+ph).toFixed(1);
  const area=n>1?`${linea} L${pts[n-1][0].toFixed(1)} ${fondo} L${pts[0][0].toFixed(1)} ${fondo} Z`:'';
  const griglia=[0,25,50,75,100].map(v=>`<line x1="${PL}" x2="${W-PR}" y1="${Y(v).toFixed(1)}" y2="${Y(v).toFixed(1)}" class="gp-gr"/><text x="${PL-9}" y="${(Y(v)+4).toFixed(1)}" class="gp-et" text-anchor="end">${v}</text>`).join('');
  const soglie=PREMI.slice(0,3).map(p=>{ const c=COL_PREMIO[classePremio(p.min)];
    return `<line x1="${PL}" x2="${W-PR}" y1="${Y(p.min).toFixed(1)}" y2="${Y(p.min).toFixed(1)}" class="gp-so" style="stroke:${c}"/><text x="${W-PR+8}" y="${(Y(p.min)+4).toFixed(1)}" class="gp-so-t" text-anchor="start" style="fill:${c}">${p.et} ${p.min}</text>`; }).join('');
  /* le date sotto: non tutte, altrimenti si sovrappongono */
  const passo=n<=6?1:Math.ceil((n-1)/4);
  const date=dati.map((r,i)=>(i%passo===0||i===n-1)?`<text x="${X(i).toFixed(1)}" y="${H-PB+22}" class="gp-et" text-anchor="middle">${esc(dataGioco(r.q))}</text>`:'').join('');
  const dots=dati.map((r,i)=>{
    const cl=COL_PREMIO[classePremio(r.perc)], ultimo=i===n-1, lv=LIVELLI[r.liv];
    const desc=descrizioneRisultato(r);
    return `<circle cx="${pts[i][0].toFixed(1)}" cy="${pts[i][1].toFixed(1)}" r="${ultimo?7:5}" fill="${cl}" stroke="var(--fondo)" stroke-width="2.5"><title>${esc(dataOraGioco(r.q))} · ${lv?esc(lv.et)+' · ':''}${r.perc}%${desc?' — '+esc(desc):''}</title></circle>`;
  }).join('');
  return `<svg viewBox="0 0 ${W} ${H}" class="gp-svg" role="img" aria-label="Il percorso delle partite">
    <defs><linearGradient id="gpArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${colore}" stop-opacity=".42"/><stop offset="1" stop-color="${colore}" stop-opacity="0"/></linearGradient></defs>
    ${griglia}${soglie}
    ${n>1?`<path d="${area}" fill="url(#gpArea)"/><path d="${linea}" class="gp-linea" style="stroke:${colore}"/>`:''}
    ${dots}${date}
  </svg>`;
}

function vPaginaGiocatore(){
  document.body.classList.remove('gio-fissa');
  const id=GIO.vista, g=trovaGiocatore(GIO.giocatore);
  if(!g){ GIO.giocatore=null; return vGiochi(); }
  const info=GIOCHI_INFO[id]||{et:'Gioco',ic:'🎮'};
  const tutte=partiteDi(id,g.i), filtro=GIO.gpLiv;
  const lista=tutte.filter(r=>!filtro||r.liv===filtro);
  const st=statistiche(lista);
  const ordinate=lista.slice().sort((a,b)=>(b.q||0)-(a.q||0));
  const conData=tutte.filter(r=>r.q).sort((a,b)=>a.q-b.q);
  const primo=conData.length?conData[0].q:0, ultimo=conData.length?conData[conData.length-1].q:0;
  const tris=(id==='tris');
  const filtri=[0,1,2,3].map(n=>{
    const c=n?tutte.filter(r=>r.liv===n).length:tutte.length;
    return `<button class="op ${filtro===n?'on':''}" onclick="filtraGiocatore(${n})">${n?LIVELLI[n].ic+' '+LIVELLI[n].et:'Tutti i livelli'} <b>${c}</b></button>`;
  }).join('');
  const liv=[1,2,3].map(l=>{
    const L=tutte.filter(r=>r.liv===l), s=statistiche(L);
    return `<div class="gp-lv"><span class="gp-lv-et">${LIVELLI[l].ic} ${LIVELLI[l].et}</span>
      <div class="gp-lv-barra"><i style="width:${s.media}%;background:${LIVELLI[l].c}"></i></div>
      <span class="gp-lv-n">${L.length?`${s.media}% · ${L.length} partit${L.length===1?'a':'e'}`:'—'}</span></div>`;
  }).join('');
  const vecchie=tutte.filter(r=>!r.liv);
  const sv=statistiche(vecchie);
  const righe=(GIO.gpTutte?ordinate:ordinate.slice(0,25)).map(r=>{
    const pr=premioDi(r.perc), lv=LIVELLI[r.liv], desc=descrizioneRisultato(r);
    return `<div class="gp-riga ${classePremio(r.perc)}">
      <div class="gp-r-data"><b>${esc(dataOraGioco(r.q))}</b><span>${esc(desc)||(r.k==='vecchia'?'risultato salvato prima dei livelli':'')}</span></div>
      <div class="gp-r-tag">${lv?`<span class="gp-liv-b" style="--lc:${lv.c}">${lv.ic} ${lv.et}</span>`:''}${r.lg?`<span class="gp-lg">${r.lg==='ro'?'🇷🇴':'🇮🇹'}</span>`:''}</div>
      <div class="gp-r-ris"><span class="gp-perc">${r.perc}%</span><span class="gp-med" title="${pr.et}">${pr.ic}</span></div>
    </div>`;
  }).join('');
  pinta(`
  <div class="gio-pagina gp-pagina" style="--gc:${g.c};--gcr:${_rgbTripla(g.c)}">
    <button class="bt pi" onclick="chiudiGiocatore()">← ${info.ic} ${esc(info.et)}</button>

    <div class="gp-hero">
      <div class="gp-avatar">${inizialeGiocatore(g)}</div>
      <div class="gp-chi">
        <div class="gp-nome">${esc(g.n)}</div>
        <div class="gp-sotto">${info.ic} ${esc(info.et)} · ${tutte.length?`${tutte.length} partit${tutte.length===1?'a':'e'} giocat${tutte.length===1?'a':'e'}`:'non ha ancora giocato'}</div>
        ${primo?`<div class="gp-date">Dalla prima partita, il ${esc(dataGioco(primo))} · l'ultima, il ${esc(dataGioco(ultimo))}</div>`:''}
      </div>
      <div class="gp-az">
        ${tris?`<button class="bt pr" onclick="giocaConGiocatore('${g.i}','X')">❌ Gioca con la X</button><button class="bt pr" onclick="giocaConGiocatore('${g.i}','O')">⭕ Gioca con la O</button>`
              :`<button class="bt pr" onclick="giocaConGiocatore('${g.i}')">▶ Gioca</button>`}
        <button class="bt pi gp-del" onclick="chiediEliminaGiocatore('${g.i}')" title="Elimina il giocatore">🗑 Elimina</button>
      </div>
    </div>

    ${typeof gnHtmlProgressi==='function'?gnHtmlProgressi(id,g.i):''}

    <div class="scelta gp-filtri" style="--ac:${g.c}">
      <div class="scelta-tit">🎚️ Livello</div>
      <div class="scelta-op">${filtri}</div>
    </div>

    ${lista.length?`
    <div class="gp-kpi">
      <div class="kpi" style="--qc:#5bb8f0"><div class="n">${st.n}</div><div class="e">Partite</div></div>
      <div class="kpi" style="--qc:#4fd1a5"><div class="n">${st.media}%</div><div class="e">Media</div></div>
      <div class="kpi" style="--qc:#ffd166"><div class="n">${st.migliore}%</div><div class="e">Migliore</div></div>
      <div class="kpi" style="--qc:#ff6b81"><div class="n">${st.punti.toLocaleString('it-IT')}</div><div class="e">Punti in tutto</div></div>
    </div>

    <div class="gp-premi">
      ${[['oro','🏆','Oro'],['argento','🥈','Argento'],['bronzo','🥉','Bronzo'],['no','🎗️','Ci riprova']].map(p=>
        `<div class="gp-pr ${p[0]}"><span class="gp-pr-ic">${p[1]}</span><b>${st.premi[p[0]]}</b><i>${p[2]}</i></div>`).join('')}
    </div>

    <div class="scheda gp-grafico">
      <h2>📈 Il suo percorso</h2>
      <p class="sotto" style="margin:0 0 6px">${lista.length>40?'Le ultime 40 partite, ':'Una partita dopo l\'altra, '}con il premio di ognuna. Tocca un punto per i dettagli.</p>
      ${svgPercorso(lista,g.c)}
      <div class="gp-legenda"><span><i style="background:${COL_PREMIO.oro}"></i>Oro</span><span><i style="background:${COL_PREMIO.argento}"></i>Argento</span><span><i style="background:${COL_PREMIO.bronzo}"></i>Bronzo</span><span><i style="background:${COL_PREMIO.no}"></i>Ci riprova</span></div>
    </div>

    <div class="scheda gp-livelli">
      <h2>🎚️ Come va nei livelli</h2>
      ${liv}
      ${vecchie.length?`<div class="gp-lv"><span class="gp-lv-et">⚪ Prima dei livelli</span><div class="gp-lv-barra"><i style="width:${sv.media}%;background:#8b93a7"></i></div><span class="gp-lv-n">${sv.media}% · ${vecchie.length} partit${vecchie.length===1?'a':'e'}</span></div>`:''}
    </div>

    <div class="scheda gp-partite">
      <h2>🗓️ Le sue partite</h2>
      ${righe}
      ${ordinate.length>25?`<div style="text-align:center;margin-top:12px"><button class="bt pi" onclick="mostraTuttePartite()">${GIO.gpTutte?'Mostra meno':'Mostra tutte le '+ordinate.length}</button></div>`:''}
    </div>`
    :`<div class="scheda gp-vuoto">
      <div class="gp-vuoto-ic">${info.ic}</div>
      <h2>${filtro?'Nessuna partita a questo livello':`${esc(g.n)} non ha ancora giocato`}</h2>
      <p class="sotto" style="margin:0 auto">${filtro?'Prova un altro livello, oppure':'Le sue partite compariranno qui, con la data e il risultato, e il grafico del suo percorso. Premi'} <b>▶ Gioca</b>${tris?'':' e comincia la prima partita.'}</p>
    </div>`}
  </div>`);
}
