/* Il guardiano della web app.
   Alla prima apertura si tiene da parte tutto il programma; dopo si apre
   subito, anche senza internet. Quando metto una versione nuova, la scarica
   di nascosto e alla prossima apertura ti dà quella. */
const CASSETTO='prediche-domande-8.5.0';
/* la pagina del programma: aprire «…/» o «…/index.html» è la stessa cosa. Prima le due copie venivano scaricate tutte e due
   (25 MB × 2 a ogni versione nuova): su un iPad con poca memoria o poca rete l'aggiornamento non finiva mai e il programma
   si ricaricava più volte. Ora la pagina si scarica una volta sola e serve per tutti e due gli indirizzi. */
const PAGINA=new URL('index.html',self.registration.scope).href;

self.addEventListener('install', e=>{
  self.skipWaiting();
  /* cache:'reload' = dal sito, non da una copia vecchia tenuta dal browser: così «OK» nella finestrina
     dell'aggiornamento riapre davvero la versione nuova */
  e.waitUntil(caches.open(CASSETTO).then(c=>c.addAll([PAGINA,'./manifest.json'].map(u=>new Request(u,{cache:'reload'})))).catch(()=>{}));
});

self.addEventListener('activate', e=>{
  e.waitUntil(caches.keys().then(k=>Promise.all(
    k.filter(x=>x!==CASSETTO).map(x=>caches.delete(x))
  )).then(()=>self.clients.claim()));
});

/* il programma può chiedere al guardiano «che versione sei?»: serve per aspettare, prima di ricaricare, che quella nuova sia pronta */
self.addEventListener('message', e=>{
  if(e.data==='ver' && e.ports && e.ports[0]) e.ports[0].postMessage({ver:'8.5.0'});
});

/* Il controllo «c'è una versione nuova?» non riscarica più tutto il programma (~25 MB) a ogni apertura:
   al sito mando l'etichetta (ETag o data) della copia che ho già nel cassetto. Se non è cambiata risponde
   «304, uguale» (poche decine di byte) e non si scrive niente; se è cambiata arriva la pagina nuova e la
   metto nel cassetto per la prossima apertura. Se il sito non dà nessuna etichetta, si fa come prima. */
function aggiorna(chiave,tenuto){
  const url=typeof chiave==='string' ? chiave : chiave.url;
  const h=new Headers();
  if(tenuto){
    const et=tenuto.headers.get('etag'), dt=tenuto.headers.get('last-modified');
    if(et) h.set('If-None-Match',et); else if(dt) h.set('If-Modified-Since',dt);
  }
  const conEtichetta=h.has('If-None-Match')||h.has('If-Modified-Since');
  const dalla_rete = conEtichetta ? fetch(url,{headers:h,credentials:'same-origin'}) : fetch(typeof chiave==='string'?chiave:chiave);
  return dalla_rete.then(risp=>{
    if(risp && risp.status===304) return tenuto;          /* uguale a quella che ho: niente da fare */
    if(risp && risp.ok){
      const copia=risp.clone();
      caches.open(CASSETTO).then(c=>c.put(chiave,copia)).catch(()=>{});
    }
    return risp;
  }).catch(()=>tenuto);
}

self.addEventListener('fetch', e=>{
  if(e.request.method!=='GET') return;
  const u=new URL(e.request.url);
  if(u.origin!==location.origin) return;
  /* il numero dell'ultima versione si chiede sempre al sito, mai alla copia nel cassetto */
  if(/\/versione\.json$/.test(u.pathname)) return;
  /* la pagina del programma, comunque la si apra, è sempre la stessa copia */
  const chiave=(e.request.mode==='navigate' || u.pathname.endsWith('/')) ? PAGINA : e.request;
  e.respondWith(
    /* si guarda solo nel cassetto di QUESTA versione (prima si guardava in tutti: se ne restava uno vecchio, rispondeva lui) */
    caches.open(CASSETTO).then(c=>c.match(chiave,{ignoreSearch:true})).then(tenuto=>{
      const dalla_rete = aggiorna(chiave,tenuto);
      return tenuto || dalla_rete;
    })
  );
});
