/* ================= GIOCHI BIBLICI =================
   Niente contenuto inventato: le parole, gli indizi e le frasi vengono dai dati
   già dentro al programma (libri della Bibbia, «Chi ha detto?», domande
   bibliche, e il testo vero delle Bibbie — PAROLE_BIBBIA, preparato da
   costruisci.py leggendo il testo stesso) — i giochi li ricombinano. Il
   Cruciverba in più ha gli indizi scritti a mano di strumenti/cruciverba/
   (persone, luoghi, cose…), sempre su fatti della Bibbia. */
/* ambito comune a Cruciverba/Impiccato: 'tutta'|'at'|'nt'|'libro' */
function dentroAmbito(L,ambito,libro){
  if(ambito==='at') return L<=39;
  if(ambito==='nt') return L>39;
  if(ambito==='libro') return L===libro;
  return true;
}
/* il versetto si mostra in un dialogo semplice (non nella proiezione a schermo
   intero: qui siamo dentro a un gioco, non a una presentazione) */
function mostraRiferimentoGioco(rif,lg){
  const cod=lg==='ro'?'ro':'it';
  const disegna=txt=>apri(rif,`<p style="font-size:17px;line-height:1.65;font-family:var(--serif);margin:0">${esc(txt)}</p>`,
    `<button class="bt pr" onclick="chiudi()">Chiudi</button>`,480);
  const pronto=testoVers(rif,cod);
  if(pronto){ disegna(pronto); return; }
  disegna('Un momento…');
  apriBibbia(cod).then(()=>{ if($('#modale').classList.contains('on')) disegna(testoVers(rif,cod)||'Versetto non disponibile.'); }).catch(()=>{});
}
/* giocatore: quello di cui si sta guardando la pagina (dentro a un gioco);
   gpLiv: il livello che filtra la sua pagina (0 = tutti); gpTutte: elenco intero */
const GIO={ vista:'hub', giocatore:null, gpLiv:0, gpTutte:false };
/* Blitz ha un timer che continua a ridisegnare la pagina ogni secondo — se
   esci senza fermarlo (bug vero trovato da Ovidiu) quel ridisegno continuava
   a scrivere sopra a QUALUNQUE altra pagina fossi andato a vedere, e
   sembrava che "la pagina si muovesse da sola" senza più poterne uscire.
   Va fermato ogni volta che si lascia Blitz, non solo a tempo scaduto. */
function fermaBlitzSeAttivo(){
  if(typeof BLZ!=='undefined' && BLZ.timer){ clearInterval(BLZ.timer); BLZ.timer=null; BLZ.attivo=false; }
  if(typeof gnFermaTimer==='function') gnFermaTimer();          /* Bibbia Sprint e «60 secondi» di Costruisci il versetto */
}
function apriGioco(id){
  if(id!=='blitz' && id!==GIO.vista) fermaBlitzSeAttivo();
  GIO.vista=id; GIO.giocatore=null;
  /* un Vero o Falso già finito, riaperto dall'elenco, riparte da capo */
  if(id==='verofalso' && !VF.corrente) VF.domande=[];
  vGiochi();
}
function tornaGiochi(){ fermaBlitzSeAttivo(); if(typeof _garaVelo==='function') _garaVelo(null); GIO.vista='hub'; GIO.giocatore=null; document.body.classList.remove('gioco-proiettore','cv-proietta'); vGiochi(); }
function vGiochi(){
  document.body.classList.remove('home-fissa','sab-fissa','pred-fissa','gio-hub-fissa');
  /* la pagina di un giocatore (dentro a un gioco) prende il posto del gioco */
  if(GIO.giocatore && GIO.vista!=='hub'){
    document.body.classList.remove('cv-attivo','cv-proietta');
    return vPaginaGiocatore();
  }
  /* schermata fissa in orizzontale per tutti i giochi ("per quanto è possibile",
     chiesto esplicitamente) TRANNE il Cruciverba: lì la pagina scorre per intero
     (le tre barre di scelta salgono e escono), così la griglia sta su tutto lo
     schermo — vedi cvAdatta(). */
  document.body.classList.toggle('gio-fissa', ['verofalso','impiccato','memoria','tris','blitz','mistero','completa','chisono',
    'ruota','versetto','viaggio','codice','parola','tempio','sprint','scalata'].includes(GIO.vista));
  document.body.classList.toggle('cv-attivo', GIO.vista==='cruciverba');
  if(GIO.vista!=='cruciverba') document.body.classList.remove('cv-proietta');
  if(GIO.vista==='cruciverba') return vCruciverba();
  if(GIO.vista==='verofalso')  return vVeroFalso();
  if(GIO.vista==='impiccato')  return vImpiccato();
  if(GIO.vista==='memoria')    return vMemoria();
  if(GIO.vista==='tris')       return vTris();
  if(GIO.vista==='blitz')      return vBlitz();
  if(GIO.vista==='mistero')    return vMistero();
  if(GIO.vista==='completa')   return vCompleta();
  if(GIO.vista==='chisono')    return vChiSono();
  /* i giochi dal 9 al 16 (6l_giochi3.js e 6m_giochi4.js) */
  if(GIO.vista==='ruota')      return vRuota();
  if(GIO.vista==='versetto')   return vVersetto();
  if(GIO.vista==='viaggio')    return vViaggio();
  if(GIO.vista==='codice')     return vCodice();
  if(GIO.vista==='parola')     return vParola();
  if(GIO.vista==='tempio')     return vTempio();
  if(GIO.vista==='sprint')     return vSprint();
  if(GIO.vista==='scalata')    return vScalata();
  vGiochiHub();
}
const GIOCHI_TESSERE=[
  {ic:'🧩',et:'Cruciverba biblico', su:'personaggi e libri della Bibbia', c:'#5bb8f0', sf:'mare',    az:"apriGioco('cruciverba')"},
  {ic:'❓',et:'Vero o Falso',       su:'metti alla prova la memoria biblica', c:'#4fd1a5', sf:'prato', az:"apriGioco('verofalso')"},
  {ic:'🔤',et:'Impiccato biblico',  su:'indovina la parola lettera per lettera', c:'#ffd166', sf:'deserto', az:"apriGioco('impiccato')"},
  {ic:'🃏',et:'Memoria — Chi l\'ha detto', su:'abbina la frase a chi l\'ha detta', c:'#8b7bff', sf:'luce', az:"apriGioco('memoria')"},
  {ic:'❌⭕',et:'X e O biblico',    su:'rispondi giusto per mettere il segno', c:'#ff8a5c', sf:'fuoco', az:"apriGioco('tris')"},
  {ic:'🕯️',et:'Mistero Biblico',   su:'scopri gli indizi, ricostruisci la storia, risolvi il caso', c:'#f5b85c', sf:'aurora', az:"apriGioco('mistero')"},
  {ic:'📝',et:'Completa la frase', su:'manca una parola: indovina quale',    c:'#c9a6ff', sf:'universo', az:"apriGioco('completa')"},
  {ic:'🕵️',et:'Chi sono io?',      su:'indovina il personaggio dagli indizi', c:'#ffd76a', sf:'oro', az:"apriGioco('chisono')"},
  {ic:'🎡',et:'La Ruota Biblica',   su:'gira la ruota e rispondi alla categoria', c:'#ff6b81', sf:'galassia', az:"apriGioco('ruota')"},
  {ic:'🧱',et:'Costruisci il Versetto', su:'rimetti in ordine i blocchi del versetto', c:'#e0b25c', sf:'pietra', az:"apriGioco('versetto')"},
  {ic:'🧭',et:'Il Viaggio Biblico', su:'segui i grandi viaggi sulla mappa',   c:'#4fd1a5', sf:'montagna', az:"apriGioco('viaggio')"},
  {ic:'🔐',et:'Codice Segreto Biblico', su:'risolvi gli enigmi e apri lo scrigno', c:'#7fb0ff', sf:'notte', az:"apriGioco('codice')"},
  {ic:'💡',et:'Parola Misteriosa',  su:'scopri la parola prima che si spengano le lampade', c:'#ffb37a', sf:'alba', az:"apriGioco('parola')"},
  {ic:'🏛️',et:'Il Tempio della Conoscenza', su:'costruisci l\'edificio fase dopo fase', c:'#f5c542', sf:'cielo', az:"apriGioco('tempio')"},
  {ic:'⚡',et:'Bibbia Sprint',      su:'60 secondi, combo e domande veloci',    c:'#5cffb8', sf:'tramonto', az:"apriGioco('sprint')"},
  {ic:'🏆',et:'La Scalata Biblica', su:'15 domande fino al milione',            c:'#b18cff', sf:'nebulosa', az:"apriGioco('scalata')"}
];
function vGiochiHub(){
  /* sull'iPad tutti e 16 i giochi stanno nello schermo, senza scorrere (4 righe da 4) */
  document.body.classList.add('gio-hub-fissa');
  pinta(`
  <h1>🎮 Giochi biblici</h1>
  <div class="hm-gr g4 gio-hub">${GIOCHI_TESSERE.map(tessera).join('')}</div>
  `);
}

/* ---------- punteggio e premi, uguali per ogni gioco ---------- */
const PREMI=[
  {min:90,ic:'🏆',et:'Oro'},
  {min:70,ic:'🥈',et:'Argento'},
  {min:50,ic:'🥉',et:'Bronzo'},
  {min:0, ic:'🎗️',et:'Ci riprovi?'}
];
function premioDi(perc){ return PREMI.find(p=>perc>=p.min); }
/* il record di ogni gioco resta salvato (stato.imp, come già la posizione o
   le opzioni del quiz) — così ha senso parlare di «battere il record» */
