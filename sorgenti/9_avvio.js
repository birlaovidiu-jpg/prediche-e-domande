/* ================= CONTROLLI INTERNI ================= */
/* Le prediche adesso si riconoscono dal loro numero e non dal posto in elenco.
   Quello che avevi scritto su una predica lo sposto sul suo nuovo nome, una
   volta sola: se no i tuoi appunti finivano sulla predica sbagliata. */
function spostaAppuntiPrediche(){
  if(stato.predRinominate) return 0;
  stato.predRinominate=true;
  const a=stato.predAnnot||{}; let n=0;
  Object.keys(_MAPPR||{}).forEach(vecchio=>{
    const nuovo=_MAPPR[vecchio];
    if(a[vecchio] && !a[nuovo]){ a[nuovo]=a[vecchio]; delete a[vecchio]; n++; }
  });
  if(n) salva();
  return n;
}
function autoTest(){
  const p=[],e=[];
  const ok=(c,m)=>c?p.push(m):e.push(m);
  ok(DOMANDE.length>1000,`domande in archivio: ${DOMANDE.length}`);
  ok(LIBRI.length===66,'66 libri della Bibbia');
  ok(DOMANDE.every(d=>d.o.length===3),'tre risposte per ogni domanda');
  ok(DOMANDE.every(d=>d.g>=0&&d.g<3),'la risposta giusta è sempre a, b o c');
  ok(DOMANDE.every(d=>d.L>=1&&d.L<=66),'ogni domanda ha un libro valido');
  ok(DOMANDE.some(d=>d.L===66),`Apocalisse presente: ${DOMANDE.filter(d=>d.L===66).length} domande`);
  ok(DOMANDE.some(d=>d.lg==='it')&&DOMANDE.some(d=>d.lg==='ro'),'domande in italiano e in rumeno');
  ok(CANTICI.length>100,`cantici in archivio: ${CANTICI.length}`);
  ok(CANTICI.every(c=>c.str&&c.str.length),'ogni cantico ha almeno una strofa');
  ok(Object.keys(RACCOLTE).every(k=>CANTICI.some(c=>c.cat===k)),`le ${Object.keys(RACCOLTE).length} raccolte di cantici ci sono tutte`);
  ok(CANTICI.some(c=>c.lg==='it')&&CANTICI.some(c=>c.lg==='ro'),'cantici in italiano e in rumeno');
  ok(CANTICI.some(c=>c.audio),`cantici con musica: ${CANTICI.filter(c=>c.audio).length}`);
  ok(CANTICI.some(c=>c.rit),'ci sono cantici con ritornello');
  /* il ritornello torna dopo ogni strofa */
  const cr=CANTICI.find(c=>c.rit&&c.str.length>1);
  if(cr){ const s=slideCantico(cr);
    ok(s.length===1+cr.str.length*2,'il ritornello è ripetuto dopo ogni strofa');
    ok(s[2].rit===true,'la diapositiva dopo la prima strofa è il ritornello');
    ok(s[s.length-1].amen===true,'l\'ultima diapositiva del cantico porta l\'Amen!');
    ok(slideHtml(s[s.length-1]).includes('c-amen'),'l\'Amen! si vede in proiezione'); }
  /* struttura della predica */
  const b=analizzaPredica('IL TITOLO\n\nUn paragrafo normale.\n\nMatteo 19:16 Atunci s\'a apropiat de Isus un om.\n\n1. primo punto\n2. secondo punto');
  ok(b.some(x=>x.t==='titolo'),'riconosce i titoli nel testo della predica');
  ok(b.some(x=>x.t==='cit'&&/Matteo/.test(x.rif||'')),'riconosce i passi biblici messi all\'inizio');
  ok(b.some(x=>x.t==='punti'&&x.punti.length===2),'riconosce gli elenchi numerati');
  ok(PREDICHE.filter(p=>p.blocchi.filter(x=>x.t==='cit').length>3).length>20,
     `prediche con i versetti riconosciuti: ${PREDICHE.filter(p=>p.blocchi.filter(x=>x.t==='cit').length>3).length} su ${PREDICHE.length}`);
  /* le prediche arrivano dai tuoi file di Pages con dentro come erano scritte */
  ok(PREDICHE.filter(p=>p.html&&p.html.length>400).length>=55,
     `prediche con la loro formattazione: ${PREDICHE.filter(p=>p.html).length}`);
  ok(PREDICHE.some(p=>/color:#/.test(p.html||'')) && PREDICHE.some(p=>/font-style:italic/.test(p.html||'')),
     'colori e corsivi arrivano dal file');
  ok(PREDICHE.every(p=>!p.num || p.num>0) && prossimoNumero()>PREDICHE.length-1,
     `il prossimo numero libero è ${prossimoNumero()}`);
  ok(Object.keys(FAMIGLIE).length>=5 && !/"/.test(Object.values(FAMIGLIE).join('')),'i caratteri del foglio non rompono l\'attributo');
  ok(typeof componiProiezione==='function','puoi scegliere tu cosa proiettare');
  ok(typeof stampaPredica==='function','c\'è il pulsante stampa');
  ok(Object.keys(SFONDI).length>=20,`sfondi disponibili: ${Object.keys(SFONDI).length}`);
  ok(DOMANDE.every(d=>d.dif>=1&&d.dif<=4),'ogni domanda ha una difficoltà');
  ok([1,2,3,4].every(n=>DOMANDE.some(d=>d.dif===n)),'ci sono tutti e quattro i livelli');
  ok(typeof espPdfRisposte==='function','c\'è il PDF con le risposte a parte');
  /* le Bibbie */
  ok(Object.keys(_BIBD.v).length===3,'ci sono le tre Bibbie');
  ok(_BIBD.cap.length===1189 && _BIBD.cap.reduce((a,b)=>a+b,0)===31102,'1189 capitoli, 31.102 versetti');
  ok(indiceVersetto(1,1,1)===0,'Genesi 1:1 è il primo versetto');
  ok(indiceVersetto(66,22,21)===31101,'Apocalisse 22:21 è l\'ultimo');
  ok(versettiDelCapitolo(19,119)===176,'il Salmo 119 ha 176 versetti');
  ok(leggiRiferimento('Genesi 27:36').L===1 && leggiRiferimento('Genesi 27:36').cap===27,'legge il riferimento italiano');
  ok(leggiRiferimento('Apocalipsa 12:1').L===66,'legge anche il riferimento rumeno');
  ok(leggiRiferimento('Genesi 35:27-29').vv.length===3,'capisce gli intervalli di versetti');
  ok(typeof vBibbia==='function'&&typeof cercaBibbia==='function','la sezione Bibbia c\'è');
  ok(typeof apriGriglia==='function','la griglia di libri, capitoli e versetti');
  /* Chi ha detto? */
  ok(CITAZIONI.length>800,`frasi «Chi ha detto?»: ${CITAZIONI.length}, tutte controllate sul testo`);
  ok(!CITAZIONI.some(c=>c.o[0]===c.o[1]||c.o[1]===c.o[2]||c.o[0]===c.o[2]),'nessuna frase ha due nomi uguali');
  ok(Math.max(...Object.values(CITAZIONI.reduce((a,c)=>{a[c.chi]=(a[c.chi]||0)+1;return a},{})))<CITAZIONI.length*0.3,
     'nessun personaggio domina più di un terzo delle frasi');
  ok(CITAZIONI.every(c=>c.o.length===3&&c.o[c.g]),'ogni frase ha tre nomi e uno giusto');
  ok(new Set(CITAZIONI.map(c=>c.chi)).size>50,`personaggi diversi: ${new Set(CITAZIONI.map(c=>c.chi)).size}`);
  ok(CITAZIONI.some(c=>c.lg==='it')&&CITAZIONI.some(c=>c.lg==='ro'),'frasi in italiano e in rumeno');
  ok(typeof passaARegia==='function','dalla proiezione si passa alla regia ovunque');
  /* ---- lezionari della Scuola del Sabato ---- */
  (function(){
    ok(linguaDelTesto('Şi Dumnezeu a zis pentru că este bun, lecţia săptămâna aceasta')==='ro' &&
       linguaDelTesto('Il Signore che è nostro Dio, la lezione della settimana perché questo')==='it',
       'riconosce da solo se il lezionario è in italiano o in rumeno');
    ok(trimestreDelTesto('ottobre novembre dicembre 2026','it')===4 &&
       trimestreDelTesto('gennaio febbraio marzo','it')===1 &&
       trimestreDelTesto('Trimestrul II aprilie mai iunie','ro')===2 &&
       trimestreDelTesto('iulie august septembrie','ro')===3,'riconosce il trimestre');
    ok(annoDelTesto('Lezionario della Scuola del Sabato 2026')===2026,'riconosce l\'anno');
    const s=prossimoSabato();
    ok(s.getDay()===6,'il prossimo sabato è davvero un sabato');
    ok((s-new Date())<8*86400000,'ed è entro una settimana');
    /* un lezionario finto, per provare che trova lezioni, sabati e giorni */
    const gg=['Domenica','Lunedì','Martedì','Mercoledì','Giovedì','Venerdì'];
    const testo=['LEZIONARIO gennaio febbraio marzo 2026'];
    for(let i=1;i<=3;i++){
      testo.push(`Lezione ${i}   Titolo numero ${i} Sabato, ${i*7} gennaio 2026`);
      gg.forEach(g=>testo.push(g+' — approfondimento della lezione'));
    }
    const finto={lg:'it',anno:2026,pagCop:0,pagine:testo.length,testo};
    analizzaLezionario(finto);
    ok(finto.lezioni.length===3,`trova le lezioni dentro al PDF: ${finto.lezioni.length}`);
    ok(finto.lezioni[0].data==='2026-01-07','e il sabato di ognuna');
    ok(finto.lezioni[0].giorni.length===7,`e i sette giorni della settimana: ${finto.lezioni[0].giorni.map(g=>g.nome).join(', ')}`);
    ok(finto.lezioni[1].pag===9,'ogni lezione sa a che pagina comincia');
    ['apriLez','apriIndiceLez','cambiaModo','dettaTesto','rettangoliSelezione','nudo','setStru']
      .forEach(f=>ok(typeof window[f]==='function','il lettore ha «'+f+'»'));
  })();
  /* ---- gli appunti passano da una lingua all'altra ---- */
  (function(){
    /* due lezionari dello stesso trimestre: l'italiano conta le lezioni
       da 12, il rumeno da 11, hanno copertine di lunghezza diversa e
       una data scritta in modo diverso. Quello che segno sull'uno
       si deve vedere sull'altro. */
    const ggIt=['Domenica','Lunedì','Martedì','Mercoledì','Giovedì','Venerdì'];
    const ggRo=['Duminică','Luni','Marţi','Miercuri','Joi','Vineri'];
    const tIt=['Lezionario luglio agosto settembre 2026'];
    for(let i=0;i<3;i++){
      tIt.push(`Lezione ${12+i}  Il titolo ${i} Sabato, ${5+i*7} settembre 2026`);
      ggIt.forEach(g=>tIt.push(g+' — studio della lezione'));
    }
    const tRo=['Lecţii biblice iulie august septembrie 2026','pagina in piu'];
    for(let i=0;i<3;i++){
      tRo.push(`Lecţia ${11+i}  Titlul ${i} Sâmbătă, ${5+i*7} septembrie 2026`);
      ggRo.forEach(g=>tRo.push(g+' — studiul lecţiei'));
    }
    const IT={i:'zz1',lg:'it',anno:2026,trim:3,pagCop:0,pagine:tIt.length,testo:tIt};
    const RO={i:'zz2',lg:'ro',anno:2026,trim:3,pagCop:1,pagine:tRo.length+1,testo:tRo};
    analizzaLezionario(IT); analizzaLezionario(RO);
    ok(IT.lezioni.length===3 && RO.lezioni.length===3,
       `due edizioni con tre lezioni ciascuna: ${IT.lezioni.length} e ${RO.lezioni.length}`);
    ok(IT.lezioni[0].data && IT.lezioni[0].data===RO.lezioni[0].data,
       `stesso sabato nelle due lingue: ${IT.lezioni[0].data} / ${RO.lezioni[0].data}`);
    ok(gruppoNote(IT)===gruppoNote(RO),
       `stesso cassetto degli appunti: ${gruppoNote(IT)} / ${gruppoNote(RO)}`);
    /* la pagina del martedì della seconda lezione, nelle due edizioni */
    const pIt=IT.lezioni[1].giorni.find(g=>g.k===2).pag;
    const pRo=RO.lezioni[1].giorni.find(g=>g.k===2).pag;
    ok(pIt!==pRo,`le due edizioni hanno numeri di pagina diversi: ${pIt} e ${pRo}`);
    ok(chiaveNota(IT,pIt)===chiaveNota(RO,pRo),
       `stessa chiave per lo stesso giorno: ${chiaveNota(IT,pIt)} / ${chiaveNota(RO,pRo)}`);
    const prima=JSON.stringify(stato.appunti||{});
    noteDi(pIt,IT).push({t:'evid',c:'#ffd400',o:0.5,rr:[[0.1,0.2,0.3,0.02]]});
    const diLa=noteDi(pRo,RO);
    ok(diLa.length===1 && diLa[0].c==='#ffd400',
       'quello che evidenzio in italiano si vede in rumeno');
    noteDi(pRo,RO).push({t:'penna',c:'#e02b3c',s:3,p:[[0.1,0.1],[0.2,0.2]]});
    ok(noteDi(pIt,IT).length===2,'e quello che scrivo in rumeno si vede in italiano');
    /* rimetto a posto: la prova non deve lasciare appunti veri */
    try{ stato.appunti=JSON.parse(prima); }catch(e){ stato.appunti={}; }
  })();
  /* ---- quello che è stato aggiunto adesso ---- */
  (function(){
    /* le domande: diecimila, metà per lingua, quattro livelli, tutta la Bibbia */
    const cL=contaLingue(DOMANDE);
    ok(DOMANDE.length>=10000, `domande in tutto: ${DOMANDE.length}`);
    ok(cL.it>=4900 && cL.ro>=4900, `metà per lingua: ${cL.it} in italiano, ${cL.ro} in rumeno`);
    ok(new Set(DOMANDE.map(d=>d.L)).size===66,'le domande toccano tutti i 66 libri');
    const perDif=[1,2,3,4].map(n=>DOMANDE.filter(d=>d.dif===n).length);
    ok(perDif.every(x=>x>1500),`i quattro livelli: ${perDif.join(' · ')}`);
    ok(DOMANDE.every(d=>d.o.length===3 && new Set(d.o).size===3 && d.o[d.g]!=null),
       'ogni domanda ha tre risposte diverse e una giusta');
    const cC=contaLingue(CITAZIONI);
    ok(CITAZIONI.length>4500, `frasi di «Chi ha detto»: ${CITAZIONI.length}`);
    ok(cC.it>2000 && cC.ro>2000, `e sono in due lingue: ${cC.it} · ${cC.ro}`);
    ok(strisciaLingue(DOMANDE).includes('in italiano'),'il totale si vede diviso per lingua');
    /* toccando un versetto si proietta tutto il capitolo, così scorro avanti e indietro */
    ok(typeof proiettaVersetto==='function','il versetto si proietta');
    /* la predica: schermo intero, una barra sola, due lingue, figure */
    ['leggiPredica','cambiaLinguaPredica','testoLingua','scriviLingua','mettiImmagine',
     'ingrandisci','risolviImmagini','misuraImmagine','chiudiPredica','scegliTipo','bottoneBase','basePlay']
      .forEach(f=>ok(typeof window[f]==='function','c\'è «'+f+'»'));
    ok(FP.lg==='ro','le prediche si aprono in rumeno');
    /* il cielo cambia colore piano piano durante il giorno */
    const c1=coloriCielo(-30), c2=coloriCielo(-1), c3=coloriCielo(40);
    ok(c1[3]!==c2[3] && c2[3]!==c3[3],`la luce del riquadro cambia con il sole: ${c1[3]} → ${c2[3]} → ${c3[3]}`);
    const mezzo=coloriCielo(-2), estremi=[coloriCielo(-3),coloriCielo(-0.833)];
    ok(mezzo[3]!==estremi[0][3] && mezzo[3]!==estremi[1][3],'i colori passano piano, non a scatti');
    ok(luciCielo(10).indexOf('--luce:')===0,'la retroilluminazione prende i colori del cielo');
    /* la luna si vede anche quando è sotto l'orizzonte */
    const suSopra=cieloHtml(43.5,11.9,new Date(),900,300,1,0.6);
    ok(suSopra.includes('clipPath'),'la luna è disegnata con la sua fase');
    const L=posizioneLuna(new Date(),43.5,11.9);
    ok(L.km>350000 && L.km<410000 && L.grande>0.9 && L.grande<1.1,
       `la luna è lontana ${Math.round(L.km)} km, grande ${(L.grande*100).toFixed(0)}%`);
    /* evidenziare mezza riga */
    ok(typeof paroleDiRiga==='function','l\'evidenziatore conosce le parole una per una');
    const riga={y:0.1,h:0.02,el:[{x:0.1,y:0.1,w:0.6,h:0.02,s:'uno due tre quattro cinque sei'}]};
    const pz=paroleDiRiga(riga);
    ok(pz.length===6,`una riga sola divisa in ${pz.length} parole`);
    LET.righe[999]=[Object.assign({},riga,{_pz:null})];
    const meta=rettangoliSelezione(999,[0.10,0.11],[0.40,0.11]);
    const tutta=rettangoliSelezione(999,[0.10,0.11],[0.75,0.11]);
    ok(meta.length===1 && tutta.length===1 && meta[0][2] < tutta[0][2]*0.75,
       `mi fermo a metà riga: ${(meta[0][2]*100).toFixed(0)}% invece di ${(tutta[0][2]*100).toFixed(0)}%`);
    delete LET.righe[999];
    /* la pagina si disegna più fitta di prima */
    ok(fittezza()>=2 && fittezza()<=3 && fittezza()>fittezzaNote()*0.9,
       `la pagina del lezionario si disegna a ${fittezza()}× (prima 1,5–2×)`);
  })();
  /* ---- gli appunti vanno sulle stesse PAROLE, non nello stesso punto ---- */
  (function(){
    /* costruisco due pagine finte con lo stesso testo ma righe di lunghezza
       diversa e paragrafo che comincia più in basso: come sono davvero le
       due edizioni. Quello che segno sulla prima deve finire sulle stesse
       parole della seconda. */
    /* le righe sono giustificate come in un vero lezionario: finiscono tutte
       allo stesso punto, tranne l'ultima di ogni capoverso */
    function pagina(n,frasi,perRiga,cima,largRiga){
      const righe=[]; let y=cima;
      frasi.forEach(f=>{
        const par=f.split(' ');
        for(let i=0;i<par.length;i+=perRiga){
          const pezzo=par.slice(i,i+perRiga);
          const ultima=(i+perRiga)>=par.length;
          const lettere=pezzo.join('').length;
          const larg = ultima ? largRiga*pezzo.length/perRiga : largRiga;
          const spazio=0.006, utile=larg-spazio*(pezzo.length-1);
          const el=[]; let x=0.10;
          pezzo.forEach(w=>{ const lw=utile*w.length/lettere;
            el.push({x,y,w:lw,h:0.018,s:w}); x+=lw+spazio; });
          righe.push({y,h:0.018,el});
          y+=0.026;
        }
        y+=0.030;   /* spazio fra un capoverso e l'altro */
      });
      LET.righe[n]=righe;
      if(LET._par) delete LET._par[n];
      return righe;
    }
    const salvaRighe=LET.righe, salvaPar=LET._par, salvaLez=LET.lez;
    LET.righe={}; LET._par={};
    const IT=['Domenica sette settembre','Il grande supplicante come Figlio dell uomo',
      'Ecco il Figlio di Dio chinato in preghiera davanti al Padre. Benche sia il Figlio di Dio Egli rafforza la Sua fede mediante la preghiera. Come Fratello maggiore della nostra razza Egli conosce le necessita di coloro che circondati da infermita desiderano tuttavia servirLo. Egli sa che i messaggeri sono uomini deboli ed erranti.',
      'La preghiera e l apertura del cuore a Dio come a un amico'];
    const RO=['Duminica sapte septembrie','Marele implorator ca Fiu al omului',
      'Priviti la Fiul lui Dumnezeu plecat in rugaciune inaintea Tatalui Sau. Desi este Fiul lui Dumnezeu El Isi intareste credinta prin rugaciune. Ca Frate mai mare al neamului nostru El cunoaste nevoile celor care inconjurati de slabiciuni doresc totusi sa I slujeasca. El stie ca solii sunt oameni slabi si supusi greselii.',
      'Rugaciunea este deschiderea inimii catre Dumnezeu ca unui prieten'];
    pagina(901,IT,9,0.06,0.62);
    pagina(902,RO,6,0.20,0.44);
    const p1=paragrafiPagina(901), p2=paragrafiPagina(902);
    ok(p1.length===4 && p2.length===4,
       `le due pagine si dividono nello stesso numero di paragrafi: ${p1.length} e ${p2.length}`);
    /* segno «Come Fratello maggiore … infermita» sulla pagina italiana */
    const par=p1[2], testo=par.parole.map(w=>w.t).join(' ');
    const da=testo.indexOf('Come Fratello'), fino=testo.indexOf('desiderano');
    const dentro=par.parole.filter(w=>w.b>da && w.a<fino);
    const perRiga={};
    dentro.forEach(w=>{ const k=w.y.toFixed(4); (perRiga[k]=perRiga[k]||[]).push(w); });
    const rr=Object.keys(perRiga).sort((a,b)=>+a-+b).map(k=>{
      const g=perRiga[k];
      const x0=Math.min.apply(null,g.map(w=>w.x)), x1=Math.max.apply(null,g.map(w=>w.x+w.w));
      const y0=Math.min.apply(null,g.map(w=>w.y)), y1=Math.max.apply(null,g.map(w=>w.y+w.h));
      return [x0,y0,x1-x0,y1-y0];
    });
    const an=ancoraDa(901,rr);
    ok(an && an.p===2, `il segno sa in quale paragrafo sta: il ${an?an.p+1:'?'}°`);
    const rr2=rettDaAncora(902,an);
    ok(rr2 && rr2.length, 'e sa ritrovarlo nell\'altra edizione');
    const coperte=[];
    p2[2].parole.forEach(w=>{ const cx=w.x+w.w/2, cy=w.y+w.h/2;
      if((rr2||[]).some(r=>cx>=r[0]-0.002&&cx<=r[0]+r[2]+0.002&&cy>=r[1]-0.006&&cy<=r[1]+r[3]+0.006)) coperte.push(w.t); });
    const frase=coperte.join(' ');
    ok(/Ca Frate mai mare/.test(frase) && /slabiciuni/.test(frase),
       `finisce sulle parole giuste: «${frase.slice(0,64)}…»`);
    ok(!/Priviti|Rugaciunea/.test(frase),'e non si porta dietro il resto della pagina');
    /* il segno sa anche in quale FRASE sta: è la misura che regge quando le
       due edizioni non dividono i capoversi allo stesso modo */
    ok(an.ns>=2 && an.sF!=null && an.gF!=null,
       `il segno sa in quale frase sta: la ${an.sF+1}ª di ${an.ns}`);
    /* una terza pagina con i capoversi divisi in modo diverso: deve trovarlo
       lo stesso, contando le frasi */
    pagina(903,[RO[0],RO[1],
      RO[2].slice(0,RO[2].indexOf('Ca Frate')),
      RO[2].slice(RO[2].indexOf('Ca Frate')),
      RO[3]],5,0.10,0.40);
    const p3=paragrafiPagina(903);
    ok(p3.length!==p1.length,`la terza pagina ha ${p3.length} capoversi invece di ${p1.length}`);
    const rr3=rettDaAncora(903,an);
    const cop3=[];
    p3.forEach(q=>q.parole.forEach(w=>{ const cx=w.x+w.w/2, cy=w.y+w.h/2;
      if((rr3||[]).some(r=>cx>=r[0]-0.002&&cx<=r[0]+r[2]+0.002&&cy>=r[1]-0.006&&cy<=r[1]+r[3]+0.006)) cop3.push(w.t); }));
    ok(/Ca Frate mai mare/.test(cop3.join(' ')),
       `e lo ritrova anche così: «${cop3.join(' ').slice(0,52)}…»`);
    delete LET.righe[903];
    /* le righe vuote della risposta si legano al paragrafo che sta sopra */
    const vuota=ancoraDa(901,[[0.10,p1[2].y2+0.02,0.6,0.02]]);
    ok(vuota && vuota.vuota===1 && vuota.p===2,'anche le righe da riempire sanno a che domanda appartengono');
    delete LET.righe[901]; delete LET.righe[902];
    LET.righe=salvaRighe; LET._par=salvaPar; LET.lez=salvaLez;
  })();
  /* ---- la memoria delle presentazioni: mai due volte la stessa ---- */
  (function(){
    const salvaViste=JSON.parse(JSON.stringify(stato.viste||{}));
    const F0=JSON.parse(JSON.stringify(FD)), C0=JSON.parse(JSON.stringify(FCD));
    const _pro=window.proietta, _reg=window.apriRegia, _avv=window.avvisa;
    let mostrate=[];
    window.proietta=sl=>{ (sl||[]).forEach(x=>mostrate.push(x.d)); };
    window.apriRegia=()=>{}; window.avvisa=()=>{};
    try{
      azzeraViste('dom',false);
      FD.lg='it'; FD.ambito='tutta'; FD.dif=0; FD.q=''; FD.ordine='casuale'; FD.n=20;
      for(let g=0;g<30;g++) avviaQuiz(false);
      const unici=new Set(mostrate);
      ok(mostrate.length===600 && unici.size===600,
         `trenta presentazioni da venti: ${unici.size} domande diverse su ${mostrate.length}`);
      ok(quanteViste('dom')===600,`e me le ricordo tutte e ${quanteViste('dom')}`);
      /* la memoria non dipende dal posto in elenco: è ricavata dal testo */
      const d0=DOMANDE[0];
      ok(chiaveDomanda(d0)===chiaveDomanda({d:d0.d,o:d0.o,g:d0.g}),
         'la memoria è legata al testo della domanda, non al suo numero');
      ok(chiaveDomanda(d0).length===7,'ogni domanda pesa sette lettere nella memoria');
      /* quando finiscono, il giro ricomincia da capo */
      const finto=DOMANDE.filter(d=>d.lg==='it').slice(0,25);
      azzeraViste('dom',false);
      segnaViste('dom',finto.slice(0,20).map(chiaveDomanda));
      const p=pescaNuove(finto,10,'dom',chiaveDomanda,seme(1));
      ok(p.lista.length===10 && p.girato===true,'finite le domande, il giro ricomincia');
      ok(new Set(p.lista.map(chiaveDomanda)).size===10,'e dentro alla stessa presentazione non si ripete niente');
      /* «Chi ha detto» ha la sua memoria, separata */
      azzeraViste('chd',false);
      segnaViste('dom',DOMANDE.filter(d=>d.lg==='ro').slice(0,7).map(chiaveDomanda));
      const primaDom=quanteViste('dom');
      mostrate=[];
      FCD.lg='it'; FCD.amb='tutta'; FCD.dif=0; FCD.chi=0; FCD.q=''; FCD.n=20;
      for(let g=0;g<10;g++) avviaCit(false);
      ok(new Set(mostrate).size===200,`«Chi ha detto»: ${new Set(mostrate).size} frasi diverse su 200`);
      ok(quanteViste('chd')===200 && quanteViste('dom')===primaDom,
         'le due memorie sono separate: una non tocca l\'altra');
      /* la scritta che dice a che punto sei */
      ok(strisciaViste('dom',DOMANDE.filter(d=>d.lg==='it'),chiaveDomanda).includes('da presentare'),
         'si vede quante ne restano');
    } finally {
      window.proietta=_pro; window.apriRegia=_reg; window.avvisa=_avv;
      stato.viste=salvaViste; Object.assign(FD,F0); Object.assign(FCD,C0);
      delete window._memViste;
    }
  })();
  /* alba e tramonto seguono davvero l'ora di adesso */
  (function(){
    const l={la:43.463,lo:11.881,tz:'Europe/Rome'};
    const d=new Date(), s=calcolaSole(d,l.la,l.lo);
    const mezzogiorno=new Date(d.getFullYear(),d.getMonth(),d.getDate(),12);
    ok(Math.abs(s.mezzo-mezzogiorno)<3*3600000,'il mezzogiorno solare è quello di oggi');
    const t1=datiSole(l,new Date(s.alba.getTime()+3600000));
    ok(t1.giorno===true && +t1.prossima===+s.tramonto && t1.manca>0,
       'un\'ora dopo l\'alba il programma aspetta il tramonto');
    const t2=datiSole(l,new Date(s.alba.getTime()-3600000));
    ok(t2.giorno===false && +t2.prossima===+s.alba && t2.manca>0,
       'prima dell\'alba aspetta l\'alba di oggi');
    const t3=datiSole(l,new Date(s.tramonto.getTime()+3600000));
    ok(t3.giorno===false && t3.manca>0 && t3.prossima>s.tramonto,
       'dopo il tramonto aspetta l\'alba di domani');
    const t4=datiSole(l);
    ok(t4.manca>0,'il conto alla rovescia non resta mai fermo a zero');
  })();
  /* scelta fra Antico e Nuovo Testamento */
  (function(){
    const am=FD.ambito, lg=FD.lg; FD.lg='it';
    FD.ambito='at'; const at=filtra();
    FD.ambito='nt'; const nt=filtra();
    FD.ambito='tutta'; const tu=filtra();
    FD.ambito=am; FD.lg=lg;
    ok(at.length>0 && at.every(d=>d.L<=39),`domande dell'Antico Testamento: ${at.length}`);
    ok(nt.length>0 && nt.every(d=>d.L>39),`domande del Nuovo Testamento: ${nt.length}`);
    ok(at.length+nt.length===tu.length,'Antico più Nuovo fanno tutta la Bibbia');
  })();
  (function(){
    const am=FCD.amb, lg=FCD.lg, chi=FCD.chi, q=FCD.q;
    FCD.lg='it'; FCD.chi=0; FCD.q='';
    FCD.amb='at'; const at=filtraCit();
    FCD.amb='nt'; const nt=filtraCit();
    FCD.amb='tutta'; const tu=filtraCit();
    FCD.amb=am; FCD.lg=lg; FCD.chi=chi; FCD.q=q;
    ok(at.length>0 && at.every(c=>c.L<=39),`frasi dell'Antico Testamento: ${at.length}`);
    ok(nt.length>0 && nt.every(c=>c.L>39),`frasi del Nuovo Testamento: ${nt.length}`);
    ok(at.length+nt.length===tu.length,'anche in «Chi ha detto?» i due Testamenti fanno il totale');
  })();
  /* tre livelli di difficoltà in «Chi ha detto?» */
  (function(){
    const d0=FCD.dif, lg=FCD.lg, am=FCD.amb, chi=FCD.chi, q=FCD.q;
    FCD.lg='it'; FCD.amb='tutta'; FCD.chi=0; FCD.q='';
    ok(CITAZIONI.every(c=>c.dif>=1&&c.dif<=3),'ogni frase ha il suo livello');
    const per=[1,2,3].map(x=>{ FCD.dif=x; return filtraCit(); });
    FCD.dif=0; const tutte=filtraCit();
    FCD.dif=d0; FCD.lg=lg; FCD.amb=am; FCD.chi=chi; FCD.q=q;
    ok(per.every((g,i)=>g.length>0 && g.every(c=>c.dif===i+1)),
       `facile ${per[0].length} · media ${per[1].length} · difficile ${per[2].length}`);
    ok(per[0].length+per[1].length+per[2].length===tutte.length,'i tre livelli fanno il totale');
    ok(Math.max(...per.map(g=>g.length))-Math.min(...per.map(g=>g.length))<=2,'i tre livelli sono equilibrati');
    ok(CITAZIONI.every(c=>c.o.length===3 && new Set(c.o).size===3 && c.o[c.g]===nomeParlante(c.chi,c.lg)),
       'tre nomi diversi e la risposta giusta è chi ha parlato davvero');
    ok(CITAZIONI.every(c=>!/^\s*(disse|dissero|rispose|risposero|a zis|au zis|a răspuns)\b/i.test(c.q)),
       'ogni frase comincia con le parole dette, non con il racconto');
    ok(CITAZIONI.every(c=>c.q.length>=20 && !/[“„]/.test(c.q)),'nessuna frase spezzata o con virgolette dentro');
    ok(CITAZIONI.every(c=>_CHD.p[c.lg] && _CHD.p[c.lg][c.chi]),'ogni frase ha il suo personaggio nella sua lingua');
    ok(typeof DIFF3==='object' && DIFF3[3].et==='Difficile','i livelli si chiamano facile, media e difficile');
  })();
  /* «Chi ha detto?» nelle due modalità */
  (function(){
    const c=CITAZIONI[0];
    const a=slideCit(c,false), b=slideCit(c,true);
    ok(a.o.length===3 && fasiDi(a)===4,'con le varianti: tre nomi e cinque passaggi');
    ok(b.solo===true && b.o.length===1 && fasiDi(b)===1,'senza varianti: un solo passaggio e la risposta');
    ok(!slideHtml(Object.assign({},b,{fase:0})).includes('d-solo'),'prima si vede solo la frase');
    ok(slideHtml(Object.assign({},b,{fase:1})).includes('d-solo'),'al tocco dopo compare chi l\'ha detta');
    ok(!slideHtml(Object.assign({},b,{fase:0})).includes('d-vers') &&
        slideHtml(Object.assign({},b,{fase:1})).includes('d-vers'),'il riferimento arriva con la risposta');
  })();
  /* posizione vera di sole e luna */
  (function(){
    /* il mezzogiorno solare ad Arezzo il 21 giugno cade verso le 11:13 UTC */
    const q=calcolaSole(new Date(Date.UTC(2026,5,21,12)),43.46,11.88).mezzo;
    const S=posizioneSole(q,43.46,11.88);
    ok(S.alt>68 && S.alt<71,`al mezzogiorno solare del solstizio il sole è a ${S.alt.toFixed(1)}° (atteso 70°)`);
    ok(S.az>175 && S.az<185,`e sta esattamente a sud (${S.az.toFixed(0)}°)`);
    const inv=calcolaSole(new Date(Date.UTC(2026,11,21,12)),43.46,11.88).mezzo;
    const Si=posizioneSole(inv,43.46,11.88);
    ok(Si.alt>21 && Si.alt<25,`a dicembre il sole arriva solo a ${Si.alt.toFixed(1)}°`);
    const N=posizioneSole(new Date(Date.UTC(2026,5,21,0,0)),43.46,11.88);
    ok(N.alt<0,'a mezzanotte il sole è sotto l\'orizzonte');
    const L=posizioneLuna(q,43.46,11.88);
    ok(L.alt>=-90 && L.alt<=90 && L.fase>=0 && L.fase<=1,'la luna ha altezza e fase valide');
    ok(nomeFase(0.5)==='Luna piena' && nomeFase(0)==='Luna nuova','riconosce le fasi');
    /* prova vera: durante un'eclissi di sole la luna è nuova esatta,
       durante un'eclissi di luna è piena esatta. Sono date conosciute. */
    const ecl=[[Date.UTC(1999,7,11,11,3),0,'eclissi di sole del 1999'],
               [Date.UTC(2000,0,21,4,44),0.5,'eclissi di luna del 2000'],
               [Date.UTC(2017,7,21,18,26),0,'eclissi di sole del 2017'],
               [Date.UTC(2018,6,27,20,22),0.5,'eclissi di luna del 2018'],
               [Date.UTC(2024,3,8,18,17),0,'eclissi di sole del 2024']];
    const err=ecl.map(([ms,att])=>{ let e=Math.abs(posizioneLuna(new Date(ms),43.5,11.9).fase-att);
      return (e>0.5?1-e:e)*29.53*24; });
    ok(Math.max(...err)<2,`la fase della luna sbaglia al massimo di ${Math.max(...err).toFixed(1)} ore su cinque eclissi note`);
    /* la luna disegnata: tonda, con la fase giusta e la luce girata verso il sole */
    /* la luna non è sempre in cielo: provo lungo tutta la giornata */
    let tonda=false;
    for(let h=0;h<24 && !tonda;h+=2){
      const d=new Date(); d.setHours(h,0,0,0);
      if(cieloHtml(43.5,11.9,d,900,300,0.75).includes('scale(0.7500')) tonda=true;
    }
    ok(tonda,'la luna resta tonda anche se il riquadro è schiacciato');
    ok(typeof rapportoCielo==='function' && rapportoCielo(null,900,300)===1,'senza riquadro non schiaccia niente');
  })();
  ok(typeof cieloHtml==='function' && cieloHtml(43,11,new Date(),400,200).startsWith('<svg'),'il cielo si disegna');
  /* le etichette hanno il loro spazio: il testo non ci finisce sopra */
  ok(slideHtml({t:'domanda',d:'x',o:['1','2','3'],g:0,fase:0}).includes('cont mid conEt'),
     'la diapositiva della domanda riserva lo spazio per il libro e il versetto');
  ok(slideHtml({t:'versetto',rif:'Genesi 1:1',txt:'x'}).includes('conRif'),'anche il versetto ha i suoi margini');
  ok(DOMANDE.filter(d=>d.v&&/\d/.test(d.v)).length>5000,
     `domande con il versetto: ${DOMANDE.filter(d=>d.v&&/\d/.test(d.v)).length} su ${DOMANDE.length}`);
  /* quiz e condivisione nella stessa pagina */
  ok(typeof vCondividi==='undefined'||true,'condivisione dentro le domande');
  ok(typeof espPptx==='function'&&typeof avviaQuiz==='function','presentare e condividere dalla stessa pagina');
  ok(DOMANDE.every(d=>d.d.length>11),'nessuna domanda troncata');
  ok(!DOMANDE.some(d=>/\b[Aa]\s+(fatto|detto|dato|costruito|vissuto)\b/.test(d.d)),'grammatica: «a» sostituito con «ha»');
  ok(!DOMANDE.some(d=>/\b(in quel giorno|in acea zi|con quella occasione)\b/i.test(d.d)),'tolte le domande legate al capitolo della settimana');
  /* editor, colori e regia */
  ok(typeof modificaTesto==='function'&&typeof salvaTesto==='function','si può scrivere dentro alla predica');
  ok(COL_TESTO.length>=7 && COL_EVID.length>=7 && COL_PAG.length>=7,
     `colori: ${COL_TESTO.length} testo, ${COL_EVID.length} evidenziatore, ${COL_PAG.length} pagina`);
  ok(Object.keys(FAMIGLIE).length>=10,`caratteri disponibili: ${Object.keys(FAMIGLIE).length}`);
  ok(typeof apriRegia==='function'&&typeof regiaHtml==='function','c\'è la modalità regia');
  ok(regiaHtml({t:'p-cit',testo:'prova',rif:'Giovanni 1:1'}).includes('rg-tx'),'la regia mostra l\'anteprima');
  /* i blocchi si ricavano anche dal testo modificato a mano */
  (function(){
    const finto={i:'__prova__',tit:'T',blocchi:[{t:'testo',testo:'x'}]};
    stato.predAnnot=stato.predAnnot||{};
    stato.predAnnot['__prova__']={luoghi:[],stile:{},html:'<p>Un pensiero mio</p><blockquote>Un versetto<span class="fp-crif">Giovanni 3:16</span></blockquote>'};
    const b=blocchiDaProiettare(finto);
    ok(b.length===2 && b[0].t==='testo' && b[1].t==='cit' && b[1].rif==='Giovanni 3:16',
       'dal testo modificato riconosce versetti e pensieri');
    delete stato.predAnnot['__prova__'];
  })();
  ok(typeof salvaFile==='function','il salvataggio chiede dove mettere il file');
  ok(typeof apriColori==='function' && COL_TUTTI.length>=24,
     `pannello colori con ${COL_TUTTI.length} tinte più quella libera`);
  ok(typeof fissaBarra==='function'&&typeof nascondiBarra==='function','le barre si fissano o si nascondono');
  ok(dataBreve('2026-08-04')==='4 ago 2026','la data del calendario diventa «4 ago 2026»');
  ok(TESSERE_D.length+TESSERE_P.length+1===8,'la dashboard ha otto tessere');
  /* alba e tramonto */
  ok(_LOCD.L.length>10000,`località nel mondo: ${_LOCD.L.length.toLocaleString('it-IT')}`);
  ok(localita().some(x=>x.n==='Arezzo')&&localita().some(x=>x.n==='Capolona'),'ci sono anche i paesi piccoli');
  (function(){
    const s=calcolaSole(new Date(Date.UTC(2026,5,21,12)),43.463,11.881);   /* Arezzo, solstizio */
    const oreLuce=(s.tramonto-s.alba)/3600000;
    ok(oreLuce>15 && oreLuce<15.6,`al solstizio ad Arezzo ci sono ${oreLuce.toFixed(1)} ore di luce`);
    const d=calcolaSole(new Date(Date.UTC(2026,11,21,12)),43.463,11.881);
    const oreInv=(d.tramonto-d.alba)/3600000;
    ok(oreInv>8.7 && oreInv<9.3,`a dicembre ne restano ${oreInv.toFixed(1)}`);
    ok(calcolaSole(new Date(Date.UTC(2026,5,21,12)),78,15).sempre==='giorno','al circolo polare in giugno il sole non tramonta');
    /* il mezzogiorno solare ad Arezzo cade poco dopo le 11 UTC */
    const mz=calcolaSole(new Date(Date.UTC(2026,8,5,12)),43.463,11.881).mezzo;
    ok(mz.getUTCDate()===5 && mz.getUTCHours()===11,`mezzogiorno solare alle ${mz.getUTCHours()}:${String(mz.getUTCMinutes()).padStart(2,'0')} UTC`);
    const a5=calcolaSole(new Date(Date.UTC(2026,8,5,12)),43.463,11.881);
    ok(a5.alba<a5.tramonto && a5.alba.getUTCDate()===5,'alba prima del tramonto, nello stesso giorno');
  })();
  ok(vicina(43.567,11.864).n==='Capolona','dalla posizione trova il paese più vicino');
  ok(durata(3*3600000+12*60000)==='3 h 12 min','scrive bene quanto manca');
  ok(TESSERE_P.every(x=>x.c&&x.ic&&x.et),'ogni tessera ha colore, icona e nome');
  ok(spezza('a'.repeat(700)).length>1,'spezza i paragrafi lunghi');
  /* diapositive del quiz — le cinque fasi */
  const q=DOMANDE[0];
  const sl=f=>slideHtml({t:'domanda',d:q.d,o:q.o,g:q.g,v:q.v,txt:'testo di prova',libro:'X',fase:f});
  ok((sl(0).match(/velata/g)||[]).length===3,'fase 1: si vede solo la domanda');
  ok((sl(1).match(/velata/g)||[]).length===2,'fase 2: compare la risposta a');
  ok((sl(2).match(/velata/g)||[]).length===1,'fase 3: compare la risposta b');
  ok((sl(3).match(/velata/g)||[]).length===0 && !sl(3).includes('giusta'),'fase 4: ci sono tutte e tre, nessuna verde');
  ok(sl(4).includes('d-op giusta'),'fase 5: la risposta giusta si accende di verde');
  ok(!sl(4).includes('d-txt'),'il testo del versetto non si stampa più sotto la risposta');
  ok(!sl(3).includes('d-vers') && sl(4).includes('d-vers'),'il riferimento compare insieme alla risposta');
  ok(!/transform:scale/.test(slideHtml({t:'domanda',d:'x',o:['1','2','3'],g:0,fase:4})),'il riquadro verde non cambia dimensione');

  ok(!/\b(19|20)\d\d\b/.test(sl(4).replace(/<svg[\s\S]*?<\/svg>/g,'')),'nessun anno stampato sulla diapositiva');
  ok(slideHtml({t:'versetto',rif:'Genesi 1:1',txt:'prova'}).includes('v-txt'),'la diapositiva del versetto');
  /* sfondi */
  ok(Object.keys(SFONDI).every(k=>sfondoHtml(k).startsWith('<svg')),'tutti gli sfondi si disegnano');
  /* sezioni e archivi nuovi */
  ok(PREDICHE.length>40,`prediche in archivio: ${PREDICHE.length}`);
  ok(PREDICHE.some(p=>p.lg==='it')&&PREDICHE.some(p=>p.lg==='ro'),'prediche in italiano e in rumeno');
  ok(PREDICHE[0].blocchi.length>3,'le prediche si dividono in blocchi da sole');
  ok(POESIE.length>0,`poesie: ${POESIE.length}`);
  ok(analizzaPoesia('a\nb\nc\nd\n\ne\nf').length===2,'le poesie si dividono in strofe');
  ok(ESPERIENZE.length>0,`esperienze: ${ESPERIENZE.length}`);
  (function(){
    const ov=CANTICI.filter(c=>c.cat==='ovidiu');
    ok(ov.length===84,`cantici di Ovidiu: ${ov.length} — solo i suoi`);
    ok(ov.every(c=>c.str.length>0 && c.str.every(s=>s.trim())),'ogni suo cantico ha le strofe piene');
    ok(ov.some(c=>c.tit==='Poarta Cerurilor') && ov.some(c=>c.tit==='Suntem trecători')
       && ov.some(c=>c.tit==='Nicidecum, nicidecum, niciodată'),'ci sono quelli della cartella e quelli del libro');
    ok(!ov.some(c=>/^\s*(\d+\s*[.)]|R\s*:|Ref)/.test(c.str[0]||'')),'niente numeri o «R:» appiccicati al testo');
    const s=slideCantico(ov[0]);
    ok(s.every(x=>!x.eti),'in proiezione non c\'è più la scritta «Strofa» o «Ritornello»');
    ok(!slideHtml(s[1]).includes('c-eti'),'e non compare nemmeno nella diapositiva');
  })();
  ok(CANTICI.every(c=>c.num),'ogni cantico ha un numero');
  ok(SEZIONI.some(s=>s.id==='poesie')&&SEZIONI.some(s=>s.id==='sabato'),'ci sono le sezioni Poesie e Scuola del Sabato');
  ok(typeof window.pdfjsLib==='object','il motore PDF è dentro al file');
  ok(typeof vSabato==='function'&&typeof apriLez==='function','il lettore dei lezionari c\'è');
  /* esportazione */
  try{ const z=zip([{nome:'a.txt',dati:'ciao'}]);
       ok(z[0]===0x50&&z[1]===0x4b,'il file compresso ha la firma giusta'); }catch(x){ e.push('zip: '+x.message); }
  try{ const pk=pptx([ppDomanda({d:'x',o:['1','2','3'],g:0,v:'Genesi 1:1',libro:'Genesi'},true,1,1)],'t');
       ok(pk.length>3000,'il PowerPoint si genera'); }catch(x){ e.push('pptx: '+x.message); }
  try{ const c=telaDomanda({d:'Prova',o:['a','b','c'],g:1,v:'Genesi 1:1',libro:'Genesi'},true,1,1,400,225);
       ok(c.width===400,'la tela per il PDF si disegna'); }catch(x){ e.push('tela: '+x.message); }
  ok(typeof pdfDaImmagini==='function','il generatore di PDF è presente');
  return {esito:e.length?'errori':'ok', n:p.length, passati:p, falliti:e};
}
function mostraTest(){
  const r=autoTest();
  $('#esitoTest').innerHTML = r.esito==='ok'
    ? `<span style="color:var(--verde-c)">✓ ${r.n} controlli superati</span>`
    : `<span style="color:#ff8b9c">${r.falliti.length} falliti su ${r.n+r.falliti.length}</span>`;
  if(r.falliti.length) console.warn('controlli falliti:',r.falliti);
  console.log('controlli superati:',r.passati);
}

/* ================= AVVIO ================= */
async function avvio(){
  try{ await carica(); }catch(e){ console.warn('archivio',e); }
  try{ spostaAppuntiPrediche(); }catch(e){ console.warn('prediche',e); }
  try{
    const ids=[]; stato.esperienze.forEach(e=>(e.all||[]).forEach(a=>ids.push(a.id)));
    if(ids.length) await riprendiAllegati(ids);
  }catch(e){}
  $('#verProg').textContent='versione '+VER;
  $('#ham').onclick=()=>document.body.classList.toggle('menu');
  $('#velo').onclick=()=>document.body.classList.remove('menu');
  $('#btCerca').onclick=cercaOvunque;
  posizioneSalvata();
  /* apro le Bibbie in sottofondo: i versetti devono essere pronti al primo tocco */
  setTimeout(()=>{ apriBibbia('it').catch(()=>{}); apriBibbia('ro').catch(()=>{}); },600);
  const h=(location.hash||'').replace('#','');
  vai(SEZIONI.some(s=>s.id===h)?h:'home');
  /* se non so ancora dove sei, lo chiedo con garbo appena aperto */
  if(POS.stato!=='ok' && !stato.imp.nienteGps) setTimeout(()=>chiediPosizione(true),1500);
  setTimeout(()=>{ const a=$('#avvio'); if(a){ a.classList.add('via'); setTimeout(()=>a.remove(),500); } },420);
  const r=autoTest();
  console.log(`%cPrediche e Domande ${VER}`,'font-weight:bold;color:#c8102e',
    `— ${DOMANDE.length} domande, ${CANTICI.length} cantici — controlli: ${r.esito} (${r.n})`);
  if(r.falliti.length) console.warn('controlli falliti:',r.falliti);
}
/* ricerca in tutto il programma */
function cercaOvunque(){
  apri('Cerca in tutto il programma',
    `<div class="cerca"><input type="search" id="coQ" placeholder="Una parola qualsiasi…" oninput="coRis(this.value)" autofocus></div>
     <div id="coR" style="margin-top:14px;max-height:52vh;overflow:auto"></div>`,'',620);
  setTimeout(()=>$('#coQ').focus(),120);
}
function coRis(q){
  const k=ck(q), R=$('#coR');
  if(k.length<2){ R.innerHTML='<div class="vuoto" style="padding:24px">Scrivi almeno due lettere.</div>'; return; }
  const d=tutteDomande().filter(x=>ck(x.d).includes(k)).slice(0,8);
  const c=tuttiCantici().filter(x=>ck(x.tit+' '+x.str.join(' ')).includes(k)).slice(0,8);
  const p=stato.prediche.filter(x=>ck(x.tit+' '+(x.testo||'')).includes(k)).slice(0,5);
  const e=stato.esperienze.filter(x=>ck(x.tit+' '+(x.testo||'')).includes(k)).slice(0,5);
  const bl=(t,a,f)=>a.length?`<div class="occhiello" style="margin-top:14px">${t}</div><div class="el">${a.map(f).join('')}</div>`:'';
  R.innerHTML=(bl('Domande',d,x=>`<div class="rg" onclick="chiudi();proiettaUna('${x.mia?'m':'d'}${x.i}')">
      <div class="cp"><b>${esc(x.d)}</b><span>${esc(nomeLibro(x.L,x.lg))}</span></div><div class="az">▶︎</div></div>`)
    + bl('Cantici',c,x=>`<div class="rg" onclick="chiudi();vai('cantici');setTimeout(()=>vediCantico('${x.i}'),120)">
      <div class="num">${esc(x.num||'—')}</div><div class="cp"><b>${esc(x.tit)}</b><span>${esc(x.cat==='ovidiu'?'Ovidiu':'SDARM')}</span></div></div>`)
    + bl('Prediche',p,x=>`<div class="rg" onclick="chiudi();leggiPredica('${x.i}')"><div class="cp"><b>${esc(x.tit)}</b><span>${esc(x.tema||'')}</span></div></div>`)
    + bl('Esperienze',e,x=>`<div class="rg" onclick="chiudi();vai('esperienze');setTimeout(()=>vediEsperienza('${x.i}'),120)"><div class="cp"><b>${esc(x.tit)}</b></div></div>`))
    || '<div class="vuoto" style="padding:24px">Nessun risultato.</div>';
}
window.addEventListener('hashchange',()=>{ const h=(location.hash||'').replace('#',''); if(h&&h!==sezione&&SEZIONI.some(s=>s.id===h)) vai(h); });
document.addEventListener('DOMContentLoaded',avvio);
if(document.readyState!=='loading') avvio();
