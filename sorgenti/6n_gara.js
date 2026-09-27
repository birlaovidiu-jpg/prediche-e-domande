/* ================= LA GARA: PIÙ GIOCATORI INSIEME, UNA DOMANDA A TESTA =================
   Con «🏁 Gara» nella riga dei giocatori si scelgono due o più giocatori che si sfidano nello
   stesso gioco, con la stessa lingua e lo stesso livello. Si gioca A TURNO, UNA DOMANDA ALLA VOLTA:
   il primo risponde a una domanda, poi tocca al secondo, poi al terzo… e si ricomincia dal primo.
   Ognuno ha la SUA partita (i suoi giri della ruota, la sua scalata, il suo tempio…): quando cambia
   il turno la partita di chi ha appena risposto si mette da parte e torna quella di chi gioca adesso,
   esattamente dove l'aveva lasciata. In Memoria e nel Cruciverba invece si gioca tutti sullo stesso
   campo (le stesse carte, la stessa griglia): un tentativo o una parola a testa.
   In cima al gioco la striscia della gara dice di chi è il turno e come va ognuno.
   Quanto dura: nella maggior parte dei giochi un numero di domande a testa (3, 5 o 10, si sceglie);
   nello Sprint (60 secondi a testa, l'orologio si ferma quando non è il tuo turno), nella Scalata
   (fino all'errore o al milione) e nel Mistero (fino al caso risolto) finché ognuno ha finito la
   sua partita; in Memoria e nel Cruciverba finché il campo è completo.
   Alla fine esce la classifica, con il podio, e si può fare la rivincita. Ogni gara resta salvata
   (stato.gare): da lì la classifica dei vincitori di ogni gioco.
   In X e O non serve: lì si gioca già in due, uno contro l'altro. */
const GARA={attiva:false, gioco:null, ordine:[], turno:0, punti:{}, liv:0};
/* come si gioca in gara ogni gioco:
   st: lo stato della partita (quello che si mette da parte e si rimette a ogni turno);
   nuova: come comincia la sua prima partita chi gioca per la prima volta (se non è NUOVA_PARTITA);
   avanti: quello che fa il pulsante «Avanti» del gioco dopo una risposta;
   condiviso: tutti sullo stesso campo; partita: la gara dura una partita a testa (non N domande);
   perPunti: la classifica guarda prima i punti e poi le risposte giuste */
const GARA_GIOCHI={
  verofalso:{st:()=>VF, avanti:()=>{ VF.i++; vfProssima(); }},
  impiccato:{st:()=>IMP, avanti:()=>nuovoImpiccato()},
  completa:{st:()=>CPL, avanti:()=>nuovaFrase()},
  chisono:{st:()=>CSI, avanti:()=>nuovoChiSono(), perPunti:true},
  ruota:{st:()=>RUO, avanti:()=>ruoAvanti(), perPunti:true},
  versetto:{st:()=>VRS, avanti:()=>vrsAvanti(), perPunti:true},
  viaggio:{st:()=>VIA, avanti:()=>viaProssima(), perPunti:true, nuova:()=>{ if(VIA.j) viaApri(VIA.j); else vViaggio(); }},
  codice:{st:()=>CDC, perPunti:true, nuova:()=>{ if(CDC.liv) cdcApri(CDC.liv); else { CDC.liv=null; vCodice(); } }},
  parola:{st:()=>PMI, avanti:()=>nuovaParola(), perPunti:true},
  tempio:{st:()=>TPL, avanti:()=>tplAvanti(), nuova:()=>{ TPL.prove=null; TPL.esitoFase=null; vTempio(); }},
  sprint:{st:()=>SPR, partita:true, nuova:()=>{ Object.assign(SPR,{attivo:false,timer:null,fine:null,corrente:null,esito:null,inPausa:false}); vSprint(); }},
  scalata:{st:()=>SCL, avanti:()=>sclAvanti(), partita:true},
  mistero:{st:()=>MIS, avanti:()=>misAvanti(), partita:true},
  memoria:{condiviso:true, partita:true},
  cruciverba:{condiviso:true, partita:true}
};
const GARA_N=[3,5,10];
function elencoGare(){ if(!Array.isArray(stato.gare)) stato.gare=[]; return stato.gare; }
function garaDi(id){ return GARA.attiva && GARA.gioco===id; }
function garaGiocatoreDiTurno(){ return GARA.attiva ? trovaGiocatore(GARA.ordine[GARA.turno]) : null; }
function _garaCfg(id){ return GARA_GIOCHI[id||GARA.gioco]||{}; }
function _garaStat(p){ return GARA.punti[p]=GARA.punti[p]||{giuste:0,tot:0,punti:0}; }
/* una copia vera della partita (liste e oggetti compresi), così quella messa da parte non cambia */
function _garaCopia(o){
  if(Array.isArray(o)) return o.map(_garaCopia);
  if(o && typeof o==='object' && Object.getPrototypeOf(o)===Object.prototype){ const r={}; for(const k in o) r[k]=_garaCopia(o[k]); return r; }
  return o;
}
function _garaMetti(st,copia){ Object.keys(st).forEach(k=>{ if(!(k in copia)) delete st[k]; }); Object.assign(st,copia); }
/* ha finito la sua parte? (N domande, oppure la sua partita) */
function _garaFinito(p){
  const cfg=_garaCfg();
  if(cfg.condiviso) return !!GARA.finitaCondivisa;
  if(cfg.partita) return !!GARA.finiti[p];
  return (_garaStat(p).tot)>=GARA.n;
}
/* il prossimo a cui tocca (dopo quello di adesso), saltando chi ha già finito; -1 = hanno finito tutti */
function _garaProssimo(){
  const n=GARA.ordine.length;
  for(let k=1;k<=n;k++){ const j=(GARA.turno+k)%n; if(!_garaFinito(GARA.ordine[j])) return j; }
  return -1;
}

