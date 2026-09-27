/* ================= GIOCHI BIBLICI DAL 9 AL 16 =================
   Stessa grafica, stessi giocatori, stessi livelli, stessi premi e classifiche degli otto
   giochi di prima: riusano htmlGiocatori(), htmlPremio(), salvaRisultatoAttuale() e la
   memoria «mai due volte la stessa» (pescaNuovePesate). I contenuti NON stanno qui dentro:
   vengono da GIOCHI_NUOVI (dati/giochi_nuovi.json, preparato da strumenti/giochi/genera.py
   dai file scritti a mano, in italiano e in rumeno) e, dove serve, dalle 10.000 domande,
   dalle frasi di «Chi ha detto?» e dal testo delle Bibbie già dentro al programma.
   I progressi che restano fra una partita e l'altra (tappe dei viaggi, fasi del Tempio,
   codici aperti, trofei) stanno in stato.progressiGiochi, uno per giocatore. */

/* ---------- aiuti in comune ---------- */
function gnT(o,lg){ return o ? (typeof o==='string' ? o : (o[lg]||o.it||'')) : ''; }
function gnRif(r,lg){ return r ? `${nomeLibro(r[0],lg)} ${r[1]}:${r[2]}${r[3]?'-'+r[3]:''}` : ''; }
/* il riferimento che si tocca per leggere il versetto (lo stesso di tutti gli altri giochi) */
function gnRifBt(r,lg,cls){
  if(!r) return '';
  const t=gnRif(r,lg);
  return `<button class="gio-vers${cls?' '+cls:''}" data-rif="${esc(t)}" data-lg="${lg}" onclick="gnApriRif(this)">📖 ${esc(t)}</button>`;
}
/* da «Genesi 1:1» (come nelle 10.000 domande) a [libro, capitolo, versetto] */
function gnRifDaTesto(t){ const r=leggiRiferimento(t); return r&&r.cap ? [r.L,r.cap,(r.vv||[1])[0]] : null; }
function gnApriRif(el){ mostraRiferimentoGioco(el.dataset.rif,el.dataset.lg); }
function gnNum(n){ return String(Math.round(n||0)).replace(/\B(?=(\d{3})+(?!\d))/g,'.'); }   /* 2.450, anche con quattro cifre */
/* la scelta della lingua, uguale a quella degli altri giochi */
function gnLingua(stato_,dopo,spento){
  return `<div class="scelta" style="--ac:#5fd48f">
    <div class="scelta-tit">🌐 Lingua</div>
    <div class="scelta-op">
      <button class="op ${stato_.lg==='it'?'on':''}" ${spento?'disabled':''} onclick="${dopo}('it')">🇮🇹 Italiano</button>
      <button class="op ${stato_.lg==='ro'?'on':''}" ${spento?'disabled':''} onclick="${dopo}('ro')">🇷🇴 Română</button>
    </div>
  </div>`;
}
function gnRicomincia(az,et){
  return `<div class="scelta" style="--ac:#ffb37a">
    <div class="scelta-tit">🔄 Ricomincia</div>
    <div class="scelta-op"><button class="op nuovo" onclick="${az}">${et||'Nuova partita'}</button></div>
  </div>`;
}
function gnTesta(id,ic,tit){
  return `<button class="bt pi torna-gio" onclick="tornaGiochi()">← Giochi</button>
  <h1>${ic} ${esc(tit)}</h1>
  ${htmlGiocatori(id)}`;
}
/* il nome di chi sta giocando, come negli altri giochi (senza giocatore la partita non si salva) */
function gnChiGioca(){ const g=giocatoreAttuale(); return g ? g.n : 'Senza nome'; }
function gnKpi(v,e,c){ return `<div class="kpi" style="--qc:${c||'#5bb8f0'}"><div class="n">${v}</div><div class="e">${e}</div></div>`; }

/* ---------- le domande a quattro risposte (Ruota, Sprint, Scalata, Tempio) ---------- */
const GN_CAT={
  personaggi:{ic:'👤',it:'Personaggi',ro:'Personaje'}, re:{ic:'👑',it:'Re',ro:'Împărați'},
  profeti:{ic:'🔥',it:'Profeti',ro:'Proroci'}, miracoli:{ic:'✨',it:'Miracoli',ro:'Minuni'},
  luoghi:{ic:'🌍',it:'Luoghi',ro:'Locuri'}, at:{ic:'📖',it:'Antico Testamento',ro:'Vechiul Testament'},
  nt:{ic:'✝️',it:'Nuovo Testamento',ro:'Noul Testament'}, profezie:{ic:'📜',it:'Profezie',ro:'Prorocii'}
};
function gnDomande(){ return (typeof GIOCHI_NUOVI!=='undefined' && GIOCHI_NUOVI.domande)||[]; }
/* una domanda nella lingua scelta, con le risposte mescolate */
function gnQuattro(q,lg){
  const r=q.answers[lg]||q.answers.it, ord=mescola([0,1,2,3]);
  return {q, id:q.id, testo:gnT(q.question,lg), opz:ord.map(k=>r[k]), g:ord.indexOf(q.correctAnswer||0),
          spieg:gnT(q.explanation,lg), rif:q.biblicalReference, cat:q.category, dif:q.difficulty, lg};
}
function gnPesoDif(dif,centro){ return Math.pow(0.3,Math.abs(dif-centro)); }
/* `n` domande diverse, mai uscite prima in questo gioco (memoria per gioco e per lingua) */
function gnPescaDomande(gioco,lg,n,filtro,peso){
  const lista=gnDomande().filter(q=>!filtro||filtro(q));
  if(!lista.length) return [];
  const tipo='gn'+gioco+lg, chiave=q=>q.id;
  const presi=pescaNuovePesate(lista,n,tipo,chiave,peso||(()=>1)).lista;
  segnaVisteGioco(tipo,presi.map(chiave));
  return presi.map(q=>gnQuattro(q,lg));
}

/* ---------- punti, record e progressi di ogni giocatore ---------- */
/* il record in punti: il migliore del giocatore in questo gioco (senza giocatore, quello di tutti) */
function gnRecordPunti(gioco,campo){
  campo=campo||'punti';
  const g=giocatoreAttuale();
  if(g) return partiteDi(gioco,g.i).reduce((m,r)=>Math.max(m,+((r.d||{})[campo])||0),0);
  return ((stato.imp.recordPuntiGiochi||{})[gioco+'|'+campo])||0;
}
/* salva la partita (come tutti gli altri giochi) e dice se è un nuovo record in punti */
function gnFinePartita(gioco,pid,perc,det,campo){
  campo=campo||'punti';
  const prima=gnRecordPunti(gioco,campo), valore=+(det||{})[campo]||0;
  salvaRisultatoAttuale(gioco,pid,perc,det);
  if(!giocatoreAttuale() && valore>prima){
    stato.imp.recordPuntiGiochi=stato.imp.recordPuntiGiochi||{};
    stato.imp.recordPuntiGiochi[gioco+'|'+campo]=valore; salva();
  }
  return {prima, nuovo:valore>prima, record:Math.max(prima,valore)};
}
function gnProgressi(gioco){
  stato.progressiGiochi=stato.progressiGiochi||{};
  const g=giocatoreAttuale(), k=g?g.i:'_';
  const p=stato.progressiGiochi[k]=stato.progressiGiochi[k]||{};
  return p[gioco]=p[gioco]||{};
}
function gnTrofei(){
  stato.progressiGiochi=stato.progressiGiochi||{};
  const g=giocatoreAttuale(), k=g?g.i:'_';
  const p=stato.progressiGiochi[k]=stato.progressiGiochi[k]||{};
  return p.trofei=p.trofei||[];
}
function gnDaiTrofeo(id,et,ic){
  const t=gnTrofei();
  if(!t.some(x=>x.id===id)){ t.push({id,et,ic,q:Date.now()}); salva(); return true; }
  return false;
}
/* i progressi e i trofei di un giocatore, per la sua pagina */
function gnProgressiDi(pid){ return ((stato.progressiGiochi||{})[pid])||{}; }
/* la riga del record in punti, sotto al premio */
function gnRigaRecord(r,et){
  return `<p class="gn-record">${r.nuovo?`🎉 Nuovo record personale: <b>${gnNum(r.record)}</b> ${et||'punti'}`:`Record personale: <b>${gnNum(r.record)}</b> ${et||'punti'}`}</p>`;
}
/* nella pagina del giocatore: il suo record, i progressi e i trofei (solo nei giochi dal 9 al 16) */
function gnHtmlProgressi(id,pid){
  if(!['ruota','versetto','viaggio','codice','parola','tempio','sprint','scalata','mistero'].includes(id)) return '';
  const pr=gnProgressiDi(pid), righe=[];
  const record=(campo,et)=>{ const m=partiteDi(id,pid).reduce((a,r)=>Math.max(a,+((r.d||{})[campo])||0),0); if(m) righe.push(`🏅 Record: <b>${gnNum(m)}</b> ${et}`); };
  if(id==='ruota'||id==='sprint'||id==='parola') record('punti','punti');
  if(id==='versetto'){ record('punti','punti'); record('versetti','versetti'); }
  if(id==='scalata') record('vincita','punti vinti');
  if(id==='mistero' && typeof misHtmlProgressi==='function') righe.push(...misHtmlProgressi(pid));
  if(id==='viaggio'){ const p=pr.viaggio||{}; viaViaggi().forEach(v=>{ const st=p[v.id]; if(st) righe.push(`${v.ic} ${esc(gnT(v.titolo,'it'))}: <b>${Math.min(st.tappa+1,v.tappe.length)}/${v.tappe.length}</b> tappe${st.fatto?' ✓':''}`); }); }
  if(id==='codice'){ const f=(pr.codice||{}).fatti||{}; righe.push(`🔓 Scrigni aperti: <b>${Object.keys(f).length}</b> su ${cdcTutti().length}`); }
  if(id==='tempio'){ const t=pr.tempio||{}; righe.push(`🏛️ Tempio: <b>${Math.min(t.fase||0,8)}/8</b> fasi${(t.fase||0)>=8?' ✓':''}${t.maestroSbloccato?` · 🏆 Maestro: <b>${Math.min(t.faseM||0,8)}/8</b>`:''}`); }
  const trofei=(pr.trofei||[]);
  if(trofei.length) righe.push(`Trofei: ${trofei.map(t=>`<span class="gn-trofeo" title="${esc(t.et)}">${t.ic} ${esc(t.et)}</span>`).join(' ')}`);
  if(!righe.length) return '';
  return `<div class="scheda gn-progressi"><h2>📌 Progressi e trofei</h2>${righe.map(r=>`<p>${r}</p>`).join('')}</div>`;
}
/* il bottone che ferma i timer dei giochi nuovi quando esci (come per il Blitz) */
function gnFermaTimer(){
  if(typeof VRS!=='undefined' && VRS.timer){ clearInterval(VRS.timer); VRS.timer=null; VRS.sfidaAttiva=false; }
  if(typeof SPR!=='undefined' && SPR.timer){ clearInterval(SPR.timer); SPR.timer=null; SPR.attivo=false; }
}
function gnTimerAttivo(){ return (typeof SPR!=='undefined' && SPR.attivo) || (typeof VRS!=='undefined' && VRS.sfidaAttiva); }

