'use client'

import { usePushNotifications } from '@/hooks/usePushNotifications'
import { Button } from './ui/button'
import { BellIcon, BellOffIcon } from 'lucide-react'

export function PushManager() {
  const {
    subscribe,
    unsubscribe,
    isPushEnabled,
    isSupported,
    isSubscribing,
  } = usePushNotifications()

  if (!isSupported) {
    return null // Push notifications not supported by the browser
  }


  if (isPushEnabled) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => unsubscribe()}
        disabled={isSubscribing}
      >
        <BellOffIcon className="mr-2 h-4 w-4" />
        Disable Notifications
      </Button>
    )
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={subscribe}
      disabled={isSubscribing}
    >
      <BellIcon className="mr-2 h-4 w-4" />
      Enable Notifications
    </Button>
  )
}