/* ---------- una domanda è finita ----------
   Il gioco dice se la risposta era giusta e quanti punti ha dato. Il turno passa quando il
   giocatore va avanti (il pulsante «Avanti» del gioco, o «Tocca a …» nella striscia). Nei giochi
   dove dopo la risposta non c'è un «Avanti» (`dopo` passato, anche null) il turno passa da solo
   dopo un momento, con un avviso grande sopra al gioco. */
function garaFatto(id,giusta,punti,dopo){
  if(!garaDi(id) || GARA.daPassare) return;
  const p=GARA.ordine[GARA.turno], s=_garaStat(p);
  s.tot++; if(giusta) s.giuste++; s.punti+=Math.max(0,Math.round(+punti||0));
  GARA.daPassare=true; GARA.giusta=!!giusta;
  GARA.pronto = dopo!==undefined ? dopo : (_garaCfg(id).avanti||null);
  _garaStriscia(id);
  if(dopo!==undefined) _garaAuto(id, giusta?'✓':'✗');
}
/* punti senza domanda (il BONUS della ruota): vanno a chi sta giocando */
function garaPunti(id,punti){ if(garaDi(id)){ _garaStat(GARA.ordine[GARA.turno]).punti+=Math.round(+punti||0); _garaStriscia(id); } }
/* il turno passa da solo dopo un momento: intanto un avviso grande copre il gioco (e toccandolo si va subito) */
function _garaAuto(id,segno,ms){
  const t=GARA.tk=(GARA.tk||0)+1, k=_garaProssimo(), dopo=k>=0?trovaGiocatore(GARA.ordine[k]):null, g=garaGiocatoreDiTurno();
  const fine=g&&_garaFinito(g.i)&&_garaCfg(id).partita&&!_garaCfg(id).condiviso;
  _garaVelo(`${segno?`<div class="gv-segno ${segno==='✓'?'si':'no'}">${segno==='✓'?'✓ Giusto!':'✗ Sbagliato'}</div>`:''}
    ${fine?`<div class="gv-fine">🏁 ${esc(g.n)} ha finito: <b>${gnNum(_garaStat(g.i).finale||0)}</b> punti</div>`:''}
    ${dopo?`<div class="gv-ora">Ora tocca a</div><div class="gv-nome" style="--gc:${dopo.c}"><span class="gc-av">${inizialeGiocatore(dopo)}</span>${esc(dopo.n)}</div>`
          :`<div class="gv-ora">Hanno finito tutti: ecco la classifica!</div>`}
    <div class="gv-tocca">tocca per andare avanti</div>`);
  setTimeout(()=>{ if(GARA.tk===t && GARA.daPassare && garaDi(id) && GIO.vista===id) garaPassa(id,GARA.pronto); },
    GIOCHI_PAUSA.ms===0?0:(ms||1900));
}
function _garaVelo(html){
  let v=document.getElementById('garaVelo');
  if(!html){ if(v) v.remove(); return; }
  if(!v){ v=document.createElement('div'); v.id='garaVelo'; v.className='gara-velo';
    v.onclick=()=>{ if(GARA.daPassare && GARA.attiva) garaPassa(GARA.gioco,GARA.pronto); else _garaVelo(null); };
    document.body.appendChild(v); }
  v.innerHTML=`<div class="gv-box">${html}</div>`;
}
/* ---------- il turno passa al prossimo ----------
   Da chiamare dove il gioco andrebbe avanti con la domanda dopo: se in gara la domanda di adesso
   è già stata risposta, la partita di chi ha risposto si mette da parte (con `cont`, quello che
   farà quando tornerà il suo turno) e arriva quella del prossimo. Dà true se ha passato il turno
   (e allora il gioco non deve fare altro). */
