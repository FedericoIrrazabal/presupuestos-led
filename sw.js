const CACHE = 'presupuestos-v9';
const SHELL = [
  './',
  './index.html',
  './app.js',
  './pdf.js',
  './numero-a-letras.js',
  './styles.css',
  './logo-dark.png',
  './logo-light.png',
  './fonts/montserrat-extrabold.woff2',
  './fonts/montserrat-semibold.woff2',
  './fonts/montserrat-extrabold.ttf',
  './fonts/montserrat-semibold.ttf',
  './fonts/allura.ttf',
  './fonts/allura.woff2',
  './manifest.webmanifest',
  './vendor/jspdf.umd.min.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-180.png',
  './icons/favicon-32.png',
  './icons/favicon-16.png',
  './favicon.ico',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  // Network first so updates reach the phone on the next open; cache only covers offline use.
  event.respondWith(
    fetch(event.request, { cache: 'no-cache' })
      .then((response) => {
        if (response.ok && new URL(event.request.url).origin === location.origin) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() => caches.match(event.request, { ignoreSearch: true }))
  );
});
