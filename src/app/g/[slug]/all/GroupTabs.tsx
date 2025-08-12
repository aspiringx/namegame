'use client'

import React, { useState, useEffect, Fragment, useMemo } from 'react'
import useLocalStorage from '@/hooks/useLocalStorage'
import { useRouter } from 'next/navigation'
import { Tab } from '@headlessui/react'
import { useInView } from 'react-intersection-observer'
import { MemberWithUser } from '@/types'
import MemberCard from '@/components/MemberCard'
import { getPaginatedMembers } from './actions'
import { useGroup } from '@/components/GroupProvider'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowUp, ArrowDown, LayoutGrid, List, X } from 'lucide-react'

interface GroupTabsProps {
  greetedMembers: MemberWithUser[]
  notGreetedMembers: MemberWithUser[]
  greetedCount: number
  notGreetedCount: number
  currentUserMember: MemberWithUser | undefined
}

function classNames(...classes: (string | boolean)[]) {
  return classes.filter(Boolean).join(' ')
}

function SearchableMemberList({
  initialMembers,
  listType,
  slug,
  searchQuery,
  viewMode,
}: {
  initialMembers: MemberWithUser[]
  listType: 'greeted' | 'notGreeted'
  slug: string
  searchQuery: string
  viewMode: 'grid' | 'list'
}) {
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

type SortKey = 'greeted' | 'firstName' | 'lastName'
type SortDirection = 'asc' | 'desc'

interface GroupPageSettings {
  sortConfig: { key: SortKey; direction: SortDirection }
  viewMode: 'grid' | 'list'
  searchQueries: { greeted: string; notGreeted: string }
  selectedTabIndex: number
}

type TabInfo = {
  name: string
  count: number
  members: MemberWithUser[]
  type: 'greeted' | 'notGreeted'
}

export default function GroupTabs({
  greetedMembers,
  notGreetedMembers,
  greetedCount,
  notGreetedCount,
  currentUserMember,
}: GroupTabsProps): React.JSX.Element | null {
  const router = useRouter()
  const { group, isAuthorizedMember, currentUserMember: ego } = useGroup()

  const [isMounted, setIsMounted] = useState(false)
  useEffect(() => {
    setIsMounted(true)
  }, [])

  const [settings, setSettings] = useLocalStorage<GroupPageSettings>(
    `group-settings-${group?.slug || ''}`,
    {
      sortConfig: { key: 'greeted', direction: 'desc' },
      viewMode: 'grid',
      searchQueries: { greeted: '', notGreeted: '' },
      selectedTabIndex: 0,
    },
  )

  const handleSort = (key: SortKey) => {
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

  useEffect(() => {
    if (isMounted && isAuthorizedMember === false) {
      router.push('/')
    }
  }, [isMounted, isAuthorizedMember, router])

  if (!isMounted || !group || group.groupType?.code === 'family') {
    return null
  }

  return (
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
                  classNames(
                    'w-full rounded-lg py-2.5 text-sm leading-5 font-medium',
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
                      className={classNames(
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
            {tabs.map((tab: TabInfo) => (
              <Tab.Panel
                key={tab.name}
                className={classNames(
                  'rounded-xl bg-white p-3 dark:bg-gray-800',
                  'ring-white/60 ring-offset-2 ring-offset-blue-400 focus:ring-2 focus:outline-none',
                )}
              >
                {tab.type === 'greeted' ? (
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
                              className="flex items-center gap-1 capitalize"
                            >
                              {key.replace('Name', '')}
                              {isActive && <SortIcon className="h-4 w-4" />}
                            </Button>
                          )
                        },
                      )}
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                      <Button
                        variant={settings.viewMode === 'grid' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() =>
                          setSettings((prev) => ({ ...prev, viewMode: 'grid' }))
                        }
                      >
                        <LayoutGrid className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={settings.viewMode === 'list' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() =>
                          setSettings((prev) => ({ ...prev, viewMode: 'list' }))
                        }
                      >
                        <List className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                    People you haven't greeted.
                  </p>
                )}

                {tab.count > 3 && (
                  <div className="relative mb-4">
                    <input
                      type="text"
                      placeholder={`Search ${tab.type === 'greeted' ? 'greeted' : 'not greeted'} members...`}
                      value={settings.searchQueries[tab.type]}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          searchQueries: {
                            ...prev.searchQueries,
                            [tab.type]: e.target.value,
                          },
                        }))
                      }
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 pr-10 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                    />
                    {settings.searchQueries[tab.type] && (
                      <button
                        onClick={() =>
                          setSettings((prev) => ({
                            ...prev,
                            searchQueries: { ...prev.searchQueries, [tab.type]: '' },
                          }))
                        }
                        className="absolute inset-y-0 right-0 flex items-center pr-3"
                      >
                        <X className="h-4 w-4 text-gray-400" />
                      </button>
                    )}
                  </div>
                )}
                <SearchableMemberList
                  initialMembers={tab.members}
                  listType={tab.type}
                  slug={group?.slug || ''}
                  searchQuery={settings.searchQueries[tab.type]}
                  viewMode={settings.viewMode}
                />
              </Tab.Panel>
            ))}
          </Tab.Panels>
        </Tab.Group>
      </div>
    </TooltipProvider>
  )
}
