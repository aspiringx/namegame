'use client'

import React, {
  useState,
  useEffect,
  Fragment,
  useMemo,
  useCallback,
} from 'react'
import useLocalStorage from '@/hooks/useLocalStorage'
import { useRouter } from 'next/navigation'
import { Tab } from '@headlessui/react'
import clsx from 'clsx'
import { useInView } from 'react-intersection-observer'
import type { MemberWithUser, FullRelationship } from '@/types'
import MemberCard from '@/components/MemberCard'
import dynamic from 'next/dynamic'
import {
  getPaginatedMembers,
  getGroupMembersForRelate,
  createAcquaintanceRelationship,
} from './actions'
import { getMemberRelations } from '@/lib/actions'
import RelateModal from '@/components/RelateModal'
import { useGroup } from '@/components/GroupProvider'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  ArrowUp,
  ArrowDown,
  LayoutGrid,
  List,
  X,
  Brain,
  HelpCircle,
} from 'lucide-react'
import NameQuizIntroModal from '@/components/NameQuizIntroModal'
import { TourProvider, useTour } from '@reactour/tour'
import {
  getGreetedSteps,
  getNotGreetedSteps,
} from '@/components/tours/CommunityTour'
import { steps as mobileSteps } from '@/components/tours/CommunityTourMobile'
import { useTheme } from 'next-themes'
import { Toaster, toast } from 'sonner'

const NameQuizViewClient = dynamic(
  () => import('@/components/NameQuizViewClient'),
  {
    loading: () => <div className="p-4 text-center">Loading quiz...</div>,
    ssr: false,
  },
)

interface GroupTabsProps {
  greetedMembers: MemberWithUser[]
  notGreetedMembers: MemberWithUser[]
  greetedCount: number
  notGreetedCount: number
  currentUserMember: MemberWithUser | undefined
}

interface GroupTabsContentProps extends GroupTabsProps {
  activeTour: 'greeted' | 'notGreeted' | null
  setActiveTour: React.Dispatch<React.SetStateAction<'greeted' | 'notGreeted' | null>>
  settings: GroupPageSettings
  setSettings: React.Dispatch<React.SetStateAction<GroupPageSettings>>
}

interface GroupPageSettings {
  sortConfig: {
    key: 'greeted' | 'firstName' | 'lastName'
    direction: 'asc' | 'desc'
  }
  viewMode: 'grid' | 'list' | 'quiz'
  searchQueries: { greeted: string; notGreeted: string }
  selectedTabIndex: number
}

interface TabInfo {
  name: string
  count: number
  members: MemberWithUser[]
  type: 'greeted' | 'notGreeted'
}

interface SearchableMemberListProps {
  initialMembers: MemberWithUser[]
  listType: 'greeted' | 'notGreeted'
  slug: string
  searchQuery: string
  viewMode: 'grid' | 'list' | 'quiz'
  isGroupAdmin?: boolean
  onRelate: (member: MemberWithUser) => void
  onConnect?: (member: MemberWithUser) => void
  currentUserId?: string
}

