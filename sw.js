// Service Worker: network-first für die App-Dateien (immer aktuell, offline aus dem Cache).
// Open-Food-Facts-Anfragen werden nicht gecacht.
const CACHE = 'foodbitch-v2';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.hostname.includes('openfoodfacts')) return;

  // Eigene Dateien immer beim Server nachprüfen (GitHub Pages cacht sonst 10 Minuten).
  const sameOrigin = url.origin === self.location.origin;
  e.respondWith(
    fetch(sameOrigin ? new Request(req, { cache: 'no-cache' }) : req)
      .then((res) => {
        if (res.ok || res.type === 'opaque') {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || caches.match('./index.html')))
  );
});
