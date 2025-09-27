'use client'

import React, { useState, useEffect } from 'react'
import { useGroup } from '@/components/GroupProvider'
import GamesView from '@/components/GamesView'
import GroupToolbar from '@/components/GroupToolbar'
import { useRouter } from 'next/navigation'
import type { FamilyGroupData, CommunityGroupData } from '@/types'
import { getCommunityGroupToolbarConfig } from '@/lib/group-toolbar-config'
import { getFamilyGroupToolbarConfig } from '@/lib/group-toolbar-config'
import { getGridSizeConfig } from '@/lib/group-utils'
import { GroupPageSettings } from '@/lib/group-utils'

interface GamesClientProps {
  group: FamilyGroupData | CommunityGroupData
}

export default function GamesClient({ group }: GamesClientProps) {
  const router = useRouter()
  const groupContext = useGroup()
  const currentUserMember = groupContext?.currentUserMember
  const members = group.members || []
  const [isMobile, setIsMobile] = useState(false)
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkIsMobile()
    window.addEventListener('resize', checkIsMobile)
    return () => window.removeEventListener('resize', checkIsMobile)
  }, [])

  // Minimal settings for games view (toolbar won't use most of these)
  const [settings, setSettings] = useState<GroupPageSettings>({
    sortConfig: { key: 'name', direction: 'asc' as const },
    searchQuery: '',
    filterByRealPhoto: false,
    filterConnectedStatus: 'all' as const,
    gridSize: 4,
  })

  const handleSwitchToGrid = () => {
    router.push(`/g/${group.slug}`)
  }

  const handleSort = () => {
    // No-op for games view
  }

  const setTourOpen = () => {
    // No-op for games view
  }

  const toolbarConfig =
    group.groupType?.code === 'family'
      ? getFamilyGroupToolbarConfig(group.slug)
      : getCommunityGroupToolbarConfig(group.slug)

  if (!hasMounted) {
    return (
      <div className="py-8 text-center text-gray-500 dark:text-gray-400">
        Loading...
      </div>
    )
  }

  return (
    <>
      <div className="bg-background border-border sticky top-16 z-10 border-b py-1">
        <div className="container mx-auto px-4">
          <div className="my-1">
            <GroupToolbar
              settings={settings}
              setSettings={setSettings}
              handleSort={handleSort}
              setTourOpen={setTourOpen}
              viewMode="games"
              groupSlug={group.slug}
              isMobile={isMobile}
              gridSizeConfig={getGridSizeConfig(isMobile)}
              config={toolbarConfig}
            />
          </div>
        </div>
      </div>
      <div className="container mx-auto mt-4 px-4">
        <GamesView
          members={members}
          groupSlug={group.slug}
          currentUserId={currentUserMember?.userId}
          onSwitchToGrid={handleSwitchToGrid}
        />
      </div>
    </>
  )
}
