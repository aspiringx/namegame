'use client'

import { useAddToHomescreenPrompt } from '@/hooks/useAddToHomescreenPrompt'
import { Button } from './ui/button'
import { ArrowDownToLine, Share } from 'lucide-react'

export function InstallAppPrompt() {
  const { isIOS, isMacSafari } = useAddToHomescreenPrompt()

  const handleShowInstallInstructions = () => {
    // This will cause the AddToHomescreenPrompt to show up again
    localStorage.removeItem('namegame_pwa_prompt_dismissed')
    window.location.reload()
  }

  if (!isIOS && !isMacSafari) {
    // For non-Apple desktop, the browser install prompt is handled by useAddToHomescreenPrompt
    // We just need a button to re-trigger it if dismissed.
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

  if (isIOS) {
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
