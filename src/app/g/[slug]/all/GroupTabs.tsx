'use client'

import React, { useState, useEffect, Fragment, useMemo, useCallback } from 'react'
import useLocalStorage from '@/hooks/useLocalStorage'
import { useRouter } from 'next/navigation'
import { Tab } from '@headlessui/react'
import clsx from 'clsx'
import { useInView } from 'react-intersection-observer'
import type { MemberWithUser, FullRelationship } from '@/types'
import MemberCard from '@/components/MemberCard'
import dynamic from 'next/dynamic'

const NameQuizViewClient = dynamic(
  () => import('@/components/NameQuizViewClient'),
  {
    loading: () => <div className="text-center p-4">Loading quiz...</div>,
    ssr: false,
  },
)
import {
  getPaginatedMembers,
  getGroupMembersForRelate,
} from './actions'
import { getMemberRelations } from '@/lib/actions'
import RelateModal from '@/components/RelateModal'
import { useGroup } from '@/components/GroupProvider'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowUp, ArrowDown, LayoutGrid, List, X, Brain } from 'lucide-react'

interface GroupTabsProps {
  greetedMembers: MemberWithUser[]
  notGreetedMembers: MemberWithUser[]
  greetedCount: number
  notGreetedCount: number
  currentUserMember: MemberWithUser | undefined
}

interface GroupPageSettings {
  sortConfig: { key: 'greeted' | 'firstName' | 'lastName'; direction: 'asc' | 'desc' };
  viewMode: 'grid' | 'list' | 'quiz';
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
  groupMembers: MemberWithUser[]
  onRelate: (member: MemberWithUser) => void
  currentUserId?: string
}

const SearchableMemberList: React.FC<SearchableMemberListProps> = ({
  initialMembers,
  listType,
  slug,
  searchQuery,
  viewMode,
  isGroupAdmin,
  groupMembers,
  onRelate,
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

  const isListView = listType === 'greeted' && viewMode === 'list'

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
          groupMembers={groupMembers}
          onRelate={onRelate}
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

const GroupTabs: React.FC<GroupTabsProps> = ({
  greetedMembers,
  notGreetedMembers,
  greetedCount,
  notGreetedCount,
  currentUserMember,
}) => {
  const isGroupAdmin = currentUserMember?.role?.code === 'admin'
  const { group, currentUserMember: ego } = useGroup()
  const router = useRouter()

  const [settings, setSettings] = useLocalStorage<GroupPageSettings>(
    `group-settings-${group?.slug || ''}`,
    {
      sortConfig: { key: 'greeted', direction: 'desc' },
      viewMode: 'grid',
      searchQueries: { greeted: '', notGreeted: '' },
      selectedTabIndex: 0,
    },
  )

  const [isLoading, setIsLoading] = useState(true)
  const [isRelateModalOpen, setIsRelateModalOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<MemberWithUser | null>(
    null,
  )
  const [memberRelations, setMemberRelations] = useState<FullRelationship[]>([])
  const [allGroupMembers, setAllGroupMembers] = useState<MemberWithUser[]>([])
  const [isLoadingRelations, setIsLoadingRelations] = useState(false)

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
    // Check if settings are loaded from localStorage
    if (settings && settings.viewMode) {
      setIsLoading(false)
    }
  }, [settings])

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

  const handleCloseRelateModal = () => {
    setIsRelateModalOpen(false)
    setSelectedMember(null)
  }

  const handleRelationshipChange = () => {
    router.refresh()
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
          <Tab.Group
            selectedIndex={settings.selectedTabIndex}
            onChange={(index) =>
              setSettings((prev) => ({ ...prev, selectedTabIndex: index }))
            }
          >
            <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/20 p-1">
              {tabs.map((tab) => (
                <Tab
                  key={tab.name}
                  className={({ selected }) =>
                    clsx(
                      'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                      'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
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
            <Tab.Panels className="mt-2">
              {isLoading ? (
                <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                  Loading...
                </div>
              ) : (
                tabs.map((tab: TabInfo) => (
                  <Tab.Panel
                    key={tab.name}
                    className={clsx(
                      'rounded-xl bg-white p-3 dark:bg-gray-800',
                      'ring-white/60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                    )}
                  >
                    {tab.type === 'greeted' && (
                      <div className="mb-4 flex items-center">
                        <div className="flex items-center gap-2">
                          {(['greeted', 'firstName', 'lastName'] as const).map(
                            (key) => {
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
                                  className={clsx(
                                    'flex items-center gap-1 capitalize',
                                    {
                                      'hidden md:flex':
                                        key === 'firstName' ||
                                        key === 'lastName',
                                    },
                                  )}
                                >
                                  {key.replace('Name', '')}
                                  {isActive && (
                                    <SortIcon className="h-4 w-4" />
                                  )}
                                </Button>
                              )
                            },
                          )}
                        </div>
                        <div className="ml-auto flex items-center gap-2">
                          <Button
                            variant={
                              settings.viewMode === 'grid'
                                ? 'secondary'
                                : 'ghost'
                            }
                            size="sm"
                            onClick={() =>
                              setSettings((prev) => ({
                                ...prev,
                                viewMode: 'grid',
                              }))
                            }
                          >
                            <LayoutGrid className="h-4 w-4" />
                          </Button>
                          <Button
                            variant={
                              settings.viewMode === 'list'
                                ? 'secondary'
                                : 'ghost'
                            }
                            size="sm"
                            onClick={() =>
                              setSettings((prev) => ({
                                ...prev,
                                viewMode: 'list',
                              }))
                            }
                          >
                            <List className="h-4 w-4" />
                          </Button>
                          <Button
                            variant={
                              settings.viewMode === 'quiz'
                                ? 'secondary'
                                : 'ghost'
                            }
                            size="sm"
                            onClick={() =>
                              setSettings((prev) => ({
                                ...prev,
                                viewMode: 'quiz',
                              }))
                            }
                          >
                            <Brain className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {settings.viewMode === 'quiz' && tab.type === 'greeted' ? (
                      <NameQuizViewClient
                        members={allMembers.filter((m) => m.user.photoUrl)}
                        groupSlug={group?.slug || ''}
                        currentUserId={ego?.userId}
                      />
                    ) : settings.viewMode !== 'quiz' ? (
                      <SearchableMemberList
                        initialMembers={tab.members}
                        listType={tab.type}
                        slug={group?.slug || ''}
                        searchQuery={settings.searchQueries[tab.type]}
                        viewMode={settings.viewMode}
                        isGroupAdmin={isGroupAdmin}
                        groupMembers={allMembers}
                        onRelate={handleOpenRelateModal}
                        currentUserId={ego?.userId}
                      />
                    ) : null}
                  </Tab.Panel>
                ))
              )}
            </Tab.Panels>
          </Tab.Group>
        </div>
      </TooltipProvider>
      {isRelateModalOpen && selectedMember && group?.groupType && ego && (
        <RelateModal
          isOpen={isRelateModalOpen}
          onClose={handleCloseRelateModal}
          member={selectedMember}
          groupType={group.groupType}
          groupMembers={allGroupMembers}
          groupSlug={group?.slug || ''}
          initialRelations={memberRelations}
          onRelationshipAdded={handleRelationshipChange}
          isReadOnly={!isGroupAdmin && selectedMember?.userId !== ego?.userId}
          loggedInUserId={ego.userId}
        />
      )}
    </>
  )
}

export default GroupTabs
