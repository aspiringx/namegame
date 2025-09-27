'use client'

import React from 'react'
import { useGroup } from '@/components/GroupProvider'
import GamesView from '@/components/GamesView'
import { useRouter } from 'next/navigation'
import type { FamilyGroupData, CommunityGroupData } from '@/types'

interface GamesPageClientProps {
  group: FamilyGroupData | CommunityGroupData
}

export default function GamesPageClient({ group }: GamesPageClientProps) {
  const router = useRouter()
  const groupContext = useGroup()
  const currentUserMember = groupContext?.currentUserMember
  const members = group.members || []

  const handleSwitchToGrid = () => {
    router.push(`/g/${group.slug}`)
  }

  return (
    <div className="container mx-auto mt-4 px-4">
      <GamesView
        members={members}
        groupSlug={group.slug}
        currentUserId={currentUserMember?.userId}
        onSwitchToGrid={handleSwitchToGrid}
      />
    </div>
  )
}
