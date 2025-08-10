'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useSession } from 'next-auth/react'
import { getSecureImageUrl } from '@/lib/actions'

interface UserSessionContextType {
  imageUrl: string | null
}

const UserSessionContext = createContext<UserSessionContextType | undefined>(
  undefined
)

export function UserSessionProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession()
  const [imageUrl, setImageUrl] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'authenticated') {
      getSecureImageUrl(session.user?.image).then(setImageUrl)
    } else if (status === 'unauthenticated') {
      setImageUrl('/images/default-avatar.png')
    }
  }, [status, session])

  return (
    <UserSessionContext.Provider value={{ imageUrl }}>
      {children}
    </UserSessionContext.Provider>
  )
}

export function useUserSession() {
  const context = useContext(UserSessionContext)
  if (context === undefined) {
    throw new Error('useUserSession must be used within a UserSessionProvider')
  }
  return context
}
