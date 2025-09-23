'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import GamesView from '@/components/GamesView'
import { useGroup } from '@/components/GroupProvider'
import useLocalStorage from '@/hooks/useLocalStorage'
import FamilyGroupToolbar from '../(family)/GroupToolbar'
import CommunityGroupToolbar from '../(community)/GroupToolbar'
import type { FamilyGroupData, CommunityGroupData } from '@/types'

// Helper function to get responsive grid size ranges and defaults
const getGridSizeConfig = (isMobile: boolean) => {
  if (isMobile) {
    return { min: 1, max: 3, default: 2 }
  } else {
    return { min: 2, max: 9, default: 6 }
  }
}

// Define a unified settings type that can accommodate both toolbars
interface GamesPageSettings {
  sortConfig: {
    key: string
    direction: 'asc' | 'desc'
  }
  searchQuery: string
  filterByRealPhoto: boolean
  filterConnectedStatus: 'all' | 'connected' | 'not_connected'
  gridSize: number
}

interface GamesPageClientProps {
  group: FamilyGroupData | CommunityGroupData
}

export default function GamesPageClient({ group }: GamesPageClientProps) {
  const router = useRouter()
  const groupContext = useGroup()
  const currentUserMember = groupContext?.currentUserMember
  const isFamilyGroup = group.groupType.code === 'family'

  const [settings, setSettings] = useLocalStorage<GamesPageSettings>(
    `namegame_${group.groupType.code}-group-settings_${group.slug}`,
    {
      searchQuery: '',
      sortConfig: {
        key: isFamilyGroup ? 'closest' : 'when_connected',
        direction: 'asc',
      },
      filterByRealPhoto: true,
      filterConnectedStatus: 'all',
      gridSize: 4, // Safe middle-ground default for SSR
    },
  )

  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const checkIsMobile = () => setIsMobile(window.innerWidth < 768)
    checkIsMobile()
    window.addEventListener('resize', checkIsMobile)
    return () => window.removeEventListener('resize', checkIsMobile)
  }, [])

  const handleSort = (key: string) => {
    setSettings((prev) => {
      const isSameKey = prev.sortConfig.key === key
      const newDirection = isSameKey
        ? prev.sortConfig.direction === 'asc'
          ? 'desc'
          : 'asc'
        : 'asc'
      return { ...prev, sortConfig: { key, direction: newDirection } }
    })
  }

  const handleSwitchToGrid = () => router.push(`/g/${group.slug}`)

  const members = group.members || []

  return (
    <div>
      <div className="bg-background border-border sticky top-16 z-10 border-b py-1">
        <div className="container mx-auto px-4">
          {isFamilyGroup ? (
            <FamilyGroupToolbar
              settings={settings as any} // Cast because the union is complex
              setSettings={setSettings as any}
              handleSort={handleSort as any}
              setTourOpen={() => {}} // Tour not implemented on this page
              isMobile={isMobile}
              viewMode="games"
              groupSlug={group.slug}
              gridSizeConfig={getGridSizeConfig(isMobile)}
            />
          ) : (
            <CommunityGroupToolbar
              settings={settings as any} // Cast because the union is complex
              setSettings={setSettings as any}
              handleSort={handleSort as any}
              setTourOpen={() => {}} // Tour not implemented on this page
              viewMode="games"
              groupSlug={group.slug}
              isMobile={isMobile}
              gridSizeConfig={getGridSizeConfig(isMobile)}
            />
          )}
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
    </div>
  )
}
