const CACHE_NAME = 'hechaichi-pos-v1';

// الملفات التي سيتم حفظها لتعمل بدون إنترنت
const urlsToCache = [
  './',
  './index.html',
  './display.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// 1. تثبيت التطبيق وتخزين الملفات
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('تم خزن الملفات بنجاح');
        return cache.addAll(urlsToCache);
      })
  );
});

// 2. تفعيل التطبيق وتنظيف الملفات القديمة (إذا قمت بتحديث التطبيق)
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('تم حذف النسخة القديمة');
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// 3. جلب الملفات (إذا كان هناك إنترنت يجلب الجديد، وإذا لم يوجد يستخدم المخزن)
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // إذا وجد الملف في المخزن (Cache) يعطيه لك فوراً
        if (response) {
          return response;
        }
        // وإلا يجلبه من الإنترنت
        return fetch(event.request);
      })
  );
});
