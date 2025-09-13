import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { CacheFirst } from 'workbox-strategies'
import { CacheableResponsePlugin } from 'workbox-cacheable-response'
import { clientsClaim } from 'workbox-core'

declare const self: ServiceWorkerGlobalScope

self.skipWaiting()
clientsClaim()

// clean up old precache entries
cleanupOutdatedCaches()

// Filter out problematic manifests and precache the rest.
const manifest = (self.__WB_MANIFEST || []).filter((entry) => {
  const url = typeof entry === 'string' ? entry : entry.url
  // The _buildManifest.js file is not needed for precaching and can cause issues.
  return (
    !url.endsWith('.map') &&
    !url.endsWith('app-build-manifest.json') &&
    !url.endsWith('_buildManifest.js')
  )
})
precacheAndRoute(manifest)

// Cache images with a CacheFirst strategy
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200], // Cache opaque and successful responses
      }),
    ],
  }),
)

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CACHE_IMAGES') {
    const { imageUrls } = event.data.payload
    event.waitUntil(
      caches.open('images').then((cache) => {
        return Promise.all(
          imageUrls.map((url: string) => {
            return cache.add(url).catch((error) => {
              console.error(`Failed to cache image: ${url}`, error)
            })
          }),
        )
      }),
    )
  }
})

self.addEventListener('push', (event: PushEvent) => {
  const data = event.data?.json() ?? {}
  const title = data.title || 'NameGame'
  const options = {
    body: data.body || 'You have a new notification.',
    icon: data.icon || '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    data: {
      url: data.url || self.location.origin,
    },
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
