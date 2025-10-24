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
    const handleMessage = async (event: MessageEvent) => {
      if (event.data?.type === 'SW_UPDATED') {
        console.log('[SW] New service worker activated, version:', event.data.version)
        console.log('[SW] Backing up push subscription before reload...')
        
        // Backup push subscription before reload to prevent loss
        try {
          const registration = await navigator.serviceWorker.ready
          const sub = await registration.pushManager.getSubscription()
          
          if (sub) {
            const backup: any = {
              endpoint: sub.endpoint,
              timestamp: Date.now()
            }
            
            // For Chrome/Android (FCM), also backup the FCM token
            // Check if this might be using Firebase
            const userAgent = navigator.userAgent.toLowerCase()
            const isChrome = userAgent.includes('chrome') && !userAgent.includes('edg')
            const isBrave = userAgent.includes('brave')
            const isAndroid = userAgent.includes('android')
            
            if (isChrome || isBrave || isAndroid) {
              try {
                // Dynamically import Firebase to get the token
                const { getToken } = await import('firebase/messaging')
                const { getMessagingInstance } = await import('@/lib/firebase')
                
                const messaging = await getMessagingInstance()
                if (messaging) {
                  const fcmToken = await getToken(messaging, {
                    vapidKey: process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY,
                    serviceWorkerRegistration: registration,
                  })
                  if (fcmToken) {
                    backup.fcmToken = fcmToken
                    console.log('[SW] FCM token backed up')
                  }
                }
              } catch (fcmError) {
                console.log('[SW] Not using FCM or failed to get token:', fcmError)
              }
            }
            
            localStorage.setItem('push_sub_backup', JSON.stringify(backup))
            console.log('[SW] Push subscription backed up')
          }
        } catch (error) {
          console.error('[SW] Failed to backup subscription:', error)
        }
        
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

    // Check for service worker updates every hour
    const updateInterval = setInterval(async () => {
      const registration = await navigator.serviceWorker.getRegistration('/sw.js')
      if (registration) {
        console.log('[SW] Checking for updates...')
        await registration.update()
      }
    }, 60 * 60 * 1000) // 1 hour

    // Cleanup
    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage)
      clearInterval(updateInterval)
    }
  }, [_setRegistration, _setIsReady])

  return null
}
