'use client';

import { GroupData } from '@/types';
import Link from 'next/link';
import GroupTabs from './GroupTabs';
import { useState } from 'react';

export default function GroupPageClient({ groupData }: { groupData: GroupData }) {
  const [isExpanded, setIsExpanded] = useState(false);
  if (!groupData) {
    return <div>Group not found.</div>;
  }

  const { sunDeckMembers, iceBlockMembers, currentUserMember, sunDeckCount, iceBlockCount } = groupData;

  return (
    <div className="container mx-auto px-4 py-0">
      <GroupTabs sunDeckMembers={sunDeckMembers} iceBlockMembers={iceBlockMembers} currentUserMember={currentUserMember} sunDeckCount={sunDeckCount} iceBlockCount={iceBlockCount} />
    </div>
  );
}
