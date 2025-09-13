'use client'


import { Share } from 'lucide-react'

import { useA2HS } from '@/context/A2HSContext'
import { useDeviceInfoContext } from '@/context/DeviceInfoContext'
import { Button } from './ui/button'

const NAMEGAME_PWA_PROMPT_DISMISSED_KEY = 'namegame_pwa-prompt-dismissed'

export function AddToHomescreenPrompt() {
  const { isPromptVisible, hidePrompt } = useA2HS()
  const deviceInfo = useDeviceInfoContext()

  const dismiss = () => {
    localStorage.setItem(NAMEGAME_PWA_PROMPT_DISMISSED_KEY, 'true')
    hidePrompt()
  }

  const handleInstall = () => {
    if (deviceInfo?.pwaPrompt.isReady) {
      deviceInfo.pwaPrompt.prompt()
    }
    // The prompt's userChoice will determine if it was accepted or dismissed.
    // We'll hide our custom prompt either way.
    dismiss()
  }

  // The component is now only controlled by the A2HSContext
  if (
    !isPromptVisible ||
    !deviceInfo ||
    deviceInfo.isPWA ||
    !deviceInfo.a2hs.isSupported
  ) {
    return null
  }

  const renderInstructions = () => {
    // A simple way to check if we need the Share icon or special formatting.
    if (
      typeof deviceInfo.a2hs.instructions === 'string' &&
      deviceInfo.a2hs.instructions.includes('share icon')
    ) {
      return (
        <>
          <Share className="mr-2 h-6 w-6 text-blue-500" />
          <span>{deviceInfo.a2hs.instructions}</span>
        </>
      )
    }
    if (
      typeof deviceInfo.a2hs.instructions === 'string' &&
      deviceInfo.a2hs.instructions.includes('⌘')
    ) {
      const parts = deviceInfo.a2hs.instructions.split(/(\s\+\s|\s)/g)
      return (
        <p>
          {parts.map((part, index) => {
            if (part === '⌘' || part === 'Ctrl' || part === 'D') {
              return (
                <kbd
                  key={index}
                  className="bg-muted rounded-md border px-2 py-1 text-sm"
                >
                  {part}
                </kbd>
              )
            }
            return <span key={index}>{part}</span>
          })}
        </p>
      )
    }

    return <p>{deviceInfo.a2hs.instructions}</p>
  }

  return (
    <div className="bg-background fixed right-4 bottom-4 z-50 rounded-lg border p-4 shadow-lg">
      <div className="flex items-start">
        <div className="ml-3 flex-1">
          <p className="text-foreground text-sm font-medium">
            {deviceInfo.a2hs.actionLabel}
          </p>
          <div className="text-muted-foreground mt-1 flex items-center text-sm">
            {renderInstructions()}
          </div>
        </div>
        <div className="ml-4 flex flex-shrink-0">
          <Button variant="outline" size="sm" onClick={dismiss}>
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
