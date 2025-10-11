import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { CacheFirst } from 'workbox-strategies'
// Firebase imports removed - we use standard Web Push API for all browsers
// This prevents duplicate notifications from Firebase intercepting push events

declare const self: ServiceWorkerGlobalScope

// IMPORTANT: Event listeners must be added during initial script evaluation
// Don't use skipWaiting() or clientsClaim() - they invalidate Firebase tokens
// The service worker will update on next page load/navigation

self.addEventListener('activate', () => {
  console.log('[SW] Service worker activated')
  // Don't claim clients immediately - let it happen naturally on next page load
  // This prevents Firebase token invalidation
})

// Firebase is ONLY for Chrome/Android (FCM)
// For Edge/Safari/Firefox, we use the standard push event listener below
// DO NOT initialize Firebase here - it intercepts ALL push events and causes duplicates
console.log('[SW] Skipping Firebase initialization - using standard Web Push API for all browsers')

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
  console.log('[SW] Push event received')
  console.log('[SW] Event data:', event.data?.text())
  
  const payload = event.data?.json() ?? {}
  console.log('[SW] Parsed payload:', payload)
  
  // Extract notification data from various push service formats:
  // - Firebase (Chrome/Android): payload.notification.{title,body,icon} + payload.data
  // - Web Push (Edge/Firefox/Brave/Samsung): payload.{title,body,icon,data}
  // - Safari (APNs): payload.aps.alert.{title,body} + custom data
  // - Our backend: payload.{title,body,icon,data}
  
  const title = 
    payload.notification?.title ||  // Firebase
    payload.aps?.alert?.title ||    // Safari APNs
    payload.data?.title ||          // Some services put it in data
    payload.title ||                // Web Push / our backend
    'NameGame'
  
  const body = 
    payload.notification?.body ||   // Firebase
    payload.aps?.alert?.body ||     // Safari APNs
    payload.data?.body ||           // Some services put it in data
    payload.body ||                 // Web Push / our backend
    'You have a new notification.'
  
  const icon = 
    payload.notification?.icon ||   // Firebase
    payload.data?.icon ||           // Some services put it in data
    payload.icon ||                 // Web Push / our backend
    '/icons/icon-192x192.png'
  
  // Data is typically at the root level or in payload.data
  const data = payload.data || { url: self.location.origin }
  
  const options = {
    body,
    icon,
    badge: '/icons/icon-96x96.png',
    data,
  }
  
  console.log('[SW] Showing notification:', title, options)
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  console.log('[SW] Notification clicked')
  console.log('[SW] Notification data:', event.notification.data)
  
  event.notification.close()

  const urlToOpen =
    event.notification.data.url || new URL('/', self.location.origin).href
  
  console.log('[SW] Opening URL:', urlToOpen)

  event.waitUntil(
    self.clients
      .matchAll({
        type: 'window',
        includeUncontrolled: true,
      })
      .then((clientList) => {
        console.log('[SW] Found clients:', clientList.length)
        if (clientList.length > 0) {
          let client = clientList[0]
          for (const c of clientList) {
            if (c.focused) {
              client = c
            }
          }
          console.log('[SW] Navigating existing client to:', urlToOpen)
          return client.focus().then((c) => c.navigate(urlToOpen))
        } else {
          console.log('[SW] Opening new window:', urlToOpen)
          return self.clients.openWindow(urlToOpen)
        }
      }),
  )
})
