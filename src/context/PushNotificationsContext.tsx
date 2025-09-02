'use client'

import { createContext, useContext, ReactNode } from 'react'
import { usePushNotifications } from '@/hooks/usePushNotifications'

type PushNotificationsContextType = ReturnType<typeof usePushNotifications>

const PushNotificationsContext = createContext<
  PushNotificationsContextType | undefined
>(undefined)

export function PushNotificationsProvider({ children }: { children: ReactNode }) {
  const pushState = usePushNotifications()
  return (
    <PushNotificationsContext.Provider value={pushState}>
      {children}
    </PushNotificationsContext.Provider>
  )
}

export function usePushNotificationsContext() {
  const context = useContext(PushNotificationsContext)
  if (context === undefined) {
    throw new Error(
      'usePushNotificationsContext must be used within a PushNotificationsProvider',
    )
  }
  return context
}
