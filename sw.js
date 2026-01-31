// --- Service Worker para GitHub Pages (sub-path /shotcrete-calc/) ---
const REPO = '/shotcrete-calc';
const CACHE_NAME = 'sc-v46';

const ASSETS = [
  `${REPO}/`,
  `${REPO}/index.html`,
  `${REPO}/manifest.json`,
  `${REPO}/icon-192.png`,
  `${REPO}/icon-512.png`
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : Promise.resolve()))
    );
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Navegaciones: network-first con fallback a caché
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(CACHE_NAME);
        cache.put(`${REPO}/index.html`, fresh.clone());
        return fresh;
      } catch {
        const cache = await caches.open(CACHE_NAME);
        return (await cache.match(`${REPO}/index.html`)) || new Response(
          `<!doctype html>
          <html lang="es">
            <head>
              <meta charset="utf-8"/>
              <meta name="viewport" content="width=device-width,initial-scale=1"/>
              <title>Offline</title>
              <style>
                body{font-family:system-ui;margin:0;display:grid;place-items:center;height:100vh;padding:24px}
                .card{max-width:520px;border:1px solid #ddd;border-radius:14px;padding:18px}
                h1{margin:0 0 8px}
                p{margin:0;color:#555}
              </style>
            </head>
            <body>
              <div class="card">
                <h1>Sin conexión</h1>
                <p>La app está offline. Vuelve a intentar cuando tengas internet.</p>
              </div>
            </body>
          </html>`,
          { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        );
      }
    })());
    return;
  }

  // Recursos: cache-first con fallback a red + cacheo runtime
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
