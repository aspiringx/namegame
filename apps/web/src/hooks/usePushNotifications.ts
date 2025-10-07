'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useServiceWorker } from '@/context/ServiceWorkerContext'
import { useDeviceInfoContext } from '@/context/DeviceInfoContext'
import {
  saveSubscription,
  deleteSubscription,
  getSubscription,
} from '@/actions/push'

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
      const localEndpoint = localStorage.getItem(PUSH_SUBSCRIPTION_ENDPOINT_KEY)

      if (!localEndpoint) {
        setIsPushEnabled(false)
        setSubscription(null)
        return
      }

      // Optimistically set UI state while we verify
      setIsPushEnabled(true)

      try {
        const serverResult = await getSubscription(localEndpoint)

        if (serverResult.success && serverResult.subscription) {
          // Server confirms subscription exists. Sync with browser.
          const browserSub = await registration.pushManager.getSubscription()
          if (browserSub && browserSub.endpoint === localEndpoint) {
            setSubscription(browserSub)
          } else if (!browserSub) {
            // This can happen on a hard refresh. The state is still valid.
            console.log(
              'Browser subscription not immediately available, but server confirmed.',
            )
          } else {
            // Browser has a different subscription. This is an edge case.
            // We trust the one in localStorage which is confirmed by the server.
            console.warn('Browser and local storage subscriptions mismatch.')
            setSubscription(browserSub) // Or handle as an error
          }
        } else {
          // Server says subscription is invalid. Clean up everywhere.
          console.log('Server could not find subscription. Cleaning up.')
          localStorage.removeItem(PUSH_SUBSCRIPTION_ENDPOINT_KEY)
          setIsPushEnabled(false)
          setSubscription(null)
          const browserSub = await registration.pushManager.getSubscription()
          if (browserSub) {
            await browserSub.unsubscribe()
          }
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
      console.error('Push notifications not supported or VAPID key missing.')
      return
    }

    if (!isReady || !registration) {
      console.error('Service worker not ready, cannot subscribe.')
      setError(new Error('Service worker not ready.'))
      return
    }

    if (permissionStatus === 'denied') {
      console.error('Notification permission has been denied.')
      setError(
        new Error(
          'Notifications are blocked. Please enable them in your browser settings.',
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

      let sub = await registration.pushManager.getSubscription()
      if (!sub) {
        sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(
            process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY,
          ),
        })
      }

      const result = await saveSubscription(sub)
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
  }, [isReady, registration, isSupported, permissionStatus])

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
  }, [registration])

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
