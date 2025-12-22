
// --- Service Worker para GitHub Pages (sub-path /shotcrete-calc/) ---
const REPO = '/shotcrete-calc';
const CACHE_NAME = 'sc-v25'; // ← sube versión cuando cambies assets precacheados

// Precache mínimo para funcionar offline
const ASSETS = [
  `${REPO}/`,
  `${REPO}/index.html`,
  `${REPO}/manifest.json`,
  `${REPO}/icon-192.png`,
  `${REPO}/icon-512.png`
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : Promise.resolve())));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Navegación: servir index.html del caché (funciona offline)
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const cachedIndex = await cache.match(`${REPO}/index.html`);
      if (cachedIndex) return cachedIndex;
      try { return await fetch(req); }
      catch {
        return new Response(
          `<!doctype html><meta charset="utf-8"><title>Offline</title>
           <style>body{font-family:system-ui,Segoe UI,Roboto,Arial,sans-serif;padding:2rem}
           h1{margin:0 0 .5rem}</style>
           <h1>Sin conexión</h1><p>Abre la app con Internet al menos una vez.</p>`,
          { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        );
      }
    })());
    return;
  }

  // Recursos: cache-first con fallback a red + cacheo en runtime
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((resp) => {
          const okToCache = resp && resp.status === 200 && resp.type === 'basic';
          if (okToCache) {
            const respClone = resp.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, respClone));
          }
          return resp;
        })
        .catch(() => cached);
    })
  );
});

