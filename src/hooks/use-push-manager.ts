'use client'

import { usePushNotificationsContext } from '@/context/PushNotificationsContext'

export function usePushManager() {
  const {
    subscribe,
    unsubscribe,
    isPushEnabled,
    isSupported,
    isSubscribing,
    isReady,
    permissionStatus,
  } = usePushNotificationsContext()

  return {
    subscribe,
    unsubscribe,
    isPushEnabled,
    isSupported,
    isSubscribing,
    isReady,
    permissionStatus,
  }
}