/* ---------- mettere in ordine toccando (Viaggio, Codice, Tempio) ----------
   si toccano gli elementi uno dopo l'altro nell'ordine giusto; ognuno prende il suo numero */
function gnOrdinaHtml(o,az){
  return `<div class="gn-ordina">${o.mescolati.map(k=>{
      const pos=o.scelti.indexOf(k);
      return `<button class="bt gn-ord ${pos>=0?'on':''}" ${o.bloccato?'disabled':''} onclick="${az}(${k})">${pos>=0?`<b>${pos+1}</b>`:'<b>·</b>'}${esc(o.voci[k])}</button>`;
    }).join('')}</div>
    ${o.scelti.length&&!o.bloccato?`<div class="gn-centro"><button class="bt pi mini" onclick="${az}(-1)">↺ Ricomincia l'ordine</button></div>`:''}`;
}
function gnOrdinaNuovo(voci){ return {voci, mescolati:mescola(voci.map((_,i)=>i)), scelti:[], bloccato:false}; }
/* true/false quando sono stati toccati tutti; null finché manca qualcuno */
function gnOrdinaTocca(o,k){
  if(o.bloccato) return null;
  if(k<0){ o.scelti=[]; return null; }
  const i=o.scelti.indexOf(k);
  if(i>=0) o.scelti.splice(i,1); else o.scelti.push(k);
  if(o.scelti.length<o.voci.length) return null;
  o.bloccato=true;
  return o.scelti.every((x,i)=>x===i);
}
/* le quattro risposte di una domanda a scelta (A B C D), uguali in tutti i giochi nuovi */
function gnOpzHtml(opz,az,esito,g,lettere){
  const L=['A','B','C','D'];
  return `<div class="dom-opz gn-opz">${opz.map((t,i)=>{
    const cl = esito ? (i===g?'giusta':(i===esito.sc?'sbagliata':'spenta')) : '';
    return `<button class="bt ${cl}" ${esito?'disabled':''} onclick="${az}(${i})">${lettere?`<span class="gn-lett">${L[i]}</span>`:''}${esc(t)}</button>`;
  }).join('')}</div>`;
}
/* dopo una risposta: giusta o sbagliata, il riferimento e la breve spiegazione */
function gnEsitoHtml(giusta,d,extra){
  return `<div class="gn-esito ${giusta?'si':'no'}">
    <b>${giusta?'✓ RISPOSTA CORRETTA':'✗ RISPOSTA SBAGLIATA'}</b>${extra?`<span class="gn-punti">${extra}</span>`:''}
    ${!giusta?`<span class="gn-giusta">La risposta giusta era: <b>${esc(d.opz[d.g])}</b></span>`:''}
    ${d.spieg?`<span class="gn-spieg">${esc(d.spieg)}</span>`:''}
    ${gnRifBt(d.rif,d.lg)}
  </div>`;
}

/* ======================= 9. 🎡 LA RUOTA BIBLICA ======================= */
/* 12 spicchi: le 8 categorie e, in mezzo, 4 caselle speciali */
const RUO_SPICCHI=[
  {c:'personaggi'},{s:'x2',ic:'⭐',et:'PUNTI ×2',corto:'×2'},{c:'re'},{c:'profeti'},{s:'bonus',ic:'🎁',et:'BONUS',corto:'BONUS'},{c:'miracoli'},
  {c:'luoghi'},{s:'ancora',ic:'🔄',et:'GIRA ANCORA',corto:'ANCORA'},{c:'at'},{c:'nt'},{s:'speciale',ic:'🔥',et:'DOMANDA SPECIALE',corto:'SPECIALE'},{c:'profezie'}
];
/* le scritte dentro agli spicchi: corte, perché ci stiano */
const RUO_CORTI={personaggi:{it:'Personaggi',ro:'Personaje'},re:{it:'Re',ro:'Împărați'},profeti:{it:'Profeti',ro:'Proroci'},
  miracoli:{it:'Miracoli',ro:'Minuni'},luoghi:{it:'Luoghi',ro:'Locuri'},at:{it:'A. Testam.',ro:'V. Testam.'},
  nt:{it:'N. Testam.',ro:'N. Testam.'},profezie:{it:'Profezie',ro:'Prorocii'}};
const RUO_COLORI=['#5bb8f0','#f5c542','#ffd166','#ff8a5c','#4fd1a5','#c9a6ff','#5cffb8','#8b7bff','#ffb37a','#7fb0ff','#ff6b81','#b18cff'];
const RUO_GIRI=10, RUO_BONUS=500;
const RUO={ lg:'it', giro:0, punti:0, giuste:0, sbagliate:0, perCat:{}, pid:null, fase:'gira', rot:0, spicchio:null,
            dom:null, molt:1, esito:null, messaggio:'', fine:null };
