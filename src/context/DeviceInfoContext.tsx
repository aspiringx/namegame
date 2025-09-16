'use client'

import { createContext, useContext, ReactNode, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Cookies from 'js-cookie'
import { useDeviceInfo, DeviceInfo } from '@/hooks/useDeviceInfo'

export const DeviceInfoContext = createContext<DeviceInfo | null>(null)

export function DeviceInfoProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession()
  const deviceInfo = useDeviceInfo(session)

  useEffect(() => {
    const deviceType = deviceInfo.isMobile ? 'mobile' : 'desktop'
    Cookies.set('device_type', deviceType, { path: '/', sameSite: 'lax' })
  }, [deviceInfo.isMobile])

  return (
    <DeviceInfoContext.Provider value={deviceInfo}>
      {children}
    </DeviceInfoContext.Provider>
  )
}

export function useDeviceInfoContext() {
  const context = useContext(DeviceInfoContext)
  if (context === undefined) {
    throw new Error(
      'useDeviceInfoContext must be used within a DeviceInfoProvider',
    )
  }
  return context
}
