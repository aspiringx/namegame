'use client'

import { useMemo } from 'react'
import type { MemberWithUser } from '@/types'

// This should be kept in sync with the one in CommunityGroupClient.tsx
interface GroupPageSettings {
  sortConfig: {
    key: 'when_met' | 'firstName' | 'lastName'
    direction: 'asc' | 'desc'
  }
  searchQuery: string
  filterByRealPhoto: boolean
  filterMetStatus: 'all' | 'met' | 'not_met'
}

export default function useGroupMembers(initialMembers: MemberWithUser[], settings: GroupPageSettings) {
  const filteredAndSortedMembers = useMemo(() => {
    const sortFunction = (a: MemberWithUser, b: MemberWithUser) => {
      if (settings.sortConfig.key === 'when_met') {
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

    let filtered = initialMembers

    if (settings.filterByRealPhoto) {
      filtered = filtered.filter(
        (member) =>
          member.user.photoUrl &&
          !member.user.photoUrl.includes('api.dicebear.com') &&
          !member.user.photoUrl.endsWith('default-avatar.png'),
      )
    }

    if (settings.searchQuery) {
      filtered = filtered.filter(member =>
        member.user.name
          .toLowerCase()
          .includes(settings.searchQuery.toLowerCase()),
      )
    }

    if (settings.filterMetStatus !== 'all') {
      if (settings.filterMetStatus === 'met') {
        filtered = filtered.filter(member => !!member.relationUpdatedAt);
      } else { // 'not_met'
        filtered = filtered.filter(member => !member.relationUpdatedAt);
      }
    }

    return filtered.sort(sortFunction)
  }, [initialMembers, settings])

  return filteredAndSortedMembers
}