function recordGioco(id,perc){
  stato.imp.recordGiochi=stato.imp.recordGiochi||{};
  const prima=stato.imp.recordGiochi[id]||0;
  const nuovo=perc>prima;
  if(nuovo){ stato.imp.recordGiochi[id]=perc; salva(); }
  return {record:nuovo?perc:prima, nuovo};
}
/* Il premio di una partita e, sotto, la classifica del gioco. `opz.chiave` è il
   numero di questa partita (per non contarla come «record precedente»);
   `opz.giocatore` è chi l'ha giocata (di solito chi sta giocando adesso, e
   in X e O uno dei due); `opz.etichetta` è una scritta davanti al premio. Il
   record è quello DEL GIOCATORE a quel livello; senza giocatore resta quello
   di tutto il gioco, come prima. */
function htmlPremio(id,perc,opz){
  opz=opz||{};
  perc=Math.round(perc);
  const p=premioDi(perc);
  const gio = opz.giocatore!==undefined ? opz.giocatore : giocatoreAttuale();
  let record;
  if(gio){
    const liv=livelloGioco(id);
    const prima=partiteDi(id,gio.i).filter(r=>r.k!==opz.chiave && (r.liv===liv || r.liv===0));
    const meglio=prima.reduce((m,r)=>Math.max(m,r.perc),-1);
    record = meglio<0 ? `🎉 Prima partita di ${esc(gio.n)} a questo livello!`
           : perc>meglio ? `🎉 Nuovo record di ${esc(gio.n)}!`
           : `Record di ${esc(gio.n)}: ${meglio}%`;
  } else {
    const r=recordGioco(id,perc);
    record = r.nuovo ? '🎉 Nuovo record!' : `Record: ${Math.round(r.record)}%`;
  }
  return `<div class="premio-box">
    <span class="premio-ic">${p.ic}</span>
    <div class="premio-testo">
      <b>${opz.etichetta?esc(opz.etichetta)+' — ':''}${p.et}</b><span class="premio-perc">${perc}%</span>
      <span class="premio-record">${record}</span>
    </div>
  </div>
  ${opz.senzaClassifica?'':htmlClassificaGioco(id)}`;
}

/* ---------- proiettare i giochi (mirroring, es. AirPlay) ----------
   Qui il contenuto cambia da solo ad ogni tocco (una casella di X e O, una
   lettera dell'impiccato…), non a diapositive ferme come Domande/Chi ha
   detto/Cantici: niente overlay/finestra separata, che avrebbe bisogno di
   restare sincronizzata ad ogni tocco. Più semplice e senza rischio di
   disallineamento: una classe sul body che ingrandisce lo stesso schermo di
   gioco e nasconde solo i riquadri dei filtri — chi comanda continua a
   toccare esattamente le stesse caselle, restano vive e funzionanti. */
/* in proiezione il programma va anche a schermo intero (dove il sistema lo permette), così sullo
   schermo esterno si vede solo il gioco, grande, senza le barre del browser */
function _schermoIntero(si){
  try{
    const d=document, el=d.documentElement;
    const dentro=d.fullscreenElement||d.webkitFullscreenElement;
    if(si && !dentro){ const f=el.requestFullscreen||el.webkitRequestFullscreen; if(f){ const p=f.call(el); if(p&&p.catch) p.catch(()=>{}); } }
    if(!si && dentro){ const f=d.exitFullscreen||d.webkitExitFullscreen; if(f){ const p=f.call(d); if(p&&p.catch) p.catch(()=>{}); } }
  }catch(e){}
}
function proiettaGioco(){ document.body.classList.add('gioco-proiettore'); _schermoIntero(true); setTimeout(chiediAdattaGioco,300); }
function chiudiProiezioneGioco(){
  const era=document.body.classList.contains('gioco-proiettore')||document.body.classList.contains('cv-proietta');
  document.body.classList.remove('gioco-proiettore','cv-proietta');
  if(era) _schermoIntero(false);
  setTimeout(chiediAdattaGioco,300);
}
/* «Proietta» nella barra in alto, uguale in tutti i giochi: dello schermo resta solo il gioco
   (niente menu, titolo e filtri), ingrandito; il pulsante resta in alto per tornare com'era */
function proiettaPagina(){
  if(GIO.vista==='cruciverba') return cvProietta();
  if(document.body.classList.contains('gioco-proiettore')) chiudiProiezioneGioco(); else proiettaGioco();
  window.scrollTo(0,0);
}

/* ---------- parole per Cruciverba e Impiccato: pulite, senza doppioni ---------- */
function _pulisciParola(s){ return ck(s).toUpperCase().replace(/[^A-Z]/g,''); }
function _etTestamento(L,lg){ return L<=39?(lg==='ro'?'Vechiul Testament':'Antico Testamento'):(lg==='ro'?'Noul Testament':'Nuovo Testamento'); }
/* parole vere, prese dal testo stesso della Bibbia (PAROLE_BIBBIA, preparate da
   costruisci.py) per l'Impiccato; il quarto parametro è il livello (1, 2 o 3, quanto
   sono usate nella Bibbia): senza, dà tutto — «un libro solo» non le filtra: il libro salvato è quello del
   PRIMO posto in cui la parola compare in tutta la Bibbia, quindi dice poco su
   libri successivi (una parola comune capita quasi sempre prima in Genesi) —
   filtrarle per Antico/Nuovo Testamento invece è corretto, lo restano davvero */
function bancaBibbiaParole(lg,ambito,libro,liv){
  ambito=ambito||'tutta';
  const amb2 = ambito==='libro' ? 'tutta' : ambito;
  const out=[];
  (PAROLE_BIBBIA[lg]||[]).forEach((w,rango)=>{
    if(!dentroAmbito(w.L,amb2,libro)) return;
    const dif=livParola(rango);
    if(liv && dif!==liv) return;
    out.push({parola:w.parola, nome:w.parola, v:w.v, L:w.L, pri:1, dif,
      indizio:`${_etTestamento(w.L,lg)} · una parola della Bibbia`});
  });
  return out;
}
/* le parole dell'Impiccato: solo parole sensate (persone, luoghi, animali, cose, feste…), ognuna con
   la sua piccola descrizione scritta a mano (IMPICCATO_PAROLE, da strumenti/impiccato/genera.py) e il
   primo versetto dove compare; il livello (1, 2 o 3) è quello scritto accanto alla parola */
function bancaImpiccato(lg,liv){
  return (IMPICCATO_PAROLE[lg]||[]).filter(w=>!liv||w.dif===liv).map(w=>{
    const r=w.v?leggiRiferimento(w.v):null;
    return {parola:w.parola, desc:w.desc, v:w.v||'', L:r?r.L:0, dif:w.dif};
  });
}
function truncaTesto(s,n){ s=String(s||''); return s.length>n? s.slice(0,n).trim()+'…' : s; }

/* ---------- le parole del Cruciverba: ognuna con il suo indizio ----------
   Stanno in CRUCIVERBA_PAROLE (dati/cruciverba_parole.json, preparato da
   strumenti/cruciverba/genera.py): parole con una domanda o una definizione vera
   (persone, luoghi, cose, avvenimenti, popoli), i personaggi di «Chi ha detto?»
   (l'indizio è una loro frase) e — al massimo 900 per lingua, per volontà di Ovidiu —
   un versetto della Bibbia con la parola tolta. Niente più «Antico Testamento · 34 capitoli».
   tipo: p persona · l luogo · c cosa · e avvenimento · t popolo · b libro ·
   d domanda del quiz · v versetto da completare. I libri sono pochissimi. */
const CRV_QUOTA_VERE=0.9;    /* nove parole su dieci hanno una domanda vera, non un versetto */
const CRV_PESO_LIBRI=0.15;   /* in «Misto» un nome di libro entra solo ogni tanto */
const _crvQuote={};
function _quoteDi(chi,lg){
  const k=lg+chi;
  if(!_crvQuote[k]) _crvQuote[k]=CITAZIONI.filter(c=>c.lg===lg && c.chi===chi);
  return _crvQuote[k];
}
function _crvPersonaggio(e){ return e.tipo==='p' || e.chi>=0; }
/* dentro all'ambito scelto: il libro della parola, oppure — per un personaggio —
   il libro di una delle sue frasi (Davide c'è in tanti libri) */
function _crvDentro(e,lg,ambito,libro){
  if(ambito==='tutta') return true;
  if(e.L>=1 && dentroAmbito(e.L,ambito,libro)) return true;
  return e.chi>=0 && _quoteDi(e.chi,lg).some(c=>dentroAmbito(c.L,ambito,libro));
}
/* le parole disponibili per lingua, tema (misto/personaggi/libri), ambito e livello */
function bancaCruciverba(lg,tema,ambito,libro,liv){
  ambito=ambito||'tutta';
  /* «Libri della Bibbia»: i nomi dei libri di una parola sola, ognuno con una descrizione */
  if(tema==='libri') return (CRUCIVERBA_LIBRI[lg]||[]).filter(b=>dentroAmbito(b.L,ambito,libro) && (!liv || livLibro(b.L)===liv))
    .map(b=>({parola:b.parola,dif:livLibro(b.L),tipo:'b',L:b.L,ind:b.ind,chi:-1}));
  return (CRUCIVERBA_PAROLE[lg]||[]).filter(e=>{
    if(liv && e.dif!==liv) return false;
    if(tema==='personaggi' && !_crvPersonaggio(e)) return false;
    return _crvDentro(e,lg,ambito,libro);
  });
}
/* la frase contiene la parola: un indizio così svelerebbe la risposta */
function _crvContiene(t,parola){
  return String(t).split(/[^A-Za-zÀ-ÖØ-öø-ÿĂăÂâÎîȘșȚțŞşŢţ]+/).some(w=>_pulisciParola(w)===parola);
}
/* l'indizio di una parola in questo cruciverba: una domanda, una definizione, un
   versetto da completare o — per un personaggio — una sua frase */