function ruoPuntiBase(dif){ return [0,100,200,300,500][dif]||100; }
function nuovaRuota(){
  Object.assign(RUO,{giro:0,punti:0,giuste:0,sbagliate:0,perCat:{},pid:uid(),fase:'gira',spicchio:null,dom:null,molt:1,esito:null,messaggio:'',fine:null});
  vRuota();
}
function ruoLingua(lg){ RUO.lg=lg; nuovaRuota(); }
function ruoGira(){
  if(RUO.fase!=='gira') return;
  /* le caselle speciali escono meno spesso delle categorie */
  const pesi=RUO_SPICCHI.map(s=>s.s?0.45:1), tot=pesi.reduce((a,b)=>a+b,0);
  let r=Math.random()*tot, i=0; for(;i<pesi.length-1;i++){ r-=pesi[i]; if(r<=0) break; }
  const centro=i*30+15, gioco=(Math.random()-0.5)*18;
  const base=Math.ceil((RUO.rot+360*5)/360)*360;
  RUO.rot=base+(360-centro-gioco);
  RUO.spicchio=i; RUO.fase='gira-anim'; RUO.messaggio='';
  const w=$('#ruoRuota');
  if(w){ w.style.transform=`rotate(${RUO.rot}deg)`; }
  const bt=$('#ruoBt'); if(bt) bt.disabled=true;
  setTimeout(ruoFermata, GIOCHI_PAUSA.ms===0?0:4300);
}
function ruoFermata(){
  if(RUO.fase!=='gira-anim') return;
  const s=RUO_SPICCHI[RUO.spicchio], liv=livelloGioco('ruota');
  RUO.molt=1;
  if(s.s==='ancora'){ RUO.fase='gira'; RUO.messaggio='🔄 GIRA ANCORA! Il giro non conta: gira di nuovo.'; return vRuota(); }
  if(s.s==='bonus'){
    RUO.giro++; RUO.punti+=RUO_BONUS; RUO.messaggio=`🎁 BONUS! +${RUO_BONUS} punti.`;
    garaPunti('ruota',RUO_BONUS);                        /* in gara: i punti del bonus a chi ha girato, e gira ancora */
    RUO.fase = RUO.giro>=RUO_GIRI ? 'fine' : 'gira';
    if(RUO.fase==='fine') ruoConcludi();
    return vRuota();
  }
  let filtro, centro=liv;
  if(s.c) filtro=q=>q.category===s.c;
  if(s.s==='x2'){ RUO.molt=2; }
  if(s.s==='speciale'){ RUO.molt=3; filtro=q=>q.difficulty>=3; centro=3.5; }
  const d=gnPescaDomande('ruota',RUO.lg,1,filtro,q=>gnPesoDif(q.difficulty,centro))[0];
  RUO.dom=d; RUO.esito=null; RUO.fase='domanda';
  RUO.messaggio = s.s==='x2' ? '⭐ PUNTI ×2 su questa domanda!' : s.s==='speciale' ? '🔥 DOMANDA SPECIALE: vale il triplo!' : '';
  vRuota();
}
function ruoRispondi(i){
  const d=RUO.dom; if(!d||RUO.esito) return;
  const giusta=i===d.g, pt=giusta?ruoPuntiBase(d.dif)*RUO.molt:0;
  RUO.esito={sc:i,giusta,pt}; RUO.giro++;
  if(giusta){ RUO.giuste++; RUO.punti+=pt; } else RUO.sbagliate++;
  const pc=RUO.perCat[d.cat]=RUO.perCat[d.cat]||{g:0,t:0}; pc.t++; if(giusta) pc.g++;
  garaFatto('ruota',giusta,pt);
  vRuota();
}
function ruoAvanti(){
  if(garaPassa('ruota',ruoAvanti)) return;             /* in gara: il giro dopo è del prossimo giocatore */
  if(RUO.giro>=RUO_GIRI){ ruoConcludi(); }
  else { RUO.fase='gira'; RUO.dom=null; RUO.esito=null; RUO.messaggio=''; }
  vRuota();
}
function ruoMiglioreCategoria(){
  const k=Object.keys(RUO.perCat).sort((a,b)=>(RUO.perCat[b].g-RUO.perCat[a].g)||(RUO.perCat[a].t-RUO.perCat[b].t))[0];
  return k && RUO.perCat[k].g ? k : null;
}
function ruoConcludi(){
  RUO.fase='fine';
  const tot=RUO.giuste+RUO.sbagliate, perc=tot?RUO.giuste/tot*100:0, cat=ruoMiglioreCategoria();
  RUO.fine=gnFinePartita('ruota',RUO.pid,perc,{punti:RUO.punti,giuste:RUO.giuste,sbagliate:RUO.sbagliate,cat});
  RUO.fine.perc=perc; RUO.fine.cat=cat;
}
function ruotaSvg(){
  const R=160, lg=RUO.lg;
  const pt=(a,r)=>[(Math.sin(a*Math.PI/180)*r).toFixed(1),(-Math.cos(a*Math.PI/180)*r).toFixed(1)];
  return RUO_SPICCHI.map((s,i)=>{
    const a0=i*30, a1=a0+30, [x0,y0]=pt(a0,R), [x1,y1]=pt(a1,R), [tx,ty]=pt(a0+15,R*0.56), [ix,iy]=pt(a0+15,R*0.87);
    const c=s.c?GN_CAT[s.c]:null, ic=c?c.ic:s.ic;
    const corto=s.c?(RUO_CORTI[s.c][lg]||RUO_CORTI[s.c].it):s.corto;
    return `<g><path d="M0 0 L${x0} ${y0} A${R} ${R} 0 0 1 ${x1} ${y1} Z" fill="${RUO_COLORI[i]}" class="ruo-sp${s.s?' sp':''}" stroke="#0f1117" stroke-width="2"/>
      <text x="${ix}" y="${iy}" class="ruo-ic" text-anchor="middle" dominant-baseline="central" transform="rotate(${a0+15} ${ix} ${iy})">${ic}</text>
      <text x="${tx}" y="${ty}" class="ruo-et" text-anchor="middle" dominant-baseline="central" transform="rotate(${a0+15-90+(a0+15>180?180:0)} ${tx} ${ty})">${esc(corto)}</text></g>`;
  }).join('');
}
function vRuota(){
  if(GIO.giocatore) return vPaginaGiocatore();
  if(!RUO.pid) RUO.pid=uid();
  const d=RUO.dom, s=RUO.spicchio!=null?RUO_SPICCHI[RUO.spicchio]:null, lg=RUO.lg;
  const catEt=k=>{ const c=GN_CAT[k]; return c?`${c.ic} ${c[lg]||c.it}`:''; };
  pinta(`
  <div class="gio-pagina gn-pagina">
  ${gnTesta('ruota','🎡','La Ruota Biblica')}
  <div class="scelte scelte-3">
    ${gnLingua(RUO,'ruoLingua',RUO.fase==='gira-anim')}
    ${gnRicomincia('nuovaRuota()')}
  </div>
  <div class="gn-kpi">
    ${gnKpi(esc(gnChiGioca()),'Giocatore','#8b7bff')}
    ${gnKpi(`${Math.min(RUO.giro+(RUO.fase==='domanda'&&!RUO.esito?1:0),RUO_GIRI)}/${RUO_GIRI}`,'Giro','#ffd166')}
    ${gnKpi(gnNum(RUO.punti),'Punti','#4fd1a5')}
  </div>
  ${RUO.fase==='fine'&&RUO.fine?`
  <div class="scheda gn-fine">
    <h2>🎡 Partita finita!</h2>
    <div class="gn-kpi">
      ${gnKpi(esc(gnChiGioca()),'Giocatore','#8b7bff')}${gnKpi(gnNum(RUO.punti),'Punteggio','#4fd1a5')}
      ${gnKpi(RUO.giuste,'Corrette','#5fd48f')}${gnKpi(RUO.sbagliate,'Sbagliate','#ff6b81')}
    </div>
    <p class="sotto">Migliore categoria: <b>${RUO.fine.cat?catEt(RUO.fine.cat):'—'}</b></p>
    ${gnRigaRecord(RUO.fine)}
    ${htmlPremio('ruota',RUO.fine.perc,{chiave:RUO.pid})}
    <button class="bt blu" onclick="nuovaRuota()">🔄 Gioca ancora</button>
  </div>`:`
  <div class="ruo-campo ${d?'con-domanda':''}">
    <div class="ruo-ruota-box">
      <div class="ruo-freccia">▼</div>
      <div class="ruo-disco">
        <svg viewBox="-170 -170 340 340" class="ruo-svg"><g id="ruoRuota" style="transform:rotate(${RUO.rot}deg)">${ruotaSvg()}</g>
          <circle r="46" fill="#0f1117" stroke="#e0b25c" stroke-width="4"/></svg>
        <button class="ruo-gira" id="ruoBt" ${RUO.fase!=='gira'?'disabled':''} onclick="ruoGira()">GIRA<br>LA RUOTA</button>
      </div>
      ${RUO.messaggio&&!d?`<p class="ruo-msg">${esc(RUO.messaggio)}</p>`:''}
    </div>
    ${d?`
    <div class="scheda dom-card ruo-dom">
      <p class="dom-sopra">${s&&s.c?catEt(s.c):catEt(d.cat)}${RUO.messaggio?` · ${esc(RUO.messaggio)}`:''}</p>
      <p class="dom-testo">${esc(d.testo)}</p>
      ${gnOpzHtml(d.opz,'ruoRispondi',RUO.esito,d.g,true)}
      ${RUO.esito?`${gnEsitoHtml(RUO.esito.giusta,d,RUO.esito.giusta?`+${gnNum(RUO.esito.pt)} punti`:'0 punti')}
        <button class="bt blu gn-avanti" onclick="ruoAvanti()">${RUO.giro>=RUO_GIRI?'Vedi il risultato →':'Avanti →'}</button>`:''}
    </div>`:`<div class="scheda ruo-attesa"><p class="sotto">${RUO.fase==='gira-anim'?'La ruota gira…':'Premi <b>GIRA LA RUOTA</b>: la categoria dove si ferma decide la domanda.'}</p>
      <div class="ruo-legenda">${RUO_SPICCHI.filter(x=>x.s).map(x=>`<span>${x.ic} ${esc(x.et)}</span>`).join('')}</div></div>`}
  </div>`}
  </div>`);
  adattaRuota();
}
/* Sull'iPad (schermata fissa) la ruota si misurava con le altezze in percentuale del CSS, che
   Safari non calcola sempre come gli altri browser, e in fondo non teneva conto della striscia
   della Home: la ruota veniva più grande dello spazio e restava tagliata. Ora la misuro io, in
   pixel, sullo spazio che c'è davvero, con un po' di margine per la freccia e per l'ombra. */
function adattaRuota(){
  const d=$('.ruo-disco'), box=$('.ruo-ruota-box'), campo=$('.ruo-campo'); if(!d||!campo) return;
  const fissa=document.body.classList.contains('gio-fissa') && gioSchermoFisso();
  if(!fissa){ d.style.width=d.style.height=d.style.maxWidth=''; return; }
  let sotto=0; try{ const t=document.createElement('div'); t.style.cssText='position:fixed;bottom:0;height:env(safe-area-inset-bottom,0px)'; document.body.appendChild(t); sotto=t.offsetHeight; t.remove(); }catch(e){}
  const rc=campo.getBoundingClientRect();
  const fondo=Math.min(rc.bottom, window.innerHeight-sotto-16);
  const msg=box&&box.querySelector('.ruo-msg'), hm=msg?msg.offsetHeight+6:0;
  const verticale=window.innerHeight>largFinestra();
  /* in verticale la ruota sta sopra alla domanda: si prende la larghezza e poco più di metà dell'altezza */
  const alt=verticale?(fondo-rc.top)*0.58-18-hm:fondo-rc.top-18-hm,
        larg=verticale?rc.width*0.92:Math.min(largFinestra()*0.48, rc.width*0.62);
  /* se la pagina del gioco è ingrandita o rimpicciolita (adattaGioco), le misure sullo schermo vanno riportate alla sua scala */
  const pg=d.closest('.gio-pagina'), z=pg&&pg.dataset.scala?(+pg.dataset.scala||1):1;
  const lato=Math.max(180,Math.floor(Math.min(alt,larg)/z));
  d.style.width=lato+'px'; d.style.height=lato+'px'; d.style.maxWidth='none';
}
window.addEventListener('resize',()=>{ if(!zoomNativo() && $('.ruo-disco')) setTimeout(adattaRuota,60); });
window.addEventListener('orientationchange',()=>{ if($('.ruo-disco')) setTimeout(adattaRuota,300); });

