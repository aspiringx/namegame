/**
 * Shared hook for group settings management
 * Used by both FamilyClient and CommunityClient
 */

import { useState, useEffect } from 'react'
import useLocalStorage from '@/hooks/useLocalStorage'
import { GroupPageSettings, getDefaultSettings, getGridSizeConfig } from '@/lib/group-utils'

interface UseGroupSettingsProps {
  groupSlug: string
  groupType: 'family' | 'community'
}

export function useGroupSettings({ groupSlug, groupType }: UseGroupSettingsProps) {
  const [isMobile, setIsMobile] = useState(false)
  const [hasMounted, setHasMounted] = useState(false)

  const [settings, setSettings] = useLocalStorage<GroupPageSettings>(
    `namegame_${groupType}-group-settings_${groupSlug}`,
    getDefaultSettings(groupType)
  )

  useEffect(() => {
    setHasMounted(true)
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkIsMobile()
    window.addEventListener('resize', checkIsMobile)
    return () => window.removeEventListener('resize', checkIsMobile)
  }, [])

  // Auto-adjust gridSize based on screen size after mount (prevent hydration mismatch)
  useEffect(() => {
    if (hasMounted) {
      const config = getGridSizeConfig(isMobile)
      // Only update if current gridSize is outside the valid range for this screen size
      if (settings.gridSize < config.min || settings.gridSize > config.max) {
        setSettings((prev) => ({ ...prev, gridSize: config.default }))
      }
    }
  }, [hasMounted, isMobile, settings.gridSize, setSettings])

  const handleSort = (key: string) => {
    setSettings((prev) => {
      const isSameKey = prev.sortConfig.key === key
      let newDirection: 'asc' | 'desc'

      if (isSameKey) {
        newDirection = prev.sortConfig.direction === 'asc' ? 'desc' : 'asc'
      } else {
        newDirection = key === 'joined' || key === 'when_connected' ? 'desc' : 'asc'
      }

      return {
        ...prev,
        sortConfig: { key, direction: newDirection },
      }
    })
  }

  const handleSearchChange = (query: string) => {
    setSettings((prev) => ({ ...prev, searchQuery: query }))
  }

  return {
    settings,
    setSettings,
    isMobile,
    hasMounted,
    handleSort,
    handleSearchChange,
  }
}