function indizioCruciverba(e,ctx,rnd){
  ctx=ctx||{}; rnd=rnd||Math.random;
  const lg=ctx.lg||'it', ambito=ctx.ambito||'tutta';
  const scelte=(e.ind||[]).slice();
  if(e.chi>=0){
    const senzaNome=c=>!_crvContiene(c.q,e.parola);
    let q=_quoteDi(e.chi,lg).filter(c=>dentroAmbito(c.L,ambito,ctx.libro) && senzaNome(c));
    if(!q.length) q=_quoteDi(e.chi,lg).filter(senzaNome);
    if(ctx.liv){ const l=q.filter(c=>(c.dif||2)===ctx.liv); if(l.length) q=l; }
    if(q.length){ const c=q[Math.floor(rnd()*q.length)];
      scelte.push((lg==='ro'?'Cine a zis: «':'Chi ha detto: «')+truncaTesto(c.q,80)+'»?'); }
  }
  if(!scelte.length) return lg==='ro'?'Personaj biblic':'Personaggio biblico';
  return scelte[Math.floor(rnd()*scelte.length)];
}
function _pescaCasuale(lista,k,rnd){
  const a=lista.slice(), n=Math.min(k,a.length);
  for(let i=0;i<n;i++){ const j=i+Math.floor(rnd()*(a.length-i)); const t=a[i]; a[i]=a[j]; a[j]=t; }
  return a.slice(0,n);
}

/* ---------- generatore di cruciverba: incrocia le parole dove condividono una lettera ----------
   Ogni parola nuova attraversa una già messa; fra tutti i posti possibili si sceglie
   quello che tiene la griglia più piccola e con più incroci, così il cruciverba resta
   compatto e sta su tutto lo schermo. candA: parole con una domanda vera, candB: versetti. */
const CRV_MAX_LATO=22;
/* quanto pesa, nello scegliere il posto di una parola: la crescita della griglia, la forma (meglio quadrata),
   gli incroci e la lunghezza della parola (meglio lunga: le parole da 3 lettere restano rare) */
const CRV_PESI={cresc:0.5,lung:3,asp:4,inc:10,minLen:3};
function generaCruciverba(candA,candB,n,rnd){
  rnd=rnd||Math.random;
  const griglia={}, piazzate=[], versi={};        /* versi: in che direzioni passa una parola su ogni casella (1 orizz., 2 vert.) */
  let bx0=0,bx1=0,by0=0,by1=0;
  const K=(x,y)=>x+','+y;
  /* -1 se la parola non ci sta; altrimenti quante lettere sono già nella griglia (gli incroci) */
  function incroci(parola,x,y,dx,dy){
    const px=dx?0:1, py=dx?1:0; let inc=0;
    for(let i=0;i<parola.length;i++){
      const cx=x+dx*i, cy=y+dy*i, c=griglia[K(cx,cy)];
      /* si incrocia solo con una parola dell'altra direzione: sovrapporsi a una nello stesso verso farebbe una parola sola */
      if(c!=null){ if(c!==parola[i] || (versi[K(cx,cy)]&(dx?1:2))) return -1; inc++; }
      else if(griglia[K(cx+px,cy+py)]!=null || griglia[K(cx-px,cy-py)]!=null) return -1;
    }
    if(griglia[K(x-dx,y-dy)]!=null || griglia[K(x+dx*parola.length,y+dy*parola.length)]!=null) return -1;
    return inc;
  }
  function piazza(cand,x,y,dx,dy){
    const p=cand.parola;
    for(let i=0;i<p.length;i++){ const k=K(x+dx*i,y+dy*i); griglia[k]=p[i]; versi[k]=(versi[k]||0)|(dx?1:2); }
    const x2=x+dx*(p.length-1), y2=y+dy*(p.length-1);
    bx0=Math.min(bx0,x,x2); bx1=Math.max(bx1,x,x2); by0=Math.min(by0,y,y2); by1=Math.max(by1,y,y2);
    piazzate.push(Object.assign({},cand,{x,y,dx,dy}));
  }
  /* il posto migliore per una parola: quello che fa crescere di meno la griglia e ha più
     incroci; null se non ci sta */
  function miglioreMossa(cand){
    if(piazzate.some(p=>p.parola===cand.parola)) return null;
    const area0=(bx1-bx0+1)*(by1-by0+1);
    let best=null;
    for(const p of piazzate){
      const dx=p.dy, dy=p.dx;                       /* la nuova parola attraversa quella vecchia */
      for(let i=0;i<p.parola.length;i++) for(let j=0;j<cand.parola.length;j++){
        if(p.parola[i]!==cand.parola[j]) continue;
        const x=p.x+p.dx*i-dx*j, y=p.y+p.dy*i-dy*j;
        const inc=incroci(cand.parola,x,y,dx,dy);
        if(inc<1) continue;
        const x2=x+dx*(cand.parola.length-1), y2=y+dy*(cand.parola.length-1);
        const w=Math.max(bx1,x,x2)-Math.min(bx0,x,x2)+1, h=Math.max(by1,y,y2)-Math.min(by0,y,y2)+1;
        if(w>CRV_MAX_LATO||h>CRV_MAX_LATO) continue;
        const punti=(w*h-area0)*CRV_PESI.cresc+Math.abs(w-h)*CRV_PESI.asp-inc*CRV_PESI.inc-cand.parola.length*CRV_PESI.lung+rnd()*3;
        if(!best||punti<best.punti) best={cand,x,y,dx,dy,punti};
      }
    }
    return best;
  }
  /* ogni volta, fra TUTTE le parole ancora da mettere, quella che sta meglio */
  function aggiungiMigliore(lista){
    let best=null;
    for(const c of lista){ if(c.parola.length<CRV_PESI.minLen) continue; const m=miglioreMossa(c); if(m&&(!best||m.punti<best.punti)) best=m; }
    if(!best) return false;
    piazza(best.cand,best.x,best.y,best.dx,best.dy);
    return true;
  }
  const lung=(a,b)=>b.parola.length-a.parola.length;
  const A=candA.slice().sort(lung), B=candB.slice().sort(lung);
  const primo=A[0]||B[0];
  if(!primo) return {righe:0,colonne:0,celle:{},parole:[]};
  piazza(primo,0,0,1,0);
  const quotaA=Math.ceil(n*CRV_QUOTA_VERE);
  let nA=primo.A?1:0;
  /* prima le parole con la domanda vera (fino alla loro quota), poi i versetti, poi
     un secondo giro su tutto quello che è rimasto */
  while(piazzate.length<n && nA<quotaA && aggiungiMigliore(A)) nA++;
  while(piazzate.length<n && aggiungiMigliore(B));
  while(piazzate.length<n && aggiungiMigliore(A.concat(B)));
  /* sposto tutto perché cominci da (0,0) e numero le parole in ordine di lettura */
  piazzate.forEach(p=>{ p.x-=bx0; p.y-=by0; });
  const gruppi={};
  piazzate.forEach(p=>{ const k=p.y+','+p.x; (gruppi[k]=gruppi[k]||[]).push(p); });
  Object.keys(gruppi).sort((a,b)=>{ const[ay,ax]=a.split(',').map(Number),[by,bx]=b.split(',').map(Number); return ay-by||ax-bx; })
    .forEach((k,i)=>{ gruppi[k].forEach(p=>p.num=i+1); });
  const celle={};
  piazzate.forEach(p=>{ for(let i=0;i<p.parola.length;i++){
    const x=p.x+p.dx*i, y=p.y+p.dy*i, k=x+','+y;
    celle[k]=celle[k]||{lettera:p.parola[i]};
    if(i===0) celle[k].num=p.num; } });
  return {righe:by1-by0+1, colonne:bx1-bx0+1, celle, parole:piazzate};
}
/* `banca` = le parole disponibili (bancaCruciverba); `ctx` = lingua, tema, ambito, libro
   e livello, per scegliere gli indizi. Provo qualche volta e tengo il cruciverba con
   più parole e, a parità, la griglia più piccola. */
function nuovoCruciverba(banca,quante,rnd,ctx){
  rnd=rnd||Math.random; ctx=ctx||{};
  const soloLibri=ctx.tema==='libri';
  const A=[], B=[];
  banca.forEach(e=>{
    if(e.tipo==='v') B.push(e);
    else if(e.tipo!=='b' || soloLibri || rnd()<CRV_PESO_LIBRI) A.push(e);
  });
  const K=Math.max(quante*10,60);
  const kB=Math.min(B.length,K-Math.min(A.length,Math.ceil(K*CRV_QUOTA_VERE)));
  const kA=Math.min(A.length,K-kB);
  const cand=(lista,k,vera)=>_pescaCasuale(lista,k,rnd).map(e=>({parola:e.parola,e,L:e.L,tipo:e.tipo,A:vera}));
  let migliore=null;
  for(let t=0;t<4;t++){
    const c=generaCruciverba(cand(A,kA,true),cand(B,kB,false),quante,rnd);
    if(!migliore || c.parole.length>migliore.parole.length
       || (c.parole.length===migliore.parole.length && c.righe*c.colonne<migliore.righe*migliore.colonne)) migliore=c;
  }
  migliore.parole.forEach(p=>{ p.indizio=indizioCruciverba(p.e,ctx,rnd); });
  return migliore;
}

/* ---------- Cruciverba: pagina e interazione ---------- */
/* pid: il numero di questo cruciverba (per salvare il risultato); scritte e
   marche: le lettere che hai già messo e come sono state verificate, così non
   si perdono se apri la pagina di un giocatore e poi torni; svelato: dopo aver
   visto la soluzione il cruciverba non conta più; dir: la direzione in cui sto
   scrivendo, 'o' orizzontale o 'v' verticale */
