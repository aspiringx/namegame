'use client';

import { createContext, useContext } from 'react';
import { GroupWithMembers } from '@/types';

const GroupContext = createContext<GroupWithMembers | null>(null);

export function GroupProvider({ children, group }: { children: React.ReactNode; group: GroupWithMembers | null }) {
  return <GroupContext.Provider value={group}>{children}</GroupContext.Provider>;
}

export function useGroup() {
  const context = useContext(GroupContext);
  // If the context is null (which it will be outside of a GroupProvider),
  // we return null. This allows components to conditionally render based
  // on whether they are in a group context or not.
  return context;
}
