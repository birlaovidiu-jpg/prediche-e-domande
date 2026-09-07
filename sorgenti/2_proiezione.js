/* ================= PROIEZIONE ================= */
const PROI={ slide:[], i:0, tema:'notte', aperta:false, fin:null, canale:null, titolo:'' };
try{ PROI.canale=new BroadcastChannel('proiezione_sdarm'); }catch(e){}

/* ---------- sfondi generati (nessuna immagine esterna) ---------- */
const SFONDI={
  nero:{et:'Nero',ic:'⬛'}, notte:{et:'Notte stellata',ic:'🌌'}, galassia:{et:'Galassia',ic:'🌌'},
  universo:{et:'Universo profondo',ic:'🪐'}, nebulosa:{et:'Nebulosa',ic:'💫'}, aurora:{et:'Aurora boreale',ic:'🌠'},
  alba:{et:'Alba',ic:'🌄'}, tramonto:{et:'Tramonto',ic:'🌇'}, luce:{et:'Raggi di luce',ic:'✨'},
  croce:{et:'Croce',ic:'✝️'}, acqua:{et:'Acque',ic:'🌊'}, mare:{et:'Mare aperto',ic:'🌅'},
  foresta:{et:'Foresta',ic:'🌲'}, montagna:{et:'Montagne',ic:'⛰️'}, prato:{et:'Prato fiorito',ic:'🌸'},
  deserto:{et:'Deserto',ic:'🏜️'}, fuoco:{et:'Fuoco',ic:'🔥'}, cielo:{et:'Cielo e nubi',ic:'☁️'},
  oro:{et:'Oro',ic:'🕯️'}, pietra:{et:'Pietra',ic:'🪨'}, grano:{et:'Campo di grano',ic:'🌾'},
  sobrio:{et:'Sobrio',ic:'🌑'}
};
function stelle(n,s){ const r=seme(s||7); let o=''; for(let i=0;i<n;i++){
  const x=(r()*100).toFixed(2), y=(r()*100).toFixed(2), rr=(r()*1.5+.3).toFixed(2), op=(r()*.75+.2).toFixed(2);
  o+=`<circle cx="${x}%" cy="${y}%" r="${rr}" fill="#fff" opacity="${op}"><animate attributeName="opacity" values="${op};${(op*.28).toFixed(2)};${op}" dur="${(2.5+r()*4).toFixed(1)}s" repeatCount="indefinite"/></circle>`;
} return o; }
function sfondoHtml(t){
  const S=`<svg class="sfondo" preserveAspectRatio="xMidYMid slice" viewBox="0 0 1600 900" xmlns="http://www.w3.org/2000/svg">`;
  switch(t){
  case 'notte': return S+`<defs><radialGradient id="g" cx="50%" cy="16%" r="92%">
    <stop offset="0%" stop-color="#1b2a52"/><stop offset="48%" stop-color="#0c1330"/><stop offset="100%" stop-color="#04060f"/></radialGradient></defs>
    <rect width="1600" height="900" fill="url(#g)"/>${stelle(150,3)}
    <ellipse cx="800" cy="900" rx="1100" ry="230" fill="#02030a" opacity=".85"/></svg>`;
  case 'alba': return S+`<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#0d1b3a"/><stop offset="42%" stop-color="#7a3b52"/>
    <stop offset="68%" stop-color="#d97a4e"/><stop offset="86%" stop-color="#f0b463"/><stop offset="100%" stop-color="#2b1a18"/></linearGradient>
    <radialGradient id="s" cx="50%" cy="80%" r="30%"><stop offset="0%" stop-color="#fff3c4" stop-opacity=".95"/><stop offset="100%" stop-color="#fff3c4" stop-opacity="0"/></radialGradient></defs>
    <rect width="1600" height="900" fill="url(#g)"/><ellipse cx="800" cy="720" rx="520" ry="360" fill="url(#s)"/>
    <path d="M0 760 Q 260 660 470 730 T 900 700 T 1330 745 T 1600 700 L1600 900 L0 900Z" fill="#1a1220" opacity=".92"/>
    <path d="M0 820 Q 340 750 700 800 T 1600 790 L1600 900 L0 900Z" fill="#0b0810"/></svg>`;
  case 'luce': return S+`<defs><radialGradient id="g" cx="50%" cy="0%" r="105%">
    <stop offset="0%" stop-color="#f7e6bd"/><stop offset="26%" stop-color="#8a7a5c"/><stop offset="62%" stop-color="#231f2e"/><stop offset="100%" stop-color="#0a0a12"/></radialGradient></defs>
    <rect width="1600" height="900" fill="url(#g)"/><g opacity=".2">
    ${[...Array(11)].map((_,i)=>`<polygon points="800,-40 ${380+i*158},980 ${470+i*158},980" fill="#fff9e0" opacity="${.16+(i%3)*.09}"/>`).join('')}</g></svg>`;
  case 'croce': return S+`<defs><radialGradient id="g" cx="50%" cy="34%" r="86%">
    <stop offset="0%" stop-color="#2c3350"/><stop offset="60%" stop-color="#111427"/><stop offset="100%" stop-color="#05060d"/></radialGradient>
    <linearGradient id="c" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#ffffff" stop-opacity=".13"/><stop offset="100%" stop-color="#ffffff" stop-opacity=".02"/></linearGradient></defs>
    <rect width="1600" height="900" fill="url(#g)"/>${stelle(60,11)}
    <g transform="translate(800,430)"><rect x="-26" y="-300" width="52" height="640" fill="url(#c)"/><rect x="-150" y="-152" width="300" height="52" fill="url(#c)"/></g></svg>`;
  case 'acqua': return S+`<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#0a2540"/><stop offset="50%" stop-color="#0d3b57"/><stop offset="100%" stop-color="#041420"/></linearGradient></defs>
    <rect width="1600" height="900" fill="url(#g)"/>
    ${[0,1,2,3,4].map(i=>`<path d="M0 ${560+i*80} Q 200 ${520+i*80} 400 ${560+i*80} T 800 ${560+i*80} T 1200 ${560+i*80} T 1600 ${560+i*80} L1600 900 L0 900Z" fill="#7fd4ff" opacity="${.05+i*.018}"><animateTransform attributeName="transform" type="translate" values="0 0;${40-i*9} ${5-i};0 0" dur="${7+i*2}s" repeatCount="indefinite"/></path>`).join('')}</svg>`;
  case 'deserto': return S+`<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#1a1a2e"/><stop offset="40%" stop-color="#6b4a35"/><stop offset="72%" stop-color="#c08b52"/><stop offset="100%" stop-color="#3a2415"/></linearGradient></defs>
    <rect width="1600" height="900" fill="url(#g)"/>
    <path d="M0 620 Q 300 540 620 620 T 1180 600 T 1600 640 L1600 900 L0 900Z" fill="#8a5f38" opacity=".8"/>
    <path d="M0 730 Q 400 660 820 740 T 1600 720 L1600 900 L0 900Z" fill="#5a3d24"/>
    <path d="M0 840 Q 500 790 1000 845 T 1600 830 L1600 900 L0 900Z" fill="#33210f"/></svg>`;
  case 'fuoco': return S+`<defs><radialGradient id="g" cx="50%" cy="102%" r="92%">
    <stop offset="0%" stop-color="#ff9a3c"/><stop offset="26%" stop-color="#b32d10"/><stop offset="62%" stop-color="#3a0e0a"/><stop offset="100%" stop-color="#0a0403"/></radialGradient></defs>
    <rect width="1600" height="900" fill="url(#g)"/>
    ${[...Array(26)].map((_,i)=>{const r=seme(i+40);const x=(r()*1600)|0;const d=(4+r()*6).toFixed(1);
      return `<circle cx="${x}" cy="900" r="${(2+r()*4).toFixed(1)}" fill="#ffca7a" opacity=".65"><animate attributeName="cy" values="920;${(120+r()*360)|0}" dur="${d}s" repeatCount="indefinite"/><animate attributeName="opacity" values=".7;0" dur="${d}s" repeatCount="indefinite"/></circle>`;}).join('')}</svg>`;
  case 'cielo': return S+`<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#173b6b"/><stop offset="55%" stop-color="#3f74a8"/><stop offset="100%" stop-color="#0e1c2c"/></linearGradient></defs>
    <rect width="1600" height="900" fill="url(#g)"/>
    ${[[240,190,150,.15],[900,140,205,.12],[1350,260,165,.13],[560,330,125,.1],[1150,400,145,.09]].map(([x,y,r,o])=>
      `<g opacity="${o}"><ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r*.42}" fill="#fff"/><ellipse cx="${x+r*.55}" cy="${y+12}" rx="${r*.66}" ry="${r*.34}" fill="#fff"/><ellipse cx="${x-r*.5}" cy="${y+16}" rx="${r*.56}" ry="${r*.3}" fill="#fff"/>
      <animateTransform attributeName="transform" type="translate" values="0 0;${60+r*.3} 0;0 0" dur="${34+r*.16}s" repeatCount="indefinite"/></g>`).join('')}</svg>`;
  case 'oro': return S+`<defs><radialGradient id="g" cx="50%" cy="44%" r="88%">
    <stop offset="0%" stop-color="#4a3a18"/><stop offset="52%" stop-color="#1d1708"/><stop offset="100%" stop-color="#080602"/></radialGradient></defs>
    <rect width="1600" height="900" fill="url(#g)"/>
    ${[...Array(34)].map((_,i)=>{const r=seme(i+90);const x=(r()*1600)|0,y=(r()*900)|0,rr=(6+r()*30).toFixed(0);
      return `<circle cx="${x}" cy="${y}" r="${rr}" fill="#e8c274" opacity="${(.03+r()*.09).toFixed(3)}"><animate attributeName="opacity" values="${(.03+r()*.09).toFixed(3)};.02;${(.03+r()*.09).toFixed(3)}" dur="${(5+r()*7).toFixed(1)}s" repeatCount="indefinite"/></circle>`;}).join('')}</svg>`;
  case 'pietra': return S+`<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#2c2d31"/><stop offset="52%" stop-color="#1a1b1f"/><stop offset="100%" stop-color="#0c0d10"/></linearGradient></defs>
    <rect width="1600" height="900" fill="url(#g)"/>
    ${[...Array(46)].map((_,i)=>{const r=seme(i+7);return `<rect x="${(r()*1600)|0}" y="${(r()*900)|0}" width="${(40+r()*220)|0}" height="${(20+r()*90)|0}" fill="#fff" opacity="${(.006+r()*.016).toFixed(4)}" rx="6"/>`;}).join('')}</svg>`;
  case 'grano': return S+`<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#20304e"/><stop offset="44%" stop-color="#9a7a3c"/><stop offset="100%" stop-color="#241a08"/></linearGradient></defs>
    <rect width="1600" height="900" fill="url(#g)"/>
    ${[...Array(90)].map((_,i)=>{const r=seme(i+200);const x=(r()*1600)|0,h=(90+r()*230)|0;
      return `<path d="M${x} 900 q ${(r()*22-11).toFixed(0)} -${h/2} 0 -${h}" stroke="#e0c07a" stroke-width="2.2" fill="none" opacity="${(.1+r()*.2).toFixed(2)}"><animateTransform attributeName="transform" type="rotate" values="0 ${x} 900;${(r()*3-1.5).toFixed(1)} ${x} 900;0 ${x} 900" dur="${(3+r()*3).toFixed(1)}s" repeatCount="indefinite"/></path>`;}).join('')}</svg>`;
  case 'nero': return S+`<rect width="1600" height="900" fill="#000"/></svg>`;
  case 'galassia': return S+`<defs>
    <radialGradient id="g" cx="50%" cy="50%" r="80%"><stop offset="0%" stop-color="#241a44"/><stop offset="55%" stop-color="#0a0a1e"/><stop offset="100%" stop-color="#020208"/></radialGradient>
    <radialGradient id="n1" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#ffd9a0" stop-opacity=".95"/><stop offset="35%" stop-color="#c07ae8" stop-opacity=".5"/><stop offset="100%" stop-color="#5b3fa8" stop-opacity="0"/></radialGradient></defs>
    <rect width="1600" height="900" fill="url(#g)"/>${stelle(210,21)}
    <g transform="translate(800,450) rotate(-18)"><ellipse cx="0" cy="0" rx="620" ry="180" fill="url(#n1)" opacity=".85"/>
    <ellipse cx="0" cy="0" rx="330" ry="92" fill="#fff3d0" opacity=".22"/>
    <ellipse cx="0" cy="0" rx="120" ry="42" fill="#fff8e6" opacity=".4"/>
    <animateTransform attributeName="transform" type="rotate" values="-18 0 0;-14 0 0;-18 0 0" dur="26s" repeatCount="indefinite" additive="sum"/></g></svg>`;
  case 'universo': return S+`<defs>
    <radialGradient id="g" cx="42%" cy="38%" r="92%"><stop offset="0%" stop-color="#132a52"/><stop offset="45%" stop-color="#070d22"/><stop offset="100%" stop-color="#010208"/></radialGradient>
    <radialGradient id="p1" cx="36%" cy="34%" r="70%"><stop offset="0%" stop-color="#e8b978"/><stop offset="65%" stop-color="#a8703a"/><stop offset="100%" stop-color="#4a2c14"/></radialGradient></defs>
    <rect width="1600" height="900" fill="url(#g)"/>${stelle(240,33)}
    <ellipse cx="1290" cy="250" rx="150" ry="150" fill="url(#p1)" opacity=".92"/>
    <ellipse cx="1290" cy="250" rx="255" ry="52" fill="none" stroke="#d8b98a" stroke-width="9" opacity=".5" transform="rotate(-22 1290 250)"/>
    <ellipse cx="1290" cy="250" rx="300" ry="62" fill="none" stroke="#b99a6d" stroke-width="4" opacity=".3" transform="rotate(-22 1290 250)"/>
    <circle cx="330" cy="690" r="58" fill="#6f8bbf" opacity=".55"/></svg>`;
  case 'nebulosa': return S+`<defs>
    <radialGradient id="g" cx="50%" cy="50%" r="85%"><stop offset="0%" stop-color="#1a1038"/><stop offset="100%" stop-color="#04030c"/></radialGradient>
    <radialGradient id="a1" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#ff6fae" stop-opacity=".55"/><stop offset="100%" stop-color="#ff6fae" stop-opacity="0"/></radialGradient>
    <radialGradient id="a2" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#5ad8ff" stop-opacity=".45"/><stop offset="100%" stop-color="#5ad8ff" stop-opacity="0"/></radialGradient>
    <radialGradient id="a3" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#b98cff" stop-opacity=".45"/><stop offset="100%" stop-color="#b98cff" stop-opacity="0"/></radialGradient></defs>
    <rect width="1600" height="900" fill="url(#g)"/>
    <ellipse cx="560" cy="380" rx="470" ry="330" fill="url(#a1)"><animate attributeName="rx" values="470;520;470" dur="17s" repeatCount="indefinite"/></ellipse>
    <ellipse cx="1080" cy="520" rx="520" ry="300" fill="url(#a2)"><animate attributeName="ry" values="300;350;300" dur="21s" repeatCount="indefinite"/></ellipse>
    <ellipse cx="860" cy="300" rx="380" ry="260" fill="url(#a3)"><animate attributeName="rx" values="380;430;380" dur="24s" repeatCount="indefinite"/></ellipse>
    ${stelle(190,55)}</svg>`;
  case 'aurora': return S+`<defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#04122a"/><stop offset="70%" stop-color="#061a30"/><stop offset="100%" stop-color="#02060f"/></linearGradient>
    <linearGradient id="v1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#54ffb8" stop-opacity="0"/><stop offset="45%" stop-color="#54ffb8" stop-opacity=".5"/><stop offset="100%" stop-color="#2f7bff" stop-opacity="0"/></linearGradient>
    <linearGradient id="v2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#b06cff" stop-opacity="0"/><stop offset="50%" stop-color="#7ae0ff" stop-opacity=".42"/><stop offset="100%" stop-color="#7ae0ff" stop-opacity="0"/></linearGradient></defs>
    <rect width="1600" height="900" fill="url(#g)"/>${stelle(150,71)}
    <path d="M120 60 Q 380 300 300 700 L 480 700 Q 560 280 340 60 Z" fill="url(#v1)">
      <animateTransform attributeName="transform" type="translate" values="0 0;90 0;0 0" dur="15s" repeatCount="indefinite"/></path>
    <path d="M620 40 Q 900 320 800 720 L 1000 720 Q 1080 300 840 40 Z" fill="url(#v2)">
      <animateTransform attributeName="transform" type="translate" values="0 0;-110 0;0 0" dur="19s" repeatCount="indefinite"/></path>
    <path d="M1120 70 Q 1360 330 1290 700 L 1450 700 Q 1500 300 1320 70 Z" fill="url(#v1)" opacity=".7">
      <animateTransform attributeName="transform" type="translate" values="0 0;70 0;0 0" dur="23s" repeatCount="indefinite"/></path>
    <path d="M0 720 L1600 700 L1600 900 L0 900Z" fill="#010409"/></svg>`;
  case 'tramonto': return S+`<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#1b2b5e"/><stop offset="38%" stop-color="#a8456a"/>
    <stop offset="64%" stop-color="#e8703f"/><stop offset="82%" stop-color="#ffb45e"/><stop offset="100%" stop-color="#3a1f18"/></linearGradient>
    <radialGradient id="s" cx="50%" cy="76%" r="26%"><stop offset="0%" stop-color="#fff6d0"/><stop offset="100%" stop-color="#ffd08a" stop-opacity="0"/></radialGradient></defs>
    <rect width="1600" height="900" fill="url(#g)"/><circle cx="800" cy="690" r="140" fill="url(#s)"/>
    <circle cx="800" cy="690" r="72" fill="#fff2c4" opacity=".9"/>
    <path d="M0 700 L1600 700 L1600 900 L0 900Z" fill="#26140f" opacity=".9"/>
    ${[0,1,2].map(i=>`<ellipse cx="${400+i*420}" cy="${760+i*40}" rx="${520-i*60}" ry="${18-i*3}" fill="#ffd9a0" opacity="${.12-i*.03}"/>`).join('')}</svg>`;
  case 'mare': return S+`<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#0a1f3c"/><stop offset="42%" stop-color="#2a6fa8"/><stop offset="55%" stop-color="#0d4a6e"/><stop offset="100%" stop-color="#03151f"/></linearGradient></defs>
    <rect width="1600" height="900" fill="url(#g)"/>
    <circle cx="1180" cy="200" r="76" fill="#ffeeb8" opacity=".85"/>
    ${[0,1,2,3,4,5].map(i=>`<path d="M0 ${470+i*78} Q 200 ${440+i*78} 400 ${470+i*78} T 800 ${470+i*78} T 1200 ${470+i*78} T 1600 ${470+i*78} L1600 900 L0 900Z" fill="#8fd8ff" opacity="${.06+i*.02}"><animateTransform attributeName="transform" type="translate" values="0 0;${50-i*8} ${4-i};0 0" dur="${6+i*2}s" repeatCount="indefinite"/></path>`).join('')}</svg>`;
  case 'foresta': return S+`<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#0d2a1e"/><stop offset="45%" stop-color="#123a26"/><stop offset="100%" stop-color="#04120b"/></linearGradient>
    <linearGradient id="r" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#c8ffb0" stop-opacity=".16"/><stop offset="100%" stop-color="#c8ffb0" stop-opacity="0"/></linearGradient></defs>
    <rect width="1600" height="900" fill="url(#g)"/>
    ${[...Array(9)].map((_,i)=>`<polygon points="${180+i*170},-30 ${100+i*170},900 ${260+i*170},900" fill="url(#r)" opacity="${.5+(i%3)*.2}"/>`).join('')}
    ${[...Array(16)].map((_,i)=>{const r=seme(i+150);const x=(r()*1600)|0,h=(320+r()*430)|0,w=(46+r()*54)|0;
      return `<g opacity="${(.35+r()*.4).toFixed(2)}"><rect x="${x-6}" y="${900-h*0.35}" width="12" height="${h*0.35}" fill="#08170e"/>
      <polygon points="${x},${900-h} ${x-w},${900-h*0.34} ${x+w},${900-h*0.34}" fill="#0b2618"/>
      <polygon points="${x},${900-h*0.86} ${x-w*0.86},${900-h*0.2} ${x+w*0.86},${900-h*0.2}" fill="#0e3020"/></g>`;}).join('')}</svg>`;
  case 'montagna': return S+`<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#132043"/><stop offset="40%" stop-color="#2d4a72"/><stop offset="70%" stop-color="#6b86a8"/><stop offset="100%" stop-color="#0d1524"/></linearGradient></defs>
    <rect width="1600" height="900" fill="url(#g)"/>${stelle(70,91)}
    <circle cx="1240" cy="180" r="62" fill="#fff4d4" opacity=".85"/>
    <polygon points="0,900 340,330 620,900" fill="#1b2c48"/><polygon points="340,330 420,430 300,430" fill="#e8f0ff" opacity=".85"/>
    <polygon points="420,900 820,240 1220,900" fill="#16253d"/><polygon points="820,240 920,370 720,370" fill="#f2f7ff" opacity=".9"/>
    <polygon points="980,900 1320,420 1600,900" fill="#111d31"/><polygon points="1320,420 1380,500 1260,500" fill="#dde8f7" opacity=".8"/>
    <path d="M0 830 L1600 800 L1600 900 L0 900Z" fill="#080d17"/></svg>`;
  case 'prato': return S+`<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#2a5f9e"/><stop offset="38%" stop-color="#8dc3e8"/><stop offset="56%" stop-color="#5d9448"/><stop offset="100%" stop-color="#1d3a17"/></linearGradient></defs>
    <rect width="1600" height="900" fill="url(#g)"/>
    <circle cx="300" cy="150" r="58" fill="#fff6c8" opacity=".8"/>
    <path d="M0 480 Q 400 430 800 480 T 1600 470 L1600 900 L0 900Z" fill="#4a7d3a"/>
    <path d="M0 600 Q 500 550 1000 610 T 1600 590 L1600 900 L0 900Z" fill="#376028"/>
    ${[...Array(46)].map((_,i)=>{const r=seme(i+300);const x=(r()*1600)|0,y=(560+r()*320)|0,c=['#ffd9e8','#fff3b0','#ffffff','#e8c8ff'][(r()*4)|0];
      return `<circle cx="${x}" cy="${y}" r="${(4+r()*7).toFixed(1)}" fill="${c}" opacity="${(.5+r()*.45).toFixed(2)}"><animate attributeName="cy" values="${y};${y-4};${y}" dur="${(3+r()*3).toFixed(1)}s" repeatCount="indefinite"/></circle>`;}).join('')}</svg>`;
  default: return S+`<defs><radialGradient id="g" cx="50%" cy="34%" r="94%">
    <stop offset="0%" stop-color="#191c26"/><stop offset="100%" stop-color="#05060a"/></radialGradient></defs>
    <rect width="1600" height="900" fill="url(#g)"/></svg>`;
  }
}

