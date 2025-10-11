'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useServiceWorker } from '@/context/ServiceWorkerContext'
import { useDeviceInfoContext } from '@/context/DeviceInfoContext'
import {
  saveSubscription,
  deleteSubscription,
  getUserSubscriptions,
} from '@/actions/push'
import { getMessagingInstance } from '@/lib/firebase'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

const PUSH_SUBSCRIPTION_ENDPOINT_KEY = 'namegame_push_subscription_endpoint'

export function usePushNotifications() {
  const deviceInfo = useDeviceInfoContext()
  const { data: session } = useSession()
  const { registration, isReady } = useServiceWorker()

  const [isSubscribing, setIsSubscribing] = useState(false)
  const [isPushEnabled, setIsPushEnabled] = useState(false)
  const [subscription, setSubscription] = useState<PushSubscription | null>(
    null,
  )
  const [permissionStatus, setPermissionStatus] =
    useState<NotificationPermission>('default')
  const [error, setError] = useState<Error | null>(null)
  const skipNextVerification = useRef(false)

  const isSupported =
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'permissions' in navigator

  useEffect(() => {
    if (isSupported) {
      navigator.permissions.query({ name: 'notifications' }).then((status) => {
        const mapState = (state: PermissionState): NotificationPermission =>
          state === 'prompt' ? 'default' : state

        setPermissionStatus(mapState(status.state))
        status.onchange = () => {
          setPermissionStatus(mapState(status.state))
        }
      })
    }
  }, [isSupported])

  useEffect(() => {
    // Clear "service worker not ready" error once it becomes ready
    if (isReady && error?.message === 'Service worker not ready.') {
      setError(null)
    }
    
    if (!isReady || !registration || !session || !deviceInfo?.isReady) return

    const verifySubscription = async () => {
      // Skip verification if we just subscribed (avoid race condition)
      if (skipNextVerification.current) {
        console.log('[Push] Skipping verification after subscribe')
        skipNextVerification.current = false
        return
      }
      
      try {
        // DATABASE IS SOURCE OF TRUTH: Check what subscriptions the user has
        const userSubsResult = await getUserSubscriptions()
        
        if (!userSubsResult.success || userSubsResult.subscriptions.length === 0) {
          // No subscriptions in database - user is not subscribed
          console.log('[Push] No subscriptions found in database')
          setIsPushEnabled(false)
          localStorage.removeItem(PUSH_SUBSCRIPTION_ENDPOINT_KEY)
          return
        }

        // User has subscription(s) in database
        // Derive current device type
        let currentDeviceType: 'mobile' | 'tablet' | 'desktop' | undefined
        if (deviceInfo?.isMobile) {
          currentDeviceType = window.innerWidth >= 768 ? 'tablet' : 'mobile'
        } else if (deviceInfo?.isDesktop) {
          currentDeviceType = 'desktop'
        }
        
        // Find subscription matching this device
        const deviceMatch = userSubsResult.subscriptions.find(
          sub => sub.browser === deviceInfo?.browser && 
                 sub.os === deviceInfo?.os && 
                 sub.deviceType === currentDeviceType
        )
        
        if (deviceMatch) {
          // Database has a subscription for this device - trust it
          console.log('[Push] Found subscription for this device in database')
          setIsPushEnabled(true)
          setSubscription(null) // Browser sub might not be available in all tabs
          localStorage.setItem(PUSH_SUBSCRIPTION_ENDPOINT_KEY, deviceMatch.endpoint)
        } else {
          // No subscription for this device
          console.log('[Push] No subscription found for this device')
          setIsPushEnabled(false)
          setSubscription(null)
          localStorage.removeItem(PUSH_SUBSCRIPTION_ENDPOINT_KEY)
        }
      } catch (e) {
        console.error('Error verifying push subscription:', e)
        setError(e as Error)
      }
    }

    verifySubscription()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, registration, session, deviceInfo?.isReady]) // Verify when SW ready, session changes, or deviceInfo ready. Don't include error?.message to avoid loops.

  const subscribe = useCallback(async () => {
    if (!isSupported || !process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY) {
      console.error('Push notifications not supported.')
      return
    }

    if (!isReady || !registration) {
      console.error('Service worker not ready, cannot subscribe.')
      setError(new Error('Connecting...'))
      return
    }

    if (!deviceInfo?.isReady) {
      console.error('Device info not ready, cannot subscribe.')
      setError(new Error('Detecting device...'))
      return
    }

    if (permissionStatus === 'denied') {
      console.error('Notification permission has been denied.')
      setError(
        new Error(
          'Notifications are blocked. To receive them, enable in your browser settings.',
        ),
      )
      return
    }

    setIsSubscribing(true)
    try {
      const permission = await Notification.requestPermission()
      setPermissionStatus(permission)
      if (permission !== 'granted') {
        console.error('Permission not granted for Notification')
        setIsSubscribing(false)
        return
      }

      // Detect if Chrome (uses FCM) - use Firebase
      // Only Chrome uses FCM. Safari/Firefox/Edge use standard web-push
      const browser = deviceInfo?.browser || 'unknown'
      const messaging = await getMessagingInstance()
      const useFirebase = (browser === 'chrome' || browser === 'brave') && messaging
      console.log('[Push] Browser detection:', { browser, useFirebase, hasMessaging: !!messaging })

      let sub: PushSubscription | null = null
      let fcmToken: string | undefined = undefined

      if (useFirebase) {
        // For Chrome/Brave: Use Firebase getToken() - no PushSubscription needed
        console.log('[Push] Using Firebase Cloud Messaging for Chrome')
        
        // Wait for service worker to be active
        if (!registration.active) {
          console.log('[Push] Service worker not active yet, waiting...')
          
          // Wait for either installing or waiting to become active
          const sw = registration.installing || registration.waiting
          if (sw) {
            await new Promise<void>((resolve, reject) => {
              const timeout = setTimeout(() => {
                reject(new Error('Service worker activation timeout'))
              }, 10000) // 10 second timeout
              
              sw.addEventListener('statechange', function handler() {
                console.log('[Push] Service worker state:', sw.state)
                if (sw.state === 'activated') {
                  clearTimeout(timeout)
                  sw.removeEventListener('statechange', handler)
                  resolve()
                } else if (sw.state === 'redundant') {
                  clearTimeout(timeout)
                  sw.removeEventListener('statechange', handler)
                  reject(new Error('Service worker became redundant'))
                }
              })
            })
          } else {
            throw new Error('No service worker found to activate')
          }
        }
        
        console.log('[Push] Service worker is active:', registration.active?.scriptURL)
        
        const { getToken } = await import('firebase/messaging')
        
        // Firebase getToken() registers with FCM and returns the token
        console.log('[Push] Calling Firebase getToken()...')
        console.log('[Push] VAPID key:', process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY?.substring(0, 20) + '...')
        console.log('[Push] Service worker scope:', registration.scope)
        
        try {
          fcmToken = await getToken(messaging!, {
            vapidKey: process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY,
            serviceWorkerRegistration: registration,
          })
          
          if (!fcmToken) {
            throw new Error('getToken() returned empty token')
          }
          
          console.log('[Push] ✅ Firebase token received from getToken():', fcmToken)
          console.log('[Push] Token length:', fcmToken.length)
          console.log('[Push] Token first 50 chars:', fcmToken.substring(0, 50))
          console.log('[Push] Token last 50 chars:', fcmToken.substring(fcmToken.length - 50))
        } catch (tokenError: any) {
          console.error('[Push] ❌ getToken() failed:', tokenError)
          console.error('[Push] Error code:', tokenError.code)
          console.error('[Push] Error message:', tokenError.message)
          throw tokenError
        }
        
        // Create a fake PushSubscription object for database compatibility
        // Firebase doesn't use PushSubscription - it only uses the FCM token
        const fakeEndpoint = `https://fcm.googleapis.com/fcm/send/${fcmToken}`
        sub = {
          endpoint: fakeEndpoint,
          expirationTime: null,
          toJSON: () => ({
            endpoint: fakeEndpoint,
            keys: { p256dh: '', auth: '' } // Firebase doesn't use these
          }),
          getKey: () => null,
          unsubscribe: async () => {
            // Would need to call Firebase deleteToken() here
            return true
          },
          options: { applicationServerKey: null, userVisibleOnly: true }
        } as unknown as PushSubscription
        
        console.log('[Push] Created Firebase subscription with endpoint:', fakeEndpoint.substring(0, 50) + '...')
      } else {
        // Use standard Push API for Safari/Firefox/Edge
        console.log('[Push] Using standard Push API for', browser)
        sub = await registration.pushManager.getSubscription()
        if (!sub) {
          sub = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(
              process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY,
            ),
          })
        }
      }

      if (!sub) {
        throw new Error('Failed to create push subscription')
      }

      // Derive device type from deviceInfo
      let deviceType: 'mobile' | 'tablet' | 'desktop' | undefined
      if (deviceInfo?.isMobile) {
        // Distinguish between phone and tablet based on screen size
        deviceType = window.innerWidth >= 768 ? 'tablet' : 'mobile'
      } else if (deviceInfo?.isDesktop) {
        deviceType = 'desktop'
      }

      const result = await saveSubscription(sub, fcmToken, {
        browser: deviceInfo?.browser,
        os: deviceInfo?.os,
        deviceType: deviceType,
      })
      if (result.success) {
        setSubscription(sub)
        setIsPushEnabled(true)
        localStorage.setItem(PUSH_SUBSCRIPTION_ENDPOINT_KEY, sub.endpoint)
        // Skip next verification to avoid race condition
        skipNextVerification.current = true
      } else {
        console.error('Failed to save subscription:', result.message)
        setError(new Error(result.message || 'Failed to save subscription.'))
      }
    } catch (err) {
      console.error('An error occurred during the subscription process:', err)
      setError(err as Error)
    } finally {
      setIsSubscribing(false)
    }
  }, [isReady, registration, isSupported, permissionStatus, deviceInfo?.isReady, deviceInfo?.browser, deviceInfo?.os, deviceInfo?.isMobile, deviceInfo?.isDesktop])

  const unsubscribe = useCallback(async () => {
    const endpoint = localStorage.getItem(PUSH_SUBSCRIPTION_ENDPOINT_KEY)
    if (!endpoint) {
      // Already unsubscribed or in a weird state, ensure UI is correct
      setIsPushEnabled(false)
      setSubscription(null)
      return
    }

    setIsSubscribing(true)
    try {
      // Delete from server first
      const result = await deleteSubscription(endpoint)
      if (!result.success) {
        // If server fails, we shouldn't proceed with client-side changes
        console.error(
          'Failed to delete subscription from server:',
          result.message,
        )
        setError(new Error(result.message || 'Failed to delete subscription.'))
        return
      }

      // Then, unsubscribe from the browser's push manager
      if (registration) {
        const browserSub = await registration.pushManager.getSubscription()
        if (browserSub) {
          await browserSub.unsubscribe()
        }
      }

      // For Firebase (Android/Chrome), also delete the FCM token
      if (deviceInfo?.os === 'android' || deviceInfo?.browser?.includes('Chrome')) {
        try {
          const messaging = await getMessagingInstance()
          if (messaging) {
            const { deleteToken } = await import('firebase/messaging')
            await deleteToken(messaging)
            console.log('[Push] Firebase token deleted')
          }
        } catch (err) {
          console.error('[Push] Failed to delete Firebase token:', err)
        }
      }

      // Finally, clean up local state
      localStorage.removeItem(PUSH_SUBSCRIPTION_ENDPOINT_KEY)
      setSubscription(null)
      setIsPushEnabled(false)
    } catch (err) {
      console.error('An error occurred during unsubscription:', err)
      setError(err as Error)
    } finally {
      setIsSubscribing(false)
    }
  }, [registration, deviceInfo?.os, deviceInfo?.browser])

  useEffect(() => {
    // When permissions change to default or denied, the existing subscription
    // is no longer valid and should be cleaned up.
    if (
      isPushEnabled &&
      (permissionStatus === 'default' || permissionStatus === 'denied')
    ) {
      console.log('Permission changed, cleaning up old subscription.')
      unsubscribe()
    }
  }, [permissionStatus, isPushEnabled, unsubscribe])

  return {
    isSupported,
    isPWA: deviceInfo?.isPWA ?? false,
    isPushEnabled,
    isSubscribing,
    subscribe,
    unsubscribe,
    subscription,
    error,
    isReady,
    permissionStatus,
  }
}
