'use client'

import { useGroup } from '@/components/GroupProvider'
import FamilyMemberCard from '@/components/FamilyMemberCard'
import { getGridClasses } from '@/lib/group-utils'
import {
  useFamilyMembers,
  useFamilyActions,
  useFamilyData,
} from './FamilyClient'

interface GridViewProps {
  gridSize: number
}

export default function GridView({ gridSize }: GridViewProps) {
  const members = useFamilyMembers()
  const { onOpenRelateModal } = useFamilyActions()
  const { relationshipMap } = useFamilyData()
  const groupContext = useGroup()

  if (!groupContext) {
    return null
  }

  const { group, isGroupAdmin, currentUserMember } = groupContext

  if (!group) return null

  return (
    <div className={getGridClasses(gridSize)}>
      {members.map((member, index) => {
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
            onRelate={onOpenRelateModal}
            currentUserId={currentUserMember?.userId}
            isGroupAdmin={isGroupAdmin}
            groupSlug={group.slug}
            allMembers={members}
            memberIndex={index}
          />
        )
      })}
    </div>
  )
}
