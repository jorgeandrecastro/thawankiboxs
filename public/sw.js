const CACHE_NAME = 'mes-courses-v1.2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/privacy.html',
  // Vite injecte les JS/CSS dans le build → on les cache dynamiquement
];

// Installation
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS_TO_CACHE).catch(() => {});
    })
  );
  self.skipWaiting();
});

// Activation - Nettoie les anciens caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch - Stratégie "Cache First, then Network"
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  
  e.respondWith(
    caches.match(e.request).then(cached => {
      // Si dans le cache → renvoie
      if (cached) return cached;

      // Sinon → réseau + mise en cache
      return fetch(e.request).then(response => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(e.request, responseToCache).catch(() => {});
        });
        return response;
      }).catch(() => {
        // Offline fallback
        if (e.request.destination === 'document') {
          return caches.match('/index.html');
        }
      });
    })
  );
});