
// --- Service Worker para GitHub Pages (sub-path /shotcrete-calc/) ---
// Basado en tu implementación previa (navigate handler y cache-first). [1](https://volcanperu-my.sharepoint.com/personal/claura_volcan_com_pe/Documents/Archivos%20de%20Microsoft%C2%A0Copilot%20Chat/index.html)

const REPO = '/shotcrete-calc';       // sub-path EXACTO del repo en GitHub Pages
const CACHE_NAME = 'sc-v19';           // INCREMENTA cuando cambies cualquier asset precacheado

// Precache: añade aquí TODO lo que deba estar disponible offline desde el primer uso
const ASSETS = [
  `${REPO}/`,
  `${REPO}/index.html`,
  `${REPO}/manifest.json`,
  `${REPO}/icon-192.png`,
  `${REPO}/icon-512.png`
];

// 1) Instalar y precachear
self.addEventListener('install', (event) => {
  // Hacemos que el SW pase a 'activated' sin esperar a cerrar páginas antiguas
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

// 2) Activar y limpiar caches antiguos
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : Promise.resolve()))
    );
    // Tomar control de los clientes inmediatamente
    await self.clients.claim();
  })());
});

// 3) Fetch: manejar navegación y recursos
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // --- Navegación (abrir/recargar la app): servir index.html del caché ---
  // Esto evita pantalla en blanco sin red y hace que la app funcione 100% offline
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const cachedIndex = await cache.match(`${REPO}/index.html`);
      if (cachedIndex) return cachedIndex;
      try {
        // Primera carga con red disponible
        return await fetch(req);
      } catch {
        // Fallback mínimo si es la PRIMERA vez sin conexión
        return new Response(
          `
            <!doctype html><meta charset="utf-8">
            <title>Offline</title>
            <style>
              body{font-family:system-ui,Segoe UI,Roboto,Arial,sans-serif;padding:2rem}
              h1{margin:0 0 .5rem} p{color:#444}
            </style>
            <h1>Offline</h1>
            <p>Abre la app con internet al menos una vez para usarla sin conexión.</p>
          `,
          { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        );
      }
    })());
    return;
  }

  // --- Recursos estáticos y peticiones en general: cache-first con fallback a red ---
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((resp) => {
          // Opcional: cachear en runtime archivos no incluidos en precache (stale-while-revalidate simple)
          // Evita cachear respuestas no válidas (opaque, error, etc.)
          const okToCache = resp && resp.status === 200 && resp.type === 'basic';
          if (okToCache) {
            const respClone = resp.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, respClone));
          }
          return resp;
        })
        .catch(() => cached); // si falla la red, devolvemos lo que hubiese en caché
    })
  );
});
``
