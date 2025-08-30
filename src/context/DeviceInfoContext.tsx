'use client'

import { createContext, useContext, ReactNode } from 'react'
import { useDeviceInfo, DeviceInfo } from '@/hooks/useDeviceInfo'


export const DeviceInfoContext = createContext<DeviceInfo | null>(null)

export function DeviceInfoProvider({ children }: { children: ReactNode }) {
  const deviceInfo = useDeviceInfo()

  return (
    <DeviceInfoContext.Provider value={deviceInfo}>
      {children}
    </DeviceInfoContext.Provider>
  )
}

export function useDeviceInfoContext() {
  const context = useContext(DeviceInfoContext)
  if (context === undefined) {
    throw new Error('useDeviceInfoContext must be used within a DeviceInfoProvider')
  }
  return context
}
