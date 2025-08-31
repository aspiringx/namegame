'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      const unregisterAndRegister = async () => {
        try {
          // Unregister all existing service workers
          const registrations = await navigator.serviceWorker.getRegistrations()
          for (const registration of registrations) {
            await registration.unregister()
            console.log('Old service worker unregistered:', registration.scope)
          }

          // Register the new service worker
          console.log('Attempting to register new service worker...')
          const registration = await navigator.serviceWorker.register('/sw.js')
          console.log(
            'New Service Worker registered with scope:',
            registration.scope,
          )
        } catch (error) {
          console.error('Service Worker registration failed:', error)
        }
      }

      unregisterAndRegister()
    }
  }, [])

  return null
}
