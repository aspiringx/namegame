'use client';

'use client';

import { createContext, useContext } from 'react';
import { GroupWithMembers } from '@/types';
import { Group, GroupUser, User } from '@/generated/prisma';

export interface GroupPageData {
  group: Group | null;
  sunDeckMembers: GroupWithMembers['members'];
  iceBlockMembers: GroupWithMembers['members'];
  currentUserMembership: (GroupUser & { user: User }) | undefined;
}

const GroupContext = createContext<GroupPageData>({
  group: null,
  sunDeckMembers: [],
  iceBlockMembers: [],
  currentUserMembership: undefined,
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
