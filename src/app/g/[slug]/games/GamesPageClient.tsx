'use client'

import { useGroup } from '@/components/GroupProvider'
import { UniversalGroupClient } from '@/components/UniversalGroupClient'
import type { FamilyGroupData, CommunityGroupData } from '@/types'

interface GamesPageClientProps {
  group: FamilyGroupData | CommunityGroupData
}

export default function GamesPageClient({ group }: GamesPageClientProps) {
  const groupContext = useGroup()
  const currentUserMember = groupContext?.currentUserMember
  const isFamilyGroup = group.groupType.code === 'family'
  const members = group.members || []

  return (
    <UniversalGroupClient
      members={members}
      groupSlug={group.slug}
      groupType={isFamilyGroup ? 'family' : 'community'}
      currentUserMember={currentUserMember}
      view="games"
    />
  )
}
