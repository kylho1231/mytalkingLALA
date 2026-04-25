// Service Worker for My Talking Lala 3D - PWA
const CACHE_NAME = 'lala-game-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/src/main.jsx',
  '/src/App.jsx',
  '/src/index.css',
  '/favicon.svg'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[Service Worker] Install complete');
        return self.skipWaiting();
      })
      .catch((err) => {
        console.error('[Service Worker] Cache failed:', err);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[Service Worker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[Service Worker] Activation complete');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests and cross-origin requests
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Network-first strategy for dynamic content, cache-first for static
  if (event.request.url.includes('/src/') || event.request.url.endsWith('.js') || event.request.url.endsWith('.css')) {
    // Cache-first for static assets
    event.respondWith(
      caches.match(event.request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            // Return cached version while fetching updated version
            fetch(event.request)
              .then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200) {
                  caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, networkResponse.clone());
                  });
                }
              })
              .catch(() => {
                // Network failed, cached version already returned
              });
            return cachedResponse;
          }
          
          // Not in cache, fetch from network
          return fetch(event.request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(event.request, networkResponse.clone());
                });
              }
              return networkResponse;
            })
            .catch((err) => {
              console.error('[Service Worker] Fetch failed:', err);
              // Return offline fallback if available
              if (event.request.mode === 'navigate') {
                return caches.match('/index.html');
              }
            });
        })
    );
  } else {
    // Network-first for other requests
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse.clone());
            });
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
  }
});

// Background sync for when user comes back online
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-game-data') {
    console.log('[Service Worker] Syncing game data...');
    event.waitUntil(syncGameData());
  }
});

async function syncGameData() {
  // Sync localStorage data if needed
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({ type: 'SYNC_COMPLETE' });
  });
}

// Push notifications support (for future use)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body || 'Lala misses you!',
      icon: '/icon-192x192.png',
      badge: '/icon-72x72.png',
      tag: data.tag || 'lala-notification',
      requireInteraction: true,
      actions: [
        { action: 'open', title: 'Play with Lala' },
        { action: 'dismiss', title: 'Later' }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification('My Talking Lala', options)
    );
  }
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      self.clients.openWindow('/')
    );
  }
});

// Message from main thread
self.addEventListener('message', (event) => {
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
