// --- Service Worker (completo) para GitHub Pages ---
const REPO = '/shotcrete-calc';
const CACHE_NAME = 'sc-v8';
const ASSETS = [
  `${REPO}/`,
  `${REPO}/index.html`,
  `${REPO}/manifest.json`,
  `${REPO}/icon-192.png`
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => (k !== CACHE_NAME ? caches.delete(k) : Promise.resolve())));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const cachedIndex = await cache.match(`${REPO}/index.html`);
      if (cachedIndex) return cachedIndex;
      try { return await fetch(req); } 
      catch {
        return new Response(
          '<!DOCTYPE html><meta charset="utf-8"><title>Offline</title><body><h2>Sin conexión</h2><p>Abre la app con internet al menos una vez para usarla offline.</p></body>',
          { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        );
      }
    })());
    return;
  }

  event.respondWith(caches.match(req).then(r => r || fetch(req).catch(() => r)));
});

