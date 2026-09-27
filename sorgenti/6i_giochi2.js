/* ================= ALTRI GIOCHI BIBLICI =================
   Stessa regola degli altri: niente inventato, solo DOMANDE/CITAZIONI/_CHD.p
   già dentro al programma, ricombinati in modo diverso. */

/* Il riquadro della domanda (.dom-card) è grande quanto lo spazio che resta sullo schermo; le scritte si adattano:
   provo dalla misura più grande e scendo finché la domanda, le risposte e gli indizi ci stanno TUTTI, senza uscire
   dal riquadro. La misura buona la ricordo per la stessa domanda (il Blitz ridisegna la pagina ogni secondo). */
const _adatta={k:'',fs:0};
function adattaCard(chiave){
  const card=$('.dom-card'); if(!card) return;
  if(_adatta.k===chiave && _adatta.fs){ card.style.setProperty('--fs',_adatta.fs); return; }
  const max=Math.round(Math.min(46,Math.max(18,largFinestra()/26)));   /* scritte più grandi: si parte più in alto e si scende solo se non ci sta */
  const sfora=()=>card.scrollHeight>card.clientHeight+1 ||
    [...card.querySelectorAll('.dom-testo,.dom-opz .bt,.csi-lista,.csi-indizio')].some(e=>e.scrollHeight>e.clientHeight+1 || e.scrollWidth>e.clientWidth+1);
  let fs=max;
  for(; fs>12; fs--){ card.style.setProperty('--fs',fs); if(!sfora()) break; }
  _adatta.k=chiave; _adatta.fs=fs;
}
window.addEventListener('resize',()=>{ if(zoomNativo()) return; _adatta.k=''; if($('.dom-card')) adattaCard(''); });
/* dopo una risposta la si lascia vedere un momento — verde se è giusta, rossa se è sbagliata, e
   la giusta in verde — poi si va avanti. Con ms=0 (nelle prove) si va avanti subito. */
const GIOCHI_PAUSA={ms:900, blitz:450};
function dopoPausa(ms,fn){ if(ms>0) setTimeout(fn,ms); else fn(); }

/* ---------- X e O biblico: per mettere il segno devi rispondere giusto ---------- */
/* g: le risposte di ognuno dei due (giuste e date) — a fine partita ogni
   giocatore che ha preso posto ha il suo risultato; pid: il numero della partita */
const TRIS={ griglia:Array(9).fill(null), turno:'X', lg:'it', domanda:null, cellaPendente:null,
  vittorie:{X:0,O:0}, giuste:0, totali:0, finito:false, vincitore:null, esito:null,
  g:{X:{giuste:0,tot:0},O:{giuste:0,tot:0}}, pid:null };
const TRIS_LINEE=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
function nuovoTris(){
  TRIS.griglia=Array(9).fill(null); TRIS.turno='X'; TRIS.domanda=null; TRIS.cellaPendente=null; TRIS.esito=null;
  TRIS.giuste=0; TRIS.totali=0; TRIS.finito=false; TRIS.vincitore=null;
  TRIS.g={X:{giuste:0,tot:0},O:{giuste:0,tot:0}}; TRIS.pid=uid();
  vTris();
}
/* il segno con il nome di chi lo gioca, se ha preso posto: «Anna (X)» */
function etichettaTurno(s){ const g=trisGiocatore(s); return g ? `${g.n} (${s})` : s; }
/* a fine partita: un risultato per ognuno dei due giocatori che hanno preso
   posto — quante risposte ha azzeccato LUI; se ha vinto, perso o pareggiato si
   vede accanto */
function trisSalvaRisultati(){
  ['X','O'].forEach(s=>{
    const g=trisGiocatore(s); if(!g) return;
    const a=TRIS.g[s], esito=TRIS.vincitore==='pareggio'?'P':(TRIS.vincitore===s?'V':'S');
    salvaRisultato('tris',g.i,TRIS.pid+s,a.tot?a.giuste/a.tot*100:0,{giuste:a.giuste,tot:a.tot,segno:s,esito});
  });
}
/* i premi di fine partita: uno per giocatore, oppure uno solo (le risposte di
   tutti e due insieme) se nessuno ha preso posto */