/* ---------- disegno di una diapositiva ---------- */
function slideHtml(s){
  if(!s) return '';
  const sf=sfondoHtml(s.sfondo||PROI.tema);
  let c='';
  switch(s.t){
  case 'domanda':{
    /* fasi: 0 solo domanda · 1 +a · 2 +b · 3 +c · 4 risposta in verde
       oppure, senza varianti: 0 la frase · 1 la risposta */
    const lettere=['a','b','c','d'];
    const f = s.fase|0;
    if(s.solo){
      c=`${stato.imp.mostraNum&&s.n?`<div class="d-num">${esc(s.n)}</div>`:''}
         <div class="d-libro">${esc(s.libro||'')}</div>
         <div class="cont mid conEt">
           <div class="d-dom" data-fit="1">${esc(s.d)}</div>
           ${f>=1?`<div class="d-solo"><b>${esc(s.o[s.g])}</b></div>`:''}
         </div>
         ${s.v&&f>=1?`<div class="d-vers" data-vers="${esc(s.v)}">${esc(s.v)}</div>`:''}`;
      break;
    }
    const ris = f>=4;
    c=`${stato.imp.mostraNum&&s.n?`<div class="d-num">${esc(s.n)}</div>`:''}
       <div class="d-libro">${esc(s.libro||'')}</div>
       <div class="cont mid conEt">
         <div class="d-dom" data-fit="1">${esc(s.d)}</div>
         <div class="d-opz">${s.o.map((t,i)=>
           `<div class="d-op${ris&&i===s.g?' giusta':''}${(f>i)?'':' velata'}"><span class="let">${lettere[i]}</span><span class="tst">${esc(t)}</span></div>`).join('')}</div>
       </div>
       ${s.v&&ris?`<div class="d-vers" data-vers="${esc(s.v)}">${esc(s.v)}</div>`:''}`;
    break; }
  case 'versetto':
    c=`<div class="cont mid conRif"><div class="v-rif">${esc(s.rif)}</div>
       ${s.txt?`<div class="v-txt" data-cresci="1.45">${esc(s.txt)}</div>`
              :`<div class="v-manca">Il testo di questo versetto non è ancora inserito.<br>Puoi aggiungerlo dalla sezione Domande.</div>`}</div>`;
    break;
  case 'cantico-tit':
    c=`<div class="cont mid">${s.num?`<div class="c-num">${esc(s.num)}</div>`:''}
       <div class="c-tit">${esc(s.tit)}</div></div>`;
    break;
  case 'cantico-str':
    /* niente «Strofa 1» né «Ritornello»: sullo schermo si vedono solo le parole */
    c=`<div class="cont mid"><div class="c-str${s.rit?' rit':''}" data-cresci="2.6">${esc(s.testo)}</div></div>
       ${s.amen?`<div class="c-amen">Amen!</div>`:''}`;
    break;
  case 'p-tit':
    c=`<div class="cont mid">${s.occ?`<div class="p-occ">${esc(s.occ)}</div>`:''}
       <div class="p-tit">${esc(s.tit)}</div>
       ${s.rif?`<div class="p-rif">${esc(s.rif)}</div>`:''}</div>`;
    break;
  case 'p-testo':
    c=`<div class="cont mid"><div class="p-tst${s.sx?' sx':''}" data-cresci="1.8">${esc(s.testo)}</div>
       ${s.rif?`<div class="p-rif">${esc(s.rif)}</div>`:''}</div>`;
    break;
  case 'p-punti':
    c=`<div class="cont mid">${s.tit?`<div class="p-occ">${esc(s.tit)}</div>`:''}
       <div class="p-pt">${s.punti.map((p,i)=>`<div><i>${i+1}.</i><span>${esc(p)}</span></div>`).join('')}</div></div>`;
    break;
  case 'p-img':
    c=`<div class="cont mid p-figura">
       ${s.tit?`<div class="p-occ">${esc(s.tit)}</div>`:''}
       <img src="${esc(s.src||'')}" alt="">
       ${s.testo?`<div class="p-didascalia">${esc(s.testo)}</div>`:''}</div>`;
    break;
  case 'p-cit':
    c=`<div class="cont mid"><div class="p-cit">${esc(s.testo)}</div>
       ${s.rif?`<div class="p-rif">${esc(s.rif)}</div>`:''}</div>`;
    break;
  default: c=`<div class="cont mid"><div class="p-tst">${esc(s.testo||'')}</div></div>`;
  }
  return sf+c;
}