const SearchableMemberList: React.FC<SearchableMemberListProps> = ({
  initialMembers,
  listType,
  slug,
  searchQuery,
  viewMode,
  isGroupAdmin,
  onRelate,
  onConnect,
  currentUserId,
}) => {
  const [members, setMembers] = useState(initialMembers)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(initialMembers.length > 9)
  const [isLoading, setIsLoading] = useState(false)
  const { ref, inView } = useInView({ threshold: 0 })

  useEffect(() => {
    setMembers(
      initialMembers.filter((member) =>
        member.user.name.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    )
  }, [searchQuery, initialMembers])

  useEffect(() => {
    if (inView && hasMore && !isLoading && slug) {
      setIsLoading(true)
      getPaginatedMembers(slug, listType, page).then((newMembers) => {
        if (newMembers.length > 0) {
          setMembers((prev) => {
            const existingUserIds = new Set(prev.map((m) => m.userId))
            const uniqueNewMembers = newMembers.filter(
              (m) => !existingUserIds.has(m.userId),
            )
            return [...prev, ...uniqueNewMembers]
          })
          setPage((prev) => prev + 1)
        } else {
          setHasMore(false)
        }
        setIsLoading(false)
      })
    }
  }, [inView, hasMore, isLoading, slug, listType, page])

  const isListView = viewMode === 'list'

  return (
    <div
      className={
        isListView
          ? 'divide-y divide-gray-200 dark:divide-gray-700'
          : `grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3`
      }
    >
      {members.map((member) => (
        <MemberCard
          key={member.userId}
          member={member}
          listType={listType}
          viewMode={viewMode}
          isGroupAdmin={isGroupAdmin}
          onRelate={onRelate}
          onConnect={onConnect}
          currentUserId={currentUserId}
        />
      ))}
      {hasMore && (
        <div
          ref={ref}
          className="col-span-1 py-4 text-center text-gray-500 dark:text-gray-400"
        >
          {isLoading ? 'Loading...' : ''}
        </div>
      )}
    </div>
  )
}

const GroupTabsContent: React.FC<GroupTabsContentProps> = ({
  greetedMembers,
  notGreetedMembers,
  greetedCount,
  notGreetedCount,
  currentUserMember,
  activeTour,
  setActiveTour,
  settings,
  setSettings,
}) => {
  const isGroupAdmin = currentUserMember?.role?.code === 'admin'
  const { group, currentUserMember: ego } = useGroup()
  const { isOpen, setIsOpen } = useTour()

  const handleTabChange = (index: number) => {
    setSettings((prev) => ({ ...prev, selectedTabIndex: index }))
    if (isOpen && activeTour === 'greeted' && index === 1) {
      // User is in the first part of the tour and clicks the 'Not Greeted' tab
      setActiveTour('notGreeted')
    } else if (isOpen && activeTour === 'notGreeted' && index === 0) {
      // User is in the second part of the tour and clicks the 'Greeted' tab
      setActiveTour('greeted')
    }
  }
  const router = useRouter()

  const [hasMounted, setHasMounted] = useState(false)
  const [isRelateModalOpen, setIsRelateModalOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<MemberWithUser | null>(
    null,
  )
  const [memberRelations, setMemberRelations] = useState<FullRelationship[]>([])
  const [allGroupMembers, setAllGroupMembers] = useState<MemberWithUser[]>([])
  const [isLoadingRelations, setIsLoadingRelations] = useState(false)
  const [isIntroModalOpen, setIsIntroModalOpen] = useState(false)
  const [introSeen, setIntroSeen] = useLocalStorage(
    `nameQuizIntroSeen-${group?.slug || ''}`,
    false,
  )

  const allMembers = useMemo(
    () => [...greetedMembers, ...notGreetedMembers],
    [greetedMembers, notGreetedMembers],
  )

  useEffect(() => {
    if (group?.slug) {
      getGroupMembersForRelate(group.slug).then((members) =>
        setAllGroupMembers(members as MemberWithUser[]),
      )
    }
  }, [group?.slug])

  useEffect(() => {
    setHasMounted(true)
  }, [])

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

  const handleConnect = useCallback(
    async (member: MemberWithUser) => {
      if (!group?.slug) {
        console.error('groupSlug is not available. Cannot create relationship.')
        return
      }
      try {
        await createAcquaintanceRelationship(member.userId, group.slug)
        toast.success(`You are now connected with ${member.user.name}.`)
        router.refresh()
      } catch (error) {
        console.error('Failed to create acquaintance relationship:', error)
        toast.error('Failed to connect.')
      }
    },
    [group?.slug, router],
  )

  const handleCloseRelateModal = () => {
    setIsRelateModalOpen(false)
    setSelectedMember(null)
  }

  const handleSwitchToGrid = () => {
    setSettings((prev) => ({ ...prev, viewMode: 'grid' }))
  }

  const handleSwitchToList = () => {
    setSettings((prev) => ({ ...prev, viewMode: 'list' }))
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

  const handleSearchChange = (
    listType: 'greeted' | 'notGreeted',
    query: string,
  ) => {
    setSettings((prev) => ({
      ...prev,
      searchQueries: {
        ...prev.searchQueries,
        [listType]: query,
      },
    }))
  }

  const handleSort = (key: 'greeted' | 'firstName' | 'lastName') => {
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

  const tabs: TabInfo[] = useMemo(() => {
    const sortFunction = (a: MemberWithUser, b: MemberWithUser) => {
      if (settings.sortConfig.key === 'greeted') {
        const aGreeted = a.relationUpdatedAt
          ? new Date(a.relationUpdatedAt).getTime()
          : 0
        const bGreeted = b.relationUpdatedAt
          ? new Date(b.relationUpdatedAt).getTime()
          : 0
        return settings.sortConfig.direction === 'desc'
          ? bGreeted - aGreeted
          : aGreeted - bGreeted
      }

      const aKey = a.user[settings.sortConfig.key as 'firstName' | 'lastName']
      const bKey = b.user[settings.sortConfig.key as 'firstName' | 'lastName']

      if (!aKey || !bKey) return 0

      if (aKey < bKey) {
        return settings.sortConfig.direction === 'asc' ? -1 : 1
      } else if (aKey > bKey) {
        return settings.sortConfig.direction === 'asc' ? 1 : -1
      } else {
        return 0
      }
    }

    const sortableGreeted = [...greetedMembers].sort(sortFunction)
    const sortableNotGreeted = [...notGreetedMembers].sort(sortFunction)

    return [
      {
        name: 'Greeted',
        type: 'greeted' as const,
        members: sortableGreeted,
        count: greetedCount,
      },
      {
        name: 'Not Greeted',
        type: 'notGreeted' as const,
        members: sortableNotGreeted,
        count: notGreetedCount,
      },
    ]
  }, [
    greetedMembers,
    notGreetedMembers,
    greetedCount,
    notGreetedCount,
    settings.sortConfig,
  ])

  if (!group || group.groupType?.code === 'family') {
    return null
  }

  return (
    <>
      <TooltipProvider>
        <div className="w-full px-2 sm:px-0">
          {hasMounted && settings.viewMode === 'quiz' ? (
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
                  variant={'ghost'}
                  size="sm"
                  onClick={() =>
                    setSettings((prev) => ({ ...prev, viewMode: 'list' }))
                  }
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={'secondary'}
                  size="sm"
                  onClick={handleSwitchToQuiz}
                >
                  <Brain className="h-4 w-4 text-orange-500" />
                </Button>
              </div>
              <div className="mt-4 rounded-xl bg-white p-3 dark:bg-gray-800">
                <NameQuizViewClient
                  members={allMembers}
                  groupSlug={group?.slug || ''}
                  currentUserId={ego?.userId}
                  onSwitchToGrid={handleSwitchToGrid}
                  onSwitchToList={handleSwitchToList}
                />
              </div>
            </div>
          ) : hasMounted ? (
            <Tab.Group
              selectedIndex={settings.selectedTabIndex}
              onChange={handleTabChange}
            >
              <Tab.List
                className="flex space-x-1 rounded-xl bg-blue-900/20 p-1"
                data-tour="greeted-not-greeted-tabs"
              >
                {tabs.map((tab) => (
                  <Tab
                    key={tab.name}
                    className={({ selected }) =>
                      clsx(
                        'w-full rounded-lg py-2.5 text-sm font-medium',
                        'ring-opacity-60 ring-white ring-offset-2 ring-offset-blue-400 focus:ring-2 focus:outline-none',
                        selected
                          ? 'bg-white text-blue-700 shadow dark:bg-gray-800 dark:text-white'
                          : 'text-gray-600 hover:bg-white/[0.12] hover:text-white dark:text-blue-100',
                      )
                    }
                  >
                    {({ selected }) => (
                      <div className="flex items-center justify-center gap-2">
                        <span>{tab.name}</span>
                        <Badge
                          className={clsx(
                            'rounded-full px-2 py-0.5 text-xs font-medium',
                            selected
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
                          )}
                        >
                          {tab.count}
                        </Badge>
                      </div>
                    )}
                  </Tab>
                ))}
              </Tab.List>

              {/* Sort and View Mode Buttons */}
              <div className="md:-pt-0 mt-1 mb-4 flex items-center justify-between pt-2">
                {/* Sort Buttons */}
                <div className="flex items-center gap-2">
                  {(['greeted', 'firstName', 'lastName'] as const).map((key) => {
                    const isActive = settings.sortConfig.key === key
                    const SortIcon =
                      settings.sortConfig.direction === 'asc'
                        ? ArrowUp
                        : ArrowDown
                    return (
                      <Button
                        key={key}
                        variant={isActive ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => handleSort(key)}
                        className={clsx('flex items-center gap-1 capitalize', {
                          'hidden md:flex':
                            key === 'firstName' || key === 'lastName',
                        })}
                      >
                        {key.replace('Name', '')}
                        {isActive && <SortIcon className="h-4 w-4" />}
                      </Button>
                    )
                  })}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setActiveTour('greeted')
                      setIsOpen(true)
                    }}
                    data-tour="help-button"
                  >
                    <HelpCircle className="h-4 w-4" />
                  </Button>
                </div>

                {/* View Mode Buttons */}
                <div className="flex items-center gap-2">
                  <Button
                    variant={
                      settings.viewMode === 'grid' ? 'secondary' : 'ghost'
                    }
                    size="sm"
                    onClick={() =>
                      setSettings((prev) => ({ ...prev, viewMode: 'grid' }))
                    }
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={
                      settings.viewMode === 'list' ? 'secondary' : 'ghost'
                    }
                    size="sm"
                    onClick={() =>
                      setSettings((prev) => ({ ...prev, viewMode: 'list' }))
                    }
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSwitchToQuiz}
                  >
                    <Brain className="h-4 w-4 text-orange-500" />
                  </Button>
                </div>
              </div>

              <Tab.Panels className="mt-2">
                {tabs.map((tab) => (
                  <Tab.Panel
                    key={tab.name}
                    className={clsx(
                      'rounded-xl bg-white p-3 dark:bg-gray-800',
                      'ring-white/60 ring-offset-2 ring-offset-blue-400 focus:ring-2 focus:outline-none',
                    )}
                  >
                    <div className="relative mb-4">
                      <Input
                        type="text"
                        placeholder="Search by name..."
                        value={settings.searchQueries[tab.type]}
                        onChange={(e) =>
                          handleSearchChange(tab.type, e.target.value)
                        }
                        className="pr-10 pl-4"
                      />
                      {settings.searchQueries[tab.type] && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-1/2 right-1 h-8 w-8 -translate-y-1/2"
                          onClick={() => handleSearchChange(tab.type, '')}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <SearchableMemberList
                      initialMembers={tab.members}
                      listType={tab.type}
                      slug={group?.slug || ''}
                      searchQuery={settings.searchQueries[tab.type]}
                      viewMode={settings.viewMode}
                      isGroupAdmin={isGroupAdmin}
                      onRelate={handleOpenRelateModal}
                      onConnect={handleConnect}
                      currentUserId={ego?.userId}
                    />
                  </Tab.Panel>
                ))}
              </Tab.Panels>
            </Tab.Group>
          ) : (
            <div className="py-8 text-center text-gray-500 dark:text-gray-400">
              Loading...
            </div>
          )}
        </div>
      </TooltipProvider>
      <NameQuizIntroModal
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
    </>
  )
}

const GroupTabs: React.FC<GroupTabsProps> = (props) => {
  const { group } = useGroup()

  const [settings, setSettings] = useLocalStorage<GroupPageSettings>(
    `group-settings-${group?.slug || ''}`,
    {
      sortConfig: { key: 'greeted', direction: 'desc' },
      viewMode: 'grid',
      searchQueries: { greeted: '', notGreeted: '' },
      selectedTabIndex: 0,
    },
  )

  const [activeTour, setActiveTour] = useState<'greeted' | 'notGreeted' | null>(
    null,
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
      return mobileSteps
    }
    if (activeTour === 'notGreeted') {
      return getNotGreetedSteps(props.notGreetedCount)
    }
    // Default to 'greeted' steps, even if activeTour is null initially
    return getGreetedSteps(() => {
      setActiveTour('notGreeted')
      setSettings((prev) => ({ ...prev, selectedTabIndex: 1 }))
    })
  }, [isMobile, activeTour, props.notGreetedCount, setSettings])

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
        }),
        arrow: (base: React.CSSProperties) => ({
          ...base,
          display: 'block',
          color: 'var(--foreground)',
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
      <GroupTabsContent
        {...props}
        activeTour={activeTour}
        setActiveTour={setActiveTour}
        settings={settings}
        setSettings={setSettings}
      />
    </TourProvider>
  )
}

export default GroupTabs