function htmlPremioTris(){
  const persone=['X','O'].map(s=>({s,g:trisGiocatore(s)})).filter(x=>x.g);
  if(!persone.length) return htmlPremio('tris', TRIS.totali?TRIS.giuste/TRIS.totali*100:0, {chiave:TRIS.pid, giocatore:null});
  /* i due premi uno accanto all'altro, la classifica sotto */
  return `<div class="tris-premi">${persone.map(x=>{
    const a=TRIS.g[x.s];
    return htmlPremio('tris', a.tot?a.giuste/a.tot*100:0,
      {giocatore:x.g, chiave:TRIS.pid+x.s, etichetta:(x.s==='X'?'❌ ':'⭕ ')+x.g.n, senzaClassifica:true});
  }).join('')}</div>${htmlClassificaGioco('tris')}`;
}
function trisVincitore(){
  for(const [a,b,c] of TRIS_LINEE) if(TRIS.griglia[a] && TRIS.griglia[a]===TRIS.griglia[b] && TRIS.griglia[b]===TRIS.griglia[c]) return TRIS.griglia[a];
  return null;
}
function trisClicca(i){
  if(TRIS.finito || TRIS.griglia[i] || TRIS.domanda) return;
  const d=pescaDomandeGioco(TRIS.lg,livelloGioco('tris'),1)[0];     /* una delle 5.000, mai una già uscita */
  segnaDomandaGioco(d);
  const idx=mescola([0,1,2]);
  TRIS.domanda={d, o:idx.map(k=>d.o[k]), g:idx.indexOf(d.g)};
  TRIS.cellaPendente=i;
  vTris();
}
function trisRispondi(sceltaIdx){
  const dm=TRIS.domanda; if(!dm || TRIS.esito) return;
  TRIS.esito={sc:sceltaIdx};                 /* la risposta si accende subito: verde giusta, rossa sbagliata */
  if(GIOCHI_PAUSA.ms>0) vTris();
  dopoPausa(GIOCHI_PAUSA.ms,()=>trisConcludi(sceltaIdx));
}
function trisConcludi(sceltaIdx){
  const dm=TRIS.domanda; if(!dm) return;
  TRIS.esito=null;
  const chi=TRIS.turno;                      /* chi sta rispondendo */
  TRIS.totali++; TRIS.g[chi].tot++;
  if(sceltaIdx===dm.g){
    TRIS.giuste++; TRIS.g[chi].giuste++;
    TRIS.griglia[TRIS.cellaPendente]=TRIS.turno;
    const vinc=trisVincitore();
    if(vinc){ TRIS.finito=true; TRIS.vincitore=vinc; TRIS.vittorie[vinc]++; trisSalvaRisultati(); }
    else if(TRIS.griglia.every(x=>x)){ TRIS.finito=true; TRIS.vincitore='pareggio'; trisSalvaRisultati(); }
    else TRIS.turno = TRIS.turno==='X'?'O':'X';
  } else {
    avvisa('Risposta sbagliata: turno perso','no');
    TRIS.turno = TRIS.turno==='X'?'O':'X';
  }
  TRIS.domanda=null; TRIS.cellaPendente=null;
  if(GIO.vista==='tris') vTris();
}
function vTris(){
  if(GIO.giocatore) return vPaginaGiocatore();
  const dm=TRIS.domanda;
  pinta(`
  <div class="gio-pagina">
  <button class="bt pi torna-gio" onclick="tornaGiochi()">← Giochi</button>
  <h1>❌⭕ X e O biblico</h1>
  ${htmlGiocatori('tris')}
  <div class="scelte scelte-3">
    <div class="scelta" style="--ac:#5fd48f">
      <div class="scelta-tit">🌐 Lingua</div>
      <div class="scelta-op">
        <button class="op ${TRIS.lg==='it'?'on':''}" onclick="TRIS.lg='it';nuovoTris()">🇮🇹 Italiano · ${domandeTutte('it').length.toLocaleString('it-IT')}</button>
        <button class="op ${TRIS.lg==='ro'?'on':''}" onclick="TRIS.lg='ro';nuovoTris()">🇷🇴 Română · ${domandeTutte('ro').length.toLocaleString('it-IT')}</button>
      </div>
    </div>
    <div class="scelta" style="--ac:#8b7bff">
      <div class="scelta-tit">👥 Chi gioca</div>
      <div class="scelta-op tris-chi">${['X','O'].map(sg=>{
        const cur=(stato.imp.trisGiocatori||{})[sg]||'';
        return `<label class="tris-chi-riga"><span>${sg==='X'?'❌':'⭕'}</span>
          <select onchange="assegnaSegnoTris('${sg}',this.value)">
            <option value="">— nessuno —</option>
            ${elencoGiocatori().map(g=>`<option value="${g.i}" ${cur===g.i?'selected':''}>${esc(g.n)}</option>`).join('')}
          </select></label>`; }).join('')}</div>
    </div>
    <div class="scelta" style="--ac:#ffb37a">
      <div class="scelta-tit">🔄 Ricomincia</div>
      <div class="scelta-op"><button class="op nuovo" onclick="nuovoTris()">Nuova partita</button></div>
    </div>
  </div>

  <div class="tris-punteggio"><span>❌ ${esc(etichettaTurno('X'))}: ${TRIS.vittorie.X}</span><span>⭕ ${esc(etichettaTurno('O'))}: ${TRIS.vittorie.O}</span></div>

  ${dm?`
  <div class="scheda dom-card tris-domanda">
    <p class="dom-sopra">Rispondi giusto per mettere ${dm===TRIS.domanda?TRIS.turno:''}:</p>
    <p class="dom-testo">${esc(dm.d.d)}</p>
    <div class="dom-opz">
      ${dm.o.map((t,i)=>`<button class="bt ${TRIS.esito?(i===dm.g?'giusta':(i===TRIS.esito.sc?'sbagliata':'spenta')):''}" ${TRIS.esito?'disabled':''} onclick="trisRispondi(${i})">${esc(t)}</button>`).join('')}
    </div>
  </div>`:`
  <p class="tris-turno">${TRIS.finito?(TRIS.vincitore==='pareggio'?'Pareggio!':`Ha vinto ${esc(etichettaTurno(TRIS.vincitore))}! 🎉`):`Tocca a ${esc(etichettaTurno(TRIS.turno))} — tocca una casella`}</p>
  <div class="tris-campo ${TRIS.finito?'fine':''}">
    <div class="tris-grid">
      ${TRIS.griglia.map((v,i)=>`<button class="tris-cella ${v==='X'?'x':v==='O'?'o':''}" ${v||TRIS.finito?'disabled':''} onclick="trisClicca(${i})">${v||''}</button>`).join('')}
    </div>
    ${TRIS.finito?`<div class="tris-esito">${htmlPremioTris()}<div style="text-align:center;margin-top:14px"><button class="bt blu" onclick="nuovoTris()">🔄 Nuova partita</button></div></div>`:''}
  </div>`}
  </div>`);
  if(dm) adattaCard('t|'+dm.d.d); else adattaTris();
}
/* le caselle di X e O: la grandezza del segno segue quella della casella (mai il contrario), così scrivere
   ❌ o ⭕ non fa cambiare forma a nessuna casella */
