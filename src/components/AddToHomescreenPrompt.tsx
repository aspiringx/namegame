'use client'

import { useEffect, useState } from 'react'

import { Menu, Share } from 'lucide-react'

import { useAddToHomescreenPrompt } from '@/hooks/useAddToHomescreenPrompt'
import { Button } from './ui/button'

const NAMEGAME_PWA_PROMPT_DISMISSED_KEY = 'namegame_pwa_prompt_dismissed'

export function AddToHomescreenPrompt() {
  const { prompt, promptToInstall, isIOS, isMacSafari, isIosFirefox, isAndroidFirefox } =
    useAddToHomescreenPrompt()
  const [isVisible, setVisibleState] = useState(false)

  useEffect(() => {
    const dismissed =
      localStorage.getItem(NAMEGAME_PWA_PROMPT_DISMISSED_KEY) === 'true'
    if (!dismissed && (prompt || isIOS || isMacSafari || isAndroidFirefox)) {
      setVisibleState(true)
    }
  }, [prompt, isIOS, isMacSafari, isAndroidFirefox])

  const hide = () => {
    localStorage.setItem(NAMEGAME_PWA_PROMPT_DISMISSED_KEY, 'true')
    setVisibleState(false)
  }

  const handleInstall = () => {
    promptToInstall()
    hide()
  }

  if (!isVisible) {
    return null
  }

  return (
    <div className="bg-background fixed right-4 bottom-4 z-50 rounded-lg border p-4 shadow-lg">
      <div className="flex items-start">
        <div className="ml-3 flex-1">
          <p className="text-foreground text-sm font-medium">
            {isIOS || isAndroidFirefox
              ? 'Add to Home Screen'
              : isMacSafari
                ? 'Add to Dock or Bookmark'
                : 'Install App'}
          </p>
          <div className="text-muted-foreground mt-1 flex items-center text-sm">
            {isIosFirefox ? (
              <>
                <Menu className="mr-2 h-5 w-5" />
                <Share className="mr-2 h-5 w-5 text-blue-500" />
                <span>Tap your menu, then Share, then Add to Home Screen.</span>
              </>
            ) : isIOS ? (
              <>
                <Share className="mr-2 h-6 w-6 text-blue-500" />
                <span>
                  Tap the share icon, then select "Add to Home Screen".
                </span>
              </>
            ) : isMacSafari ? (
              <p>
                To install, go to File &gt; Add to Dock, or press Cmd+D to
                bookmark.
              </p>
            ) : isAndroidFirefox ? (
              <>
                <Menu className="mr-2 h-5 w-5" />
                <span>Tap your menu, then select "Install".</span>
              </>
            ) : (
              <p>For a better experience, install the app on your device.</p>
            )}
          </div>
        </div>
        <div className="ml-4 flex flex-shrink-0">
          <Button variant="outline" size="sm" onClick={hide}>
            Dismiss
          </Button>
          {!isIOS && !isMacSafari && (
            <Button size="sm" onClick={handleInstall} className="ml-2">
              Install
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