/* ---------- comandi ---------- */
function proietta(slide,tema,titolo,uniforme){
  PROI.slide=slide; PROI.i=0; PROI.tema=tema||stato.imp.sfondoProi||'notte'; PROI.titolo=titolo||'';
  if(!PROI._tienCantico) PROI.cantico=null; PROI._tienCantico=false;
  PROI.uniforme=!!uniforme; PROI.fitComune=null;
  let p=$('#proi');
  if(!p){ p=document.createElement('div'); p.id='proi'; document.body.appendChild(p); }
  p.innerHTML=`<div id="tela"></div>
    <div class="zona sx"><i>‹</i></div>
    <div class="zona dx"><i>›</i></div>
    <button id="esc" onclick="pChiudi()" title="Esci dalla proiezione">esc</button>
    <div id="comandi">
      <button class="cmd pic" onclick="pFinestra()" title="Apri la finestra per il proiettore">🖥</button>
      <button class="cmd pic" onclick="passaARegia()" title="Passa alla regia: tu leggi, lo schermo proietta">🎬</button>
      ${bottoneBase()}
      <button class="cmd" onclick="pIndietro()" title="Indietro">←</button>
      <span id="pos"></span>
      <button class="cmd gr" onclick="pAvanti()" title="Avanti">→</button>
      <button class="cmd pic" onclick="pSchermo()" title="Schermo intero">⛶</button>
      <button class="cmd pic" onclick="pChiudi()" title="Chiudi">✕</button>
    </div>`;
  p.classList.add('on'); PROI.aperta=true;
  document.documentElement.style.overflow='hidden';
  /* un solo gestore: il versetto ha la precedenza, poi destra/sinistra */
  p.onclick=e=>{
    if(e.target.closest('#comandi')) return;
    const v=e.target.closest('.d-vers');
    if(v){ mostraVersetto(v.dataset.vers); return; }
    (e.clientX < window.innerWidth*0.32) ? pIndietro() : pAvanti();
  };
  pDisegna();
  clearTimeout(PROI._t); PROI._t=setTimeout(pNascondi,4000);
  p.onmousemove=pMostra; p.ontouchstart=pMostra;
}
function pMostra(){ const c=$('#comandi'), e=$('#esc');
  if(c){ c.style.opacity='1'; clearTimeout(PROI._t); PROI._t=setTimeout(pNascondi,4000); }
  if(e) e.style.opacity='1'; }