/* ======================= 10. 🧱 COSTRUISCI IL VERSETTO ======================= */
const VRS={ lg:'it', modo:'normale', v:null, blocchi:[], risp:[], pool:[], aiuti:0, errori:0, finito:false, sbagliati:[],
            punti:0, max:0, fatti:0, pid:null, tempo:60, timer:null, sfidaAttiva:false, fineSfida:null, msg:'' };
function vrsVersetti(){ return (typeof GIOCHI_NUOVI!=='undefined' && GIOCHI_NUOVI.versetti)||[]; }
function vrsQuantiBlocchi(liv,parole){
  const n = liv===1 ? 4 : liv===2 ? 6+Math.floor(Math.random()*3) : 8+Math.floor(Math.random()*5);
  return Math.max(2,Math.min(n,parole));
}
/* divide le parole in n pezzi di seguito, più uguali possibile */
function vrsDividi(testo,n){
  const w=testo.split(/\s+/).filter(Boolean), out=[];
  let i=0;
  for(let k=0;k<n;k++){ const quante=Math.round((w.length-i)/(n-k)); out.push(w.slice(i,i+quante).join(' ')); i+=quante; }
  return out.filter(Boolean);
}
function vrsNuovo(){
  const liv=livelloGioco('versetto'), lg=VRS.lg;
  const lista=vrsVersetti().filter(v=>(v.text[lg]||'').split(/\s+/).length>=(liv===1?4:liv===2?8:12));
  const centro = liv;
  const v=pescaNuovePesate(lista.length?lista:vrsVersetti(),1,'gnversetto'+lg,x=>x.id,x=>gnPesoDif(x.difficulty,centro)).lista[0];
  segnaVisteGioco('gnversetto'+lg,[v.id]);
  const testo=v.text[lg]||v.text.it;
  const pezzi=vrsDividi(testo,vrsQuantiBlocchi(liv,testo.split(/\s+/).length));
  VRS.v=v; VRS.blocchi=pezzi.map((t,i)=>({i,t}));
  VRS.risp=[]; VRS.pool=mescola(pezzi.map((_,i)=>i));
  /* mai già in ordine giusto, all'inizio */
  if(VRS.pool.every((x,k)=>pezzi[x]===pezzi[k]) && pezzi.length>1) VRS.pool.push(VRS.pool.shift());
  VRS.aiuti=0; VRS.errori=0; VRS.finito=false; VRS.sbagliati=[]; VRS.msg='';
}
function nuovaPartitaVersetto(){
  gnFermaTimer();
  Object.assign(VRS,{modo:'normale',punti:0,max:0,fatti:0,pid:uid(),fineSfida:null});
  vrsNuovo(); vVersetto();
}
function vrsLingua(lg){ VRS.lg=lg; nuovaPartitaVersetto(); }
function vrsValore(){ return VRS.blocchi.length*50; }
function vrsControlla(){
  if(VRS.pool.length || VRS.finito) return;
  const giusto=VRS.blocchi.map(b=>b.t), dato=VRS.risp.map(i=>VRS.blocchi[i].t);
  if(dato.every((t,k)=>t===giusto[k])){
    VRS.finito=true;
    const pt=Math.max(10, vrsValore()-VRS.aiuti*60-VRS.errori*25);
    VRS.punti+=pt; VRS.max+=vrsValore(); VRS.fatti++; VRS.ultimiPunti=pt;
    if(VRS.modo==='normale')
      salvaRisultatoAttuale('versetto',VRS.pid,VRS.punti/VRS.max*100,{punti:VRS.punti,versetti:VRS.fatti},'ultimo');
    if(VRS.modo==='sfida'){ vrsNuovo(); VRS.msg=`🎉 Versetto completato! +${pt}`; }
    else garaFatto('versetto',VRS.errori===0&&VRS.aiuti===0,pt);
  } else {
    VRS.errori++;
    VRS.sbagliati=VRS.risp.map((x,k)=>VRS.blocchi[x].t!==giusto[k]);
    VRS.msg='Non ancora: i blocchi in rosso sono al posto sbagliato. Spostali!';
  }
}
function vrsSposta(id,zona,indice){
  if(VRS.finito) return;
  VRS.risp=VRS.risp.filter(x=>x!==id); VRS.pool=VRS.pool.filter(x=>x!==id);
  const arr = zona==='risp' ? VRS.risp : VRS.pool;
  arr.splice(indice==null?arr.length:Math.max(0,Math.min(indice,arr.length)),0,id);
  VRS.sbagliati=[]; VRS.msg='';
  vrsControlla(); vVersetto();
}
/* toccare un blocco senza trascinarlo: dai blocchi sciolti va in fondo al versetto, dal versetto torna fra i blocchi */
function vrsTocca(id){ vrsSposta(id, VRS.risp.includes(id)?'pool':'risp'); }
/* 💡 mette al suo posto il primo blocco che non c'è ancora (costa punti) */
function vrsAiuto(){
  if(VRS.finito) return;
  const giusto=VRS.blocchi.map(b=>b.t);
  let k=0; while(k<VRS.risp.length && VRS.blocchi[VRS.risp[k]].t===giusto[k]) k++;
  if(k>=giusto.length) return;
  const id=[...VRS.pool,...VRS.risp.slice(k)].find(x=>VRS.blocchi[x].t===giusto[k]);
  VRS.aiuti++;
  vrsSposta(id,'risp',k);
}
/* «Avanti» dopo un versetto completato (in gara il versetto dopo è del prossimo giocatore) */
function vrsAvanti(){ if(garaPassa('versetto',vrsAvanti)) return; vrsNuovo(); vVersetto(); }
function vrsSfida(){
  if(garaDi('versetto')){ avvisa('In gara si gioca un versetto alla volta, a turno','no'); return; }
  gnFermaTimer();
  Object.assign(VRS,{modo:'sfida',punti:0,max:0,fatti:0,pid:uid(),tempo:60,fineSfida:null,sfidaAttiva:true});
  vrsNuovo();
  VRS.timer=setInterval(()=>{
    VRS.tempo--;
    if(VRS.tempo<=0){
      clearInterval(VRS.timer); VRS.timer=null; VRS.sfidaAttiva=false;
      VRS.fineSfida=gnFinePartita('versetto',VRS.pid,Math.min(100,VRS.fatti*20),{punti:VRS.punti,versetti:VRS.fatti,sfida:1},'versetti');
    }
    if(GIO.vista==='versetto') vrsAggiornaTempo();
  },1000);
  vVersetto();
}
function vrsAggiornaTempo(){
  const t=$('#vrsTempo');
  if(t && VRS.sfidaAttiva){ t.textContent='00:'+String(VRS.tempo).padStart(2,'0'); t.classList.toggle('poco',VRS.tempo<=10); }
  else vVersetto();
}
function vrsBloccoHtml(id,k,dove){
  const b=VRS.blocchi[id], male=dove==='risp'&&VRS.sbagliati[k];
  return `<span class="vrs-blocco${male?' male':''}${VRS.finito?' fatto':''}" data-id="${id}">${esc(b.t)}</span>`;
}
function vVersetto(){
  if(GIO.giocatore) return vPaginaGiocatore();
  if(!VRS.v){ VRS.pid=uid(); vrsNuovo(); }
  const lg=VRS.lg, liv=livelloGioco('versetto'), sfida=VRS.modo==='sfida';
  const fineSfida=sfida && !VRS.sfidaAttiva && VRS.fineSfida;
  pinta(`
  <div class="gio-pagina gn-pagina">
  ${gnTesta('versetto','🧱','Costruisci il Versetto')}
  <div class="scelte scelte-3">
    ${gnLingua(VRS,'vrsLingua',VRS.sfidaAttiva)}
    <div class="scelta" style="--ac:#8b7bff">
      <div class="scelta-tit">🎮 Modalità</div>
      <div class="scelta-op">
        <button class="op ${!sfida?'on':''}" onclick="nuovaPartitaVersetto()">📖 Un versetto alla volta</button>
        <button class="op ${sfida?'on':''}" onclick="vrsSfida()">⏱️ 60 SECONDI</button>
      </div>
    </div>
    ${gnRicomincia(sfida?'vrsSfida()':'nuovaPartitaVersetto()')}
  </div>
  <div class="gn-kpi">
    ${gnKpi(esc(gnChiGioca()),'Giocatore','#8b7bff')}
    ${sfida?gnKpi(`<span id="vrsTempo" class="${VRS.tempo<=10?'poco':''}">00:${String(Math.max(0,VRS.tempo)).padStart(2,'0')}</span>`,'Tempo','#ff6b81'):gnKpi(VRS.blocchi.length,'Blocchi','#ffd166')}
    ${gnKpi(sfida?VRS.fatti:gnNum(VRS.punti),sfida?'Versetti':'Punti','#4fd1a5')}
  </div>
  ${fineSfida?`
  <div class="scheda gn-fine">
    <h2>⏱️ Tempo scaduto!</h2>
    <p class="sotto">Hai completato <b>${VRS.fatti}</b> versett${VRS.fatti===1?'o':'i'} in 60 secondi · <b>${gnNum(VRS.punti)}</b> punti.</p>
    ${gnRigaRecord(VRS.fineSfida,'versetti in 60 secondi')}
    ${htmlPremio('versetto',Math.min(100,VRS.fatti*20),{chiave:VRS.pid})}
    <button class="bt blu" onclick="vrsSfida()">🔄 Gioca ancora</button>
  </div>`:`
  <div class="scheda vrs-card">
    ${VRS.finito&&!sfida?`
      <div class="vrs-completo">
        <h2>🎉 VERSETTO COMPLETATO</h2>
        <p class="vrs-testo">«${esc(VRS.v.text[lg]||VRS.v.text.it)}»</p>
        ${gnRifBt(VRS.v.biblicalReference,lg)}
        <p class="sotto">+${VRS.ultimiPunti} punti${VRS.aiuti?` · ${VRS.aiuti} suggeriment${VRS.aiuti===1?'o':'i'}`:''}</p>
        <button class="bt blu gn-avanti" onclick="vrsAvanti()">Avanti →</button>
      </div>`:`
      <p class="dom-sopra">Trascina i blocchi nell'ordine giusto${liv===1?'':' — o toccali uno dopo l\'altro'}${sfida?'':` · ${gnRif(VRS.v.biblicalReference,lg)}`}</p>
      <div class="vrs-zona vrs-risp" id="vrsRisp" data-zona="risp">${VRS.risp.map((id,k)=>vrsBloccoHtml(id,k,'risp')).join('')||'<span class="vrs-vuoto">Il tuo versetto: trascina qui i blocchi</span>'}</div>
      <div class="vrs-zona vrs-pool" id="vrsPool" data-zona="pool">${VRS.pool.map((id,k)=>vrsBloccoHtml(id,k,'pool')).join('')}</div>
      ${VRS.msg?`<p class="vrs-msg ${VRS.msg.startsWith('🎉')?'si':''}">${esc(VRS.msg)}</p>`:''}
      <div class="gn-centro"><button class="bt pi" onclick="vrsAiuto()">💡 SUGGERIMENTO <small>(−60 punti)</small></button></div>`}
  </div>
  ${!sfida&&VRS.max?`<div class="gn-premio-mini">${htmlPremio('versetto',VRS.punti/VRS.max*100,{chiave:VRS.pid,senzaClassifica:!VRS.finito})}</div>`:''}`}
  </div>`);
  vrsAttaccaTrascina();
}
/* ---- il trascinamento: con il mouse e con il dito (pointer events), su iPhone, iPad e Mac ---- */
function vrsAttaccaTrascina(){
  $$('.vrs-blocco').forEach(el=>{
    if(VRS.finito) return;
    el.addEventListener('pointerdown',vrsGiu);
  });
}
let _vrsDrag=null;
function vrsGiu(e){
  if(e.button!==undefined && e.button!==0) return;
  const el=e.currentTarget;
  _vrsDrag={el,id:+el.dataset.id,x0:e.clientX,y0:e.clientY,mosso:false,ghost:null,segno:null};
  try{ el.setPointerCapture(e.pointerId); }catch(x){}
  el.addEventListener('pointermove',vrsMuovi);
  el.addEventListener('pointerup',vrsSu);
  el.addEventListener('pointercancel',vrsAnnulla);
  e.preventDefault();
}
function vrsDove(x,y){
  const zone=[$('#vrsRisp'),$('#vrsPool')].filter(Boolean);
  let z=zone.find(zz=>{ const r=zz.getBoundingClientRect(); return x>=r.left-10&&x<=r.right+10&&y>=r.top-14&&y<=r.bottom+14; });
  if(!z) return null;
  const figli=[...z.querySelectorAll('.vrs-blocco')].filter(b=>!_vrsDrag||b!==_vrsDrag.el);
  let idx=figli.length;
  for(let k=0;k<figli.length;k++){
    const r=figli[k].getBoundingClientRect();
    if(y<r.top-4){ idx=k; break; }                       /* una riga più su */
    if(y<=r.bottom+4 && x<r.left+r.width/2){ idx=k; break; }
  }
  return {zona:z.dataset.zona, z, idx, figli};
}
function vrsMuovi(e){
  const d=_vrsDrag; if(!d) return;
  if(!d.mosso){
    if(Math.hypot(e.clientX-d.x0,e.clientY-d.y0)<7) return;
    d.mosso=true;
    const r=d.el.getBoundingClientRect();
    d.dx=d.x0-r.left; d.dy=d.y0-r.top;
    d.ghost=d.el.cloneNode(true); d.ghost.classList.add('vrs-ghost');
    d.ghost.style.width=r.width+'px'; document.body.appendChild(d.ghost);
    d.el.classList.add('vrs-posto');
    d.segno=document.createElement('span'); d.segno.className='vrs-segno';
  }
  d.ghost.style.transform=`translate(${e.clientX-d.dx}px,${e.clientY-d.dy}px)`;
  const w=vrsDove(e.clientX,e.clientY);
  if(d.segno.parentNode) d.segno.remove();
  if(w){ const prima=w.figli[w.idx]; if(prima) w.z.insertBefore(d.segno,prima); else w.z.appendChild(d.segno); }
  e.preventDefault();
}
function vrsFineDrag(){
  const d=_vrsDrag; if(!d) return null;
  d.el.removeEventListener('pointermove',vrsMuovi);
  d.el.removeEventListener('pointerup',vrsSu);
  d.el.removeEventListener('pointercancel',vrsAnnulla);
  if(d.ghost) d.ghost.remove();
  if(d.segno&&d.segno.parentNode) d.segno.remove();
  d.el.classList.remove('vrs-posto');
  _vrsDrag=null;
  return d;
}
function vrsSu(e){
  const d=vrsFineDrag(); if(!d) return;
  if(!d.mosso){ vrsTocca(d.id); return; }
  const w=vrsDove(e.clientX,e.clientY);
  if(w) vrsSposta(d.id,w.zona,w.idx); else vVersetto();
}
function vrsAnnulla(){ vrsFineDrag(); vVersetto(); }

