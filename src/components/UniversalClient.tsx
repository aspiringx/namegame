'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import useLocalStorage from '@/hooks/useLocalStorage'
import { useGroup } from '@/components/GroupProvider'
import { GuestMessage } from '@/components/GuestMessage'
import GroupToolbar from '@/components/GroupToolbar'
import { getGridSizeConfig, getTourStyles, GroupPageSettings } from '@/lib/group-utils'
import { TourProvider, useTour } from '@reactour/tour'
import { useTheme } from 'next-themes'
import { MemberWithUser } from '@/types'
import { getGroupAdapter, getGroupTypeFromCode } from '@/lib/group-adapters/factory'
import { GroupAdapter } from '@/lib/group-adapters/types'
import BaseMemberCard from '@/components/BaseMemberCard'
import { getGridClasses } from '@/lib/group-utils'
import { TooltipProvider } from '@/components/ui/tooltip'

interface UniversalClientProps {
  view: 'grid' | 'tree' | 'games'
  initialMembers: MemberWithUser[]
  groupSlug: string
  initialMemberCount: number
  // Optional props for family-specific features
  initialRelationships?: any[]
  relationshipMap?: Map<string, { label: string; steps: number }>
}

interface UniversalClientContentProps extends Omit<UniversalClientProps, 'initialMemberCount'> {
  isMobile: boolean
  adapter: GroupAdapter
}

/**
 * Universal client content component
 * Uses adapter pattern to handle group-specific behavior
 */
function UniversalClientContent({
  initialMembers,
  view,
  groupSlug,
  isMobile,
  adapter,
  relationshipMap,
}: UniversalClientContentProps) {
  const groupContext = useGroup()
  const { setIsOpen } = useTour()
  const router = useRouter()

  // Get adapter-specific default settings
  const [settings, setSettings] = useLocalStorage<GroupPageSettings>(
    `namegame_universal-group-settings_${groupSlug}`,
    adapter.getDefaultSettings()
  )

  // Auto-adjust gridSize based on screen size (prevent hydration mismatch)
  useEffect(() => {
    const config = getGridSizeConfig(isMobile)
    if (settings.gridSize < config.min || settings.gridSize > config.max) {
      setSettings((prev) => ({ ...prev, gridSize: config.default }))
    }
  }, [isMobile, settings.gridSize, setSettings])

  // Get adapter-specific actions
  const actions = adapter.getActions()

  const handleSort = (key: string) => {
    actions.handleSort(key, settings, setSettings)
  }

  const handleSearchChange = (query: string) => {
    actions.handleSearch(query, setSettings)
  }

  // Filter and sort members (simplified version - would need full logic from original clients)
  const filteredAndSortedMembers = useMemo(() => {
    let sortedMembers = [...initialMembers]

    // Apply search filter
    if (settings.searchQuery) {
      sortedMembers = sortedMembers.filter((member) =>
        (member.user.name || '')
          .toLowerCase()
          .includes(settings.searchQuery.toLowerCase())
      )
    }

    // Apply photo filter
    if (settings.filterByRealPhoto) {
      sortedMembers = sortedMembers.filter(
        (member) =>
          member.user.photoUrl &&
          !member.user.photoUrl.includes('api.dicebear.com') &&
          !member.user.photoUrl.endsWith('default-avatar.png')
      )
    }

    // Basic sorting (would need full implementation)
    sortedMembers.sort((a, b) => {
      const { key, direction } = settings.sortConfig
      
      if (key === 'firstName' || key === 'lastName') {
        const aValue = a.user[key as 'firstName' | 'lastName'] || ''
        const bValue = b.user[key as 'firstName' | 'lastName'] || ''
        if (aValue < bValue) return direction === 'asc' ? -1 : 1
        if (aValue > bValue) return direction === 'asc' ? 1 : -1
        return 0
      }
      
      return 0 // Default no sorting
    })

    return sortedMembers
  }, [initialMembers, settings, relationshipMap])

  // Placeholder handlers - would need full implementation
  const handleOpenRelateModal = (member: MemberWithUser) => {
    console.log('Open relate modal for:', member.user.name)
    // This would trigger the appropriate modal based on group type
  }

  const handleOpenConnectModal = (member: MemberWithUser) => {
    console.log('Open connect modal for:', member.user.name)
    // This would trigger connection logic for community groups
  }

  if (!groupContext) {
    return null
  }

  const { group, isGroupAdmin, currentUserMember } = groupContext
  const strategy = adapter.getMemberCardStrategy()

  return (
    <>
      <GuestMessage
        isGuest={!currentUserMember || currentUserMember.role?.code === 'guest'}
        firstName={currentUserMember?.user?.firstName}
        groupName={group?.name}
        groupType={group?.groupType.code}
      />
      
      <div
        id="group-toolbar-container"
        className="bg-background border-border sticky top-16 z-10 border-b pt-1 pb-3"
      >
        <div className="container mx-auto px-4">
          <GroupToolbar
            settings={settings}
            setSettings={setSettings}
            handleSort={handleSort}
            setTourOpen={setIsOpen}
            isMobile={isMobile}
            viewMode={view}
            groupSlug={groupSlug}
            gridSizeConfig={getGridSizeConfig(isMobile)}
            config={adapter.getToolbarConfig(groupSlug)}
          />
          
          {/* Adapter-specific search input */}
          {view !== 'tree' && view !== 'games' && (
            adapter.renderSearchInput?.(settings, setSettings, initialMembers.length)
          )}
        </div>
      </div>

      <div className="container mx-auto mt-2 px-2 md:px-4">
        <TooltipProvider>
          {view === 'grid' && (
            <div className={getGridClasses(settings.gridSize)}>
              {filteredAndSortedMembers.map((member, index) => {
                const relationship = relationshipMap?.get(member.userId)?.label
                
                return (
                  <BaseMemberCard
                    key={member.userId}
                    member={member}
                    strategy={strategy}
                    relationship={relationship}
                    isGroupAdmin={isGroupAdmin}
                    currentUserId={currentUserMember?.userId}
                    groupSlug={groupSlug}
                    allMembers={filteredAndSortedMembers}
                    memberIndex={index}
                    onRelate={handleOpenRelateModal}
                    onConnect={handleOpenConnectModal}
                  />
                )
              })}
            </div>
          )}
          
          {/* Other views would be implemented here */}
          {view === 'tree' && (
            <div className="text-center py-8 text-gray-500">
              Tree view implementation needed
            </div>
          )}
          
          {view === 'games' && (
            <div className="text-center py-8 text-gray-500">
              Games view implementation needed
            </div>
          )}
        </TooltipProvider>
      </div>

      {/* Adapter-specific additional content */}
      {adapter.renderAdditionalContent?.()}
    </>
  )
}

