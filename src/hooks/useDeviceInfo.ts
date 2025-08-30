'use client'

import { useEffect, useState } from 'react'
import { Session } from 'next-auth'
import { NAMEGAME_PWA_PROMPT_DISMISSED_KEY } from '@/lib/constants'

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
type Browser = 'safari' | 'chrome' | 'firefox' | 'edge' | 'samsung' | 'brave' | 'unknown'

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

type A2HSRule = {
  isSupported: boolean
  canInstall: (isStandalone: boolean, wasInstalled?: boolean) => boolean
  actionLabel: string
  instructions: string
}

// A nested lookup matrix for A2HS feature configuration.
const A2HS_FEATURE_MATRIX: { [os: string]: { [browser: string]: A2HSRule } } = {
  ios: {
    // On iOS 16.4+, Safari, Chrome, Edge, and Firefox support PWA installation via the Share menu.
    '*': {
      isSupported: true,
      canInstall: (isStandalone) => !isStandalone,
      actionLabel: 'Add to Home Screen',
      instructions: 'Tap the Share icon, then "Add to Home Screen".',
    },
  },
  android: {
    firefox: {
      isSupported: true,
      canInstall: (isStandalone) => !isStandalone,
      actionLabel: 'Add to Home Screen',
      instructions: 'Tap the menu button (⋮), then select "Install".',
    },
    chrome: {
      isSupported: true,
      canInstall: (isStandalone, wasInstalled) => !isStandalone && !wasInstalled,
      actionLabel: 'Install App',
      instructions: 'Tap the menu button (⋮), then select "Install app".',
    },
    brave: {
      isSupported: true,
      canInstall: (isStandalone, wasInstalled) => !isStandalone && !wasInstalled,
      actionLabel: 'Install App',
      instructions: 'Tap the menu button (⋮), then select "Install app".',
    },
    edge: {
      isSupported: true,
      canInstall: (isStandalone, wasInstalled) => !isStandalone && !wasInstalled,
      actionLabel: 'Install App',
      instructions: 'Tap the menu button (…), then select "Add to phone".',
    },
    samsung: {
      isSupported: true,
      canInstall: (isStandalone, wasInstalled) => !isStandalone && !wasInstalled,
      actionLabel: 'Install App',
      instructions: 'Tap the download icon in the address bar, or find "Add page to" in the menu.',
    },
    // Wildcard for other Chromium-based browsers on Android
    '*': {
      isSupported: true,
      canInstall: (isStandalone, wasInstalled) => !isStandalone && !wasInstalled,
      actionLabel: 'Install App',
      instructions: 'Find the "Install" or "Add to Home Screen" option in your browser\'s menu.',
    },
  },
  windows: {
    firefox: {
      isSupported: true,
      canInstall: (isStandalone) => !isStandalone,
      actionLabel: 'Bookmark',
      instructions: 'Press Ctrl-D to bookmark this page.',
    },
    '*': {
      isSupported: true,
      canInstall: (isStandalone, wasInstalled) => !isStandalone && !wasInstalled,
      actionLabel: 'Install App',
      instructions: 'Install this app for a better experience.',
    },
  },
  macos: {
    safari: {
      isSupported: true,
      canInstall: (isStandalone) => !isStandalone,
      actionLabel: 'Add to Dock',
      instructions: 'Click the Share icon, then "Add to Dock".',
    },
    firefox: {
      isSupported: true,
      canInstall: (isStandalone) => !isStandalone,
      actionLabel: 'Bookmark',
      instructions: 'Press Cmd-D to bookmark this page.',
    },
    '*': {
      isSupported: true,
      canInstall: (isStandalone, wasInstalled) => !isStandalone && !wasInstalled,
      actionLabel: 'Install App',
      instructions: 'Install this app for a better experience.',
    },
  },
  linux: {
    firefox: {
      isSupported: true,
      canInstall: (isStandalone) => !isStandalone,
      actionLabel: 'Bookmark',
      instructions: 'Press Ctrl-D to bookmark this page.',
    },
    '*': {
      isSupported: true,
      canInstall: (isStandalone, wasInstalled) => !isStandalone && !wasInstalled,
      actionLabel: 'Install App',
      instructions: 'Install this app for a better experience.',
    },
  },
};

const A2HS_FALLBACK_RULE: A2HSRule = {
  isSupported: false,
  canInstall: () => false,
  actionLabel: 'Bookmark',
  instructions: 'Bookmark this page for easy access.',
};

/**
 * Looks up the A2HS configuration from the feature matrix.
 */
function getA2hsConfig(os: string, browser: string) {
  const osRules = A2HS_FEATURE_MATRIX[os as keyof typeof A2HS_FEATURE_MATRIX];
  if (!osRules) {
    return A2HS_FALLBACK_RULE;
  }
  const rule = osRules[browser as keyof typeof osRules] || osRules['*'];
  return rule || A2HS_FALLBACK_RULE;
}

export function useDeviceInfo(session: Session | null): DeviceInfo {
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
      prompt: () => Promise.resolve<void>(undefined),
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
    if (typeof window === 'undefined') return

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
    // Brave browser check must come before Chrome check
    if ((navigator as any).brave?.isBrave) browser = 'brave'
    else if (/samsungbrowser/.test(userAgent)) browser = 'samsung'
    else if (/edg/.test(userAgent)) browser = 'edge'
    else if (/chrome/.test(userAgent) && !/edg/.test(userAgent))
      browser = 'chrome'
    else if (/safari/.test(userAgent) && !/chrome/.test(userAgent))
      browser = 'safari'
    else if (/firefox/.test(userAgent)) browser = 'firefox'

    const isMobile = os === 'ios' || os === 'android'
    const isDesktop = !isMobile
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    const wasInstalled = localStorage.getItem('isPWAInstalled') === 'true'
    const promptDismissed =
      localStorage.getItem(NAMEGAME_PWA_PROMPT_DISMISSED_KEY) === 'true'

    const initialInfo: DeviceInfo = {
      isReady: false,
      os,
      browser,
      isMobile,
      isDesktop,
      isPWA: isStandalone,
      isPWAInstalled: isStandalone || wasInstalled,
      pwaPrompt: {
        canInstall: false,
        isReady: false,
        prompt: () => Promise.resolve<void>(undefined),
      },
      a2hs: {
        isSupported: false,
        canInstall: false,
        actionLabel: '',
        instructions: '',
      },
      push: {
        isSupported: 'PushManager' in window && 'serviceWorker' in navigator,
      },
    }

    // --- Derive A2HS logic from the matrix ---
    const a2hsConfig = getA2hsConfig(os, browser);
    initialInfo.a2hs = {
      isSupported: a2hsConfig.isSupported,
      canInstall: a2hsConfig.canInstall(isStandalone, wasInstalled),
      actionLabel: a2hsConfig.actionLabel,
      instructions: a2hsConfig.instructions,
    };


    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      const promptEvent = e as IBeforeInstallPromptEvent
      setDeviceInfo((prev) => ({
        ...prev,
        a2hs: {
          ...prev.a2hs,
          canInstall: true, // This is the true signal for installability
        },
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

    if (isStandalone) {
      localStorage.setItem('isPWAInstalled', 'true')
    }

    setDeviceInfo((prev) => ({
      ...prev,
      ...initialInfo,
      isReady: true, // Signal that the initial info is ready
    }))

    if (!isStandalone) {
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.addEventListener('appinstalled', handleAppInstalled)
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
