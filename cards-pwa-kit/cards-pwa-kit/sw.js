/* Service worker de Cards.
   Volontairement minimal : il ne mémorise AUCUNE page, AUCUNE donnée de compte et AUCUNE
   réponse du serveur. Il garde seulement une page « pas de connexion » à afficher hors ligne.
   Changez CACHE (v2, v3…) si vous modifiez offline.html. */
const CACHE = 'cards-pwa-v1';
const OFFLINE = '/offline.html';

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.add(OFFLINE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  // Seules les ouvertures de page sont concernées ; tout le reste passe directement au réseau.
  if (req.method !== 'GET' || req.mode !== 'navigate') return;
  e.respondWith(fetch(req).catch(() => caches.match(OFFLINE)));
});
