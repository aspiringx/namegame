import { useEffect, useState } from 'react'

interface IBeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

export function useAddToHomescreenPrompt(): {
  prompt: IBeforeInstallPromptEvent | null
  promptToInstall: () => void
  isDesktop: boolean
  isMobile: boolean
  isMac: boolean
  isWindows: boolean
  isLinux: boolean
  isIos: boolean
  isAndroid: boolean
  isChrome: boolean
  isFirefox: boolean
  isSafari: boolean
} {
  const [prompt, setState] = useState<IBeforeInstallPromptEvent | null>(null)
  const [isDesktop, setIsDesktop] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isMac, setIsMac] = useState(false)
  const [isWindows, setIsWindows] = useState(false)
  const [isLinux, setIsLinux] = useState(false)
  const [isIos, setIsIos] = useState(false)
  const [isAndroid, setIsAndroid] = useState(false)
  const [isChrome, setIsChrome] = useState(false)
  const [isFirefox, setIsFirefox] = useState(false)
  const [isSafari, setIsSafari] = useState(false)

  const promptToInstall = () => {
    if (prompt) {
      return prompt.prompt()
    }
    return Promise.reject(
      new Error(
        'Tried installing before browser sent "beforeinstallprompt" event',
      ),
    )
  }

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase()

    // Platform
    const mobile = /iphone|ipad|ipod|android/.test(userAgent)
    setIsMobile(mobile)
    setIsDesktop(!mobile)

    // OS
    const mac = /mac os x/.test(userAgent)
    const windows = /windows/.test(userAgent)
    const linux = /linux/.test(userAgent)
    const ios = /iphone|ipad|ipod/.test(userAgent)
    const android = /android/.test(userAgent)
    setIsMac(mac)
    setIsWindows(windows)
    setIsLinux(linux)
    setIsIos(ios)
    setIsAndroid(android)

    // Browser
    const chrome = /chrome/.test(userAgent) && !/edg/.test(userAgent)
    const firefox = /firefox/.test(userAgent)
    const safari = /safari/.test(userAgent) && !/chrome/.test(userAgent)
    setIsChrome(chrome)
    setIsFirefox(firefox)
    setIsSafari(safari)

    const ready = (e: IBeforeInstallPromptEvent) => {
      e.preventDefault()
      setState(e)
    }

    // Don't show the prompt if the app is already installed
    if ('standalone' in window.navigator && (window.navigator as any).standalone) {
      return
    }

    window.addEventListener('beforeinstallprompt', ready as any)

    return () => {
      window.removeEventListener('beforeinstallprompt', ready as any)
    }
  }, [])

  return {
    prompt,
    promptToInstall,
    isDesktop,
    isMobile,
    isMac,
    isWindows,
    isLinux,
    isIos,
    isAndroid,
    isChrome,
    isFirefox,
    isSafari,
  }
}