function adattaTris(){
  const g=$('.tris-grid'), c=g&&g.querySelector('.tris-cella'); if(!c) return;
  g.style.setProperty('--tris-f',Math.round(c.getBoundingClientRect().width*0.56)+'px');
}
window.addEventListener('resize',()=>{ if(!zoomNativo() && $('.tris-grid')) adattaTris(); });

/* ---------- Blitz biblico: quante domande giuste in 60 secondi ---------- */
const BLZ={ lg:'it', tempo:60, timer:null, attivo:false, punti:0, tot:0, corrente:null, pid:null, esito:null };
function blzProssima(){
  const d=pescaDomandeGioco(BLZ.lg,livelloGioco('blitz'),1)[0];      /* una delle 5.000, mai una già uscita */
  segnaDomandaGioco(d);
  const idx=mescola([0,1,2]);
  BLZ.corrente={d, o:idx.map(k=>d.o[k]), g:idx.indexOf(d.g)};
}
function avviaBlitz(){
  clearInterval(BLZ.timer);
  BLZ.tempo=60; BLZ.attivo=true; BLZ.punti=0; BLZ.tot=0; BLZ.pid=uid(); BLZ.esito=null;
  blzProssima();
  BLZ.timer=setInterval(()=>{
    BLZ.tempo--;
    if(BLZ.tempo<=0){
      clearInterval(BLZ.timer); BLZ.timer=null; BLZ.attivo=false;
      if(BLZ.tot) salvaRisultatoAttuale('blitz',BLZ.pid,BLZ.punti/BLZ.tot*100,{giuste:BLZ.punti,tot:BLZ.tot});
    }
    vBlitz();
  },1000);
  vBlitz();
}
function blzRispondi(i){
  if(!BLZ.attivo || !BLZ.corrente || BLZ.esito) return;
  BLZ.tot++;
  if(i===BLZ.corrente.g) BLZ.punti++;
  BLZ.esito={sc:i};                          /* si accende subito: verde giusta, rossa sbagliata */
  if(GIOCHI_PAUSA.blitz>0) vBlitz();
  dopoPausa(GIOCHI_PAUSA.blitz,()=>{
    BLZ.esito=null;
    if(BLZ.attivo) blzProssima();
    if(GIO.vista==='blitz') vBlitz();
  });
}
function vBlitz(){
  if(GIO.giocatore) return vPaginaGiocatore();
  const c=BLZ.corrente;
  pinta(`
  <div class="gio-pagina">
  <button class="bt pi torna-gio" onclick="tornaGiochi()">← Giochi</button>
  <h1>⏱️ Blitz biblico</h1>
  ${htmlGiocatori('blitz')}
  <div class="scelte scelte-3">
    <div class="scelta" style="--ac:#5fd48f">
      <div class="scelta-tit">🌐 Lingua</div>
      <div class="scelta-op">
        <button class="op ${BLZ.lg==='it'?'on':''}" ${BLZ.attivo?'disabled':''} onclick="BLZ.lg='it';vBlitz()">🇮🇹 Italiano · ${domandeTutte('it').length.toLocaleString('it-IT')}</button>
        <button class="op ${BLZ.lg==='ro'?'on':''}" ${BLZ.attivo?'disabled':''} onclick="BLZ.lg='ro';vBlitz()">🇷🇴 Română · ${domandeTutte('ro').length.toLocaleString('it-IT')}</button>
      </div>
    </div>
    <div class="scelta" style="--ac:#ffb37a">
      <div class="scelta-tit">▶️ Partita</div>
      <div class="scelta-op"><button class="op nuovo" onclick="avviaBlitz()">${BLZ.tot||BLZ.attivo?'🔄 Ricomincia':'▶️ Via!'}</button></div>
    </div>
  </div>
  ${!BLZ.attivo && !BLZ.tot ? `<div class="scheda" style="text-align:center"><p class="sotto" style="margin:0">Rispondi a più domande che puoi in 60 secondi!</p></div>`:''}
  ${BLZ.attivo && c ?`
  <div class="scheda dom-card blz-card">
    <div class="blz-testa"><span class="blz-tempo ${BLZ.tempo<=10?'poco':''}">${BLZ.tempo}s</span><span class="blz-punti">${BLZ.punti} ✓ / ${BLZ.tot}</span></div>
    <p class="dom-testo">${esc(c.d.d)}</p>
    <div class="dom-opz">
      ${c.o.map((t,i)=>`<button class="bt ${BLZ.esito?(i===c.g?'giusta':(i===BLZ.esito.sc?'sbagliata':'spenta')):''}" ${BLZ.esito?'disabled':''} onclick="blzRispondi(${i})">${esc(t)}</button>`).join('')}
    </div>
  </div>`:''}
  ${!BLZ.attivo && BLZ.tot ? `<div class="scheda vf-fine"><h2>Tempo scaduto!</h2><p class="sotto">Hai risposto giusto a <b>${BLZ.punti}</b> domande su <b>${BLZ.tot}</b>.</p>
    ${htmlPremio('blitz', BLZ.punti/BLZ.tot*100, {chiave:BLZ.pid})}
    <button class="bt blu" onclick="avviaBlitz()">🔄 Gioca ancora</button></div>`:''}
  </div>`);
  if(BLZ.attivo && c) adattaCard('b|'+c.d.d);
}