const CRV={ lg:'it', tema:'misto', ambito:'tutta', libro:1, dati:null, pid:null, scritte:{}, marche:{}, svelato:false, dir:'o' };
/* quante parole ha il cruciverba, per livello */
const CRV_PAROLE={1:10,2:14,3:16};
function nuovoCruciverbaPagina(){
  const liv=livelloGioco('cruciverba');
  let banca=bancaCruciverba(CRV.lg,CRV.tema,CRV.ambito,CRV.libro,liv);
  /* un libro piccolo ha poche parole tutte sue: le altre sono versetti della Bibbia in generale (come prima) */
  if(CRV.ambito==='libro' && CRV.tema==='misto' && banca.length<CRV_PAROLE[liv]*6){
    const gia=new Set(banca.map(e=>e.parola));
    banca=banca.concat(bancaCruciverba(CRV.lg,'misto','tutta',0,liv).filter(e=>e.tipo==='v' && !gia.has(e.parola)));
  }
  /* le parole già uscite in un cruciverba non tornano finché non sono uscite quasi tutte (se ne restano troppo
     poche di nuove per questa scelta, si ripescano anche le vecchie) */
  const tipoV='gc'+CRV.lg, viste=insiemeViste(tipoV), minimo=Math.max(60,CRV_PAROLE[liv]*8);
  const nuove=banca.filter(e=>!viste.has(chiaveVista(e.parola)));
  if(nuove.length>=minimo) banca=nuove;
  else if(viste.size>=CRUCIVERBA_PAROLE[CRV.lg].length*0.9) azzeraViste(tipoV,true);
  CRV.dati = banca.length>=3
    ? nuovoCruciverba(banca,CRV_PAROLE[liv],null,{lg:CRV.lg,tema:CRV.tema,ambito:CRV.ambito,libro:CRV.libro,liv})
    : {righe:0,colonne:0,celle:{},parole:[]};
  segnaVisteGioco(tipoV,CRV.dati.parole.map(p=>chiaveVista(p.parola)));
  CRV.pid=uid(); CRV.scritte={}; CRV.marche={}; CRV.svelato=false; CRV.dir='o';
  vCruciverba();
}
/* la griglia si adatta allo schermo: la cella più grande che fa stare tutto il
   cruciverba, in altezza e in larghezza (in proiezione anche più grande) */
function cvAdatta(){
  const g=$('.cv-grid'), d=CRV.dati;
  if(!g||!d||!d.righe) return;
  const vista=$('#vista'), cs=getComputedStyle(vista), barra=$('#barra');
  const proi=document.body.classList.contains('cv-proietta');
  const larg=vista.clientWidth-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight)-28;
  const alt=window.innerHeight-(barra?barra.offsetHeight:58)-40;
  const gap=3;
  let c=Math.floor(Math.min((larg-gap*(d.colonne-1))/d.colonne,(alt-gap*(d.righe-1))/d.righe));
  c=Math.max(24,Math.min(proi?72:56,c));
  g.style.setProperty('--cv-c',c+'px');
}
let _cvAttesa=null;
window.addEventListener('resize',()=>{ if(zoomNativo()) return; clearTimeout(_cvAttesa); _cvAttesa=setTimeout(cvAdatta,150); });
/* «Proietta»: dello schermo resta solo il cruciverba (la griglia più grande e le sue
   domande); il pulsante sta nella barra in alto e non sparisce scorrendo */
function cvProietta(){
  document.body.classList.toggle('cv-proietta');
  window.scrollTo(0,0);
  cvAdatta();
}
function vCruciverba(){
  if(GIO.giocatore) return vPaginaGiocatore();
  if(!CRV.dati) return nuovoCruciverbaPagina();
  const d=CRV.dati, liv=livelloGioco('cruciverba');
  const oriz=d.parole.filter(p=>p.dx===1).sort((a,b)=>a.num-b.num);
  const vert=d.parole.filter(p=>p.dy===1).sort((a,b)=>a.num-b.num);
  const celleHtml=Object.keys(d.celle).map(k=>{
    const [x,y]=k.split(',').map(Number); const c=d.celle[k];
    return `<div class="cv-cella" style="grid-column:${x+1};grid-row:${y+1}">
      ${c.num?`<span class="cv-num">${c.num}</span>`:''}
      <input maxlength="2" autocomplete="off" autocapitalize="characters" spellcheck="false"
        value="${CRV.scritte[k]||''}" class="${CRV.marche[k]||''}"
        data-x="${x}" data-y="${y}" data-l="${c.lettera}" oninput="cvDigita(this,event)"
        onfocus="cvFuoco(this)" onpointerdown="cvPremuto(this)" onclick="cvClic(this)">
    </div>`;
  }).join('');
  const op=(on,az,txt)=>`<button class="op ${on?'on':''}" onclick="${az}">${txt}</button>`;
  const nParole=l=>CRUCIVERBA_PAROLE[l].length.toLocaleString('it-IT');
  /* le tre barre di scelta: giocatori · lingua, parole e nuovo · libro e livello */
  pinta(`
  <div class="gio-pagina cv-pagina">
  <button class="bt pi torna-gio" onclick="tornaGiochi()">← Giochi</button>
  <h1>🧩 Cruciverba biblico</h1>
  <p class="sotto">🇮🇹 <b>${nParole('it')}</b> parole disponibili ·
    🇷🇴 <b>${nParole('ro')}</b> parole disponibili</p>
  <div class="cv-barre">
    ${htmlGiocatori('cruciverba')}
    <div class="cv-bar">
      <div class="cv-gr" style="--ac:#5fd48f"><span class="cv-gr-et" title="Lingua" aria-label="Lingua">🌐</span>
        ${op(CRV.lg==='it',"CRV.lg='it';nuovoCruciverbaPagina()",'🇮🇹 Italiano')}
        ${op(CRV.lg==='ro',"CRV.lg='ro';nuovoCruciverbaPagina()",'🇷🇴 Română')}
      </div>
      <div class="cv-gr" style="--ac:#7fb0ff"><span class="cv-gr-et" title="Parole" aria-label="Parole">📖</span>
        ${op(CRV.tema==='misto',"CRV.tema='misto';nuovoCruciverbaPagina()",'Misto')}
        ${op(CRV.tema==='personaggi',"CRV.tema='personaggi';nuovoCruciverbaPagina()",'Personaggi')}
        ${op(CRV.tema==='libri',"CRV.tema='libri';nuovoCruciverbaPagina()",'Libri della Bibbia')}
      </div>
      <div class="cv-gr" style="--ac:#ffb37a"><button class="op nuovo" onclick="nuovoCruciverbaPagina()">🔄 Nuovo</button></div>
    </div>
    <div class="cv-bar">
      <div class="cv-gr" style="--ac:#ff9ecb"><span class="cv-gr-et" title="Libro" aria-label="Libro">📚</span>
        ${op(CRV.ambito==='tutta',"CRV.ambito='tutta';nuovoCruciverbaPagina()",'Tutta la Bibbia')}
        ${op(CRV.ambito==='at',"CRV.ambito='at';nuovoCruciverbaPagina()",'Antico Testamento')}
        ${op(CRV.ambito==='nt',"CRV.ambito='nt';nuovoCruciverbaPagina()",'Nuovo Testamento')}
        ${op(CRV.ambito==='libro',"CRV.ambito='libro';nuovoCruciverbaPagina()",'Un libro')}
        ${CRV.ambito==='libro'?`<select onchange="CRV.libro=+this.value;nuovoCruciverbaPagina()">
          ${LIBRI.map(L=>`<option value="${L[0]}" ${L[0]===CRV.libro?'selected':''}>${esc(CRV.lg==='ro'?L[2]:L[1])}</option>`).join('')}
          </select>`:''}
      </div>
      <div class="cv-gr cv-liv" style="--ac:#ff6b81"><span class="cv-gr-et" title="Livello" aria-label="Livello">🎚️</span>
        ${[1,2,3].map(n=>op(liv===n,`cambiaLivello('cruciverba',${n})`,`${LIVELLI[n].ic} ${LIVELLI[n].et}`)).join('')}
      </div>
    </div>
  </div>

  <div class="cv-corpo">
  ${d.parole.length?`
  <div class="cv-wrap">
    <div class="cv-grid" style="grid-template-columns:repeat(${d.colonne},var(--cv-c,34px));grid-template-rows:repeat(${d.righe},var(--cv-c,34px))">${celleHtml}</div>
  </div>

  <div class="az-quiz">
    <div class="az-conta"><b>${d.parole.length}</b><span>parole in questo cruciverba</span></div>
    <div class="az-bt una-riga">
      <button class="bt pr" onclick="cvVerifica()">✓ Verifica</button>
      <button class="bt" onclick="cvSvela()">👁 Svela tutto</button>
    </div>
  </div>
  <div id="cvPremio"></div>

  <div class="cv-indizi">
    <div><h2>➡️ Orizzontali</h2>${oriz.map(p=>`<div class="cv-clue" data-p="${d.parole.indexOf(p)}"><b>${p.num}.</b> ${esc(p.indizio)}</div>`).join('')}</div>
    <div><h2>⬇️ Verticali</h2>${vert.map(p=>`<div class="cv-clue" data-p="${d.parole.indexOf(p)}"><b>${p.num}.</b> ${esc(p.indizio)}</div>`).join('')}</div>
  </div>`
  :`<div class="scheda"><p class="sotto" style="margin:0">Con questa scelta non ci sono abbastanza parole per un cruciverba — prova un altro libro o un altro tema.</p></div>`}
  </div>
  </div>`);
  cvAdatta();
  cvAggiornaParole();
}
/* le parole che passano per una casella: una orizzontale e/o una verticale */
function cvParole(x,y){
  const r={o:null,v:null};
  (CRV.dati?CRV.dati.parole:[]).forEach(p=>{
    const n=p.parola.length;
    if(p.dx===1){ if(p.y===y && x>=p.x && x<p.x+n) r.o=p; }
    else if(p.x===x && y>=p.y && y<p.y+n) r.v=p;
  });
  return r;
}
const _cvCasella=(x,y)=>$(`.cv-grid input[data-x="${x}"][data-y="${y}"]`);
/* evidenzio la parola in cui sto scrivendo, nella direzione scelta */
function cvSegna(el){
  $$('.cv-cella.in-parola').forEach(c=>c.classList.remove('in-parola'));
  const p=cvParole(+el.dataset.x,+el.dataset.y)[CRV.dir];
  if(!p) return;
  for(let i=0;i<p.parola.length;i++){
    const c=_cvCasella(p.x+p.dx*i,p.y+p.dy*i);
    if(c) c.parentNode.classList.add('in-parola');
  }
}
/* tocco una casella: si scrive nella direzione di prima, salvo che la casella abbia una parola sola */
function cvFuoco(el){
  if(!cvParole(+el.dataset.x,+el.dataset.y)[CRV.dir]) CRV.dir = CRV.dir==='o' ? 'v' : 'o';
  cvSegna(el);
}
/* toccare ancora la casella sulla quale sono (se ci passano due parole) gira la direzione,
   da orizzontale a verticale e viceversa */
