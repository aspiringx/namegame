'use client'

import { useEffect } from 'react'
import { toast } from 'sonner'
import { useDeviceInfoContext } from '@/context/DeviceInfoContext'
import { Button } from './ui/button'
import { ArrowDownToLine, Share } from 'lucide-react'
import { useA2HS } from '@/context/A2HSContext'

const TOAST_ID = 'install-prompt'

// This is the content of the toast
function InstallPromptContent({ a2hs }: { a2hs: ReturnType<typeof useA2HS> }) {
  const deviceInfo = useDeviceInfoContext()

  if (!deviceInfo) return null

  const handleInstallClick = () => {
    if (deviceInfo?.pwaPrompt.isReady) {
      deviceInfo.pwaPrompt.prompt()
    }
    a2hs.hidePrompt()
  }

  const isSafari = deviceInfo.browser === 'safari'
  const showInstallButton = deviceInfo.pwaPrompt.canInstall

  return (
    <div className="flex flex-col gap-2">
      <div>
        <div className="font-semibold">{deviceInfo.a2hs.actionLabel}</div>
        <div className="flex items-center text-sm text-muted-foreground">
          {isSafari && (
            <Share className="mr-2 h-6 w-6 flex-shrink-0 text-blue-500" />
          )}
          <span>{deviceInfo.a2hs.instructions}</span>
        </div>
      </div>
      <div className="flex w-full justify-end gap-2">
        {deviceInfo.a2hs.canInstall && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => a2hs.hidePrompt()}
          >
            Dismiss
          </Button>
        )}
        {showInstallButton && (
          <Button size="sm" onClick={handleInstallClick}>
            <ArrowDownToLine className="mr-2 h-4 w-4" />
            Install
          </Button>
        )}
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
      toastId = toast(<InstallPromptContent a2hs={a2hs} />, {
        id: TOAST_ID,
        duration: Infinity,
        dismissible: true,
        classNames: {
          content: 'w-full',
        },
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

