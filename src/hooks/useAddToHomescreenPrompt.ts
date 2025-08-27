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
  isIOS: boolean
  isMacSafari: boolean
  isIosFirefox: boolean
  isAndroidFirefox: boolean
} {
  const [prompt, setState] = useState<IBeforeInstallPromptEvent | null>(null)
  const [isIOS, setIsIOS] = useState(false)
  const [isMacSafari, setIsMacSafari] = useState(false)
  const [isIosFirefox, setIosFirefox] = useState(false)
  const [isAndroidFirefox, setAndroidFirefox] = useState(false)

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
    const userAgent = window.navigator.userAgent.toLowerCase()
    const isIOS = () => /iphone|ipad|ipod/.test(userAgent)
    const isAndroid = () => /android/.test(userAgent)
    const isFirefox = () => /firefox/.test(userAgent)
    // @ts-ignore
    const isInStandaloneMode = () => 'standalone' in window.navigator && window.navigator.standalone

    // Don't show the prompt if the app is already installed
    if (isInStandaloneMode()) {
      return
    }

    const isMac = () => /macintosh|macintel|macppc|mac68k/i.test(window.navigator.userAgent)
    const isSafari = () => /^((?!chrome|android).)*safari/i.test(navigator.userAgent)

    if (isIOS() && isFirefox()) {
      setIosFirefox(true)
      // Still set isIOS to true so we can group logic if needed
      setIsIOS(true)
      return
    }

    if (isAndroid() && isFirefox()) {
      setAndroidFirefox(true)
      return
    }

    if (isIOS()) {
      setIsIOS(true)
      return
    }

    if (isMac() && isSafari()) {
      setIsMacSafari(true)
      return
    }

    const ready = (e: IBeforeInstallPromptEvent) => {
      e.preventDefault()
      setState(e)
    }

    window.addEventListener('beforeinstallprompt', ready as any)

    return () => {
      window.removeEventListener('beforeinstallprompt', ready as any)
    }
  }, [])

  return {
    prompt,
    promptToInstall,
    isIOS,
    isMacSafari,
    isIosFirefox,
    isAndroidFirefox,
  }
}
