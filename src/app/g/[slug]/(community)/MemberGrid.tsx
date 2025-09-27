'use client'

import React from 'react'
import type { MemberWithUser } from '@/types'
import MemberCard from '@/components/MemberCard'
import { getGridClasses } from '@/lib/group-utils'

interface MemberGridProps {
  members: MemberWithUser[]
  isGroupAdmin?: boolean
  onRelate: (member: MemberWithUser) => void
  onConnect?: (member: MemberWithUser) => void
  currentUserId?: string
  groupSlug?: string
  gridSize: number
}

export default function MemberGrid({
  members,
  onRelate,
  gridSize,
  ...props
}: MemberGridProps) {
  return (
    <div className={getGridClasses(gridSize)}>
      {members.map((member, index) => (
        <MemberCard
          key={member.userId}
          member={member}
          onRelate={onRelate}
          allMembers={members}
          memberIndex={index}
          {...props}
        />
      ))}
    </div>
  )
}
