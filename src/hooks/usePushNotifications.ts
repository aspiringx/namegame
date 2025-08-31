'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useServiceWorker } from '@/context/ServiceWorkerContext'
import { useDeviceInfoContext } from '@/context/DeviceInfoContext'
import { saveSubscription, deleteSubscription } from '@/actions/push'

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

export function usePushNotifications() {
  const deviceInfo = useDeviceInfoContext()
  const { data: session } = useSession()
  const { registration, isReady } = useServiceWorker()

  const [isSubscribing, setIsSubscribing] = useState(false)
  const [isPushEnabled, setIsPushEnabled] = useState(false)
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)
  const [error, setError] = useState<Error | null>(null)

  const isSupported =
    typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window

  // Effect to check for an existing subscription once the service worker is ready
  useEffect(() => {
    if (isReady && registration && session) {
      const checkSubscription = async () => {
        try {
          const sub = await registration.pushManager.getSubscription()
          if (sub) {
            setSubscription(sub)
            setIsPushEnabled(true)
          }
        } catch (e) {
          console.error('Error checking for push subscription:', e)
          setError(e as Error)
        }
      }
      checkSubscription()
    }
  }, [isReady, registration, session])

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

    setIsSubscribing(true)
    try {
      const permission = await Notification.requestPermission()
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

      console.log('Client-side subscription object:', JSON.stringify(sub, null, 2));

      const result = await saveSubscription(sub)
      if (result.success) {
        setSubscription(sub)
        setIsPushEnabled(true)
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
  }, [isReady, registration, isSupported])

  const unsubscribe = useCallback(async () => {
    if (!subscription) return

    setIsSubscribing(true)
    try {
      // We don't need to await the unsubscribe call
      subscription.unsubscribe()
      const result = await deleteSubscription(subscription.endpoint)

      if (result.success) {
        setSubscription(null)
        setIsPushEnabled(false)
      } else {
        console.error('Failed to delete subscription:', result.message)
        setError(new Error(result.message || 'Failed to delete subscription.'))
      }
    } catch (err) {
      console.error('An error occurred during unsubscription:', err)
      setError(err as Error)
    } finally {
      setIsSubscribing(false)
    }
  }, [subscription])

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
  }
}
