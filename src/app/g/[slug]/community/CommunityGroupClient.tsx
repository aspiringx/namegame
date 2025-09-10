'use client'

import React, {
  useState,
  useEffect,
  Fragment,
  useMemo,
  useCallback,
} from 'react'
import useLocalStorage from '@/hooks/useLocalStorage'
import useGroupMembers from '@/hooks/useGroupMembers'
import { useRouter } from 'next/navigation'
import { Tab } from '@headlessui/react'
import clsx from 'clsx'
import { saveMembers, getMembersByGroup } from '@/lib/db'
import type { MemberWithUser, FullRelationship } from '@/types'
import MemberCard from '@/components/MemberCard'
import dynamic from 'next/dynamic'
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
import { LayoutGrid, X, Gamepad2 } from 'lucide-react'
import GamesIntroModal from '@/components/GamesIntroModal'
import { TourProvider, useTour } from '@reactour/tour'
import { communityTourSteps } from '@/components/tours/CommunityTour'
import { communityTourMobileSteps } from '@/components/tours/CommunityTourMobile'
import { useTheme } from 'next-themes'
import { Toaster, toast } from 'sonner'
import Modal from '@/components/ui/modal'
import GroupToolbar from './GroupToolbar'
import MemberGrid from './MemberGrid'

const GamesViewClient = dynamic(() => import('@/components/GamesViewClient'), {
  loading: () => <div className="p-4 text-center">Loading quiz...</div>,
  ssr: false,
})

interface CommunityGroupClientProps {
  members: MemberWithUser[]
  currentUserMember: MemberWithUser | undefined
  groupSlug?: string
}

interface CommunityGroupClientContentProps
  extends Omit<CommunityGroupClientProps, 'greetedCount' | 'notGreetedCount'> {
  settings: GroupPageSettings
  setSettings: React.Dispatch<React.SetStateAction<GroupPageSettings>>
  groupSlug?: string
}

interface GroupPageSettings {
  sortConfig: {
    key: 'when_met' | 'firstName' | 'lastName'
    direction: 'asc' | 'desc'
  }
  viewMode: 'grid' | 'quiz'
  searchQuery: string
  filterByRealPhoto: boolean
  filterMetStatus: 'all' | 'met' | 'not_met'
}

const CommunityGroupClientContent: React.FC<
  CommunityGroupClientContentProps
> = ({
  members: initialMembers,
  currentUserMember,
  settings,
  setSettings,
  groupSlug,
}) => {
  const { group, currentUserMember: ego, isGroupAdmin } = useGroup()
  const { isOpen, setIsOpen } = useTour()

  const router = useRouter()

  const [isRelateModalOpen, setIsRelateModalOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<MemberWithUser | null>(
    null,
  )
  const [memberRelations, setMemberRelations] = useState<FullRelationship[]>([])
  const [allGroupMembers, setAllGroupMembers] = useState<MemberWithUser[]>([])
  const [isLoadingRelations, setIsLoadingRelations] = useState(false)
  const [isIntroModalOpen, setIsIntroModalOpen] = useState(false)
  const [introSeen, setIntroSeen] = useLocalStorage(
    `namegame_games-intro-seen-${group?.slug || ''}`,
    false,
  )
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false)
  const [memberToConnect, setMemberToConnect] = useState<MemberWithUser | null>(
    null,
  )

  const allMembers = useMemo(() => initialMembers, [initialMembers])

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

  const handleSwitchToGrid = () => {
    setSettings((prev) => ({ ...prev, viewMode: 'grid' }))
  }

  const handleSwitchToQuiz = () => {
    if (!introSeen) {
      setIsIntroModalOpen(true)
    } else {
      setSettings((prev) => ({ ...prev, viewMode: 'quiz' }))
    }
  }

  const handleCloseIntroModal = () => {
    setIsIntroModalOpen(false)
    setIntroSeen(true)
    setSettings((prev) => ({ ...prev, viewMode: 'quiz' }))
  }

  const handleRelationshipChange = () => {
    router.refresh()
  }

  const handleSearchChange = (query: string) => {
    setSettings((prev) => ({ ...prev, searchQuery: query }))
  }

  const handleSort = (key: 'when_met' | 'firstName' | 'lastName') => {
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

  const filteredAndSortedMembers = useGroupMembers(allMembers, settings)

  if (!group || group.groupType?.code === 'family') {
    return null
  }

  return (
    <>
      <TooltipProvider>
        <div className="w-full px-2 sm:px-0">
          {settings.viewMode === 'quiz' ? (
            <div className="pt-4">
              <div className="flex justify-end gap-2">
                <Button
                  variant={'ghost'}
                  size="sm"
                  onClick={() =>
                    setSettings((prev) => ({ ...prev, viewMode: 'grid' }))
                  }
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={'secondary'}
                  size="sm"
                  onClick={handleSwitchToQuiz}
                >
                  <Gamepad2 className="h-6 w-6 text-orange-500" />
                </Button>
              </div>
              <div className="mt-4 rounded-xl bg-white p-3 dark:bg-gray-800">
                <GamesViewClient
                  members={allMembers}
                  groupSlug={group?.slug || ''}
                  currentUserId={ego?.userId}
                  onSwitchToGrid={handleSwitchToGrid}
                />
              </div>
            </div>
          ) : (
            <div>
              <GroupToolbar
                settings={settings}
                setSettings={setSettings}
                handleSort={handleSort}
                handleSwitchToQuiz={handleSwitchToQuiz}
                setTourOpen={setIsOpen}
              />

              <div className="relative mb-4" data-tour="search-input">
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
              <MemberGrid
                members={filteredAndSortedMembers}
                isGroupAdmin={isGroupAdmin}
                onRelate={handleOpenRelateModal}
                onConnect={handleOpenConnectModal}
                currentUserId={ego?.userId}
                groupSlug={groupSlug}
              />
            </div>
          )}
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
              Connect with {memberToConnect.user.name}?
            </h3>
            <div className="mt-2">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                If you already know {memberToConnect.user.name}, connect so
                they're in your "Met" filter.
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

const CommunityGroupClient: React.FC<CommunityGroupClientProps> = (props) => {
  const { group } = useGroup()

  const [settings, setSettings] = useLocalStorage<GroupPageSettings>(
    `group-settings-${group?.slug || ''}`,
    {
      sortConfig: { key: 'when_met', direction: 'desc' },
      viewMode: 'grid',
      searchQuery: '',
      filterByRealPhoto: true,
      filterMetStatus: 'met',
    },
  )

  const [hasMounted, setHasMounted] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    setHasMounted(true)
  }, [])

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkIsMobile()
    window.addEventListener('resize', checkIsMobile)
    return () => window.removeEventListener('resize', checkIsMobile)
  }, [])

  const tourSteps = useMemo(() => {
    if (isMobile) {
      return communityTourMobileSteps
    }
    return communityTourSteps
  }, [isMobile])

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
        maskWrapper: (base: React.CSSProperties) => {
          if (isMobile) {
            return { ...base, color: 'transparent' }
          }
          return base
        },
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
      />
    </TourProvider>
  )
}

export default CommunityGroupClient
