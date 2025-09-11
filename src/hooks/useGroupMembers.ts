'use client'

import { useMemo } from 'react'
import type { MemberWithUser } from '@/types'

// A base settings interface that includes common properties
interface BaseSettings {
  sortConfig: {
    key: string
    direction: 'asc' | 'desc'
  }
  searchQuery: string
  filterByRealPhoto: boolean
  // Allow other potential properties
  [key: string]: any
}

export default function useGroupMembers<T extends BaseSettings>(
  initialMembers: MemberWithUser[],
  settings: T,
) {
  return useMemo(() => {
    if (!initialMembers) {
      return []
    }

    let filteredMembers = [...initialMembers]

    // --- FILTERS ---

    // Filter by real photo
    if (settings.filterByRealPhoto) {
      filteredMembers = filteredMembers.filter(
        (member) =>
          member.user.photoUrl &&
          !member.user.photoUrl.includes('api.dicebear.com') &&
          !member.user.photoUrl.includes('default-avatar.png'),
      )
    }

    // Community-group specific filter
    if ('filterConnectedStatus' in settings && settings.filterConnectedStatus !== 'all') {
      filteredMembers = filteredMembers.filter((member) =>
        settings.filterConnectedStatus === 'connected' ? !!member.connectedAt : !member.connectedAt,
      )
    }

    // Filter by search query
    if (settings.searchQuery) {
      const lowercasedQuery = settings.searchQuery.toLowerCase()
      filteredMembers = filteredMembers.filter((member) =>
        (member.user.name || '').toLowerCase().includes(lowercasedQuery),
      )
    }

    // --- SORTING ---

    const sortedMembers = filteredMembers.sort((a, b) => {
      const { key, direction } = settings.sortConfig
      const asc = direction === 'asc'

      switch (key) {
        case 'when_connected':
        case 'joined': {
          const aDate = a.connectedAt ? new Date(a.connectedAt).getTime() : 0
          const bDate = b.connectedAt ? new Date(b.connectedAt).getTime() : 0
          return asc ? aDate - bDate : bDate - aDate
        }
        case 'firstName':
        case 'lastName': {
          const aKey = a.user[key] || ''
          const bKey = b.user[key] || ''
          return asc ? aKey.localeCompare(bKey) : bKey.localeCompare(aKey)
        }
        // NOTE: 'closest' sort for family groups is complex and handled separately.
        default:
          return 0
      }
    })

    return sortedMembers
  }, [initialMembers, settings])
}

