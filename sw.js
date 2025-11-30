// sw.js - sửa để đảm bảo ASSETS tồn tại và log lỗi rõ ràng
const CACHE_NAME = 'site-static-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/style.css',     // theo repo bạn đang dùng
  '/offline.html',
  '/manifest.json',
  // '/icons/icon-192.png', '/icons/icon-512.png' // nếu bạn thêm icon
];

self.addEventListener('install', event => {
  console.log('[SW] install');
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => console.log('[SW] Assets cached'))
      .catch(err => {
        console.error('[SW] Cache install failed:', err);
      })
  );
});

self.addEventListener('activate', event => {
  console.log('[SW] activate');
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    )).then(() => console.log('[SW] Old caches cleared'))
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
        return res;
      }).catch(() => caches.match('/index.html').then(r => r || caches.match('/offline.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(cacheRes => cacheRes || fetch(req).then(networkRes => {
      return caches.open(CACHE_NAME).then(cache => {
        try { cache.put(req, networkRes.clone()); } catch(e) {}
        return networkRes;
      });
    }).catch(() => {
      if (req.destination === 'image') return new Response('', { status: 404 });
      return caches.match('/offline.html');
    }))
  );
});

self.addEventListener('message', event => {
  const data = event.data || {};
  if (data.action === 'skipWaitingAndRefresh') {
    self.skipWaiting();
  }
});
