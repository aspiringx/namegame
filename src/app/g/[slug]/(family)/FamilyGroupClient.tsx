'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import useLocalStorage from '@/hooks/useLocalStorage'
import { useGroup } from '@/components/GroupProvider'
import { GuestMessage } from '@/components/GuestMessage'
import GroupToolbar from './GroupToolbar'
import { FocalUserSearch } from './FocalUserSearch'
import { TourProvider, useTour } from '@reactour/tour'
import type { FamilyTreeRef } from './FamilyTree'
import TreeView from './TreeView'
import { FullRelationship, User } from '@/types'
import { getRelationship } from '@/lib/family-tree'
import { steps as familyTourSteps } from '@/components/tours/FamilyTour'
import { steps as familyTourMobileSteps } from '@/components/tours/FamilyTourMobile'
import { steps as familyTreeSteps } from '@/components/tours/FamilyTreeTour'
import { steps as familyTreeMobileSteps } from '@/components/tours/FamilyTreeTourMobile'
import { useTheme } from 'next-themes'
import { X } from 'lucide-react'
import RelateModal from '@/components/RelateModal'
import { MemberWithUser } from '@/types'
import { createContext, useContext } from 'react'

const FamilyGroupMembersContext = createContext<MemberWithUser[]>([])

export const useFamilyGroupMembers = () => useContext(FamilyGroupMembersContext)

const FamilyGroupActionsContext = createContext<{
  onOpenRelateModal: (member: MemberWithUser) => void
  handleCloseRelateModal: () => void
  isRelateModalOpen: boolean
  selectedMember: MemberWithUser | null
}>({
  onOpenRelateModal: () => {},
  handleCloseRelateModal: () => {},
  isRelateModalOpen: false,
  selectedMember: null,
})

const FamilyGroupDataContext = createContext<{
  relationshipMap: Map<string, { label: string; steps: number }>
}>({ relationshipMap: new Map() })

export const useFamilyGroupData = () => useContext(FamilyGroupDataContext)

export const useFamilyGroupActions = () => useContext(FamilyGroupActionsContext)

type SortKey = 'joined' | 'firstName' | 'lastName' | 'closest'
type SortDirection = 'asc' | 'desc'

interface FamilyPageSettings {
  searchQuery: string
  sortConfig: {
    key: SortKey
    direction: SortDirection
  }
  filterByRealPhoto: boolean
  filterConnectedStatus: 'all' | 'connected' | 'not_connected'
}

interface FamilyGroupClientProps {
  children?: React.ReactNode
  view: 'grid' | 'tree' | 'games'
  initialMembers: MemberWithUser[]
  groupSlug: string
  initialMemberCount: number
  initialRelationships: FullRelationship[]
}

