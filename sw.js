var CACHE_NAME = 'cp-ops-v2';

var PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './js/storage.js',
  './js/ui.js',
  './js/disclaimer.js',
  './js/lock.js',
  './js/app.js',
  './js/segments/dashboard.js',
  './js/segments/team.js',
  './js/segments/medical.js',
  './js/segments/routes.js',
  './js/segments/advance.js',
  './js/segments/eventSecurity.js',
  './js/segments/rst.js',
  './js/segments/actionsOn.js',
  './js/segments/threatZones.js',
  './js/segments/travelDocs.js',
  './js/segments/uklaws.js',
  './js/segments/exportDoc.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-icon-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(PRECACHE_URLS);
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (key) { return key !== CACHE_NAME; })
          .map(function (key) { return caches.delete(key); })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

// Stale-while-revalidate: serve from cache immediately, refresh cache in the background.
self.addEventListener('fetch', function (event) {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.match(event.request).then(function (cached) {
        var networkFetch = fetch(event.request).then(function (response) {
          if (response && response.status === 200) {
            cache.put(event.request, response.clone());
          }
          return response;
        }).catch(function () {
          return cached;
        });
        return cached || networkFetch;
      });
    })
  );
});
