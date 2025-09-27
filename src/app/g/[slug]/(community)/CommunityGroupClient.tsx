'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import useLocalStorage from '@/hooks/useLocalStorage'
import useGroupMembers from '@/hooks/useGroupMembers'
import { useRouter } from 'next/navigation'
import type { MemberWithUser, FullRelationship } from '@/types'
import {
  getGroupMembersForRelate,
  createAcquaintanceRelationship,
} from './actions'
import { getMemberRelations } from '@/lib/actions'
import RelateModal from '@/components/RelateModal'
import { useGroup } from '@/components/GroupProvider'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X } from 'lucide-react'
import GamesIntroModal from '@/components/GamesIntroModal'
import { TourProvider, useTour } from '@reactour/tour'
import { useTheme } from 'next-themes'
import { Toaster, toast } from 'sonner'
import Modal from '@/components/ui/modal'
import GroupToolbar from '@/components/GroupToolbar'
import { getCommunityGroupToolbarConfig } from '@/lib/group-toolbar-config'
import MemberGrid from './MemberGrid'
import { steps as communityTourSteps } from '@/components/tours/CommunityTour'
import { steps as communityTourMobileSteps } from '@/components/tours/CommunityTourMobile'

interface CommunityGroupClientProps {
  members: MemberWithUser[]
  currentUserMember: MemberWithUser | undefined
  groupSlug?: string
  view: 'grid' | 'games'
}

interface CommunityGroupClientContentProps
  extends Omit<CommunityGroupClientProps, 'greetedCount' | 'notGreetedCount'> {
  settings: GroupPageSettings
  setSettings: React.Dispatch<React.SetStateAction<GroupPageSettings>>
  groupSlug?: string
  view: 'grid' | 'games'
  isMobile: boolean
  gridSizeConfig: { min: number; max: number; default: number }
}

interface GroupPageSettings {
  sortConfig: {
    key: string // Changed to string to match UniversalGroupSettings
    direction: 'asc' | 'desc'
  }
  searchQuery: string
  filterByRealPhoto: boolean
  filterConnectedStatus: 'all' | 'connected' | 'not_connected'
  gridSize: number
}

const CommunityGroupClientContent: React.FC<
  CommunityGroupClientContentProps
