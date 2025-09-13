'use client'

import { CommunityGroupData } from '@/types'
import { GuestMessage } from '@/components/GuestMessage'
import CommunityGroupClient from './CommunityGroupClient'
import { useState } from 'react'
import { useSession } from 'next-auth/react'

export default function CommunityGroupPageClient({
  groupData,
  view,
}: {
  groupData: CommunityGroupData;
  view: 'grid' | 'games';
}) {
  const { data: session } = useSession()
  const [isExpanded, setIsExpanded] = useState(false)
  if (!groupData) {
    return <div>Group not found.</div>
  }

  const { relatedMembers, notRelatedMembers, currentUserMember } = groupData

  const members = [...relatedMembers, ...notRelatedMembers]

  const isGuest = !currentUserMember || currentUserMember.role?.code === 'guest'

  return (
    <div className="container mx-auto mt-2 px-4 py-0">
      <GuestMessage
        isGuest={isGuest}
        firstName={session?.user?.firstName}
        groupName={groupData.name}
        groupType={groupData.groupType.code}
      />
      <CommunityGroupClient
        members={members}
        currentUserMember={currentUserMember}
        groupSlug={groupData.slug}
        view={view}
      />
    </div>
  )
}
