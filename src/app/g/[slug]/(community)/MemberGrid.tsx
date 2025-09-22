'use client'

import React from 'react'
import type { MemberWithUser } from '@/types'
import MemberCard from '@/components/MemberCard'

interface MemberGridProps {
  members: MemberWithUser[]
  isGroupAdmin?: boolean
  onRelate: (member: MemberWithUser) => void
  onConnect?: (member: MemberWithUser) => void
  currentUserId?: string
  groupSlug?: string
}

export default function MemberGrid({
  members,
  onRelate,
  ...props
}: MemberGridProps) {
  return (
    // <div className="grid grid-cols-3 gap-4 md:grid-cols-6 md:gap-6 lg:grid-cols-9">
    // <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6 lg:grid-cols-6">
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
