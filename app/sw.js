/**
 * ⚡ KidStory High-Speed Offline Service Worker (PWA / Android Web)
 * - 정적 에셋, 스토리 데이터, Web Audio 효과음 캐싱
 * - 오프라인 상태에서도 동화책과 터치 미니게임 100% 정상 작동
 */

const CACHE_NAME = 'kidstory-cache-v6-ai-gen-2026';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './css/style.css',
  './js/audioEngine.js',
  './js/storyData.js',
  './js/miniGame.js',
  './js/mediaPipeEngine.js',
  './js/firebaseService.js',
  './js/paypalService.js',
  './js/localVault.js',
  './js/app.js',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] 사전 캐싱 완료');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[ServiceWorker] 구버전 캐시 정리:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(event.request));
    return;
  }

  const isAppFile = event.request.mode === 'navigate'
    || /\.(html|js|css)$/i.test(url.pathname)
    || url.pathname.endsWith('/');

  if (isAppFile) {
    event.respondWith(
      fetch(event.request).then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return res;
      }).catch(() => caches.match(event.request).then((cached) => cached || caches.match('./index.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;
      return fetch(event.request);
    })
  );
});
