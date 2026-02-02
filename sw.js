// --- Service Worker para GitHub Pages (sub-path /shotcrete-calc/) ---
const REPO = '/shotcrete-calc';
const CACHE_NAME = 'sc-v63';

const ASSETS = [
  `${REPO}/`,
  `${REPO}/index.html`,
  `${REPO}/manifest.json`,
  `${REPO}/icon-192.png`,
  `${REPO}/icon-512.png`,
  `${REPO}/sw.js`,
];

// Helper: cachea lo que se pueda (no rompe si falta un archivo)
async function cacheBestEffort(cache, urls) {
  await Promise.all(
    urls.map(async (url) => {
      try {
        const res = await fetch(url, { cache: 'no-cache' });
        if (res.ok) await cache.put(url, res);
      } catch (_) {
        // Ignorar fallos individuales para no romper la instalación
      }
    })
  );
}

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cacheBestEffort(cache, ASSETS);
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k.startsWith('sc-') && k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Solo controlamos nuestro scope
  if (!url.pathname.startsWith(REPO)) return;

  // Navegaciones: network-first con fallback a cache (HTML)
  if (req.mode === 'navigate') {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        try {
          const fresh = await fetch(req);
          cache.put(`${REPO}/index.html`, fresh.clone());
          return fresh;
        } catch (_) {
          const cachedNav = await cache.match(req, { ignoreSearch: true });
          if (cachedNav) return cachedNav;

          const cachedIndex = await cache.match(`${REPO}/index.html`, { ignoreSearch: true });
          if (cachedIndex) return cachedIndex;

          const cachedRoot = await cache.match(`${REPO}/`, { ignoreSearch: true });
          if (cachedRoot) return cachedRoot;

          return new Response(
            `<h1>Offline</h1><p>Sin conexión.</p>`,
            { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          );
        }
      })()
    );
    return;
  }

  // Assets: cache-first
  event.respondWith(
    (async () => {
      const cached = await caches.match(req);
      if (cached) return cached;

      try {
        const resp = await fetch(req);
        if (resp && resp.ok) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(req, resp.clone());
        }
        return resp;
      } catch (_) {
        return cached;
      }
    })()
  );
});
``
