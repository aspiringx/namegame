'use client'

import { useDeviceInfoContext } from '@/context/DeviceInfoContext'
import { Button } from './ui/button'
import { ArrowDownToLine, Share } from 'lucide-react'

export function InstallAppPrompt() {
  const deviceInfo = useDeviceInfoContext()

  const handleShowInstallInstructions = () => {
    // This will cause the AddToHomescreenPrompt to show up again
    localStorage.removeItem('namegame_pwa_prompt_dismissed')
    window.location.reload()
  }

  if (!deviceInfo) {
    return null
  }

  // For non-Apple devices, the browser install prompt is handled by AddToHomescreenPrompt.
  // We just need a button to re-trigger it if dismissed.
  if (deviceInfo.os !== 'ios' && !(deviceInfo.os === 'macos' && deviceInfo.browser === 'safari')) {
    return (
      <div className="text-sm text-muted-foreground">
        <p className="mb-2">For a better experience, install the app.</p>
        <Button
          variant="outline"
          size="sm"
          onClick={handleShowInstallInstructions}
        >
          <ArrowDownToLine className="mr-2 h-4 w-4" />
          Install App
        </Button>
      </div>
    )
  }

  if (deviceInfo.os === 'ios') {
    return (
      <div className="text-muted-foreground flex items-center text-sm">
        <Share className="mr-2 h-6 w-6 flex-shrink-0 text-blue-500" />
        <span>
          To enable notifications, add this app to your Home Screen. Tap the
          share icon, then select &quot;Add to Home Screen&quot;.
        </span>
      </div>
    )
  }

  return null
}
