// public/public-service-worker.js

// SKIP_WAITING 메시지를 받으면 즉시 새로운 서비스워커로 전환합니다.
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

const CACHE_NAME = 'app-cache-v3'; // 캐시 버전 관리
const cacheManifest = self.__WB_MANIFEST;
const BASE_URL = process.env.VUE_APP_API || '/';
const MAX_CACHE_ITEMS = 50;

self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  const additionalAssets = [
    `${BASE_URL}offline.html`,
    `${BASE_URL}assets/default.css`,
    `${BASE_URL}img/icons/android-chrome-192x192.png`,
    `${BASE_URL}img/icons/android-chrome-512x512.png`,
  ];

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      const allAssets = [...cacheManifest.map((item) => item.url), ...additionalAssets];
      console.log('Caching files:', allAssets);
      return cache.addAll(allAssets).catch((error) => {
        console.error('Error during cache installation:', error);
      });
    })
  );

  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Deleting old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => {
      // 새 버전이 활성화되었음을 클라이언트에 알림
      return self.clients.matchAll({ includeUncontrolled: true }).then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'NEW_VERSION_AVAILABLE' });
        });
      });
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }

      return fetch(event.request).then((networkResponse) => {
        return caches.open('dynamic-cache').then((cache) => {
          if (event.request.method === 'GET') {
            cache.put(event.request, networkResponse.clone());
            cache.keys().then((keys) => {
              if (keys.length > MAX_CACHE_ITEMS) {
                cache.delete(keys[0]); // 오래된 항목 제거
              }
            });
          }
          return networkResponse;
        });
      });
    })
  );
});

// 새 콘텐츠 알림
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