/* ---------- Completa la frase: manca una parola in una frase vera di «Chi ha detto?» ---------- */
const CPL={ lg:'it', corrente:null, punti:0, tot:0, pid:null };
/* la parola senza la punteggiatura attorno (con tutte le lettere, anche ă ș ț del rumeno) */
function _paroleValide(s){ return s.replace(/^[^\p{L}\p{N}_]+|[^\p{L}\p{N}_]+$/gu,''); }
/* la frase con la parola mancante: un vuoto; se indovini, la parola giusta compare al suo posto, in verde */
function cplFraseHtml(cc){
  return cc.parole.map((w,i)=>{
    if(i!==cc.pos) return esc(w);
    if(cc.risposto && cc.scelta===cc.g){
      const j=Math.max(0,w.indexOf(cc.corretta));
      return esc(w.slice(0,j))+'<span class="cpl-ok">'+esc(cc.corretta)+'</span>'+esc(w.slice(j+cc.corretta.length));
    }
    return '<span class="cpl-blank">_____</span>';
  }).join(' ');
}
/* una serie nuova: i punti ripartono da zero (e una riga nuova nella storia del giocatore) */
function nuovaPartitaCompleta(){ CPL.punti=0; CPL.tot=0; CPL.pid=uid(); nuovaFrase(); }
function nuovaFrase(){
  if(garaPassa('completa',nuovaFrase)) return;          /* in gara: la frase dopo è del prossimo giocatore */
  const liv=livelloGioco('completa');
  const pool=citazioniLivello(CPL.lg,liv).filter(c=>c.q.split(/\s+/).length>=7);
  /* la parola tolta non deve comparire anche altrove nella frase: se no la risposta sarebbe già scritta nella domanda.
     Se in una frase ogni parola si ripete («molti primi saranno ultimi e molti ultimi saranno primi») ne prendo un'altra. */
  const stessa=(a,b)=>ck(_paroleValide(a))===ck(_paroleValide(b));
  let c, parole, papabili=[];
  for(let t=0;t<40 && !papabili.length;t++){
    c=pescaNuovePesate(pool,1,'gf'+CPL.lg,chiaveFrase,()=>1).lista[0];      /* mai una frase già uscita (in Completa e in Chi sono io) */
    segnaVisteGioco('gf'+CPL.lg,[chiaveFrase(c)]);
    parole=c.q.split(/\s+/);
    papabili=parole.map((w,i)=>i).filter(i=>i>0 && i<parole.length-1 && _paroleValide(parole[i]).length>=4
      && !parole.some((x,j)=>j!==i && stessa(x,parole[i])));
  }
  const scelta=papabili.length?papabili[Math.floor(Math.random()*papabili.length)]:1;
  const corretta=_paroleValide(parole[scelta]);
  const altre=mescola(CITAZIONI.filter(x=>x.lg===CPL.lg && x.q!==c.q));
  /* più il livello sale, più le parole sbagliate assomigliano a quella giusta
     (stessa lunghezza, o quasi): facile = qualunque parola; difficile = simile */
  const tolleranza=liv===1?99:liv===2?3:1;
  const decoy=[];
  const cerca=tol=>{
    for(const alt of altre){
      if(decoy.length>=2) break;
      const ws=alt.q.split(/\s+/).map(_paroleValide)
        .filter(w=>w.length>=4 && ck(w)!==ck(corretta) && Math.abs(w.length-corretta.length)<=tol);
      if(ws.length){ const cand=ws[Math.floor(Math.random()*ws.length)]; if(!decoy.some(x=>ck(x)===ck(cand))) decoy.push(cand); }
    }
  };
  cerca(tolleranza);
  if(decoy.length<2) cerca(99);   /* se di così simili non ce ne sono abbastanza, ne prendo di qualunque lunghezza */
  const opz=mescola([corretta,...decoy]);
  const g=opz.indexOf(corretta);
  CPL.corrente={parole, pos:scelta, opz, g, corretta, risposto:false, scelta:null, cit:c};
  CPL.corrente.frase=cplFraseHtml(CPL.corrente);
  vCompleta();
}
/* il riferimento della frase (libro capitolo:versetto): si vede con la risposta e si tocca per leggere il versetto */
function rifGioco(c){ return c && c.L && c.c && c.v ? rifCit(c) : ''; }
function cplRif(){ const c=CPL.corrente&&CPL.corrente.cit; if(rifGioco(c)) mostraRiferimentoGioco(rifGioco(c),c.lg); }
function csiRif(i){ const c=CSI.indizi[i]; if(rifGioco(c)) mostraRiferimentoGioco(rifGioco(c),c.lg); }
function cplRispondi(i){
  const cc=CPL.corrente; if(!cc||cc.risposto) return;
  cc.risposto=true; cc.scelta=i;
  CPL.tot++; if(i===cc.g) CPL.punti++;
  /* la serie è UNA partita che cresce a ogni frase: si aggiorna sempre la stessa riga */
  salvaRisultatoAttuale('completa',CPL.pid,CPL.punti/CPL.tot*100,{giuste:CPL.punti,tot:CPL.tot},'ultimo');
  garaFatto('completa',i===cc.g,i===cc.g?1:0);
  vCompleta();
}
function vCompleta(){
  if(GIO.giocatore) return vPaginaGiocatore();
  if(!CPL.pid) CPL.pid=uid();
  if(!CPL.corrente) return nuovaFrase();
  const cc=CPL.corrente;
  pinta(`
  <div class="gio-pagina">
  <button class="bt pi torna-gio" onclick="tornaGiochi()">← Giochi</button>
  <h1>📝 Completa la frase</h1>
  ${htmlGiocatori('completa')}
  <div class="scelte scelte-3">
    <div class="scelta" style="--ac:#5fd48f">
      <div class="scelta-tit">🌐 Lingua</div>
      <div class="scelta-op">
        <button class="op ${CPL.lg==='it'?'on':''}" onclick="CPL.lg='it';nuovaPartitaCompleta()">🇮🇹 Italiano</button>
        <button class="op ${CPL.lg==='ro'?'on':''}" onclick="CPL.lg='ro';nuovaPartitaCompleta()">🇷🇴 Română</button>
      </div>
    </div>
    <div class="scelta" style="--ac:#ffb37a">
      <div class="scelta-tit">🔄 Ricomincia</div>
      <div class="scelta-op"><button class="op nuovo" onclick="nuovaPartitaCompleta()">Nuova partita</button></div>
    </div>
  </div>
  <p class="sotto">Punti: <b>${CPL.punti}</b> su ${CPL.tot}</p>
  <div class="cpl-campo ${cc.risposto?'fine':''}">
    <div class="scheda cpl-card">
      <p class="cpl-frase">«${cplFraseHtml(cc)}»</p>
      ${!cc.risposto?`<div class="vf-bt">${cc.opz.map((t,i)=>`<button class="bt" onclick="cplRispondi(${i})">${esc(t)}</button>`).join('')}</div>`
        :`<div class="vf-bt">${cc.opz.map((t,i)=>`<button class="bt ${i===cc.g?'giusta':(i===cc.scelta?'sbagliata':'spenta')}" disabled>${esc(t)}</button>`).join('')}</div>
          <p class="vf-esito ${cc.scelta===cc.g?'giusto':'falso'}">${cc.scelta===cc.g?'Esatto!':'La parola giusta era: '+esc(cc.corretta)}</p>
          ${rifGioco(cc.cit)?`<button class="gio-vers cpl-rif" onclick="cplRif()">📖 ${esc(rifGioco(cc.cit))}</button>`:''}
          <button class="bt blu cpl-avanti" onclick="nuovaFrase()">Avanti →</button>`}
    </div>
    ${cc.risposto&&CPL.tot>0?`<div class="cpl-premio">${htmlPremio('completa', CPL.punti/CPL.tot*100, {chiave:CPL.pid})}</div>`:''}
  </div>
  </div>`);
}

