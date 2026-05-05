const CACHE_NAME = 'amaru-app-v8';

self.addEventListener('install', event => {
    console.log('[SW] Installed - skipping wait');
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
    
    // Check if it's an API request (Supabase) or dynamic data
    const isApiRequest = event.request.url.includes('supabase.co/rest/v1');

    if (isApiRequest) {
        // Network-first for API to ensure fresh data, but fallback to cache
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseToCache));
                    return response;
                })
                .catch(() => caches.match(event.request))
        );
    } else {
        // Stale-while-revalidate for static assets
        event.respondWith(
            caches.match(event.request).then(cachedResponse => {
                const fetchPromise = fetch(event.request).then(networkResponse => {
                    if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseToCache));
                    }
                    return networkResponse;
                }).catch(() => {
                    console.log('[SW] Fetch failed for', event.request.url);
                });

                // Return cached response immediately if available, otherwise wait for network
                return cachedResponse || fetchPromise;
            })
        );
    }
});