function pNascondi(){ const c=$('#comandi'), e=$('#esc');
  if(c) c.style.opacity='0'; if(e) e.style.opacity='0'; }
function pDisegna(){
  const s=PROI.slide[PROI.i], h=slideHtml(s);
  const t=$('#tela'); if(t){ fitUniforme(); t.innerHTML=h; adattaTesto(t); }
  /* in regia il contenuto va nel riquadro piccolo, non a schermo intero */
  const rt=$('#rgTela'); if(rt) rt.innerHTML=regiaHtml(s);
  const p=$('#pos'); if(p) p.textContent=`${PROI.i+1} / ${PROI.slide.length}`;
  const rp=$('#rgPos'); if(rp) rp.textContent=`${PROI.i+1} / ${PROI.slide.length}`;
  if(PROI.canale) PROI.canale.postMessage({tipo:'slide',html:h,i:PROI.i,n:PROI.slide.length});
}
const FASI_DOMANDA=4;   /* 0 domanda · 1 a · 2 b · 3 c · 4 risposta */
function fasiDi(s){ return (s&&s.fasi!=null) ? s.fasi : FASI_DOMANDA; }
function pAvanti(){
  const s=PROI.slide[PROI.i];
  if(s&&s.t==='domanda'&&(s.fase|0)<fasiDi(s)){ s.fase=(s.fase|0)+1; pDisegna(); return; }
  if(PROI.i<PROI.slide.length-1){ PROI.i++;
    const p=PROI.slide[PROI.i]; if(p.t==='domanda') p.fase=0;
    pDisegna(); }
  else avvisa('Fine — ultima diapositiva');
}
function pIndietro(){
  const s=PROI.slide[PROI.i];
  if(s&&s.t==='domanda'&&(s.fase|0)>0){ s.fase=(s.fase|0)-1; pDisegna(); return; }
  if(PROI.i>0){ PROI.i--; const p=PROI.slide[PROI.i]; if(p.t==='domanda') p.fase=fasiDi(p); pDisegna(); }
}
function pVai(i){ if(i>=0&&i<PROI.slide.length){ PROI.i=i; pDisegna(); } }
function pChiudi(){
  const p=$('#proi'); if(p){ p.classList.remove('on'); p.innerHTML=''; }
  PROI.aperta=false; document.documentElement.style.overflow='';
  baseFerma();
  if(document.fullscreenElement) document.exitFullscreen().catch(()=>{});
  if(PROI.canale) PROI.canale.postMessage({tipo:'fine'});
}
function pSchermo(){
  const p=$('#proi');
  if(!document.fullscreenElement){ (p.requestFullscreen||p.webkitRequestFullscreen||(()=>{})).call(p); }
  else document.exitFullscreen().catch(()=>{});
}
/* finestra separata per il proiettore: niente frecce, niente comandi */
async function schermoSecondario(){
  /* Chrome ed Edge sanno dire quali schermi ci sono; Safari no */
  try{
    if(!window.getScreenDetails) return null;
    const d=await window.getScreenDetails();
    const altro=d.screens.find(s=>!s.isPrimary) || null;
    return altro;
  }catch(e){ return null; }
}
async function pFinestra(auto){
  const css=$$('style').map(s=>s.textContent).join('\n');
  const sc=await schermoSecondario();
  const f = sc ? `left=${sc.availLeft},top=${sc.availTop},width=${sc.availWidth},height=${sc.availHeight}`
              : 'width=1280,height=720';
  const w=window.open('','proiettore_sdarm',f);
  if(!w){ if(!auto) avvisa('Il browser ha bloccato la finestra. Consenti i popup.','no'); return; }
  PROI.fin=w;
  w.document.open();
  w.document.write(`<!doctype html><html lang="it"><head><meta charset="utf-8">
    <title>Proiezione — ${esc(PROI.titolo||'SDARM')}</title><style>${css}
    html,body{background:#05070c;margin:0;overflow:hidden;cursor:none}
    #proi{display:flex!important;position:fixed;inset:0}
    </style></head><body class="proiettore">
    <div id="proi" class="on"><div id="tela"></div></div>
    <script>
      const c=new BroadcastChannel('proiezione_sdarm');
      c.onmessage=e=>{ const m=e.data;
        if(m.tipo==='slide') document.getElementById('tela').innerHTML=m.html;
        if(m.tipo==='fine') window.close(); };
      c.postMessage({tipo:'pronto'});
      document.addEventListener('keydown',ev=>{ if(ev.key==='Escape') window.close(); });
    <\/script></body></html>`);
  w.document.close();
  setTimeout(()=>{
    pDisegna();
    if(sc){ try{ w.document.documentElement.requestFullscreen({screen:sc}); }catch(e){} 
      avvisa('Proietto sul secondo schermo','ok'); }
    else avvisa('Finestra proiettore aperta — trascinala sullo schermo grande','ok');
  },400);
}
if(PROI.canale) PROI.canale.onmessage=e=>{ if(e.data&&e.data.tipo==='pronto') pDisegna(); };

