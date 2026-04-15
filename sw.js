// OnCue Service Worker — v1776293885
// Forces fresh load on every deploy by using a unique cache name

const CACHE_NAME = 'oncue-v1776293885';
const BASE_PATH = '/OnCue';

self.addEventListener('install', event => {
  // Skip waiting so new SW activates immediately
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.add(BASE_PATH + '/index.html');
    }).catch(() => {}) // Don't fail install if cache fails
  );
});

self.addEventListener('activate', event => {
  // Delete all old caches
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  // Always fetch fresh from network, fall back to cache
  event.respondWith(
    fetch(event.request, {cache: 'no-store'})
      .then(response => {
        // Cache the fresh response
        if(response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Network failed — serve from cache
        return caches.match(event.request);
      })
  );
});

self.addEventListener('message', event => {
  if(event.data && event.data.action === 'skipWaiting') self.skipWaiting();
});
