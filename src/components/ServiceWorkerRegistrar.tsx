'use client'

import { useEffect } from 'react'
import { useServiceWorkerRegistrar } from '@/context/ServiceWorkerContext'

export function ServiceWorkerRegistrar() {
  const { _setRegistration, _setIsReady } = useServiceWorkerRegistrar()

  useEffect(() => {
    if (
      !('serviceWorker' in navigator) ||
      process.env.NODE_ENV !== 'production'
    ) {
      return
    }

    const setupServiceWorker = async () => {
      try {
        // Unregister any existing service workers to ensure a clean slate.
        const oldRegistrations =
          await navigator.serviceWorker.getRegistrations()
        for (const reg of oldRegistrations) {
          await reg.unregister()
        }

        // Register the new service worker.
        const newRegistration = await navigator.serviceWorker.register('/sw.js')

        // Wait for the new service worker to become active.
        await new Promise<void>((resolve) => {
          const awaitStateChange = () => {
            newRegistration.installing?.addEventListener('statechange', (e) => {
              const worker = e.target as ServiceWorker
              if (worker.state === 'activated') {
                resolve()
              }
            })
          }

          if (newRegistration.installing) {
            awaitStateChange()
          } else if (newRegistration.waiting) {
            // If a worker is already waiting, it might not fire 'installing'.
            // This path is less common with our unregister logic but is a safeguard.
            const worker = newRegistration.waiting
            if (worker.state === 'installed') {
              worker.addEventListener('statechange', (e) => {
                const updatedWorker = e.target as ServiceWorker
                if (updatedWorker.state === 'activated') {
                  resolve()
                }
              })
            }
          } else if (newRegistration.active) {
            // If a worker is already active, we're good to go.
            resolve()
          }
        })

        // Now that the worker is active, update the context.
        const readyRegistration = await navigator.serviceWorker.ready
        _setRegistration(readyRegistration)
        _setIsReady(true)
      } catch (error) {
        console.error('Service Worker setup failed:', error)
        _setIsReady(false)
      }
    }

    setupServiceWorker()
  }, [_setRegistration, _setIsReady])

  return null
}
