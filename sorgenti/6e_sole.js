/* ================= ALBA E TRAMONTO ================= */
/* Il calcolo è tutto qui dentro: non serve internet.
   Formula solare classica, precisa al minuto. */
const RAD=Math.PI/180;
function calcolaSole(quando,lat,lon){
  /* il giorno è quello del calendario di chi guarda: dal giorno giuliano
     troncato usciva il giorno prima, e dopo l'alba il programma restava indietro */
  const gg=Math.floor(Date.UTC(quando.getFullYear(),quando.getMonth(),quando.getDate())/86400000)+2440588;
  const n=gg - 2451545.0 + 0.0008;
  const Js=n - lon/360;
  const M=(357.5291 + 0.98560028*Js) % 360;
  const C=1.9148*Math.sin(M*RAD)+0.0200*Math.sin(2*M*RAD)+0.0003*Math.sin(3*M*RAD);
  const L=(M + C + 180 + 102.9372) % 360;
  const Jt=2451545.0 + Js + 0.0053*Math.sin(M*RAD) - 0.0069*Math.sin(2*L*RAD);
  const dec=Math.asin(Math.sin(L*RAD)*Math.sin(23.4397*RAD));
  const cw=(Math.sin(-0.833*RAD) - Math.sin(lat*RAD)*Math.sin(dec)) / (Math.cos(lat*RAD)*Math.cos(dec));
  /* da giorno giuliano a data: il giorno giuliano parte da mezzogiorno, quindi 2440587.5 */
  const gio=d=>new Date((d-2440587.5)*86400000);
  if(cw>1)  return {sempre:'notte', mezzo:gio(Jt)};
  if(cw<-1) return {sempre:'giorno',mezzo:gio(Jt)};
  const w=Math.acos(cw)/RAD;
  return { alba:gio(Jt - w/360), tramonto:gio(Jt + w/360), mezzo:gio(Jt) };
}
/* ---------- dove stanno davvero il sole e la luna ---------- */
function _giulianoDa(d){ return d.getTime()/86400000 + 2440587.5; }
function _oreSiderali(jd,lon){
  /* tempo siderale locale in gradi */
  const T=(jd-2451545.0)/36525;
  let g=280.46061837 + 360.98564736629*(jd-2451545.0) + 0.000387933*T*T;
  return ((g+lon)%360+360)%360;
}
function _altAz(ar,dec,jd,lat,lon){
  /* da ascensione retta e declinazione (gradi) ad altezza e azimut */
  const H=(( _oreSiderali(jd,lon) - ar )%360+360)%360;
  const h=H*RAD, la=lat*RAD, de=dec*RAD;
  const alt=Math.asin(Math.sin(la)*Math.sin(de)+Math.cos(la)*Math.cos(de)*Math.cos(h));
  let az=Math.atan2(Math.sin(h), Math.cos(h)*Math.sin(la)-Math.tan(de)*Math.cos(la));
  az=(az/RAD+180)%360;              /* 0 = nord, 90 = est, 180 = sud, 270 = ovest */
  return {alt:alt/RAD, az};
}
function posizioneSole(d,lat,lon){
  const jd=_giulianoDa(d), n=jd-2451545.0;
  const L=(280.460+0.9856474*n)%360;
  const g=((357.528+0.9856003*n)%360)*RAD;
  const lam=(L+1.915*Math.sin(g)+0.020*Math.sin(2*g))*RAD;
  const eps=(23.439-0.0000004*n)*RAD;
  const ar=Math.atan2(Math.cos(eps)*Math.sin(lam),Math.cos(lam))/RAD;
  const dec=Math.asin(Math.sin(eps)*Math.sin(lam))/RAD;
  return _altAz((ar%360+360)%360,dec,jd,lat,lon);
}
function posizioneLuna(d,lat,lon){
  /* La luna non gira liscia come il sole: la Terra la tira, il sole la tira,
     e ogni mese arriva un po' avanti o un po' indietro. Perciò servono
     parecchi termini di correzione, non uno solo. */
  const jd=_giulianoDa(d), n=jd-2451545.0;
  const Lp=(218.3164477 + 13.17639648*n)%360;   /* dove sarebbe se andasse liscia */
  const D =(297.8501921 + 12.19074912*n)%360;   /* quanto è lontana dal sole */
  const M =(357.5291092 +  0.98560028*n)%360;   /* il sole sulla sua orbita */
  const Mp=(134.9633964 + 13.06499295*n)%360;   /* la luna sulla sua orbita */
  const F =( 93.2720950 + 13.22935024*n)%360;   /* quanto è alta o bassa rispetto all'eclittica */
  const s=g=>Math.sin(g*RAD);
  const lam = Lp
    + 6.289*s(Mp)      - 1.274*s(Mp-2*D)   + 0.658*s(2*D)
    - 0.186*s(M)       - 0.059*s(2*Mp-2*D) - 0.057*s(Mp-2*D+M)
    + 0.053*s(Mp+2*D)  + 0.046*s(2*D-M)    + 0.041*s(Mp-M)
    - 0.035*s(D)       - 0.031*s(Mp+M)     - 0.015*s(2*F-2*D)
    + 0.011*s(Mp-4*D);
  const bet = 5.128*s(F)
    + 0.281*s(Mp+F)    - 0.278*s(F-Mp)     - 0.173*s(F-2*D)
    + 0.055*s(2*D+F-Mp)- 0.046*s(2*D-F-Mp) + 0.033*s(F+2*D)
    + 0.017*s(2*Mp+F);
  const eps=23.4397*RAD, la=lam*RAD, be=bet*RAD;
  const ar=Math.atan2(Math.sin(la)*Math.cos(eps)-Math.tan(be)*Math.sin(eps),Math.cos(la))/RAD;
  const dec=Math.asin(Math.sin(be)*Math.cos(eps)+Math.cos(be)*Math.sin(eps)*Math.sin(la))/RAD;
  const p=_altAz((ar%360+360)%360,dec,jd,lat,lon);
  /* quanto è lontana oggi: la sua orbita è un ovale, e quando è più vicina
     si vede più grande (fino a un quattordicesimo in più) */
  p.km = 385000.56 - 20905.355*Math.cos(Mp*RAD) - 3699.111*Math.cos((2*D-Mp)*RAD)
       - 2955.968*Math.cos(2*D*RAD) - 569.925*Math.cos(2*Mp*RAD)
       + 246.158*Math.cos((2*D-2*Mp)*RAD) - 204.586*Math.cos((2*D-M)*RAD)
       - 170.733*Math.cos((Mp+2*D)*RAD) - 152.138*Math.cos((Mp+2*D-M)*RAD)
       - 129.620*Math.cos((2*D-M-Mp)*RAD) + 108.743*Math.cos(D*RAD);
  p.grande = 385000.56/p.km;       /* 1 = misura media, 1.07 = superluna */
  /* fase: quanto la luna è avanti al sole. 0 = luna nuova, 0.5 = piena */
  const Ls=(280.460+0.9856474*n)%360;
  const lamS=Ls + 1.915*s(M) + 0.020*s(2*M);
  p.fase=(((lam-lamS)%360+360)%360)/360;
  p.illum=(1-Math.cos(p.fase*2*Math.PI))/2;     /* quanta se ne vede illuminata */
  return p;
}
function nomeFase(f){
  if(f<0.03||f>0.97) return 'Luna nuova';
  if(f<0.22) return 'Luna crescente';
  if(f<0.28) return 'Primo quarto';
  if(f<0.47) return 'Gibbosa crescente';
  if(f<0.53) return 'Luna piena';
  if(f<0.72) return 'Gibbosa calante';
  if(f<0.78) return 'Ultimo quarto';
  return 'Luna calante';
}
function oraLoc(d,tz){
  if(!d) return '—';
  try{ return d.toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit',timeZone:tz||undefined}); }
  catch(e){ return d.toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit'}); }
}
function durata(ms){
  if(ms<0) ms=0;
  const m=Math.round(ms/60000), h=Math.floor(m/60), r=m%60;
  return h? `${h} h ${r} min` : `${r} min`;
}
/* ---------- località ---------- */
let _LOC=null;
function localita(){
  if(!_LOC) _LOC=_LOCD.L.map((x,i)=>({i,n:x[0],la:x[1]/1000,lo:x[2]/1000,
    cc:_LOCD.cc[x[3]],tz:_LOCD.tz[x[4]]}));
  return _LOC;
}
function vicina(lat,lon){
  let best=null,dm=1e9;
  for(const x of localita()){
    const dla=(x.la-lat), dlo=(x.lo-lon)*Math.cos(lat*RAD);
    const d=dla*dla+dlo*dlo;
    if(d<dm){ dm=d; best=x; }
  }
  return best?Object.assign({},best,{km:Math.sqrt(dm)*111.32}):null;
}
/* ---------- posizione ---------- */
const POS={stato:'ignoto', lat:null, lon:null, luogo:null};
function posizioneSalvata(){
  const p=stato.imp.posizione;
  if(p&&p.lat!=null){ POS.lat=p.lat; POS.lon=p.lon; POS.luogo=p.luogo; POS.stato='ok'; }
}
function chiediPosizione(silenzioso){
  if(!navigator.geolocation){ POS.stato='niente'; if(!silenzioso) avvisa('Questo dispositivo non dà la posizione','no'); return; }
  POS.stato='cerco'; aggiornaSole();
  navigator.geolocation.getCurrentPosition(p=>{
    POS.lat=p.coords.latitude; POS.lon=p.coords.longitude;
    const v=vicina(POS.lat,POS.lon);
    POS.luogo=v?{n:v.n,cc:v.cc,tz:v.tz,la:v.la,lo:v.lo}:null;
    POS.stato='ok';
    stato.imp.posizione={lat:POS.lat,lon:POS.lon,luogo:POS.luogo}; salva();
    aggiornaSole();
    if(!silenzioso) avvisa('Posizione trovata: '+(POS.luogo?POS.luogo.n:'—'),'ok');
  },e=>{
    POS.stato = e.code===1 ? 'negata' : 'errore';
    aggiornaSole();
    if(!silenzioso) avvisa(e.code===1?'Non mi hai dato il permesso di sapere dove sei':'Non riesco a trovare la posizione','no');
  },{enableHighAccuracy:false,timeout:12000,maximumAge:600000});
}
function luogoAttuale(){
  if(POS.luogo) return Object.assign({},POS.luogo,{lat:POS.lat,lon:POS.lon});
  if(stato.imp.luogoScelto) return stato.imp.luogoScelto;
  return null;
}
/* ---------- il cielo com'è adesso, con il sole e la luna al loro posto ---------- */
/* i colori del cielo adesso: notte, pieno giorno, oppure alba e tramonto */
/* I colori non saltano da «notte» a «giorno»: passano piano, come il vero
   cielo. Per ogni altezza del sole mescolo i due quadri più vicini. */
const CIELO_FASI=[
  {a:-90,  c:['#01030c','#03071a','#070d28','#0d1436']},   /* notte fonda */
  {a:-14,  c:['#03081a','#0a1330','#141f4a','#1d2b5c']},   /* notte */
  {a:-7,   c:['#070e2c','#141a48','#3a2358','#63304f']},   /* prima luce */
  {a:-3,   c:['#0e1740','#3b2a5e','#9a4450','#d4744f']},   /* crepuscolo */
  {a:-0.833,c:['#17224f','#6d3a63','#d4653c','#ffb267']},  /* sole sull'orizzonte */
  {a:4,    c:['#1a3a72','#4a6ba5','#c9855c','#ffcf9c']},   /* sole appena su */
  {a:12,   c:['#14418a','#3170b6','#8cbfe2','#d6e9f6']},   /* mattino */
  {a:30,   c:['#12448c','#2f77bd','#7bb8e0','#bcdcf2']},   /* giorno */
  {a:90,   c:['#0e3f92','#2b74c0','#78b7e4','#c6e3f6']}    /* sole alto */
];
function _dueCifre(x){ const v=Math.max(0,Math.min(255,Math.round(x))).toString(16); return v.length<2?'0'+v:v; }
function mescolaCol(a,b,t){
  const p=c=>[parseInt(c.slice(1,3),16),parseInt(c.slice(3,5),16),parseInt(c.slice(5,7),16)];
  const A=p(a), B=p(b);
  return '#'+_dueCifre(A[0]+(B[0]-A[0])*t)+_dueCifre(A[1]+(B[1]-A[1])*t)+_dueCifre(A[2]+(B[2]-A[2])*t);
}
function coloriCielo(altSole){
  const h=Math.max(-90,Math.min(90,altSole||0));
  let i=0;
  while(i<CIELO_FASI.length-2 && h>CIELO_FASI[i+1].a) i++;
  const A=CIELO_FASI[i], B=CIELO_FASI[i+1];
  const t=Math.max(0,Math.min(1,(h-A.a)/(B.a-A.a||1)));
  return A.c.map((c,k)=>mescolaCol(c,B.c[k],t));
}
let _nCielo=0;
/* quanto il riquadro schiaccia il disegno: serve per tenere tonda la luna */
function rapportoCielo(el,W,H){
  if(!el||!el.clientWidth||!el.clientHeight) return 1;
  return (el.clientHeight/(H||300))/(el.clientWidth/(W||900));
}
/* dove finisce il cielo e comincia la barra con l'ora: così la riga
   dell'orizzonte cade appena sopra la scritta del tramonto */
function orizzonteDi(el){
  if(!el) return 0.60;
  const pan=el.querySelector('.ci-pan')||el;
  const bar=el.querySelector('.ci-basso');
  if(!bar||!pan.clientHeight) return 0.60;
  const a=pan.getBoundingClientRect(), b=bar.getBoundingClientRect();
  const f=(b.top-a.top)/a.height;
  return (f>0.25&&f<0.9) ? f : 0.60;
}
function cieloHtml(lat,lon,quando,W,H,q,orizFraz){
  W=W||900; H=H||300; q=q||1;
  const d=quando||new Date();
  const S=posizioneSole(d,lat,lon), L=posizioneLuna(d,lat,lon);
  /* la linea dell'orizzonte cade appena sopra la barra con l'ora del tramonto */
  const oriz=H*Math.max(0.30,Math.min(0.86, orizFraz||0.60));
  const AZ0=38, AZ1=322;                  /* da nord-est a nord-ovest */
  const px=az=>{ let a=az; if(a<AZ0) a+=360; return W*((a-AZ0)/(AZ1-AZ0)); };
  /* l'arco riempie tutto il cielo del riquadro: invece di misurare fino a 90°
     (dove il sole non arriva mai da noi) arrivo fino a quanto sale davvero oggi */
  const mez=calcolaSole(d,lat,lon).mezzo;
  const altMax = mez ? posizioneSole(mez,lat,lon).alt : 60;
  const cima = Math.max(22, Math.min(90, Math.max(altMax, L.alt, S.alt) + 6));
  const py=alt=>oriz - (alt/cima)*(oriz-H*0.05);
  const n=x=>x.toFixed(1);
  const giorno=S.alt>-0.833;
  const alto=S.alt>12;
  const C = coloriCielo(S.alt);
  const sx=px(S.az), sy=py(S.alt), lx=px(L.az), ly=py(L.alt);
  const dentro=(x)=>x>-40 && x<W+40;
  /* stelle solo quando è buio */
  const stelle = S.alt<-6 ? [...Array(70)].map((_,k)=>{
      const r=seme(k+21), x=(r()*W)|0, y=(r()*oriz*0.94)|0, rr=(r()*1.3+0.4).toFixed(2);
      const o=(0.25+r()*0.65).toFixed(2);
      return `<circle cx="${x}" cy="${y}" r="${rr}" fill="#fff" opacity="${o}">
        <animate attributeName="opacity" values="${o};${(o*0.3).toFixed(2)};${o}"
          dur="${(2.4+r()*4).toFixed(1)}s" repeatCount="indefinite"/></circle>`;}).join('') : '';
  /* ---------- la luna com'è davvero ----------
     tonda (non schiacciata), con i suoi mari, la fase esatta
     e la parte illuminata girata verso il sole, come si vede in cielo */
  /* Sole e luna in cielo si vedono grandi uguali (per questo esistono le
     eclissi): li disegno della stessa misura. La luna cambia un pochino
     secondo quanto è lontana quel giorno. */
  const rL=H*0.058*(L.grande||1);
  const f=L.fase;                       /* 0 nuova · 0.5 piena */
  const k=Math.cos(2*Math.PI*f);        /* 1 nuova · -1 piena */
  const idL='ln'+(_nCielo++);
  /* da che parte sta il sole, visto da qui: la luce viene sempre di là */
  const dAz=((S.az-L.az+540)%360)-180;
  const ang=Math.atan2((py(S.alt)-py(L.alt))*q, dAz*(W/(AZ1-AZ0)))*180/Math.PI;
  const rr=n(rL), rx=n(rL*Math.abs(k)), verso=k<0?1:0;
  const luce=`M0 ${n(-rL)} A ${rr} ${rr} 0 0 1 0 ${rr} A ${rx} ${rr} 0 0 ${verso} 0 ${n(-rL)} Z`;
  /* i mari veri della faccia che guarda la terra */
  const MARI=[[0.62,-0.22,0.12,0.09],[0.42,0.06,0.13,0.16],[0.30,0.26,0.09,0.09],
              [0.24,-0.14,0.19,0.17],[0.04,-0.30,0.16,0.15],[0.00,-0.05,0.07,0.06],
              [-0.30,-0.34,0.26,0.22],[-0.58,-0.02,0.22,0.42],[-0.42,0.34,0.10,0.09],
              [-0.20,0.36,0.16,0.13],[-0.15,-0.60,0.38,0.07]];
  const mari=MARI.map(m=>`<ellipse cx="${n(m[0]*rL)}" cy="${n(m[1]*rL)}" rx="${n(m[2]*rL)}" ry="${n(m[3]*rL)}"/>`).join('');
  /* Tycho, il cratere chiaro in basso, con i suoi raggi */
  const tx=-0.12*rL, ty=0.62*rL;
  const raggi=[...Array(9)].map((_,i)=>{ const a=(i*40+14)*RAD;
    return `<line x1="${n(tx+Math.cos(a)*rL*0.10)}" y1="${n(ty+Math.sin(a)*rL*0.10)}"
      x2="${n(tx+Math.cos(a)*rL*0.95)}" y2="${n(ty+Math.sin(a)*rL*0.95)}"
      stroke="#eef2ff" stroke-width="${n(rL*0.035)}" opacity=".2"/>`;}).join('');
  /* Il riquadro guarda da nord-est a nord-ovest. La luna però gira tutto
     attorno: quando esce dai bordi la accosto al bordo più vicino, e quando
     è sotto l'orizzonte la appoggio sulla riga della terra, mezza affondata.
     Così la si vede sempre, con la sua fase e la sua misura di quel giorno,
     e le scritte qui sotto dicono se è su o sotto. */
  let lxU;
  if(L.az>=AZ0 && L.az<=AZ1) lxU=Math.max(rL*1.15,Math.min(W-rL*1.15,lx));
  else{
    const perSotto=((AZ0-L.az)%360+360)%360, perSopra=((L.az-AZ1)%360+360)%360;
    lxU = perSotto<=perSopra ? rL*1.15 : W-rL*1.15;
  }
  const lunaSuCielo = L.alt>-0.5;
  const lunaSottoTerra = L.alt<=-0.5;
  const lyU = lunaSottoTerra ? (oriz-rL*0.34) : Math.max(rL*1.05,ly);
  const disegnoLuna = (lunaSuCielo||lunaSottoTerra) ? `
    <g transform="translate(${n(lxU)} ${n(lyU)}) scale(${q.toFixed(4)} 1)" opacity="${lunaSottoTerra?0.52:1}">
      <circle r="${n(rL*2.8)}" fill="url(#alone)"/>
      <g transform="rotate(${ang.toFixed(1)})">
        <circle r="${rr}" fill="#1a2340" opacity="${giorno?0.1:(S.alt>-8?0.38:0.72)}"/>
        <clipPath id="${idL}"><path d="${luce}"/></clipPath>
        <g clip-path="url(#${idL})">
          <circle r="${rr}" fill="url(#sup)"/>
          <g fill="#8e98b6" opacity=".5" filter="url(#sfuma)">${mari}</g>
          ${raggi}
          <circle cx="${n(tx)}" cy="${n(ty)}" r="${n(rL*0.055)}" fill="#f4f7ff" opacity=".85"/>
          <circle cx="${n(-0.32*rL)}" cy="${n(-0.06*rL)}" r="${n(rL*0.045)}" fill="#eaeefb" opacity=".6"/>
        </g>
      </g>
    </g>` : '';
  /* quando sta sotto l'orizzonte la disegno lo stesso, ma sotto la riga
     della terra e più smorta: così vedi sempre dov'è la luna adesso */
  const luna = lunaSuCielo ? disegnoLuna : '';
  const lunaSotto = lunaSottoTerra ? disegnoLuna : '';
  /* il sole */
  const rS=H*0.058;
  const sole = S.alt>-9 && S.az>=AZ0-6 && S.az<=AZ1+6 ? `
    <g opacity="${S.alt<0?0.55:1}">
      <circle cx="${n(sx)}" cy="${n(sy)}" r="${n(rS*4.2)}" fill="url(#corona)"/>
      ${[...Array(16)].map((_,q)=>{const g=q*22.5*Math.PI/180,l=q%2?rS*0.5:rS*0.95;
        return `<line x1="${n(sx+rS*1.35*Math.cos(g))}" y1="${n(sy+rS*1.35*Math.sin(g))}"
          x2="${n(sx+(rS*1.35+l)*Math.cos(g))}" y2="${n(sy+(rS*1.35+l)*Math.sin(g))}"
          stroke="#ffeeb0" stroke-width="${(H*0.006).toFixed(1)}" stroke-linecap="round" opacity=".45"/>`;}).join('')}
      <circle cx="${n(sx)}" cy="${n(sy)}" r="${n(rS)}" fill="url(#disco)"/>
    </g>` : '';
  /* il cammino del sole di oggi */
  const camm=[...Array(97)].map((_,q)=>{
      const t2=new Date(d); t2.setHours(0,0,0,0); t2.setMinutes(q*15);
      const p=posizioneSole(t2,lat,lon);
      return {x:px(p.az),y:py(p.alt),alt:p.alt,az:p.az};
    }).filter(p=>p.alt>-3 && p.az>=AZ0 && p.az<=AZ1);
  const via = camm.length>1 ? `<path d="M${camm.map(p=>n(p.x)+' '+n(p.y)).join(' L')}"
      fill="none" stroke="rgba(255,255,255,.22)" stroke-width="1.2" stroke-dasharray="3 6"/>` : '';
  /* i punti cardinali stanno appena SOPRA l'orizzonte, così le scritte in basso non li coprono */
  const bussola=[['E',90],['SE',135],['S',180],['SO',225],['O',270]]
    .filter(b=>b[1]>=AZ0&&b[1]<=AZ1)
    .map(b=>`<text x="${n(px(b[1]))}" y="${n(oriz-H*0.028)}" fill="rgba(255,255,255,.62)"
      font-size="${(H*0.052).toFixed(0)}" text-anchor="middle" font-family="system-ui"
      style="paint-order:stroke" stroke="rgba(0,0,0,.45)" stroke-width="${(H*0.012).toFixed(1)}">${b[0]}</text>`).join('');
  return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" class="ci-svg" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="cielo" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${C[0]}"/><stop offset="45%" stop-color="${C[1]}"/>
      <stop offset="78%" stop-color="${C[2]}"/><stop offset="100%" stop-color="${C[3]}"/></linearGradient>
    <radialGradient id="corona"><stop offset="0%" stop-color="#fff8dc" stop-opacity=".9"/>
      <stop offset="35%" stop-color="${alto?'#ffe9a8':'#ffb45e'}" stop-opacity=".4"/>
      <stop offset="100%" stop-color="#ff8a2b" stop-opacity="0"/></radialGradient>
    <radialGradient id="disco" cx="36%" cy="32%" r="72%">
      <stop offset="0%" stop-color="#fffefa"/><stop offset="55%" stop-color="${alto?'#fff0b8':'#ffcf6b'}"/>
      <stop offset="100%" stop-color="${alto?'#ffd34d':'#ff9a28'}"/></radialGradient>
    <radialGradient id="alone"><stop offset="0%" stop-color="#dce6ff" stop-opacity=".45"/>
      <stop offset="100%" stop-color="#dce6ff" stop-opacity="0"/></radialGradient>
    <radialGradient id="sup" cx="38%" cy="34%" r="72%">
      <stop offset="0%" stop-color="#f6f8ff"/><stop offset="62%" stop-color="#dfe4f2"/>
      <stop offset="100%" stop-color="#b3bbd2"/></radialGradient>
    <filter id="sfuma" x="-25%" y="-25%" width="150%" height="150%">
      <feGaussianBlur stdDeviation="${n(rL*0.055)}"/></filter>
  </defs>
  <rect width="${W}" height="${oriz}" fill="url(#cielo)"/>
  ${stelle}${via}${luna}${sole}
  <rect y="${oriz}" width="${W}" height="${H-oriz}" fill="${giorno?'#16241b':'#050a16'}"/>
  <path d="M0 ${oriz} Q ${W*0.12} ${oriz-H*0.055} ${W*0.26} ${oriz-H*0.012}
    T ${W*0.55} ${oriz-H*0.03} T ${W*0.82} ${oriz-H*0.008} T ${W} ${oriz-H*0.02}
    L${W} ${oriz+2} L0 ${oriz+2} Z" fill="${giorno?'#0f1c14':'#03070f'}"/>
  <line x1="0" y1="${oriz}" x2="${W}" y2="${oriz}"
    stroke="${giorno?'rgba(255,235,190,.8)':'rgba(170,200,255,.55)'}" stroke-width="2"/>
  ${lunaSotto}
  ${bussola}
  </svg>`;
}
/* ---------- il pannello del cielo sulla dashboard ---------- */
function datiSole(l,ora){
  const d=ora||new Date();
  const la=l.la!=null?l.la:l.lat, lo=l.lo!=null?l.lo:l.lon;
  const s=calcolaSole(d,la,lo);
  if(s.sempre) return {sempre:s.sempre,tz:l.tz,la,lo};
  const giorno = d>=s.alba && d<s.tramonto;
  const dom=calcolaSole(new Date(d.getTime()+86400000),la,lo);
  const prossima = giorno ? s.tramonto : (d<s.alba ? s.alba : dom.alba);
  return {alba:s.alba,tramonto:s.tramonto,giorno,prossima,tz:l.tz,la,lo,
          manca:prossima-d, luce:s.tramonto-s.alba};
}
/* La luce che esce da dietro al riquadro: sono i colori del cielo di adesso.
   All'alba è arancione, a mezzogiorno azzurra, di notte blu scuro — cambia
   piano piano insieme al cielo disegnato dentro. */
function luciCielo(alt){
  const C=coloriCielo(alt);
  return `--luce:${C[3]};--luce2:${C[2]};--luce3:${C[1]}`;
}
function pannelloSole(){
  const box=document.getElementById('tzSole');
  const q=rapportoCielo(box,900,300), oz=orizzonteDi(box);
  const l=luogoAttuale();
  if(!l) return `<button class="ci-pan vuoto2" onclick="chiediPosizione()">
      <div class="ci-sf">${cieloHtml(43.5,11.9,new Date(),900,300,q,oz)}</div>
      <div class="ci-cont"><div class="ci-luogo">📍 Dove sei?</div>
        <div class="ci-tit">${POS.stato==='cerco'?'Sto cercando…':'Tocca per sapere alba e tramonto'}</div></div>
    </button>`;
  const s=datiSole(l);
  const d=new Date();
  const L=posizioneLuna(d,s.la,s.lo), So=posizioneSole(d,s.la,s.lo);
  if(s.sempre) return `<button class="ci-pan acceso" style="${luciCielo(So.alt)}" onclick="vai('sole')">
      <div class="ci-sf">${cieloHtml(s.la,s.lo,d,900,300,q,oz)}</div>
      <div class="ci-cont"><div class="ci-luogo">📍 ${esc(l.n)}</div>
      <div class="ci-tit">${s.sempre==='giorno'?'Il sole non tramonta':'Il sole non sorge'}</div></div></button>`;
  return `<button class="ci-pan acceso" style="${luciCielo(So.alt)}" onclick="vai('sole')">
    <div class="ci-sf">${cieloHtml(s.la,s.lo,d,900,300,q,oz)}</div>
    <div class="ci-cont">
      <div class="ci-alto">
        <span class="ci-luogo">📍 ${esc(l.n)}</span>
        <span class="ci-luna">${faseIcona(L.fase)} ${esc(nomeFase(L.fase))}${L.alt>0?' · in cielo':''}</span>
      </div>
      <div class="ci-basso" style="--luce:${coloriCielo(So.alt)[3]};--luce2:${coloriCielo(So.alt)[2]}">
        <div class="ci-pross">
          <span>${s.giorno?'Tramonto':'Alba'}</span>
          <b>${oraLoc(s.prossima,s.tz)}</b>
          <i>fra ${durata(s.manca)}</i>
        </div>
        <div class="ci-altri">
          <div><span>🌅 Alba</span><b>${oraLoc(s.alba,s.tz)}</b></div>
          <div><span>🌇 Tramonto</span><b>${oraLoc(s.tramonto,s.tz)}</b></div>
          <div><span>☀️ Sole</span><b>${So.alt>0?So.alt.toFixed(0)+'° su':'sotto'}</b></div>
          <div><span>🌙 Luna</span><b>${L.alt>0?L.alt.toFixed(0)+'° su':'sotto'}</b></div>
        </div>
      </div>
    </div></button>`;
}
function faseIcona(f){
  const i=['🌑','🌒','🌓','🌔','🌕','🌖','🌗','🌘'];
  return i[Math.round(f*8)%8];
}
let _tSole=null, _spieSole=false;
function aggiornaSole(){
  const box=document.getElementById('tzSole');
  if(box && sezione==='home') box.innerHTML=pannelloSole();
}
function ritoccaCieloGrande(){
  const b=document.getElementById('cieloGrande'), l=luogoAttuale();
  if(!b||!l) return;
  const d=new Date(Date.now()+FSole.giorno*86400000), s=datiSole(l,d);
  if(s.sempre) return;
  const sf=b.querySelector('.ci-sf');
  if(sf) sf.innerHTML=cieloHtml(s.la,s.lo,d,900,340,rapportoCielo(b,900,340),orizzonteDi(b));
}
function avviaOrologioSole(){
  clearInterval(_tSole);
  _tSole=setInterval(aggiornaSole,20000);
  /* la prima volta il riquadro non c'è ancora: appena c'è si rifà, così la luna resta tonda */
  requestAnimationFrame(()=>{ aggiornaSole(); ritoccaCieloGrande(); });
  /* sull'iPad e sul telefono il tempo si ferma quando il programma va sullo sfondo:
     appena torna in primo piano si ricalcola subito */
  if(!_spieSole){
    _spieSole=true;
    const sveglia=()=>{ if(!document.hidden){ aggiornaSole(); ritoccaCieloGrande(); } };
    document.addEventListener('visibilitychange',sveglia);
    window.addEventListener('focus',sveglia);
    window.addEventListener('pageshow',sveglia);
    window.addEventListener('resize',()=>{ clearTimeout(window._tRid); window._tRid=setTimeout(sveglia,250); });
  }
}
/* ================= SEZIONE: ALBA E TRAMONTO NEL MONDO ================= */
const FSole={ q:'', giorno:0 };
function vSole(){
  const l=luogoAttuale();
  const d=new Date(Date.now()+FSole.giorno*86400000);
  pinta(`
  <div class="fila" style="margin-bottom:12px">
    <button class="bt pi mini" onclick="vai('home')">‹ Home</button>
    <span style="flex:1"></span>
    <button class="bt pi mini" onclick="chiediPosizione()">📍 Dove sono</button>
  </div>
  <div class="occhiello">Sole</div>
  <h1>Alba e tramonto</h1>
  <p class="sotto">Il calcolo è dentro al programma: funziona anche senza internet, in ${(_LOCD.L.length).toLocaleString('it-IT')} località del mondo.</p>

  ${l?cartaSole(l,d,true):`<div class="vuoto"><span class="em">📍</span>
    Non so ancora dove sei.<br><button class="bt pr" style="margin-top:14px" onclick="chiediPosizione()">Trova la mia posizione</button></div>`}

  <div class="filtri" style="margin-top:18px">
    <div class="campo" style="flex:0 0 auto"><label>Giorno</label>
      <div class="segm">
        <button class="${FSole.giorno===-1?'on':''}" onclick="setSole('giorno',-1)">Ieri</button>
        <button class="${FSole.giorno===0?'on':''}" onclick="setSole('giorno',0)">Oggi</button>
        <button class="${FSole.giorno===1?'on':''}" onclick="setSole('giorno',1)">Domani</button>
      </div></div>
    <div class="campo" style="flex:1 1 260px"><label>Cerca una località nel mondo</label>
      <div class="cerca"><input type="search" id="qSole" placeholder="Arezzo, Bucarest, Gerusalemme…" value="${esc(FSole.q)}"
        oninput="FSole.q=this.value; clearTimeout(window._ts2); window._ts2=setTimeout(elencoSole,200)"></div></div>
  </div>
  <div id="elSole"></div>`);
  requestAnimationFrame(ritoccaCieloGrande);
  elencoSole();
}
function setSole(k,v){ FSole[k]=v; vSole(); }
function cartaSole(l,d,grande){
  const s=datiSole(l,d);
  if(s.sempre) return `<div class="scheda"><b>${esc(l.n)}</b> — ${s.sempre==='giorno'?'sole sempre alto':'sole sempre sotto l\'orizzonte'}</div>`;
  const L=posizioneLuna(d,s.la,s.lo), So=posizioneSole(d,s.la,s.lo);
  return `<div class="ci-pan grande acceso" id="cieloGrande" style="${luciCielo(So.alt)}">
    <div class="ci-sf">${cieloHtml(s.la,s.lo,d,900,340,
        rapportoCielo(document.getElementById('cieloGrande'),900,340),
        orizzonteDi(document.getElementById('cieloGrande')))}</div>
    <div class="ci-cont">
      <div class="ci-alto">
        <span class="ci-luogo">📍 ${esc(l.n)}${l.cc?' · '+esc(l.cc):''}${l.km!=null?' · a '+Math.round(l.km)+' km':''}</span>
        <span class="ci-luna">${faseIcona(L.fase)} ${esc(nomeFase(L.fase))}</span>
      </div>
      <div class="ci-basso" style="--luce:${coloriCielo(So.alt)[3]};--luce2:${coloriCielo(So.alt)[2]}">
        <div class="ci-pross"><span>${s.giorno?'Manca al tramonto':'Manca all\'alba'}</span>
          <b>${durata(s.manca)}</b><i>${oraLoc(s.prossima,l.tz)}</i></div>
        <div class="ci-altri">
          <div><span>🌅 Alba</span><b>${oraLoc(s.alba,l.tz)}</b></div>
          <div><span>🌇 Tramonto</span><b>${oraLoc(s.tramonto,l.tz)}</b></div>
          <div><span>☀️ Ore di luce</span><b>${durata(s.luce)}</b></div>
          <div><span>☀️ Sole</span><b>${So.alt>0?So.alt.toFixed(0)+'°':'sotto'}</b></div>
          <div><span>🌙 Luna</span><b>${L.alt>0?L.alt.toFixed(0)+'°':'sotto'}</b></div>
        </div>
      </div>
    </div></div>`;
}
function elencoSole(){
  const c=document.getElementById('elSole'); if(!c) return;
  const q=ck(FSole.q);
  const d=new Date(Date.now()+FSole.giorno*86400000);
  if(q.length<2){
    c.innerHTML=`<p class="sotto" style="text-align:center;padding:26px 0">Scrivi almeno due lettere per cercare una località.</p>`;
    return;
  }
  const tut=localita();
  const esatti=[],dentro=[];
  for(const x of tut){
    const n=ck(x.n);
    if(n===q||n.startsWith(q)) esatti.push(x);
    else if(n.includes(q)) dentro.push(x);
    if(esatti.length>60) break;
  }
  const el=esatti.concat(dentro).slice(0,40);
  c.innerHTML = el.length? `<h2>Trovate <span class="pill">${el.length}</span></h2>
    <div class="griglia g2">${el.map(x=>{
      const s=datiSole(x,d);
      if(s.sempre) return `<div class="rg"><div class="cp"><b>${esc(x.n)}</b><span>${esc(x.cc)} · ${s.sempre==='giorno'?'sole sempre alto':'notte polare'}</span></div></div>`;
      return `<div class="rg" onclick="scegliLuogo(${x.i})">
        <div style="font-size:20px">${s.giorno?'☀️':'🌙'}</div>
        <div class="cp"><b>${esc(x.n)}</b><span>${esc(x.cc)} · alba ${oraLoc(s.alba,x.tz)} · tramonto ${oraLoc(s.tramonto,x.tz)}</span></div>
        <div class="az"><span class="tag at">${durata(s.luce)}</span></div></div>`;}).join('')}</div>`
    : `<div class="vuoto"><span class="em">🔍</span>Nessuna località con questo nome.</div>`;
}
function scegliLuogo(i){
  const x=localita()[i]; if(!x) return;
  stato.imp.luogoScelto={n:x.n,cc:x.cc,tz:x.tz,la:x.la,lo:x.lo};
  salva(); vSole(); avvisa('Località scelta: '+x.n,'ok');
}
