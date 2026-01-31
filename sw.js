// --- Service Worker para GitHub Pages (sub-path /shotcrete-calc/) ---
const REPO = '/shotcrete-calc';
const CACHE_NAME = 'sc-v60';

const ASSETS = [
  `${REPO}/`,
  `${REPO}/index.html`,
  `${REPO}/manifest.json`,
  `${REPO}/icon-192.png`,
  `${REPO}/icon-512.png`,
  `${REPO}/sw.js`
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
      keys.filter(k => k.startsWith('sc-') && k !== CACHE_NAME).map(k => caches.delete(k))
    );
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Navegaciones: network-first con fallback fuerte a caché
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        const fresh = await fetch(req);
        cache.put(`${REPO}/index.html`, fresh.clone());
        return fresh;
      } catch {
        const cachedNav = await cache.match(req, { ignoreSearch: true });
        if (cachedNav) return cachedNav;

        const cachedIndex = await cache.match(`${REPO}/index.html`, { ignoreSearch: true });
        if (cachedIndex) return cachedIndex;

        const cachedRoot = await cache.match(`${REPO}/`, { ignoreSearch: true });
        if (cachedRoot) return cachedRoot;

        return new Response(
          `<!doctype html><html lang="es"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Offline</title></head>
           <body style="font-family:system-ui;display:grid;place-items:center;height:100vh;margin:0">Sin conexión</body></html>`,
          { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        );
      }
    })());
    return;
  }

  // Recursos: cache-first + runtime caching
  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then((cached) => {
      if (cached) return cached;

      return fetch(req).then((resp) => {
        if (resp && resp.status === 200) {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
        }
        return resp;
      }).catch(() => cached);
    })
  );
});
