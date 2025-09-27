'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import useLocalStorage from '@/hooks/useLocalStorage'
import { useGroup } from '@/components/GroupProvider'
import { GuestMessage } from '@/components/GuestMessage'
import GroupToolbar from '@/components/GroupToolbar'
import { getFamilyGroupToolbarConfig, getCommunityGroupToolbarConfig } from '@/lib/group-toolbar-config'
import { TourProvider, useTour } from '@reactour/tour'
import { useTheme } from 'next-themes'
import { X } from 'lucide-react'
import RelateModal from '@/components/RelateModal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Toaster, toast } from 'sonner'
import Modal from '@/components/ui/modal'
import GamesIntroModal from '@/components/GamesIntroModal'
import { TooltipProvider } from '@/components/ui/tooltip'
import FamilyMemberCard from '@/components/FamilyMemberCard'
import MemberCard from '@/components/MemberCard'
import TreeView from '@/app/g/[slug]/(family)/TreeView'
import { FocalUserSearch } from '@/app/g/[slug]/(family)/FocalUserSearch'
import GamesView from '@/components/GamesView'
import type { MemberWithUser, FullRelationship } from '@/types'

// Universal settings interface
interface UniversalGroupSettings {
  sortConfig: {
    key: string
    direction: 'asc' | 'desc'
  }
  searchQuery: string
  filterByRealPhoto: boolean
  filterConnectedStatus: 'all' | 'connected' | 'not_connected'
  gridSize: number
}

// Feature configuration for different group types
interface GroupClientFeatures {
  familyTree: boolean
  relationships: boolean
  connections: boolean
  contexts: boolean
  games: boolean
}

// Data provider interface for different group types
interface GroupDataProvider {
  getRelationshipMap?: (members: MemberWithUser[], relationships: FullRelationship[]) => Map<string, { label: string; steps: number }>
  getMemberRelations?: (memberId: string) => Promise<FullRelationship[]>
  createConnection?: (memberId: string, groupSlug: string) => Promise<void>
  getMembers: (members: MemberWithUser[]) => MemberWithUser[]
  getSortOptions: () => Array<{ key: string; label: string }>
  getDefaultSort: () => { key: string; direction: 'asc' | 'desc' }
}

// Props interface
interface UniversalGroupClientProps {
  view: string
  members: MemberWithUser[]
  groupSlug: string
  groupType: 'family' | 'community'
  // Family-specific props (optional)
  initialRelationships?: FullRelationship[]
  initialMemberCount?: number
  // Community-specific props (optional)
  currentUserMember?: MemberWithUser
}