function garaPassa(id,cont){
  if(!garaDi(id) || !GARA.daPassare) return false;
  GARA.daPassare=false; GARA.tk=(GARA.tk||0)+1; GARA.pronto=null;
  _garaVelo(null);
  const cfg=_garaCfg(id), chi=GARA.ordine[GARA.turno];
  if(id==='sprint' && SPR.timer){ clearInterval(SPR.timer); SPR.timer=null; }
  if(id==='sprint' && SPR.attivo) SPR.inPausa=true;
  if(!cfg.condiviso){ GARA.stati[chi]=_garaCopia(cfg.st()); GARA.cont[chi]=cont||null; }
  const k=_garaProssimo();
  if(k<0){ garaFine(); return true; }
  GARA.turno=k;
  const g=garaGiocatoreDiTurno();
  stato.imp.giocatoreAttuale=g.i; salva();
  if(cfg.condiviso){ if(cont) cont(); else vGiochi(); }
  else if(GARA.stati[g.i]){
    _garaMetti(cfg.st(),GARA.stati[g.i]); delete GARA.stati[g.i];
    const c=GARA.cont[g.i]; GARA.cont[g.i]=null;
    if(c) c(); else vGiochi();
  }
  else (cfg.nuova||NUOVA_PARTITA[id]||vGiochi)();
  avvisa(`Tocca a ${g.n}!`,'ok');
  return true;
}
/* il gioco ha salvato un risultato: nei giochi «a partita» vuol dire che la partita di chi sta
   giocando è finita (il suo punteggio è quello della gara); in Memoria che le carte sono finite */
function garaRegistra(gioco,giocatoreId,r){
  if(!garaDi(gioco) || !r) return;
  const cfg=_garaCfg(gioco); if(!cfg.partita) return;
  if(cfg.condiviso){ if(gioco==='memoria' && MEM.trovate.length===MEM.carte.length) GARA.finitaCondivisa=true; return; }
  if(GARA.ordine[GARA.turno]!==giocatoreId || GARA.finiti[giocatoreId]) return;
  const d=r.d||{};
  GARA.finiti[giocatoreId]=true;
  _garaStat(giocatoreId).finale=+(d.vincita!=null?d.vincita:d.punti)||0;
  if(!GARA.daPassare){ GARA.daPassare=true; GARA.pronto=null; }
  _garaStriscia(gioco);
  _garaAuto(gioco,null,2800);
}
function _garaStriscia(id){ const b=document.getElementById('garaStriscia'); if(b) b.outerHTML=htmlGara(id); }

