'use client';

import { createContext, useContext } from 'react';
import { GroupData, MemberWithUser } from '@/types';

export interface GroupPageData {
  group: GroupData | null;
  sunDeckMembers: MemberWithUser[];
  iceBlockMembers: MemberWithUser[];
  currentUserMember: MemberWithUser | undefined;
  isSuperAdmin: boolean;
}

const GroupContext = createContext<GroupPageData>({
  group: null,
  sunDeckMembers: [],
  iceBlockMembers: [],
  currentUserMember: undefined,
  isSuperAdmin: false,
});

export function GroupProvider({ children, value }: { children: React.ReactNode; value: GroupPageData }) {
  return <GroupContext.Provider value={value}>{children}</GroupContext.Provider>;
}

export function useGroup() {
  const context = useContext(GroupContext);
  if (context === undefined) {
    throw new Error('useGroup must be used within a GroupProvider');
  }
  return context;
}
