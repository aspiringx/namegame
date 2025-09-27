/**
 * Shared utilities for group components
 * Used by both FamilyClient and CommunityClient
 */

// Helper function to get responsive grid size ranges and defaults
export const getGridSizeConfig = (isMobile: boolean) => {
  if (isMobile) {
    return { min: 1, max: 3, default: 2 }
  } else {
    return { min: 2, max: 9, default: 6 }
  }
}

// Helper function to generate dynamic grid classes
export const getGridClasses = (gridSize: number) => {
  const baseClasses = 'grid gap-4 md:gap-6'
  
  // Map gridSize to Tailwind grid-cols classes
  const gridColsMap: { [key: number]: string } = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
    7: 'grid-cols-7',
    8: 'grid-cols-8',
    9: 'grid-cols-9',
  }
  
  const gridClass = gridColsMap[gridSize] || 'grid-cols-4' // fallback
  return `${baseClasses} ${gridClass}`
}

// Common tour styles for both group types
export const getTourStyles = (isMobile: boolean, resolvedTheme: string | undefined) => ({
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
      border: `3px solid ${
        resolvedTheme === 'dark'
          ? 'hsl(240 3.7% 25.9%)'
          : 'hsl(214.3 31.8% 81.4%)'
      }`,
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
})

// Common settings interface
export interface GroupPageSettings {
  sortConfig: {
    key: string
    direction: 'asc' | 'desc'
  }
  searchQuery: string
  filterByRealPhoto: boolean
  filterConnectedStatus: 'all' | 'connected' | 'not_connected'
  gridSize: number
}

// Default settings for different group types
export const getDefaultSettings = (groupType: 'family' | 'community'): GroupPageSettings => {
  const baseSettings = {
    searchQuery: '',
    filterByRealPhoto: true,
    filterConnectedStatus: 'all' as const,
    gridSize: 4, // Safe middle-ground default for SSR
  }

  if (groupType === 'family') {
    return {
      ...baseSettings,
      sortConfig: { key: 'closest', direction: 'asc' as const },
    }
  } else {
    return {
      ...baseSettings,
      sortConfig: { key: 'when_connected', direction: 'desc' as const },
    }
  }
}
