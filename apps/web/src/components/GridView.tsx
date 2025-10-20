'use client'

import { useGroup } from '@/components/GroupProvider'
import BaseMemberCard from '@/components/BaseMemberCard'
import { getGridClasses } from '@/lib/group-utils'
import { MemberCardStrategy } from '@/lib/group-adapters/types'
import { MemberWithUser } from '@/types'

interface GridViewProps {
  members: MemberWithUser[]
  gridSize: number
  strategy: MemberCardStrategy
  relationshipMap: Map<string, { label: string; steps: number }>
  onRelate: (member: MemberWithUser) => void
  onConnect?: (member: MemberWithUser) => void
}

/**
 * Universal grid view component that works for all group types.
 * Uses strategy pattern to handle group-specific member card rendering.
 */
export default function GridView({
  members,
  gridSize,
  strategy,
  relationshipMap,
  onRelate,
  onConnect,
}: GridViewProps) {
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
          : relationshipMap.get(member.userId)?.label ||
            (group.groupType.code === 'family' ? 'Relative' : undefined)

        return (
          <BaseMemberCard
            key={member.userId}
            member={member}
            strategy={strategy}
            relationship={relationship}
            onRelate={onRelate}
            onConnect={onConnect}
            currentUserId={currentUserMember?.userId}
            currentUserFirstName={currentUserMember?.user.firstName || undefined}
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
