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

export default function MemberGrid({ members, ...props }: MemberGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {members.map((member) => (
        <MemberCard key={member.userId} member={member} {...props} />
      ))}
    </div>
  )
}