/* ---------- scegliere chi gareggia ---------- */
function apriGara(id){
  if(id==='tris'){ avvisa('In X e O si gioca già in due, uno contro l\'altro','ok'); return; }
  if(_gioBlitzAttivo() && !garaDi(id)){ avvisa('Aspetta la fine del tempo','no'); return; }
  const el=elencoGiocatori(), cfg=_garaCfg(id);
  const scelti=new Set(GARA.ordine.length?GARA.ordine:(stato.imp.garaScelti||[]));
  const n=GARA_N.includes(stato.imp.garaDomande)?stato.imp.garaDomande:5;
  const durata = cfg.condiviso ? (id==='memoria'?'Tutti sulle stesse carte: un tentativo a testa, finché sono girate tutte. Vince chi trova più coppie.'
                                               :'Tutti sulla stessa griglia: una parola a testa, finché il cruciverba è completo. Vince chi scrive più parole giuste.')
    : id==='sprint' ? 'Ognuno ha i suoi 60 secondi: una domanda a testa, e l\'orologio di ognuno si ferma quando non è il suo turno. Vince chi fa più punti.'
    : id==='scalata' ? 'Ognuno sale la sua scala, una domanda a testa, fino all\'errore o al milione. Vince chi porta a casa di più.'
    : id==='mistero' ? 'Tutti lo stesso caso: ognuno fa la sua indagine e risponde a una prova a testa. Vince chi fa più punti.'
    : '';
  apri('🏁 Gara',`
    <p class="sotto" style="margin-top:0">Scegli chi gareggia (almeno due). Si gioca a turno, <b>una domanda a testa</b>:
      risponde il primo, poi il secondo, e così via. Stessa lingua e stesso livello per tutti.</p>
    ${el.length<2?`<div class="vuoto" style="padding:18px"><span class="em">👥</span>Servono almeno due giocatori: aggiungili con «＋ Nuovo giocatore».</div>`:''}
    <div class="gara-scelta">${el.map(g=>`
      <label class="gara-gioc" style="--gc:${g.c}"><input type="checkbox" value="${g.i}" ${scelti.has(g.i)?'checked':''}>
        <span class="gc-av">${inizialeGiocatore(g)}</span><b>${esc(g.n)}</b></label>`).join('')}</div>
    ${durata?`<p class="sotto gara-durata">${durata}</p>`:`
    <div class="gara-n"><span>Domande a testa</span>${GARA_N.map(k=>`<label class="gara-n-op"><input type="radio" name="garaN" value="${k}" ${k===n?'checked':''}><b>${k}</b></label>`).join('')}</div>`}
    <label class="gara-caso"><input type="checkbox" id="garaCaso" ${stato.imp.garaCaso?'checked':''}> L'ordine dei turni a sorte</label>
    ${htmlVincitoriGare(id)}`,
    `<button class="bt pi" onclick="chiudi()">Annulla</button>
     <button class="bt pr" onclick="iniziaGara('${id}')" ${el.length<2?'disabled':''}>🏁 Comincia la gara</button>`,520);
}
function iniziaGara(id,ordine,n){
  if(!ordine){
    ordine=[...document.querySelectorAll('.gara-scelta input:checked')].map(x=>x.value);
    const caso=!!($('#garaCaso')&&$('#garaCaso').checked);
    const r=document.querySelector('input[name="garaN"]:checked'); if(r) n=+r.value;
    stato.imp.garaCaso=caso; stato.imp.garaScelti=ordine.slice();
    if(caso) ordine.sort(()=>Math.random()-0.5);
  }
  n=GARA_N.includes(+n)?+n:(GARA_N.includes(stato.imp.garaDomande)?stato.imp.garaDomande:5);
  stato.imp.garaDomande=n;
  ordine=ordine.filter(p=>trovaGiocatore(p));
  if(ordine.length<2){ avvisa('Scegli almeno due giocatori','no'); return; }
  chiudi(); _garaVelo(null);
  if(typeof gnFermaTimer==='function') gnFermaTimer();
  Object.assign(GARA,{attiva:true, gioco:id, ordine, turno:0, n, punti:{}, stati:{}, cont:{}, finiti:{}, finitaCondivisa:false,
    daPassare:false, pronto:null, parole:{}, liv:livelloGioco(id), q:Date.now(), tk:(GARA.tk||0)+1});
  if(id==='mistero') MIS.garaCaso=null;
  stato.imp.giocatoreAttuale=ordine[0]; salva();
  avvisa(`🏁 Gara! Comincia ${trovaGiocatore(ordine[0]).n}`,'ok');
  (NUOVA_PARTITA[id]||vGiochi)();
}
/* «Tocca a …» nella striscia: come l'«Avanti» del gioco */
function garaProssimo(){
  if(!GARA.attiva) return;
  if(GARA.daPassare){ garaPassa(GARA.gioco,GARA.pronto); return; }
  avvisa('Prima rispondi alla domanda: poi tocca al prossimo','no');
}
/* la classifica: nei giochi a partita il punteggio della partita; dove contano i punti prima i
   punti; altrimenti prima le risposte giuste (a parità, i punti) */
