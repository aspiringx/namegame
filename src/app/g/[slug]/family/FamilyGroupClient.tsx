'use client'

import { useRouter } from 'next/navigation'
import React, { useState, useEffect, useMemo, useCallback } from 'react'
import useLocalStorage from '@/hooks/useLocalStorage'
import { useInView } from 'react-intersection-observer'
import { MemberWithUser, FullRelationship, User } from '@/types'
import {
  getPaginatedMembers,
  getGroupMembersForRelate,
  getMemberRelations,
} from './actions'
import FamilyMemberCard from '@/components/FamilyMemberCard'
import RelateModal from '@/components/RelateModal'
import { getRelationship } from '@/lib/family-tree'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { ArrowUp, ArrowDown, LayoutGrid, List, X } from 'lucide-react'
import { useGroup } from '@/components/GroupProvider'

type SortKey = 'closest' | 'firstName' | 'lastName'
type SortDirection = 'asc' | 'desc'

interface FamilyPageSettings {
  searchQuery: string
  sortConfig: {
    key: SortKey
    direction: SortDirection
  }
  viewMode: 'grid' | 'list'
}

interface FamilyGroupClientProps {
  initialMembers: MemberWithUser[]
  groupSlug: string
  initialMemberCount: number
  initialRelationships: FullRelationship[]
}