/* tastiera */
document.addEventListener('keydown',e=>{
  if(!PROI.aperta) return;
  if(window.PR_MOD) return;                       /* sto scrivendo nel foglio */
  const a=document.activeElement;
  if(a && (a.isContentEditable||/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName))) return;
  if(e.key==='ArrowRight'||e.key===' '||e.key==='PageDown'){ e.preventDefault(); pAvanti(); }
  else if(e.key==='ArrowLeft'||e.key==='PageUp'){ e.preventDefault(); pIndietro(); }
  else if(e.key==='Escape'){ pChiudi(); }
  else if(e.key==='f'||e.key==='F'){ pSchermo(); }
  else if(e.key==='Home'){ pVai(0); }
  else if(e.key==='End'){ pVai(PROI.slide.length-1); }
});

/* ---------- adatta il testo allo schermo, ogni volta ---------- */
/* Per i cantici uso una misura sola per tutto l'inno, così le strofe
   restano tutte della stessa grandezza e la diapositiva è uniforme. */
function fitUniforme(){
  if(!PROI.uniforme || PROI.fitComune!=null) return;
  const t=$('#tela'); if(!t) return;
  let peggiore=null, max=-1;
  PROI.slide.forEach(s=>{
    if(s.t!=='cantico-str') return;
    const righe=(s.testo||'').split('\n');
    const p=righe.length*60 + Math.max(...righe.map(r=>r.length),0)*3;
    if(p>max){ max=p; peggiore=s; }
  });
  if(!peggiore){ PROI.fitComune=1; return; }
  const prima=t.innerHTML;
  t.innerHTML=slideHtml(peggiore);
  adattaTesto(t,true);
  PROI.fitComune=parseFloat(t.style.getPropertyValue('--fit'))||1;
  t.innerHTML=prima;
}
function adattaTesto(t,misura){
  const c=t.querySelector('.cont'); if(!c) return;
  const set=v=>t.style.setProperty('--fit',(+v).toFixed(3));
  /* con il testo centrato lo scrollHeight non basta: misuro davvero i figli */
  const entra=()=>{
    const r=c.getBoundingClientRect(), st=getComputedStyle(c);
    /* l'area buona è dentro ai margini: lì non arrivano né il nome del libro né il versetto */
    const A={ su:r.top+parseFloat(st.paddingTop), giu:r.bottom-parseFloat(st.paddingBottom),
              sx:r.left+parseFloat(st.paddingLeft), dx:r.right-parseFloat(st.paddingRight) };
    let su=Infinity,giu=-Infinity,sx=Infinity,dx=-Infinity;
    for(const el of c.children){
      const b=el.getBoundingClientRect();
      if(!b.height) continue;
      su=Math.min(su,b.top); giu=Math.max(giu,b.bottom);
      sx=Math.min(sx,b.left); dx=Math.max(dx,b.right);
    }
    if(su===Infinity) return true;
    if(!(su>=A.su-1 && giu<=A.giu+1 && sx>=A.sx-1 && dx<=A.dx+1)) return false;
    /* nei cantici ogni verso deve stare su una riga sola, se no le strofe
       vengono storte: se qualcuno va a capo, il testo è ancora troppo grande */
    const cs=c.querySelector('.c-str');
    if(cs){
      const lh=parseFloat(getComputedStyle(cs).lineHeight)||0;
      if(lh>0){
        const attese=(cs.textContent.match(/\n/g)||[]).length+1;
        if(Math.round(cs.scrollHeight/lh) > attese) return false;
      }
    }
    return true;
  };
  if(!misura && PROI.fitComune!=null && t.querySelector('.c-str')){ set(PROI.fitComune); return; }
  set(1);
  if(!c.clientHeight) return;
  /* le strofe dei cantici e i testi crescono fino a riempire lo schermo */
  const cr=t.querySelector('[data-cresci]');
  if(cr){
    const max=parseFloat(cr.getAttribute('data-cresci'))||3.2;
    let g=1;
    for(let k=0;k<40;k++){ const p=g+0.06; if(p>max) break; set(p); if(!entra()){ set(g); break; } g=p; }
  }
  /* poi rimpicciolisce finché non ci sta */
  let s=parseFloat(getComputedStyle(t).getPropertyValue('--fit'))||1;
  for(let k=0;k<40 && !entra(); k++){ s-=0.045; if(s<0.3){ set(0.3); break; } set(s); }
}

