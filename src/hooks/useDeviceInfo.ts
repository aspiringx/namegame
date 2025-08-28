'use client'

import { useEffect, useState } from 'react'

// Re-defining this interface locally to avoid dependency on the old hook.
interface IBeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

type OperatingSystem =
  | 'ios'
  | 'android'
  | 'windows'
  | 'macos'
  | 'linux'
  | 'unknown'
type Browser =
  | 'safari'
  | 'chrome'
  | 'firefox'
  | 'edge'
  | 'unknown'

export type DeviceInfo = {
  os: OperatingSystem
  browser: Browser
  isMobile: boolean
  isDesktop: boolean
  isPWA: boolean
  pwaPrompt: {
    canInstall: boolean
    isReady: boolean
    prompt: () => Promise<void>
  }
  a2hs: {
    isSupported: boolean
    actionLabel: string
    instructions: React.ReactNode
  }
  push: {
    isSupported: boolean
  }
}

export function useDeviceInfo(): DeviceInfo | null {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null)
  const [installPrompt, setInstallPrompt] =
    useState<IBeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase()

    // OS Detection
    let os: OperatingSystem = 'unknown'
    if (/iphone|ipad|ipod/.test(userAgent)) os = 'ios'
    else if (/android/.test(userAgent)) os = 'android'
    else if (/mac os x/.test(userAgent)) os = 'macos'
    else if (/windows/.test(userAgent)) os = 'windows'
    else if (/linux/.test(userAgent)) os = 'linux'

    // Browser Detection
    let browser: Browser = 'unknown'
    if (/edg/.test(userAgent)) browser = 'edge'
    else if (/chrome/.test(userAgent) && !/edg/.test(userAgent)) browser = 'chrome'
    else if (/safari/.test(userAgent) && !/chrome/.test(userAgent)) browser = 'safari'
    else if (/firefox/.test(userAgent)) browser = 'firefox'

    const isMobile = os === 'ios' || os === 'android'
    const isDesktop = !isMobile

    const isPWA =
      (window.navigator as any).standalone === true ||
      window.matchMedia('(display-mode: standalone)').matches

    const promptToInstall = () => {
      if (installPrompt) {
        return installPrompt.prompt()
      }
      return Promise.reject(
        new Error('Tried installing before browser sent "beforeinstallprompt" event'),
      )
    }

    // Default state
    const info: DeviceInfo = {
      os,
      browser,
      isMobile,
      isDesktop,
      isPWA,
      pwaPrompt: {
        canInstall: false,
        isReady: !!installPrompt,
        prompt: promptToInstall,
      },
      a2hs: {
        isSupported: false,
        actionLabel: 'Bookmark',
        instructions: 'Bookmark this page for easy access.',
      },
      push: {
        isSupported: 'PushManager' in window && 'serviceWorker' in navigator,
      },
    }

    // --- Derive A2HS logic ---
    if (os === 'ios') {
      info.a2hs.isSupported = true
      info.a2hs.actionLabel = 'Add to Home Screen'
      info.a2hs.instructions = 'Tap the share icon, then select "Add to Home Screen".'
    } else if (os === 'android' && browser === 'firefox') {
      info.a2hs.isSupported = true
      info.a2hs.actionLabel = 'Add to Home Screen'
      info.a2hs.instructions = 'Tap your menu, Share, then select "Add to Home Screen".'
    } else if (os === 'android' && browser === 'chrome') {
      // This case is handled by the beforeinstallprompt event
      info.a2hs.isSupported = true;
    } else if (isDesktop) {
      if (browser === 'firefox') {
        info.a2hs.isSupported = true
        info.a2hs.actionLabel = 'Bookmark'
        info.a2hs.instructions = `Press ${os === 'macos' ? '⌘' : 'Ctrl'} + D to bookmark this page.`
      } else if (os === 'macos' && browser === 'safari') {
        info.a2hs.isSupported = true
        info.a2hs.actionLabel = 'Add to Dock'
        info.a2hs.instructions = 'Go to File > Add to Dock, or press Cmd+D to bookmark.'
      } else if (browser === 'chrome' || browser === 'edge') {
        // This case is handled by the beforeinstallprompt event
        info.a2hs.isSupported = true;
      }
    }

    setDeviceInfo(info)

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e as IBeforeInstallPromptEvent)
      setDeviceInfo((prev) =>
        prev
          ? {
              ...prev,
              pwaPrompt: {
                ...prev.pwaPrompt,
                canInstall: true,
                isReady: true,
              },
              a2hs: {
                ...prev.a2hs,
                isSupported: true,
                actionLabel: 'Install App',
              },
            }
          : null,
      )
    }

    if (!isPWA) {
      window.addEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt,
      )
    }

    return () => {
      if (!isPWA) {
        window.removeEventListener(
          'beforeinstallprompt',
          handleBeforeInstallPrompt,
        )
      }
    }
  }, [installPrompt, deviceInfo?.isPWA]) // Re-run if installPrompt changes

  return deviceInfo
}
