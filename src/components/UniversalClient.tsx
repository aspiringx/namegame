'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import useLocalStorage from '@/hooks/useLocalStorage'
import { useGroup } from '@/components/GroupProvider'
import { GuestMessage } from '@/components/GuestMessage'
import GroupToolbar from '@/components/GroupToolbar'
import {
  getGridSizeConfig,
  getTourStyles,
  GroupPageSettings,
} from '@/lib/group-utils'
import { TourProvider, useTour } from '@reactour/tour'
import { useTheme } from 'next-themes'
import { MemberWithUser } from '@/types'
import {
  getGroupAdapter,
  getGroupTypeFromCode,
} from '@/lib/group-adapters/factory'
import { GroupAdapter } from '@/lib/group-adapters/types'
import GridView from '@/components/GridView'
import { TooltipProvider } from '@/components/ui/tooltip'
import { getRelationship } from '@/lib/family-tree'
import RelateModal from '@/components/RelateModal'
import { getMemberRelations } from '@/lib/actions'
import { createAcquaintanceRelationship } from '@/app/g/[slug]/(community)/actions'
import Modal from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { FocalUserSearch } from '@/app/g/[slug]/(family)/FocalUserSearch'
import GamesView from '@/components/GamesView'

interface UniversalClientProps {
  view: 'grid' | 'tree' | 'games'
  initialMembers: MemberWithUser[]
  groupSlug: string
  initialMemberCount: number
  // Optional props for family-specific features
  initialRelationships?: any[]
}

