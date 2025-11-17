'use client'

import { usePushNotificationsContext } from '@/context/PushNotificationsContext'
import { useDeviceInfoContext } from '@/context/DeviceInfoContext'
import { useA2HS } from '@/context/A2HSContext'
import { Button } from './ui/button'
import { BellIcon, BellOffIcon, Download } from 'lucide-react'
import { NAMEGAME_PWA_INSTALL_STEP_DISMISSED_KEY } from '@/lib/constants'
import { useState, useEffect } from 'react'

export function PushManager() {
  const {
    subscribe,
    unsubscribe,
    isPushEnabled,
    isSupported,
    isSubscribing,
    isReady,
    error,
  } = usePushNotificationsContext()

  const deviceInfo = useDeviceInfoContext()
  const { showPrompt } = useA2HS()
  const [isInstallStepDismissed, setIsInstallStepDismissed] = useState(true)
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
    const dismissed = localStorage.getItem(
      NAMEGAME_PWA_INSTALL_STEP_DISMISSED_KEY,
    )
    setIsInstallStepDismissed(dismissed === 'true')
  }, [])

  if (!deviceInfo || !hasMounted) {
    return null
  }

  // If push is supported and enabled, show disable button
  if (isSupported && isPushEnabled) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => unsubscribe()}
        disabled={isSubscribing || !isReady}
      >
        <BellOffIcon className="mr-2 h-4 w-4" />
        Disable Notifications
      </Button>
    )
  }

  // If push is supported but not enabled, show enable button
  if (isSupported) {
    const isServiceWorkerLoading =
      error?.message === 'Service worker not ready.'

    return (
      <div className="space-y-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={subscribe}
          disabled={isSubscribing || !isReady}
        >
          <BellIcon className="mr-2 h-4 w-4" />
          Enable Notifications
        </Button>
        {isServiceWorkerLoading && (
          <p className="text-sm text-gray-400">
            Loading notification system... (this takes a few seconds on first
            load)
          </p>
        )}
      </div>
    )
  }

  // Push not supported, but A2HS is available and not dismissed
  if (deviceInfo.a2hs.canInstall && !isInstallStepDismissed) {
    const handleInstallClick = () => {
      if (deviceInfo.pwaPrompt.isReady) {
        deviceInfo.pwaPrompt.prompt()
      } else {
        showPrompt()
      }
    }

    const handleDismissInstallStep = () => {
      localStorage.setItem(NAMEGAME_PWA_INSTALL_STEP_DISMISSED_KEY, 'true')
      setIsInstallStepDismissed(true)
    }

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleInstallClick}
          >
            <Download className="mr-2 h-4 w-4" />
            {deviceInfo.a2hs.actionLabel}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleDismissInstallStep}
          >
            Already Done
          </Button>
        </div>
        <p className="text-sm text-gray-400">{deviceInfo.a2hs.instructions}</p>
      </div>
    )
  }

  // Push not supported and either A2HS not available or dismissed
  return null
}
