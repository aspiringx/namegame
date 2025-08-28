'use client'

import { useState, useEffect, useCallback } from 'react'
import { useDeviceInfo } from './useDeviceInfo'
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
  const deviceInfo = useDeviceInfo()
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isSubscribing, setIsSubscribing] = useState(false)
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)
  const [permissionStatus, setPermissionStatus] = useState<PermissionState | null>(
    null,
  )

  const isSupported = deviceInfo?.push.isSupported ?? false

  useEffect(() => {
    if (!isSupported) return

    let permissionStatusInstance: PermissionStatus | null = null

    const checkPermissions = async () => {
      permissionStatusInstance = await navigator.permissions.query({
        name: 'notifications',
      })
      setPermissionStatus(permissionStatusInstance.state)
      permissionStatusInstance.onchange = () => {
        setPermissionStatus(permissionStatusInstance?.state ?? null)
      }
    }

    checkPermissions()

    return () => {
      if (permissionStatusInstance) {
        permissionStatusInstance.onchange = null
      }
    }
  }, [isSupported])

  useEffect(() => {
    if (permissionStatus === 'granted') {
      navigator.serviceWorker.ready.then((registration) => {
        registration.pushManager.getSubscription().then((sub) => {
          if (sub) {
            setIsSubscribed(true)
            setSubscription(sub)
          } else {
            // This can happen if the user revokes permission, the subscription is cleared
            // but our app state doesn't reflect it.
            setIsSubscribed(false)
            setSubscription(null)
          }
        })
      })
    } else {
      setIsSubscribed(false)
      setSubscription(null)
    }
  }, [permissionStatus])

  const subscribe = useCallback(async () => {
    if (!isSupported || !process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY) {
      console.error('Push notifications not supported or VAPID key missing.')
      return
    }

    setIsSubscribing(true)
    try {
      const registration = await navigator.serviceWorker.ready

      let sub = await registration.pushManager.getSubscription()

      if (!sub) {
        const permission = await Notification.requestPermission()

        if (permission !== 'granted') {
          console.error('Permission not granted for Notification')
          return
        }

        const swRegistration = await navigator.serviceWorker.ready
        sub = await swRegistration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(
            process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY,
          ),
        })
      }

      if (sub) {
        const result = await saveSubscription(sub)
        if (result.success) {
          setSubscription(sub)
          setIsSubscribed(true)
        } else {
          console.error('Failed to save subscription:', result.message)
        }
      } else {
      }
    } catch (error) {
      console.error('An error occurred during the subscription process:', error)
    } finally {
      setIsSubscribing(false)
    }
  }, [isSupported])

  const unsubscribe = useCallback(async () => {
    if (!subscription) return

    setIsSubscribing(true)

    const result = await deleteSubscription(subscription.endpoint)

    if (result.success) {
      await subscription.unsubscribe()
      setSubscription(null)
      setIsSubscribed(false)
    } else {
      console.error('Failed to delete subscription:', result.message)
    }

    setIsSubscribing(false)
  }, [subscription])

  return {
    isSupported,
    isPWA: deviceInfo?.isPWA ?? false,
    isSubscribed,
    isSubscribing,
    subscribe,
    unsubscribe,
    subscription,
    permissionStatus,
  }
}
