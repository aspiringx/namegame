'use client'

import { createContext, useContext } from 'react'
import { FullRelationship, GroupData, MemberWithUser } from '@/types'

export interface GroupPageData {
  group: GroupData;
  relatedMembers: MemberWithUser[];
  notRelatedMembers: MemberWithUser[];
  currentUserMember: MemberWithUser | undefined;
  isSuperAdmin: boolean;
  isGroupAdmin: boolean;
  isAuthorizedMember: boolean;
  relationships?: FullRelationship[];
}

const GroupContext = createContext<GroupPageData | null>(null);

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
  if (!context) {
    throw new Error('useGroup must be used within a GroupProvider')
  }
  return context
}