function garaClassifica(){
  const cfg=_garaCfg();
  return GARA.ordine.map(p=>{
    const s=_garaStat(p), g=trovaGiocatore(p);
    const fin=cfg.partita&&!cfg.condiviso;
    const val = fin ? (s.finale||0) : cfg.perPunti ? s.punti : s.giuste;
    const desc = `${s.giuste} giust${s.giuste===1?'a':'e'} su ${s.tot}`+(fin?` · ${gnNum(s.finale||0)} punti`:s.punti&&cfg.perPunti?` · ${gnNum(s.punti)} punti`:'');
    return {p, g, giuste:s.giuste, tot:s.tot, punti:s.punti, val, perc:s.tot?Math.round(s.giuste/s.tot*100):0, desc,
      mostra: fin||cfg.perPunti ? gnNum(val) : `${s.giuste}/${s.tot}`};
  }).filter(x=>x.g).sort((a,b)=>b.val-a.val || b.giuste-a.giuste || b.punti-a.punti);
}
function garaFine(){
  const cl=garaClassifica();
  /* il posto: a pari punteggio si è pari */
  let pos=0; cl.forEach((x,k)=>{ if(k===0 || x.val!==cl[k-1].val || x.giuste!==cl[k-1].giuste || x.punti!==cl[k-1].punti) pos=k+1; x.pos=pos; });
  const gara={i:uid(), g:GARA.gioco, q:GARA.q||Date.now(), liv:GARA.liv, lg:_lgGioco(GARA.gioco), n:GARA.n,
    righe:cl.map(x=>({p:x.p, perc:x.perc, extra:x.val, pos:x.pos, desc:x.desc}))};
  elencoGare().push(gara); salva();
  const id=GARA.gioco, ordine=GARA.ordine.slice(), n=GARA.n;
  if(id==='sprint' && SPR.timer){ clearInterval(SPR.timer); SPR.timer=null; }
  Object.assign(GARA,{attiva:false, gioco:null, turno:0, punti:{}, stati:{}, cont:{}, daPassare:false, pronto:null, tk:(GARA.tk||0)+1});
  GARA.ordine=[];
  GARA._ultima={id, ordine};
  _garaVelo(null);
  const med=['🥇','🥈','🥉'];
  apri('🏆 Classifica della gara',`
    <div class="gara-podio">${cl.slice(0,3).map((x,k)=>`<div class="gp-p p${x.pos}" style="--gc:${x.g.c};order:${[2,1,3][k]}">
        <span class="gp-p-med">${med[x.pos-1]||x.pos+'°'}</span><span class="gc-av">${inizialeGiocatore(x.g)}</span>
        <b>${esc(x.g.n)}</b><i>${esc(x.mostra)}</i></div>`).join('')}</div>
    <div class="gara-elenco">${cl.map(x=>`<div class="classifica-riga"><b>${med[x.pos-1]||x.pos+'.'}</b> ${esc(x.g.n)}
        <small style="color:var(--tx3);margin-left:8px">${esc(x.desc||'')}</small><span>${esc(x.mostra)}</span></div>`).join('')}</div>
    <p class="sotto" style="margin:12px 0 0">${cl.filter(x=>x.pos===1).length>1?'Pareggio in testa!':`Vince ${esc(cl[0].g.n)}!`} La gara è salvata nella classifica dei vincitori di questo gioco.</p>`,
    `<button class="bt pi" onclick="chiudi()">Chiudi</button>
     <button class="bt pr" onclick="chiudi();iniziaGara('${id}',${esc(JSON.stringify(ordine))},${n})">🔁 Rivincita</button>`,520);
  if(typeof vGiochi==='function' && GIO.vista===id) aggiornaBarraGiocatori();
}
function fermaGara(){
  if(!GARA.attiva) return;
  conferma('Vuoi fermare la gara? Non verrà salvata.',()=>{
    if(GARA.gioco==='sprint' && SPR.timer){ clearInterval(SPR.timer); SPR.timer=null; }
    Object.assign(GARA,{attiva:false, gioco:null, ordine:[], turno:0, punti:{}, stati:{}, cont:{}, daPassare:false, pronto:null, tk:(GARA.tk||0)+1});
    _garaVelo(null);
    aggiornaBarraGiocatori(); avvisa('Gara fermata','ok');
  },'Ferma');
}

