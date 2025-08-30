'use client'

import { useEffect, useState } from 'react'

// Re-defining this interface locally to avoid dependency on the old hook.
interface RelatedApp {
  platform: string
  url: string
  id?: string
}

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
type Browser = 'safari' | 'chrome' | 'firefox' | 'edge' | 'unknown'

export type DeviceInfo = {
  isReady: boolean
  os: OperatingSystem
  browser: Browser
  isMobile: boolean
  isDesktop: boolean
  isPWA: boolean
  isPWAInstalled: boolean
  pwaPrompt: {
    canInstall: boolean
    isReady: boolean
    prompt: () => Promise<void>
  }
  a2hs: {
    isSupported: boolean
    canInstall: boolean
    actionLabel: string
    instructions: React.ReactNode
  }
  push: {
    isSupported: boolean
  }
}

export function useDeviceInfo(): DeviceInfo {
  // HACK: This is a hack to get around the fact that BeforeInstallPromptEvent is not in the default TS lib
  // See https://developer.mozilla.org/en-US/docs/Web/API/BeforeInstallPromptEvent
  interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[]
    readonly userChoice: Promise<{
      outcome: 'accepted' | 'dismissed'
      platform: string
    }>
    prompt(): Promise<void>
  }

  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    isReady: false,
    os: 'unknown',
    browser: 'unknown',
    isMobile: false,
    isDesktop: false,
    isPWA: false,
    isPWAInstalled: false,
    pwaPrompt: {
      canInstall: false,
      isReady: false,
      prompt: () => Promise.reject(new Error('Install prompt not ready.')),
    },
    a2hs: {
      isSupported: false,
      canInstall: false,
      actionLabel: '',
      instructions: '',
    },
    push: {
      isSupported: false,
    },
  })

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase()

    // --- Platform detection ---
    let os: OperatingSystem = 'unknown'
    if (/iphone|ipad|ipod/.test(userAgent)) os = 'ios'
    else if (/android/.test(userAgent)) os = 'android'
    else if (/mac os x/.test(userAgent)) os = 'macos'
    else if (/windows/.test(userAgent)) os = 'windows'
    else if (/linux/.test(userAgent)) os = 'linux'

    // --- Browser Detection ---
    let browser: Browser = 'unknown'
    if (/edg/.test(userAgent)) browser = 'edge'
    else if (/chrome/.test(userAgent) && !/edg/.test(userAgent))
      browser = 'chrome'
    else if (/safari/.test(userAgent) && !/chrome/.test(userAgent))
      browser = 'safari'
    else if (/firefox/.test(userAgent)) browser = 'firefox'

    const isMobile = os === 'ios' || os === 'android'
    const isDesktop = !isMobile
    const isPWA =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true

    const initialInfo: DeviceInfo = {
      isReady: false,
      os,
      browser,
      isMobile,
      isDesktop,
      isPWA,
      isPWAInstalled: false,
      pwaPrompt: {
        canInstall: false,
        isReady: false,
        prompt: () => Promise.reject(new Error('Install prompt not ready.')),
      },
      a2hs: {
        isSupported: false,
        canInstall: false,
        actionLabel: 'Bookmark',
        instructions: 'Bookmark this page for easy access.',
      },
      push: {
        isSupported: 'PushManager' in window && 'serviceWorker' in navigator,
      },
    }

    // --- Derive A2HS logic ---
    if (os === 'ios') {
      initialInfo.a2hs.isSupported = true
      initialInfo.a2hs.canInstall = !isPWA
      initialInfo.a2hs.actionLabel = 'Add to Home Screen'
      initialInfo.a2hs.instructions =
        'Tap the share icon, then select "Add to Home Screen".'
    } else if (os === 'android' && browser === 'firefox') {
      initialInfo.a2hs.isSupported = true
      initialInfo.a2hs.canInstall = !isPWA
      initialInfo.a2hs.actionLabel = 'Add to Home Screen'
      initialInfo.a2hs.instructions =
        'Tap your menu, Share, then select "Add to Home Screen".'
    } else if (os === 'android' && browser === 'chrome') {
      initialInfo.a2hs.isSupported = true
      initialInfo.a2hs.canInstall = !isPWA
    } else if (isDesktop) {
      if (browser === 'firefox') {
        initialInfo.a2hs.isSupported = true
        initialInfo.a2hs.canInstall = false
        initialInfo.a2hs.actionLabel = 'Bookmark'
        initialInfo.a2hs.instructions = `Press ${os === 'macos' ? '⌘' : 'Ctrl'} + D to bookmark this page.`
      } else if (os === 'macos' && browser === 'safari') {
        initialInfo.a2hs.isSupported = true
        initialInfo.a2hs.canInstall = !isPWA
        initialInfo.a2hs.actionLabel = 'Add to Dock'
        initialInfo.a2hs.instructions =
          'Go to File > Add to Dock, or press Cmd+D to bookmark.'
      } else if (browser === 'chrome' || browser === 'edge') {
        initialInfo.a2hs.isSupported = true
        initialInfo.a2hs.canInstall = !isPWA
        initialInfo.a2hs.actionLabel = 'Install App'
        initialInfo.a2hs.instructions =
          'Install the app for a better experience.'
      }
    }


    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      const promptEvent = e as IBeforeInstallPromptEvent
      setDeviceInfo((prev) => ({
        ...prev,
        pwaPrompt: {
          ...prev.pwaPrompt,
          canInstall: true,
          isReady: true,
          prompt: async () => {
            await promptEvent.prompt()
            const { outcome } = await promptEvent.userChoice
            if (outcome === 'accepted') {
              setDeviceInfo((p) => ({ ...p, isPWAInstalled: true }))
            }
          },
        },
      }))
    }

    const handleAppInstalled = () => {
      setDeviceInfo((prev) => ({ ...prev, isPWAInstalled: true }))
      window.location.reload()
    }

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const wasInstalled = localStorage.getItem('isPWAInstalled') === 'true';

    if (isStandalone) {
      localStorage.setItem('isPWAInstalled', 'true');
    }

    initialInfo.isPWA = isStandalone;

    setDeviceInfo(prev => ({
      ...prev,
      ...initialInfo,
      isPWAInstalled: isStandalone || wasInstalled,
      isReady: true,
    }));

    if (!isStandalone && !wasInstalled) {
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.addEventListener('appinstalled', handleAppInstalled);
    }

    return () => {
      if (!initialInfo.isPWA) {
        window.removeEventListener(
          'beforeinstallprompt',
          handleBeforeInstallPrompt,
        )
        window.removeEventListener('appinstalled', handleAppInstalled)
      }
    }
  }, [])

  return deviceInfo
}
