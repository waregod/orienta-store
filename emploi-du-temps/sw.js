/* Service worker : l'appli s'ouvre même sans réseau.
   Changez CACHE (v2, v3…) à chaque mise à jour des fichiers. */
const CACHE = 'edt-mobile-v1';
const SHELL = [
  './', './index.html', './css/style.css', './css/fonts.css',
  './js/data.js', './js/store.js', './js/app.js',
  './manifest.webmanifest',
  './fonts/bricolage-grotesque-latin-wght-normal.woff2', './fonts/bricolage-grotesque-latin-ext-wght-normal.woff2',
  './fonts/instrument-sans-latin-wght-normal.woff2', './fonts/instrument-sans-latin-ext-wght-normal.woff2',
  './icons/icon.svg', './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png', './icons/apple-touch-icon.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    caches.match(req).then((cached) => {
      const net = fetch(req).then((res) => {
        if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
        return res;
      }).catch(() => cached || (req.mode === 'navigate' ? caches.match('./index.html') : undefined));
      return cached || net;
    })
  );
});