/* ======================= 11. 🧭 IL VIAGGIO BIBLICO ======================= */
const VIA={ lg:'it', j:null, prova:null, esito:null, animaDa:null, pid:null };
function viaViaggi(){ return (typeof GIOCHI_NUOVI!=='undefined' && GIOCHI_NUOVI.viaggi)||[]; }
function viaStato(jid){ const p=gnProgressi('viaggio'); return p[jid]=p[jid]||{tappa:0,errori:0,punti:0,fatto:false}; }
/* un viaggio si apre quando hai finito quello prima (il primo è sempre aperto) */
function viaAperto(k){ return k===0 || viaStato(viaViaggi()[k-1].id).fatto; }
function viaLingua(lg){ VIA.lg=lg; VIA.prova=null; VIA.esito=null; vViaggio(); }
function viaApri(jid){ VIA.j=jid; VIA.prova=null; VIA.esito=null; VIA.animaDa=null; viaPreparaProva(); vViaggio(); }
function viaElenco(){ VIA.j=null; VIA.prova=null; VIA.esito=null; vViaggio(); }
function viaRicomincia(jid){
  conferma('Vuoi ricominciare questo viaggio dall\'inizio?',()=>{ const p=gnProgressi('viaggio'); p[jid]={tappa:0,errori:0,punti:0,fatto:false}; salva(); viaApri(jid); },'Ricomincia');
}
function viaCorrente(){ return viaViaggi().find(v=>v.id===VIA.j)||null; }
function viaPreparaProva(){
  const v=viaCorrente(); if(!v) return;
  const st=viaStato(v.id), t=v.tappe[st.tappa+1];
  VIA.esito=null; VIA.errProva=0;
  if(!t){ VIA.prova=null; return; }
  const p=t.prova, lg=VIA.lg;
  if(p.tipo==='ordina') VIA.prova={p, ord:gnOrdinaNuovo(p.items[lg]||p.items.it)};
  else if(p.tipo==='puzzle'){
    const parola=_pulisciParola(gnT(p.parola,lg)).split('');
    let mix=mescola(parola.map((c,i)=>i)); if(mix.every((x,i)=>x===i)&&mix.length>1) mix.push(mix.shift());
    VIA.prova={p, lettere:parola, mix, scelte:[]};
  } else {
    const opz=[gnT(p.a,lg),...(p.w[lg]||p.w.it)], ord=mescola([0,1,2,3]);
    VIA.prova={p, opz:ord.map(k=>opz[k]), g:ord.indexOf(0), tolte:[]};
  }
}
const VIA_TIPI={luogo:'📍 Individua il luogo',evento:'📜 Riconosci l\'evento',personaggio:'👤 Identifica il personaggio',
                domanda:'❓ Domanda biblica',ordina:'🔢 Metti in ordine',puzzle:'🧩 Piccolo puzzle'};