function cvPremuto(el){
  el._eraGia = document.activeElement===el;
  if(garaDi('cruciverba') && GARA.daPassare) return;
  /* toccando una casella che ha già una lettera, la lettera si cancella: così si riscrive subito,
     invece di finire col cursore dietro alla lettera */
  if(el.value){
    const kc=el.dataset.x+','+el.dataset.y;
    delete CRV.scritte[kc]; delete CRV.marche[kc];
    el.value=''; el.classList.remove('giusta','sbagliata');
    cvAggiornaParole();
  }
}
function cvClic(el){
  if(!el._eraGia) return;
  el._eraGia=false;
  const w=cvParole(+el.dataset.x,+el.dataset.y);
  if(w.o && w.v){ CRV.dir = CRV.dir==='o' ? 'v' : 'o'; cvSegna(el); }
}
/* com'è messa ogni parola: tutta giusta → verde, tutta scritta ma con qualche errore → rosso */
function cvAggiornaParole(){
  const d=CRV.dati; if(!d) return;
  d.parole.forEach((p,i)=>{
    const riga=$(`.cv-clue[data-p="${i}"]`); if(!riga) return;
    let piene=0, giuste=0;
    for(let k=0;k<p.parola.length;k++){
      const v=CRV.scritte[(p.x+p.dx*k)+','+(p.y+p.dy*k)];
      if(v){ piene++; if(v===p.parola[k]) giuste++; }
    }
    riga.classList.toggle('giusta',giuste===p.parola.length);
    riga.classList.toggle('sbagliata',piene===p.parola.length && giuste<p.parola.length);
  });
}
/* dove va il cursore dopo aver scritto in (x,y): la casella dopo, nella direzione scelta ('o' o 'v'),
   ma sempre dentro alla stessa parola; null se la parola è finita */
function cvSuccessiva(x,y,dir){
  const p=cvParole(x,y)[dir]; if(!p) return null;
  const i=dir==='o' ? x-p.x : y-p.y;
  return i+1<p.parola.length ? {x:p.x+p.dx*(i+1), y:p.y+p.dy*(i+1)} : null;
}
/* la lettera si accende subito: verde se è giusta, rossa se è sbagliata. Poi si va avanti
   nella direzione in cui si sta scrivendo, restando dentro alla stessa parola: un incrocio
   con una parola dell'altra direzione non cambia strada */
function cvDigita(el,ev){
  const kc=el.dataset.x+','+el.dataset.y, prima=CRV.scritte[kc]||'';
  if(garaDi('cruciverba') && GARA.daPassare){ el.value=prima; return; }   /* in gara: aspetta il turno del prossimo */
  /* la lettera appena scritta (anche sopra a una che c'era già) */
  const nuova = ev && typeof ev.data==='string' && ev.data ? ev.data : el.value;
  const lettera = nuova.toUpperCase().replace(/[^A-Z]/g,'').slice(-1);
  if(!lettera && ev && ev.data){ el.value=prima; return; }
  el.value=lettera;
  el.classList.remove('giusta','sbagliata');
  if(!lettera){ delete CRV.scritte[kc]; delete CRV.marche[kc]; cvAggiornaParole(); return; }
  const ok = lettera===el.dataset.l;
  CRV.scritte[kc]=lettera; CRV.marche[kc]=ok?'giusta':'sbagliata';
  el.classList.add(CRV.marche[kc]);
  cvAggiornaParole();
  if(cvGaraParola(+el.dataset.x,+el.dataset.y)) return;
  const dopo=cvSuccessiva(+el.dataset.x,+el.dataset.y,CRV.dir);
  const inp=dopo && _cvCasella(dopo.x,dopo.y);
  if(inp) inp.focus();
}
/* in gara (tutti sulla stessa griglia): quando la parola in cui scrivi è piena, è finita la tua
   domanda (giusta se tutte le lettere sono giuste) e tocca al prossimo; a griglia piena la gara finisce */
function cvGaraParola(x,y){
  if(!garaDi('cruciverba')) return false;
  const p=cvParole(x,y)[CRV.dir]; if(!p) return false;
  const k=CRV.dati.parole.indexOf(p);
  if(GARA.parole[k]) return false;
  let giuste=0;
  for(let i=0;i<p.parola.length;i++){
    const v=CRV.scritte[(p.x+p.dx*i)+','+(p.y+p.dy*i)];
    if(!v) return false;
    if(v===p.parola[i]) giuste++;
  }
  GARA.parole[k]=1;
  if(Object.keys(CRV.dati.celle).every(c=>CRV.scritte[c])) GARA.finitaCondivisa=true;
  const ok=giuste===p.parola.length;
  garaFatto('cruciverba',ok,ok?p.parola.length:0,null);
  if(document.activeElement) document.activeElement.blur();
  return true;
}
function cvVerifica(){
  const celle=$$('.cv-grid input');
  let giuste=0, scritte=0;
  celle.forEach(inp=>{
    if(!inp.value) return;
    scritte++;
    const ok=inp.value===inp.dataset.l;
    inp.classList.toggle('giusta',ok); inp.classList.toggle('sbagliata',!ok);
    CRV.marche[inp.dataset.x+','+inp.dataset.y]=ok?'giusta':'sbagliata';
    if(ok) giuste++;
  });
  if(!scritte){ avvisa('Scrivi qualche lettera prima','no'); return; }
  const perc=giuste/celle.length*100;
  /* il risultato si salva col giocatore: una sola riga per cruciverba, la
     migliore. Se hai visto la soluzione la partita non conta. */
  if(!CRV.svelato) salvaRisultatoAttuale('cruciverba',CRV.pid,perc,{giuste,tot:celle.length,parole:CRV.dati.parole.length},'migliore');
  const box=$('#cvPremio');
  if(box) box.innerHTML = CRV.svelato ? '<p class="sotto" style="margin:0">Hai svelato la soluzione: questa partita non conta.</p>'
                                      : htmlPremio('cruciverba',perc,{chiave:CRV.pid});
  aggiornaBarraGiocatori();
}
function cvSvela(){
  conferma('Vuoi vedere subito tutte le soluzioni?',()=>{
    CRV.svelato=true;
    $$('.cv-grid input').forEach(inp=>{
      inp.value=inp.dataset.l; inp.classList.add('giusta'); inp.classList.remove('sbagliata');
      const kc=inp.dataset.x+','+inp.dataset.y; CRV.scritte[kc]=inp.dataset.l; CRV.marche[kc]='giusta';
    });
    cvAggiornaParole();
  },'Svela');
}

