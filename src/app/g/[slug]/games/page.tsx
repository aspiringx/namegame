'use client'

import { FamilyGroupClient } from '../FamilyGroupClient'
import GamesView from '@/components/GamesView'
import { useGroup } from '@/components/GroupProvider'
import { FamilyGroupData } from '@/types'

export default function FamilyGamesPage() {
  const { group, currentUserMember } = useGroup()

  if (!group || !('members' in group)) {
    return null // or a loading indicator
  }

  // We've confirmed `members` exists, so we can safely cast to FamilyGroupData.
  const familyGroup = group as FamilyGroupData

  return (
    <FamilyGroupClient view="games">
      <GamesView
        members={familyGroup.members}
        groupSlug={familyGroup.slug}
        currentUserId={currentUserMember?.userId}
        onSwitchToGrid={() => {}}
      />
    </FamilyGroupClient>
  )
}