function FamilyGroupClientContent({
  initialMembers,
  initialRelationships,
  children,
  view,
  groupSlug,
}: Omit<FamilyGroupClientProps, 'initialMemberCount'>) {
  const groupContext = useGroup()
  const familyTreeRef = useRef<FamilyTreeRef>(null)
  const [isResetDisabled, setIsResetDisabled] = useState(true)
  const { setIsOpen } = useTour()
  const router = useRouter()
  const [isMobile, setIsMobile] = useState(false)
  const [isRelateModalOpen, setIsRelateModalOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<MemberWithUser | null>(
    null,
  )

  const [settings, setSettings] = useLocalStorage<FamilyPageSettings>(
    `namegame_family-group-settings_${groupContext?.group?.slug}`,
    {
      searchQuery: '',
      sortConfig: { key: 'closest', direction: 'asc' },
      filterByRealPhoto: true,
      filterConnectedStatus: 'all',
    },
  )

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkIsMobile()
    window.addEventListener('resize', checkIsMobile)
    return () => window.removeEventListener('resize', checkIsMobile)
  }, [])

  const handleOpenRelateModal = (member: MemberWithUser) => {
    setSelectedMember(member)
    setIsRelateModalOpen(true)
  }

  const handleCloseRelateModal = () => {
    setIsRelateModalOpen(false)
    setSelectedMember(null)
  }

  const modalRelations = useMemo(() => {
    if (!selectedMember || !initialRelationships) return []

    return (initialRelationships as FullRelationship[])
      .filter(
        (rel) =>
          rel.user1Id === selectedMember.userId ||
          rel.user2Id === selectedMember.userId,
      )
      .map((rel) => ({
        ...rel,
        relatedUser:
          rel.user1Id === selectedMember.userId ? rel.user2 : rel.user1,
      }))
  }, [selectedMember, initialRelationships])

  const handleRelationshipChange = () => {
    router.refresh()
  }

  const usersMap = useMemo(() => {
    const map = new Map<string, User>()
    initialMembers.forEach((member) => {
      map.set(member.userId, member.user)
    })
    return map
  }, [initialMembers])

  const relationshipMap = useMemo(() => {
    if (!groupContext?.currentUserMember || !initialRelationships) {
      return new Map<string, { label: string; steps: number }>()
    }
    const newMap = new Map<string, { label: string; steps: number }>()
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
    initialMembers,
    initialRelationships,
    usersMap,
  ])

  const filteredAndSortedMembers = useMemo(() => {
    let sortedMembers = [...initialMembers]

    if (settings.sortConfig.key === 'closest') {
      sortedMembers.sort((a, b) => {
        const aSteps = relationshipMap.get(a.userId)?.steps ?? Infinity
        const bSteps = relationshipMap.get(b.userId)?.steps ?? Infinity
        if (aSteps === bSteps) {
          return (a.user.firstName || '').localeCompare(b.user.firstName || '')
        }
        return settings.sortConfig.direction === 'asc'
          ? aSteps - bSteps
          : bSteps - aSteps
      })
    } else {
      sortedMembers.sort((a, b) => {
        const { key, direction } = settings.sortConfig

        if (key === 'joined') {
          const aDate = new Date(a.createdAt).getTime()
          const bDate = new Date(b.createdAt).getTime()
          return direction === 'asc' ? aDate - bDate : bDate - aDate
        }

        const aValue = a.user[key as 'firstName' | 'lastName'] || ''
        const bValue = b.user[key as 'firstName' | 'lastName'] || ''

        if (aValue < bValue) return direction === 'asc' ? -1 : 1
        if (aValue > bValue) return direction === 'asc' ? 1 : -1
        return 0
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
  }, [initialMembers, settings, relationshipMap])

  const handleSort = (key: 'joined' | 'firstName' | 'lastName' | 'closest') => {
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
        sortConfig: {
          key,
          direction: newDirection,
        },
      }
    })
  }

  if (!groupContext) {
    return null // Should be rendered within GroupProvider
  }

  const { group, isGroupAdmin, currentUserMember } = groupContext

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
        className="bg-background border-border sticky top-16 z-10 border-b py-4"
      >
        <div className="container mx-auto px-4">
          <GroupToolbar
            settings={settings}
            setSettings={setSettings}
            handleSort={handleSort}
            setTourOpen={setIsOpen}
            isMobile={isMobile}
            familyTreeRef={familyTreeRef}
            isResetDisabled={isResetDisabled}
            viewMode={view}
            groupSlug={groupSlug}
          />
          {view === 'tree' ? (
            <div className="relative mt-4">
              <FocalUserSearch
                members={initialMembers}
                onSelect={(userId) =>
                  familyTreeRef.current?.setFocalUser(userId)
                }
              />
            </div>
          ) : view !== 'games' ? (
            <div className="relative mt-4">
              <input
                type="text"
                placeholder={`Search ${initialMembers.length} members...`}
                value={settings.searchQuery}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    searchQuery: e.target.value,
                  }))
                }
                className="w-full rounded-md border p-2 pr-10 text-sm"
                data-tour="search-input"
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
          ) : null}
        </div>
      </div>

      <div className="container mx-auto mt-4 px-4">
        <FamilyGroupActionsContext.Provider
          value={{
            onOpenRelateModal: handleOpenRelateModal,
            handleCloseRelateModal,
            isRelateModalOpen,
            selectedMember,
          }}
        >
          <FamilyGroupDataContext.Provider value={{ relationshipMap }}>
            <FamilyGroupMembersContext.Provider
              value={filteredAndSortedMembers}
            >
              {view === 'tree' ? (
                <TreeView
                  ref={familyTreeRef}
                  onIsFocalUserCurrentUserChange={setIsResetDisabled}
                  members={initialMembers}
                  onOpenRelate={handleOpenRelateModal}
                />
              ) : (
                children
              )}
            </FamilyGroupMembersContext.Provider>
          </FamilyGroupDataContext.Provider>
        </FamilyGroupActionsContext.Provider>
      </div>

      {selectedMember && group?.groupType && currentUserMember && (
        <RelateModal
          isOpen={isRelateModalOpen}
          onClose={handleCloseRelateModal}
          member={selectedMember}
          groupType={group.groupType}
          groupMembers={initialMembers}
          groupSlug={group.slug}
          initialRelations={modalRelations}
          onRelationshipAdded={handleRelationshipChange}
          isReadOnly={
            !isGroupAdmin &&
            selectedMember?.userId !== currentUserMember?.userId
          }
          loggedInUserId={currentUserMember.userId}
        />
      )}
    </>
  )
}

export function FamilyGroupClient(props: FamilyGroupClientProps) {
  const { view } = props
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

  const tourSteps = useMemo(() => {
    if (view === 'tree') {
      return isMobile ? familyTreeMobileSteps : familyTreeSteps
    }
    return isMobile ? familyTourMobileSteps : familyTourSteps
  }, [isMobile, view])

  if (!hasMounted) {
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
          width: '1.4rem',
          height: '1.4rem',
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
      <FamilyGroupClientContent {...props} groupSlug={props.groupSlug} />
    </TourProvider>
  )
}
