
// --- Service Worker para Shotcrete Calc (modo offline) ---
const CACHE_NAME = 'sc-v6'; // sube este número cuando cambies algo
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './imagen1.png'
];

// 1) Instalar: precachea assets críticos
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

// 2) Activar: limpia caches antiguos y toma control
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : Promise.resolve())));
      await self.clients.claim();
    })()
  );
});

// 3) Fetch: soporte de navegación offline + cache-first
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Navegación (abrir/recargar la app)
  if (req.mode === 'navigate') {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        const cachedIndex = await cache.match('./index.html');
        if (cachedIndex) return cachedIndex;
        try {
          const fromNet = await fetch(req);
          return fromNet;
        } catch (err) {
          // Fallback mínimo si nunca se abrió online
          return new Response(
            '<!DOCTYPE html><html lang="es"><meta charset="utf-8"><title>Offline</title><body><h2>Sin conexión</h2><p>Abre la app con internet al menos una vez para usarla offline.</p></body></html>',
            { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          );
        }
      })()
    );
    return;
  }

  // Recursos (img, manifest, etc.): cache-first con fallback a red
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req).catch(() => cached))
  );
});