export function FamilyGroupClient({
  initialMembers,
  groupSlug,
  initialMemberCount,
  initialRelationships,
}: FamilyGroupClientProps): React.JSX.Element | null {
  const [members, setMembers] = useState(initialMembers)
  const [page, setPage] = useState(2)
  const [hasMore, setHasMore] = useState(
    initialMembers.length < initialMemberCount,
  )

  const [settings, setSettings] = useLocalStorage<FamilyPageSettings>(
    `family-group-settings-${groupSlug}`,
    {
      searchQuery: '',
      sortConfig: { key: 'closest', direction: 'asc' },
      viewMode: 'grid',
    },
  )
  const { group, isGroupAdmin, currentUserMember } = useGroup()
  const { ref, inView } = useInView()
  const router = useRouter()

  const [isRelateModalOpen, setIsRelateModalOpen] = useState(false)
  const [isLoadingRelations, setIsLoadingRelations] = useState(false)
  const [selectedMember, setSelectedMember] = useState<MemberWithUser | null>(
    null,
  )
  const [memberRelations, setMemberRelations] = useState<
    Awaited<ReturnType<typeof getMemberRelations>>
  >([])
  const [allGroupMembers, setAllGroupMembers] = useState<MemberWithUser[]>([])

  const [isMounted, setIsMounted] = useState(false)
  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    setMembers(initialMembers)
  }, [initialMembers])

  useEffect(() => {
    if (groupSlug) {
      getGroupMembersForRelate(groupSlug).then((members) =>
        setAllGroupMembers(members as MemberWithUser[]),
      )
    }
  }, [groupSlug])

  const handleOpenRelateModal = useCallback(
    async (member: MemberWithUser) => {
      if (!groupSlug) {
        console.error('groupSlug is not available. Cannot fetch relations.')
        // Optionally, show a toast to the user
        return
      }

      setSelectedMember(member)
      setIsLoadingRelations(true)
      try {
        const relations = await getMemberRelations(member.userId, groupSlug)
        setMemberRelations(relations)
        setIsRelateModalOpen(true)
      } catch (error) {
        console.error('Failed to get member relations:', error)
        // Optionally, show a toast notification here
      } finally {
        setIsLoadingRelations(false)
      }
    },
    [groupSlug],
  )

  const handleCloseRelateModal = () => {
    setIsRelateModalOpen(false)
    setSelectedMember(null)
  }

  const handleRelationshipChange = () => {
    router.refresh()
  }

  const relationshipMap = useMemo(() => {
    if (!currentUserMember) {
      return new Map<string, { label: string; steps: number }>()
    }

    const usersMap = new Map<string, User>()
    initialMembers.forEach((member) => {
      usersMap.set(member.user.id, member.user)
    })

    const newMap = new Map<string, { label: string; steps: number }>()
    for (const alter of initialMembers) {
      if (alter.userId === currentUserMember.userId) continue
      const result = getRelationship(
        currentUserMember.userId,
        alter.userId,
        initialRelationships,
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
  }, [currentUserMember, initialMembers, initialRelationships])

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

  const filteredAndSortedMembers = useMemo(() => {
    let filtered = members
    if (settings.searchQuery) {
      filtered = members.filter((member) => {
        const relationship = relationshipMap.get(member.userId)?.label || ''
        const name = `${member.user.firstName} ${member.user.lastName}`
        const searchTerm = settings.searchQuery.toLowerCase()

        return (
          name.toLowerCase().includes(searchTerm) ||
          relationship.toLowerCase().includes(searchTerm)
        )
      })
    }

    if (settings.sortConfig.key === 'closest') {
      return [...filtered].sort((a, b) => {
        const aRel = relationshipMap.get(a.userId)
        const bRel = relationshipMap.get(b.userId)
        const aSteps = aRel ? aRel.steps : Infinity
        const bSteps = bRel ? bRel.steps : Infinity

        if (aSteps !== bSteps) {
          return settings.sortConfig.direction === 'asc'
            ? aSteps - bSteps
            : bSteps - aSteps
        }

        // Secondary sort by first name
        const aName = a.user.firstName || ''
        const bName = b.user.firstName || ''
        return aName.localeCompare(bName)
      })
    }

    return [...filtered].sort((a, b) => {
      const { key, direction } = settings.sortConfig
      const aValue =
        a.user[key === 'firstName' ? 'firstName' : 'lastName'] || ''
      const bValue =
        b.user[key === 'firstName' ? 'firstName' : 'lastName'] || ''

      if (aValue < bValue) return direction === 'asc' ? -1 : 1
      if (aValue > bValue) return direction === 'asc' ? 1 : -1
      return 0
    })
  }, [members, settings.searchQuery, settings.sortConfig])

  if (!isMounted) {
    return null // Or a loading spinner
  }

  return (
    <>
      <div className="bg-background border-border sticky top-16 z-10 border-b py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              {(['closest', 'firstName', 'lastName'] as const).map((key) => {
                const isActive = settings.sortConfig.key === key
                const SortIcon =
                  settings.sortConfig.direction === 'asc' ? ArrowUp : ArrowDown
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
          <div className="relative mt-4">
            <input
              type="text"
              placeholder="Search members..."
              value={settings.searchQuery}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  searchQuery: e.target.value,
                }))
              }
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 pr-10 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
            />
            {settings.searchQuery && (
              <button
                onClick={() =>
                  setSettings((prev) => ({
                    ...prev,
                    searchQuery: '',
                  }))
                }
                className="absolute inset-y-0 right-0 flex items-center pr-3"
              >
                <X className="h-4 w-4 text-gray-400" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div
        className={`container mx-auto px-4 ${settings.viewMode === 'grid' ? 'mt-4' : ''}`}
      >
        <div
          className={
            settings.viewMode === 'list'
              ? 'grid grid-cols-1 gap-2'
              : 'grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'
          }
        >
          {filteredAndSortedMembers.map((member) => (
            <FamilyMemberCard
              key={member.userId}
              member={member}
              viewMode={settings.viewMode}
              relationship={relationshipMap.get(member.userId)?.label}
              onRelate={handleOpenRelateModal}
              currentUserId={currentUserMember?.userId}
              isGroupAdmin={isGroupAdmin}
              groupMembers={allGroupMembers}
            />
          ))}
        </div>

        {hasMore && (
          <div ref={ref} className="p-4 text-center">
            Loading more...
          </div>
        )}
      </div>

      {selectedMember && group?.groupType && (
        <RelateModal
        isOpen={isRelateModalOpen}
        onClose={handleCloseRelateModal}
        member={selectedMember}
        groupType={group.groupType}
        groupMembers={allGroupMembers}
        groupSlug={groupSlug}
        initialRelations={memberRelations}
        onRelationshipAdded={handleRelationshipChange}
        isReadOnly={!isGroupAdmin && selectedMember?.userId !== currentUserMember?.userId}
        />
      )}
    </>
  )
}
