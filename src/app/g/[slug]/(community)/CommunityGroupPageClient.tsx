'use client'

import { CommunityGroupData } from '@/types'
import { GuestMessage } from '@/components/GuestMessage'
import { UniversalGroupClient } from '@/components/UniversalGroupClient'
import { useSession } from 'next-auth/react'

export default function CommunityGroupPageClient({
  groupData,
  view,
}: {
  groupData: CommunityGroupData
  view: 'grid' | 'games'
}) {
  const { data: session } = useSession()
  if (!groupData) {
    return <div>Group not found.</div>
  }

  const { relatedMembers, notRelatedMembers, currentUserMember } = groupData

  const members = [...relatedMembers, ...notRelatedMembers]

  const isGuest = !currentUserMember || currentUserMember.role?.code === 'guest'

  return (
    <>
      <GuestMessage
        isGuest={isGuest}
        firstName={session?.user?.firstName}
        groupName={groupData.name}
        groupType={groupData.groupType.code}
      />
      <UniversalGroupClient
        members={members}
        currentUserMember={currentUserMember}
        groupSlug={groupData.slug}
        groupType="community"
        view={view}
      />
    </>
  )
}
