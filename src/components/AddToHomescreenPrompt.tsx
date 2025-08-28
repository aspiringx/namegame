'use client'

import { useEffect, useState } from 'react'

import { Share } from 'lucide-react'

import { useDeviceInfo } from '@/hooks/useDeviceInfo'
import { Button } from './ui/button'

const NAMEGAME_PWA_PROMPT_DISMISSED_KEY = 'namegame_pwa_prompt_dismissed'

export function AddToHomescreenPrompt() {
  const deviceInfo = useDeviceInfo()
  const [isVisible, setVisibleState] = useState(false)

  useEffect(() => {
    if (!deviceInfo || deviceInfo.isPWA) return

    const dismissed =
      localStorage.getItem(NAMEGAME_PWA_PROMPT_DISMISSED_KEY) === 'true'

    if (!dismissed && deviceInfo.a2hs.isSupported) {
      setVisibleState(true)
    }
  }, [deviceInfo])

  const hide = () => {
    localStorage.setItem(NAMEGAME_PWA_PROMPT_DISMISSED_KEY, 'true')
    setVisibleState(false)
  }

  const handleInstall = () => {
    if (deviceInfo?.pwaPrompt.isReady) {
      deviceInfo.pwaPrompt.prompt()
    }
    // The prompt's userChoice property will handle hiding the prompt.
    // For other cases, we just hide it immediately.
    hide()
  }

  if (!isVisible || !deviceInfo || deviceInfo.isPWA) {
    return null
  }

  const renderInstructions = () => {
    // A simple way to check if we need the Share icon or special formatting.
    if (typeof deviceInfo.a2hs.instructions === 'string' && deviceInfo.a2hs.instructions.includes('share icon')) {
      return (
        <>
          <Share className="mr-2 h-6 w-6 text-blue-500" />
          <span>{deviceInfo.a2hs.instructions}</span>
        </>
      )
    }
    if (typeof deviceInfo.a2hs.instructions === 'string' && deviceInfo.a2hs.instructions.includes('⌘')) {
        const parts = deviceInfo.a2hs.instructions.split(/(\s\+\s|\s)/g);
        return <p>
            {parts.map((part, index) => {
                if (part === '⌘' || part === 'Ctrl' || part === 'D') {
                    return <kbd key={index} className="bg-muted rounded-md border px-2 py-1 text-sm">{part}</kbd>
                }
                return <span key={index}>{part}</span>
            })}
        </p>
    }

    return <p>{deviceInfo.a2hs.instructions}</p>
  }

  return (
    <div className="bg-background fixed right-4 bottom-4 z-50 rounded-lg border p-4 shadow-lg">
      <div className="flex items-start">
        <div className="ml-3 flex-1">
          <p className="text-foreground text-sm font-medium">{deviceInfo.a2hs.actionLabel}</p>
          <div className="text-muted-foreground mt-1 flex items-center text-sm">
            {renderInstructions()}
          </div>
        </div>
        <div className="ml-4 flex flex-shrink-0">
          <Button variant="outline" size="sm" onClick={hide}>
            Dismiss
          </Button>
          {deviceInfo.pwaPrompt.isReady && (
            <Button size="sm" onClick={handleInstall} className="ml-2">
              Install
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
