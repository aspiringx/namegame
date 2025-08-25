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
} {
  const [prompt, setState] = useState<IBeforeInstallPromptEvent | null>(null)
  const [isIOS, setIsIOS] = useState(false)
  const [isMacSafari, setIsMacSafari] = useState(false)

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
    const isIOS = () => {
      const userAgent = window.navigator.userAgent.toLowerCase()
      return /iphone|ipad|ipod/.test(userAgent)
    }
    // @ts-ignore
    const isInStandaloneMode = () => 'standalone' in window.navigator && window.navigator.standalone

    // Don't show the prompt if the app is already installed
    if (isInStandaloneMode()) {
      return
    }

    const isMac = () => /macintosh|macintel|macppc|mac68k/i.test(window.navigator.userAgent)
    const isSafari = () => /^((?!chrome|android).)*safari/i.test(navigator.userAgent)

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

  return { prompt, promptToInstall, isIOS, isMacSafari }
}