/* ================= REGIA =================
   Tu leggi il foglio della predica sul tuo schermo; in alto a destra un riquadro
   piccolo ti mostra che cosa stai proiettando, con le due frecce per andare avanti
   e indietro. Nella finestra proiettata non si vede nulla di tutto questo. */
function apriRegia(slide,tema,titolo){
  PROI.slide=slide; PROI.i=0; PROI.tema=tema||'notte'; PROI.titolo=titolo||'';
  if(!PROI._tienCantico) PROI.cantico=null; PROI._tienCantico=false;
  PROI.uniforme=false; PROI.fitComune=null; PROI.aperta=true; PROI.regia=true;
  let r=$('#regia');
  if(!r){ r=document.createElement('div'); r.id='regia'; document.body.appendChild(r); }
  r.innerHTML=`
    <div class="rg-cap" id="rgCap">
      <span class="rg-pt">▦</span><b>Regia</b>
      <span style="flex:1"></span>
      ${bottoneBase('rg-b')}
      <button class="rg-b" onclick="pFinestra()" title="Apri la finestra per il proiettore">🖥</button>
      <button class="rg-b" onclick="rgSchermo()" title="Schermo intero">⛶</button>
      <button class="rg-b" onclick="chiudiRegia()" title="Chiudi">✕</button>
    </div>
    <div class="rg-mini"><div id="rgTela"></div></div>
    <div class="rg-pie">
      <button class="rg-f" onclick="pIndietro()" title="Indietro">←</button>
      <span id="rgPos"></span>
      <button class="rg-f gr" onclick="pAvanti()" title="Avanti">→</button>
    </div>`;
  r.classList.add('on');
  rgTrascina(r);
  pDisegna();
  /* la finestra del proiettore si apre da sola e va sul secondo schermo se c'è */
  setTimeout(()=>pFinestra(true),150);
}
/* ---------- la base musicale del cantico, in proiezione ----------
   Il pulsante c'è solo se quel cantico ha la sua base. Non parte mai da
   sola quando mandi la presentazione: suona solo se lo tocchi tu. */
