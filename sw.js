const CACHE = 'wishlist-v33';
const BASE = '/Wishlist';
const SHELL = [BASE + '/index.html', BASE + '/manifest.json', BASE + '/sw.js', BASE + '/icon.png', BASE + '/install.html'];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Navigation → serve install.html directly, everything else gets app shell
  if (e.request.mode === 'navigate') {
    const pathname = url.pathname;
    if (pathname === BASE + '/install.html') {
      e.respondWith(
        caches.match(pathname).then(r => r || fetch(e.request))
      );
      return;
    }
    e.respondWith(
      caches.match(BASE + '/index.html').then(r => r || fetch(e.request))
    );
    return;
  }

  // Same-origin assets → cache first, then network
  if (url.origin === location.origin) {
    e.respondWith(
      caches.match(e.request).then(r => r || fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      }))
    );
    return;
  }

  // Cross-origin (external images, APIs) → network only, fail silently
  e.respondWith(fetch(e.request).catch(() => new Response('', { status: 408 })));
});
