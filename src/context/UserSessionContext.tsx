'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react'
import { useSession } from 'next-auth/react'
import { getSecureImageUrl } from '@/lib/actions'
import { getRecentGroups } from '@/actions/auth'

interface RecentGroup {
  name: string
  slug: string
}

interface UserSessionContextType {
  imageUrl: string | null
  recentGroups: RecentGroup[]
}

const UserSessionContext = createContext<UserSessionContextType | undefined>(
  undefined,
)

export function UserSessionProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession()
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [recentGroups, setRecentGroups] = useState<RecentGroup[]>([])

  useEffect(() => {
    if (status === 'authenticated') {
      getSecureImageUrl(session.user?.image).then(setImageUrl)
      getRecentGroups().then((result) => {
        if (result.groups) {
          setRecentGroups(result.groups as RecentGroup[])
        }
      })
    } else if (status === 'unauthenticated') {
      setImageUrl('/images/default-avatar.png')
      setRecentGroups([])
    }
  }, [status, session])

  return (
    <UserSessionContext.Provider value={{ imageUrl, recentGroups }}>
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