function viaSuperata(){
  const v=viaCorrente(), st=viaStato(v.id);
  const pt=Math.max(20,100-VIA.errProva*30);
  VIA.animaDa=st.tappa; st.tappa++; st.punti=(st.punti||0)+pt; st.quando=Date.now();
  VIA.esito={giusta:true,pt};
  garaFatto('viaggio',VIA.errProva===0,pt);
  if(st.tappa>=v.tappe.length-1){
    st.fatto=true;
    const perc=Math.max(0,100-(st.errori||0)*8);
    VIA.fine=gnFinePartita('viaggio',uid(),perc,{viaggio:v.id,tappe:v.tappe.length,errori:st.errori||0,punti:st.punti});
    VIA.fine.perc=perc;
    gnDaiTrofeo('viaggio-'+v.id,gnT(v.titolo,'it'),v.ic);
  }
  salva();
}
function viaSbagliata(){ const st=viaStato(VIA.j); st.errori=(st.errori||0)+1; VIA.errProva++; salva();
  garaFatto('viaggio',false,0,null); }                   /* in gara: sbagliato, tocca al prossimo (poi riprovi tu) */
function viaRispondi(i){
  const P=VIA.prova; if(!P||VIA.esito||P.tolte.includes(i)) return;
  if(i===P.g){ viaSuperata(); }
  else { viaSbagliata(); P.tolte.push(i); VIA.msg='Non è la risposta giusta: riprova!'; }
  vViaggio();
}
function viaOrdina(k){
  const P=VIA.prova; if(!P||VIA.esito) return;
  const r=gnOrdinaTocca(P.ord,k);
  if(r===true){ viaSuperata(); }
  else if(r===false){ viaSbagliata(); VIA.msg='L\'ordine non è giusto: riprova!'; P.ord=gnOrdinaNuovo(P.ord.voci); }
  vViaggio();
}
function viaLettera(k){
  const P=VIA.prova; if(!P||VIA.esito) return;
  if(k<0){ P.scelte.pop(); return vViaggio(); }
  if(P.scelte.includes(k)) return;
  P.scelte.push(k);
  if(P.scelte.length===P.lettere.length){
    const fatta=P.scelte.map(x=>P.lettere[x]).join('');
    if(fatta===P.lettere.join('')) viaSuperata();
    else { viaSbagliata(); VIA.msg='Il nome non è giusto: riprova!'; P.scelte=[]; }
  }
  vViaggio();
}
function viaProssima(){ if(garaPassa('viaggio',viaProssima)) return; VIA.animaDa=null; VIA.msg=''; viaPreparaProva(); vViaggio(); }
/* la mappa: i luoghi veri (latitudine e longitudine) messi in proporzione dentro al riquadro */
function viaMappa(v,st){
  const W=640,H=400,P=46, lg=VIA.lg;
  const lat=v.tappe.map(t=>t.lat), lon=v.tappe.map(t=>t.lon);
  const midLat=(Math.min(...lat)+Math.max(...lat))/2, kx=Math.cos(midLat*Math.PI/180);
  const xs=lon.map(x=>x*kx), minX=Math.min(...xs), maxX=Math.max(...xs), minY=Math.min(...lat), maxY=Math.max(...lat);
  const sc=Math.min((W-2*P)/Math.max(0.01,maxX-minX),(H-2*P)/Math.max(0.01,maxY-minY));
  const ox=(W-(maxX-minX)*sc)/2, oy=(H-(maxY-minY)*sc)/2;
  const pts=v.tappe.map((t,i)=>{
    let x=ox+(t.lon*kx-minX)*sc, y=oy+(maxY-t.lat)*sc;
    /* due tappe nello stesso punto (un viaggio che torna da dove è partito): la seconda un po' più in là */
    v.tappe.slice(0,i).forEach((u,j)=>{ if(Math.abs(u.lat-t.lat)<0.02&&Math.abs(u.lon-t.lon)<0.02){ x+=14; y+=14; } });
    return [x,y];
  });
  const fatto=st.tappa, pos=VIA.animaDa!=null?VIA.animaDa:fatto;
  const linea=(a,b,cl)=>`<line x1="${pts[a][0].toFixed(1)}" y1="${pts[a][1].toFixed(1)}" x2="${pts[b][0].toFixed(1)}" y2="${pts[b][1].toFixed(1)}" class="${cl}"/>`;
  let righe=''; for(let i=0;i<pts.length-1;i++) righe+=linea(i,i+1,i<fatto?'via-fatta':'via-da-fare');
  const griglia=[1,2,3,4,5].map(k=>`<line x1="${k*W/6}" y1="0" x2="${k*W/6}" y2="${H}" class="via-gr"/>`).join('')+[1,2,3].map(k=>`<line x1="0" y1="${k*H/4}" x2="${W}" y2="${k*H/4}" class="via-gr"/>`).join('');
  /* le scritte dei luoghi: sopra, sotto, a destra o a sinistra del punto, dove non ne toccano altre */
  const messe=[];
  const scritte=v.tappe.map((t,i)=>{
    const [x,y]=pts[i], testo=(i<=fatto||i===fatto+1)?gnT(t.luogo,lg):'…', w=testo.length*7.6+8, h=16;
    const prove=[[x,y-16,'middle'],[x,y+24,'middle'],[x+14,y+5,'start'],[x-14,y+5,'end'],[x,y-32,'middle'],[x,y+40,'middle']];
    const scatola=([lx,ly,an])=>{ const x0=an==='middle'?lx-w/2:an==='start'?lx:lx-w; return [x0,ly-h+3,x0+w,ly+3]; };
    const tocca=b=>messe.some(m=>b[0]<m[2]&&b[2]>m[0]&&b[1]<m[3]&&b[3]>m[1]) || pts.some((p,j)=>j!==i&&p[0]>b[0]-8&&p[0]<b[2]+8&&p[1]>b[1]-8&&p[1]<b[3]+8);
    let scelta=prove.find(pr=>{ const b=scatola(pr); return b[0]>2&&b[2]<W-2&&b[1]>2&&b[3]<H-2&&!tocca(b); })||prove[y<40?1:0];
    messe.push(scatola(scelta));
    return {testo,lx:scelta[0],ly:scelta[1],an:scelta[2]};
  });
  const tappe=v.tappe.map((t,i)=>{
    const [x,y]=pts[i], visto=i<=fatto, prossimo=i===fatto+1, sc=scritte[i];
    return `<g class="via-tappa ${visto?'vista':''} ${prossimo?'prossima':''}">
      <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${prossimo?11:8}"/>
      ${prossimo?`<text x="${x.toFixed(1)}" y="${(y+1).toFixed(1)}" class="via-q" text-anchor="middle" dominant-baseline="central">?</text>`:''}
      <text x="${sc.lx.toFixed(1)}" y="${sc.ly.toFixed(1)}" class="via-et" text-anchor="${sc.an}">${esc(sc.testo)}</text>
    </g>`;
  }).join('');
  const g=giocatoreAttuale(), col=g?g.c:'#e0b25c', ini=g?inizialeGiocatore(g):'🧭';
  return `<svg viewBox="0 0 ${W} ${H}" class="via-svg" data-pts='${JSON.stringify(pts.map(p=>p.map(n=>Math.round(n))))}'>
    <defs><radialGradient id="viaFondo" cx="50%" cy="45%" r="75%"><stop offset="0" stop-color="#2a2417"/><stop offset="1" stop-color="#15130f"/></radialGradient></defs>
    <rect x="0" y="0" width="${W}" height="${H}" rx="18" fill="url(#viaFondo)"/>
    ${griglia}
    <text x="${W-30}" y="34" class="via-nord" text-anchor="middle">N ↑</text>
    ${righe}${tappe}
    <g id="viaSegnaposto" transform="translate(${pts[pos][0].toFixed(1)},${pts[pos][1].toFixed(1)})">
      <circle r="15" fill="${col}" stroke="#fff" stroke-width="3"/>
      <text class="via-ini" text-anchor="middle" dominant-baseline="central">${ini}</text>
    </g>
  </svg>`;
}
/* l'indicatore del giocatore scivola sulla mappa fino alla tappa nuova */
function viaAnima(){
  if(VIA.animaDa==null) return;
  const svg=$('.via-svg'), g=$('#viaSegnaposto'); if(!svg||!g) return;
  const pts=JSON.parse(svg.dataset.pts), a=pts[VIA.animaDa], b=pts[VIA.animaDa+1]; if(!a||!b) return;
  const t0=performance.now(), dur=GIOCHI_PAUSA.ms===0?1:1300;
  const passo=now=>{
    const k=Math.min(1,(now-t0)/dur), e=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;
    g.setAttribute('transform',`translate(${(a[0]+(b[0]-a[0])*e).toFixed(1)},${(a[1]+(b[1]-a[1])*e).toFixed(1)})`);
    if(k<1) requestAnimationFrame(passo);
  };
  requestAnimationFrame(passo);
}
function viaProvaHtml(P,lg){
  const p=P.p;
  const titolo=`<p class="dom-sopra">${VIA_TIPI[p.tipo]||''}</p><p class="dom-testo">${esc(gnT(p.q,lg))}</p>`;
  if(p.tipo==='ordina') return titolo+gnOrdinaHtml(P.ord,'viaOrdina');
  if(p.tipo==='puzzle') return titolo+`
    <div class="via-parola">${P.lettere.map((c,i)=>`<span>${P.scelte[i]!=null?P.lettere[P.scelte[i]]:'_'}</span>`).join('')}</div>
    <div class="imp-tastiera">${P.mix.map(k=>`<button class="imp-tasto ${P.scelte.includes(k)?'giusta':''}" ${P.scelte.includes(k)?'disabled':''} onclick="viaLettera(${k})">${P.lettere[k]}</button>`).join('')}
      <button class="imp-tasto" onclick="viaLettera(-1)">⌫</button></div>`;
  return titolo+`<div class="dom-opz gn-opz">${P.opz.map((t,i)=>`<button class="bt ${P.tolte.includes(i)?'sbagliata':''}" ${P.tolte.includes(i)?'disabled':''} onclick="viaRispondi(${i})">${esc(t)}</button>`).join('')}</div>`;
}
function vViaggio(){
  if(GIO.giocatore) return vPaginaGiocatore();
  const lg=VIA.lg, v=viaCorrente();
  let corpo;
  if(!v){
    corpo=`<div class="griglia via-elenco">${viaViaggi().map((j,k)=>{
      const st=viaStato(j.id), aperto=viaAperto(k), n=j.tappe.length;
      return `<div class="scheda via-card ${aperto?'':'chiuso'} ${st.fatto?'fatto':''}">
        <div class="via-card-ic">${aperto?j.ic:'🔒'}</div>
        <div class="via-card-tx"><b>${esc(gnT(j.titolo,lg))}</b>
          <span>VIAGGIO: ${Math.min(st.tappa+1,n)}/${n} TAPPE${st.fatto?' · ✓ completato':''}</span>
          <div class="gn-barra"><i style="width:${Math.round((st.tappa)/(n-1)*100)}%"></i></div></div>
        ${aperto?`<button class="bt ${st.fatto?'pi':'blu'}" onclick="viaApri('${j.id}')">${st.fatto?'Rivedi':st.tappa?'▶ Continua':'▶ Parti'}</button>`
                :`<span class="via-bloccato">Completa «${esc(gnT(viaViaggi()[k-1].titolo,lg))}» per sbloccarlo</span>`}
      </div>`;
    }).join('')}</div>`;
  } else {
    const st=viaStato(v.id), n=v.tappe.length, t=v.tappe[st.tappa], P=VIA.prova;
    corpo=`
    <div class="via-testa"><button class="bt pi mini" onclick="viaElenco()">← Tutti i viaggi</button>
      <b>${v.ic} ${esc(gnT(v.titolo,lg))}</b><span class="via-cont">VIAGGIO: ${st.tappa+1}/${n} TAPPE</span>
      <button class="bt pi mini" onclick="viaRicomincia('${v.id}')">↺</button></div>
    <div class="via-campo">
      <div class="via-mappa">${viaMappa(v,st)}</div>
      <div class="scheda via-lato">
        <div class="via-qui"><span class="via-pin">📍</span><div><b>${esc(gnT(t.luogo,lg))}</b><p>${esc(gnT(t.fatto,lg))}</p>${gnRifBt(t.rif,lg)}</div></div>
        ${st.fatto&&!VIA.esito?`<div class="gn-fine"><h2>🏁 Viaggio completato!</h2><p class="sotto">${gnNum(st.punti)} punti · ${st.errori||0} error${(st.errori||0)===1?'e':'i'}</p>
          <button class="bt blu" onclick="viaElenco()">Scegli un altro viaggio →</button></div>`
        :VIA.esito?`<div class="gn-esito si"><b>✓ PROVA SUPERATA</b><span class="gn-punti">+${VIA.esito.pt} punti</span>
            <span class="gn-spieg">Il cammino continua verso ${esc(gnT(v.tappe[st.tappa].luogo,lg))}.</span></div>
          ${st.fatto&&VIA.fine?`<h2 class="via-arrivo">🏁 Viaggio completato!</h2>${htmlPremio('viaggio',VIA.fine.perc,{senzaClassifica:true})}`:''}
          <button class="bt blu gn-avanti" onclick="viaProssima()">${st.fatto?'Vedi il viaggio completato':'Avanti →'}</button>`
        :P?`<div class="via-prova"><p class="via-verso">Per raggiungere la tappa successiva supera la prova:</p>
            ${viaProvaHtml(P,lg)}${VIA.msg?`<p class="vrs-msg">${esc(VIA.msg)}</p>`:''}</div>`:''}
      </div>
    </div>`;
  }
  pinta(`
  <div class="gio-pagina gn-pagina">
  ${gnTesta('viaggio','🧭','Il Viaggio Biblico')}
  <div class="scelte scelte-3">
    ${gnLingua(VIA,'viaLingua')}
    <div class="scelta" style="--ac:#ffb37a"><div class="scelta-tit">💾 Progressi</div>
      <div class="scelta-op"><span class="sotto" style="margin:0">Salvati da soli per ${esc(gnChiGioca())}: puoi smettere e continuare quando vuoi.</span></div></div>
  </div>
  ${corpo}
  </div>`);
  VIA.msg='';
  viaAnima();
}

