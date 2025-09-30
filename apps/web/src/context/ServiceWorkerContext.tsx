'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface ServiceWorkerContextType {
  registration: ServiceWorkerRegistration | null
  isReady: boolean
}

const ServiceWorkerContext = createContext<ServiceWorkerContextType | undefined>(
  undefined,
)

export function ServiceWorkerProvider({ children }: { children: ReactNode }) {
  const [registration, setRegistration] =
    useState<ServiceWorkerRegistration | null>(null)
  const [isReady, setIsReady] = useState(false)

  const value = {
    registration,
    isReady,
    // Internal setters, not exposed to consumers
    _setRegistration: setRegistration,
    _setIsReady: setIsReady,
  }

  return (
    <ServiceWorkerContext.Provider value={value as any}>
      {children}
    </ServiceWorkerContext.Provider>
  )
}

export function useServiceWorker() {
  const context = useContext(ServiceWorkerContext)
  if (context === undefined) {
    throw new Error(
      'useServiceWorker must be used within a ServiceWorkerProvider',
    )
  }
  // Return the public-facing value
  const { registration, isReady } = context
  return { registration, isReady }
}

// Internal hook for the registrar to access setters
export function useServiceWorkerRegistrar() {
  const context = useContext(ServiceWorkerContext)
  if (context === undefined) {
    throw new Error(
      'useServiceWorkerRegistrar must be used within a ServiceWorkerProvider',
    )
  }
  return context as ServiceWorkerContextType & {
    _setRegistration: (reg: ServiceWorkerRegistration | null) => void
    _setIsReady: (ready: boolean) => void
  }
}
