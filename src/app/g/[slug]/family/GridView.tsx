'use client'

import { useGroup } from '@/components/GroupProvider'
import FamilyMemberCard from '@/components/FamilyMemberCard'

export default function GridView() {
  const { group, isGroupAdmin, currentUserMember } = useGroup()

  if (!group) return null

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {group.relatedMembers.map((member) => (
        <FamilyMemberCard
          key={member.userId}
          member={member}
          relationship={undefined} // This needs to be calculated
          onRelate={() => {}}
          currentUserId={currentUserMember?.userId}
          isGroupAdmin={isGroupAdmin}
          groupSlug={group.slug}
        />
      ))}
    </div>
  )
}
