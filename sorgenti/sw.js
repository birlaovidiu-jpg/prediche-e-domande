/* Il guardiano della web app.
   Alla prima apertura si tiene da parte tutto il programma; dopo si apre
   subito, anche senza internet. Quando metto una versione nuova, la scarica
   di nascosto e alla prossima apertura ti dà quella. */
const CASSETTO='prediche-domande-__VER__';

self.addEventListener('install', e=>{
  self.skipWaiting();
  e.waitUntil(caches.open(CASSETTO).then(c=>c.addAll(['./','./index.html','./manifest.json'])).catch(()=>{}));
});

self.addEventListener('activate', e=>{
  e.waitUntil(caches.keys().then(k=>Promise.all(
    k.filter(x=>x!==CASSETTO).map(x=>caches.delete(x))
  )).then(()=>self.clients.claim()));
});

self.addEventListener('fetch', e=>{
  if(e.request.method!=='GET') return;
  const u=new URL(e.request.url);
  if(u.origin!==location.origin) return;
  e.respondWith(
    caches.match(e.request,{ignoreSearch:true}).then(tenuto=>{
      const dalla_rete = fetch(e.request).then(risp=>{
        if(risp && risp.ok){
          const copia=risp.clone();
          caches.open(CASSETTO).then(c=>c.put(e.request,copia)).catch(()=>{});
        }
        return risp;
      }).catch(()=>tenuto);
      return tenuto || dalla_rete;
    })
  );
});
