/* Il guardiano della web app.
   Alla prima apertura si tiene da parte tutto il programma; dopo si apre
   subito, anche senza internet. Quando metto una versione nuova, la scarica
   di nascosto e alla prossima apertura ti dà quella. */
const CASSETTO='prediche-domande-8.1.6';

self.addEventListener('install', e=>{
  self.skipWaiting();
  e.waitUntil(caches.open(CASSETTO).then(c=>c.addAll(['./','./index.html','./manifest.json'])).catch(()=>{}));
});

self.addEventListener('activate', e=>{
  e.waitUntil(caches.keys().then(k=>Promise.all(
    k.filter(x=>x!==CASSETTO).map(x=>caches.delete(x))
  )).then(()=>self.clients.claim()));
});

/* Il controllo «c'è una versione nuova?» non riscarica più tutto il programma (~20 MB) a ogni apertura:
   al sito mando l'etichetta (ETag o data) della copia che ho già nel cassetto. Se non è cambiata risponde
   «304, uguale» (poche decine di byte) e non si scrive niente; se è cambiata arriva la pagina nuova e la
   metto nel cassetto per la prossima apertura. Se il sito non dà nessuna etichetta, si fa come prima. */
function aggiorna(richiesta,tenuto){
  const h=new Headers();
  if(tenuto){
    const et=tenuto.headers.get('etag'), dt=tenuto.headers.get('last-modified');
    if(et) h.set('If-None-Match',et); else if(dt) h.set('If-Modified-Since',dt);
  }
  const conEtichetta=h.has('If-None-Match')||h.has('If-Modified-Since');
  const dalla_rete = conEtichetta ? fetch(richiesta.url,{headers:h,credentials:'same-origin'}) : fetch(richiesta);
  return dalla_rete.then(risp=>{
    if(risp && risp.status===304) return tenuto;          /* uguale a quella che ho: niente da fare */
    if(risp && risp.ok){
      const copia=risp.clone();
      caches.open(CASSETTO).then(c=>c.put(richiesta,copia)).catch(()=>{});
    }
    return risp;
  }).catch(()=>tenuto);
}

self.addEventListener('fetch', e=>{
  if(e.request.method!=='GET') return;
  const u=new URL(e.request.url);
  if(u.origin!==location.origin) return;
  e.respondWith(
    caches.match(e.request,{ignoreSearch:true}).then(tenuto=>{
      const dalla_rete = aggiorna(e.request,tenuto);
      return tenuto || dalla_rete;
    })
  );
});
