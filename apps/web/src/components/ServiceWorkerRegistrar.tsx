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

    // Listen for service worker updates
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SW_UPDATED') {
        console.log('[SW] New service worker activated, version:', event.data.version)
        console.log('[SW] Reloading page to use new version...')
        // Reload the page to use the new service worker
        window.location.reload()
      }
    }

    navigator.serviceWorker.addEventListener('message', handleMessage)

    const setupServiceWorker = async () => {
      try {
        // Check if service worker is already registered
        const existingRegistration = await navigator.serviceWorker.getRegistration('/sw.js')
        
        let newRegistration: ServiceWorkerRegistration
        
        if (existingRegistration) {
          // Update the existing registration to check for new version
          await existingRegistration.update()
          newRegistration = existingRegistration
          
          // Check if the controller matches the active worker from this registration
          if (navigator.serviceWorker.controller && 
              newRegistration.active && 
              navigator.serviceWorker.controller.scriptURL === newRegistration.active.scriptURL) {
            _setRegistration(newRegistration)
            _setIsReady(true)
            return
          }
        } else {
          // Register the new service worker
          newRegistration = await navigator.serviceWorker.register('/sw.js')
        }

        // Wait for the service worker to become active and control the page.
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

    // Cleanup
    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage)
    }
  }, [_setRegistration, _setIsReady])

  return null
}
