'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react'
import { toast } from 'sonner'
import { InstallAppPrompt } from '@/components/InstallAppPrompt'
import { NAMEGAME_PWA_PROMPT_DISMISSED_KEY } from '@/lib/constants'
import { useDeviceInfoContext } from '@/context/DeviceInfoContext'

interface A2HSContextType {
  isPromptVisible: boolean
  showPrompt: () => void
  hidePrompt: (userInitiated?: boolean) => void
  promptToInstall: () => Promise<'accepted' | 'dismissed'>
}

const A2HSContext = createContext<A2HSContextType | undefined>(undefined)

export const A2HSProvider = ({ children }: { children: ReactNode }) => {
  const [isPromptVisible, setIsPromptVisible] = useState(false)
  const deviceInfo = useDeviceInfoContext()


  const showPrompt = () => {
    setIsPromptVisible(true)
  }

  const hidePrompt = (userInitiated = true) => {
    if (userInitiated) {
      localStorage.setItem(NAMEGAME_PWA_PROMPT_DISMISSED_KEY, 'true')
    }
    setIsPromptVisible(false)
  }

  const promptToInstall = async () => {
    if (deviceInfo?.pwaPrompt.canInstall) {
      return await deviceInfo.pwaPrompt.prompt()
    }
    return Promise.resolve<'accepted' | 'dismissed'>('dismissed')
  }

  useEffect(() => {
    if (!deviceInfo?.isReady) return

    const shouldAutoShow =
      !deviceInfo.isPWAInstalled && deviceInfo.a2hs.canInstall

    if (shouldAutoShow) {
      const dismissed =
        localStorage.getItem(NAMEGAME_PWA_PROMPT_DISMISSED_KEY) === 'true'
      if (!dismissed) {
        showPrompt()
      }
    }
  }, [deviceInfo?.isReady, deviceInfo?.a2hs.canInstall, deviceInfo?.pwaPrompt?.isReady])

  return (
    <A2HSContext.Provider
      value={{ isPromptVisible, showPrompt, hidePrompt, promptToInstall }}
    >
      {children}
    </A2HSContext.Provider>
  )
}

export function useA2HS() {
  const context = useContext(A2HSContext)
  if (context === undefined) {
    throw new Error('useA2HS must be used within an A2HSProvider')
  }
  return context
}
