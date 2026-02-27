const CACHE_NAME = 'retirement-sim-v1';
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/src/index.js',
  '/src/data/models.js',
  '/src/data/sampleData.js',
  '/src/engine/dateUtils.js',
  '/src/engine/tenure.js',
  '/src/engine/averageWage.js',
  '/src/engine/retirementPay.js',
  '/src/engine/scenarioRunner.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          const copied = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copied));
          return response;
        })
        .catch(() => caches.match('/index.html'));
    })
  );
});