/* ---------- Vero o Falso ---------- */
const VF={ lg:'it', n:10, i:0, punti:0, domande:[], corrente:null, pid:null };
function nuovoVeroFalso(){
  VF.domande=pescaDomandeGioco(VF.lg,livelloGioco('verofalso'),VF.n);
  VF.i=0; VF.punti=0; VF.pid=uid();
  vfProssima();
}
function vfProssima(){
  if(garaPassa('verofalso',vfProssima)) return;        /* in gara: la domanda dopo è del prossimo giocatore */
  if(VF.i>=VF.domande.length){
    VF.corrente=null;
    salvaRisultatoAttuale('verofalso',VF.pid,VF.punti/VF.domande.length*100,{giuste:VF.punti,tot:VF.domande.length});
    return vVeroFalso();
  }
  const d=VF.domande[VF.i];
  segnaDomandaGioco(d);                         /* da adesso non esce più, in nessun gioco */
  const vero=Math.random()<0.5;
  const rispostaMostrata = vero ? d.o[d.g] : d.o[(d.g+1+Math.floor(Math.random()*2))%3];
  VF.corrente={d, vero, rispostaMostrata, risposto:false};
  vVeroFalso();
}
function vfRispondi(scelta){
  if(!VF.corrente || VF.corrente.risposto) return;
  VF.corrente.risposto=true; VF.corrente.scelta=scelta;
  if(scelta===VF.corrente.vero) VF.punti++;
  garaFatto('verofalso',scelta===VF.corrente.vero,scelta===VF.corrente.vero?1:0);
  vVeroFalso();
}
function vVeroFalso(){
  if(GIO.giocatore) return vPaginaGiocatore();
  /* parte da sola solo la prima volta: a partita finita si vede il risultato
     (prima ricominciava subito e la schermata finale non compariva mai) */
  if(!VF.corrente && !VF.domande.length) return nuovoVeroFalso();
  const c=VF.corrente;
  const fine = !c;
  pinta(`
  <div class="gio-pagina">
  <button class="bt pi torna-gio" onclick="tornaGiochi()">← Giochi</button>
  <h1>❓ Vero o Falso</h1>
  ${htmlGiocatori('verofalso')}
  <div class="scelte scelte-3">
    <div class="scelta" style="--ac:#5fd48f">
      <div class="scelta-tit">🌐 Lingua</div>
      <div class="scelta-op">
        <button class="op ${VF.lg==='it'?'on':''}" onclick="VF.lg='it';nuovoVeroFalso()">🇮🇹 Italiano · ${domandeTutte('it').length.toLocaleString('it-IT')}</button>
        <button class="op ${VF.lg==='ro'?'on':''}" onclick="VF.lg='ro';nuovoVeroFalso()">🇷🇴 Română · ${domandeTutte('ro').length.toLocaleString('it-IT')}</button>
      </div>
    </div>
    <div class="scelta" style="--ac:#d7a6ff">
      <div class="scelta-tit">🔢 Quante domande</div>
      <div class="scelta-op">
        ${[10,15,20].map(n=>`<button class="op ${VF.n===n?'on':''}" onclick="VF.n=${n};nuovoVeroFalso()">${n}</button>`).join('')}
      </div>
    </div>
    <div class="scelta" style="--ac:#ffb37a">
      <div class="scelta-tit">🔄 Ricomincia</div>
      <div class="scelta-op"><button class="op nuovo" onclick="nuovoVeroFalso()">Nuova partita</button></div>
    </div>
  </div>
  ${fine?`
  <div class="scheda vf-fine">
    <h2>Partita finita!</h2>
    <p class="sotto">Hai risposto giusto a <b>${VF.punti}</b> domande su <b>${VF.domande.length}</b>.</p>
    ${htmlPremio('verofalso',VF.punti/VF.domande.length*100,{chiave:VF.pid})}
    <button class="bt blu" onclick="nuovoVeroFalso()">🔄 Gioca ancora</button>
  </div>`:`
  <div class="scheda vf-card ${c.risposto?(c.scelta===c.vero?'esito-giusto':'esito-sbagliato'):''}">
    <div class="conta-viste"><span class="cv-tit">Domanda ${VF.i+1} di ${VF.domande.length}</span>
      <span class="cv-n b"><b>${VF.punti}</b> giuste finora</span></div>
    <p class="vf-domanda">${esc(c.d.d)}</p>
    <p class="vf-risposta">${esc(c.rispostaMostrata)}</p>
    <div class="vf-bt">
      <button class="bt vd ${c.risposto?(c.scelta===true?'scelto':'spenta'):''}" ${c.risposto?'disabled':''} onclick="vfRispondi(true)">✓ Vero</button>
      <button class="bt pr ${c.risposto?(c.scelta===false?'scelto':'spenta'):''}" ${c.risposto?'disabled':''} onclick="vfRispondi(false)">✕ Falso</button>
    </div>
    ${c.risposto?`
    <p class="vf-esito ${c.scelta===c.vero?'giusto':'falso'}">${c.scelta===c.vero?'✓ Giusto! ':'✕ Sbagliato. '}${c.vero?'Era VERO':'Era FALSO — la risposta giusta è: '+esc(c.d.o[c.d.g])}</p>
    <div class="vf-azioni">
      ${c.d.v?`<button class="gio-vers vf-rif" onclick="mostraRifVF()">${esc(c.d.v)}</button>`:'<span></span>'}
      <button class="bt blu" onclick="VF.i++;vfProssima()">Avanti →</button>
      <span></span>
    </div>`:''}
  </div>`}
  </div>`);
}
function mostraRifVF(){ if(VF.corrente&&VF.corrente.d.v) mostraRiferimentoGioco(VF.corrente.d.v,VF.corrente.d.lg); }

/* ---------- Impiccato biblico ---------- */
/* le parole sono SOLO quelle vere di PAROLE_BIBBIA (trovate nel testo stesso
   della Bibbia, mai i nomi di libri/personaggi) — vedi bancaBibbiaParole() */
const IMP={ lg:'it', parola:null, indovinate:[], sbagli:0, max:8, indizioTesto:null, pid:null };
/* per livello: quanti errori si possono fare e quanto sono lunghe le parole
   (più il livello sale, più le parole sono rare, lunghe e gli errori pochi) */
const IMP_LIV={1:{max:10,lung:[4,7]},2:{max:8,lung:[5,9]},3:{max:6,lung:[6,13]}};
function nuovoImpiccato(){
  if(garaPassa('impiccato',nuovoImpiccato)) return;    /* in gara: la parola dopo è del prossimo giocatore */
  const liv=livelloGioco('impiccato'), cfg=IMP_LIV[liv];
  const tutte=bancaImpiccato(IMP.lg,liv);
  let banca=tutte.filter(w=>w.parola.length>=cfg.lung[0] && w.parola.length<=cfg.lung[1]);
  if(!banca.length) banca=tutte;
  /* una parola già uscita non torna finché non sono uscite tutte */
  const tipoV='gi'+IMP.lg;
  let nuove=banca.filter(w=>!insiemeViste(tipoV).has(chiaveVista(w.parola)));
  if(!nuove.length){ azzeraViste(tipoV,true); nuove=banca; }
  IMP.parola=nuove[Math.floor(Math.random()*nuove.length)];
  segnaVisteGioco(tipoV,[chiaveVista(IMP.parola.parola)]);
  IMP.indovinate=[]; IMP.sbagli=0; IMP.indizioTesto=null; IMP.max=cfg.max; IMP.pid=uid();
  vImpiccato();
}
/* l'indizio non si vede finché non lo chiedi tu (altrimenti la parola era
   quasi svelata da subito) — ed è più preciso di prima: non solo Antico/
   Nuovo Testamento, ma il libro vero e un pezzo del racconto dove si trova */
