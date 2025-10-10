'use client'

import { useState, useEffect, useCallback } from 'react'
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
    
    if (!isReady || !registration || !session) return

    const verifySubscription = async () => {
      try {
        // DATABASE IS SOURCE OF TRUTH: Check what subscriptions the user has
        const userSubsResult = await getUserSubscriptions()
        
        if (!userSubsResult.success || userSubsResult.subscriptions.length === 0) {
          // No subscriptions in database - user is not subscribed
          console.log('[Push] No subscriptions found in database')
          setIsPushEnabled(false)
          setSubscription(null)
          localStorage.removeItem(PUSH_SUBSCRIPTION_ENDPOINT_KEY)
          return
        }

        // User has subscription(s) in database
        // Try to find one that matches this browser
        const browserSub = await registration.pushManager.getSubscription()
        
        if (browserSub) {
          // Browser has a subscription - check if it's in the database
          const matchingSub = userSubsResult.subscriptions.find(
            sub => sub.endpoint === browserSub.endpoint
          )
          
          if (matchingSub) {
            // Perfect! Browser and database match
            console.log('[Push] Found matching subscription in database')
            setIsPushEnabled(true)
            setSubscription(browserSub)
            localStorage.setItem(PUSH_SUBSCRIPTION_ENDPOINT_KEY, browserSub.endpoint)
          } else {
            // Browser has a subscription not in database - clean it up
            console.log('[Push] Browser subscription not in database, cleaning up')
            await browserSub.unsubscribe()
            setIsPushEnabled(false)
            setSubscription(null)
            localStorage.removeItem(PUSH_SUBSCRIPTION_ENDPOINT_KEY)
          }
        } else {
          // No browser subscription but database has one
          // This happens when browser data is cleared
          console.log('[Push] Database has subscription but browser does not')
          // Show as not enabled - user will need to re-subscribe on this device
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
  }, [isReady, registration, session, error?.message])

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
        // Use Firebase getToken() for Chrome
        // Tell Firebase to use our unified sw.js (which has Firebase messaging integrated)
        console.log('[Push] Using Firebase for Chrome with sw.js')
        console.log('[Push] Service worker registration:', {
          scope: registration.scope,
          active: registration.active?.scriptURL,
          installing: registration.installing?.scriptURL,
          waiting: registration.waiting?.scriptURL
        })
        
        const { getToken } = await import('firebase/messaging')
        
        console.log('[Push] Requesting Firebase token...')
        console.log('[Push] Using service worker:', registration.active?.scriptURL)
        
        fcmToken = await getToken(messaging!, {
          vapidKey: process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY,
          serviceWorkerRegistration: registration,
        })
        
        console.log('[Push] Firebase token received:', fcmToken.substring(0, 30) + '...')
        
        console.log('[Push] getToken() completed successfully')
        
        if (!fcmToken) {
          throw new Error('Failed to get Firebase token')
        }
        console.log('[Push] Got Firebase token:', fcmToken.substring(0, 20) + '...')
        
        // Wait a moment for Firebase to propagate the token registration
        console.log('[Push] Waiting for Firebase token propagation...')
        await new Promise(resolve => setTimeout(resolve, 2000))
        console.log('[Push] Token should be ready now')
        
        // For Firebase, we don't need the PushSubscription object
        // We'll create a fake one just to satisfy the API
        // The fcmToken is all we need for sending notifications
        sub = {
          endpoint: `https://fcm.googleapis.com/fcm/send/${fcmToken}`,
          expirationTime: null,
          toJSON: () => ({
            endpoint: `https://fcm.googleapis.com/fcm/send/${fcmToken}`,
            keys: { p256dh: '', auth: '' }
          }),
          getKey: () => null,
          unsubscribe: async () => true,
          options: { applicationServerKey: null, userVisibleOnly: true }
        } as unknown as PushSubscription
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

      const result = await saveSubscription(sub, fcmToken)
      if (result.success) {
        setSubscription(sub)
        setIsPushEnabled(true)
        localStorage.setItem(PUSH_SUBSCRIPTION_ENDPOINT_KEY, sub.endpoint)
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
  }, [isReady, registration, isSupported, permissionStatus, deviceInfo?.isReady, deviceInfo?.browser])

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
