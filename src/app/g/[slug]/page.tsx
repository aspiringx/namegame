'use client';

import { useGroup } from '@/components/GroupProvider';
import GroupTabs from './GroupTabs';

export default function GroupPage() {
  const { sunDeckMembers, iceBlockMembers } = useGroup();

  return (
    <div className="container mx-auto px-4 py-8">
      <GroupTabs sunDeckMembers={sunDeckMembers} iceBlockMembers={iceBlockMembers} />
    </div>
  );
}
