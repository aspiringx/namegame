'use client'

import { useEffect, useState } from 'react'
import { Session } from 'next-auth'

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
  | 'samsung'
  | 'brave'
  | 'unknown'

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
    instructions: string
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
      actionLabel: 'Install App',
      instructions:
        'Tap the Share icon, then "Add to Home Screen" to easily return.',
    },
  },
  android: {
    firefox: {
      isSupported: true,
      canInstall: (isStandalone) => !isStandalone,
      actionLabel: 'Install App',
      instructions:
        'Tap the menu button (⋮), then "Install" to add to your home screen.',
    },
    chrome: {
      isSupported: true,
      canInstall: (isStandalone, wasInstalled) =>
        !isStandalone && !wasInstalled,
      actionLabel: 'Install App',
      instructions: 'Install this app to your home screen to easily return.',
    },
    brave: {
      isSupported: true,
      canInstall: (isStandalone, wasInstalled) =>
        !isStandalone && !wasInstalled,
      actionLabel: 'Install App',
      instructions: 'Install this app to your home screen to easily return.',
    },
    edge: {
      isSupported: true,
      canInstall: (isStandalone, wasInstalled) =>
        !isStandalone && !wasInstalled,
      actionLabel: 'Install App',
      instructions: 'Install this app to your home screen to easily return.',
    },
    samsung: {
      isSupported: true,
      canInstall: (isStandalone, wasInstalled) =>
        !isStandalone && !wasInstalled,
      actionLabel: 'Install App',
      instructions:
        'Tap the download icon in the address bar, or find "Add page to" in the menu.',
    },
    // Wildcard for other Chromium-based browsers on Android
    '*': {
      isSupported: true,
      canInstall: (isStandalone, wasInstalled) =>
        !isStandalone && !wasInstalled,
      actionLabel: 'Install App',
      instructions:
        'Find the "Install" or "Add to Home Screen" option in your browser\'s menu.',
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
      canInstall: (isStandalone, wasInstalled) =>
        !isStandalone && !wasInstalled,
      actionLabel: 'Install App',
      instructions: 'Install this app to easily return.',
    },
  },
  macos: {
    safari: {
      isSupported: true,
      canInstall: (isStandalone) => !isStandalone,
      actionLabel: 'Install App',
      instructions:
        'Click the Share icon, then "Add to Dock" to easily return.',
    },
    firefox: {
      isSupported: true,
      canInstall: (isStandalone) => !isStandalone,
      actionLabel: 'Bookmark',
      instructions: 'Press Cmd-D to bookmark this page.',
    },
    '*': {
      isSupported: true,
      canInstall: (isStandalone, wasInstalled) =>
        !isStandalone && !wasInstalled,
      actionLabel: 'Install App',
      instructions: 'Install this app to easily return.',
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
      canInstall: (isStandalone, wasInstalled) =>
        !isStandalone && !wasInstalled,
      actionLabel: 'Install App',
      instructions: 'Install this app to easily return.',
    },
  },
}

type NotificationRule = {
  instructions: string
  pwaInstructions?: string
}

const NOTIFICATIONS_INSTRUCTIONS_MATRIX: {
  [os: string]: { [browser: string]: NotificationRule }
} = {
  '*': {
    '*': {
      instructions:
        'To enable notifications, please check your browser and system settings for this site.',
    },
    chrome: {
      instructions:
        'Click the icon to the left of the address bar (often a 🔒) to open site settings, then toggle on Notifications.',
      pwaInstructions:
        'Click the ⋮ menu in the top-right corner, select "App Info", and set Notifications to "Allow".',
    },
    firefox: {
      instructions:
        'Click the lock icon (🔒) in the address bar, find the "Permissions" section, and change Notifications to "Allow".',
    },
    edge: {
      instructions:
        'Click the lock icon (🔒) in the address bar, select "Permissions for this site", and set Notifications to "Allow".',
    },
    safari: {
      instructions:
        'Go to Safari > Settings > Websites > Notifications, find this site, and select "Allow".',
    },
  },
  android: {
    '*': {
      instructions:
        'Go to your browser settings, find "Site Settings" > "Notifications", and allow notifications for this site.',
    },
    chrome: {
      instructions:
        'Tap the lock icon (🔒) in the address bar, then go to Permissions > Notifications and select "Allow".',
    },
  },
  ios: {
    '*': {
      instructions:
        'To enable notifications, add this app to your Home Screen from the Safari Share menu. Then, manage permissions in your device Settings.',
    },
  },
}

const NOTIFICATIONS_FALLBACK_RULE: NotificationRule = {
  instructions:
    'To enable notifications, please check your browser settings for this site.',
}

const A2HS_FALLBACK_RULE: A2HSRule = {
  isSupported: false,
  canInstall: () => false,
  actionLabel: 'Bookmark',
  instructions: 'Bookmark this page for easy access.',
}

/**
 * Looks up the A2HS configuration from the feature matrix.
 */
function getNotificationConfig(os: string, browser: string) {
  const osRules =
    NOTIFICATIONS_INSTRUCTIONS_MATRIX[
      os as keyof typeof NOTIFICATIONS_INSTRUCTIONS_MATRIX
    ] || NOTIFICATIONS_INSTRUCTIONS_MATRIX['*']
  if (!osRules) {
    return NOTIFICATIONS_FALLBACK_RULE
  }
  const rule = osRules[browser as keyof typeof osRules] || osRules['*']
  return rule || NOTIFICATIONS_FALLBACK_RULE
}

function getA2hsConfig(os: string, browser: string) {
  const osRules = A2HS_FEATURE_MATRIX[os as keyof typeof A2HS_FEATURE_MATRIX]
  if (!osRules) {
    return A2HS_FALLBACK_RULE
  }
  const rule = osRules[browser as keyof typeof osRules] || osRules['*']
  return rule || A2HS_FALLBACK_RULE
}

export function useDeviceInfo(_session: Session | null): DeviceInfo {
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
      instructions: '',
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
        instructions: '',
      },
    }

    // --- Derive A2HS logic from the matrix ---
    const notificationsConfig = getNotificationConfig(os, browser)
    initialInfo.push.instructions =
      isStandalone && notificationsConfig.pwaInstructions
        ? notificationsConfig.pwaInstructions
        : notificationsConfig.instructions

    const a2hsConfig = getA2hsConfig(os, browser)
    initialInfo.a2hs = {
      isSupported: a2hsConfig.isSupported,
      canInstall: a2hsConfig.canInstall(isStandalone, wasInstalled),
      actionLabel: a2hsConfig.actionLabel,
      instructions: a2hsConfig.instructions,
    }

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
