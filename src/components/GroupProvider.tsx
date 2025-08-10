'use client'

import { createContext, useContext } from 'react'
import { GroupData, MemberWithUser } from '@/types'

export interface GroupPageData {
  group: GroupData | null
  greetedMembers: MemberWithUser[]
  notGreetedMembers: MemberWithUser[]
  currentUserMember: MemberWithUser | undefined
  isSuperAdmin: boolean
  isGroupAdmin: boolean
  isAuthorizedMember: boolean
}

const GroupContext = createContext<GroupPageData>({
  group: null,
  greetedMembers: [],
  notGreetedMembers: [],
  currentUserMember: undefined,
  isSuperAdmin: false,
  isGroupAdmin: false,
  isAuthorizedMember: false,
})

export function GroupProvider({
  children,
  value,
}: {
  children: React.ReactNode
  value: GroupPageData
}) {
  return <GroupContext.Provider value={value}>{children}</GroupContext.Provider>
}

export function useGroup() {
  const context = useContext(GroupContext)
  if (context === undefined) {
    throw new Error('useGroup must be used within a GroupProvider')
  }
  return context
}