/* ======================= 12. 🔐 CODICE SEGRETO BIBLICO ======================= */
const CDC={ lg:'it', dodici:null, liv:null, i:0, parti:[], aiuti:0, errori:0, punti:0, input:'', fase:'enigmi', dato:null, esitoCodice:null, mostraAiuto:false, pid:null };
/* tutti gli scrigni (quelli scritti a mano valgono per le due lingue, gli altri hanno la loro) */
function cdcTutti(){ return (typeof GIOCHI_NUOVI!=='undefined' && GIOCHI_NUOVI.codici)||[]; }
/* quelli della lingua scelta: 200 per lingua */
function cdcLivelli(lg){ lg=lg||CDC.lg; return cdcTutti().filter(x=>!x.lg||x.lg===lg); }
/* i 12 scrigni sullo schermo, del livello scelto (Facile/Medio/Difficile, nella riga dei giocatori):
   prima quelli non ancora aperti */
function cdcDif(){ return livelloGioco('codice'); }
const CDC_QUANTI=12;
function cdcDodici(){
  const chiave=CDC.lg+cdcDif();
  if(CDC.dodici && CDC.dodici.k===chiave) return CDC.dodici.id.map(id=>cdcTutti().find(x=>x.id===id)).filter(Boolean);
  return cdcNuovi(true);
}
function cdcNuovi(zitto){
  const dif=cdcDif(), f=cdcFatti(), prima=(CDC.dodici&&CDC.dodici.k===CDC.lg+dif)?CDC.dodici.id:[];
  const tutti=cdcLivelli().filter(x=>(x.dif||2)===dif);
  const peso=x=>(f[x.id]?2:0)+(prima.includes(x.id)?1:0);
  const scelti=mescola(tutti.slice()).sort((a,b)=>peso(a)-peso(b)).slice(0,CDC_QUANTI);
  CDC.dodici={k:CDC.lg+dif, id:scelti.map(x=>x.id)};
  if(!zitto) vCodice();
  return scelti;
}

function cdcFatti(){ const p=gnProgressi('codice'); return p.fatti=p.fatti||{}; }
function cdcLingua(lg){
  CDC.lg=lg;
  /* uno scrigno fatto per una lingua sola non esiste nell'altra: si torna all'elenco */
  const l=cdcCorrente(); if(CDC.liv && l && (!l.lg||l.lg===lg)) cdcApri(CDC.liv); else { CDC.liv=null; vCodice(); } }
function cdcElenco(){ CDC.liv=null; vCodice(); }
function cdcCorrente(){ return cdcTutti().find(x=>x.id===CDC.liv)||null; }
function cdcApri(id){
  Object.assign(CDC,{liv:id,i:0,parti:[],aiuti:0,errori:0,punti:0,input:'',fase:'enigmi',esitoCodice:null,mostraAiuto:false,pid:uid()});
  cdcPrepara(); vCodice();
}
function cdcParte(e){ return e.tipo==='num'||e.tipo==='rif' ? String(e.a) : String(e.parte); }
function cdcCodice(l){ return l.enigmi.map(cdcParte).join(''); }
function cdcPrepara(){
  const l=cdcCorrente(), e=l&&l.enigmi[CDC.i], lg=CDC.lg; CDC.input=''; CDC.mostraAiuto=false; CDC.msg='';
  if(!e){ CDC.dato=null; return; }
  if(e.tipo==='ordina') CDC.dato={ord:gnOrdinaNuovo(e.items[lg]||e.items.it)};
  else if(e.tipo==='scelta'||e.tipo==='completa'){
    const opz=[gnT(e.a,lg),...(e.w[lg]||e.w.it)], ord=mescola(opz.map((x,k)=>k));
    CDC.dato={opz:ord.map(k=>opz[k]), g:ord.indexOf(0), tolte:[]};
  } else CDC.dato={};
}
function cdcRisolto(){
  const l=cdcCorrente(), e=l.enigmi[CDC.i];
  CDC.parti.push(cdcParte(e));
  const guadagno=Math.max(50,250-(CDC.dato.costo||0));
  CDC.punti+=guadagno;
  CDC.i++;
  CDC.fase = CDC.i>=l.enigmi.length ? 'tastierino' : 'enigmi';
  CDC.nuovaParte=CDC.parti.length-1;
  cdcPrepara(); vCodice();
  garaFatto('codice',true,guadagno,null);               /* in gara: enigma risolto, tocca al prossimo */
}
function cdcSbagliato(msg){ CDC.errori++; CDC.dato.costo=(CDC.dato.costo||0)+25; CDC.msg=msg||'Non è giusto: riprova!'; vCodice();
  garaFatto('codice',false,0,null); }