/**
 * Universal client component that replaces both FamilyClient and CommunityClient
 * Uses strategy pattern to eliminate duplication
 */
export function UniversalClient(props: UniversalClientProps) {
  const { view } = props
  const { resolvedTheme } = useTheme()
  const [hasMounted, setHasMounted] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const groupContext = useGroup()

  useEffect(() => {
    setHasMounted(true)
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkIsMobile()
    window.addEventListener('resize', checkIsMobile)
    return () => window.removeEventListener('resize', checkIsMobile)
  }, [])

  // Get the appropriate adapter based on group type
  const adapter = useMemo(() => {
    if (!groupContext?.group?.groupType?.code) return null
    try {
      const groupType = getGroupTypeFromCode(groupContext.group.groupType.code)
      return getGroupAdapter(groupType)
    } catch (error) {
      console.error('Failed to get group adapter:', error)
      return null
    }
  }, [groupContext?.group?.groupType?.code])

  const tourSteps = useMemo(() => {
    if (!adapter) return []
    return adapter.getTourSteps(isMobile, view)
  }, [adapter, isMobile, view])

  if (!hasMounted || !adapter) {
    return (
      <div className="py-8 text-center text-gray-500 dark:text-gray-400">
        Loading...
      </div>
    )
  }

  return (
    <TourProvider
      key={view}
      steps={tourSteps}
      className="custom-tour"
      onClickMask={() => {}}
      styles={getTourStyles(isMobile, resolvedTheme)}
      showNavigation={true}
      showCloseButton={true}
      disableInteraction={true}
    >
      <UniversalClientContent
        {...props}
        isMobile={isMobile}
        adapter={adapter}
      />
    </TourProvider>
  )
}
