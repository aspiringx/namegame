'use client'

import { GroupData } from '@/types'
import { GuestMessage } from '@/components/GuestMessage'
import Link from 'next/link'
import GroupTabs from './GroupTabs'
import { useState } from 'react'
import { useSession } from 'next-auth/react'

export default function GroupPageClient({
  groupData,
}: {
  groupData: GroupData
}) {
  const { data: session } = useSession()
  const [isExpanded, setIsExpanded] = useState(false)
  if (!groupData) {
    return <div>Group not found.</div>
  }

  const {
    greetedMembers,
    notGreetedMembers,
    currentUserMember,
    greetedCount,
    notGreetedCount,
  } = groupData

  const isGuest = !currentUserMember || currentUserMember.role?.code === 'guest'

  return (
    <div className="container mx-auto mt-4 px-4 py-0">
      <GuestMessage
        isGuest={isGuest}
        firstName={session?.user?.firstName}
        groupName={groupData.name}
        groupType={groupData.groupType.code}
      />
      <GroupTabs
        greetedMembers={greetedMembers}
        notGreetedMembers={notGreetedMembers}
        currentUserMember={currentUserMember}
        greetedCount={greetedCount}
        notGreetedCount={notGreetedCount}
        groupSlug={groupData.slug}
      />
    </div>
  )
}
