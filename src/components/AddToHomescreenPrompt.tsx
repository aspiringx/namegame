'use client'

import { useEffect, useState } from 'react'

import { Share } from 'lucide-react'

import { useAddToHomescreenPrompt } from '@/hooks/useAddToHomescreenPrompt'
import { Button } from './ui/button'

const NAMEGAME_PWA_PROMPT_DISMISSED_KEY = 'namegame_pwa_prompt_dismissed'

export function AddToHomescreenPrompt() {
  const {
    prompt,
    promptToInstall,
    isDesktop,
    isMac,
    isIos,
    isAndroid,
    isFirefox,
    isSafari,
    isChrome,
    isEdge,
  } = useAddToHomescreenPrompt()
  const [isVisible, setVisibleState] = useState(false)

  const showInstallPrompt = !!prompt

  useEffect(() => {
    const dismissed =
      localStorage.getItem(NAMEGAME_PWA_PROMPT_DISMISSED_KEY) === 'true'
    if (!dismissed && showInstallPrompt) {
      setVisibleState(true)
    }
  }, [showInstallPrompt])

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

  const getTitle = () => {
    if (isIos || (isAndroid && isFirefox)) return 'Add to Home Screen'
    if (isDesktop && isFirefox) return 'Add to Bookmarks'
    return 'Install App'
  }

  const getInstructions = () => {
    if ((isIos || isAndroid) && isFirefox) {
      return (
        <>
          <Share className="mr-2 h-6 w-6 text-blue-500" />
          <span>Tap your menu, Share, then select "Add to Home Screen".</span>
        </>
      )
    }
    if (isIos || isAndroid) {
      return (
        <>
          <Share className="mr-2 h-6 w-6 text-blue-500" />
          <span>Tap the share icon, then select "Add to Home Screen".</span>
        </>
      )
    }
    if (isDesktop && isFirefox) {
      return (
        <p>
          Press{' '}
          <kbd className="bg-muted rounded-md border px-2 py-1 text-sm">
            {isMac ? '⌘' : 'Ctrl'}
          </kbd>{' '}
          +{' '}
          <kbd className="bg-muted rounded-md border px-2 py-1 text-sm">D</kbd>{' '}
          to bookmark this page.
        </p>
      )
    }
    if (isDesktop && isMac) {
      if (isChrome || isEdge) {
        return <p>Install app or press Cmd+D to bookmark in browser.</p>
      }
      return (
        <p>
          To install, go to File &gt; Add to Dock, or press Cmd+D to bookmark.
        </p>
      )
    }
    if (isDesktop && (isChrome || isEdge)) {
      return <p>Install app or press Cmd+D to bookmark in browser.</p>
    }
    return (
      <p>For a better experience, install the app or bookmark this page.</p>
    )
  }

  return (
    <div className="bg-background fixed right-4 bottom-4 z-50 rounded-lg border p-4 shadow-lg">
      <div className="flex items-start">
        <div className="ml-3 flex-1">
          <p className="text-foreground text-sm font-medium">{getTitle()}</p>
          <div className="text-muted-foreground mt-1 flex items-center text-sm">
            {getInstructions()}
          </div>
        </div>
        <div className="ml-4 flex flex-shrink-0">
          <Button variant="outline" size="sm" onClick={hide}>
            Dismiss
          </Button>
          {!!prompt && (
            <Button size="sm" onClick={handleInstall} className="ml-2">
              Install
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