> = ({
  members: initialMembers,
  settings,
  setSettings,
  groupSlug,
  view,
  isMobile,
  gridSizeConfig: _gridSizeConfig,
}) => {
  const groupContext = useGroup()
  const { isOpen, setIsOpen, setCurrentStep } = useTour()
  const router = useRouter()

  const [isRelateModalOpen, setIsRelateModalOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<MemberWithUser | null>(
    null,
  )
  const [memberRelations, setMemberRelations] = useState<FullRelationship[]>([])
  const [allGroupMembers, setAllGroupMembers] = useState<MemberWithUser[]>([])
  const [_isLoadingRelations, setIsLoadingRelations] = useState(false)
  const [isIntroModalOpen, setIsIntroModalOpen] = useState(false)
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false)
  const [memberToConnect, setMemberToConnect] = useState<MemberWithUser | null>(
    null,
  )

  const group = groupContext?.group
  const [_introSeen, setIntroSeen] = useLocalStorage(
    `namegame_games-intro-seen_${group?.slug || ''}`,
    false,
  )

  const allMembers = useMemo(() => initialMembers, [initialMembers])
  const filteredAndSortedMembers = useGroupMembers(allMembers, settings)

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(0)
    }
  }, [isOpen, setCurrentStep])

  useEffect(() => {
    if (allMembers.length > 0 && 'serviceWorker' in navigator) {
      const imageUrls = allMembers
        .map((member) => member.user.photoUrl)
        .filter((url): url is string => !!url)

      navigator.serviceWorker.ready.then((registration) => {
        registration.active?.postMessage({
          type: 'CACHE_IMAGES',
          payload: { imageUrls },
        })
      })
    }
  }, [allMembers])

  useEffect(() => {
    if (group?.slug) {
      getGroupMembersForRelate(group.slug).then((members) =>
        setAllGroupMembers(members as MemberWithUser[]),
      )
    }
  }, [group?.slug])

  const handleOpenRelateModal = useCallback(
    async (member: MemberWithUser) => {
      if (!group?.slug) {
        console.error('groupSlug is not available. Cannot fetch relations.')
        return
      }

      setSelectedMember(member)
      setIsLoadingRelations(true)
      try {
        const relations = await getMemberRelations(member.userId, group.slug)
        setMemberRelations(relations as FullRelationship[])
        setIsRelateModalOpen(true)
      } catch (error) {
        console.error('Failed to get member relations:', error)
      } finally {
        setIsLoadingRelations(false)
      }
    },
    [group?.slug],
  )

  const handleOpenConnectModal = (member: MemberWithUser) => {
    setMemberToConnect(member)
    setIsConnectModalOpen(true)
  }

  const handleCloseConnectModal = () => {
    setIsConnectModalOpen(false)
    setMemberToConnect(null)
  }

  const handleConfirmConnect = async () => {
    if (!memberToConnect || !group?.slug) {
      toast.error('Could not connect member. Please try again.')
      return
    }
    try {
      await createAcquaintanceRelationship(memberToConnect.userId, group.slug)
      toast.success(`You are now connected with ${memberToConnect.user.name}.`)
      router.refresh()
    } catch (error) {
      console.error('Failed to create acquaintance relationship:', error)
      toast.error('Failed to connect.')
    } finally {
      handleCloseConnectModal()
    }
  }

  const handleCloseRelateModal = () => {
    setIsRelateModalOpen(false)
    setSelectedMember(null)
  }

  const handleCloseIntroModal = () => {
    setIsIntroModalOpen(false)
    setIntroSeen(true)
    router.push(`/g/${groupSlug}/games`)
  }

  const handleRelationshipChange = () => {
    router.refresh()
  }

  const handleSearchChange = (query: string) => {
    setSettings((prev) => ({ ...prev, searchQuery: query }))
  }

  const handleSort = (key: string) => {
    setSettings((prev) => ({
      ...prev,
      sortConfig: {
        key,
        direction:
          prev.sortConfig.key === key && prev.sortConfig.direction === 'asc'
            ? 'desc'
            : 'asc',
      },
    }))
  }

  if (!groupContext || !group || group.groupType?.code === 'family') {
    return null
  }

  const { isGroupAdmin, currentUserMember: ego } = groupContext

  return (
    <>
      <div
        id="group-toolbar-container"
        className="bg-background border-border sticky top-16 z-10 border-b py-1"
      >
        <div className="container mx-auto px-4">
          <div className="my-1">
            <GroupToolbar
              settings={settings}
              setSettings={setSettings}
              handleSort={handleSort}
              setTourOpen={setIsOpen}
              viewMode={view}
              groupSlug={group.slug}
              isMobile={isMobile}
              gridSizeConfig={getGridSizeConfig(isMobile)}
              config={getCommunityGroupToolbarConfig(group.slug)}
            />
          </div>

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
        </div>
      </div>

      <TooltipProvider>
        <div className="container mx-auto px-4 pt-3 pb-6">
          <MemberGrid
            members={filteredAndSortedMembers}
            isGroupAdmin={isGroupAdmin}
            onRelate={handleOpenRelateModal}
            onConnect={handleOpenConnectModal}
            currentUserId={ego?.userId}
            groupSlug={groupSlug}
            gridSize={settings.gridSize}
          />
        </div>
      </TooltipProvider>
      <GamesIntroModal
        isOpen={isIntroModalOpen}
        onClose={handleCloseIntroModal}
      />
      {isRelateModalOpen && selectedMember && group?.groupType && ego && (
        <RelateModal
          isOpen={isRelateModalOpen}
          onClose={handleCloseRelateModal}
          member={selectedMember}
          groupType={group.groupType}
          groupMembers={allGroupMembers}
          groupSlug={group.slug}
          initialRelations={memberRelations}
          onRelationshipAdded={handleRelationshipChange}
          isReadOnly={!isGroupAdmin && selectedMember?.userId !== ego?.userId}
          loggedInUserId={ego.userId}
        />
      )}

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

// Helper function to get responsive grid size ranges and defaults
const getGridSizeConfig = (isMobile: boolean) => {
  if (isMobile) {
    return { min: 1, max: 3, default: 2 }
  } else {
    return { min: 2, max: 9, default: 6 }
  }
}

const CommunityGroupClient: React.FC<CommunityGroupClientProps> = ({
  view,
  ...props
}) => {
  const groupContext = useGroup()
  const { group } = groupContext || {}
  const [isMobile, setIsMobile] = useState(false)

  const [settings, setSettings] = useLocalStorage<GroupPageSettings>(
    `namegame_community-group-settings_${group?.slug || ''}`,
    {
      sortConfig: { key: 'when_connected', direction: 'desc' },
      searchQuery: '',
      filterByRealPhoto: true,
      filterConnectedStatus: 'all',
      gridSize: 4, // Safe middle-ground default for SSR
    },
  )

  const [hasMounted, setHasMounted] = useState(false)
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    setHasMounted(true)
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkIsMobile()
    window.addEventListener('resize', checkIsMobile)
    return () => window.removeEventListener('resize', checkIsMobile)
  }, [])

  // Auto-adjust gridSize based on screen size after mount (prevent hydration mismatch)
  useEffect(() => {
    if (hasMounted) {
      const config = getGridSizeConfig(isMobile)
      // Only update if current gridSize is outside the valid range for this screen size
      if (settings.gridSize < config.min || settings.gridSize > config.max) {
        setSettings((prev) => ({ ...prev, gridSize: config.default }))
      }
    }
  }, [hasMounted, isMobile, settings.gridSize, setSettings])

  const tourSteps = useMemo(() => {
    return isMobile ? communityTourMobileSteps : communityTourSteps
  }, [isMobile])

  if (!groupContext) {
    return null // Should be rendered within GroupProvider
  }

  if (!hasMounted) {
    return (
      <div className="py-8 text-center text-gray-500 dark:text-gray-400">
        Loading...
      </div>
    )
  }

  return (
    <TourProvider
      steps={tourSteps}
      onClickMask={() => {}}
      styles={{
        popover: (base: React.CSSProperties) => {
          const popoverStyles = isMobile
            ? {
                width: 'calc(100vw - 40px)',
                maxWidth: 'calc(100vw - 40px)',
              }
            : {
                maxWidth: '380px',
              }

          return {
            ...base,
            ...popoverStyles,
            backgroundColor: 'var(--background)',
            color: 'var(--foreground)',
            borderRadius: '0.375rem',
            boxShadow:
              '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
            border: hasMounted
              ? `3px solid ${
                  resolvedTheme === 'dark'
                    ? 'hsl(240 3.7% 25.9%)'
                    : 'hsl(214.3 31.8% 81.4%)'
                }`
              : 'none',
          }
        },
        badge: (base: React.CSSProperties) => ({
          ...base,
          backgroundColor: '#4f46e5',
        }),
        dot: (
          base: React.CSSProperties,
          { current }: { current?: boolean } = {},
        ) => ({
          ...base,
          backgroundColor: current ? '#4f46e5' : '#a5b4fc',
        }),
        close: (base: React.CSSProperties) => ({
          ...base,
          color: 'var(--foreground)',
          top: 12,
          right: 12,
          width: '1.2rem',
          height: '1.2rem',
        }),
        arrow: (base: React.CSSProperties) => ({
          ...base,
          display: 'block',
          color: 'var(--foreground)',
          width: '1.4rem',
          height: '1.4rem',
        }),
        maskWrapper: (base: React.CSSProperties) => base,
      }}
      showNavigation={true}
      showCloseButton={true}
      disableInteraction={true}
    >
      <Toaster />
      <CommunityGroupClientContent
        {...props}
        settings={settings}
        setSettings={setSettings}
        view={view}
        isMobile={isMobile}
        gridSizeConfig={getGridSizeConfig(isMobile)}
      />
    </TourProvider>
  )
}

export default CommunityGroupClient
