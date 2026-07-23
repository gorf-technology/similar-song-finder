// 캐시 버전 - index.html의 version-tag 표시(v2.3)와 항상 같이 올릴 것
const CACHE_NAME = 'similar-song-finder-v2.3';

const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './fonts/Pretendard-Regular.woff2',
  './fonts/Pretendard-SemiBold.woff2'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // last.fm / iTunes 같은 외부 API 호출은 캐시하지 않고 그대로 네트워크로
  if (!event.request.url.startsWith(self.location.origin)) return;

  // index.html(문서)은 네트워크 우선 - 수정할 때마다 버전 번호를 안 올려도
  // 항상 최신 내용이 바로 반영된다. 오프라인일 때만 캐시로 대체.
  if (event.request.mode === 'navigate' || event.request.destination === 'document') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // 폰트/아이콘 등 정적 자원은 자주 안 바뀌니 캐시 우선 유지
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
