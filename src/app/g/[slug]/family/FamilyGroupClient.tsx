'use client'

import { useState, useEffect, useMemo } from 'react'
import { useInView } from 'react-intersection-observer'
import { MemberWithUser } from '@/types'
import { getPaginatedMembers } from './actions'
import FamilyMemberCard from '@/components/FamilyMemberCard'
import { getFamilyRelationships } from './actions'
import { getRelationship } from '@/lib/family-tree'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { ArrowUp, ArrowDown, LayoutGrid, List, Shuffle } from 'lucide-react'
import { useGroup } from '@/components/GroupProvider'

type SortKey = 'firstName' | 'lastName' | 'random'
type SortDirection = 'asc' | 'desc'

interface FamilyGroupClientProps {
  initialMembers: MemberWithUser[]
  groupSlug: string
  initialMemberCount: number
}

export function FamilyGroupClient({
  initialMembers,
  groupSlug,
  initialMemberCount,
}: FamilyGroupClientProps) {
  const [members, setMembers] = useState(initialMembers)
  const [page, setPage] = useState(2)
  const [hasMore, setHasMore] = useState(
    initialMembers.length < initialMemberCount,
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [sortConfig, setSortConfig] = useState<{
    key: SortKey
    direction: SortDirection
  }>({ key: 'firstName', direction: 'asc' })
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const { group, isAuthorizedMember, currentUserMember } = useGroup()
  const [relationshipMap, setRelationshipMap] = useState<Map<string, string>>(
    new Map(),
  )
  const { ref, inView } = useInView()

  useEffect(() => {
    async function fetchAndSetRelationships() {
      if (group?.slug && currentUserMember) {
        const relationships = await getFamilyRelationships(group.slug)
        const newMap = new Map<string, string>()

        for (const alter of members) {
          if (alter.userId === currentUserMember.userId) continue
          const result = getRelationship(
            currentUserMember.userId,
            alter.userId,
            relationships,
          )
          if (result) {
            newMap.set(alter.userId, result.relationship || '')
          }
        }
        setRelationshipMap(newMap)
      }
    }

    fetchAndSetRelationships()
  }, [group, members, currentUserMember])

  useEffect(() => {
    const loadMoreMembers = async () => {
      if (inView && hasMore) {
        if (!groupSlug) return
        const newMembers = await getPaginatedMembers(groupSlug, page)
        if (newMembers.length > 0) {
          setMembers((prevMembers) => [...prevMembers, ...newMembers])
          setPage((prevPage) => prevPage + 1)
        } else {
          setHasMore(false)
        }
      }
    }

    loadMoreMembers()
  }, [inView, hasMore, page, groupSlug])

  const handleSort = (key: SortKey) => {
    if (key === 'random') {
      setSortConfig({ key, direction: 'asc' }) // direction doesn't matter for random
      return
    }
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
      }
      return { key, direction: 'asc' }
    })
  }

  const filteredAndSortedMembers = useMemo(() => {
    const lowercasedQuery = searchQuery.toLowerCase()
    const filtered = members.filter((member) => {
      const nameMatch = member.user.name
        ?.toLowerCase()
        .includes(lowercasedQuery)
      const relationship = relationshipMap.get(member.userId) || ''
      const relationshipMatch = relationship.toLowerCase().includes(lowercasedQuery)
      return nameMatch || relationshipMatch
    })

    if (sortConfig.key === 'random') {
      return filtered.sort(() => Math.random() - 0.5)
    }

    const sortFunction = (a: MemberWithUser, b: MemberWithUser) => {
      const aName = a.user.name || ''
      const bName = b.user.name || ''
      let aValue: string, bValue: string

      if (sortConfig.key === 'lastName') {
        aValue = aName.split(' ').pop() || ''
        bValue = bName.split(' ').pop() || ''
      } else {
        // firstName
        aValue = aName.split(' ')[0] || ''
        bValue = bName.split(' ')[0] || ''
      }

      if (aValue.toLowerCase() < bValue.toLowerCase())
        return sortConfig.direction === 'asc' ? -1 : 1
      if (aValue.toLowerCase() > bValue.toLowerCase())
        return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    }

    return filtered.sort(sortFunction)
  }, [members, searchQuery, sortConfig, relationshipMap])

  return (
    <>
      <div className="bg-background border-border sticky top-16 z-10 border-b py-4">
        <div className="container mx-auto px-4">
          <div className="mb-4 flex items-center">
            <div className="flex items-center gap-2">
              {(['firstName', 'lastName'] as const).map((key) => {
                const isActive = sortConfig.key === key
                const SortIcon =
                  sortConfig.direction === 'asc' ? ArrowUp : ArrowDown
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
              })}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      key="random"
                      variant={
                        sortConfig.key === 'random' ? 'secondary' : 'ghost'
                      }
                      size="sm"
                      onClick={() => handleSort('random')}
                      className="flex items-center gap-1 capitalize"
                    >
                      <Shuffle className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Shuffle randomly</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="relative mt-4">
            <input
              type="text"
              placeholder="Search members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 pr-10 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
            />
          </div>
        </div>
      </div>

      <div
        className={`container mx-auto px-4 ${viewMode === 'grid' ? 'mt-4' : ''}`}
      >
        <div
          className={
            viewMode === 'list'
              ? 'grid grid-cols-1 gap-2'
              : 'grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'
          }
        >
          {filteredAndSortedMembers.map((member) => (
            <FamilyMemberCard
              key={member.userId}
              member={member}
              viewMode={viewMode}
              relationship={relationshipMap.get(member.userId)}
            />
          ))}
        </div>

        {hasMore && (
          <div ref={ref} className="p-4 text-center">
            Loading more...
          </div>
        )}
      </div>
    </>
  )
}