interface UniversalClientContentProps
  extends Omit<UniversalClientProps, 'initialMemberCount'> {
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
  initialRelationships,
}: UniversalClientContentProps) {
  const groupContext = useGroup()
  const { setIsOpen } = useTour()
  const router = useRouter()

  // Modal state
  const [isRelateModalOpen, setIsRelateModalOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<MemberWithUser | null>(
    null,
  )
  const [memberRelations, setMemberRelations] = useState<any[]>([])

  // Connect modal state
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false)
  const [memberToConnect, setMemberToConnect] = useState<MemberWithUser | null>(
    null,
  )

  // Tree view state
  const [isResetDisabled, setIsResetDisabled] = useState(true)
  const treeRef = useRef<any>(null)

  // Get adapter-specific default settings
  const [settings, setSettings] = useLocalStorage<GroupPageSettings>(
    `namegame_universal-group-settings_${groupSlug}`,
    adapter.getDefaultSettings(),
  )

  // Auto-adjust gridSize based on screen size (prevent hydration mismatch)
  useEffect(() => {
    const config = getGridSizeConfig(isMobile)
    if (settings.gridSize < config.min || settings.gridSize > config.max) {
      setSettings((prev) => ({ ...prev, gridSize: config.default }))
    }
  }, [isMobile, settings.gridSize, setSettings])

  // Calculate relationship map for family groups (similar to original FamilyClient)
  const relationshipMap = useMemo(() => {
    if (
      !groupContext?.currentUserMember ||
      !initialRelationships ||
      groupContext.group?.groupType?.code !== 'family'
    ) {
      return new Map<string, { label: string; steps: number }>()
    }

    const newMap = new Map<string, { label: string; steps: number }>()
    const usersMap = new Map(
      initialMembers.map((member) => [member.userId, member.user]),
    )

    for (const alter of initialMembers) {
      if (alter.userId === groupContext.currentUserMember.userId) continue
      const result = getRelationship(
        groupContext.currentUserMember.userId,
        alter.userId,
        initialRelationships,
        initialMembers,
        usersMap,
      )
      if (result && result.relationship) {
        newMap.set(alter.userId, {
          label: result.relationship,
          steps: result.steps,
        })
      }
    }
    return newMap
  }, [
    groupContext?.currentUserMember,
    initialRelationships,
    initialMembers,
    groupContext?.group?.groupType?.code,
  ])

  // Get adapter-specific actions
  const actions = adapter.getActions()

  const handleSort = (key: string) => {
    actions.handleSort(key, settings, setSettings)
  }

  const handleSearchChange = (query: string) => {
    actions.handleSearch(query, setSettings)
  }

  // Filter and sort members with multi-level sorting
  const filteredAndSortedMembers = useMemo(() => {
    let sortedMembers = [...initialMembers]

    // Apply search filter
    if (settings.searchQuery) {
      sortedMembers = sortedMembers.filter((member) =>
        (member.user.name || '')
          .toLowerCase()
          .includes(settings.searchQuery.toLowerCase()),
      )
    }

    // Apply photo filter
    if (settings.filterByRealPhoto) {
      sortedMembers = sortedMembers.filter(
        (member) =>
          member.user.photoUrl &&
          !member.user.photoUrl.includes('api.dicebear.com') &&
          !member.user.photoUrl.endsWith('default-avatar.png'),
      )
    }

    // Apply connection filter (group-type specific)
    if (settings.filterConnectedStatus !== 'all') {
      sortedMembers = sortedMembers.filter((member) => {
        let isConnected = false

        if (groupContext?.group?.groupType?.code === 'community') {
          // Community groups: use connectedAt (acquaintance relationships)
          isConnected = !!member.connectedAt
        } else if (groupContext?.group?.groupType?.code === 'family') {
          // Family groups: use relationship map (family relationships)
          isConnected = relationshipMap.has(member.userId)
        }

        if (settings.filterConnectedStatus === 'connected') {
          return isConnected
        } else if (settings.filterConnectedStatus === 'not_connected') {
          return !isConnected
        }
        return true
      })
    }

    // Multi-level sorting with proper secondary sorts
    sortedMembers.sort((a, b) => {
      const { key, direction } = settings.sortConfig

      // Primary sort by the selected key
      let primaryResult = 0

      if (key === 'firstName' || key === 'lastName') {
        const aValue = a.user[key as 'firstName' | 'lastName'] || ''
        const bValue = b.user[key as 'firstName' | 'lastName'] || ''
        if (aValue < bValue) primaryResult = direction === 'asc' ? -1 : 1
        else if (aValue > bValue) primaryResult = direction === 'asc' ? 1 : -1
      } else if (key === 'closest' && relationshipMap.size > 0) {
        const aSteps = relationshipMap.get(a.userId)?.steps ?? 999
        const bSteps = relationshipMap.get(b.userId)?.steps ?? 999
        if (aSteps !== bSteps) {
          primaryResult =
            direction === 'asc' ? aSteps - bSteps : bSteps - aSteps
        }
      } else if (key === 'when_connected') {
        const aConnected = a.connectedAt ? new Date(a.connectedAt).getTime() : 0
        const bConnected = b.connectedAt ? new Date(b.connectedAt).getTime() : 0
        if (aConnected !== bConnected) {
          primaryResult =
            direction === 'asc'
              ? aConnected - bConnected
              : bConnected - aConnected
        }
      }

      // If primary sort is tied, apply secondary sorts
      if (primaryResult === 0) {
        // Secondary sort: lastName (ascending)
        const aLastName = a.user.lastName || ''
        const bLastName = b.user.lastName || ''
        if (aLastName < bLastName) return -1
        if (aLastName > bLastName) return 1

        // Tertiary sort: firstName (ascending)
        const aFirstName = a.user.firstName || ''
        const bFirstName = b.user.firstName || ''
        if (aFirstName < bFirstName) return -1
        if (aFirstName > bFirstName) return 1
      }

      return primaryResult
    })

    return sortedMembers
  }, [initialMembers, settings, relationshipMap])

  // Relationship modal handler with permission logic
  const handleOpenRelateModal = async (member: MemberWithUser) => {
    setSelectedMember(member)
    setIsRelateModalOpen(true)

    // Fetch the member's relations
    try {
      const relations = await getMemberRelations(member.userId, groupSlug)
      setMemberRelations(relations)
    } catch (error) {
      console.error('Failed to fetch member relations:', error)
      setMemberRelations([])
    }
  }

  const handleCloseRelateModal = () => {
    setIsRelateModalOpen(false)
    setSelectedMember(null)
  }

  const handleRelationshipAdded = () => {
    // Refresh the page to show updated relationship data
    router.refresh()
  }

  const handleOpenConnectModal = (member: MemberWithUser) => {
    setMemberToConnect(member)
    setIsConnectModalOpen(true)
  }

  const handleCloseConnectModal = () => {
    setIsConnectModalOpen(false)
    setMemberToConnect(null)
  }

  const handleConfirmConnect = async () => {
    if (!memberToConnect || !groupSlug) {
      toast.error('Could not connect member. Please try again.')
      return
    }
    try {
      await createAcquaintanceRelationship(memberToConnect.userId, groupSlug)
      toast.success(`You are now connected with ${memberToConnect.user.name}.`)
      router.refresh()
    } catch (error) {
      console.error('Failed to create acquaintance relationship:', error)
      toast.error('Failed to connect.')
    } finally {
      handleCloseConnectModal()
    }
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
            familyTreeRef={treeRef}
            isResetDisabled={isResetDisabled}
          />

          {/* Search input */}
          {view === 'tree' ? (
            <div className="relative">
              <FocalUserSearch
                members={initialMembers}
                onSelect={(userId) => treeRef.current?.setFocalUser?.(userId)}
              />
            </div>
          ) : (
            view !== 'games' && (
              <div className="relative mb-[8px]" data-tour="search-input">
                <input
                  type="text"
                  placeholder={`Search ${initialMembers.length} members...`}
                  value={settings.searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full rounded-md border p-2 pr-10 text-sm"
                />
                {settings.searchQuery && (
                  <button
                    onClick={() => handleSearchChange('')}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </div>
            )
          )}
        </div>
      </div>

      <div className="container mx-auto mt-2 px-2 md:px-4">
        <TooltipProvider>
          {view === 'grid' && (
            <GridView
              members={filteredAndSortedMembers}
              gridSize={settings.gridSize}
              strategy={strategy}
              relationshipMap={relationshipMap}
              onRelate={handleOpenRelateModal}
              onConnect={handleOpenConnectModal}
            />
          )}

          {/* Games view - universal for all group types */}
          {view === 'games' && (
            <GamesView
              members={initialMembers}
              groupSlug={groupSlug}
              currentUserId={currentUserMember?.userId}
              onSwitchToGrid={() => {
                // Navigate to grid view using router
                router.push(`/g/${groupSlug}`)
              }}
            />
          )}

          {/* Adapter-specific view rendering (tree, etc.) */}
          {view !== 'grid' &&
            view !== 'games' &&
            adapter.renderView &&
            adapter.renderView(view, {
              onIsFocalUserCurrentUserChange: (isCurrentUser: boolean) =>
                setIsResetDisabled(isCurrentUser),
              members: initialMembers,
              onOpenRelate: handleOpenRelateModal,
              relationshipMap: relationshipMap,
              relationships: initialRelationships,
              ref: treeRef,
            })}

          {/* Fallback for unsupported views */}
          {view !== 'grid' &&
            view !== 'games' &&
            (!adapter.renderView ||
              !adapter.renderView(view, {
                onIsFocalUserCurrentUserChange: (isCurrentUser: boolean) =>
                  setIsResetDisabled(isCurrentUser),
                members: initialMembers,
                onOpenRelate: handleOpenRelateModal,
                relationshipMap: relationshipMap,
                relationships: initialRelationships,
              })) && (
              <div className="py-8 text-center text-gray-500">
                {view} view is not available for{' '}
                {groupContext.group.groupType.code} groups
              </div>
            )}
        </TooltipProvider>
      </div>

      {/* Adapter-specific additional content */}
      {adapter.renderAdditionalContent?.()}

      {/* RelateModal */}
      {selectedMember && (
        <RelateModal
          isOpen={isRelateModalOpen}
          onClose={handleCloseRelateModal}
          member={selectedMember}
          groupType={groupContext.group.groupType}
          groupMembers={initialMembers}
          groupSlug={groupSlug}
          initialRelations={memberRelations}
          onRelationshipAdded={handleRelationshipAdded}
          isReadOnly={
            !groupContext.isGroupAdmin &&
            !groupContext.isSuperAdmin &&
            selectedMember.userId !== groupContext.currentUserMember?.userId
          }
          loggedInUserId={groupContext.currentUserMember?.userId || ''}
        />
      )}

      {/* Connect Modal */}
      {isConnectModalOpen && memberToConnect && (
        <Modal isOpen={isConnectModalOpen} onClose={handleCloseConnectModal}>
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Connect
            </h3>
            <div className="mt-2">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                If you already know {memberToConnect.user.name}, connect.
              </p>
            </div>
            <div className="mt-6 flex justify-end space-x-4">
              <Button variant="outline" onClick={handleCloseConnectModal}>
                Cancel
              </Button>
              <Button onClick={handleConfirmConnect}>Connect</Button>
            </div>
          </div>
        </Modal>
      )}
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
