// --- Service Worker para GitHub Pages (sub-path /shotcrete-calc/) ---
const REPO = '/shotcrete-calc';            // nombre exacto del repo
const CACHE_NAME = 'sc-v10';                // cambia a sc-v9 si actualizas el SW
const ASSETS = [
  `${REPO}/`,
  `${REPO}/index.html`
];

// 1) Instalar y precachear
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
});

// 2) Activar y limpiar caches antiguos
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => (k !== CACHE_NAME ? caches.delete(k) : Promise.resolve())));
    await self.clients.claim();
  })());
});

// 3) Fetch: manejar navegación (refresh/abrir app) y recursos
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Navegación: sirve index.html del caché para evitar pantalla en blanco sin red
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const cachedIndex = await cache.match(`${REPO}/index.html`);
      if (cachedIndex) return cachedIndex;
      try { return await fetch(req); } 
      catch {
        // Fallback mínimo si es la primera vez sin conexión
        return new Response(
          '<!DOCTYPE html><meta charset="utf-8"><title>Offline</title><body><h2>Sin conexión</h2><p>Abre la app con internet al menos una vez para usarla offline.</p></body>',
          { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        );
      }
    })());
    return;
  }

  // Recursos: cache-first con fallback a red
  event.respondWith(
    caches.match(req).then(r => r || fetch(req).catch(() => r))
  );
});