function bottoneBase(classe){
  if(!PROI.cantico) return '';
  const c=(typeof trovaCantico==='function') ? trovaCantico(PROI.cantico) : null;
  if(!c || !haMusica(c)) return '';
  return `<button class="${classe||'cmd pic'} base-mu" id="btBase" onclick="basePlay()"
    title="Base musicale — parte solo se la tocchi tu">▶︎♪</button>`;
}
let BASE_MU=null;
async function basePlay(){
  const c=trovaCantico(PROI.cantico); if(!c) return;
  const b=$('#btBase');
  if(BASE_MU && !BASE_MU.paused){ BASE_MU.pause(); if(b) b.textContent='▶︎♪'; return; }
  if(!BASE_MU || BASE_MU.dataset.can!==c.i){
    const url=await urlMusica(c);
    if(!url){ avvisa('Per questo cantico non c\'è la base','no'); return; }
    if(BASE_MU) BASE_MU.pause();
    BASE_MU=new Audio(url); BASE_MU.dataset.can=c.i;
    BASE_MU.onended=()=>{ const x=$('#btBase'); if(x) x.textContent='▶︎♪'; };
    BASE_MU.onerror=()=>avvisa('La base non si sente: il file non c\'è più','no');
  }
  try{ await BASE_MU.play(); if(b) b.textContent='⏸'; }
  catch(e){ avvisa('Non riesco a far partire la base','no'); }
}
function baseFerma(){ if(BASE_MU){ BASE_MU.pause(); BASE_MU=null; } }
function chiudiRegia(){
  baseFerma();
  const r=$('#regia'); if(r){ r.classList.remove('on'); r.innerHTML=''; }
  PROI.regia=false; PROI.aperta=false;
  if(PROI.canale) PROI.canale.postMessage({tipo:'fine'});
}
function passaARegia(){
  const s=PROI.slide, i=PROI.i, tm=PROI.tema, ti=PROI.titolo, lg=PROI.lingua, ca=PROI.cantico;
  pChiudi();
  PROI.cantico=ca; PROI._tienCantico=true;
  apriRegia(s,tm,ti); PROI.lingua=lg; PROI.i=i; pDisegna();
}
function rgSchermo(){
  /* passa dalla regia allo schermo intero su questo schermo */
  const s=PROI.slide, i=PROI.i, t=PROI.tema, ti=PROI.titolo, ca=PROI.cantico;
  chiudiRegia();
  PROI.cantico=ca; PROI._tienCantico=true;
  proietta(s,t,ti); PROI.i=i; pDisegna();
}
function rgTrascina(r){
  const cap=$('#rgCap',r); if(!cap) return;
  let dx=0,dy=0,giu=false;
  const inizio=e=>{ giu=true; const t=e.touches?e.touches[0]:e;
    const b=r.getBoundingClientRect(); dx=t.clientX-b.left; dy=t.clientY-b.top;
    r.style.right='auto'; e.preventDefault(); };
  const muovi=e=>{ if(!giu) return; const t=e.touches?e.touches[0]:e;
    r.style.left=Math.max(4,Math.min(innerWidth-r.offsetWidth-4,t.clientX-dx))+'px';
    r.style.top =Math.max(4,Math.min(innerHeight-r.offsetHeight-4,t.clientY-dy))+'px'; };
  const fine=()=>{ giu=false; };
  cap.onmousedown=inizio; document.addEventListener('mousemove',muovi); document.addEventListener('mouseup',fine);
  cap.ontouchstart=inizio; document.addEventListener('touchmove',muovi,{passive:false}); document.addEventListener('touchend',fine);
}
/* anteprima piccola: il testo della diapositiva sullo sfondo scelto */
function regiaHtml(s){
  if(!s) return '';
  const sf=sfondoHtml(s.sfondo||PROI.tema);
  let t='',cl='';
  if(s.t==='p-tit'){ t=s.tit; cl='mt'; }
  else if(s.t==='p-cit'){ t='“'+s.testo+'”'+(s.rif?'\n'+s.rif:''); cl='mc'; }
  else if(s.t==='p-punti'){ t=s.punti.map((x,i)=>(i+1)+'. '+x).join('\n'); cl='mp'; }
  else if(s.t==='cantico-str'||s.t==='cantico-tit'){ t=s.testo||s.tit||''; cl='mp'; }
  else if(s.t==='versetto'){ t=s.rif+'\n'+(s.txt||''); cl='mc'; }
  else if(s.t==='domanda'){ t=s.d+'\n'+s.o.map((o,i)=>'abc'[i]+') '+o).join('\n'); cl='mp'; }
  else t=s.testo||'';
  return sf+`<div class="rg-tx ${cl}">${esc(t)}</div>`;
}