// Helper function to get responsive grid size ranges and defaults
const getGridSizeConfig = (isMobile: boolean) => {
  if (isMobile) {
    return { min: 1, max: 3, default: 2 }
  } else {
    return { min: 2, max: 9, default: 6 }
  }
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

// Feature configurations for different group types
const getGroupFeatures = (groupType: string): GroupClientFeatures => {
  switch (groupType) {
    case 'family':
      return {
        familyTree: true,
        relationships: true,
        connections: false,
        contexts: true,
        games: true,
      }
    case 'community':
      return {
        familyTree: false,
        relationships: false,
        connections: true,
        contexts: false,
        games: true,
      }
    default:
      return {
        familyTree: false,
        relationships: false,
        connections: false,
        contexts: false,
        games: true,
      }
  }
}

// Data providers for different group types
const getFamilyDataProvider = (): GroupDataProvider => ({
  getRelationshipMap: (_members, _relationships) => {
    // Family-specific relationship calculation logic
    const relationshipMap = new Map<string, { label: string; steps: number }>()
    // Implementation would go here - simplified for now
    return relationshipMap
  },
  getMembers: (members) => members,
  getSortOptions: () => [
    { key: 'closest', label: 'Closest relation' },
    { key: 'joined', label: 'When joined' },
    { key: 'firstName', label: 'First name' },
    { key: 'lastName', label: 'Last name' },
  ],
  getDefaultSort: () => ({ key: 'closest', direction: 'asc' }),
})

const getCommunityDataProvider = (): GroupDataProvider => ({
  getMemberRelations: async (_memberId) => {
    // Community-specific relationship fetching logic
    return []
  },
  createConnection: async (_memberId, _groupSlug) => {
    // Community-specific connection creation logic
  },
  getMembers: (members) => members,
  getSortOptions: () => [
    { key: 'when_connected', label: 'When connected' },
    { key: 'firstName', label: 'First name' },
    { key: 'lastName', label: 'Last name' },
  ],
  getDefaultSort: () => ({ key: 'when_connected', direction: 'desc' }),
})

// Main component content
function UniversalGroupClientContent({
  view,
  members: initialMembers,
  groupSlug,
  groupType,
  features,
  dataProvider,
  initialRelationships = [],
  currentUserMember: _currentUserMember,
  isMobile,
}: UniversalGroupClientProps & {
  features: GroupClientFeatures
  dataProvider: GroupDataProvider
  isMobile: boolean
}) {
  const groupContext = useGroup()
  const { setIsOpen } = useTour()
  const router = useRouter()
  
  // Universal state
  const [isRelateModalOpen, setIsRelateModalOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<MemberWithUser | null>(null)
  
  // Family-specific state
  const familyTreeRef = useRef<any>(null)
  const [_isResetDisabled, _setIsResetDisabled] = useState(true)
  
  // Community-specific state
  const [_memberRelations, _setMemberRelations] = useState<FullRelationship[]>([])
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false)
  const [memberToConnect, setMemberToConnect] = useState<MemberWithUser | null>(null)
  const [isIntroModalOpen, setIsIntroModalOpen] = useState(false)
  const [_introSeen, setIntroSeen] = useLocalStorage(`games-intro-seen-${groupSlug}`, false)

  // Settings with group-specific defaults
  const [settings, setSettings] = useLocalStorage<UniversalGroupSettings>(
    `namegame_${groupType}-group-settings_${groupSlug}`,
    {
      searchQuery: '',
      sortConfig: dataProvider.getDefaultSort(),
      filterByRealPhoto: true,
      filterConnectedStatus: 'all',
      gridSize: 4, // Safe middle-ground default for SSR
    },
  )

  // Relationship map for family groups
  const relationshipMap = useMemo(() => {
    if (features.relationships && dataProvider.getRelationshipMap) {
      return dataProvider.getRelationshipMap(initialMembers, initialRelationships)
    }
    return new Map()
  }, [initialMembers, initialRelationships, features.relationships, dataProvider])

  // Filtered and sorted members
  const filteredMembers = useMemo(() => {
    let sortedMembers = [...initialMembers]

    // Apply sorting
    sortedMembers.sort((a, b) => {
      const { key, direction } = settings.sortConfig
      let aValue: any, bValue: any

      switch (key) {
        case 'closest':
          if (features.relationships) {
            const aRelation = relationshipMap.get(a.userId)
            const bRelation = relationshipMap.get(b.userId)
            aValue = aRelation?.steps ?? 999
            bValue = bRelation?.steps ?? 999
          } else {
            aValue = bValue = 0
          }
          break
        case 'joined':
          aValue = new Date(a.createdAt).getTime()
          bValue = new Date(b.createdAt).getTime()
          break
        case 'when_connected':
          aValue = a.connectedAt ? new Date(a.connectedAt).getTime() : 0
          bValue = b.connectedAt ? new Date(b.connectedAt).getTime() : 0
          break
        case 'firstName':
          aValue = a.user.name?.split(' ')[0] || ''
          bValue = b.user.name?.split(' ')[0] || ''
          break
        case 'lastName':
          aValue = a.user.name?.split(' ').slice(-1)[0] || ''
          bValue = b.user.name?.split(' ').slice(-1)[0] || ''
          break
        default:
          aValue = bValue = 0
      }

      if (aValue < bValue) return direction === 'asc' ? -1 : 1
      if (aValue > bValue) return direction === 'asc' ? 1 : -1
      return 0
    })

    // Apply filters
    if (settings.filterConnectedStatus !== 'all') {
      sortedMembers = sortedMembers.filter((member) => {
        const isConnected = !!member.connectedAt
        return settings.filterConnectedStatus === 'connected' ? isConnected : !isConnected
      })
    }

    if (settings.filterByRealPhoto) {
      sortedMembers = sortedMembers.filter(
        (member) =>
          member.user.photoUrl &&
          !member.user.photoUrl.includes('api.dicebear.com') &&
          !member.user.photoUrl.endsWith('default-avatar.png'),
      )
    }

    if (settings.searchQuery) {
      sortedMembers = sortedMembers.filter((member) =>
        (member.user.name || '')
          .toLowerCase()
          .includes(settings.searchQuery.toLowerCase()),
      )
    }

    return sortedMembers
  }, [initialMembers, settings, relationshipMap, features.relationships])

  // Event handlers
  const handleSort = (key: string) => {
    setSettings((prev) => {
      const isSameKey = prev.sortConfig.key === key
      let newDirection: 'asc' | 'desc'

      if (isSameKey) {
        newDirection = prev.sortConfig.direction === 'asc' ? 'desc' : 'asc'
      } else {
        newDirection = key === 'joined' ? 'desc' : 'asc'
      }

      return {
        ...prev,
        sortConfig: { key, direction: newDirection },
      }
    })
  }

  const handleRelationshipChange = () => {
    router.refresh()
  }

  const handleSearchChange = (query: string) => {
    setSettings((prev) => ({ ...prev, searchQuery: query }))
  }

  // Modal handlers
  const handleOpenRelateModal = (member: MemberWithUser) => {
    setSelectedMember(member)
    setIsRelateModalOpen(true)
  }

  const handleCloseRelateModal = () => {
    setIsRelateModalOpen(false)
    setSelectedMember(null)
  }

  // Community-specific handlers
  const handleOpenConnectModal = (member: MemberWithUser) => {
    setMemberToConnect(member)
    setIsConnectModalOpen(true)
  }

  const handleCloseConnectModal = () => {
    setIsConnectModalOpen(false)
    setMemberToConnect(null)
  }

  const handleConfirmConnect = async () => {
    if (!memberToConnect || !dataProvider.createConnection) {
      toast.error('Could not connect member. Please try again.')
      return
    }
    try {
      await dataProvider.createConnection(memberToConnect.userId, groupSlug)
      toast.success(`You are now connected with ${memberToConnect.user.name}.`)
      router.refresh()
    } catch (error) {
      console.error('Failed to create connection:', error)
      toast.error('Failed to connect.')
    } finally {
      handleCloseConnectModal()
    }
  }

  // Get toolbar config based on group type
  const toolbarConfig = groupType === 'family' 
    ? getFamilyGroupToolbarConfig(groupSlug)
    : getCommunityGroupToolbarConfig(groupSlug)

  if (!groupContext?.currentUserMember) {
    return <GuestMessage isGuest={true} />
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="bg-background border-border sticky top-16 z-10 border-b py-1">
        <div className="container mx-auto px-4">
          <div className="my-1">
            <GroupToolbar
              settings={settings}
              setSettings={setSettings}
              handleSort={handleSort}
              setTourOpen={setIsOpen}
              isMobile={isMobile}
              familyTreeRef={features.familyTree ? familyTreeRef : undefined}
              isResetDisabled={_isResetDisabled}
              viewMode={view}
              groupSlug={groupSlug}
              gridSizeConfig={getGridSizeConfig(isMobile)}
              config={toolbarConfig}
            />
          </div>

          {/* Search input for community groups */}
          {!features.familyTree && view !== 'games' && (
            <div className="relative mb-[8px]" data-tour="search-input">
              <Input
                type="text"
                placeholder="Search by name..."
                value={settings.searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pr-10 pl-4"
              />
              {settings.searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-1/2 right-1 h-8 w-8 -translate-y-1/2"
                  onClick={() => handleSearchChange('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}

          {/* Family tree search */}
          {features.familyTree && view === 'tree' && (
            <div className="relative">
              <FocalUserSearch
                members={initialMembers}
                onSelect={(userId) =>
                  familyTreeRef.current?.setFocalUser(userId)
                }
              />
            </div>
          )}
        </div>
      </div>

      {/* Content area - render different views based on view prop */}
      <div className="container mx-auto mt-4 px-4">
        {view === 'grid' && (
          <div className={getGridClasses(settings.gridSize)}>
            {filteredMembers.map((member, index) => {
              if (!groupContext?.currentUserMember) return null

              const isCurrentUser = member.userId === groupContext.currentUserMember.userId
              
              if (features.relationships) {
                // Family group - use FamilyMemberCard with relationship
                const relationship = isCurrentUser
                  ? 'Me'
                  : relationshipMap.get(member.userId)?.label || 'Relative'

                return (
                  <FamilyMemberCard
                    key={member.userId}
                    member={member}
                    relationship={relationship}
                    onRelate={handleOpenRelateModal}
                    currentUserId={groupContext.currentUserMember?.userId}
                    isGroupAdmin={groupContext.isGroupAdmin}
                    groupSlug={groupSlug}
                    allMembers={filteredMembers}
                    memberIndex={index}
                  />
                )
              } else {
                // Community group - use MemberCard with connection
                return (
                  <MemberCard
                    key={member.userId}
                    member={member}
                    onRelate={handleOpenRelateModal}
                    onConnect={features.connections ? handleOpenConnectModal : undefined}
                    currentUserId={groupContext.currentUserMember?.userId}
                    isGroupAdmin={groupContext.isGroupAdmin}
                    groupSlug={groupSlug}
                    allMembers={filteredMembers}
                    memberIndex={index}
                  />
                )
              }
            })}
          </div>
        )}
        
        {view === 'tree' && features.familyTree && (
          <TreeView
            members={filteredMembers}
            onOpenRelate={handleOpenRelateModal}
            onIsFocalUserCurrentUserChange={(isCurrent) => {
              _setIsResetDisabled(!isCurrent)
            }}
          />
        )}
        
        {view === 'games' && (
          <GamesView
            members={filteredMembers}
            groupSlug={groupSlug}
            currentUserId={groupContext?.currentUserMember?.userId}
            onSwitchToGrid={() => {
              // This would be handled by the router in the parent
            }}
          />
        )}
      </div>

      {/* Modals */}
      {isRelateModalOpen && selectedMember && (
        <RelateModal
          isOpen={isRelateModalOpen}
          onClose={handleCloseRelateModal}
          member={selectedMember}
          onRelationshipAdded={handleRelationshipChange}
          groupType={{ id: 1, code: groupType }}
          groupMembers={initialMembers}
          groupSlug={groupSlug}
          initialRelations={initialRelationships}
          isReadOnly={false}
          loggedInUserId={groupContext?.currentUserMember?.userId || ''}
        />
      )}

      {/* Community-specific modals */}
      {features.connections && isConnectModalOpen && memberToConnect && (
        <Modal
          isOpen={isConnectModalOpen}
          onClose={handleCloseConnectModal}
          title="Connect with Member"
        >
          <div className="space-y-4">
            <p>
              Would you like to connect with{' '}
              <span className="font-semibold">{memberToConnect.user.name}</span>?
            </p>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={handleCloseConnectModal}>
                Cancel
              </Button>
              <Button onClick={handleConfirmConnect}>Connect</Button>
            </div>
          </div>
        </Modal>
      )}

      {features.games && isIntroModalOpen && (
        <GamesIntroModal
          isOpen={isIntroModalOpen}
          onClose={() => {
            setIsIntroModalOpen(false)
            setIntroSeen(true)
            router.push(`/g/${groupSlug}/games`)
          }}
        />
      )}
    </div>
  )
}

// Main wrapper component with tour provider
export function UniversalGroupClient(props: UniversalGroupClientProps) {
  const { groupType, view: _view } = props
  const { resolvedTheme } = useTheme()
  const [hasMounted, setHasMounted] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    setHasMounted(true)
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkIsMobile()
    window.addEventListener('resize', checkIsMobile)
    return () => window.removeEventListener('resize', checkIsMobile)
  }, [])

  // Get features and data provider based on group type
  const features = getGroupFeatures(groupType)
  const dataProvider = groupType === 'family' 
    ? getFamilyDataProvider() 
    : getCommunityDataProvider()

  // Get tour steps based on group type and view
  const tourSteps = useMemo(() => {
    // This would return appropriate tour steps based on groupType and view
    return []
  }, [])

  if (!hasMounted) {
    return null // Prevent hydration mismatch
  }

  return (
    <TooltipProvider>
      <TourProvider
        steps={tourSteps}
        styles={{
          popover: (base: React.CSSProperties) => ({
            ...base,
            maxWidth: isMobile ? 'calc(100vw - 40px)' : '380px',
            width: isMobile ? 'calc(100vw - 40px)' : undefined,
            backgroundColor: 'var(--background)',
            color: 'var(--foreground)',
            borderRadius: '0.375rem',
            boxShadow:
              '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
            border: `3px solid ${
              resolvedTheme === 'dark'
                ? 'hsl(240 3.7% 25.9%)'
                : 'hsl(214.3 31.8% 81.4%)'
            }`,
          }),
          badge: (base: React.CSSProperties) => ({
            ...base,
            backgroundColor: '#4f46e5',
          }),
          close: (base: React.CSSProperties) => ({
            ...base,
            color: 'var(--foreground)',
            top: 12,
            right: 12,
            width: '1.4rem',
            height: '1.4rem',
          }),
          dot: (
            base: React.CSSProperties,
            { current }: { current?: boolean } = {},
          ) => ({
            ...base,
            backgroundColor: current ? '#4f46e5' : '#a5b4fc',
          }),
          arrow: (base: React.CSSProperties) => ({
            ...base,
            display: 'block',
            color: 'var(--foreground)',
            width: '1.4rem',
            height: '1.4rem',
          }),
          maskWrapper: (base: React.CSSProperties) =>
            isMobile ? { ...base, color: 'transparent' } : base,
        }}
        showNavigation={true}
        showCloseButton={true}
        disableInteraction={true}
      >
        <Toaster />
        <UniversalGroupClientContent
          {...props}
          features={features}
          dataProvider={dataProvider}
          isMobile={isMobile}
        />
      </TourProvider>
    </TooltipProvider>
  )
}

export default UniversalGroupClient