/* ---------- la striscia della gara, in cima al gioco ---------- */
function htmlGara(id){
  if(!garaDi(id)) return '';
  const g=garaGiocatoreDiTurno(); if(!g) return '';
  const cfg=_garaCfg(id), s=_garaStat(g.i);
  const k=_garaProssimo(), dopo=k>=0?trovaGiocatore(GARA.ordine[k]):null;
  const quanto = cfg.condiviso ? (id==='memoria'?'un tentativo a testa':'una parola a testa')
    : cfg.partita ? 'una domanda a testa' : `domanda ${Math.min(s.tot+(GARA.daPassare?0:1),GARA.n)} di ${GARA.n} a testa`;
  const pezzi=GARA.ordine.map((p,j)=>{ const x=trovaGiocatore(p); if(!x) return '';
    const t=_garaStat(p), fin=cfg.partita&&!cfg.condiviso&&GARA.finiti[p];
    const v = fin ? gnNum(t.finale||0) : cfg.perPunti ? gnNum(t.punti) : `${t.giuste}/${t.tot}`;
    return `<span class="gs-g ${j===GARA.turno?'ora':''} ${t.tot||fin?'fatto':''}" style="--gc:${x.c}"><span class="gc-av">${inizialeGiocatore(x)}</span>${esc(x.n)} <b>${v}</b>${fin?' 🏁':j===GARA.turno?' 🎮':''}</span>`; }).join('');
  return `<div class="gara-striscia ${GARA.daPassare?'da-passare':''}" id="garaStriscia">
    <span class="gs-tit">🏁 Gara · ${quanto}</span>
    <span class="gs-chi" style="--gc:${g.c}">Tocca a <b>${esc(g.n)}</b></span>
    <span class="gs-elenco">${pezzi}</span>
    ${GARA.daPassare?`<button class="bt pr mini gs-avanti" onclick="garaProssimo()">${dopo?'▶ Tocca a '+esc(dopo.n):'🏆 Classifica'}</button>`:''}
    <button class="bt pi mini" onclick="fermaGara()" title="Ferma la gara">✕</button>
  </div>`;
}

/* ---------- la classifica dei vincitori delle gare di un gioco ---------- */
function vincitoriGare(id){
  const m={};
  elencoGare().filter(x=>x.g===id).forEach(x=>x.righe.forEach(r=>{
    const s=m[r.p]=m[r.p]||{p:r.p, vinte:0, podi:0, gare:0};
    s.gare++; if(r.pos===1) s.vinte++; if(r.pos<=3) s.podi++;
  }));
  return Object.values(m).map(s=>Object.assign(s,{g:trovaGiocatore(s.p)})).filter(s=>s.g)
    .sort((a,b)=>b.vinte-a.vinte || b.podi-a.podi || a.g.n.localeCompare(b.g.n,'it'));
}
function htmlVincitoriGare(id){
  const el=vincitoriGare(id).slice(0,6); if(!el.length) return '';
  const n=elencoGare().filter(x=>x.g===id).length;
  return `<div class="classifica-box gara-vinc">
    <div class="classifica-tit">🏁 Vincitori delle gare · ${n} gar${n===1?'a':'e'}</div>
    ${el.map((s,k)=>`<div class="classifica-riga"><b>${['🥇','🥈','🥉'][k]||(k+1)+'.'}</b> ${esc(s.g.n)}
      <span>${s.vinte} vint${s.vinte===1?'a':'e'} · ${s.podi} sul podio</span></div>`).join('')}
  </div>`;
}
