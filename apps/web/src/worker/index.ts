import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { CacheFirst } from 'workbox-strategies'
import { initializeApp } from 'firebase/app'
import { getMessaging, onBackgroundMessage } from 'firebase/messaging/sw'

declare const self: ServiceWorkerGlobalScope

// IMPORTANT: Event listeners must be added during initial script evaluation
// Don't use skipWaiting() or clientsClaim() - they invalidate Firebase tokens

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

self.addEventListener('activate', (event) => {
  console.log('[SW] Service worker activated')
  event.waitUntil(self.clients.claim())
})

// Initialize Firebase v12 in service worker using bundled imports
try {
  console.log('[SW] Initializing Firebase v12...')
  const app = initializeApp({
    apiKey: "AIzaSyCdLvrkh1n_fTjQvovGlXVUn3S67seq330",
    authDomain: "namegame-d5341.firebaseapp.com",
    projectId: "namegame-d5341",
    storageBucket: "namegame-d5341.firebasestorage.app",
    messagingSenderId: "951901886749",
    appId: "1:951901886749:web:a50d9a9e60b0cd42d5e9f4"
  })
  
  const messaging = getMessaging(app)
  console.log('[SW] Firebase messaging initialized successfully')
  
  // Handle background messages from Firebase
  onBackgroundMessage(messaging, (payload) => {
    console.log('[SW] Firebase background message received:', payload)
    
    const notificationTitle = payload.notification?.title || payload.data?.title || 'NameGame'
    const notificationOptions = {
      body: payload.notification?.body || payload.data?.body || 'You have a new notification.',
      icon: payload.notification?.icon || payload.data?.icon || '/icons/icon-192x192.png',
      badge: '/icons/icon-96x96.png',
      data: payload.data || { url: self.location.origin },
    }
    
    return self.registration.showNotification(notificationTitle, notificationOptions)
  })
} catch (e) {
  console.error('[SW] Failed to initialize Firebase:', e)
}

// clean up old precache entries
cleanupOutdatedCaches()

// Filter out problematic manifests and precache the rest.
const manifest = (self.__WB_MANIFEST || []).filter((entry) => {
  const url = typeof entry === 'string' ? entry : entry.url

  // Don't precache images
  if (url.match(/\.(?:png|gif|jpg|jpeg|svg|webp)$/)) {
    return false
  }

  // Don't precache dynamic chunks - they'll be cached on demand
  if (url.includes('/chunks/')) {
    return false
  }

  // Filter out other problematic files.
  return (
    !url.endsWith('.map') &&
    !url.endsWith('app-build-manifest.json') &&
    !url.endsWith('_buildManifest.js')
  )
})
precacheAndRoute(manifest)

// Runtime cache for chunks - cache them when requested, not during install
registerRoute(
  ({ request }) => request.destination === 'script' && request.url.includes('/chunks/'),
  new CacheFirst({
    cacheName: 'js-chunks',
  })
)

self.addEventListener('push', (event: PushEvent) => {
  const payload = event.data?.json() ?? {}
  const title = payload.title || 'NameGame'
  const options = {
    body: payload.body || 'You have a new notification.',
    icon: payload.icon || '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    data: payload.data || { url: self.location.origin },
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close()

  const urlToOpen =
    event.notification.data.url || new URL('/', self.location.origin).href

  event.waitUntil(
    self.clients
      .matchAll({
        type: 'window',
        includeUncontrolled: true,
      })
      .then((clientList) => {
        if (clientList.length > 0) {
          let client = clientList[0]
          for (const c of clientList) {
            if (c.focused) {
              client = c
            }
          }
          return client.focus().then((c) => c.navigate(urlToOpen))
        } else {
          return self.clients.openWindow(urlToOpen)
        }
      }),
  )
})