function chiediIndizioImp(){
  const p=IMP.parola; if(!p||!p.v||!p.L) return;
  const cod=IMP.lg==='ro'?'ro':'it';
  const libro=nomeLibro(p.L,IMP.lg);
  const disegna=testo=>{ IMP.indizioTesto=`${libro} — «${truncaTesto(testo||'',90)}»`; vImpiccato(); };
  const pronto=testoVers(p.v,cod);
  if(pronto){ disegna(pronto); return; }
  IMP.indizioTesto='Un momento…'; vImpiccato();
  apriBibbia(cod).then(()=>disegna(testoVers(p.v,cod))).catch(()=>{});
}
function impLettera(l){
  if(!IMP.parola || IMP.indovinate.includes(l)) return;
  const vinta=impVinta(), persa=impPersa();
  if(vinta||persa) return;
  IMP.indovinate.push(l);
  if(!IMP.parola.parola.includes(l)) IMP.sbagli++;
  const det=vinta=>({parola:IMP.parola.parola,sbagli:IMP.sbagli,max:IMP.max,vinta});
  if(impVinta()){ salvaRisultatoAttuale('impiccato',IMP.pid,(IMP.max-IMP.sbagli)/IMP.max*100,det(true)); garaFatto('impiccato',true,IMP.max-IMP.sbagli); }
  else if(impPersa()){ salvaRisultatoAttuale('impiccato',IMP.pid,0,det(false)); garaFatto('impiccato',false,0); }
  vImpiccato();
}
function impVinta(){ return IMP.parola && IMP.parola.parola.split('').every(l=>IMP.indovinate.includes(l)); }
function impPersa(){ return IMP.sbagli>=IMP.max; }
function mostraRifImp(){ if(IMP.parola&&IMP.parola.v) mostraRiferimentoGioco(IMP.parola.v,IMP.lg); }
function vImpiccato(){
  if(GIO.giocatore) return vPaginaGiocatore();
  if(!IMP.parola) return nuovoImpiccato();
  const p=IMP.parola, liv=livelloGioco('impiccato');
  const vinta=impVinta(), persa=impPersa(), fine=vinta||persa;
  const mostra=p.parola.split('').map(l=>fine||IMP.indovinate.includes(l)?l:'_').join(' ');
  const TASTI='ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  pinta(`
  <div class="gio-pagina">
  <button class="bt pi torna-gio" onclick="tornaGiochi()">← Giochi</button>
  <h1>🔤 Impiccato biblico</h1>
  <p class="sotto">🇮🇹 <b>${bancaImpiccato('it',liv).length.toLocaleString('it-IT')}</b> parole della Bibbia ·
    🇷🇴 <b>${bancaImpiccato('ro',liv).length.toLocaleString('it-IT')}</b> parole della Bibbia, ognuna con la sua descrizione</p>
  ${htmlGiocatori('impiccato')}
  <div class="scelte scelte-3 scelte-imp">
    <div class="scelta" style="--ac:#5fd48f">
      <div class="scelta-tit">🌐 Lingua</div>
      <div class="scelta-op">
        <button class="op ${IMP.lg==='it'?'on':''}" onclick="IMP.lg='it';nuovoImpiccato()">🇮🇹 Italiano</button>
        <button class="op ${IMP.lg==='ro'?'on':''}" onclick="IMP.lg='ro';nuovoImpiccato()">🇷🇴 Română</button>
      </div>
    </div>
    <div class="scelta larga" style="--ac:#7fb0ff">
      <div class="scelta-tit">💡 Indizio</div>
      <div class="scelta-op">${IMP.indizioTesto
        ? `<span class="imp-indizio">${esc(IMP.indizioTesto)}</span>`
        : `<button class="op" onclick="chiediIndizioImp()">💡 Chiedi un indizio</button>`}</div>
    </div>
    <div class="scelta" style="--ac:#ffb37a">
      <div class="scelta-tit">🔄 Ricomincia</div>
      <div class="scelta-op"><button class="op nuovo" onclick="nuovoImpiccato()">Nuova parola</button></div>
    </div>
  </div>

  <div class="kpi imp-vite" style="--qc:${IMP.max-IMP.sbagli<=2?'var(--ross-c)':'var(--oro)'}">
    <div class="n">${IMP.max-IMP.sbagli}</div><div class="e">tentativi rimasti su ${IMP.max}</div>
  </div>

  <div class="scheda imp-scheda">
    ${p.desc?`<p class="imp-descr">${esc(p.desc)}</p>`:''}
    <p class="imp-parola">${mostra}</p>
    ${fine?`<div class="imp-fine">
        <div class="imp-fine-sx">
          <p class="vf-esito ${vinta?'giusto':'falso'}">${vinta?'Bravo, hai indovinato!':'Peccato — la parola era: '+esc(p.parola)}</p>
          <button class="bt blu" onclick="nuovoImpiccato()">🔄 Gioca ancora</button>
        </div>
        <div class="imp-fine-dx">${htmlPremio('impiccato', vinta ? (IMP.max-IMP.sbagli)/IMP.max*100 : 0, {chiave:IMP.pid})}</div>
      </div>`
     :`<div class="imp-tastiera">${TASTI.map(l=>`<button class="imp-tasto ${IMP.indovinate.includes(l)?(p.parola.includes(l)?'giusta':'sbagliata'):''}"
        ${IMP.indovinate.includes(l)?'disabled':''} onclick="impLettera('${l}')">${l}</button>`).join('')}</div>`}
    ${p.v?`<div class="imp-rif"><button class="gio-vers" onclick="mostraRifImp()">${esc(p.v)}</button></div>`:''}
  </div>
  </div>`);
}

/* ---------- Memoria: abbina la frase a chi l'ha detta ---------- */
const MEM={ lg:'it', n:8, carte:[], girate:[], trovate:[], blocco:false, mosse:0, pid:null };
/* quanti personaggi diversi puoi trovare nella memoria, in ogni lingua (e a
   quel livello) — non «quante frasi» (4816+): la memoria pesca un personaggio alla volta */
function contaPersonaggiMemoria(lg,liv){
  const frasi = liv ? citazioniLivello(lg,liv) : CITAZIONI.filter(c=>c.lg===lg);
  return new Set(frasi.map(c=>c.chi)).size;
}
/* Le coppie (una frase e chi l'ha detta) sono 2.000 per lingua, prese dalle frasi di «Chi ha detto?»:
   un terzo per livello, a turno fra i personaggi (così ce ne sono di tanti diversi) e con frasi né
   troppo brevi né troppo lunghe */
const MEM_COPPIE=2000;
const _memCoppie={};
function coppieMemoria(lg){
  if(_memCoppie[lg]) return _memCoppie[lg];
  const quota={1:Math.ceil(MEM_COPPIE/3),2:Math.ceil((MEM_COPPIE-1)/3),3:Math.floor(MEM_COPPIE/3)};
  const brutta=c=>(c.q.length>=25 && c.q.length<=140)?Math.abs(c.q.length-80):1000+c.q.length;   /* meglio a metà strada */
  const scelte=[];
  [1,2,3].forEach(liv=>{
    const perPers={};
    CITAZIONI.filter(c=>c.lg===lg && (c.dif||2)===liv).forEach(c=>{ (perPers[c.chi]=perPers[c.chi]||[]).push(c); });
    const gruppi=Object.keys(perPers).map(k=>perPers[k].sort((a,b)=>brutta(a)-brutta(b))).sort((a,b)=>b.length-a.length);
    let presi=0;
    for(let giro=0; presi<quota[liv]; giro++){
      let qualcuna=false;
      for(const g of gruppi){ if(g[giro] && presi<quota[liv]){ scelte.push(g[giro]); presi++; qualcuna=true; } }
      if(!qualcuna) break;
    }
  });
  return (_memCoppie[lg]=scelte);
}
/* le coppie di una partita: a caso ma col peso del livello (a «facile» soprattutto frasi facili…), e una sola per
   personaggio: due carte «nome» uguali sarebbero indistinguibili e il gioco sembrerebbe «sbagliato» */
function scegliCoppieMemoria(lg,liv,n){
  const tipo='gm'+lg;                                    /* le coppie già uscite non tornano finché non sono uscite tutte */
  const prendi=()=>{
    const set=insiemeViste(tipo), visti=new Set(), out=[];
    coppieMemoria(lg).filter(c=>!set.has(chiaveFrase(c)))
      .map(c=>({c,k:-Math.log(1-Math.random())/Math.pow(0.25,Math.abs((c.dif||2)-liv))}))
      .sort((a,b)=>a.k-b.k).forEach(x=>{ if(out.length<n && !visti.has(x.c.chi)){ visti.add(x.c.chi); out.push(x.c); } });
    return out;
  };
  let out=prendi();
  if(out.length<n){ azzeraViste(tipo,true); out=prendi(); }
  segnaVisteGioco(tipo,out.map(chiaveFrase));
  return out;
}
function nuovaMemoria(){
  const scelte=scegliCoppieMemoria(MEM.lg,livelloGioco('memoria'),MEM.n);
  const carte=[];
  scelte.forEach((c,i)=>{
    carte.push({coppia:i, tipo:'frase', testo:truncaTesto(c.q,60)});
    carte.push({coppia:i, tipo:'nome', testo:nomeParlante(c.chi,c.lg)});
  });
  MEM.carte=mescola(carte); MEM.girate=[]; MEM.trovate=[]; MEM.blocco=false; MEM.mosse=0; MEM.pid=uid();
  vMemoria();
}
function memGira(i){
  if(MEM.blocco || MEM.girate.includes(i) || MEM.trovate.includes(i)) return;
  if(garaDi('memoria') && GARA.daPassare) return;       /* in gara: aspetta il turno del prossimo */
  MEM.girate.push(i);
  if(MEM.girate.length===2){
    MEM.mosse++;
    const [a,b]=MEM.girate;
    if(MEM.carte[a].coppia===MEM.carte[b].coppia){
      MEM.trovate.push(a,b); MEM.girate=[];
      const finita=MEM.trovate.length===MEM.carte.length;
      /* il risultato si salva PRIMA di disegnare la schermata finale, così la
         classifica e il conto delle partite sono già aggiornati */
      if(finita) salvaRisultatoAttuale('memoria',MEM.pid,Math.min(100,(MEM.carte.length/2)/MEM.mosse*100),{mosse:MEM.mosse,coppie:MEM.carte.length/2});
      vMemoria();
      if(finita) avvisa('Tutte le coppie trovate! 🎉','ok');
      /* in gara (tutti sulle stesse carte): una coppia trovata è un punto, poi tocca al prossimo */
      garaFatto('memoria',true,1,null);
    } else {
      MEM.blocco=true; vMemoria();
      garaFatto('memoria',false,0,()=>{ MEM.girate=[]; MEM.blocco=false; vMemoria(); });
      if(!garaDi('memoria')) setTimeout(()=>{ MEM.girate=[]; MEM.blocco=false; vMemoria(); },900);
    }
  } else vMemoria();
}
function vMemoria(){
  if(GIO.giocatore) return vPaginaGiocatore();
  if(!MEM.carte.length) return nuovaMemoria();
  const finita=MEM.trovate.length===MEM.carte.length;
  /* le carte si dispongono in base a quante sono, così stanno sempre tutte dentro allo schermo */
  const nC=MEM.carte.length, colonne=nC<=16?4:5, righe=Math.ceil(nC/colonne);
  pinta(`
  <div class="gio-pagina">
  <button class="bt pi torna-gio" onclick="tornaGiochi()">← Giochi</button>
  <h1>🃏 Memoria — Chi l'ha detto?</h1>
  <p class="sotto">🇮🇹 <b>${coppieMemoria('it').length.toLocaleString('it-IT')}</b> coppie disponibili ·
    🇷🇴 <b>${coppieMemoria('ro').length.toLocaleString('it-IT')}</b> coppie disponibili</p>
  ${htmlGiocatori('memoria')}
  <div class="scelte scelte-3">
    <div class="scelta" style="--ac:#5fd48f">
      <div class="scelta-tit">🌐 Lingua</div>
      <div class="scelta-op">
        <button class="op ${MEM.lg==='it'?'on':''}" onclick="MEM.lg='it';nuovaMemoria()">🇮🇹 Italiano</button>
        <button class="op ${MEM.lg==='ro'?'on':''}" onclick="MEM.lg='ro';nuovaMemoria()">🇷🇴 Română</button>
      </div>
    </div>
    <div class="scelta" style="--ac:#d7a6ff">
      <div class="scelta-tit">🔢 Coppie</div>
      <div class="scelta-op">${[6,8,10].map(n=>`<button class="op ${MEM.n===n?'on':''}" onclick="MEM.n=${n};nuovaMemoria()">${n}</button>`).join('')}</div>
    </div>
    <div class="scelta" style="--ac:#ffb37a">
      <div class="scelta-tit">🔄 Ricomincia</div>
      <div class="scelta-op"><button class="op nuovo" onclick="nuovaMemoria()">Nuova partita</button></div>
    </div>
  </div>
  <p class="sotto">Mosse: <b>${MEM.mosse}</b> · Coppie trovate: <b>${MEM.trovate.length/2}</b> su ${MEM.carte.length/2}</p>
  <div class="mem-campo ${finita?'fine':''}">
  ${finita?`<div class="scheda vf-fine mem-esito"><h2>Bravo! 🎉</h2><p class="sotto">Hai trovato tutte le coppie in ${MEM.mosse} mosse.</p>
     ${htmlPremio('memoria', Math.min(100,(MEM.carte.length/2)/MEM.mosse*100), {chiave:MEM.pid})}
     <button class="bt blu" onclick="nuovaMemoria()">🔄 Gioca ancora</button></div>`:''}
  <div class="mem-grid" style="--mc:${colonne};--mr:${righe}">
    ${MEM.carte.map((c,i)=>{
      const su = MEM.girate.includes(i) || MEM.trovate.includes(i);
      const trov = MEM.trovate.includes(i);
      const errata = MEM.blocco && MEM.girate.includes(i);
      return `<button class="mem-carta ${su?'su':''} ${trov?'trovata':''} ${errata?'errata':''}" onclick="memGira(${i})">
        <span class="mem-dietro">?</span>
        <span class="mem-davanti">${esc(c.testo)}</span>
      </button>`;
    }).join('')}
  </div>
  </div>
  </div>`);
}

/* ---------- tutti i giochi dentro allo schermo ----------
   Nella schermata fissa (iPad in orizzontale) la pagina del gioco è alta quanto lo schermo: quando
   il contenuto è più alto (una domanda lunga, la risposta con il riferimento, il pulsante «Avanti»…)
   il fondo restava tagliato fuori. Dopo ogni cambiamento controllo se qualche pulsante o testo esce
   dallo schermo (o dal riquadro che lo contiene) e, se sì, rimpicciolisco TUTTA la pagina del gioco
   quanto basta perché ci stia: la disegno più grande e la riduco in scala, così le proporzioni
   restano quelle di prima. */
const _GIO_DA_VEDERE='.bt,button,.op,input,select,.dom-testo,.dom-sopra,.vf-esito,.gn-esito,h2,.cdc-slot,.tpl-fasi span,.csi-indizio';
function _gioEsce(pg,fondo,destra){
  destra=destra||1e9;
  for(const el of pg.querySelectorAll(_GIO_DA_VEDERE)){
    const r=el.getBoundingClientRect();
    if(!r.width || !r.height) continue;
    let giu=fondo, dx=destra, scorreDiLato=false;
    for(let a=el.parentElement; a && a!==pg.parentElement; a=a.parentElement){
      const cs=getComputedStyle(a);
      if(cs.overflowY!=='visible'){ const ra=a.getBoundingClientRect(); if(ra.bottom<giu) giu=ra.bottom; }
      /* una riga che scorre di lato apposta (i giocatori quando sono tanti) non «esce» dallo schermo;
         un riquadro che scorre (overflow:auto) invece sì: una risposta che esce a destra va rimpicciolita */
      if((cs.overflowX==='auto'||cs.overflowX==='scroll') && a.closest('.gio-giocatori')) scorreDiLato=true;
      else if(cs.overflowX!=='visible'){ const ra=a.getBoundingClientRect(); if(ra.right<dx) dx=ra.right; }
    }
    if(r.bottom>giu+1 || (!scorreDiLato && r.right>dx+1)) return true;
  }
  return false;
}
/* la schermata fissa dei giochi: iPad in orizzontale, e da questa versione anche
   l'iPad in verticale (tutti, fino al più grande); il telefono in verticale scorre */
function gioSchermoFisso(){
  return matchMedia('(orientation:landscape) and (min-width:900px),(orientation:portrait) and (min-width:700px) and (min-height:900px)').matches;
}
/* E al contrario: sugli schermi grandi (l'iPad Pro più grande, in orizzontale e in
   verticale) il gioco restava piccolo in mezzo a tanto spazio vuoto, con le scritte
   piccole. Ora la pagina del gioco si INGRANDISCE (fino a una volta e mezza) finché
   c'è posto: tutto cresce insieme, scritte comprese, e niente esce dallo schermo.
   Per non far cambiare misura al gioco a ogni domanda, dentro allo stesso gioco e
   allo stesso schermo la misura trovata resta quella, e si rimpicciolisce soltanto
   se una domanda più lunga non ci starebbe. */
let _gioAdatto=false, _gioZ=null;
function adattaGioco(){
  const pg=document.querySelector('body.gio-fissa #vista .gio-pagina');
  if(!pg || _gioAdatto || zoomNativo()) return;
  _gioAdatto=true;
  try{
    const metti=z=>{
      if(z===1){ pg.style.transform=pg.style.transformOrigin=pg.style.width=pg.style.height=''; return; }
      pg.style.transformOrigin='0 0'; pg.style.transform=`scale(${z})`;
      pg.style.width=(100/z)+'%'; pg.style.height=(100/z)+'%';
    };
    metti(1);
    /* le scritte tornano alla loro misura di partenza: le ingrandisce di nuovo adattaScritte, alla fine */
    pg.querySelectorAll(_GIO_SCRITTE).forEach(e=>{ if(e.style.fontSize) e.style.fontSize=''; });
    if(!gioSchermoFisso() && !document.body.classList.contains('gioco-proiettore')){ pg.dataset.scala=1; return; }
    let sotto=0;
    try{ const t=document.createElement('div'); t.style.cssText='position:fixed;bottom:0;height:env(safe-area-inset-bottom,0px)';
      document.body.appendChild(t); sotto=t.offsetHeight; t.remove(); }catch(e){}
    const fondo=window.innerHeight-sotto-2, destra=largFinestra()-1;
    /* quanto sono alte (nella misura della pagina, prima della scala) le righe fisse in cima:
       ingrandendo, non devono andare a capo — altrimenti rubano posto al gioco vero */
    const forma=()=>[...pg.children].reduce((s,c)=>s+(getComputedStyle(c).flexGrow==='0'?c.offsetHeight:0),0);
    const forma1=forma();
    /* e la parte del gioco vero (la ruota, la mappa, le carte…) non deve perdere troppo posto
       rispetto alle barre, che ingrandendo si prendono più spazio */
    const quota=()=>{ const h=pg.clientHeight||1; return (h-forma())/h; };
    const quota1=quota();
    const esce=z=>{ metti(z); return _gioEsce(pg,fondo,destra) || (z>1 && (forma()>forma1*1.04+2 || quota()<quota1-0.08)); };
    const piu_piccolo=z=>{ while(z>0.6 && esce(z)) z=Math.round((z-0.03)*100)/100; return z; };
    const chiave=GIO.vista+'|'+largFinestra()+'x'+window.innerHeight+(document.body.classList.contains('gioco-proiettore')?'|P':'');
    let z;
    if(_gioZ && _gioZ.k===chiave) z=esce(_gioZ.z)?piu_piccolo(_gioZ.z):_gioZ.z;
    else if(esce(1)) z=piu_piccolo(1);
    else {
      const max=Math.max(1,Math.min(1.5,pg.clientWidth/640));
      let lo=1, hi=max;
      if(!esce(hi)) lo=hi;
      else for(let k=0;k<7;k++){ const m=(lo+hi)/2; if(esce(m)) hi=m; else lo=m; }
      z=Math.floor(lo*100)/100;
    }
    metti(z);
    pg.dataset.scala=z; _gioZ={k:chiave,z};
    /* la ruota si misura sullo spazio che resta alla scala trovata: prima di ingrandire le scritte
       (così le scritte si misurano accanto alla ruota vera) e di nuovo dopo */
    const ruota=typeof adattaRuota==='function' && pg.querySelector('.ruo-disco');
    if(ruota) adattaRuota();
    adattaScritte(pg,fondo,destra);
    if(ruota) adattaRuota();
    /* mezzo secondo dopo ricontrollo: se nel frattempo qualcosa si è spostato ed esce, rifaccio
       (al massimo due volte di seguito, finché la pagina non cambia) */
    clearTimeout(_gioRic);
    _gioRic=setTimeout(()=>{
      if(!pg.isConnected || zoomNativo() || _gioRicN>=2) return;
      if(_gioEsce(pg,fondo,destra)){ _gioRicN++; adattaGioco(); }
    },450);
  } finally { _gioAdatto=false; }
}
let _gioRic=0, _gioRicN=0;
/* ---------- le scritte che riempiono le loro caselle ----------
   Dopo aver adattato la pagina allo schermo, domande e risposte si ingrandiscono TUTTE INSIEME
   (stessa proporzione fra loro) finché ci stanno: nessuna scritta esce dalla sua casella e niente
   esce dallo schermo. Così ogni risposta riempie la sua casella e la domanda si legge da lontano. */
const _GIO_SCRITTE='.dom-testo,.vf-domanda,.vf-risposta,.cpl-frase,.csi-indizio,.imp-descr,.mem-davanti,.mis-p-q,.mis-intro-tx,'+
  '.dom-opz .bt,.gn-opz .bt,.mis-opz .bt,.mis-v,.vf-bt .bt,.gn-ord,.vrs-blocco,.gn-pagina .dom-sopra,.scl-opz .bt,.tpl-ass .bt,.cdc-card p,.pmi-card p';
function adattaScritte(pg,fondo,destra){
  const el=[...pg.querySelectorAll(_GIO_SCRITTE)].filter(e=>e.offsetWidth>0 && !e.closest('.gio-giocatori,.scelte,.gara-striscia'));
  el.forEach(e=>{ e.style.fontSize=''; });
  if(!el.length) return;
  const base=el.map(e=>parseFloat(getComputedStyle(e).fontSize)||16);
  const metti=k=>el.forEach((e,i)=>{ e.style.fontSize=(base[i]*k).toFixed(1)+'px'; });
  const esce=()=>el.some(e=>e.scrollHeight>e.clientHeight+2 || e.scrollWidth>e.clientWidth+2) || _gioEsce(pg,fondo,destra);
  metti(1);
  if(esce()){ el.forEach(e=>{ e.style.fontSize=''; }); return; }
  let lo=1, hi=2.6;
  for(let n=0;n<7;n++){ const m=(lo+hi)/2; metti(m); if(esce()) hi=m; else lo=m; }
  lo=Math.floor(lo*20)/20;
  /* Safari a volte non misura uguale due volte di fila: con la misura scelta controllo ancora,
     e se qualcosa esce scendo a piccoli passi finché tutto sta dentro */
  while(lo>1.02){ metti(lo); if(!esce()) break; lo=Math.round((lo-0.05)*100)/100; }
  if(lo<=1.02){ el.forEach(e=>{ e.style.fontSize=''; }); lo=1; }
  pg.dataset.scritte=lo;
}
let _gioRaf=0;
function chiediAdattaGioco(){ if(_gioRaf) return; _gioRaf=requestAnimationFrame(()=>{ _gioRaf=0; adattaGioco(); }); }
(function(){
  const avvia=()=>{
    const v=document.getElementById('vista'); if(!v) return setTimeout(avvia,200);
    new MutationObserver(()=>{ if(!_gioAdatto && document.body.classList.contains('gio-fissa')){ _gioRicN=0; chiediAdattaGioco(); } })
      .observe(v,{childList:true,subtree:true,characterData:true});
    new MutationObserver(()=>{ if(document.body.classList.contains('gio-fissa')) chiediAdattaGioco(); })
      .observe(document.body,{attributes:true,attributeFilter:['class']});
  };
  avvia();
  window.addEventListener('resize',()=>{ if(!zoomNativo()) setTimeout(chiediAdattaGioco,80); });
  window.addEventListener('orientationchange',()=>setTimeout(chiediAdattaGioco,350));
})();