function cdcAiuto(){
  if(CDC.mostraAiuto) return;
  CDC.mostraAiuto=true; CDC.aiuti++; CDC.dato.costo=(CDC.dato.costo||0)+75;
  /* nelle domande a scelta l'indizio toglie anche una risposta sbagliata */
  const d=CDC.dato;
  if(d.opz){ const k=d.opz.map((x,j)=>j).find(x=>x!==d.g&&!d.tolte.includes(x)); if(k!=null) d.tolte.push(k); }
  vCodice();
}
function cdcScegli(i){
  const d=CDC.dato; if(!d||d.tolte.includes(i)) return;
  if(i===d.g) cdcRisolto(); else { d.tolte.push(i); cdcSbagliato(); }
}
function cdcOrdina(k){
  const d=CDC.dato, r=gnOrdinaTocca(d.ord,k);
  if(r===true) cdcRisolto();
  else if(r===false){ d.ord=gnOrdinaNuovo(d.ord.voci); cdcSbagliato('L\'ordine non è giusto: riprova!'); }
  else vCodice();
}
/* il tastierino: per le risposte con un numero e, alla fine, per il codice */
function cdcTasto(t){
  if(t==='⌫') CDC.input=CDC.input.slice(0,-1);
  else if(t==='OK') return cdcConferma();
  else if(CDC.input.length<12) CDC.input+=t;
  CDC.msg=''; vCodice();
}
function cdcConferma(){
  const l=cdcCorrente(); if(!CDC.input) return;
  if(CDC.fase==='tastierino'){
    if(CDC.input===cdcCodice(l)){
      CDC.fase='aperto'; CDC.punti+=200;
      const max=l.enigmi.length*250+200, perc=CDC.punti/max*100;
      const f=cdcFatti(), prima=f[l.id];
      if(!prima || CDC.punti>prima.punti) f[l.id]={punti:CDC.punti,quando:Date.now()};
      CDC.fine=gnFinePartita('codice',CDC.pid,perc,{codice:l.id,punti:CDC.punti,aiuti:CDC.aiuti,errori:CDC.errori});
      CDC.fine.perc=perc;
      gnDaiTrofeo('codice-'+l.id,gnT(l.titolo,l.lg||'it'),'🔓');
      salva();
      vCodice(); garaFatto('codice',true,200,null); return;
    } else { CDC.errori++; CDC.esitoCodice='no'; CDC.input=''; CDC.msg='Codice sbagliato: lo scrigno resta chiuso. Riprova!'; }
    vCodice(); garaFatto('codice',false,0,null); return;
  }
  const e=l.enigmi[CDC.i];
  if(CDC.input===String(e.a)) cdcRisolto();
  else { CDC.input=''; cdcSbagliato(); }
}
function cdcTastierino(){
  return `<div class="cdc-tast">${['1','2','3','4','5','6','7','8','9','⌫','0','OK'].map(t=>
    `<button class="bt cdc-t ${t==='OK'?'blu':''}" onclick="cdcTasto('${t}')">${t}</button>`).join('')}</div>`;
}
function cdcSlot(l){
  const parti=l.enigmi.map((e,k)=>CDC.parti[k]!=null
    ? `<span class="cdc-slot ok ${CDC.nuovaParte===k?'nuova':''}">${esc(CDC.parti[k])}</span>`
    : `<span class="cdc-slot">${'_'.repeat(cdcParte(e).length)}</span>`).join('');
  return `<div class="cdc-codice"><span class="cdc-et">CODICE:</span>${parti}</div>`;
}
function vCodice(){
  if(GIO.giocatore) return vPaginaGiocatore();
  const lg=CDC.lg, l=cdcCorrente();
  let corpo;
  if(!l){
    const f=cdcFatti();
    corpo=`
    <div class="griglia cdc-elenco">${cdcDodici().map(x=>`
      <button class="scheda cdc-liv ${f[x.id]?'fatto':''}" onclick="cdcApri('${x.id}')">
        <span class="cdc-liv-ic">${f[x.id]?'🔓':'🔐'}</span><b>${esc(gnT(x.titolo,lg))}</b>
        <span>${x.ic} ${x.enigmi.length} enigmi${f[x.id]?` · ✓ ${gnNum(f[x.id].punti)} punti`:''}</span></button>`).join('')}</div>`;
  } else {
    const e=l.enigmi[CDC.i], d=CDC.dato;
    let area='';
    if(CDC.fase==='aperto'){
      area=`<div class="gn-fine cdc-aperto"><div class="cdc-scrigno aperto">🔓</div><h2>CODICE DECIFRATO!</h2>
        <p class="sotto">Il codice era <b>${esc(cdcCodice(l))}</b> · ${gnNum(CDC.punti)} punti${CDC.aiuti?` · ${CDC.aiuti} indizi`:''}</p>
        ${gnRigaRecord(CDC.fine)}
        ${htmlPremio('codice',CDC.fine.perc,{chiave:CDC.pid})}
        <div class="gn-centro"><button class="bt blu" onclick="cdcElenco()">Scegli un altro scrigno →</button></div></div>`;
    } else if(CDC.fase==='tastierino'){
      area=`<div class="cdc-enigma"><p class="dom-sopra">Hai tutti i pezzi!</p><p class="dom-testo">Scrivi il codice nel tastierino per aprire lo scrigno.</p>
        <div class="cdc-input ${CDC.esitoCodice==='no'?'scuoti':''}">${esc(CDC.input)||'&nbsp;'}</div>
        ${cdcTastierino()}${CDC.msg?`<p class="vrs-msg">${esc(CDC.msg)}</p>`:''}</div>`;
      CDC.esitoCodice=null;
    } else if(e){
      const tipi={num:'🔢 Trova il numero',rif:'📖 Usa il riferimento biblico',scelta:'👤 Scegli la risposta',completa:'✍️ Completa il versetto',ordina:'🔢 Metti in ordine'};
      const lettera=/^[A-ZĂÂÎȘȚ]$/.test(gnT(e.a,lg));
      area=`<div class="cdc-enigma"><p class="dom-sopra">Enigma ${CDC.i+1} di ${l.enigmi.length} · ${lettera?'🔎 Trova la lettera nascosta':tipi[e.tipo]}</p>
        <p class="dom-testo">${esc(gnT(e.q,lg))}</p>
        ${e.tipo==='num'||e.tipo==='rif'?`<div class="cdc-input">${esc(CDC.input)||'&nbsp;'}</div>${cdcTastierino()}`
          :e.tipo==='ordina'?gnOrdinaHtml(d.ord,'cdcOrdina')
          :`<div class="dom-opz gn-opz">${d.opz.map((t,i)=>`<button class="bt ${d.tolte.includes(i)?'spenta':''}" ${d.tolte.includes(i)?'disabled':''} onclick="cdcScegli(${i})">${esc(t)}</button>`).join('')}</div>`}
        ${CDC.msg?`<p class="vrs-msg">${esc(CDC.msg)}</p>`:''}
        <div class="gn-centro">${CDC.mostraAiuto?`<p class="cdc-aiuto">💡 ${esc(gnT(e.hint,lg))}</p>`:`<button class="bt pi" onclick="cdcAiuto()">💡 INDIZIO <small>(−75 punti)</small></button>`}</div>
      </div>`;
    }
    corpo=`
    <div class="via-testa"><button class="bt pi mini" onclick="cdcElenco()">← Tutti gli scrigni</button><b>${l.ic} 🔐 ${esc(gnT(l.titolo,lg))}</b>
      <span class="via-cont">${gnNum(CDC.punti)} punti</span></div>
    <div class="cdc-campo">
      <div class="scheda cdc-scrigno-box"><div class="cdc-scrigno ${CDC.fase==='aperto'?'aperto':''}">${CDC.fase==='aperto'?'🔓':'🔐'}</div>
        <p class="cdc-titolo">APRI LO SCRIGNO</p>${cdcSlot(l)}</div>
      <div class="scheda dom-card cdc-card">${area}</div>
    </div>`;
    CDC.nuovaParte=null;
  }
  pinta(`
  <div class="gio-pagina gn-pagina">
  ${gnTesta('codice','🔐','Codice Segreto Biblico')}
  <div class="scelte scelte-3">
    ${gnLingua(CDC,'cdcLingua')}
    ${l?gnRicomincia(`cdcApri('${l.id}')`,'Ricomincia lo scrigno'):gnRicomincia('cdcNuovi()','🔄 Cambia i codici')}
  </div>
  ${corpo}
  </div>`);
}
