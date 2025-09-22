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
  gridSize: number
}

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
  
  const gridClass = gridColsMap[gridSize] || 'grid-cols-4' // fallback
  return `${baseClasses} ${gridClass}`
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
