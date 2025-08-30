'use client'

import { useEffect } from 'react'
import { toast } from 'sonner'
import { useDeviceInfoContext } from '@/context/DeviceInfoContext'
import { Button } from './ui/button'
import { ArrowDownToLine, Share } from 'lucide-react'
import { useA2HS } from '@/context/A2HSContext'

const TOAST_ID = 'install-prompt'

// This is the content of the toast
// This is the content of the toast
function InstallPromptContent({ a2hs }: { a2hs: ReturnType<typeof useA2HS> }) {
  const deviceInfo = useDeviceInfoContext()

  if (!deviceInfo) {
    return null
  }

  const handleInstallClick = async () => {
    const outcome = await a2hs.promptToInstall()
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt')
    } else {
      console.log('User dismissed the install prompt')
    }
    a2hs.hidePrompt()
  }

  const isSafari = deviceInfo.browser === 'safari'

  return (
    <div className="text-muted-foreground flex items-center text-sm">
      {isSafari && <Share className="mr-2 h-6 w-6 flex-shrink-0 text-blue-500" />}
      <div className="flex flex-col">
        <span>{deviceInfo.a2hs.instructions}</span>
        <div className="mt-2 flex w-full flex-col gap-2">
          {deviceInfo.pwaPrompt.canInstall && (
            <Button className="w-full" onClick={handleInstallClick}>
              Install
            </Button>
          )}
          {deviceInfo.a2hs.canInstall && (
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => a2hs.hidePrompt()}
            >
              Dismiss
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// This component manages showing and hiding the toast
export function InstallAppPrompt() {
  const a2hs = useA2HS()
  const deviceInfo = useDeviceInfoContext()

  useEffect(() => {
    let toastId: string | number | undefined

    if (a2hs.isPromptVisible && deviceInfo?.a2hs.canInstall) {
      toastId = toast.message(deviceInfo.a2hs.actionLabel, {
        id: TOAST_ID,
        description: <InstallPromptContent a2hs={a2hs} />,
        duration: Infinity,
        dismissible: true,
      })
    }

    return () => {
      if (toastId) {
        toast.dismiss(toastId)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [a2hs.isPromptVisible, deviceInfo?.a2hs.canInstall])

  return null // This component only manages the toast, it doesn't render anything
}