/* ---------- Chi sono io? indovina il personaggio dagli indizi ----------
   Ogni frase di «Chi ha detto?» di un personaggio che ne ha almeno tre è una domanda: è il primo indizio; gli altri
   sono altre sue frasi. Il livello pesa sulla fama del personaggio (facile = i più famosi), non ne toglie nessuno.
   Le frasi già uscite (qui o in «Completa la frase») non tornano finché non sono uscite tutte. */
const CSI={ lg:'it', persona:null, indizi:[], mostrati:1, opzioni:[], risposto:false, scelta:null, punti:0, tot:0, pid:null };
const _csiPool={};
function domandeChiSono(lg){
  if(_csiPool[lg]) return _csiPool[lg];
  const conta=famaPersonaggi(lg);
  return (_csiPool[lg]=CITAZIONI.filter(c=>c.lg===lg && conta[c.chi]>=3));
}
/* i personaggi con almeno `minimo` frasi; a un livello dato, solo quelli
   di quella fama (facile = i più famosi, difficile = i meno noti) */
function _personaggiConCitazioni(lg,minimo,liv){
  const conta=famaPersonaggi(lg);
  return Object.keys(conta).map(Number).filter(k=>conta[k]>=minimo && (!liv || livFama(conta[k])===liv));
}
/* una serie nuova: i punti ripartono da zero (e una riga nuova nella storia del giocatore) */
function nuovaPartitaChiSono(){ CSI.punti=0; CSI.tot=0; CSI.pid=uid(); nuovoChiSono(); }
function nuovoChiSono(){
  if(garaPassa('chisono',nuovoChiSono)) return;         /* in gara: il personaggio dopo è del prossimo giocatore */
  const liv=livelloGioco('chisono'), fama=famaPersonaggi(CSI.lg);
  const prima=pescaNuovePesate(domandeChiSono(CSI.lg),1,'gf'+CSI.lg,chiaveFrase,c=>Math.pow(0.25,Math.abs(livFama(fama[c.chi])-liv))).lista[0];
  const chi=prima.chi;
  /* gli altri indizi: altre frasi dello stesso personaggio, prima quelle mai uscite e più vicine al livello */
  const visti=insiemeViste('gf'+CSI.lg);
  const altre=CITAZIONI.filter(c=>c.lg===CSI.lg && c.chi===chi && c!==prima)
    .map(c=>({c,k:(visti.has(chiaveFrase(c))?100:0)+Math.abs((c.dif||2)-liv)+Math.random()*0.5}))
    .sort((a,b)=>a.k-b.k).map(o=>o.c).slice(0,3);
  const nomi=_CHD.p[CSI.lg];
  let candidati=Array.from({length:nomi.length},(_,i)=>i).filter(i=>i!==chi);
  /* al livello difficile anche le altre risposte sono personaggi poco noti:
     non si indovina scartando i famosi */
  if(liv===3){ const pari=candidati.filter(i=>(fama[i]||0)>0 && livFama(fama[i])===3); if(pari.length>=3) candidati=pari; }
  const altri=mescola(candidati).slice(0,3);
  CSI.persona=chi; CSI.indizi=[prima].concat(altre); CSI.mostrati=1; CSI.opzioni=mescola([chi,...altri]);
  CSI.risposto=false; CSI.scelta=null;
  segnaVisteGioco('gf'+CSI.lg,[chiaveFrase(prima)]);
  vChiSono();
}
function csiIndizio(){
  if(CSI.mostrati<CSI.indizi.length){ CSI.mostrati++; segnaVisteGioco('gf'+CSI.lg,[chiaveFrase(CSI.indizi[CSI.mostrati-1])]); }
  vChiSono();
}
function csiRispondi(scelta){
  if(CSI.risposto) return;
  CSI.risposto=true; CSI.scelta=scelta;
  const giusto = scelta===CSI.persona ? (CSI.mostrati===1?3:CSI.mostrati===2?2:1) : 0;
  CSI.punti += giusto; CSI.tot++;
  /* la serie è UNA partita che cresce a ogni personaggio: si aggiorna sempre la stessa riga */
  salvaRisultatoAttuale('chisono',CSI.pid,CSI.punti/(CSI.tot*3)*100,{punti:CSI.punti,tot:CSI.tot},'ultimo');
  garaFatto('chisono',giusto>0,giusto);
  vChiSono();
}
function vChiSono(){
  if(GIO.giocatore) return vPaginaGiocatore();
  if(!CSI.pid) CSI.pid=uid();
  if(CSI.persona==null) return nuovoChiSono();
  const nomi=_CHD.p[CSI.lg];
  pinta(`
  <div class="gio-pagina">
  <button class="bt pi torna-gio" onclick="tornaGiochi()">← Giochi</button>
  <h1>🕵️ Chi sono io?</h1>
  ${htmlGiocatori('chisono')}
  <div class="scelte scelte-3">
    <div class="scelta" style="--ac:#5fd48f">
      <div class="scelta-tit">🌐 Lingua</div>
      <div class="scelta-op">
        <button class="op ${CSI.lg==='it'?'on':''}" onclick="CSI.lg='it';nuovaPartitaChiSono()">🇮🇹 Italiano · ${domandeChiSono('it').length.toLocaleString('it-IT')}</button>
        <button class="op ${CSI.lg==='ro'?'on':''}" onclick="CSI.lg='ro';nuovaPartitaChiSono()">🇷🇴 Română · ${domandeChiSono('ro').length.toLocaleString('it-IT')}</button>
      </div>
    </div>
    <div class="scelta" style="--ac:#ffb37a">
      <div class="scelta-tit">🔄 Ricomincia</div>
      <div class="scelta-op"><button class="op nuovo" onclick="nuovaPartitaChiSono()">Nuova partita</button></div>
    </div>
  </div>
  <p class="sotto">Punti totali: <b>${CSI.punti}</b></p>
  <div class="csi-campo ${CSI.risposto?'fine':''}">
    <div class="scheda dom-card csi-card">
      <div class="csi-lista">
        ${CSI.indizi.slice(0,CSI.mostrati).map((c,i)=>`<p class="csi-indizio">Indizio ${i+1}: «${esc(truncaTesto(c.q,160))}»${
          CSI.risposto&&rifGioco(c)?` <button class="gio-vers csi-rif" onclick="csiRif(${i})">📖 ${esc(rifGioco(c))}</button>`:''}</p>`).join('')}
      </div>
      ${!CSI.risposto?`
        ${CSI.mostrati<CSI.indizi.length?`<div class="csi-altro"><button class="bt pi" onclick="csiIndizio()">👁 Un altro indizio</button></div>`:''}
        <div class="dom-opz csi-opz">
          ${CSI.opzioni.map(k=>`<button class="bt" onclick="csiRispondi(${k})">${esc(nomi[k])}</button>`).join('')}
        </div>`
      :`<div class="dom-opz csi-opz">
          ${CSI.opzioni.map(k=>`<button class="bt ${k===CSI.persona?'giusta':(k===CSI.scelta?'sbagliata':'spenta')}" disabled>${esc(nomi[k])}</button>`).join('')}
        </div>
        <p class="vf-esito ${CSI.scelta===CSI.persona?'giusto':'falso'}">${CSI.scelta===CSI.persona?'Esatto! Era proprio '+esc(nomi[CSI.persona])+'.':'Non era giusto — era '+esc(nomi[CSI.persona])+'.'}</p>
        <button class="bt blu csi-avanti" onclick="nuovoChiSono()">Avanti →</button>`}
    </div>
    ${CSI.risposto?`<div class="csi-premio">${htmlPremio('chisono', CSI.punti/(CSI.tot*3)*100, {chiave:CSI.pid})}</div>`:''}
  </div>
  </div>`);
  adattaCard('c|'+CSI.persona+'|'+CSI.indizi[0].q+'|'+CSI.mostrati+'|'+(CSI.risposto?1:0));
}
