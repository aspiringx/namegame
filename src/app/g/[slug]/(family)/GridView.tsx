'use client'

import { useGroup } from '@/components/GroupProvider'
import FamilyMemberCard from '@/components/FamilyMemberCard'
import {
  useFamilyGroupMembers,
  useFamilyGroupActions,
  useFamilyGroupData,
} from './FamilyGroupClient'

// Helper function to generate dynamic grid classes
const getGridClasses = (gridSize: number) => {
  const baseClasses = 'grid gap-4 md:gap-6'
  
  // Map gridSize to Tailwind grid-cols classes
  const gridColsMap: { [key: number]: string } = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
    7: 'grid-cols-7',
    8: 'grid-cols-8',
    9: 'grid-cols-9',
  }
  
  const gridClass = gridColsMap[gridSize] || 'grid-cols-3' // fallback
  return `${baseClasses} ${gridClass}`
}

interface GridViewProps {
  gridSize: number
}

export default function GridView({ gridSize }: GridViewProps) {
  const members = useFamilyGroupMembers()
  const { onOpenRelateModal } = useFamilyGroupActions()
  const { relationshipMap } = useFamilyGroupData()
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
