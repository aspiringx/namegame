'use client'

import { useGroup } from '@/components/GroupProvider'
import FamilyMemberCard from '@/components/FamilyMemberCard'
import { useFamilyGroupMembers, useFamilyGroupActions, useFamilyGroupData } from './FamilyGroupClient'

export default function GridView() {
  const members = useFamilyGroupMembers()
  const { onOpenRelateModal } = useFamilyGroupActions()
  const { relationshipMap } = useFamilyGroupData()
  const groupContext = useGroup()

  if (!groupContext) {
    return null
  }

  const {
    group,
    isGroupAdmin,
    currentUserMember,
    relationships,
    relatedMembers,
    notRelatedMembers,
  } = groupContext

  if (!group) return null

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {members.map((member) => {
        if (!currentUserMember) return null

        const isCurrentUser = member.userId === currentUserMember.userId
        const relationship = isCurrentUser
          ? 'Me'
          : relationshipMap.get(member.userId)?.label || 'Relative'

        return (
          <FamilyMemberCard
            key={member.userId}
            member={member}
            relationship={relationship}
            onRelate={() => onOpenRelateModal(member)}
            currentUserId={currentUserMember?.userId}
            isGroupAdmin={isGroupAdmin}
            groupSlug={group.slug}
          />
        )
      })}
    </div>
  )
}
