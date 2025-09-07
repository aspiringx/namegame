'use client'

import { useRouter } from 'next/navigation'
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import useLocalStorage from '@/hooks/useLocalStorage'
import { useInView } from 'react-intersection-observer'
import { saveMembers, getMembersByGroup } from '@/lib/db'
import { MemberWithUser, FullRelationship, User } from '@/types'
import { getGroupMembersForRelate } from './actions'
import dynamic from 'next/dynamic'
import { getMemberRelations } from '@/lib/actions'
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
import {
  ArrowUp,
  ArrowDown,
  GitFork,
  LayoutGrid,
  List,
  X,
  FlaskConical,
  Brain,
  Image as Photo,
} from 'lucide-react'
import { ReactFlowProvider } from 'reactflow'
import FamilyTree from './FamilyTree'
import type { FamilyTreeRef } from './FamilyTree'
import { FocalUserSearch } from './FocalUserSearch'
import { useGroup } from '@/components/GroupProvider'
import NameQuizIntroModal from '@/components/NameQuizIntroModal'
import { GuestMessage } from '@/components/GuestMessage'

const PAGE_SIZE = 10

type SortKey = 'joined' | 'firstName' | 'lastName'
type SortDirection = 'asc' | 'desc'

interface FamilyPageSettings {
  searchQuery: string
  sortConfig: {
    key: SortKey
    direction: SortDirection
  }
  viewMode: 'grid' | 'list' | 'tree' | 'quiz'
  filterByRealPhoto: boolean
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
  initialRelationships,
}: FamilyGroupClientProps): React.JSX.Element | null {
  const [members, setMembers] = useState<MemberWithUser[]>(initialMembers)
  const [isLoading, setIsLoading] = useState(true)

  const { group, isGroupAdmin, currentUserMember } = useGroup()
  const isGuest = !currentUserMember || currentUserMember.role?.code === 'guest'

  const [settings, setSettings] = useLocalStorage<FamilyPageSettings>(
    `family-group-settings-${groupSlug}`,
    {
      searchQuery: '',
      sortConfig: { key: 'joined', direction: 'desc' },
      viewMode: 'grid',
      filterByRealPhoto: false,
    },
  )
  const prevIsGuestRef = useRef(isGuest)

  const router = useRouter()
  const treeContainerRef = useRef<HTMLDivElement>(null)
  const familyTreeRef = useRef<FamilyTreeRef>(null)
  const [treeHeight, setTreeHeight] = useState(600) // Default height

  const [isRelateModalOpen, setIsRelateModalOpen] = useState(false)
  const [isLoadingRelations, setIsLoadingRelations] = useState(false)
  const [selectedMember, setSelectedMember] = useState<MemberWithUser | null>(
    null,
  )
  const [memberRelations, setMemberRelations] = useState<
    Awaited<ReturnType<typeof getMemberRelations>>
  >([])
  const [allGroupMembers, setAllGroupMembers] = useState<MemberWithUser[]>([])
  const [isResetDisabled, setIsResetDisabled] = useState(true)
  const [isExperimentalTooltipOpen, setIsExperimentalTooltipOpen] =
    useState(false)
  const [isIntroModalOpen, setIsIntroModalOpen] = useState(false)

  const [introSeen, setIntroSeen] = useLocalStorage(
    `nameQuizIntroSeen-${groupSlug}`,
    false,
  )

  useEffect(() => {
    async function loadMembers() {
      if (!group?.id) return

      // 1. Try to load from IndexedDB first
      const cachedMembers = await getMembersByGroup(group.id)
      if (cachedMembers.length > 0) {
        setMembers(cachedMembers)
        setIsLoading(false)
      }

      // 2. Fetch from server to get the latest data
      // The initialMembers prop contains the server-fetched data
      if (initialMembers.length > 0) {
        setMembers(initialMembers)
        await saveMembers(initialMembers) // Update cache
      }

      if (!cachedMembers.length && !initialMembers.length) {
        // Handle case where there's nothing in cache and server fetch fails
        console.error('Failed to load members.')
      }
      
      setIsLoading(false)
    }

    loadMembers()
  }, [group?.id, initialMembers])

  useEffect(() => {
    if (groupSlug) {
      getGroupMembersForRelate(groupSlug).then((members) =>
        setAllGroupMembers(members as MemberWithUser[]),
      )
    }
  }, [groupSlug])

  useEffect(() => {
    if (members.length > 0 && 'serviceWorker' in navigator) {
      const imageUrls = members
        .map((member) => member.user.photoUrl)
        .filter((url): url is string => !!url)

      navigator.serviceWorker.ready.then((registration) => {
        registration.active?.postMessage({
          type: 'CACHE_IMAGES',
          payload: { imageUrls },
        })
      })
    }
  }, [members])

  const handleOpenRelateModal = useCallback(
    async (member: MemberWithUser) => {
      if (!groupSlug) {
        console.error('groupSlug is not available. Cannot fetch relations.')
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

  const filteredAndSortedMembers = useMemo(() => {
    let filtered = members

    if (settings.filterByRealPhoto) {
      filtered = filtered.filter(
        (member) =>
          member.user.photoUrl &&
          !member.user.photoUrl.includes('api.dicebear.com') &&
          !member.user.photoUrl.includes('default-avatar.png'),
      )
    }

    if (settings.searchQuery) {
      filtered = filtered.filter((member) => {
        const name = `${member.user.firstName} ${member.user.lastName}`
        return name.toLowerCase().includes(settings.searchQuery.toLowerCase())
      })
    }

    return [...filtered].sort((a, b) => {
      const { key, direction } = settings.sortConfig

      if (key === 'joined') {
        const aDate = new Date(a.createdAt).getTime()
        const bDate = new Date(b.createdAt).getTime()
        return direction === 'asc' ? aDate - bDate : bDate - aDate
      }

      // Handle firstName and lastName sorting
      const aValue = a.user[key] || ''
      const bValue = b.user[key] || ''

      if (aValue < bValue) return direction === 'asc' ? -1 : 1
      if (aValue > bValue) return direction === 'asc' ? 1 : -1
      return 0
    })
  }, [members, settings.sortConfig, settings.filterByRealPhoto, settings.searchQuery])

  const relationshipMap = useMemo(() => {
    if (!currentUserMember) {
      return new Map<string, { label: string; steps: number }>()
    }

    const usersMap = new Map<string, User>()
    members.forEach((member) => {
      usersMap.set(member.user.id, member.user)
    })

    const newMap = new Map<string, { label: string; steps: number }>()
    for (const alter of members) {
      if (alter.userId === currentUserMember.userId) continue
      const result = getRelationship(
        currentUserMember.userId,
        alter.userId,
        initialRelationships,
        members,
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
  }, [currentUserMember, members, initialRelationships])

  const treeRelationshipMap = useMemo(() => {
    const newMap = new Map<string, string>()
    for (const [userId, rel] of relationshipMap.entries()) {
      newMap.set(userId, rel.label)
    }
    if (currentUserMember) {
      newMap.set(currentUserMember.userId, 'Me')
    }
    return newMap
  }, [relationshipMap, currentUserMember])

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

  const handleSwitchToGrid = () => {
    setSettings((prev) => ({ ...prev, viewMode: 'grid' }))
  }

  const handleSwitchToList = () => {
    setSettings((prev) => ({ ...prev, viewMode: 'list' }))
  }

  const NameQuizViewClient = dynamic(
    () => import('@/components/NameQuizViewClient'),
    {
      loading: () => <div className="p-4 text-center">Loading quiz...</div>,
      ssr: false,
    },
  )

  if (!members.length) {
    return null
  }

  return (
    <>
      <GuestMessage
        isGuest={!currentUserMember || currentUserMember.role?.code === 'guest'}
        firstName={currentUserMember?.user?.firstName}
        groupName={group?.name}
        groupType={group?.groupType?.code}
      />
      <div className="bg-background border-border sticky top-16 z-10 border-b py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {settings.viewMode === 'tree' ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => familyTreeRef.current?.reset()}
                  className="flex items-center gap-1"
                  disabled={isResetDisabled}
                  data-tour="reset-tree-button"
                >
                  Reset
                </Button>
              ) : settings.viewMode !== 'quiz' ? (
                <>
                  {(['joined', 'firstName', 'lastName'] as const).map((key) => {
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
                        className={`flex items-center gap-1 capitalize ${key !== 'joined' ? 'hidden sm:flex' : ''}`}
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
                          variant={
                            settings.filterByRealPhoto ? 'secondary' : 'ghost'
                          }
                          size="sm"
                          onClick={() =>
                            setSettings((prev) => ({
                              ...prev,
                              filterByRealPhoto: !prev.filterByRealPhoto,
                            }))
                          }
                        >
                          <Photo className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Only show users with real photos</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={settings.viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() =>
                  setSettings((prev) => ({ ...prev, viewMode: 'grid' }))
                }
                data-tour="family-group-grid-button"
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
              <Button
                variant={settings.viewMode === 'tree' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() =>
                  setSettings((prev) => ({ ...prev, viewMode: 'tree' }))
                }
              >
                <GitFork className="h-4 w-4" />
              </Button>
              <Button
                variant={settings.viewMode === 'quiz' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={handleSwitchToQuiz}
              >
                <Brain className="h-4 w-4 text-orange-500" />
              </Button>
            </div>
          </div>
          <div className="relative mt-4">
            {settings.viewMode === 'tree' ? (
              <FocalUserSearch
                members={allGroupMembers}
                onSelect={(userId) => familyTreeRef.current?.setFocalUser(userId)}
              />
            ) : settings.viewMode !== 'quiz' ? (
              <>
                <input
                  type="text"
                  placeholder={isLoading ? 'Loading...' : `Search ${members.length} members...`}
                  value={settings.searchQuery}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      searchQuery: e.target.value,
                    }))
                  }
                  className="w-full rounded-md border p-2 pr-10"
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
              </>
            ) : null}
          </div>
        </div>
      </div>

      <div className="container mx-auto mt-4 px-4">
        {isLoading ? (
          <div className="p-4 text-center">Loading...</div>
        ) : (
          <>
            {settings.viewMode === 'quiz' ? (
              <div className="rounded-xl bg-white p-3 dark:bg-gray-800">
                <NameQuizViewClient
                  members={allGroupMembers}
                  groupSlug={groupSlug}
                  currentUserId={currentUserMember?.userId}
                  onSwitchToGrid={handleSwitchToGrid}
                  onSwitchToList={handleSwitchToList}
                />
              </div>
            ) : settings.viewMode === 'tree' ? (
              <div
                ref={treeContainerRef}
                style={{ height: `${treeHeight}px` }}
                className="relative rounded-md border"
              >
                <TooltipProvider>
                  <Tooltip
                    open={isExperimentalTooltipOpen}
                    onOpenChange={setIsExperimentalTooltipOpen}
                  >
                    <TooltipTrigger asChild>
                      <div
                        className="bg-background/80 absolute top-2 right-2 z-10 flex cursor-pointer items-center gap-1 rounded-full border px-2 py-1 text-xs backdrop-blur-sm sm:gap-1.5 sm:px-3 sm:py-1.5 sm:text-sm"
                        onClick={() =>
                          setIsExperimentalTooltipOpen(!isExperimentalTooltipOpen)
                        }
                      >
                        <FlaskConical className="h-3 w-3 text-lime-400 sm:h-4 sm:w-4" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        The family tree view is new and still experimental. If you
                        find bugs or have suggestions, please share with Joe... cuz
                        yeah, it's still just our families using this until the
                        kinks are ironed out.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <ReactFlowProvider>
                  <FamilyTree
                    ref={familyTreeRef}
                    relationships={initialRelationships}
                    members={members}
                    currentUser={currentUserMember?.user}
                    onIsFocalUserCurrentUserChange={(isCurrentUser) =>
                      setIsResetDisabled(isCurrentUser)
                    }
                    relationshipMap={treeRelationshipMap}
                  />
                </ReactFlowProvider>
              </div>
            ) : (
              <>
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
                      viewMode={settings.viewMode === 'grid' ? 'grid' : 'list'}
                      relationship={relationshipMap.get(member.userId)?.label}
                      onRelate={handleOpenRelateModal}
                      currentUserId={currentUserMember?.userId}
                      isGroupAdmin={isGroupAdmin}
                      groupSlug={groupSlug}
                    />
                  ))}
                </div>
                <div className="p-4 text-center">
                  {isLoading && 'Loading...'}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {selectedMember && group?.groupType && currentUserMember && (
        <RelateModal
          isOpen={isRelateModalOpen}
          onClose={handleCloseRelateModal}
          member={selectedMember}
          groupType={group.groupType}
          groupMembers={allGroupMembers}
          groupSlug={groupSlug}
          initialRelations={memberRelations}
          onRelationshipAdded={handleRelationshipChange}
          isReadOnly={
            !isGroupAdmin &&
            selectedMember?.userId !== currentUserMember?.userId
          }
          loggedInUserId={currentUserMember.userId}
        />
      )}
      <NameQuizIntroModal
        isOpen={isIntroModalOpen}
        onClose={handleCloseIntroModal}
      />
    </>
  )
}
