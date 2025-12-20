// --- Service Worker para Shotcrete Calc (offline) ---
const CACHE_NAME = 'sc-v5'; // sube el número cuando cambies algo
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './imagen1.png'
];

// Instala y precachea assets críticos
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

// Activa y limpia caches antiguos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : Promise.resolve()))
      );
      await self.clients.claim();
    })()
  );
});

// Estrategia: cache-first con fallback a red
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // 1) Navegación (entrada a la app / recarga de página)
  if (req.mode === 'navigate') {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        const cachedIndex = await cache.match('./index.html');
        if (cachedIndex) return cachedIndex;
        // Si no está en caché (primera vez sin conexión), intenta red
        try {
          const fromNet = await fetch(req);
          return fromNet;
        } catch (err) {
          // Fallback: si quieres, retorna una página offline propia
          return new Response(
            '<!DOCTYPE html><html lang="es"><meta charset="utf-8"><title>Offline</title><body><h2>Sin conexión</h2><p>Abre la app con internet al menos una vez para usarla offline.</p></body></html>',
            { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          );
        }
      })()
    );
    return;
  }

  // 2) Recursos (img, manifest, etc.) — cache first
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req).catch(() => cached))
  );
});
