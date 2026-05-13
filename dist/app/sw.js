const CACHE_NAME = 'amaru-cache-v2';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/app/index.html',
    '/app/app.js',
    '/app/style.css',
    '/app/modules/skeleton.css',
    '/app/modules/enhancements.css',
    '/app/modules/validation.js',
    '/app/modules/notifications.js',
    '/app/modules/faq.js',
    '/app/modules/integrations.js',
    '/app/services/supabaseService.js',
    '/app/supabase-config.js',
    '/app/store/appStore.js',
    '/app/auth/auth.js',
    '/app/auth/forgot-password.js',
    '/app/utils/helpers.js',
    '/app/utils/formatters.js',
    '/manifest.json',
    '/images/icon-192.png',
    '/images/icon-512.png',
    '/images/amarunegro.png',
    '/images/AMARU-LFNM.png',
    '/images/patronapp.png',
    '/images/1.jpg',
    '/images/2.jpg',
    '/images/3.jpg',
    '/images/4.jpg',
    '/images/5.jpg',
    '/images/6.jpg',
    '/images/7.jpg',
    '/images/9.jpg',
    '/images/10.jpg',
    '/images/11.jpg',
    '/images/12.jpg',
    '/images/striking.jpg',
    '/images/grappling.jpg',
    '/images/mma.jpg',
    '/images/horario.png',
    '/images/unknow.png'
];

const CDN_ASSETS = [
    'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.8/dist/umd/supabase.min.js',
    'https://unpkg.com/lucide@0.468.0/dist/umd/lucide.min.js',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap'
];

self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            const staticCache = cache.addAll(STATIC_ASSETS).catch(err => {
                console.warn('[SW] Failed to cache some static assets:', err);
            });
            const cdnCache = cache.addAll(CDN_ASSETS).catch(err => {
                console.warn('[SW] Failed to cache CDN assets:', err);
            });
            return Promise.all([staticCache, cdnCache]);
        })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Supabase API: network first, cache fallback
    if (url.hostname.includes('supabase.co')) {
        event.respondWith(
            fetch(request)
                .then(response => {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
                    return response;
                })
                .catch(() => caches.match(request))
        );
        return;
    }

    // Images: cache first, network fallback
    if (request.destination === 'image') {
        event.respondWith(
            caches.match(request).then(cached => {
                if (cached) return cached;
                return fetch(request).then(response => {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
                    return response;
                });
            })
        );
        return;
    }

    // Fonts and CSS: stale while revalidate
    if (request.destination === 'font' || request.destination === 'style') {
        event.respondWith(
            caches.match(request).then(cached => {
                const fetchPromise = fetch(request).then(response => {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
                    return response;
                });
                return cached || fetchPromise;
            })
        );
        return;
    }

    // Default: network first for HTML/JS, cache fallback
    event.respondWith(
        fetch(request)
            .then(response => {
                if (request.method === 'GET' && response.status === 200) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
                }
                return response;
            })
            .catch(() => caches.match(request).then(cached => {
                if (cached) return cached;
                // Fallback to offline page for navigation
                if (request.mode === 'navigate') {
                    return caches.match('/app/index.html');
                }
                return new Response('Offline - No cached content available', {
                    status: 503,
                    headers: { 'Content-Type': 'text/plain' }
                });
            }))
    );
});

// Push notification handler
self.addEventListener('push', (event) => {
    const data = event.data?.json() || {};
    const title = data.title || 'Amaru Fighters';
    const options = {
        body: data.body || 'Tienes una notificación',
        icon: '/images/icon-192.png',
        badge: '/images/icon-192.png',
        tag: data.tag || 'default',
        requireInteraction: data.requireInteraction || false,
        actions: data.actions || [],
        ...data
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'dismiss') return;

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
            const url = event.notification.data?.url || '/app/index.html';
            for (const client of clientList) {
                if (client.url === url && 'focus' in client) {
                    return client.focus();
                }
            }
            if (self.clients.openWindow) {
                return self.clients.openWindow(url);
            }
        })
    );
});
