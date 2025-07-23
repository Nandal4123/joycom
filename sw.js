// 조이상담코칭센터 Service Worker
// 404 오류 방지를 위한 최소한의 Service Worker

self.addEventListener('install', function(event) {
    console.log('Service Worker 설치됨');
    self.skipWaiting();
});

self.addEventListener('activate', function(event) {
    console.log('Service Worker 활성화됨');
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', function(event) {
    // 기본 네트워크 요청 처리
    event.respondWith(fetch(event.request));
}); 