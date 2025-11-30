const CACHE_NAME = 'site-static-v1';
// Cài đặt và cache các asset cơ bản
self.addEventListener('install', event => {
self.skipWaiting();
event.waitUntil(
caches.open(CACHE_NAME)
.then(cache => cache.addAll(ASSETS))
);
});


// Kích hoạt: dọn cache cũ
self.addEventListener('activate', event => {
event.waitUntil(
caches.keys().then(keys => Promise.all(
keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
))
);
});


// Strategy: Cache first for navigation and assets, fallback to offline.html
self.addEventListener('fetch', event => {
const req = event.request;
// Only handle GET
if (req.method !== 'GET') return;


// Navigation requests -> try network first then cache then offline
if (req.mode === 'navigate') {
event.respondWith(
fetch(req).then(res => {
// put copy to cache
const copy = res.clone();
caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
return res;
}).catch(() => caches.match('/index.html').then(r => r || caches.match('/offline.html')))
);
return;
}


// For other requests: try cache first
event.respondWith(
caches.match(req).then(cacheRes => cacheRes || fetch(req).then(networkRes => {
// put in cache
return caches.open(CACHE_NAME).then(cache => {
try { cache.put(req, networkRes.clone()); } catch(e) {}
return networkRes;
});
}).catch(() => {
// if request is for an image or document, fallback to offline page
if (req.destination === 'image') return new Response('', { status: 404 });
return caches.match('/offline.html');
}))
);
});


// Lắng nghe message từ trang để skipWaiting
self.addEventListener('message', event => {
const data = event.data || {};
if (data.action === 'skipWaitingAndRefresh') {
self.skipWaiting();
}
});