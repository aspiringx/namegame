'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface A2HSContextType {
  isPromptVisible: boolean
  showPrompt: () => void
  hidePrompt: () => void
}

const A2HSContext = createContext<A2HSContextType | undefined>(undefined)

export function A2HSProvider({ children }: { children: ReactNode }) {
  const [isPromptVisible, setPromptVisible] = useState(false)

  const showPrompt = () => setPromptVisible(true)
  const hidePrompt = () => setPromptVisible(false)

  return (
    <A2HSContext.Provider value={{ isPromptVisible, showPrompt, hidePrompt }}>
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
