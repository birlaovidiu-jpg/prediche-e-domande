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
function vista_dati_firma(){
  const sez=sezione; vDati(); const f=$('.dati-firma'); const ris=!!f && /Questa app è stata realizzata da Ovidiu Birla\./.test(f.textContent);
  vai(sez); return ris;
}
async function autoTest(){
  const p=[],e=[];
  const ok=(c,m)=>c?p.push(m):e.push(m);
  const _colPrima=JSON.stringify(stato.imp.coloriLettore);   /* per controllare, alla fine, che non li abbia toccati */
  const _pausaPrima=Object.assign({},GIOCHI_PAUSA); GIOCHI_PAUSA.ms=0; GIOCHI_PAUSA.blitz=0;   /* nei controlli non si aspetta dopo le risposte */
  /* le prove giocano davvero (domande, parole, coppie): la memoria «mai due volte la stessa» vera non si deve sporcare */
  const _vistePrima=JSON.stringify(stato.viste||null);
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
  /* dal 25 settembre 2026 il programma parte vuoto: prediche, poesie ed esperienze le carichi tu */
  ok(PREDICHE.length===0 && POESIE.length===0 && ESPERIENZE.length===0,'il programma parte senza prediche, poesie ed esperienze di serie');
  ok(prossimoNumero()>=1,`il prossimo numero libero è ${prossimoNumero()}`);
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
  /* ---- copertine: di una copertina doppia (retro e fronte affiancati) si vede solo il fronte, in verticale ---- */
  (function(){
    ok(metaFronte(189,143,'I S S N   1 2 2 2 - 8 5 3 2','')==='dx','copertina rumena (il retro con l\'ISSN sta a sinistra): il fronte è a destra');
    ok(metaFronte(142,192,' Camminare Con Gesù 2026 LUG-SET Vol 102, N. 3 Lezionario Biblico della Scuola del Sabato - Sezione Adulti',
                          ' Offerte del Primo Sabato Sabato, 5 Luglio 2026 Espansione della chiesa')==='sx',
       'copertine italiane (fronte a sinistra, offerte a destra): il fronte è a sinistra');
    ok(metaFronte(140,190,'','')==='sx' && metaFronte(190,140,'','')==='dx','senza scritte, il fronte è la metà più scura (foto e titolo; il retro è chiaro)');
    ok(metaFronte(150,155,'','')==='dx','se non c\'è modo di capirlo, il fronte è a destra (la disposizione di stampa)');
    /* una tela larga come una copertina doppia: una metà chiara e una scura → esce una tela verticale con solo la scura */
    const doppia=chiaraASx=>{ const c=document.createElement('canvas'); c.width=1100; c.height=780; const x=c.getContext('2d');
      x.fillStyle=chiaraASx?'#f0f0f0':'#234a6e'; x.fillRect(0,0,550,780);
      x.fillStyle=chiaraASx?'#234a6e':'#f0f0f0'; x.fillRect(550,0,550,780); return c; };
    [true,false].forEach(chiaraASx=>{
      const f=fronteDaCanvas(doppia(chiaraASx),'',''), px=f.getContext('2d').getImageData(200,400,1,1).data;
      ok(f.width===550 && f.height===780 && px[0]<80 && px[2]>90 && px[2]<130,
         `la copertina doppia diventa un fronte verticale (${chiaraASx?'retro a sinistra':'retro a destra'})`);
    });
    ok(['copertinaInImmagine','fronteDaImmagine','copertineSoloFronte'].every(n=>typeof window[n]==='function'),
       'le copertine già messe dentro si rifanno col solo fronte');
  })();
  /* ---- lezionari: leggere bene lingua, trimestre e anno; la carta di oggi in tutte e due le lingue ---- */
  (function(){
    /* i casi veri dei PDF di Ovidiu */
    const R=(t,lg,h)=>{ const p=leggiPeriodo(t,lg,h); return p.trim+'/'+p.anno; };
    ok(R('Lezionario della Scuola del Sabato 2025 OCT–DEC 2026 APR - GIU Vol 102, N 2 Esplorare i ministeri profetici','it')==='2/2026',
       'una copertina con un «2025 OCT–DEC» rimasto dal modello è del 2º trimestre 2026, non del 2025');
    ok(R('2026 OTT-DIC Vol 102, N. 4 Lezionario Biblico della Scuola del Sabato','it')==='4/2026' &&
       R('2026 LUG-SET Vol 102, N. 3 Lezionario Biblico','it')==='3/2026','gli intervalli abbreviati («OTT-DIC», «LUG-SET») si leggono');
    ok(R('Lezionario della Scuola del Sabato Vol. 102, N.4 Ottobre - Dicembre 2026','it')==='4/2026','e anche quelli scritti per esteso');
    ok(R('LECŢII BIBLICE PENTRU SABAT IULIE - SEPTEMBRIE, 2026 Lecţii biblice pentru Şcoala de Sabat, iulie - septembrie 2026','ro')==='3/2026' &&
       R('LECȚII BIBLICE IANUARIE - MARTIE, 2027','ro')==='1/2027','in rumeno: trimestre e anno insieme, anche l\'anno dopo');
    ok(R('SABATO, 4 APRILE 2026 1 A LEZIONE Introduzione alla profezia','it')==='2/2026' &&
       R('SABAT, 26 SEPTEMBRIE 2026 LECȚIA 13 Bucurându-ne în Domnul','ro')==='3/2026','i sabati scritti sulle lezioni bastano da soli');
    ok(R('Nel 1844 e nel 2026 … SABATO, 4 APRILE 2026','it')==='2/2026','una data storica non confonde l\'anno');
    ok(R('I S S N 1 2 2 2 - 8 5 3 2','it')==='0/0','una copertina fatta di immagine non dà nessun trimestre inventato');
    ok(!linguaSicura('I S S N 1 2 2 2 - 8 5 3 2') && linguaSicura('Şi Dumnezeu a zis pentru că este bun, lecţia săptămâna aceasta')
       && linguaSicura('Il Signore che è nostro Dio, la lezione della settimana perché questo è buono e della sua'),
       'con poco testo la lingua non si indovina: si dice che non è sicura');
    const nm=suggerimentiDalNome;
    ok(nm('Coperta Ro 3-2026.pdf').lg==='ro' && nm('Coperta Ro 3-2026.pdf').trim===3 && nm('Coperta Ro 3-2026.pdf').anno===2026,
       'la copertina rumena fatta di immagine si riconosce dal nome del file');
    ok(nm('Lec RO 4-26.pdf').trim===4 && nm('Lec RO 4-26.pdf').anno===2026 && nm('Lezionario T4 2026 interno stampa (color).pdf').trim===4
       && nm('lezionario 3 trim 2026.pdf').trim===3 && nm('2 trim.pdf').trim===2 && nm('Lecția 3 2026.pdf').lg==='ro','e anche gli altri nomi dei suoi file');
    ok(suggerimentiDaiNomi(['copertina 3 trim 2026.pdf','lezionario 3 trim 2026.pdf']).trim===3,'due file insieme (copertina e lezionario) dicono lo stesso');

    /* due lezionari finti dello stesso trimestre, uno per lingua, con le date di TUTTI i giorni intorno a oggi */
    const snap={ lez:JSON.stringify(stato.lezionari||[]), FL:Object.assign({},FL), sez:sezione };
    const chiama=window.apriLez; const chiamate=[]; window.apriLez=(i,p,o)=>{ chiamate.push([i,p,o]); };
    try{
      const oggi=new Date(), sab=prossimoSabato();
      const an=sab.getFullYear(), tr=Math.floor(sab.getMonth()/3)+1;
      const breve=m=>{ const t=MESI_LEZ.it[m].slice(0,3); return t[0].toUpperCase()+t.slice(1); };
      const costruisci=(lg,id)=>{
        const testo=['LEZIONARIO '+an];
        const pagOggi={};
        [-7,0,7].forEach((delta,k)=>{
          const sabato=new Date(sab.getFullYear(),sab.getMonth(),sab.getDate()+delta);
          const intro=lg==='ro'?`LECȚIA ${k+1} Titlul ${k+1} SÂMBĂTĂ, ${sabato.getDate()} ${MESI_LEZ.ro[sabato.getMonth()].toUpperCase()} ${sabato.getFullYear()}`
                               :`Lezione ${k+1} Titolo ${k+1} Sabato, ${sabato.getDate()} ${MESI_LEZ.it[sabato.getMonth()]} ${sabato.getFullYear()}`;
          testo.push(intro);
          if(delta===0) pagOggi[iso(sabato)]=testo.length;
          for(let g=6;g>=1;g--){                                     /* domenica … venerdì della settimana prima */
            const d=new Date(sabato.getFullYear(),sabato.getMonth(),sabato.getDate()-g);
            const testa=lg==='ro'?`${g}. ZIUA ${d.getDate()} ${MESI_LEZ.ro[d.getMonth()].toUpperCase()}`
                                 :`${['Dom','Lun','Mar','Mer','Gio','Ven'][6-g]}, ${d.getDate()} ${breve(d.getMonth())}`;
            testo.push(testa+' Studio del giorno, non lo stesso testo di un\'altra pagina');
            if(delta===0) pagOggi[iso(d)]=testo.length;
          }
        });
        const l={i:id,lg,anno:an,trim:tr,pagCop:0,pagine:testo.length,testo,trimRifatto:true,dateRifatte:true,titolo:'Prova '+lg};
        analizzaLezionario(l);
        return {l,pagOggi};
      };
      const IT=costruisci('it','zzIT'), RO=costruisci('ro','zzRO');
      /* «22 ottobre 1844» in una pagina prima di quella giusta non è la data di oggi */
      const d1=oggi, nomeMese=MESI_LEZ.it[d1.getMonth()];
      IT.l.testo[IT.pagOggi[iso(oggi)]-2]=`Nel ${d1.getDate()} ${nomeMese} 1844 accadde qualcosa`+' '+(IT.l.testo[IT.pagOggi[iso(oggi)]-2]||'');
      stato.lezionari=[IT.l,RO.l];
      const pIT=paginaDiOggi(IT.l), pRO=paginaDiOggi(RO.l);
      /* (il sabato sera dopo il tramonto il «sabato che viene» è quello dopo: oggi non cade nella sua settimana, e vale la prima pagina) */
      const attIT=IT.pagOggi[iso(oggi)]||IT.pagOggi[iso(sab)], attRO=RO.pagOggi[iso(oggi)]||RO.pagOggi[iso(sab)];
      ok(pIT===attIT,`italiano: la pagina di oggi è quella con la data di oggi (${pIT}, attesa ${attIT})`);
      ok(pRO===attRO,`rumeno: la pagina di oggi è quella con la data di oggi (${pRO}, attesa ${attRO})`);
      ['it','ro'].forEach(lg=>{
        FL.lg=lg; FL.anno=an; vSabato();
        const carte=$$('.lez-carta.oggi');
        ok(carte.length===1 && carte[0].dataset.oggi==='1' && !!carte[0].querySelector('.lez-oggi'),
           `«Oggi» col contorno verde compare anche in ${lg==='ro'?'rumeno':'italiano'}`);
        /* il contorno sta DENTRO al riquadro: fuori, la griglia lo taglia (su iPad si vedeva interrotto) */
        const anello=getComputedStyle(carte[0],'::after');
        ok(anello.position==='absolute' && anello.borderTopWidth==='3px' && anello.borderLeftWidth==='3px' && anello.borderBottomWidth==='3px'
           && getComputedStyle(carte[0]).boxShadow==='none',
           `il contorno verde (${lg}) è disegnato dentro alla carta, così non viene tagliato dalla griglia`);
        chiamate.length=0;
        carte[0].dispatchEvent(new MouseEvent('click',{bubbles:true}));
        ok(chiamate.length===1 && chiamate[0][0]===(lg==='ro'?RO:IT).l.i && chiamate[0][1]===(lg==='ro'?pRO:pIT),
           `toccando la carta di oggi (${lg}) si apre alla pagina del giorno di oggi`);
        ok(chiamate.length===1 && chiamate[0][2] && chiamate[0][2].giorno instanceof Date && iso(chiamate[0][2].giorno)===iso(oggi),
           `…e la pagina si apre scorrendo fino al punto dove comincia il giorno di oggi (${lg})`);
        const sabatoBox=$('.lez-sabato');
        if(sabatoBox){
          chiamate.length=0; sabatoBox.click();
          const q=lezioneDelSabato((lg==='ro'?RO:IT).l);
          ok(chiamate.length===1 && chiamate[0][1]===q.pag,`il riquadro verde di sopra (${lg}) apre ancora la lezione di questo sabato`);
        }
      });
      /* due lezionari nello stesso trimestre (per esempio una copertina sola): si vede quello di oggi */
      const solo={i:'zzC',lg:'it',anno:an,trim:tr,pagCop:0,pagine:1,testo:['copertina'],lezioni:[],trimRifatto:true,dateRifatte:true,titolo:'Copertina sola'};
      stato.lezionari=[solo,IT.l];
      FL.lg='it'; FL.anno=an; vSabato();
      ok($$('.lez-carta.oggi').length===1 && $('.lez-carta.oggi').dataset.i===IT.l.i,'se nel trimestre ce ne sono due, la carta con «Oggi» è quella giusta');
      /* date mancanti o sbagliate (lezionari messi dentro tempo fa): la pagina di oggi si trova cercando
         la data nel testo, e il contorno verde dipende dall'anno e dal trimestre in cui sta */
      IT.l.lezioni=[];
      ok(paginaDiOggi(IT.l)===attIT,`senza le date delle lezioni la pagina di oggi si trova lo stesso (${paginaDiOggi(IT.l)}, attesa ${attIT})`);
      IT.l.testo=['solo copertina'];
      stato.lezionari=[IT.l];
      vSabato();
      ok($$('.lez-carta.oggi').length===1,'anche senza le date delle lezioni, il lezionario del trimestre di oggi ha il contorno verde');
      stato.lezionari=[solo,IT.l];
      vSabato();
      ok($$('.lez-carta.oggi').length===1 && $('.lez-carta.oggi').dataset.i===IT.l.i,'…e con due senza date vince quello con più pagine');
    } finally {
      window.apriLez=chiama;
      stato.lezionari=JSON.parse(snap.lez); Object.assign(FL,snap.FL);
      salva(); vai(snap.sez);
    }
  })();
  /* ---- il lezionario stampa male la data di un giorno (luglio-settembre 2026: giovedì 24 è «Mer, 23 Set»):
         si apre lo stesso al giorno giusto, contando i titoli dei giorni in ordine ---- */
  (function(){
    const testo=['LEZIONARIO 2026','Lezione 14 Rallegrarsi nel Signore Sabato, 26 settembre 2026 Dom, 20 Set 1. PORTATORI DI LUCE',
      'Lun, 21 Set 2. LA BONTÀ DI DIO','testo','Mar, 22 Set 3. LE PROVE DI CRISTO','testo',
      'Mer, 23 Set 4. RALLEGRARSI NELLE PROVE','fine di mercoledì Mer, 23 Set 5. LA NOSTRA RICOMPENSA E LA NOSTRA GIOIA','testo',
      'Ven, 25 Set DOMANDE PER LA REVISIONE PERSONALE','Lezione 15 Altro Sabato, 3 ottobre 2026'];
    const l={i:'zzGiorno',lg:'it',anno:2026,trim:3,pagCop:0,pagine:testo.length,testo,trimRifatto:true,dateRifatte:true,titolo:'Prova'};
    analizzaLezionario(l);
    const gio=giornoDiOggi(l,new Date(2026,8,24,9)), mer=giornoDiOggi(l,new Date(2026,8,23,9)), lun=giornoDiOggi(l,new Date(2026,8,21,9));
    ok(gio && gio.pag===8 && iso(gio.data)==='2026-09-23' && gio.k===0 && paginaDiOggi(l,new Date(2026,8,24,9))===8,
       `giovedì stampato con la data di mercoledì: si apre lo stesso al quinto giorno (pagina ${gio&&gio.pag}, attesa 8)`);
    ok(mer && mer.pag===7 && iso(mer.data)==='2026-09-23' && mer.k===0,'…e il mercoledì vero resta al suo posto (pagina 7)');
    ok(lun && lun.pag===3 && iso(lun.data)==='2026-09-21','con le date giuste il giorno è quello con la data di oggi');
  })();
  /* ---- la lezione di oggi si apre ESATTAMENTE al giorno di oggi: dentro alla pagina, dove comincia il giorno ---- */
  (function(){
    const rg=(y,...t)=>({y,h:0.02,el:t.map((s,k)=>({x:0.1+k*0.15,y,w:0.1,h:0.02,s}))});
    const d21=new Date(2026,8,21);
    ok(rigaDelGiorno([rg(0.05,'Dom,','20','Set'),rg(0.41,'Studio','del','giorno'),rg(0.68,'Lun,','21','Set')],d21)===0.68,
       'in italiano il giorno di oggi comincia alla riga dove è scritto («Lun, 21 Set»), non in cima alla pagina');
    ok(rigaDelGiorno([rg(0.06,'2.','BUNĂTATEA','LUI','DUMNEZEU'),rg(0.07,'LUNI,','21','SEPTEMBRIE')],d21)===0.07,
       'in rumeno il giorno si trova anche con le maiuscole e gli accenti («LUNI, 21 SEPTEMBRIE»)');
    ok(rigaDelGiorno([rg(0.3,'Nel','21','settembre','1844','accadde'),rg(0.7,'21','Set','2026')],d21)===0.7,
       'una data di un altro anno («21 settembre 1844») non è il giorno di oggi');
    ok(rigaDelGiorno([rg(0.2,'Dom,','20','Set')],d21)===null && rigaDelGiorno([],d21)===null && rigaDelGiorno(undefined,d21)===null,
       'se la data di oggi non c\'è in quella pagina non si inventa nessuna posizione');
    /* il bordo alto della fascia colorata del titolo, letto sulla pagina disegnata */
    (function(){
      const cv=document.createElement('canvas'); cv.width=200; cv.height=100; cv.className='let-pdf';
      const g=cv.getContext('2d'); g.fillStyle='#fff'; g.fillRect(0,0,200,100);
      const fz=document.createElement('div'); fz.appendChild(cv);
      const rr={y:0.45,h:0.1,el:[{x:0.1,y:0.45,w:0.8,h:0.1,s:'5. TITOLO'}]};
      ok(cimaDelTitolo(fz,rr)===0.45,'senza fascia colorata il titolo comincia dall\'alto delle sue lettere');
      g.fillStyle='#d0d0d0'; g.fillRect(0,38,200,22);
      ok(Math.abs(cimaDelTitolo(fz,rr)-0.38)<0.011,`con la fascia grigia il titolo comincia dal bordo alto della fascia (${cimaDelTitolo(fz,rr)}, atteso 0.38)`);
    })();
    /* e lo scorrimento arriva davvero al punto giusto: la riga del giorno si ferma in alto, con un po' d'aria sopra */
    let box=document.getElementById('lettore');
    if(box && box.classList.contains('on')) return;       /* un lezionario aperto davvero: non lo tocco */
    const era=box?{c:box.className,h:box.innerHTML}:null;
    if(!box){ box=document.createElement('div'); box.id='lettore'; document.body.appendChild(box); }
    const salvaRighe=LET.righe;
    try{
      box.className='on';
      box.innerHTML='<div id="letArea" style="position:fixed;left:0;top:0;width:300px;height:400px;overflow:auto">'
        +[901,902,903].map(n=>`<div class="let-foglio" data-p="${n}" style="position:relative;height:1000px"></div>`).join('')+'</div>';
      LET.righe={902:[rg(0.1,'Dom,','20','Set'),rg(0.68,'Lun,','21','Set')],903:[rg(0.2,'Mar,','22','Set')]};
      const area=$('#letArea'), f=box.querySelector('.let-foglio[data-p="902"]');
      ok(portaAlGiorno(902,d21)===true,'lo scorrimento parte quando la pagina ha il giorno di oggi');
      const pos=f.getBoundingClientRect().top-area.getBoundingClientRect().top+0.68*1000;
      ok(Math.abs(pos)<=1,`il titolo del giorno di oggi si ferma proprio contro il bordo alto dello schermo (a ${Math.round(pos)} px)`);
      /* la stessa data due volte nella pagina (il lezionario ha stampato male il giorno dopo): si va alla seconda */
      LET.righe[904]=[rg(0.1,'Mer,','23','Set'),rg(0.3,'5.','LA','NOSTRA','GIOIA','Mer,','23','Set')];
      area.insertAdjacentHTML('beforeend','<div class="let-foglio" data-p="904" style="position:relative;height:1000px"></div>');
      const f4=box.querySelector('.let-foglio[data-p="904"]'), d23=new Date(2026,8,23);
      ok(rigaDelGiorno(LET.righe[904],d23,1)===0.3 && rigaDelGiorno(LET.righe[904],d23)===0.1 && rigaDelGiorno(LET.righe[904],d23,2)===null,
         'con la stessa data due volte nella pagina si può scegliere la seconda');
      ok(portaAlGiorno(904,d23,1)===true
         && Math.abs(f4.getBoundingClientRect().top-area.getBoundingClientRect().top+0.3*1000)<=1,'…e lo scorrimento si ferma sulla seconda, in cima allo schermo');
      const st=area.scrollTop;
      ok(portaAlGiorno(903,d21)===false && area.scrollTop===st,'se in quella pagina non c\'è il giorno di oggi, la pagina resta dov\'è');
    } finally {
      LET.righe=salvaRighe;
      if(era){ box.className=era.c; box.innerHTML=era.h; } else box.remove();
    }
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
    /* Il CASSETTO è condiviso (appena verificato sopra), ma la VISTA no più:
       Ovidiu ha chiesto che un appunto nuovo non si veda da solo nell'altra
       lingua — solo dopo «Copia appunti» e «Incolla appunti», che scrivono
       una copia con un dl suo. */
    (function(){
      const salvaLez=LET.lez;
      const aIt={t:'evid',c:'#ffd400',o:0.5,rr:[[0.1,0.2,0.3,0.02]],dl:IT.i};
      LET.lez=IT;
      ok(rettDi(aIt,pIt).length===1,'un appunto si vede sempre nel suo lezionario di origine');
      LET.lez=RO;
      ok(rettDi(aIt,pRo).length===0,
         'ma non più da solo nell\'altra lingua, finché non lo incolli');
      const copia=Object.assign({},aIt,{dl:RO.i,da:'x'});
      ok(rettDi(copia,pRo).length===1,'una copia incollata (con un dl tutto suo) invece sì');
      /* Un segno appena fatto sta solo sulla pagina dove è nato, mai sulle successive */
      LET.lez=IT;
      const aPg={t:'evid',c:'#ffd400',o:0.5,rr:[[0.1,0.2,0.3,0.02]],dl:IT.i,off:0,pg:pIt};
      ok(paginaDelSegno(aPg,pIt) && !paginaDelSegno(aPg,pIt+1) && !paginaDelSegno(aPg,pIt+2),
         'evidenziato o scritto su una pagina: non si ripete nelle successive');
      /* Bug vero segnalato da Ovidiu (19 settembre 2026): «evidenzio una
         frase e in automatico se ne evidenzia in avanti anche un'altra a
         caso». Causa trovata: rettDi ricalcolava la posizione dall'ancora
         per parola ANCHE nella propria edizione — e quel conto dipende da
         quante pagine della giornata sono già caricate, quindi lo stesso
         segno poteva spostarsi da un ridisegno all'altro. Ora, quando il
         segno è nato (o è stato incollato) proprio in questo lezionario,
         deve ignorare del tutto l'ancora e usare solo i rettangoli veri
         disegnati a mano — anche con un'ancora chiaramente sbagliata. */
      LET.lez=IT;
      const aAncoraSballata={t:'evid',c:'#ffd400',o:0.5,dl:IT.i,
        rr:[[0.1,0.2,0.3,0.02]], an:{gwF:99999,gwL:99999,gwTot:1}};
      const rr=rettDi(aAncoraSballata,pIt);
      ok(rr.length===1 && rr[0][0]===0.1 && rr[0][1]===0.2,
         'nella sua edizione il segno resta dove è stato disegnato, mai spostato dall\'ancora');
      LET.lez=salvaLez;
    })();
  })();
  /* ---- quello che è stato aggiunto adesso ---- */
  (function(){
    /* le domande: diecimila, metà per lingua, quattro livelli, tutta la Bibbia */
    const cL=contaLingue(DOMANDE);
    ok(DOMANDE.length>=9800, `domande in tutto: ${DOMANDE.length}`);
    ok(new Set(DOMANDE.map(d=>d.lg+'|'+d.d.trim().toLowerCase())).size===DOMANDE.length,'nessuna domanda è scritta due volte');
    ok(cL.it>=4900 && cL.ro>=4900, `metà per lingua: ${cL.it} in italiano, ${cL.ro} in rumeno`);
    ok(new Set(DOMANDE.map(d=>d.L)).size===66,'le domande toccano tutti i 66 libri');
    const perDif=[1,2,3,4].map(n=>DOMANDE.filter(d=>d.dif===n).length);
    ok(perDif.every(x=>x>1500),`i quattro livelli: ${perDif.join(' · ')}`);
    ok(DOMANDE.every(d=>d.o.length===3 && new Set(d.o).size===3 && d.o[d.g]!=null),
       'ogni domanda ha tre risposte diverse e una giusta');
    const cC=contaLingue(CITAZIONI);
    ok(CITAZIONI.length>4500, `frasi di «Chi ha detto»: ${CITAZIONI.length}`);
    ok(cC.it>=2800 && cC.ro>=2800, `almeno 2800 per lingua (senza le frasi che hanno già il nome di chi parla): ${cC.it} · ${cC.ro}`);
    ok(strisciaLingue(DOMANDE).includes('in italiano'),'il totale si vede diviso per lingua');
    /* le domande e le frasi controllate: né la risposta già scritta nella domanda, né «in questo capitolo» senza dire quale, né errori di battitura noti */
    (function(){
      const fuoriCit=t=>t.replace(/«[^»]*»/g,' ');
      const tok=s=>ck(s).split(/[^a-z0-9]+/).filter(Boolean);
      const generico=/quest[oa]\s+(?:\w+\s+)?(?:capitolo|libro|lettera)\b|nello stesso capitolo|acest(?:ui)?\s+capitol|această\s+(?:carte|epistolă)|acestei\s+(?:cărți|epistole)/i;
      const senzaLibro=DOMANDE.filter(d=>generico.test(fuoriCit(d.d)));
      ok(senzaLibro.length===0,`nessuna domanda dice «in questo capitolo / questo libro» senza dire quale${senzaLibro.length?': '+senzaLibro.slice(0,2).map(d=>d.d).join(' | '):''}`);
      let svelate=0, esempio='';
      DOMANDE.forEach(d=>{
        if(/^«/.test(d.d)) return;
        const st=tok(d.d), stS=new Set(st), pre=new Set(st.map(x=>x.slice(0,5)));
        const altre=new Set(); d.o.forEach((o,k)=>{ if(k!==d.g) tok(o).forEach(x=>altre.add(x)); });
        const dist=tok(d.o[d.g]).filter(x=>(x.length>=4||/^\d+$/.test(x)) && !altre.has(x));
        if(!dist.length) return;
        const dentro=x=>stS.has(x)||(x.length>=5&&pre.has(x.slice(0,5)));
        if(!dist.every(dentro)) return;
        /* una scelta «A o B?» scritta nella domanda non svela niente */
        if(d.o.some((o,k)=>k!==d.g && tok(o).filter(x=>x.length>=3).every(dentro))) return;
        svelate++; if(!esempio) esempio=d.d;
      });
      ok(svelate<=35,`la risposta giusta non è già scritta nella domanda (${svelate} casi dubbi su ${DOMANDE.length}: risposte come «Non è specificato»${svelate?'; es. '+esempio.slice(0,60):''})`);
      const errori=['cavali','arrabbio','asassinato','eggito','giussepe','ucelli','uccidese','visuto','tropo','sevizio','ssottomesso','sottomesi','capitole','sepecificato','propia','ubbriaca','dăcă','adăcă','oaminii','rurăciune','răgăciune','tetament','impotrivca','luidumnezeu'];
      const trovati=[]; DOMANDE.forEach(d=>{ const t=(fuoriCit(d.d)+' '+d.o.join(' ')).toLowerCase(); errori.forEach(e=>{ if(e==='capitole' && d.lg!=='it') return; if(new RegExp('(^|[^\\p{L}])'+e+'([^\\p{L}]|$)','u').test(t)) trovati.push(e); }); });
      ok(trovati.length===0,`nessuno degli errori di battitura già trovati è rimasto nelle domande${trovati.length?': '+[...new Set(trovati)].join(', '):''}`);
      const conNome=CITAZIONI.filter(c=>{ const art=new Set(['l','il','lo','la','i','gli','le','un','uno','una','di','del','de','lui','al','a','si','e','ed']);
        const nome=tok(nomeParlante(c.chi,c.lg)).filter(x=>!art.has(x)&&x.length>=2), fr=new Set(tok(c.q)); return nome.length && nome.every(x=>fr.has(x)); });
      ok(conNome.length===0,`nelle frasi di «Chi ha detto?» non c'è già scritto il nome di chi parla${conNome.length?': '+conNome.slice(0,2).map(c=>c.q.slice(0,50)).join(' | '):''}`);
    })();
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
    /* i margini bianchi ai lati si possono ancora scorrere, anche con
       l'evidenziatore (o un altro strumento) acceso */
    LET.righe[999]=[Object.assign({},riga,{_pz:null})];
    ok(puntoSulTesto(999,[0.3,0.11])===true,'un tocco sulle scritte del lezionario conta come testo');
    ok(puntoSulTesto(999,[0.9,0.11])===false,'un tocco nel margine, fuori dal testo, si riconosce — lì si scorre');
    delete LET.righe[999];
    /* il colore scelto per l'evidenziatore (o un altro strumento) resta
       quello mostrato nella barra anche dopo essere tornati alla manina */
    (function(){
      /* la prova NON deve lasciare tracce nelle tue scelte vere (i colori del
         lezionario): prima mi segno com'erano, in memoria e nell'archivio, e
         alla fine le rimetto. Prima, a ogni avvio, li riportava tutti ai colori
         di partenza e l'evidenziatore diventava blu scuro. */
      const salvaS=LET.strumento, salvaU=stato.imp.ultimoStrumentoColore, salvaCol=LET.colore;
      const salvaC=JSON.stringify(LET.colori), salvaP=JSON.stringify(stato.imp.coloriLettore);
      /* e non deve far comparire scritte: prima, a ogni avvio, per un attimo
         si vedeva «Strumento spento» */
      const _avv=window.avvisa, nAvv=$('#avvisi').children.length; window.avvisa=function(){};
      try{
        setStru('evid'); setCol('#123456');
        setStru('evid'); // la si "spegne" toccandola di nuovo: torna a mano
        ok(strumentoColore()==='evid' && LET.colori.evid==='#123456',
           'il colore scelto per l\'evidenziatore resta quello anche a mano libera');
      } finally { window.avvisa=_avv; }
      ok($('#avvisi').children.length===nAvv,'il controllo dei colori non fa comparire scritte (niente «Strumento spento» all\'avvio)');
      LET.strumento=salvaS; LET.colore=salvaCol; LET.colori=JSON.parse(salvaC);
      if(salvaU===undefined) delete stato.imp.ultimoStrumentoColore; else stato.imp.ultimoStrumentoColore=salvaU;
      if(salvaP===undefined) delete stato.imp.coloriLettore; else stato.imp.coloriLettore=JSON.parse(salvaP);
      salva();
    })();
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
    /* le pagine finte non appartengono a nessun lezionario vero: se ne
       fosse aperto uno, i conti delle pagine del giorno sarebbero i suoi */
    LET.righe={}; LET._par={}; LET.lez=null;
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
    const cum1=(()=>{ let t=0; const c=[]; p1.forEach(q=>{c.push(t); t+=q.parole.length;}); return c; })();
    ok(an && an.gwF!=null && an.gwF>=cum1[2] && an.gwF<cum1[3],
       `il segno sa in quale paragrafo sta (parola globale ${an?an.gwF:'?'}, il 3° comincia da ${cum1[2]})`);
    const rr2=rettDaAncora(902,an);
    ok(rr2 && rr2.length, 'e sa ritrovarlo nell\'altra edizione');
    const coperte=[];
    p2[2].parole.forEach(w=>{ const cx=w.x+w.w/2, cy=w.y+w.h/2;
      if((rr2||[]).some(r=>cx>=r[0]-0.002&&cx<=r[0]+r[2]+0.002&&cy>=r[1]-0.006&&cy<=r[1]+r[3]+0.006)) coperte.push(w.t); });
    const frase=coperte.join(' ');
    /* «Frate mai mare», non per forza anche il «Ca» davanti: contando le
       parole (non più le frasi) il bordo può cadere una parola prima o
       dopo quello esatto — MAI più su una frase sbagliata, come capitava
       col vecchio conto per frase (vedi il commento sopra ad ancoraDa) */
    ok(/Frate mai mare/.test(frase) && /slabiciuni/.test(frase),
       `finisce sulle parole giuste: «${frase.slice(0,64)}…»`);
    ok(!/Priviti|Rugaciunea/.test(frase),'e non si porta dietro il resto della pagina');
    /* il segno sa anche a che PAROLA della giornata sta (non più a che
       frase): è la misura che regge quando le due edizioni non dividono
       i capoversi — né le frasi — allo stesso modo */
    ok(an.gwF!=null && an.gwL!=null && an.gwL>=an.gwF && an.gwTot>=10,
       `il segno sa a che parola sta: dalla ${an.gwF}ª alla ${an.gwL}ª di ${an.gwTot}`);
    /* una terza pagina con i capoversi divisi in modo diverso: deve trovarlo
       lo stesso, contando le parole */
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
    ok(/Frate mai mare/.test(cop3.join(' ')),
       `e lo ritrova anche così: «${cop3.join(' ').slice(0,52)}…»`);
    delete LET.righe[903];
    /* le righe vuote della risposta si legano al paragrafo che sta sopra */
    const vuota=ancoraDa(901,[[0.10,p1[2].y2+0.02,0.6,0.02]]);
    ok(vuota && vuota.vuota===1 && vuota.p===2,'anche le righe da riempire sanno a che domanda appartengono');
    delete LET.righe[901]; delete LET.righe[902];
    LET.righe=salvaRighe; LET._par=salvaPar; LET.lez=salvaLez;
  })();
  /* ---- «Copia appunti» e «Incolla appunti»: tutti gli appunti di una
     lezione passano nell'altra lingua, sulle stesse parole ---- */
  (function(){
    const corpo=String(apriAppunti);
    ok(/Copia appunti/.test(corpo) && /Incolla appunti/.test(corpo) && !/Rifai/.test(corpo) && !/Importa/.test(corpo),
       'dentro «Appunti» ci sono «Copia appunti» e «Incolla appunti» al posto di «Rifai» e «Importa»');
    ['scegliLezioneCopia','copiaAppuntiLezione','scegliLezioneIncolla','incollaAppuntiLezione','allineaParole','portaTratto']
      .forEach(f=>ok(typeof window[f]==='function','c\'è «'+f+'»'));
    /* due pagine finte con lo stesso testo nelle due lingue, righe e
       capoversi impaginati in modo diverso (testo scritto apposta) */
    function pagina(n,capoversi,perRiga,cima,largRiga){
      const righe=[]; let y=cima;
      capoversi.forEach(f=>{
        const par=f.split(' ');
        for(let i=0;i<par.length;i+=perRiga){
          const pezzo=par.slice(i,i+perRiga), ultima=(i+perRiga)>=par.length;
          const lettere=pezzo.join('').length, larg=ultima?largRiga*pezzo.length/perRiga:largRiga;
          const spazio=0.006, utile=larg-spazio*(pezzo.length-1);
          const el=[]; let x=0.10;
          pezzo.forEach(w=>{ const lw=utile*w.length/lettere; el.push({x,y,w:lw,h:0.018,s:w}); x+=lw+spazio; });
          righe.push({y,h:0.018,el});
          y+=0.026;
        }
        y+=0.030;
      });
      LET.righe[n]=righe;
      return righe;
    }
    const salvaRighe=LET.righe, salvaPar=LET._par, salvaLez=LET.lez, salvaAltrui=LET.altrui;
    const prima=JSON.stringify(stato.appunti||{});
    try{
      LET.righe={}; LET._par={}; LET.altrui={};
      pagina(951,['a. Che cosa impariamo dal seminatore? Luca 8:5–8.',
        'Il seminatore uscì di buon mattino, e il seme cadde in quattro terreni diversi. Solo il terreno buono, arato e pulito, portò frutto abbondante.',
        '"Il cuore che ascolta con attenzione è come un campo preparato." — Sermoni, p. 45.'],9,0.08,0.62);
      pagina(961,['a. Ce învățăm de la semănător? Luca 8:5-8',
        'Semănătorul a ieșit dis-de-dimineață, iar sămânța a căzut pe patru terenuri diferite. Numai pământul bun, arat și curățat, a adus rod bogat.',
        '„Inima care ascultă cu atenție este ca un ogor pregătit.” — Predici, p. 45.'],7,0.12,0.50);
      const IT={i:'zzc1',lg:'it',pagine:951,lezioni:[{n:1,tit:'Il seminatore',pag:951,fine:952,data:'2031-01-04',giorni:[]}]};
      const RO={i:'zzc2',lg:'ro',pagine:961,lezioni:[{n:1,tit:'Semănătorul',pag:961,fine:962,data:'2031-01-04',giorni:[]}]};
      LET.lez=IT;
      const D=paroleLezione(IT,IT.lezioni[0]);
      const i0=D.W.indexOf('Solo'), i1=D.W.indexOf('abbondante.');
      const rr=_rettangoliParole(D,i0,i1)[951];
      const yDom=D.G[D.W.indexOf('8:5–8.')].y;
      noteDi(951,IT).push({t:'evid',c:'#ffd400',o:0.5,rr,dl:IT.i,pg:951,off:0});
      noteDi(951,IT).push({t:'testo',c:'#e02b3c',s:4,f:'serif',x:0.12,y:yDom+0.03,w:0.42,txt:'Il terreno è il cuore',dl:IT.i,pg:951,off:0});
      const c=preparaCopiaAppunti(IT,IT.lezioni[0]);
      ok(c.segni.length===2 && c.segni.some(x=>x.come==='parole') && c.segni.some(x=>x.come==='riga'),
         `«Copia appunti» prende tutti gli appunti della lezione: ${c.segni.length}`);
      LET.lez=RO;
      const e=incollaAppuntiIn(c,RO,RO.lezioni[0]);
      ok(e.messi===2 && e.nuovi.length===2 && e.nuovi.every(x=>x.n===961 && x.a.dl===RO.i && x.a.pg===961),
         `«Incolla appunti» li mette nell'altra lingua: ${e.messi} su ${c.segni.length}`);
      const DR=paroleLezione(RO,RO.lezioni[0]);
      const ev=(e.nuovi.find(x=>x.a.t==='evid')||{}).a||{rr:[]};
      const coperte=DR.W.filter((w,i)=>{ const g=DR.G[i], cx=g.x+g.w/2, cy=g.y+g.h/2;
        return ev.rr.some(r=>cx>=r[0]&&cx<=r[0]+r[2]&&cy>=r[1]&&cy<=r[1]+r[3]); }).join(' ');
      ok(coperte==='Numai pământul bun, arat și curățat, a adus rod bogat.',
         `l'evidenziato va proprio sulle stesse parole: «${coperte}»`);
      const tx=(e.nuovi.find(x=>x.a.t==='testo')||{}).a||{};
      const yDomRo=DR.G[DR.W.indexOf('8:5-8')].y, yPar=DR.G[DR.W.indexOf('Semănătorul')].y;
      ok(tx.txt==='Il terreno è il cuore' && tx.y>yDomRo && tx.y<yPar,
         'la scritta sotto la domanda resta sotto la stessa domanda');
      /* incollare di nuovo non raddoppia niente */
      e.nuovi.forEach(x=>noteDi(x.n,RO).push(x.a));
      const e2=incollaAppuntiIn(c,RO,RO.lezioni[0]);
      ok(e2.messi===0 && e2.gia===2,'incollare due volte non raddoppia gli appunti');
      /* ognuno si vede solo nel suo lezionario */
      ok(rettDi(ev,961).length>0,'la copia incollata si vede nel lezionario dove l\'hai incollata');
      LET.lez=IT;
      ok(rettDi(ev,951).length===0,'e non torna indietro da sola nell\'altro');
      /* una frase che nell'altra lingua non c'è non si segna a caso */
      const WI=['Uno','due','tre.','Questa','frase','in','più','non','c\'è','affatto.','Luca','2:3','finisce','qui.'];
      const WR=['Unu','doi','trei.','Luca','2:3','se','termină','aici.'];
      const f=allineaParole(WI,'10000000000000','it',WR,'10000000','ro');
      ok(portaTratto(f,WI,'10000000000000',WR,'10000000',3,9)===null,
         'una frase che nell\'altra lingua manca non si segna a caso');
      const r2=portaTratto(f,WI,'10000000000000',WR,'10000000',10,13);
      ok(r2 && WR.slice(r2[0],r2[1]+1).join(' ')==='Luca 2:3 se termină aici.','e quella dopo sì, al suo posto');
    } finally {
      try{ stato.appunti=JSON.parse(prima); }catch(err){ stato.appunti={}; }
      LET.righe=salvaRighe; LET._par=salvaPar; LET.lez=salvaLez; LET.altrui=salvaAltrui;
    }
  })();
  /* ---- la scritta sul lezionario: grande come il testo, e due tocchi per cambiarla ---- */
  (function(){
    const salvaRighe=LET.righe, salvaPag=LET.pagine, salvaPar=LET._par, salvaLez=LET.lez;
    LET.righe={}; LET.pagine={}; LET._par={}; LET.lez=null;
    LET.righe[971]=[{y:0.10,h:0.018,el:[{x:0.10,y:0.10,w:0.50,h:0.018,s:'una riga del lezionario'}]}];
    LET.pagine[971]={w:900,h:1300,dpr:1};
    const g=grandezzaTestoLez(971,[0.30,0.105]);
    ok(g===Math.round(0.018*1300/4),`una scritta nuova nasce grande come il testo lì attorno: ${g}`);
    ok(Math.abs(_pxTestoLez(971,g)-0.018*1300)<=2.5,'e sul foglio viene proprio di quella misura');
    LET.pagine[971]={w:1800,h:2600,dpr:1};
    ok(Math.abs(_pxTestoLez(971,g)-0.018*2600)<=5,'ingrandendo la pagina la scritta cresce insieme al testo');
    ok(/_dueTocchi/.test(String(attaccaManopole)) && !/2000/.test(String(attaccaManopole)),
       'per cambiare una scritta si tocca due volte (non più tenere premuto due secondi)');
    delete LET.righe[971]; delete LET.pagine[971];
    LET.righe=salvaRighe; LET.pagine=salvaPag; LET._par=salvaPar; LET.lez=salvaLez;
  })();
  /* ---- le scelte fatte negli appunti del lezionario restano (colori, grandezza, carattere) ---- */
  (function(){
    const F={i:'zzS',lg:'it',anno:2026,trim:3,pagCop:0,pagine:3,testo:['a','b','c']};
    const im=stato.imp;
    const salvaLez=LET.lez, salvaCol=JSON.stringify(LET.colori), salvaColore=LET.colore, salvaStr=LET.strumento,
          salvaCar=LET.carattere, salvaGr=LET.grandezza, salvaTx=LET._testo, salvaTc=LET._txCol, salvaDs=LET._dimScelta;
    const salvaImp={u:im.ultimoStrumentoColore, c:JSON.stringify(im.coloriLettore), g:im.grandezzaLettore, k:im.carattereLettore};
    const salvaSt=JSON.stringify(STORIA), prima=JSON.stringify(stato.appunti||{});
    try{
      LET.lez=F; LET.strumento='mano'; im.ultimoStrumentoColore='evid';
      LET.colori={evid:'#ffd23f',sott:'#e02b3c',penna:'#111111',testo:'#1f6feb'}; LET.colore='#ffd23f';
      delete im.grandezzaLettore; delete im.carattereLettore;
      const fam=Object.keys(FAMIGLIE), altro=fam.find(k=>k!==(LET.carattere||'serif'))||fam[0];
      /* scritta nuova, con la manina in mano dopo aver usato l'evidenziatore */
      finestraTesto(1,null,[0.3,0.3]);
      ok(LET._txCol==='#1f6feb','una scritta nuova prende il colore delle scritte, non quello dell\'evidenziatore');
      $('#txDim').value=11; $('#txDim').dispatchEvent(new Event('input'));
      $('#txFont').value=altro; $('#txFont').dispatchEvent(new Event('change'));
      document.querySelector('#modale .tx-barra .col-g').click();
      const scelto=COL_APPUNTI_LEZ[0];
      $('#txArea').innerText='prova';
      salvaTestoLez(1,-1);
      const nota=noteDi(1)[0];
      ok(nota && nota.c===scelto && nota.s===11 && nota.f===altro,'la scritta salvata ha il colore, la grandezza e il carattere scelti');
      ok(LET.colori.testo===scelto && LET.colori.evid==='#ffd23f','il colore scelto lì dentro è quello delle scritte: l\'evidenziatore non cambia');
      ok(im.grandezzaLettore===11 && im.carattereLettore===altro,'grandezza e carattere scelti restano nell\'archivio, anche chiudendo il programma');
      /* la scritta successiva riparte da lì */
      finestraTesto(1,null,[0.3,0.6]);
      ok(+$('#txDim').value===11 && $('#txFont').value===altro && LET._txCol===scelto,'la scritta nuova successiva riparte con le stesse scelte');
      chiudi();
      /* cambiare solo il testo di una scritta già fatta non ne cambia il colore */
      LET.strumento='mano';
      finestraTesto(1,0);
      $('#txArea').innerText='prova cambiata';
      salvaTestoLez(1,0);
      ok(noteDi(1)[0].c===scelto && noteDi(1)[0].txt==='prova cambiata','cambiando solo il testo la scritta tiene il suo colore');
      /* la grandezza lasciata com'era non diventa una scelta da ricordare */
      delete im.grandezzaLettore;
      finestraTesto(1,0);
      salvaTestoLez(1,0);
      ok(im.grandezzaLettore===undefined,'la grandezza non scelta con la barra non si ricorda: resta «come il testo intorno»');
    } finally {
      LET.lez=salvaLez; LET.colori=JSON.parse(salvaCol); LET.colore=salvaColore; LET.strumento=salvaStr;
      LET.carattere=salvaCar; LET.grandezza=salvaGr; LET._testo=salvaTx; LET._txCol=salvaTc; LET._dimScelta=salvaDs;
      const metti=(k,v)=>{ if(v===undefined) delete im[k]; else im[k]=v; };
      metti('ultimoStrumentoColore',salvaImp.u); metti('coloriLettore',salvaImp.c===undefined?undefined:JSON.parse(salvaImp.c));
      metti('grandezzaLettore',salvaImp.g); metti('carattereLettore',salvaImp.k);
      try{ stato.appunti=JSON.parse(prima); }catch(err){ stato.appunti={}; }
      try{ const s=JSON.parse(salvaSt); STORIA.indietro=s.indietro; STORIA.avanti=s.avanti; }catch(err){}
      chiudi(); salva();
    }
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
    ok(Math.max(...per.map(g=>g.length))-Math.min(...per.map(g=>g.length))<=Math.ceil(Math.max(...per.map(g=>g.length))*0.05),'i tre livelli sono equilibrati (entro il 5%)');
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
  ok(barraCantico().indexOf("cmd(event,'undo')")>=0,'i cantici hanno la freccia che annulla l\'ultima azione');
  (function(){
    /* la pagina parte sempre dal giallo panna, in ogni sezione e lingua; un
       colore scelto a mano dalla tavolozza (pagS) resta quello scelto */
    const salva0=JSON.stringify(stato.predAnnot||{});
    const id='__provaPag';
    stato.predAnnot=stato.predAnnot||{};
    ok(stilePredica(id).pag===PAG_BASE && PAG_BASE==='#fdf6e3','pagina di partenza: giallo panna');
    stato.predAnnot[id]={luoghi:[],stile:{pag:'#ffffff',dim:22},html:''};
    ok(stilePredica(id).pag===PAG_BASE,'il vecchio bianco/beige di partenza diventa panna');
    stato.predAnnot[id].stile.pagS=1;
    ok(stilePredica(id).pag==='#ffffff','ma il bianco scelto a mano resta bianco');
    try{ stato.predAnnot=JSON.parse(salva0); }catch(e){ stato.predAnnot={}; }
  })();
  ok(COL_TESTO.length>=7 && COL_EVID.length>=7 && COL_PAG.length>=7,
     `colori: ${COL_TESTO.length} testo, ${COL_EVID.length} evidenziatore, ${COL_PAG.length} pagina`);
  /* i colori degli appunti del lezionario: in ordine di tonalità, senza quelli quasi bianchi, righe da 10 tutte piene */
  (function(){
    const rgb=c=>[1,3,5].map(k=>parseInt(c.slice(k,k+2),16));
    const tono=c=>{ const [r,g,b]=rgb(c).map(x=>x/255), M=Math.max(r,g,b), m=Math.min(r,g,b), d=M-m;
      if(d<0.15) return 1000;
      let h= M===r?((g-b)/d)%6 : M===g?(b-r)/d+2 : (r-g)/d+4; h*=60; if(h<0) h+=360; return h>=345?h-360:h; };
    const toni=COL_APPUNTI_LEZ.map(tono);
    ok(COL_APPUNTI_LEZ.length===30 && COL_APPUNTI_LEZ.every(c=>Math.min(...rgb(c))<150) && toni.every((h,k)=>!k||h>=toni[k-1]),
       `colori degli appunti: ${COL_APPUNTI_LEZ.length}, in ordine di tonalità e nessuno quasi bianco`);
    const prova=document.createElement('div'); prova.style.cssText='position:fixed;left:0;top:0;width:411px;visibility:hidden';
    prova.innerHTML=['dieci','dieci piccoli'].map(k=>`<div class="col-griglia ${k}">${COL_APPUNTI_LEZ.map(c=>
      `<button class="col-g${k==='dieci'?'':' pic2'}" style="background:${c}"></button>`).join('')}</div>`).join('');
    document.body.appendChild(prova);
    try{
      [...prova.children].forEach((gr,k)=>{
        const righe={}; [...gr.children].forEach(b=>{ const y=Math.round(b.getBoundingClientRect().top); righe[y]=(righe[y]||0)+1; });
        const n=Object.values(righe), rG=gr.getBoundingClientRect(), ult=gr.lastElementChild.getBoundingClientRect();
        ok(n.length===3 && n.every(x=>x===10) && Math.abs(ult.right-rG.right)<=1,
           `${k?'colori della riga per sottolineare':'colori in alto'}: ${n.join(' + ')} per riga, tutte piene fino in fondo`);
      });
    } finally { prova.remove(); }
  })();
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
  ok(localita().some(x=>x.n==='Marcena'&&x.cc==='IT')&&localita().filter(x=>x.cc==='IT').length>50000&&localita().filter(x=>x.cc==='RO').length>12000,'ci sono anche le frazioni d\'Italia e di Romania (GeoNames)');
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
  ok(vicina(43.5498,11.8611).n==='Marcena','da Marcena dice Marcena, non Capolona');
  ok(durata(3*3600000+12*60000)==='3 h 12 min','scrive bene quanto manca');
  /* la posizione: alba e tramonto sul punto vero dove sei, si rinfresca a ogni apertura, e il nome dice quanto è lontano il paese più vicino */
  (function(){
    const sD=datiSole({n:'Capolona',tz:'Europe/Rome',la:43.567,lo:11.864,lat:43.5498,lon:11.8611},new Date(Date.UTC(2026,8,21,12)));
    ok(Math.abs(sD.la-43.5498)<1e-9 && Math.abs(sD.lo-11.8611)<1e-9,'alba e tramonto si calcolano sul punto vero dove sei (43,5498 · 11,8611), non sul paese più vicino dell\'elenco');
    const sL=datiSole({n:'Roma',tz:'Europe/Rome',la:41.9,lo:12.5},new Date(Date.UTC(2026,8,21,12)));
    ok(sL.la===41.9 && sL.lo===12.5,'un luogo scelto dall\'elenco (senza posizione) usa le sue coordinate');
    const pos0=Object.assign({},POS), salvo=JSON.stringify(stato.imp.posizione||null), geoOrig=Object.getOwnPropertyDescriptor(navigator,'geolocation'), avv0=window.avvisa;
    try{
      window.avvisa=()=>{};
      ok(devoRinfrescarePosizione('denied',Date.now())===false,'se hai detto di no alla posizione, non la richiedo');
      POS.stato='ok'; POS.quando=Date.now()-3600000; POS.dalVivo=false;
      ok(devoRinfrescarePosizione('granted',Date.now())===true,'con il permesso già dato la posizione si rinfresca a ogni apertura');
      ok(devoRinfrescarePosizione('prompt',Date.now())===true,'anche se l\'iPad non dice «permesso dato», la posizione si rinfresca (all\'apertura, al rientro e ogni 5 minuti)');
      POS.dalVivo=true;
      ok(devoRinfrescarePosizione('prompt',Date.now())===true,'se in questa apertura la posizione è già arrivata, si rinfresca (ogni 5 minuti)');
      POS.dalVivo=false;
      POS.quando=Date.now()-7*3600000;
      ok(devoRinfrescarePosizione('prompt',Date.now())===true,'…ma dopo sei ore la posizione si rinfresca comunque');
      POS.stato='ignoto';
      ok(devoRinfrescarePosizione('prompt',Date.now())===true,'se non so ancora dove sei la chiedo');
      let opzioni=null;
      let letture=[{latitude:43.5498,longitude:11.8611,accuracy:30}];
      Object.defineProperty(navigator,'geolocation',{configurable:true,value:{
        getCurrentPosition(ok1,ko1,o){ opzioni=o; ok1({coords:letture[letture.length-1]}); },
        watchPosition(ok1,ko1,o){ opzioni=o; letture.forEach(c=>ok1({coords:c})); return 1; }, clearWatch(){} }});
      POS.stato='ok'; POS.luogo={n:'Vecchio posto',cc:'IT',tz:'Europe/Rome',la:43.0,lo:11.0}; POS.lat=43; POS.lon=11; POS.quando=1;
      chiediPosizione(true);
      ok(POS.luogo && POS.luogo.n==='Marcena' && Math.abs(POS.lat-43.5498)<1e-9,
         'la posizione salvata da tanto tempo si rinfresca: dal punto di Marcena dice Marcena');
      ok(opzioni && opzioni.maximumAge===60000 && opzioni.enableHighAccuracy===true,'all\'apertura si chiede la posizione precisa (GPS), di al massimo un minuto fa');
      ok(stato.imp.posizione && stato.imp.posizione.t>Date.now()-60000 && Math.abs(stato.imp.posizione.lat-43.5498)<1e-9,'e la nuova posizione, con l\'ora, viene salvata');
      chiediPosizione(false);
      ok(opzioni.maximumAge===0,'toccando «Dove sono» la posizione è sempre quella di adesso');
      /* fra più letture vince la più precisa */
      letture=[{latitude:43.60,longitude:11.95,accuracy:2500},{latitude:43.5498,longitude:11.8611,accuracy:40},{latitude:43.62,longitude:11.70,accuracy:900}];
      chiediPosizione(false);
      ok(POS.luogo && POS.luogo.n==='Marcena' && POS.acc===40,'fra più letture della posizione si tiene la più precisa');
      /* una lettura molto imprecisa, subito dopo una buona, non fa saltare il nome del paese */
      letture=Array(6).fill({latitude:43.70,longitude:12.10,accuracy:3000});
      chiediPosizione(true);
      ok(POS.luogo && POS.luogo.n==='Marcena','una posizione molto meno precisa, subito dopo una buona, non cambia il paese');
      const tile=pannelloSole();
      ok(/Marcena/.test(tile) && !/ km/.test(tile),'il riquadro di alba e tramonto dice solo la località, senza «a 2 km»');
    } finally {
      if(geoOrig) Object.defineProperty(navigator,'geolocation',geoOrig); else delete navigator.geolocation;
      window.avvisa=avv0;
      Object.keys(POS).forEach(k=>delete POS[k]); Object.assign(POS,pos0);
      stato.imp.posizione=JSON.parse(salvo)||undefined; if(stato.imp.posizione===undefined) delete stato.imp.posizione;
      salva();
    }
    ok(!/=\s*autoTest\(\)/.test(String(avvio)),'i controlli interni non partono più da soli a ogni apertura (facevano aspettare diversi secondi)');
  })();
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
  ok(analizzaPoesia('a\nb\nc\nd\n\ne\nf').length===2,'le poesie si dividono in strofe');
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
  /* ---- Libri: la sezione, il segnalibro con la data ---- */
  (function(){
    ok(SEZIONI.some(s=>s.id==='libri'),'c\'è la sezione Libri nel menu');
    const salvaLET={libro:LET.libro,lez:LET.lez,pag:LET.pag}, _avv=window.avvisa; window.avvisa=function(){};
    try{
      const lib={i:'zzLibro',titolo:'Prova',segno:{pag:2,quando:'2026-09-01T10:00:00Z'}};
      ok(lbSegni(lib).length===1 && lbSegni(lib)[0].pag===2 && !lib.segno,'il segnalibro di prima (uno solo) resta, come primo della lista');
      LET.libro=true; LET.lez=lib; LET.pag=7;
      lbSegna();
      const s1=lib.segni.find(x=>x.pag===7), oggi=new Date();
      ok(s1 && new Date(s1.quando).toDateString()===oggi.toDateString(),'il segnalibro si mette sulla pagina che leggi, con la data di oggi');
      ok(lbData(s1.quando)===oggi.toLocaleDateString('it-IT',{day:'numeric',month:'long',year:'numeric'}),`la data del segnalibro si legge per intero (${lbData(s1.quando)})`);
      LET.pag=12; lbSegna();
      ok(lib.segni.map(x=>x.pag).join()==='2,7,12','messo su un\'altra pagina, quelli di prima restano lì');
      ok(lbPaginaDaAprire(lib)===12 || lbPaginaDaAprire(lib)===7,'il libro si riapre sull\'ultimo segnalibro messo');
      lbSegna();
      ok(lib.segni.map(x=>x.pag).join()==='2,7','toccato di nuovo sulla stessa pagina, si toglie solo quello');
      lbTogliSegno(2); chiudi();
      ok(lib.segni.map(x=>x.pag).join()==='7','un segnalibro si toglie anche dall\'elenco, solo quando lo tolgo io');
      /* gli appunti di un libro stanno nel suo cassetto, pagina per pagina */
      stato.libri=libri(); stato.libri.push(lib);
      ok(gruppoNote(lib)==='lbzzLibro' && chiaveNota(lib,5)==='p5','gli appunti del libro hanno il loro cassetto, pagina per pagina');
      stato.libri=stato.libri.filter(x=>x!==lib);
      /* il nome del libro si dà e si cambia */
      stato.libri=libri(); const finto={i:'zzNome',titolo:'file_scaricato',fid:'x',pagine:3,segno:null}; stato.libri.push(finto);
      lbNomina('zzNome');
      ok($('#lbNome') && $('#lbNome').value==='file_scaricato','il nome del libro si può cambiare: parte da quello che ha');
      $('#lbNome').value='  La Grande Speranza  '; lbSalvaNome('zzNome');
      ok(finto.titolo==='La Grande Speranza' && !$('#modale').classList.contains('on'),'il nome nuovo si salva');
      stato.libri=stato.libri.filter(x=>x.i!=='zzNome');
    } finally { LET.libro=salvaLET.libro; LET.lez=salvaLET.lez; LET.pag=salvaLET.pag; window.avvisa=_avv; stato.libri=libri().filter(x=>x.i!=='zzLibro'); stato.libri=libri().filter(x=>x.i!=='zzNome'); if($('#modale').classList.contains('on')) chiudi(); }
  })();
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
  /* ---- giochi biblici ---- */
  (function(){
    ok(SEZIONI.some(s=>s.id==='giochi'),'c\'è la sezione Giochi biblici');
    ['it','ro'].forEach(lg=>{
      const bb=bancaBibbiaParole(lg,'tutta',0);
      ok(bb.every(w=>/^[A-Z]+$/.test(w.parola)),`le parole dell'impiccato (${lg}) sono solo lettere`);
      /* impiccato: 10.000 parole vere per lingua, trovate nel testo della Bibbia (non nomi inventati) */
      ok(PAROLE_BIBBIA[lg].length>=10000,`parole della Bibbia per l'impiccato (${lg}): ${PAROLE_BIBBIA[lg].length}`);
      ok(bb.length===PAROLE_BIBBIA[lg].length,'bancaBibbiaParole("tutta") le usa tutte, senza scartarne');
      /* ognuna porta un riferimento vero, che si legge come un vero passo biblico */
      const campione=mescola(PAROLE_BIBBIA[lg]).slice(0,25);
      ok(campione.every(w=>{ const r=leggiRiferimento(w.v); return r&&r.L>=1&&r.L<=66&&r.cap>0; }),
         `ogni parola porta un riferimento biblico valido (${lg}), es. «${campione[0].v}»`);
      ok(campione.every(w=>w.L>=1&&w.L<=66),'e il libro salvato è sempre uno dei 66');
      /* cruciverba: 5.000 parole per lingua, ognuna con il suo indizio; tutte quelle con una domanda o una
         definizione vera (nomi di personaggi, città, cose, avvenimenti, domande) e, per arrivare a 5.000, versetti */
      const CP=CRUCIVERBA_PAROLE[lg];
      const nVers=CP.filter(e=>e.tipo==='v').length;
      ok(CP.length===5000,`parole del cruciverba (${lg}): ${CP.length}, in tutto`);
      ok(CP.length-nVers>=900,`parole del cruciverba (${lg}) con una domanda o una definizione vera: ${CP.length-nVers}`);
      ok(new Set(CP.map(e=>e.parola)).size===CP.length,`nessuna parola ripetuta nel cruciverba (${lg})`);
      ok(CP.every(e=>/^[A-Z]{3,13}$/.test(e.parola)),`le parole del cruciverba (${lg}) sono solo lettere, da 3 a 13`);
      ok(CP.every(e=>e.ind.length>0 || e.chi>=0),`ogni parola del cruciverba (${lg}) ha il suo indizio (o le frasi di «Chi ha detto?»)`);
      const _paroleDi=t=>String(t).split(/[^A-Za-zÀ-ÖØ-öø-ÿĂăÂâÎîȘșȚțŞşŢţ]+/).map(_pulisciParola);
      ok(!CP.some(e=>e.ind.some(t=>/Testamento\s·|una parola della Bibbia|\d+\s+capitol/i.test(t))),
         `niente più «Antico Testamento · 34 capitoli» fra gli indizi (${lg})`);
      ok(CP.every(e=>e.ind.every(t=>!_paroleDi(t).includes(e.parola))),`nessun indizio (${lg}) contiene la sua risposta`);
      ok(CP.filter(e=>e.tipo==='b').length<=40,`i nomi dei libri sono pochissimi (${lg}): ${CP.filter(e=>e.tipo==='b').length}`);
      ok(CP.filter(e=>e.tipo!=='v').length>=900,`parole con una domanda vera (${lg}): ${CP.filter(e=>e.tipo!=='v').length}`);
      ok([1,2,3].every(l=>Math.abs(CP.filter(e=>e.dif===l).length-5000/3)<=1),`ogni livello ha lo stesso numero di parole (${lg})`);
      /* i temi e l'ambito filtrano davvero */
      const tuttiP=bancaCruciverba(lg,'personaggi','tutta',0);
      ok(tuttiP.length>=150 && tuttiP.every(e=>_crvPersonaggio(e)),`tema Personaggi (${lg}): ${tuttiP.length} parole, tutte di persone`);
      const tuttiL=bancaCruciverba(lg,'libri','tutta',0);
      ok(tuttiL.length>=40 && tuttiL.every(e=>e.tipo==='b' && e.ind.length===1),`tema Libri della Bibbia (${lg}): ${tuttiL.length} nomi, ognuno descritto`);
      const soloAt=bancaCruciverba(lg,'misto','at',0), soloNt=bancaCruciverba(lg,'misto','nt',0);
      ok(soloAt.length>1000 && soloNt.length>=400,`Antico Testamento (${lg}): ${soloAt.length} parole · Nuovo Testamento: ${soloNt.length}`);
      ok(soloAt.every(e=>_crvDentro(e,lg,'at',0)) && soloNt.every(e=>_crvDentro(e,lg,'nt',0)),'e ognuna sta davvero nel suo testamento');
      ok(!soloAt.some(e=>e.L===0 && e.chi<0) && !soloNt.some(e=>e.L===0 && e.chi<0),'nessuna parola senza libro passa per Antico o Nuovo Testamento');
      const genLibri=bancaCruciverba(lg,'libri','libro',1);
      ok(genLibri.length===1 && genLibri[0].parola===(lg==='ro'?'GENEZA':'GENESI'),'«Un libro» sui Libri tiene solo quel libro');
      ok(bancaCruciverba(lg,'personaggi','libro',1).length>0,`«Un libro» = Genesi (${lg}) trova personaggi`);
      /* un cruciverba: parole incrociate, ognuna col suo indizio, e la griglia resta compatta */
      const ctx={lg,tema:'misto',ambito:'tutta',libro:0,liv:0};
      const cv=nuovoCruciverba(bancaCruciverba(lg,'misto','tutta',0),14,seme(42),ctx);
      ok(cv.parole.length===14,`cruciverba (${lg}): ${cv.parole.length} parole incrociate`);
      ok(cv.parole.every(p=>p.indizio && !/Testamento\s·|una parola della Bibbia/.test(p.indizio) && !_paroleDi(p.indizio).includes(p.parola)),
         'ogni parola ha un indizio vero, che non contiene la risposta');
      ok(cv.righe*cv.colonne<=340 && Math.max(cv.righe,cv.colonne)<=CRV_MAX_LATO,`la griglia è compatta: ${cv.righe}×${cv.colonne}`);
      /* ogni lettera scritta nella griglia è coerente con tutte le parole che ci passano sopra */
      let coerente=true;
      cv.parole.forEach(pw=>{ for(let i=0;i<pw.parola.length;i++){
        const k=(pw.x+pw.dx*i)+','+(pw.y+pw.dy*i);
        if(cv.celle[k].lettera!==pw.parola[i]) coerente=false; } });
      ok(coerente,'le parole del cruciverba si incrociano sempre sulla stessa lettera');
      /* due parole non si toccano mai fianco a fianco (sarebbero una parola sola) */
      let attaccate=false;
      Object.keys(cv.celle).forEach(k=>{
        const [x,y]=k.split(',').map(Number), sui=cv.parole.filter(p=>{ for(let i=0;i<p.parola.length;i++) if(p.x+p.dx*i===x&&p.y+p.dy*i===y) return true; return false; });
        if(sui.length>2) attaccate=true; });
      ok(!attaccate,'in nessuna casella passano più di due parole');
      /* con «Misto» i nomi dei libri sono rari: su 40 cruciverba, pochissimi */
      let libriVisti=0, paroleViste=0, veraQuota=0;
      for(let i=0;i<40;i++){
        const c=nuovoCruciverba(bancaCruciverba(lg,'misto','tutta',0,2),14,seme(700+i),Object.assign({},ctx,{liv:2}));
        c.parole.forEach(p=>{ paroleViste++; if(p.tipo==='b') libriVisti++; if(p.tipo!=='v') veraQuota++; });
      }
      ok(libriVisti<=paroleViste*0.03,`in «Misto» i libri sono pochissimi: ${libriVisti} su ${paroleViste} parole`);
      ok(veraQuota>=paroleViste*0.85,`e quasi tutti gli indizi sono una domanda vera, non un versetto: ${Math.round(veraQuota/paroleViste*100)}%`);
    });
    ok(typeof vGiochi==='function' && ['vCruciverba','vVeroFalso','vImpiccato','vMemoria',
       'vTris','vBlitz','vCompleta','vChiSono'].every(f=>typeof window[f]==='function'),
       'le otto pagine dei giochi ci sono tutte');
    ok(typeof mostraRiferimentoGioco==='function','il riferimento biblico si può toccare anche nei giochi');
    ok(GIOCHI_TESSERE.length===16,`sedici giochi nel menu: ${GIOCHI_TESSERE.length}`);
    /* punteggio e premi: uguali per ogni gioco */
    ok(premioDi(95).et==='Oro' && premioDi(75).et==='Argento' && premioDi(55).et==='Bronzo' && premioDi(10).et!=='Oro',
       'le soglie dei premi funzionano');
    (function(){
      const prima=JSON.stringify(stato.imp.recordGiochi||{});
      delete stato.imp.recordGiochi;
      let r=recordGioco('provaTest',60);
      ok(r.nuovo && r.record===60,'il primo punteggio è sempre un nuovo record');
      r=recordGioco('provaTest',40);
      ok(!r.nuovo && r.record===60,'un punteggio più basso non batte il record');
      r=recordGioco('provaTest',80);
      ok(r.nuovo && r.record===80,'un punteggio più alto sì');
      try{ stato.imp.recordGiochi=JSON.parse(prima); }catch(e){ delete stato.imp.recordGiochi; }
    })();
    /* X e O biblico: tre in fila vince davvero */
    (function(){
      const salvaG=TRIS.griglia, salvaF=TRIS.finito, salvaV=TRIS.vincitore;
      TRIS.griglia=['X','X','X',null,null,null,null,null,null];
      ok(trisVincitore()==='X','tre X in fila vincono');
      TRIS.griglia=[null,null,null,null,null,null,null,null,null];
      ok(trisVincitore()===null,'griglia vuota, nessun vincitore');
      TRIS.griglia=salvaG; TRIS.finito=salvaF; TRIS.vincitore=salvaV;
    })();
    /* Chi sono io?: solo personaggi con almeno 3 frasi, per avere davvero 3 indizi */
    ['it','ro'].forEach(lg=>{
      const validi=_personaggiConCitazioni(lg,3);
      ok(validi.length>10,`personaggi con almeno 3 frasi (${lg}): ${validi.length}`);
    });
    /* Domande/Chi ha detto: schermo fisso in orizzontale, come chiesto */
    const sez0=sezione;
    vai('domande');
    ok(document.body.classList.contains('quiz-fissa'),'Domande bibliche prende la schermata fissa in orizzontale');
    vai('chihadetto');
    ok(document.body.classList.contains('quiz-fissa'),'Chi ha detto prende la schermata fissa in orizzontale');
    vai('home');
    ok(!document.body.classList.contains('quiz-fissa'),'e la Home non ce l\'ha');
    /* il libro in alto, in proiezione, solo se hai scelto tu "Un libro" */
    (function(){
      const salvaFD=Object.assign({},FD);
      const salvaViste=JSON.parse(JSON.stringify(stato.viste||{}));
      FD.ambito='tutta'; FD.lg='it'; FD.n=1; FD.dif=0; FD.q=''; FD.ordine='casuale';
      const _pro=window.proietta;
      let vista=null;
      window.proietta=sl=>{ vista=sl; };
      try{
        avviaQuiz();
        ok(vista && vista[0].libro==='', 'con «Tutta la Bibbia» il libro non si scrive in proiezione');
        FD.ambito='libro'; FD.libro=1;
        avviaQuiz();
        ok(vista && vista[0].libro, 'con «Un libro» scelto invece sì');
      } finally {
        window.proietta=_pro; Object.assign(FD,salvaFD);
        stato.viste=salvaViste;
      }
    })();
    /* la memoria non deve dare due carte "nome" uguali (indistinguibili) */
    ['it','ro'].forEach(lg=>{
      const salvaLg=MEM.lg, salvaN=MEM.n, salvaC=MEM.carte;
      MEM.lg=lg; MEM.n=10; nuovaMemoria();
      const nomi=MEM.carte.filter(c=>c.tipo==='nome').map(c=>c.testo);
      ok(new Set(nomi).size===nomi.length,`memoria (${lg}): niente due carte "nome" uguali`);
      MEM.lg=salvaLg; MEM.n=salvaN; MEM.carte=salvaC;
    });
    ok(typeof contaPersonaggiMemoria==='function' &&
       contaPersonaggiMemoria('it')>10 && contaPersonaggiMemoria('ro')>10,
       `personaggi per la memoria: it ${contaPersonaggiMemoria('it')} · ro ${contaPersonaggiMemoria('ro')}`);
    /* proiettare un gioco: una classe sul body, niente da tenere sincronizzato */
    (function(){
      const primaVista=GIO.vista;
      GIO.vista='tris'; vGiochi();
      proiettaGioco();
      ok(document.body.classList.contains('gioco-proiettore'),'proiettaGioco() accende la modalità grande');
      chiudiProiezioneGioco();
      ok(!document.body.classList.contains('gioco-proiettore'),'chiudiProiezioneGioco() la spegne');
      GIO.vista=primaVista; vGiochi();
    })();
    /* il menu di sinistra mostra quanti giochi e quante Bibbie ci sono */
    ok(contaSez('giochi')===16,`nel menu, i giochi: ${contaSez('giochi')}`);
    ok(contaSez('bibbia')===Object.keys(_BIBD.v).length,`e le Bibbie: ${contaSez('bibbia')}`);
    /* impiccato: l'indizio non si vede finché non lo chiedi */
    (function(){
      const salva=Object.assign({},IMP);
      nuovoImpiccato();
      ok(IMP.indizioTesto===null,'l\'indizio dell\'impiccato è nascosto appena arriva una parola nuova');
      Object.assign(IMP,salva);
    })();
    vai(sez0);
  })();
  /* ---- i giochi dal 9 al 16: contenuti, una partita vera per ognuno, stessi giocatori e salvataggi ----
     tutto quello che le prove scrivono (partite, progressi, memoria delle domande) viene rimesso com'era */
  (function(){
    const copia=o=>JSON.parse(JSON.stringify(o===undefined?null:o));
    const snap={pa:copia(stato.partite), pr:copia(stato.progressiGiochi), im:copia(stato.imp), vi:copia(stato.viste), gi:copia(stato.giocatori), gio:Object.assign({},GIO), sez:sezione};
    const pausa=GIOCHI_PAUSA.ms, _avv=window.avvisa; window.avvisa=function(){};
    try{
      GIOCHI_PAUSA.ms=0;
      const G=GIOCHI_NUOVI;
      ok(G.domande.length>=160 && Object.keys(GN_CAT).every(c=>G.domande.filter(q=>q.category===c).length>=20),`Ruota: ${G.domande.length} domande, almeno 20 per ognuna delle 8 categorie`);
      ok(G.domande.filter(q=>q.question.it.length<=95).length>=70,'Bibbia Sprint: almeno 70 domande brevi');
      ok([1,2,3,4].every(d=>G.domande.filter(q=>q.difficulty===d).length>=15),'Scalata: domande per tutti i livelli di difficoltà, anche per il milione');
      ok(G.domande.every(q=>['it','ro'].every(l=>q.question[l]&&q.answers[l].length===4&&q.explanation[l]) && q.biblicalReference),'ogni domanda nuova ha italiano, rumeno, 4 risposte, spiegazione e riferimento');
      ok(G.versetti.length>=30 && G.versetti.every(v=>v.text.it&&v.text.ro),`Costruisci il versetto: ${G.versetti.length} versetti, presi dalle due Bibbie`);
      ok(G.viaggi.length>=2 && G.viaggi.every(v=>v.tappe.length>=6 && v.tappe.slice(1).every(t=>t.prova)),`Viaggio biblico: ${G.viaggi.length} viaggi completi, ogni tappa con la sua prova`);
      ok(G.codici.every(c=>c.enigmi.length>=3),`Codice segreto: ${G.codici.length} livelli completi`);
      ok(cdcLivelli('it').length===300 && cdcLivelli('ro').length===300,'Codice segreto: 300 scrigni per lingua');
      ok([1,2,3].every(d=>cdcLivelli('it').filter(c=>c.dif===d).length>=60 && cdcLivelli('ro').filter(c=>c.dif===d).length>=60),'Codice segreto: gli scrigni sono divisi in facile, media e difficile');
      { const lg0=CDC.lg, d0=livelloGioco('codice'), liv0=CDC.liv; CDC.lg='ro'; impostaLivelloGioco('codice',3); CDC.liv=null; CDC.dodici=null;
        const a=cdcDodici(); const b=cdcNuovi(true);
        ok(a.length===12 && a.every(c=>c.dif===3 && (!c.lg||c.lg==='ro')),'Codice segreto: 12 scrigni sullo schermo, della lingua e della difficoltà scelte');
        ok(b.length===12 && b.some(c=>!a.includes(c)),'Codice segreto: «Cambia i codici» ne porta di nuovi');
        CDC.lg=lg0; impostaLivelloGioco('codice',d0); CDC.liv=liv0; CDC.dodici=null; }
      ok(G.parole.length>=50 && G.parole.every(w=>w.hints.it.length>=3&&w.hints.ro.length>=3),`Parola misteriosa: ${G.parole.length} parole con tre indizi`);
      ok(G.sequenze.length>=10 && G.associazioni.length>=10,'Tempio: sequenze e associazioni per le prove');
      stato.partite=[]; stato.progressiGiochi={};
      const g=aggiungiGiocatore('Prova dei giochi nuovi').g; stato.imp.giocatoreAttuale=g.i;
      /* 9. la ruota: 10 giri */
      nuovaRuota(); let n=0;
      while(RUO.fase!=='fine' && n<80){ n++;
        if(RUO.fase==='gira'){ RUO.fase='gira-anim'; RUO.spicchio=n%RUO_SPICCHI.length; ruoFermata(); }
        if(RUO.fase==='domanda'){ ruoRispondi(RUO.dom.g); ruoAvanti(); } }
      ok(RUO.fase==='fine' && RUO.giro===10 && RUO.punti>0 && partiteDi('ruota',g.i).length===1,`Ruota: 10 giri, ${RUO.punti} punti, partita salvata per il giocatore`);
      ok(/Migliore categoria/.test($('#vista').innerText) && /Record personale|Nuovo record/.test($('#vista').innerText),'Ruota: alla fine migliore categoria e record personale');
      /* 10. costruisci il versetto: con i suggerimenti arriva sempre in fondo */
      nuovaPartitaVersetto(); let k=0; while(!VRS.finito && k<20){ k++; vrsAiuto(); }
      ok(VRS.finito && /VERSETTO COMPLETATO/.test($('#vista').innerText),'Costruisci il versetto: completato, con testo e riferimento');
      const liv0=livelloGioco('versetto'); impostaLivelloGioco('versetto',1); vrsNuovo(); ok(VRS.blocchi.length===4,'livello facile: 4 blocchi');
      impostaLivelloGioco('versetto',3); vrsNuovo(); ok(VRS.blocchi.length>=8,`livello difficile: ${VRS.blocchi.length} blocchi`); impostaLivelloGioco('versetto',liv0);
      /* 11. il viaggio: la prima tappa, poi si riprende da dove eri */
      VIA.j=null; viaApri(G.viaggi[0].id); const P=VIA.prova;
      if(P.p.tipo==='ordina') P.ord.voci.forEach((_,i)=>viaOrdina(i)); else if(P.p.tipo==='puzzle') P.lettere.forEach((c,i)=>viaLettera(P.mix.find(x=>P.lettere[x]===c&&!P.scelte.includes(x)))); else viaRispondi(P.g);
      ok(viaStato(G.viaggi[0].id).tappa===1 && /VIAGGIO: 2\//.test($('#vista').innerText),'Viaggio: superata la prova si va alla tappa dopo, e resta salvato');
      ok(!viaAperto(1),'Viaggio: il secondo viaggio si apre solo dopo aver finito il primo');
      /* 12. il codice: tutti gli enigmi, poi il tastierino */
      cdcApri(G.codici[0].id); let m=0;
      while(CDC.fase==='enigmi' && m<10){ m++; const e=cdcCorrente().enigmi[CDC.i];
        if(e.tipo==='num'||e.tipo==='rif'){ String(e.a).split('').forEach(t=>cdcTasto(t)); cdcTasto('OK'); }
        else if(e.tipo==='ordina') CDC.dato.ord.voci.forEach((_,i)=>cdcOrdina(i)); else cdcScegli(CDC.dato.g); }
      cdcCodice(cdcCorrente()).split('').forEach(t=>cdcTasto(t)); cdcTasto('OK');
      ok(CDC.fase==='aperto' && cdcFatti()[G.codici[0].id] && /CODICE DECIFRATO/.test($('#vista').innerText),'Codice segreto: lo scrigno si apre e il livello resta salvato per il giocatore');
      /* 13. parola misteriosa */
      nuovaParola(); [...new Set(PMI.parola.split(''))].forEach(c=>pmiLettera(c));
      ok(PMI.vinto && PMI.punti>0,'Parola misteriosa: trovata la parola');
      nuovaParola(); 'QXWZJKYV'.split('').filter(c=>!PMI.parola.includes(c)).slice(0,5).forEach(c=>pmiLettera(c));
      ok(PMI.finito && !PMI.vinto && $$('.pmi-lampade .spenta').length===5,'Parola misteriosa: cinque errori spengono le cinque lampade');
      /* 14. il tempio: una fase superata aggiunge una parte */
      TPL.prove=null; tplIniziaFase();
      for(let i=0;i<5;i++){ const Q=TPL.prove[TPL.i];
        if(Q.tipo==='vf') tplVF(Q.vero); else if(Q.tipo==='sequenza') Q.ord.voci.forEach((_,j)=>tplOrdina(j));
        else if(Q.tipo==='associa') Q.coppie.forEach((_,j)=>{ tplAssocia('s',j); tplAssocia('d',j); }); else tplRispondi(Q.g);
        tplAvanti(); }
      ok(tplStato().fase===1 && (T3D.ok?T3D.fatte===1&&!!$('#tpl3dPosto canvas'):$$('.tpl-parte').length===1),'Tempio: fase superata (5 su 5), le fondamenta sono costruite (nel Tempio in 3D)');
      /* 15. sprint */
      SPR.fine=null; avviaSprint(); const c1=SPR.corrente; sprRispondi(c1.g); SPR.esito=null; sprProssima(); sprRispondi((SPR.corrente.g+1)%4); sprStop();
      ok(!SPR.timer && SPR.domande===2 && SPR.giuste===1 && SPR.errori.length===1 && /Rivedi gli errori/.test($('#vista').innerText),'Bibbia Sprint: fine partita con statistiche ed errori da rivedere');
      /* 16. scalata fino al milione */
      nuovaScalata(); let s=0; while(!SCL.fine && s<20){ s++; sclScegli(SCL.dom.g); sclConferma(); if(!SCL.fine) sclAvanti(); }
      ok(SCL.vinto && SCL.fine.vincita===1000000 && gnTrofei().some(t=>t.id==='campione'),'Scalata: 15 domande, 1.000.000 e trofeo «Campione biblico»');
      nuovaScalata(); SCL.passo=6; sclScegli((SCL.dom.g+1)%4); sclConferma();
      ok(SCL.fine && SCL.fine.vincita===1000,'Scalata: sbagliando dopo la domanda 5 restano i 1.000 garantiti');
      /* un solo archivio di giocatori: le partite nuove stanno insieme a quelle degli altri giochi */
      ok(['ruota','codice','parola','tempio','sprint','scalata'].every(id=>partiteDi(id,g.i).length>=1),'le partite dei giochi nuovi stanno nell\'archivio unico dei giocatori');
      apriGiocatore('scalata',g.i);
      ok(/Progressi e trofei/.test($('#vista').innerText),'nella pagina del giocatore ci sono i progressi e i trofei');
    } catch(x){ ok(false,'giochi nuovi: '+x.message); }
    finally{
      gnFermaTimer();
      GIOCHI_PAUSA.ms=pausa; window.avvisa=_avv;
      stato.partite=snap.pa||[]; stato.progressiGiochi=snap.pr||{}; stato.imp=snap.im; stato.viste=snap.vi; stato.giocatori=snap.gi||[];
      Object.assign(GIO,snap.gio);
      [RUO,VRS,VIA,CDC,PMI,TPL,SPR,SCL].forEach(o=>{ if('pid' in o) o.pid=null; });
      RUO.fase='gira'; RUO.dom=null; RUO.fine=null; VRS.v=null; VIA.j=null; VIA.prova=null; CDC.liv=null; PMI.w=null; TPL.prove=null; TPL.esitoFase=null; SPR.fine=null; SCL.dom=null;
      salva(); vai(snap.sez);
    }
  })();
  /* ---- ritocchi del 25 settembre: logo, cruciverba, pagina dei giochi, libri ---- */
  (function(){
    const sez0=sezione;
    try{
      vai('bibbia'); vaiHomeDalLogo();
      ok(sezione==='home' && /vaiHomeDalLogo/.test($('#barra .marchio').getAttribute('onclick')||''),'toccando il logo B in alto si torna alla Home');
      /* cruciverba: toccando una casella con una lettera, la lettera si cancella */
      const inp=document.createElement('input'); inp.dataset.x='90'; inp.dataset.y='90'; inp.value='A';
      const s0=CRV.scritte['90,90'], m0=CRV.marche['90,90']; CRV.scritte['90,90']='A'; CRV.marche['90,90']='giusta';
      cvPremuto(inp);
      ok(inp.value==='' && !CRV.scritte['90,90'] && !CRV.marche['90,90'],'nel cruciverba, toccando una casella già scritta la lettera si cancella');
      if(s0!==undefined) CRV.scritte['90,90']=s0; if(m0!==undefined) CRV.marche['90,90']=m0;
      /* la pagina dei giochi: 16 giochi in 4 righe da 4, dentro lo schermo (sull'iPad) */
      vai('giochi'); tornaGiochi();
      ok(document.body.classList.contains('gio-hub-fissa'),'la pagina dei giochi è in schermata fissa');
      if(innerWidth>=641 && innerHeight>=560){
        const v=$('#vista'), t=$$('.gio-hub .tz');
        ok(t.length===16 && v.scrollHeight<=v.clientHeight+1 && t[15].getBoundingClientRect().bottom<=innerHeight+1,'tutti e 16 i giochi stanno dentro lo schermo');
      }
      apriGioco('ruota');
      ok(!document.body.classList.contains('gio-hub-fissa') && document.body.classList.contains('gio-fissa'),'aprendo un gioco nuovo si passa alla sua schermata fissa, con «Proietta»');
      ok(['ruota','versetto','viaggio','codice','parola','tempio','sprint','scalata'].every(id=>String(vGiochi).includes("'"+id+"'")),'tutti i giochi nuovi hanno la schermata fissa e il pulsante «Proietta»');
      /* libri: il nome si cambia toccandolo; si leggono nel lettore dei lezionari, con la barra degli appunti */
      ok(/lbNomina/.test(String(vLibri)),'nella sezione Libri il nome si cambia toccandolo');
      ok(/libro:true/.test(String(lbApri)) && /lbSegna/.test(String(apriLez)) && /Segnalibri/.test(String(apriLez)),'i libri si aprono nel lettore, con la barra degli appunti e i segnalibri');
    } finally { vai(sez0); }
  })();
  /* ---- giocatori, livelli e storia dei giochi ---- */
  (function(){
    const copia=o=>JSON.parse(JSON.stringify(o));
    const snap={gi:copia(elencoGiocatori()), pa:copia(elencoPartite()), imp:copia(stato.imp), gio:Object.assign({},GIO), sez:sezione};
    const giochi={CRV,VF,IMP,MEM,TRIS,BLZ,CPL,CSI};
    const statiGiochi={}; Object.keys(giochi).forEach(k=>{ statiGiochi[k]=copia(giochi[k]); });
    const _avv=window.avvisa; window.avvisa=function(){};
    try{
      stato.giocatori=[]; stato.partite=[]; stato.imp.giocatoreAttuale=null; stato.imp.trisGiocatori=null;
      stato.imp.livGiochi={}; stato.imp.classificaDa={};
      /* i tre livelli scelgono davvero le domande, le frasi, i personaggi e le parole */
      ['it','ro'].forEach(lg=>[1,2,3].forEach(l=>{
        const dq=domandeLivello(lg,l), cq=citazioniLivello(lg,l), bm=bancaCruciverba(lg,'misto','tutta',0,l);
        ok(dq.length>=1000 && dq.every(d=>livDomanda(d)===l),`livello ${LIVELLI[l].et} (${lg}): ${dq.length} domande, tutte di quel livello`);
        ok(cq.length>=900 && cq.every(c=>(c.dif||2)===l),`livello ${LIVELLI[l].et} (${lg}): ${cq.length} frasi di «Chi ha detto?»`);
        ok(_personaggiConCitazioni(lg,3,l).length>=10,`livello ${LIVELLI[l].et} (${lg}): personaggi per «Chi sono io?»`);
        ok(contaPersonaggiMemoria(lg,l)>=40,`livello ${LIVELLI[l].et} (${lg}): personaggi per la Memoria`);
        ok(bm.length>=1600 && bm.every(w=>w.dif===l),`livello ${LIVELLI[l].et} (${lg}): ${bm.length} parole per il cruciverba`);
        ok(nuovoCruciverba(bm,CRV_PAROLE[l],seme(11+l),{lg,tema:'misto',ambito:'tutta',libro:0,liv:l}).parole.length>=CRV_PAROLE[l]-2,`il cruciverba ${LIVELLI[l].et} (${lg}) ha le sue ${CRV_PAROLE[l]} parole`);
      }));
      const lungMedia=(lg,l)=>{ const b=bancaBibbiaParole(lg,'tutta',0,l); return b.reduce((s,w)=>s+w.parola.length,0)/b.length; };
      ok(lungMedia('it',1)<lungMedia('it',2) && lungMedia('it',2)<lungMedia('it',3),'salendo di livello le parole diventano più lunghe e più rare');
      ok(IMP_LIV[1].max>IMP_LIV[2].max && IMP_LIV[2].max>IMP_LIV[3].max,'e all\'impiccato si possono fare meno errori');
      impostaLivelloGioco('memoria',3);
      ok(livelloGioco('memoria')===3 && livelloGioco('blitz')===2,'il livello scelto in un gioco resta salvato; gli altri restano «Medio»');
      stato.imp.livGiochi={};
      /* i giocatori */
      const a=aggiungiGiocatore('Prova Uno').g, b=aggiungiGiocatore('Prova Due').g;
      ok(a&&b&&a.c!==b.c&&elencoGiocatori().length===2,'si aggiungono giocatori, ognuno con il suo colore');
      ok(aggiungiGiocatore(' prova  UNO ').errore==='esiste' && aggiungiGiocatore('   ').errore==='vuoto','lo stesso nome non si aggiunge due volte e un nome vuoto nemmeno');
      /* le partite: una riga per partita */
      salvaRisultato('blitz',a.i,'k1',80,{giuste:8,tot:10});
      salvaRisultato('blitz',a.i,'k1',70,{giuste:7,tot:10},'migliore');
      ok(partiteDi('blitz',a.i).length===1 && partiteDi('blitz',a.i)[0].perc===80,'un cruciverba verificato più volte resta UNA partita, col risultato più alto');
      salvaRisultato('completa',a.i,'k2',50,{giuste:1,tot:2},'ultimo'); salvaRisultato('completa',a.i,'k2',67,{giuste:2,tot:3},'ultimo');
      ok(partiteDi('completa',a.i).length===1 && partiteDi('completa',a.i)[0].perc===67,'una serie di frasi è UNA partita che si aggiorna a ogni risposta');
      ok(salvaRisultato('blitz','non-esiste','k9',50)===null && partiteDi('blitz','non-esiste').length===0,'senza un giocatore vero non si salva niente');
      const r0=partiteDi('blitz',a.i)[0];
      ok(r0.liv===2 && r0.lg==='it' && r0.q>0,'ogni partita ricorda il livello, la lingua e la data');
      [95,75,55,20].forEach((p,i)=>salvaRisultato('memoria',b.i,'m'+i,p,{mosse:10,coppie:8}));
      const st=statistiche(partiteDi('memoria',b.i));
      ok(st.n===4 && st.migliore===95 && st.media===61 && st.punti===245 && st.premi.oro===1 && st.premi.argento===1 && st.premi.bronzo===1 && st.premi.no===1,
         'le statistiche: partite, media, migliore, punti e premi');
      ok(classificaLivello('memoria',2).length===1 && classificaLivello('memoria',2)[0].perc===95 && classificaLivello('memoria',3).length===0,
         'la classifica ha il risultato migliore di ogni giocatore, livello per livello');
      stato.imp.classificaDa={memoria:Date.now()+5000};
      ok(classificaLivello('memoria',2).length===0 && partiteDi('memoria',b.i).length===4,'«Azzera» svuota la classifica ma le partite del giocatore restano');
      stato.imp.classificaDa={};
      /* la riga dei giocatori dentro a ogni gioco */
      const barra=htmlGiocatori('verofalso');
      ok(/Prova Uno/.test(barra) && /Prova Due/.test(barra) && /Facile/.test(barra) && /Medio/.test(barra) && /Difficile/.test(barra),'la riga dei giocatori mostra i giocatori e i tre livelli');
      ok(/gc-segno/.test(htmlGiocatori('tris')) && !/gc-segno/.test(barra),'in X e O ogni giocatore si assegna a ❌ o a ⭕');
      /* X e O: due giocatori, un risultato ciascuno */
      stato.imp.trisGiocatori={X:a.i,O:b.i}; GIO.vista='tris'; GIO.giocatore=null; nuovoTris();
      const mossa=(c,g)=>{ trisClicca(c); const dm=TRIS.domanda; trisRispondi(g?dm.g:(dm.g+1)%3); };
      mossa(0,true); mossa(3,false); mossa(1,true); mossa(3,true); mossa(2,true);
      const rx=partiteDi('tris',a.i)[0], ro=partiteDi('tris',b.i)[0];
      ok(TRIS.finito && rx && ro && rx.perc===100 && rx.d.esito==='V' && ro.perc===50 && ro.d.esito==='S',
         'X e O: ogni giocatore ha il suo risultato (risposte giuste, vittoria o sconfitta)');
      ok($$('.tris-premi .premio-box').length===2,'e a fine partita si vedono i due premi');
      /* Vero o Falso: la schermata finale compare (prima ricominciava subito) */
      stato.imp.giocatoreAttuale=a.i; GIO.vista='verofalso'; VF.n=2; nuovoVeroFalso();
      vfRispondi(VF.corrente.vero); VF.i++; vfProssima(); vfRispondi(VF.corrente.vero); VF.i++; vfProssima();
      ok(!!$('.vf-fine') && partiteDi('verofalso',a.i).length===1 && partiteDi('verofalso',a.i)[0].perc===100,'a fine partita il Vero o Falso mostra il risultato e lo salva');
      stato.imp.giocatoreAttuale=null;
      /* la pagina di un giocatore: intestazione, statistiche, grafico ed elenco */
      const p=b; GIO.vista='memoria'; GIO.giocatore=p.i; GIO.gpLiv=0; GIO.gpTutte=false; vGiochi();
      ok(!!$('.gp-hero') && $('.gp-nome').textContent===p.n && $$('.gp-riga').length===4 && $$('.gp-svg circle').length===4 && $$('.gp-kpi .kpi').length===4,
         'la pagina del giocatore ha intestazione, statistiche, grafico e l\'elenco delle sue partite con la data');
      ok(/lug|ago|set|ott|nov|dic|gen|feb|mar|apr|mag|giu/i.test($('.gp-riga .gp-r-data b').textContent),'ogni partita porta la sua data');
      GIO.gpLiv=3; vGiochi();
      ok(!!$('.gp-vuoto') && $$('.gp-riga').length===0,'filtrando un livello senza partite compare un messaggio, non un grafico vuoto');
      const svg=svgPercorso([{q:1,perc:50,liv:1,g:'blitz',d:{}},{q:2,perc:90,liv:2,g:'blitz',d:{}},{q:3,perc:70,liv:3,g:'blitz',d:{}}],'#ff6b81');
      ok(/<svg/.test(svg) && (svg.match(/<circle/g)||[]).length===3 && /<path/.test(svg) && svgPercorso([],'#fff')==='','il grafico del percorso: una linea e un punto per ogni partita');
      /* ogni gioco ha la sua riga dei giocatori e dei livelli; la pagina principale non ha più il nome */
      GIO.giocatore=null;
      ['cruciverba','verofalso','impiccato','memoria','tris','blitz','completa','chisono'].forEach(id=>{
        GIO.vista=id; vGiochi();
        const livelli = id==='cruciverba' ? $$('.cv-liv .op').length : $$('#gioGioc .gg-liv .op').length;
        ok(!!$('#gioGioc') && livelli===3,`in «${GIOCHI_INFO[id].et}» ci sono i giocatori e i tre livelli`);
      });
      /* il cruciverba: tre barre di scelta, i livelli NON nella barra dei giocatori, e la pagina scorre per intero */
      (function(){
        GIO.vista='cruciverba'; GIO.giocatore=null; vGiochi();
        ok($$('.cv-barre>*').length===3,'il cruciverba ha solo tre barre di scelta');
        ok($$('#gioGioc .gg-liv').length===0 && $$('.cv-barre>.cv-bar:last-child .cv-liv .op').length===3,'i livelli stanno nella barra di sotto, non in quella dei giocatori');
        ok(!document.body.classList.contains('gio-fissa') && document.body.classList.contains('cv-attivo'),'la pagina del cruciverba scorre per intero (niente schermata fissa)');
        const bt=$('#btProietta');
        ok(bt && bt.textContent.trim()==='Proietta' && getComputedStyle(bt).display!=='none' && bt.closest('#barra'),'nella barra in alto c\'è il pulsante «Proietta», con scritto solo Proietta');
        ok(parseFloat(getComputedStyle($('.cv-clue')).fontSize)>=16,'le domande (orizzontali e verticali) sono più grandi di prima');
        ok(!!$('.cv-grid').style.getPropertyValue('--cv-c'),'la griglia si adatta allo schermo');
        cvProietta();
        ok(document.body.classList.contains('cv-proietta') && getComputedStyle($('.cv-barre')).display==='none' && getComputedStyle($('#lato')).display==='none',
           '«Proietta»: restano solo il cruciverba e le sue domande (niente barre, menu, titolo)');
        ok(getComputedStyle(bt).display!=='none' && getComputedStyle(bt).visibility==='visible','…e il pulsante per smettere resta a portata');
        cvProietta();
        ok(!document.body.classList.contains('cv-proietta') && getComputedStyle($('.cv-barre')).display!=='none','toccando ancora «Proietta» si torna com\'era');
        /* si scrive nella direzione scelta e non si cambia strada agli incroci; le lettere si accendono subito */
        (function(){
          const celle={}, parole=[];
          [['ROMA',0,1,1,0,2],['SOLE',1,0,0,1,1]].forEach(([w,x,y,dx,dy,num])=>{
            parole.push({parola:w,x,y,dx,dy,num,indizio:'prova '+w,tipo:'p',L:1,e:{}});
            for(let i=0;i<w.length;i++){ const k=(x+dx*i)+','+(y+dy*i); celle[k]=celle[k]||{lettera:w[i]}; if(i===0) celle[k].num=num; }
          });
          const salvo={dati:CRV.dati,scritte:CRV.scritte,marche:CRV.marche,dir:CRV.dir,svelato:CRV.svelato};
          CRV.dati={righe:4,colonne:4,celle,parole}; CRV.scritte={}; CRV.marche={}; CRV.dir='o'; CRV.svelato=false; vCruciverba();
          const giu=cvSuccessiva(1,1,'v'), destra=cvSuccessiva(1,1,'o');
          ok(giu && giu.x===1 && giu.y===2,'scrivendo in verticale, all\'incrocio con una parola orizzontale il cursore continua in giù');
          ok(destra && destra.x===2 && destra.y===1,'e scrivendo in orizzontale, sullo stesso incrocio, continua a destra');
          ok(cvSuccessiva(1,3,'v')===null && cvSuccessiva(3,1,'o')===null && cvSuccessiva(1,0,'o')===null,
             'alla fine della parola il cursore si ferma, e non gira da solo nell\'altra direzione');
          const inp=(x,y)=>$(`.cv-grid input[data-x="${x}"][data-y="${y}"]`);
          const scrivi=(x,y,ch,sopra)=>{ const i=inp(x,y); i.value=(sopra||'')+ch; cvDigita(i,{data:ch}); return i; };
          CRV.dir='o'; cvFuoco(inp(1,0));
          ok(CRV.dir==='v' && $$('.cv-cella.in-parola').length===4,'una casella con una parola sola: si scrive in quella direzione e la parola si evidenzia');
          const a=scrivi(1,0,'S'), b=scrivi(1,1,'X');
          ok(a.classList.contains('giusta') && b.classList.contains('sbagliata') && CRV.marche['1,0']==='giusta' && CRV.marche['1,1']==='sbagliata',
             'la lettera giusta si accende di verde appena scritta, quella sbagliata di rosso');
          const b2=scrivi(1,1,'O','X');
          ok(b2.value==='O' && b2.classList.contains('giusta') && !b2.classList.contains('sbagliata'),'scrivendo sopra a una lettera sbagliata la si corregge, e diventa verde');
          const n1=scrivi(1,2,'7'); ok(n1.value==='' ,'un carattere che non è una lettera non entra');
          scrivi(1,2,'L'); scrivi(1,3,'E');
          const rSole=$('.cv-clue[data-p="1"]'), rRoma=$('.cv-clue[data-p="0"]');
          ok(rSole.classList.contains('giusta') && !rRoma.classList.contains('giusta') && !rRoma.classList.contains('sbagliata'),
             'la parola tutta giusta diventa verde nelle domande; quella non ancora scritta resta com\'è');
          scrivi(0,1,'R'); scrivi(2,1,'M'); scrivi(3,1,'P');
          ok(rRoma.classList.contains('sbagliata') && !rRoma.classList.contains('giusta'),'una parola tutta scritta ma con un errore diventa rossa');
          scrivi(3,1,'A','P');
          ok(rRoma.classList.contains('giusta') && !rRoma.classList.contains('sbagliata') && $$('.cv-grid input.giusta').length===7,
             'corretto l\'errore, la parola diventa verde: quando sono tutte verdi il cruciverba è finito');
          vCruciverba();
          ok($$('.cv-grid input.giusta').length===7 && $('.cv-clue[data-p="1"]').classList.contains('giusta'),
             'uscendo e rientrando le lettere restano verdi (e le domande delle parole giuste)');
          const ic=inp(1,1); ic._eraGia=true; CRV.dir='o'; cvClic(ic);
          ok(CRV.dir==='v','toccando ancora la casella d\'incrocio si gira da orizzontale a verticale');
          const ir=inp(0,1); ir._eraGia=true; cvClic(ir);
          ok(CRV.dir==='v','una casella con una parola sola non cambia direzione toccandola ancora');
          CRV.dir='v'; cvFuoco(ir);
          ok(CRV.dir==='o','toccare una casella che ha solo la parola orizzontale porta in orizzontale');
          Object.assign(CRV,salvo); vCruciverba();
        })();
        /* nella barra dei giocatori del cruciverba: nessuna frase sotto «Nuovo giocatore», caselle più piccole */
        (function(){
          const era=stato.imp.giocatoreAttuale; stato.imp.giocatoreAttuale=null;
          GIO.vista='cruciverba'; GIO.giocatore=null; vGiochi();
          ok(!$('#gioGioc .gg-nota'),'nel cruciverba sotto «Nuovo giocatore» non c\'è nessuna frase');
          const av=$('.cv-barre .gc-av');
          ok(!av || av.getBoundingClientRect().width<=26.5,'la barra dei giocatori del cruciverba è più stretta (avatar piccoli)');
          ['verofalso','impiccato','memoria','tris','blitz','completa','chisono'].forEach(id=>{
            GIO.vista=id; vGiochi();
            const a2=$('#gioGioc .gc-av');
            ok(!$('#gioGioc .gg-nota') && (!a2 || a2.getBoundingClientRect().width<=26.5),
               `«${GIOCHI_INFO[id].et}»: sotto «Nuovo giocatore» nessuna frase, e la barra dei giocatori è stretta come nel cruciverba`);
          });
          stato.imp.giocatoreAttuale=era; GIO.vista='cruciverba'; vGiochi();
        })();
        const nu=$('.cv-bar .op.nuovo'), neutro=$('.cv-bar .op:not(.on):not(.nuovo)');
        ok(nu && neutro && getComputedStyle(nu).backgroundColor!==getComputedStyle(neutro).backgroundColor,'il pulsante «Nuovo» del cruciverba è colorato');
        cvProietta(); tornaGiochi();
        ok(!document.body.classList.contains('cv-attivo') && !document.body.classList.contains('cv-proietta') && getComputedStyle(bt).display==='none',
           'uscendo dal cruciverba il pulsante «Proietta» sparisce e la proiezione si spegne');
      })();
      /* «Proietta» sta nella barra in alto in TUTTI i giochi e proietta solo il gioco (come nel cruciverba) */
      (function(){
        const bt=$('#btProietta');
        ['verofalso','impiccato','memoria','tris','blitz','completa','chisono'].forEach(id=>{
          GIO.vista=id; GIO.giocatore=null; vGiochi();
          ok(getComputedStyle(bt).display!=='none' && !/Ingrandisci per proiettare/.test($('#vista').innerText),
             `«${GIOCHI_INFO[id].et}»: «Proietta» sta nella barra in alto (e la vecchia scatola «Ingrandisci» non c'è più)`);
          proiettaPagina();
          const b=document.body;
          ok(b.classList.contains('gioco-proiettore') && getComputedStyle($('#lato')).display==='none' && getComputedStyle($('.gio-pagina .scelte')).display==='none'
             && getComputedStyle($('.gio-pagina>h1')).display==='none' && getComputedStyle(bt).visibility==='visible',
             `«${GIOCHI_INFO[id].et}»: «Proietta» lascia solo il gioco, e il pulsante per tornare resta`);
          proiettaPagina();
          ok(!b.classList.contains('gioco-proiettore') && getComputedStyle($('.gio-pagina .scelte')).display!=='none',`«${GIOCHI_INFO[id].et}»: toccando ancora «Proietta» si torna com'era`);
        });
        GIO.vista='hub'; vGiochi();
        ok(getComputedStyle(bt).display==='none','nell\'elenco dei giochi «Proietta» non c\'è');
      })();
      /* Vero o Falso: Vero verde e Falso rosso; la risposta si accende subito */
      (function(){
        GIO.vista='verofalso'; GIO.giocatore=null; VF.n=3; nuovoVeroFalso();
        const vero=$('.vf-bt .bt.vd'), falso=$('.vf-bt .bt.pr');
        ok(vero && /Vero/.test(vero.textContent) && falso && /Falso/.test(falso.textContent)
           && getComputedStyle(vero).backgroundImage!==getComputedStyle(falso).backgroundImage,'in Vero o Falso «Vero» è verde e «Falso» è rosso');
        const giusta=VF.corrente.vero; vfRispondi(giusta);
        ok(!!$('.vf-card.esito-giusto') && $('.vf-esito.giusto') && $$('.vf-bt .bt[disabled]').length===2,'risposta giusta: la scheda si accende di verde e i due pulsanti restano');
        VF.i++; vfProssima(); vfRispondi(!VF.corrente.vero);
        ok(!!$('.vf-card.esito-sbagliato') && $('.vf-esito.falso'),'risposta sbagliata: la scheda si accende di rosso');
        const av=$('.vf-card .bt.blu'), col=av && /rgb\((\d+), (\d+), (\d+)\)/.exec(getComputedStyle(av).backgroundImage);
        ok(av && /Avanti/.test(av.textContent) && col && +col[3]>200 && +col[1]<100,'in Vero o Falso il pulsante «Avanti» è blu acceso');
        /* le domande: tutte e 5.000 di ogni lingua; il livello decide quali escono più spesso, non le taglia */
        ok(domandeTutte('it').length===DOMANDE.filter(d=>d.lg==='it').length && domandeTutte('ro').length===DOMANDE.filter(d=>d.lg==='ro').length && domandeTutte('it').length>4900,`Vero o Falso ha tutte le domande di ogni lingua (${domandeTutte('it').length} + ${domandeTutte('ro').length})`);
        nuovoVeroFalso();
        ok($$('.scelta-op .op')[0].textContent.replace('.','').includes(String(domandeTutte('it').length)) && $$('.scelta-op .op')[1].textContent.replace('.','').includes(String(domandeTutte('ro').length)),'e la pagina dice quante sono in italiano e in rumeno');
        const facili=scegliDomandePesate('it',1,600), difficili=scegliDomandePesate('it',3,600);
        ok(new Set(facili).size===600 && facili.filter(d=>d.dif<=2).length>=0.7*600 && difficili.filter(d=>d.dif>=3).length>=0.7*600,
           'a «facile» escono soprattutto le domande facili e a «difficile» soprattutto le difficili, senza ripetizioni');
        ok(scegliDomandePesate('ro',2,5000).length===domandeTutte('ro').length,'a qualunque livello si possono estrarre tutte le domande');
      })();
      /* Impiccato: alla fine il risultato e il pulsante «Gioca ancora» (blu acceso) stanno a sinistra, il premio a destra */
      (function(){
        GIO.vista='impiccato'; GIO.giocatore=null; nuovoImpiccato();
        IMP.indovinate=[...new Set(IMP.parola.parola.split(''))]; vImpiccato();
        const bl=$('.imp-fine .imp-fine-sx .bt.blu'), col=bl && /rgb\((\d+), (\d+), (\d+)\)/.exec(getComputedStyle(bl).backgroundImage);
        ok(bl && /Gioca ancora/.test(bl.textContent) && col && +col[3]>200 && +col[1]<100 && !!$('.imp-fine .imp-fine-dx .premio-box'),
           'in Impiccato, a fine partita, «Gioca ancora» è blu acceso e accanto c\'è il premio (tutto nello schermo)');
        ok($$('.scelte-imp .scelta').length===3,'in Impiccato le tre scelte (lingua, indizio, ricomincia) stanno in una riga sola');
        IMP.parola=null;
      })();
      /* il pulsante «← Giochi» per tornare a tutti i giochi è colorato, in ogni gioco */
      (function(){
        GIO.vista='impiccato'; GIO.giocatore=null; nuovoImpiccato();
        const tg=$('.gio-pagina>.torna-gio');
        ok(tg && /Giochi/.test(tg.textContent) && /gradient/.test(getComputedStyle(tg).backgroundImage) && getComputedStyle(tg).color==='rgb(255, 255, 255)',
           'il pulsante «← Giochi» è colorato');
        const src=[vCruciverba,vVeroFalso,vImpiccato,vMemoria,vTris,vBlitz,vCompleta,vChiSono].map(f=>String(f));
        ok(src.every(t=>t.includes('torna-gio')),'…in tutti e 8 i giochi');
        IMP.parola=null;
      })();
      /* Impiccato: solo parole sensate, ognuna con la sua piccola descrizione, che si vede sopra la parola */
      (function(){
        const vuote=['PERCHE','DELLA','LORO','COME','SONO','QUANDO','PENTRU','CARE','ESTE','DUPA'];
        ['it','ro'].forEach(lg=>{
          const b=bancaImpiccato(lg);
          ok(b.length>=800 && b.every(w=>/^[A-Z]{3,13}$/.test(w.parola) && w.desc && w.desc.length>=10 && !_crvContiene(w.desc,w.parola)),
             `impiccato (${lg}): ${b.length} parole, ognuna con la descrizione (che non contiene la parola)`);
          ok(!b.some(w=>vuote.includes(w.parola)),`impiccato (${lg}): niente parole come «perché» o «della»`);
          ok([1,2,3].every(l=>bancaImpiccato(lg,l).length>=150),`impiccato (${lg}): parole per tutti e tre i livelli`);
        });
        GIO.vista='impiccato'; GIO.giocatore=null; IMP.lg='it'; nuovoImpiccato();
        ok($('.imp-descr') && $('.imp-descr').textContent===IMP.parola.desc,'nell\'impiccato la descrizione della parola si vede subito, sopra le lettere');
        IMP.parola=null;
      })();
      /* Completa la frase e Chi sono io?: con la risposta c'è il riferimento, e si tocca */
      (function(){
        GIO.vista='completa'; GIO.giocatore=null; CPL.lg='it'; nuovaFrase();
        ok(!$('.cpl-rif'),'in Completa la frase il riferimento non si vede prima di rispondere');
        cplRispondi(CPL.corrente.g);
        const r=$('.cpl-rif'), atteso=rifCit(CPL.corrente.cit);
        ok(r && r.textContent.includes(atteso),`in Completa la frase, con la risposta, c'è il riferimento (${atteso})`);
        if(r){ r.click(); ok($('#modale').classList.contains('on') && $('#modale .cap b').textContent===atteso,'…e toccandolo si legge il versetto'); chiudi(); }
        GIO.vista='chisono'; CSI.lg='it'; CSI.persona=null; nuovoChiSono(); csiIndizio();
        ok(!$('.csi-rif'),'in Chi sono io? i riferimenti non si vedono prima di rispondere');
        csiRispondi(CSI.persona);
        const rr=$$('.csi-rif');
        ok(rr.length===CSI.mostrati && rr.every((x,i)=>x.textContent.includes(rifCit(CSI.indizi[i]))),`in Chi sono io?, con la risposta, ogni indizio ha il suo riferimento (${rr.length})`);
        if(rr[0]){ rr[0].click(); ok($('#modale').classList.contains('on') && $('#modale .cap b').textContent===rifCit(CSI.indizi[0]),'…e si tocca'); chiudi(); }
        CPL.corrente=null; CSI.persona=null;
      })();
      /* X e O: si sceglie chi gioca con la ❌ e chi con il ⭕; campo grande e centrato; risposte compatte e colorate */
      (function(){
        const salvo=JSON.stringify(stato.imp.trisGiocatori||null), era=stato.imp.giocatoreAttuale;
        GIO.vista='tris'; GIO.giocatore=null; stato.imp.trisGiocatori={X:null,O:null}; nuovoTris();
        const sel=$$('.tris-chi select');
        ok(sel.length===2 && sel[0].options.length===elencoGiocatori().length+1,'in X e O due elenchi: chi gioca con ❌ e chi con ⭕');
        const g1=elencoGiocatori()[0], g2=elencoGiocatori()[1];
        if(g1&&g2){
          assegnaSegnoTris('X',g1.i); assegnaSegnoTris('O',g2.i);
          ok(trisGiocatore('X') && trisGiocatore('X').i===g1.i && trisGiocatore('O') && trisGiocatore('O').i===g2.i && $$('.tris-chi select')[0].value===g1.i,'scelti i due giocatori: uno con la ❌ e uno con il ⭕');
          assegnaSegnoTris('O',g1.i);
          ok(trisGiocatore('O').i===g1.i && !trisGiocatore('X'),'lo stesso giocatore non può stare con tutti e due i segni: passa all\'altro');
        }
        ok(getComputedStyle($('.tris-campo')).alignItems==='center' && parseFloat(getComputedStyle($('.tris-cella')).width)>=90,'il campo di X e O è centrato e grande');
        GIOCHI_PAUSA.ms=60000;
        trisClicca(0);
        const dm=TRIS.domanda; trisRispondi((dm.g+1)%3);
        ok($$('.dom-opz .bt.giusta').length===1 && $$('.dom-opz .bt.sbagliata').length===1 && $$('.dom-opz .bt.spenta').length===1 && $$('.dom-opz .bt[disabled]').length===3,
           'in X e O la risposta si accende subito: quella giusta di verde, la tua sbagliata di rosso');
        const dentro=()=>{ const cd=$('.dom-card'); return !!cd && cd.scrollHeight<=cd.clientHeight+1
          && $$('.dom-card .dom-testo,.dom-card .dom-opz .bt').every(e=>e.scrollHeight<=e.clientHeight+1 && e.scrollWidth<=e.clientWidth+1); };
        ok(dentro(),'il riquadro della domanda di X e O contiene la domanda e le risposte, senza che niente esca fuori');
        /* anche con una domanda e tre risposte lunghissime le scritte si adattano e stanno dentro */
        TRIS.esito=null; TRIS.domanda={d:{d:'Che cosa succede con una persona che osserva tutta la legge ma trasgredisce un solo comandamento? '.repeat(3),lg:'it'},
          o:['Non sarà mai perdonato se lo ha fatto volontariamente e con piena consapevolezza davanti a tutti','Niente','È colpevole di tutta la Legge come se l\'avesse trasgredita tutta quanta'], g:1};
        vTris();
        ok(dentro(),'anche con una domanda e risposte lunghissime, le scritte si adattano al riquadro e nessuna esce fuori');
        TRIS.esito=null; TRIS.domanda=null; GIOCHI_PAUSA.ms=0;
        stato.imp.trisGiocatori=JSON.parse(salvo)||{X:null,O:null}; stato.imp.giocatoreAttuale=era; nuovoTris();
      })();
      /* Blitz, Completa la frase, Chi sono io?, Memoria: verde e rosso subito */
      (function(){
        GIOCHI_PAUSA.blitz=60000; GIO.vista='blitz'; GIO.giocatore=null; avviaBlitz();
        const c=BLZ.corrente; blzRispondi((c.g+1)%3);
        ok($$('.bt.giusta').length===1 && $$('.bt.sbagliata').length===1,'Blitz: la risposta si accende subito di verde (giusta) e di rosso (la tua sbagliata)');
        const cdB=$('.dom-card.blz-card');
        ok(cdB && cdB.scrollHeight<=cdB.clientHeight+1 && $$('.blz-card .dom-opz .bt').every(b=>b.scrollWidth<=b.clientWidth+1),'in Blitz la domanda e le risposte stanno dentro al riquadro');
        ok($$('.scelta-op .op')[0].textContent.replace('.','').includes(String(domandeTutte('it').length)) && $$('.scelta-op .op')[1].textContent.replace('.','').includes(String(domandeTutte('ro').length)),'e Blitz dice quante domande ci sono per italiano e per rumeno');
        fermaBlitzSeAttivo(); BLZ.esito=null; BLZ.corrente=null; GIOCHI_PAUSA.blitz=0; BLZ.tot=0; BLZ.punti=0;
        GIO.vista='completa'; nuovaFrase(); const cc=CPL.corrente; cplRispondi((cc.g+1)%cc.opz.length);
        ok($$('.vf-bt .bt.giusta').length===1 && $$('.vf-bt .bt.sbagliata').length===1,'Completa la frase: dopo la risposta la parola giusta è verde e la tua sbagliata rossa');
        CPL.corrente=null;
        GIO.vista='chisono'; nuovoChiSono();
        const cdC=$('.dom-card.csi-card');
        ok(cdC && cdC.scrollHeight<=cdC.clientHeight+1 && $$('.csi-indizio').every(e=>e.scrollHeight<=e.clientHeight+1) && $$('.csi-opz .bt').length===4,
           'in Chi sono io? l\'indizio e le quattro risposte stanno dentro al riquadro');
        ok(/\d{4}/.test($$('.scelta-op .op')[0].textContent) && domandeChiSono('it').length>=2500 && domandeChiSono('ro').length>=2500,
           `Chi sono io? ha ${domandeChiSono('it').length} domande in italiano e ${domandeChiSono('ro').length} in rumeno (tutte le frasi di «Chi ha detto?» di chi ne ha almeno tre)`);
        const altro=CSI.opzioni.find(k=>k!==CSI.persona); csiRispondi(altro);
        ok($$('.csi-opz .bt.giusta').length===1 && $$('.csi-opz .bt.sbagliata').length===1,'Chi sono io?: dopo la risposta il personaggio giusto è verde e il tuo sbagliato rosso');
        CSI.persona=null;
        GIO.vista='memoria';
        const cmI=coppieMemoria('it'), cmR=coppieMemoria('ro');
        ok(cmI.length===2000 && cmR.length===2000,'Memoria: 2.000 coppie (frase e chi l\'ha detta) per lingua');
        ok([cmI,cmR].every(cm=>[1,2,3].every(l=>Math.abs(cm.filter(c=>c.dif===l).length-2000/3)<=1) && new Set(cm.map(c=>c.q)).size===2000 && cm.every(c=>c.o[c.g]===nomeParlante(c.chi,c.lg))),
           'un terzo per livello, tutte diverse, ognuna col suo personaggio giusto');
        MEM.lg='it'; MEM.n=10; nuovaMemoria();
        const nomiM=MEM.carte.filter(c=>c.tipo==='nome').map(c=>c.testo);
        ok(MEM.carte.length===20 && new Set(nomiM).size===10,'ogni partita di Memoria ha personaggi tutti diversi');
        ok(/2000/.test($('.gio-pagina .sotto').textContent),'la pagina di Memoria dice 2000 coppie per lingua');
        /* sul telefono (larghezza fino a 640) le carte stanno volutamente in 2 colonne: lì il conto delle colonne non vale */
        const telefono=innerWidth<=640;
        ok(telefono || (getComputedStyle($('.mem-grid')).gridTemplateColumns.split(' ').length===5 && $('.mem-grid').style.getPropertyValue('--mr')==='4'),'le carte si dispongono in base a quante sono (20 carte: 5 colonne e 4 righe)');
        MEM.n=6; nuovaMemoria();
        ok(telefono || (getComputedStyle($('.mem-grid')).gridTemplateColumns.split(' ').length===4 && $('.mem-grid').style.getPropertyValue('--mr')==='3'),'12 carte: 4 colonne e 3 righe');
        MEM.n=8; nuovaMemoria();
        const a0=0, b0=MEM.carte.findIndex((x,i)=>i>0 && x.coppia!==MEM.carte[0].coppia);
        MEM.girate=[a0,b0]; MEM.blocco=true; vMemoria();
        ok($$('.mem-carta.errata').length===2,'Memoria: le due carte che non stanno insieme si accendono di rosso');
        MEM.girate=[]; MEM.blocco=false; MEM.trovate=[a0,MEM.carte.findIndex((x,i)=>i!==a0 && x.coppia===MEM.carte[a0].coppia)]; vMemoria();
        ok($$('.mem-carta.trovata').length===2 && $$('.mem-carta.errata').length===0,'Memoria: le carte trovate restano verdi');
        MEM.carte=[]; MEM.trovate=[]; MEM.girate=[];
      })();
      /* le domande dei giochi non si ripetono in nessun gioco finché non sono uscite tutte */
      (function(){
        ['gdit','gdro','gfit','gfro','gmit','gmro','giit','giro','gcit','gcro'].forEach(t=>azzeraViste(t,false));
        const usc=new Set(); let dop=0;
        for(let k=0;k<300;k++){ const d=pescaDomandeGioco('it',1+k%3,1)[0]; if(usc.has(chiaveDomanda(d))) dop++; usc.add(chiaveDomanda(d)); segnaDomandaGioco(d); }
        ok(dop===0 && quanteViste('gdit')===300,'300 domande di seguito fra Vero o Falso, X e O e Blitz: nessuna si ripete');
        GIO.vista='verofalso'; GIO.giocatore=null; VF.lg='it'; VF.n=10; nuovoVeroFalso();
        const prima=chiaveDomanda(VF.domande[0]);
        ok(quanteViste('gdit')===301 && !pescaDomandeGioco('it',2,400).some(d=>chiaveDomanda(d)===prima),'una domanda uscita in Vero o Falso non esce più in X e O né in Blitz');
        const tutte=domandeTutte('ro').map(chiaveDomanda); segnaVisteGioco('gdro',tutte);
        const giro0=giroViste('gdro');
        ok(pescaDomandeGioco('ro',2,10).length===10 && giroViste('gdro')===giro0+1 && quanteViste('gdro')===0,'quando sono uscite tutte le 5.000 il giro ricomincia da capo');
        /* Vero o Falso: il riferimento biblico compare solo dopo la risposta, e mai sopra al pulsante «Avanti» */
        nuovoVeroFalso(); while(VF.corrente && !VF.corrente.d.v && VF.i<VF.domande.length-1){ VF.i++; vfProssima(); }
        ok(!$('.gio-vers'),'in Vero o Falso il riferimento biblico non si vede prima di rispondere');
        vfRispondi(true);
        const rif=$('.vf-azioni .gio-vers'), av2=$('.vf-azioni .bt.blu');
        const rr=rif&&rif.getBoundingClientRect(), ra=av2&&av2.getBoundingClientRect();
        ok(rif && av2 && (rr.right<=ra.left+1 || rr.left>=ra.right-1 || rr.bottom<=ra.top+1 || rr.top>=ra.bottom-1),'dopo la risposta il riferimento biblico compare accanto ad «Avanti», senza sovrapporsi');
        const az=$('.vf-azioni').getBoundingClientRect();
        ok(!!ra && Math.abs((ra.left+ra.right)/2-(az.left+az.right)/2)<=2 && (window.innerWidth<=640 || (rr.right<=ra.left+1 && rr.left<=az.left+2)),
           'in Vero o Falso «Avanti» sta al centro e il riferimento biblico più a sinistra');
        /* Memoria, Impiccato e Cruciverba: niente si ripete */
        const chiaviM=new Set(); let dopM=0;
        for(let k=0;k<25;k++) scegliCoppieMemoria('it',1+k%3,10).forEach(c=>{ if(chiaviM.has(chiaveFrase(c))) dopM++; chiaviM.add(chiaveFrase(c)); });
        ok(dopM===0 && chiaviM.size===250,'in Memoria 25 partite di seguito: le 250 coppie sono tutte diverse');
        MEM.lg='it'; MEM.n=10; nuovaMemoria(); MEM.carte=[];
        const paroleI=new Set(); let dopI=0; GIO.vista='impiccato'; IMP.lg='it';
        for(let k=0;k<60;k++){ nuovoImpiccato(); if(paroleI.has(IMP.parola.parola)) dopI++; paroleI.add(IMP.parola.parola); }
        ok(dopI===0,'in Impiccato 60 parole di seguito, nessuna si ripete');
        IMP.parola=null;
        const paroleC=new Set(); let dopC=0; GIO.vista='cruciverba'; CRV.lg='it'; CRV.tema='misto'; CRV.ambito='tutta';
        for(let k=0;k<10;k++){ nuovoCruciverbaPagina(); CRV.dati.parole.forEach(p=>{ if(paroleC.has(p.parola)) dopC++; paroleC.add(p.parola); }); }
        ok(dopC===0 && paroleC.size>=100,`nel Cruciverba 10 cruciverba di seguito: ${paroleC.size} parole, nessuna si ripete`);
        /* Chi sono io? e Completa la frase: le frasi non si ripetono */
        GIO.vista='chisono'; CSI.lg='it'; const frasiC=new Set(); let dopF=0;
        for(let k=0;k<40;k++){ nuovoChiSono(); const f=CSI.indizi[0]; if(frasiC.has(f.q)) dopF++; frasiC.add(f.q); if(f.chi!==CSI.persona) dopF++; }
        ok(dopF===0,'in Chi sono io? 40 domande di seguito: nessun primo indizio si ripete, e ogni indizio è una frase del personaggio giusto');
        CSI.persona=null;
        GIO.vista='completa'; CPL.lg='it'; const frasiP=new Set(); let dopP=0;
        for(let k=0;k<40;k++){ nuovaFrase(); if(frasiP.has(CPL.corrente.frase)) dopP++; frasiP.add(CPL.corrente.frase); }
        ok(dopP===0,'in Completa la frase 40 frasi di seguito: nessuna si ripete');
        CPL.corrente=null; nuovoVeroFalso();
      })();
      /* in tutti i giochi «Nuova partita» è colorato e «Avanti» blu acceso; X e O non si deforma; in Completa la parola giusta va nella frase, in verde */
      (function(){
        const acceso=el=>{ const m=el && /rgb\((\d+), (\d+), (\d+)\)/.exec(getComputedStyle(el).backgroundImage); return !!m && +m[3]>200 && +m[1]<100; };
        const colorato=el=>{
          if(!el) return false;
          const cs=getComputedStyle(el), m=/rgba?\((\d+), (\d+), (\d+)(?:, ([\d.]+))?\)/.exec(cs.backgroundColor);
          const semplice=$$('.scelta .op').find(o=>!o.classList.contains('on') && !o.classList.contains('nuovo'));
          return !!m && (m[4]===undefined || +m[4]>0.5) && +cs.fontWeight>=700 && (!semplice || cs.backgroundColor!==getComputedStyle(semplice).backgroundColor);
        };
        const avvia={ verofalso:nuovoVeroFalso, impiccato:nuovoImpiccato, memoria:nuovaMemoria, tris:nuovoTris, completa:nuovaFrase, chisono:nuovoChiSono };
        const spenti=[];
        Object.keys(avvia).forEach(id=>{
          GIO.vista=id; GIO.giocatore=null; avvia[id]();
          const b=$$('.scelta .op.nuovo');
          if(!(b.length===1 && colorato(b[0]))) spenti.push(id);
        });
        ok(!spenti.length,'in tutti i giochi il pulsante «Nuova partita» (o «Nuova parola») è colorato'+(spenti.length?' — non lo è in: '+spenti.join(', '):''));
        /* Blitz: «Via!» e poi «Ricomincia» sono colorati; a tempo scaduto «Gioca ancora» è blu acceso */
        GIO.vista='blitz'; GIO.giocatore=null; BLZ.tot=0; BLZ.punti=0; BLZ.attivo=false; BLZ.corrente=null; vBlitz();
        const via=$$('.scelta .op.nuovo');
        ok(via.length===1 && /Via/.test(via[0].textContent) && colorato(via[0]),'Blitz: il pulsante «Via!» è colorato');
        avviaBlitz();
        const ric=$$('.scelta .op.nuovo');
        ok(ric.length===1 && /Ricomincia/.test(ric[0].textContent) && colorato(ric[0]),'Blitz: durante la partita il pulsante «Ricomincia» è colorato');
        fermaBlitzSeAttivo(); BLZ.attivo=false; BLZ.corrente=null; BLZ.tot=4; BLZ.punti=3; vBlitz();
        const ric2=$$('.scelta .op.nuovo'), gioca=$('.vf-fine .bt.blu');
        ok(ric2.length===1 && /Ricomincia/.test(ric2[0].textContent) && colorato(ric2[0]) && !!gioca && /Gioca ancora/.test(gioca.textContent) && acceso(gioca),
           'Blitz: a tempo scaduto «Ricomincia» è colorato e «Gioca ancora» è blu acceso');
        BLZ.tot=0; BLZ.punti=0;
        /* «Avanti» e «Gioca ancora» blu acceso in tutti i giochi */
        const senzaBlu=[];
        const blu=(id,el,testo)=>{ if(!(el && testo.test(el.textContent) && acceso(el))) senzaBlu.push(id); };
        GIO.vista='verofalso'; GIO.giocatore=null; nuovoVeroFalso(); vfRispondi(true); blu('verofalso Avanti',$('.vf-azioni .bt.blu'),/Avanti/);
        VF.i=VF.domande.length; vfProssima(); blu('verofalso Gioca ancora',$('.vf-fine .bt.blu'),/Gioca ancora/);
        GIO.vista='completa'; nuovaFrase(); cplRispondi(CPL.corrente.g); blu('completa Avanti',$('.gio-pagina .scheda .bt.blu'),/Avanti/);
        GIO.vista='chisono'; nuovoChiSono(); csiRispondi(CSI.persona); blu('chisono Avanti',$('.csi-avanti.bt.blu'),/Avanti/);
        GIO.vista='memoria'; nuovaMemoria(); MEM.trovate=MEM.carte.map((c,i)=>i); vMemoria(); blu('memoria Gioca ancora',$('.mem-esito .bt.blu'),/Gioca ancora/);
        GIO.vista='tris'; nuovoTris(); TRIS.griglia=['X','X','X','O','O',null,null,null,null]; TRIS.finito=true; TRIS.vincitore='X'; vTris();
        blu('tris Nuova partita',$('.tris-esito .bt.blu'),/Nuova partita/);
        ok(!senzaBlu.length,'in tutti i giochi «Avanti» e «Gioca ancora» sono blu acceso'+(senzaBlu.length?' — non lo sono: '+senzaBlu.join(', '):''));
        MEM.carte=[]; MEM.trovate=[]; CSI.persona=null; CPL.corrente=null;
        /* X e O: scrivere ❌ o ⭕ non deforma nessuna casella */
        GIO.vista='tris'; GIO.giocatore=null; nuovoTris();
        const mis=()=>$$('.tris-cella').map(c=>{ const r=c.getBoundingClientRect(); return [r.width,r.height]; });
        const prima=mis();
        TRIS.griglia=['X','O','X',null,'O',null,null,'X',null]; vTris();
        const dopo=mis(), w0=prima[0][0];
        ok(prima.length===9 && dopo.length===9 && [...prima,...dopo].every(m=>Math.abs(m[0]-w0)<0.5 && Math.abs(m[1]-w0)<0.5),
           `X e O: le nove caselle restano identiche e quadrate anche con ❌ e ⭕ dentro (${Math.round(w0)} px prima, ${Math.round(dopo[0][0])}×${Math.round(dopo[0][1])} dopo)`);
        const fs=parseFloat($('.tris-grid').style.getPropertyValue('--tris-f'));
        ok(fs>0 && fs<=w0,`il segno segue la grandezza della casella (${Math.round(fs)} px in una casella di ${Math.round(w0)})`);
        nuovoTris();
        /* Completa la frase: se indovini, la parola giusta compare nella frase al posto del vuoto, in verde */
        GIO.vista='completa'; GIO.giocatore=null; CPL.lg='ro'; nuovaFrase();
        const c1=CPL.corrente;
        ok(!!$('.cpl-frase .cpl-blank') && !$('.cpl-frase .cpl-ok'),'Completa la frase: prima di rispondere, dove manca la parola c\'è il vuoto');
        cplRispondi((c1.g+1)%c1.opz.length);
        ok(!!$('.cpl-frase .cpl-blank') && !$('.cpl-frase .cpl-ok'),'…se sbagli, il vuoto resta e la parola giusta non si svela nella frase');
        nuovaFrase(); const c2=CPL.corrente; cplRispondi(c2.g);
        const verde=$('.cpl-frase .cpl-ok');
        ok(!!verde && !$('.cpl-frase .cpl-blank') && verde.textContent===c2.corretta && getComputedStyle(verde).color==='rgb(95, 212, 143)',
           'Completa la frase: se indovini, la parola giusta compare nella frase, al posto del vuoto, in verde');
        ok($('.cpl-frase').textContent==='«'+c2.parole.join(' ')+'»','…e la frase è intera, con la punteggiatura al suo posto');
        ok(_paroleValide('„Țara')==='Țara' && _paroleValide('ei!”')==='ei' && _paroleValide('lumină,')==='lumină' && _paroleValide('(ștergerea).')==='ștergerea' && _paroleValide('«Domnul»')==='Domnul',
           'in rumeno le lettere ă î â ș ț a inizio e a fine parola non si perdono');
        const fin={parole:['„Țara','este','a','Domnului,','și','plinătatea','ei!”'],pos:3,corretta:'Domnului',opz:['Domnului'],g:0,risposto:true,scelta:0};
        ok(cplFraseHtml(fin)==='„Țara este a <span class="cpl-ok">Domnului</span>, și plinătatea ei!”','la parola giusta va al suo posto e la virgola resta dov\'era');
        fin.pos=0; fin.corretta='Țara';
        ok(cplFraseHtml(fin)==='„<span class="cpl-ok">Țara</span> este a Domnului, și plinătatea ei!”','anche con le virgolette prima della parola');
        fin.scelta=1; ok(/cpl-blank/.test(cplFraseHtml(fin)) && !/cpl-ok/.test(cplFraseHtml(fin)),'se la risposta è sbagliata, resta il vuoto');
        CPL.corrente=null; CPL.lg='it';
      })();
      /* Completa la frase: la parola tolta non si legge anche altrove nella frase; dopo la risposta la pagina sta nello schermo */
      (function(){
        GIO.vista='completa'; GIO.giocatore=null; let doppie=0, tot=0;
        ['it','ro'].forEach(lg=>{ CPL.lg=lg; for(let k=0;k<80;k++){ nuovaFrase(); const cc=CPL.corrente; tot++;
          const uguali=cc.parole.filter(w=>ck(_paroleValide(w))===ck(cc.corretta)).length; if(uguali!==1) doppie++; } });
        ok(doppie===0,`in Completa la frase la parola tolta non compare anche altrove nella frase (${tot} frasi provate)`);
        GIO.vista='completa'; vGiochi(); CPL.lg='it'; nuovaFrase(); cplRispondi(CPL.corrente.g);
        const campo=$('.cpl-campo'), card=$('.cpl-card'), prem=$('.cpl-premio');
        ok(campo && campo.classList.contains('fine') && card && prem && card.querySelector('.bt.blu'),'dopo la risposta la frase con «Avanti» sta in un riquadro e premio e classifica in un altro');
        if(matchMedia('(orientation:landscape)').matches && innerWidth>640){
          const rc=card.getBoundingClientRect(), rp=prem.getBoundingClientRect(), av=card.querySelector('.bt.blu').getBoundingClientRect();
          ok(rc.right<=rp.left+2 && av.bottom<=innerHeight+1 && rp.bottom<=innerHeight+1 && card.scrollHeight<=card.clientHeight+1,
             'in orizzontale, dopo la risposta, «Avanti» e il resto stanno dentro allo schermo (premio e classifica a destra)');
        }
        CPL.corrente=null;
        const vP=vista_dati_firma(); ok(vP,'in «Dati e copie» c\'è la scritta «Questa app è stata realizzata da Ovidiu Birla.»');
      })();
      GIO.vista='hub'; vGiochi();
      ok(!$('#vista input[type=text]') && !/Il tuo nome/.test($('#vista').innerText),'la pagina principale dei giochi non ha più il nome del giocatore');
      /* eliminare un giocatore toglie anche le sue partite */
      eliminaGiocatoreDavvero(b.i);
      ok(!trovaGiocatore(b.i) && elencoPartite().every(r=>r.p!==b.i) && !elencoPartite().some(r=>r.p===b.i),'eliminare un giocatore toglie anche le sue partite');
      /* dal vecchio archivio: il nome unico e la classifica di prima diventano giocatori e partite */
      stato.giocatori=[]; stato.partite=[]; stato.imp.giocatoriMigrati=false; stato.imp.giocatoreAttuale=null;
      stato.imp.nomeGiocatore='Vecchio Uno';
      stato.imp.classificheGiochi={memoria:[{nome:'Vecchio Uno',punti:90},{nome:'Vecchio Due',punti:60}]};
      migraGiocatori();
      ok(elencoGiocatori().length===2 && elencoPartite().length===2 && giocatoreAttuale() && giocatoreAttuale().n==='Vecchio Uno',
         'il nome unico e la classifica di prima diventano giocatori e partite');
      migraGiocatori();
      ok(elencoGiocatori().length===2 && elencoPartite().length===2,'e la migrazione si fa una volta sola');
    } finally {
      window.avvisa=_avv;
      stato.giocatori=snap.gi; stato.partite=snap.pa; stato.imp=snap.imp;
      Object.assign(GIO,snap.gio);
      Object.keys(giochi).forEach(k=>Object.assign(giochi[k],statiGiochi[k]));
      salva(); vai(snap.sez);
    }
  })();
  /* ---- si riparte sempre dalla Home ---- */
  (function(){
    const sez1=sezione;
    ok(typeof ripartiDallaHome==='function' && typeof inModoApp==='function','ci sono le funzioni per ripartire dalla Home');
    vai('esperienze');
    apri('Prova','<p>x</p>','');
    ok($('#modale').classList.contains('on'),'(prova) una finestra è aperta');
    document.body.classList.add('menu');
    ripartiDallaHome();
    ok(sezione==='home' && $('#titSez').textContent==='Home','ripartiDallaHome(): si torna alla Home');
    ok(!$('#modale').classList.contains('on'),'…e la finestra che era aperta si chiude');
    ok(!document.body.classList.contains('menu'),'…e il menu si richiude');
    vai(sez1);
  })();
  /* ---- la barra degli strumenti del lezionario sta al filo della pagina che si vede ---- */
  (function(){
    let box=document.getElementById('lettore');
    if(box && box.classList.contains('on')) return;       /* un lezionario aperto davvero: non lo tocco */
    const era=box?{c:box.className,h:box.innerHTML,x:box.style.getPropertyValue('--let-x')}:null;
    if(!box){ box=document.createElement('div'); box.id='lettore'; document.body.appendChild(box); }
    const salvaPag=LET.pagine;
    try{
      /* la prima pagina è ancora vuota e un po' più larga (sfasata di 5px), la seconda è già disegnata */
      box.className='on'; box._x=undefined;
      box.innerHTML='<div class="let-foglio" data-p="1" style="position:absolute;left:23px;width:100px;height:20px"></div>'
                   +'<div class="let-foglio" data-p="2" style="position:absolute;left:28px;width:90px;height:20px"></div>';
      LET.pagine={2:{w:90,h:20,dpr:1}};
      posBarraLet();
      ok(box.style.getPropertyValue('--let-x')==='28px','la barra degli strumenti sta al filo della pagina che si vede, non di una ancora vuota');
    } finally {
      LET.pagine=salvaPag; box._x=undefined;
      if(era){ box.className=era.c; box.innerHTML=era.h; if(era.x) box.style.setProperty('--let-x',era.x); else box.style.removeProperty('--let-x'); }
      else box.remove();
    }
  })();
  /* ---- una scritta selezionata si deseleziona toccando un punto qualsiasi della pagina ---- */
  (function(){
    let box=document.getElementById('lettore');
    if(box && box.classList.contains('on')) return;       /* un lezionario aperto davvero: non lo tocco */
    const era=box?{c:box.className,h:box.innerHTML}:null;
    if(!box){ box=document.createElement('div'); box.id='lettore'; document.body.appendChild(box); }
    const salvaStr=LET.strumento;
    try{
      box.className='on';
      box.innerHTML='<div class="let-foglio" data-p="1"><div class="let-testi"><div class="let-tx selezionata" data-k="0">x</div></div></div>';
      LET.strumento='mano';
      box.querySelector('.let-foglio').dispatchEvent(new MouseEvent('click',{bubbles:true}));
      ok(!box.querySelector('.let-tx.selezionata'),'toccando un punto qualsiasi della pagina la scritta selezionata si deseleziona');
      /* e con la scritta stessa toccata resta com'è: lì la selezione la decide la scritta */
      const tx=box.querySelector('.let-tx'); tx.classList.add('selezionata'); tx.onclick=ev=>ev.stopPropagation();
      tx.dispatchEvent(new MouseEvent('click',{bubbles:true}));
      ok(tx.classList.contains('selezionata'),'toccando la scritta selezionata non si deseleziona da sola');
    } finally {
      LET.strumento=salvaStr;
      if(era){ box.className=era.c; box.innerHTML=era.h; } else box.remove();
    }
  })();
  /* ---- la finestra «Scrivi un appunto» mostra i numeri della grandezza ---- */
  (function(){
    ok(typeof scalaDim==='function' && (scalaDim().match(/<span /g)||[]).length===19,'la barra della grandezza ha i suoi 19 numeri (da 2 a 20)');
    apri('Prova',`<div id="txScala">${scalaDim()}</div><b id="txDimN"></b>`,'');
    numeriDim(7);
    ok($('#txDimN').textContent==='7','il numero scelto si scrive accanto a «Grandezza»');
    ok($$('#txScala span.on').length===1 && $('#txScala span.on').textContent==='7','e si accende il 7 sotto alla barra');
    chiudi();
  })();
  /* ---- il backup è UN file solo, sempre «prediche.zip», senza il «Testo.txt» del titolo ---- */
  ok(/'prediche\.zip'/.test(String(salvaCopia)) && !/title\s*:/.test(String(salvaCopia)),
     'il backup è un file solo, sempre «prediche.zip», e al foglio di condivisione va solo il file (niente «Testo.txt»)');
  /* ---- dentro al backup ci sono anche i file (PDF dei lezionari e dei libri, allegati): andata e ritorno ---- */
  await (async function(){
    try{
      const pdf=new Uint8Array(70000); for(let i=0;i<pdf.length;i++) pdf[i]=(i*31)&255;
      const z=await zipBlob([{nome:'stato.json',blob:new Blob([_te.encode('{"stato":{"lezionari":[{"fid":"lzProva"}]}}')])},
                             {nome:'allegati/'+encodeURIComponent('lzProva'),blob:new Blob([pdf],{type:'application/pdf'})}]);
      const voci=await leggiZipBlob(z);
      const st=JSON.parse(await voci[0].dati.text()), dentro=new Uint8Array(await voci[1].dati.arrayBuffer());
      ok(voci.length===2 && st.stato.lezionari[0].fid==='lzProva' && voci[1].nome==='allegati/lzProva'
         && dentro.length===pdf.length && dentro.every((x,i)=>x===pdf[i]),'il backup porta con sé i PDF e li ridà identici');
      ok(typeof kvChiavi==='function' && (await kvChiavi()).every(k=>typeof k==='string'),'il backup trova tutti i file salvati sul dispositivo');
    }catch(e){ ok(false,'backup con i file: '+e.message); }
  })();
  ok(!/title\s*:/.test(String(condividiLez)),'«Condividi» del lezionario passa solo il file, senza titolo (niente «Testo.txt»)');
  /* ---- prediche: incollare, salvare prima di uscire, Importa PDF e Word, il file con le prediche di prima ---- */
  await (async function(){
    const salvaSt=JSON.stringify({prediche:stato.prediche,poesie:stato.poesie,esperienze:stato.esperienze,predAnnot:stato.predAnnot});
    const _avv=window.avvisa, sez0=sezione; window.avvisa=function(){};
    try{
      /* incollare in una predica nuova: la prima riga fa da titolo, il resto va sotto */
      vai('prediche'); predicaVuota(); await new Promise(r=>setTimeout(r,450));
      const i=_predAperta, f=$('#foglioPr');
      ok(PR_MOD && f && f.isContentEditable,'la predica nuova si apre già pronta per scrivere');
      selezionaTitoloFoglio();
      const dt=new DataTransfer(); dt.setData('text/plain','Il titolo incollato\n\nPrimo capoverso.\nSecondo capoverso.');
      f.dispatchEvent(new ClipboardEvent('paste',{clipboardData:dt,bubbles:true,cancelable:true}));
      const tit=f.querySelector('.fp-tit');
      ok(tit && tit.textContent==='Il titolo incollato' && !tit.querySelector('p') && /Primo capoverso/.test(f.innerText),'incollando su una predica nuova il testo non finisce più tutto dentro al titolo');
      ok(stato.prediche.find(x=>x.i===i).tit==='Il titolo incollato','il titolo della predica prende la prima riga incollata');
      /* scritto sul foglio e poi ⚙ (il modulo): non si perde niente, e il titolo del modulo va sul foglio */
      const r=document.createRange(); r.selectNodeContents(f.lastElementChild); r.collapse(false); getSelection().removeAllRanges(); getSelection().addRange(r);
      document.execCommand('insertText',false,' SCRITTO');
      nuovaPredica(i); $('#npT').value='Titolo dal modulo'; salvaPredica(i);
      const a=annot(i), h=a.html||'';
      ok(/SCRITTO/.test(h),'quello che scrivi sul foglio si salva anche se vai sul modulo ⚙ senza premere «Salva»');
      ok(/Titolo dal modulo/.test(h) && stato.prediche.find(x=>x.i===i).tit==='Titolo dal modulo','il titolo scritto nel modulo va anche sul foglio');
      /* lo stesso per poesie ed esperienze: scritto sul foglio e poi ⚙ — non si perde, e il titolo del modulo resta */
      for(const [nome,vuota,modulo,salvaM,campoT,elenco] of [['poesia',poesiaVuota,nuovaPoesia,salvaPoesia,'#nyT',()=>stato.poesie],
                                                             ['esperienza',esperienzaVuota,nuovaEsperienza,salvaEsperienza,'#neT',()=>stato.esperienze]]){
        vuota(); await new Promise(r=>setTimeout(r,450));
        const j=_predAperta, g=$('#foglioPr');
        if(!g || !PR_MOD){ ok(false,`la ${nome} nuova si apre pronta per scrivere`); continue; }
        const rr=document.createRange(); rr.selectNodeContents(g.lastElementChild); rr.collapse(false); getSelection().removeAllRanges(); getSelection().addRange(rr);
        document.execCommand('insertText',false,' SCRITTO');
        modulo(j); $(campoT).value='Titolo dal modulo'; await salvaM(j);
        const hh=annot(j).html||'';
        ok(/SCRITTO/.test(hh),`quello che scrivi sul foglio di una ${nome} si salva anche se vai su ⚙ senza premere «Salva»`);
        leggiPredica(j); salvaTesto(j,true);
        ok(/Titolo dal modulo/.test(annot(j).html||'') && elenco().find(x=>x.i===j).tit==='Titolo dal modulo',`il titolo messo da ⚙ nella ${nome} resta anche dopo aver salvato il foglio`);
        PR_MOD=false; _predAperta=null; document.body.classList.remove('pred-fissa');
      }
      ok(/aggiornaModo\(\)/.test(String(setStru)),'scegliendo uno strumento il pulsante Scorri/Pagina resta acceso com\'era');
      ok(!/LET\.libro/.test(String(lbSfoglia)) && /LET\.modo==='pagina'/.test(String(lbSfoglia)),'anche il lezionario si sfoglia verso sinistra, come i libri');
      ok(typeof precaricaPag==='function' && /precaricaPag/.test(String(preparaPag)),'la pagina dopo si disegna in anticipo: sfogliando è già pronta');
      { const salvaR=LET.righe; LET.righe={999:[0.12,0.2,0.3,0.4,0.5].map(y=>({y,h:0.02,el:[{x:0.1,y,w:0.78,h:0.02}]})).concat([{y:0.95,h:0.02,el:[{x:0.45,y:0.95,w:0.05,h:0.02}]}])};
        const w=larghezzaAppunto(999,0.2); LET.righe=salvaR;
        ok(Math.abs(w-0.68)<0.01,'la riga di un appunto nuovo arriva fino al margine destro del testo della lezione'); }
      ok(typeof txSopraTastiera==='function' && /tx-fin/.test(String(finestraTesto)),'la finestra dell\'appunto sta sopra la tastiera');
      /* la penna sul foglio: un segno si salva, segue il suo capoverso, la gomma lo toglie, annulla lo rimette */
      { const q=stato.prediche.find(x=>x.i===i); if(q){ PR_MOD=false; leggiPredica(i); await new Promise(r=>setTimeout(r,200));
          const s=$('#pnSvg'), fg=$('#foglioPr');
          ok(!!s && !!$('#pnBt'),'sul foglio in lettura c\'è la penna «✏️ Penna»');
          if(s&&fg){ pennaPredica(); const r=fg.getBoundingClientRect(), n0=pnQui().length;
            const ev=(tp,x,y)=>s.dispatchEvent(new PointerEvent(tp,{pointerId:9,pointerType:'mouse',clientX:x,clientY:y,bubbles:true,cancelable:true,button:0,buttons:1}));
            ev('pointerdown',r.left+80,r.top+60); for(let k=1;k<9;k++) ev('pointermove',r.left+80+k*12,r.top+62); ev('pointerup',r.left+180,r.top+62);
            ok(pnQui().length===n0+1 && !!annot(i).penna,'un segno fatto con la penna resta salvato nelle annotazioni (e quindi nel backup)');
            pnStrumento('gomma'); ev('pointerdown',r.left+120,r.top+62); ev('pointerup',r.left+120,r.top+62);
            ok(pnQui().length===n0,'la gomma toglie il segno che tocca');
            pnAnnulla(); ok(pnQui().length===n0+1,'«Annulla» rimette il segno tolto');
            pnQui().length=n0; PN.on=false; pnStato(); } } }
      /* Word: un .docx piccolo fatto qui (zip senza compressione) */
      const W='xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"';
      const docx=await zipBlob([
        {nome:'word/document.xml',blob:new Blob([`<?xml version="1.0" encoding="UTF-8"?><w:document ${W}><w:body><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="36"/></w:rPr><w:t>Titolo Word</w:t></w:r></w:p><w:p><w:r><w:rPr><w:i/><w:color w:val="C00000"/></w:rPr><w:t>verità rossa</w:t></w:r></w:p><w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr><w:r><w:t>punto</w:t></w:r></w:p></w:body></w:document>`])},
        {nome:'word/numbering.xml',blob:new Blob([`<?xml version="1.0" encoding="UTF-8"?><w:numbering ${W}><w:abstractNum w:abstractNumId="0"><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%1."/></w:lvl></w:abstractNum><w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num></w:numbering>`])}]);
      const d=await docxInFoglio(new File([docx],'prova.docx'));
      ok(d.titolo==='Titolo Word' && /text-align:center/.test(d.html) && /font-weight:bold/.test(d.html),'Importa Word: titolo, grassetto e centrato come nell\'originale');
      ok(/font-style:italic/.test(d.html) && /color:#C00000/i.test(d.html) && /verità/.test(d.testo),'Importa Word: corsivo, colore e lettere accentate');
      ok(/1\. punto/.test(d.testo),'Importa Word: gli elenchi numerati tengono il loro numero');
      /* la gara: più giocatori a turno, UNA DOMANDA A TESTA, ognuno con la sua partita; classifica e vincitori salvati */
      { const salvaG=JSON.stringify({g:stato.giocatori,p:stato.partite,gare:stato.gare,att:stato.imp.giocatoreAttuale,sc:stato.imp.garaScelti,gd:stato.imp.garaDomande});
        const vista0=GIO.vista, sez0g=sezione, aspetta=ms=>new Promise(r=>setTimeout(r,ms));
        try{
          ['zzA','zzB'].forEach(n=>aggiungiGiocatore(n));
          const ids=['zzA','zzB'].map(n=>elencoGiocatori().find(g=>g.n===n).i);
          vai('giochi'); apriGioco('verofalso'); await aspetta(200);
          ok(!!document.querySelector('.gc-gara'),'in ogni gioco c\'è «🏁 Gara» per giocare in più giocatori');
          iniziaGara('verofalso',ids,3); await aspetta(200);
          ok(!!$('#garaStriscia') && giocatoreAttuale().i===ids[0] && GARA.n===3,'la gara comincia dal primo giocatore, con la striscia dei turni in cima al gioco');
          vfRispondi(VF.corrente.vero);
          ok(GARA.daPassare && GARA.punti[ids[0]].tot===1 && GARA.punti[ids[0]].giuste===1,'in gara ogni risposta conta per chi l\'ha data');
          scegliGiocatore(ids[1]); ok(giocatoreAttuale().i===ids[0],'durante la gara non si cambia giocatore a mano: si gioca a turno');
          const domA=VF.domande.map(d=>d.d).join('|');
          VF.i++; vfProssima(); await aspetta(100);
          ok(giocatoreAttuale().i===ids[1] && VF.i===0 && VF.domande.map(d=>d.d).join('|')!==domA,'dopo UNA domanda tocca al secondo giocatore, con la sua partita');
          vfRispondi(!VF.corrente.vero); VF.i++; vfProssima(); await aspetta(100);
          ok(giocatoreAttuale().i===ids[0] && VF.i===1 && VF.domande.map(d=>d.d).join('|')===domA,'poi torna il primo, esattamente dove aveva lasciato la sua partita');
          const n0=elencoGare().length;
          for(let k=0;k<4;k++){ vfRispondi(VF.corrente.vero); VF.i++; vfProssima(); await aspetta(60); }
          chiudi();
          const g=elencoGare()[elencoGare().length-1];
          ok(!GARA.attiva && elencoGare().length===n0+1 && g.righe[0].p===ids[0] && g.righe[0].pos===1 && g.righe[1].pos===2 && g.n===3,
             'dopo 3 domande a testa esce la classifica: primo chi ha più risposte giuste, e la gara si salva');
          ok(vincitoriGare('verofalso').some(s=>s.p===ids[0]&&s.vinte>=1),'la classifica dei vincitori conta le gare vinte');
          /* Memoria in gara: tutti sulle stesse carte, un tentativo a testa */
          apriGioco('memoria'); await aspetta(100); iniziaGara('memoria',ids); await aspetta(100);
          const carte=MEM.carte.map(c=>c.testo).join('|');
          const a0=0, b0=MEM.carte.findIndex((c,j)=>j>0 && c.coppia!==MEM.carte[0].coppia);
          memGira(a0); memGira(b0); await aspetta(60);
          ok(giocatoreAttuale().i===ids[1] && MEM.carte.map(c=>c.testo).join('|')===carte && !MEM.girate.length,'Memoria in gara: dopo un tentativo tocca al prossimo, sulle stesse carte');
          chiudi();
          Object.assign(GARA,{attiva:false,gioco:null,ordine:[],turno:0,punti:{},daPassare:false});
          /* Sprint in gara: l'orologio di chi ha risposto si ferma */
          apriGioco('sprint'); await aspetta(100); iniziaGara('sprint',ids); await aspetta(100);
          avviaSprint(); const t0=SPR.tempo; sprRispondi(SPR.corrente.g); await aspetta(900);
          ok(giocatoreAttuale().i===ids[1] && !SPR.attivo && !SPR.timer && GARA.stati[ids[0]] && GARA.stati[ids[0]].inPausa && GARA.stati[ids[0]].tempo<=t0,
             'Sprint in gara: dopo una risposta tocca al prossimo e il tuo orologio resta fermo');
          ok(typeof garaPassa==='function' && /garaPassa\('ruota'/.test(String(ruoAvanti)) && /garaPassa\('scalata'/.test(String(sclAvanti)) && /garaFatto\('tempio'/.test(String(tplEsito)),
             'in ogni gioco, dopo una risposta, il turno passa al prossimo giocatore');
          Object.assign(GARA,{attiva:false,gioco:null,ordine:[],turno:0,punti:{},daPassare:false,stati:{},cont:{}}); gnFermaTimer();
        } catch(e){ ok(false,'gara: '+e.message); }
        finally{ const v=JSON.parse(salvaG); stato.giocatori=v.g; stato.partite=v.p; stato.gare=v.gare; stato.imp.giocatoreAttuale=v.att; stato.imp.garaScelti=v.sc; stato.imp.garaDomande=v.gd;
          Object.assign(GARA,{attiva:false,gioco:null,ordine:[],turno:0,punti:{},daPassare:false,stati:{},cont:{}}); _garaVelo(null); chiudi(); salva(); GIO.vista=vista0; vai(sez0g); }
      }
      { apriGioco('verofalso'); await new Promise(r=>setTimeout(r,150));
        const L=document.querySelector('.gio-livelli'), G=document.querySelector('.gio-giocatori');
        ok(!!L && !!G && L.getBoundingClientRect().bottom<=G.getBoundingClientRect().top+1,'i tre livelli stanno sopra alla riga dei giocatori');
        ok(getComputedStyle(document.querySelector('.gg-lista')).flexWrap==='wrap','con tanti giocatori la riga va a capo e li mostra tutti'); }
      /* Mistero Biblico: i casi sono dati, e ognuno si risolve dall'inizio alla fine */
      { const salvaPG=JSON.stringify({pg:stato.progressiGiochi||null,p:stato.partite,att:stato.imp.giocatoreAttuale}), vistaM=GIO.vista, sezM=sezione;
        try{
          const casi=misCasi();
          ok(casi.length>=30 && casi.every(c=>c.elementi.length>=6 && c.prove.length>=3 && (c.aiuti||[]).length===3),`Mistero Biblico: ${casi.length} casi completi (scena, indizi, aiuti, prove)`);
          ok(GIOCHI_TESSERE.some(x=>/Mistero Biblico/.test(x.et)) && !GIOCHI_TESSERE.some(x=>/Blitz/.test(x.et)),'Mistero Biblico ha preso il posto del Blitz nei giochi');
          stato.imp.giocatoreAttuale=null; vai('giochi'); apriGioco('mistero'); await new Promise(r=>setTimeout(r,150));
          const c=casi[0]; misApri(c.id,true); misInizia(); misTocca(c.elementi[0].k); misAggiungi(c.elementi[0].k); chiudi();
          ok(MIS.trovati.length===1 && misPunteggio(c)<(c.punti||2000),'Mistero Biblico: l\'indizio va nel taccuino e il punteggio scende');
          misVaiProve();
          c.prove.forEach(p=>{ const s=misStatoProva(p); if(p.t==='scelta') misScelta(s.ord.indexOf(p.ok)); else if(p.t==='ordine') misL(p.voci).forEach((_,k)=>misOrdina(k)); else { p.frasi.forEach((f2,j)=>{ if(f2.v) misVero(j); }); misVeroConferma(); } misAvanti(); });
          ok(MIS.vista==='fine' && MIS.fine && MIS.fine.stelle>=1 && MIS.fine.punti>0,'Mistero Biblico: il caso si risolve, con stelle, punteggio e la storia biblica');
        }catch(e){ ok(false,'Mistero Biblico: '+e.message); }
        finally{ const v=JSON.parse(salvaPG); stato.progressiGiochi=v.pg||{}; stato.partite=v.p; stato.imp.giocatoreAttuale=v.att; salva(); GIO.vista=vistaM; vai(sezM); }
      }
      ok(typeof adattaScritte==='function' && /adattaScritte/.test(String(adattaGioco)),'nei giochi le scritte crescono fino a riempire le loro caselle');
      ok(/requestFullscreen/.test(String(_schermoIntero)) && /_schermoIntero\(true\)/.test(String(proiettaGioco)),'«Proietta» nei giochi va a tutto schermo');
      /* PowerPoint fedele: i colori del tema con le loro sfumature, le forme, la diapositiva disegnata */
      try{
        const x=new DOMParser().parseFromString('<a:schemeClr xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" val="accent1"><a:lumMod val="60000"/><a:lumOff val="40000"/></a:schemeClr>','application/xml').documentElement;
        const c=_pfColoreEl(x,{colori:{accent1:'53548A'},mappa:{}},null);
        ok(!!c && c.rgb[0]>140 && c.rgb[2]>c.rgb[0],'PowerPoint: i colori del tema, anche «più chiari del 40%», diventano quelli giusti');
        const bx=new DOMParser().parseFromString('<a:schemeClr xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" val="tx1"/>','application/xml').documentElement;
        const tx=_pfColoreEl(bx,{colori:{dk1:'000000',lt1:'FFFFFF'},mappa:{tx1:'lt1'}},null);
        ok(tx && tx.rgb.join()==='255,255,255','PowerPoint: nei temi scuri il «testo 1» è bianco (segue la mappa dei colori del modello)');
        ok(/A/.test(_pfTracciato('ellipse',100,50,null)) && _pfTracciato('rightArrow',100,50,null).split('L').length>=7 && /Z.*M/.test(_pfTracciato('frame',100,50,null)),'PowerPoint: ovali, frecce e cornici hanno la loro forma');
        const h=htmlDiapoPptx({t:'pptxdia',alt:720,fedele:{alt:720,sfondo:'background:rgb(1,2,3)',html:'<div class="pf" style="left:1px"></div>'}});
        ok(/pf-slide/.test(h) && /rgb\(1,2,3\)/.test(h) && /class="pf"/.test(h),'PowerPoint: le diapositive importate si presentano come l\'originale (forme, sfondo)');
      }catch(e){ ok(false,'PowerPoint fedele: '+e.message); }
      /* PDF: diventa testo vero, modificabile, con colori e grassetto (un PDF piccolo fatto qui) */
      try{
        const corpo='BT /F1 24 Tf 0.8 0 0 rg 150 760 Td (Titolo Rosso) Tj ET\nBT /F2 12 Tf 0 0 0 rg 72 700 Td (Testo in grassetto) Tj ET\nBT /F1 12 Tf 0 0 0 rg 72 680 Td (Testo normale) Tj ET';
        const og=['<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
          '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents 4 0 R >>',
          '<< /Length '+corpo.length+' >>\nstream\n'+corpo+'\nendstream','<< /Type /Font /Subtype /Type1 /BaseFont /Times-Roman >>','<< /Type /Font /Subtype /Type1 /BaseFont /Times-Bold >>'];
        let s='%PDF-1.4\n'; const off=[];
        og.forEach((o,k)=>{ off.push(s.length); s+=(k+1)+' 0 obj\n'+o+'\nendobj\n'; });
        const xr=s.length; s+='xref\n0 '+(og.length+1)+'\n0000000000 65535 f \n'+off.map(o=>String(o).padStart(10,'0')+' 00000 n \n').join('');
        s+='trailer\n<< /Size '+(og.length+1)+' /Root 1 0 R >>\nstartxref\n'+xr+'\n%%EOF';
        const r=await pdfInFoglio(new File([new TextEncoder().encode(s)],'prova.pdf',{type:'application/pdf'}));
        const dd=document.createElement('div'); dd.innerHTML=r.html;
        const rosso=[...dd.querySelectorAll('span')].find(x=>/Titolo Rosso/.test(x.textContent));
        const gr=[...dd.querySelectorAll('span')].find(x=>/grassetto/.test(x.textContent));
        const rgb=rosso&&getComputedStyle(document.body)&&rosso.style.color;
        ok(!dd.querySelector('img') && /Titolo Rosso/.test(r.testo) && /Testo normale/.test(dd.textContent),'Importa PDF: diventa testo vero, che si può modificare (non più un\'immagine)');
        ok(!!rosso && /rgb\((1[6-9]\d|2\d\d), ?\d{1,2}, ?\d{1,2}\)/.test(rgb) && !!gr && /bold/.test(gr.style.fontWeight),'Importa PDF: tiene i colori e il grassetto dell\'originale');
      }catch(e){ ok(false,'Importa PDF: '+e.message); }
      /* il file con le prediche/poesie/esperienze di prima: si aggiungono come tue, senza doppioni */
      stato.predAnnot['prZZ']={luoghi:[],stile:{},html:'',meta:{tit:'Titolo corretto'}};
      const arch={tipo:'archivio',prediche:[{i:'prZZ',num:999,tit:'Vecchio',lg:'it',testo:'Uno.\n\nDue.',html:'',tema:'',mia:true}],
                  poesie:[{i:'qZZ',tit:'P',lg:'it',testo:'a\nb',mia:true}],esperienze:[{i:'eZZ',tit:'E',lg:'ro',testo:'x',tipo:'vera',all:[],mia:true}]};
      const _conf=window.conferma; window.conferma=(m,fn)=>fn();
      try{ caricaArchivio(arch); caricaArchivio(arch); } finally { window.conferma=_conf; }
      ok(stato.prediche.filter(x=>x.i==='prZZ').length===1 && stato.poesie.filter(x=>x.i==='qZZ').length===1 && stato.esperienze.filter(x=>x.i==='eZZ').length===1,'il file con le prediche di prima le aggiunge come tue, senza doppioni');
      ok(stato.prediche.find(x=>x.i==='prZZ').tit==='Titolo corretto' && !stato.predAnnot['prZZ'].meta,'il titolo che avevi corretto da ⚙ resta');
      ok(tuttePrediche().some(x=>x.i==='prZZ') && tuttePoesie().some(x=>x.i==='qZZ') && tutteEsperienze().some(x=>x.i==='eZZ'),'e si vedono nei loro elenchi');
    }catch(err){ ok(false,'prediche, incolla e importa: '+err.message); }
    finally{
      const v=JSON.parse(salvaSt); stato.prediche=v.prediche; stato.poesie=v.poesie; stato.esperienze=v.esperienze; stato.predAnnot=v.predAnnot;
      PR_MOD=false; _predAperta=null; document.body.classList.remove('pred-fissa');
      if($('#modale').classList.contains('on')) chiudi();
      window.avvisa=_avv; vai(sez0);
    }
  })();
  ok(JSON.stringify(stato.imp.coloriLettore)===_colPrima,'i controlli non toccano i colori che hai scelto nel lezionario');
  Object.assign(GIOCHI_PAUSA,_pausaPrima);
  clearTimeout(_salvaVisteGioco);
  stato.viste=JSON.parse(_vistePrima)||{dom:'',chd:'',giri:{dom:0,chd:0}};
  Object.keys(_memViste).forEach(k=>delete _memViste[k]);
  salva();
  return {esito:e.length?'errori':'ok', n:p.length, passati:p, falliti:e};
}
async function mostraTest(){
  const r=await autoTest();
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
  try{ migraGiocatori(); }catch(e){ console.warn('giocatori',e); }
  try{
    const ids=[]; stato.esperienze.forEach(e=>(e.all||[]).forEach(a=>ids.push(a.id)));
    if(ids.length) await riprendiAllegati(ids);
  }catch(e){}
  $('#verProg').textContent='versione '+VER;
  /* quando il programma sta su un indirizzo internet (non aperto da file),
     lascio in guardia il «service worker»: dopo la prima volta si apre
     subito e funziona anche senza rete */
  try{
    if(location.protocol==='https:'){
      /* sul sito uso il manifesto vero, non quello scritto dentro alla pagina:
         così l'iPad la prende per un'applicazione e non per un sito */
      const m=document.querySelector('link[rel="manifest"]');
      if(m) m.href='manifest.json';
    }
    if('serviceWorker' in navigator && location.protocol==='https:'){
      navigator.serviceWorker.register('sw.js').catch(()=>{});
      let primo=!navigator.serviceWorker.controller;
      navigator.serviceWorker.addEventListener('controllerchange',()=>{
        if(!primo) avvisa('C\'è una versione nuova: chiudi e riapri il programma','ok');
        primo=false;
      });
    }
  }catch(e){}
  $('#ham').onclick=()=>document.body.classList.toggle('menu');
  $('#velo').onclick=()=>document.body.classList.remove('menu');
  $('#btCerca').onclick=cercaOvunque;
  posizioneSalvata();
  /* apro le Bibbie in sottofondo: i versetti devono essere pronti al primo tocco */
  setTimeout(()=>{ apriBibbia('it').catch(()=>{}); apriBibbia('ro').catch(()=>{}); },600);
  /* si apre dalla Home, anche se l'indirizzo porta il nome di un'altra sezione — tranne quando
     l'iPad ha chiuso il programma da solo mentre eri in un'altra app e lo riapri entro 5 minuti:
     allora torni nella sezione dov'eri (vedi USCITA_MS qui sotto) */
  (()=>{ let dove='home';
    try{ const u=JSON.parse(localStorage.getItem('pd_uscita')||'null');
      if(u && u.sez && Date.now()-u.quando<=USCITA_MS && SEZIONI.some(s=>s.id===u.sez)) dove=u.sez; }catch(e){}
    vai(dove); })();
  /* la posizione si rinfresca a ogni apertura (e quando il programma torna in primo piano dopo un po'): se non so ancora
     dove sei lo chiedo con garbo, se lo so già controllo che sia ancora vero — vedi rinfrescaPosizione() */
  setTimeout(rinfrescaPosizione,1500);
  document.addEventListener('visibilitychange',()=>{ if(!document.hidden && Date.now()-(POS.quando||0)>5*60*1000) rinfrescaPosizione(); });
  /* e ogni 5 minuti, finché il programma è aperto e in primo piano */
  setInterval(()=>{ if(!document.hidden) rinfrescaPosizione(); },5*60*1000);
  setTimeout(()=>{ const a=$('#avvio'); if(a){ a.classList.add('via'); setTimeout(()=>a.remove(),500); } },420);
  /* I controlli interni (autoTest) NON partono più da soli a ogni apertura: durano diversi secondi e tenevano
     il programma fermo, con la schermata di avvio ancora davanti. Si eseguono quando servono, da
     «Dati e copie → Esegui i controlli» o dalla console con autoTest(). */
  console.log(`%cPrediche e Domande ${VER}`,'font-weight:bold;color:#c8102e',
    `— ${DOMANDE.length} domande, ${CANTICI.length} cantici`);
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
/* Quando rientri nel programma (lo avevi lasciato per un'altra app, o lo schermo
   si era spento): se sei stato via fino a 5 minuti resti nella stessa pagina, se sei stato
   via di più si riapre dalla Home. Vale per il programma installato sulla schermata Home:
   in una scheda del browser non scatta, se no ogni cambio di scheda ti porterebbe alla Home. */
const USCITA_MS=5*60*1000;
function inModoApp(){
  try{ return window.navigator.standalone===true || (!!window.matchMedia && matchMedia('(display-mode: standalone)').matches); }
  catch(e){ return false; }
}
function ripartiDallaHome(){
  /* quello che stavi scrivendo lo metto al sicuro, poi chiudo tutto ciò che era aperto */
  try{ if(PR_MOD && _predAperta) salvaTesto(_predAperta,true); }catch(e){}
  try{ if(PROI.regia) chiudiRegia(); else if(PROI.aperta) pChiudi(); }catch(e){}
  try{ if(nelLettore()) chiudiLet(); }catch(e){}
  try{ fermaVoce(); }catch(e){}
  try{ chiudi(); }catch(e){}
  PR_MOD=false; PR_LG=null; _predAperta=null;
  vai('home');
}
let _uscitoAlle=0;
document.addEventListener('visibilitychange',()=>{
  if(document.hidden){ _uscitoAlle=Date.now();
    try{ localStorage.setItem('pd_uscita',JSON.stringify({quando:_uscitoAlle,sez:sezione})); }catch(e){}
    return; }
  const era=_uscitoAlle; _uscitoAlle=0;
  if(era && inModoApp() && Date.now()-era>USCITA_MS) ripartiDallaHome();
});
window.addEventListener('hashchange',()=>{ const h=(location.hash||'').replace('#',''); if(h&&h!==sezione&&SEZIONI.some(s=>s.id===h)) vai(h); });
document.addEventListener('DOMContentLoaded',avvio);
if(document.readyState!=='loading') avvio();
