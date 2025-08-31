import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { clientsClaim } from 'workbox-core'

declare const self: ServiceWorkerGlobalScope

self.skipWaiting()
clientsClaim()

// clean up old precache entries
cleanupOutdatedCaches()

// Filter out problematic manifests and precache the rest.
const manifest = (self.__WB_MANIFEST || []).filter((entry) => {
  const url = typeof entry === 'string' ? entry : entry.url
  return !url.endsWith('.map') && !url.endsWith('app-build-manifest.json')
})
precacheAndRoute(manifest)

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
