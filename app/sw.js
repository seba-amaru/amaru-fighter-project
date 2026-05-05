importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

firebase.initializeApp({
    projectId: "amaru-app-gym",
    appId: "1:19152982385:web:ac0116e361c9d97b41a6d0",
    storageBucket: "amaru-app-gym.firebasestorage.app",
    apiKey: "AIzaSyDI4-vgRMs3dKAvrQnSXTA0O3DYLaCTW_Q",
    authDomain: "amaru-app-gym.firebaseapp.com",
    messagingSenderId: "19152982385"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('[sw.js] Recibido mensaje en segundo plano:', payload);
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: payload.notification.icon || './images/icon-192.png'
    };
    self.registration.showNotification(notificationTitle, notificationOptions);
});

const CACHE_NAME = 'amaru-app-v5';

self.addEventListener('install', event => {
    console.log('[SW] Installed - skipping wait');
    // Skip waiting so this SW activates immediately without caching
    // (Vite hashes all filenames so pre-caching is not reliable)
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    self.clients.claim();
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') return;

    event.respondWith(
        fetch(event.request)
            .then(response => {
                if (response && response.status === 200 && response.type === 'basic') {
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME)
                        .then(cache => cache.put(event.request, responseToCache));
                }
                return response;
            })
            .catch(() => {
                return caches.match(event.request);
            })
    );
});
