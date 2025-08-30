'use client'

import * as React from 'react'
import { ThemeProvider } from 'next-themes'
import { DeviceInfoProvider } from '@/context/DeviceInfoContext'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <DeviceInfoProvider>{children}</DeviceInfoProvider>
    </ThemeProvider>
  )
}
