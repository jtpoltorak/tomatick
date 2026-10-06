/// <reference lib="webworker" />
// The web app's service worker. It keeps a copy of the app so it opens offline
// and can be installed, and it shows notifications on browsers that need it.
// Network first: online visitors always get the latest version.

export {};
declare const self: ServiceWorkerGlobalScope;
declare const APP_VERSION: string;

const CACHE = `tomatick-${APP_VERSION}`;
const APP_SHELL = [
  './',
  'index.html',
  'main.js',
  'styles.css',
  'legal.html',
  'legal.css',
  'legal.js',
  'manifest.webmanifest',
  'icons/icon-32.png',
  'icons/icon-48.png',
  'icons/icon-192.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          void caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(async () => (await caches.match(request)) ?? Response.error()),
  );
});

// Clicking a notification brings the timer back to the front.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      const open = windows[0];
      return open ? open.focus() : self.clients.openWindow('./');
    }),
  );
});
