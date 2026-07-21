// Restless Receiving — service worker
// App shell di-cache supaya aplikasi tetap bisa DIBUKA saat offline.
// Request ke GAS (data & upload) selalu network-only — antrian offline ditangani IndexedDB di index.html.

var CACHE = 'restless-receiving-v5';
var SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var url = e.request.url;
  // Data/upload ke GAS atau domain lain: jangan di-cache
  if (e.request.method !== 'GET' || url.indexOf('script.google') !== -1 || url.indexOf('googleusercontent') !== -1) return;
  e.respondWith(
    caches.match(e.request).then(function (hit) {
      return hit || fetch(e.request).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
        return res;
      });
    }).catch(function () { return caches.match('./index.html'); })
  );
});
