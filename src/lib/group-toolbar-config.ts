import { LayoutGrid, GitFork, Gamepad2 } from 'lucide-react'

// Configuration for different group types
export interface GroupToolbarConfig {
  sortOptions: Array<{
    key: string
    label: string
  }>
  features: {
    familyTree?: boolean
    games?: boolean
    resetButton?: boolean
  }
  viewModes: Array<{
    key: string
    label: string
    icon: React.ComponentType<{ className?: string }>
    href: string
  }>
}

export function getFamilyGroupToolbarConfig(groupSlug: string): GroupToolbarConfig {
  return {
    sortOptions: [
      { key: 'closest', label: 'Closest relation' },
      { key: 'joined', label: 'When joined' },
      { key: 'firstName', label: 'First name' },
      { key: 'lastName', label: 'Last name' },
    ],
    features: {
      familyTree: true,
      games: true,
      resetButton: true,
    },
    viewModes: [
      {
        key: 'grid',
        label: 'Photos',
        icon: LayoutGrid,
        href: `/g/${groupSlug}`,
      },
      {
        key: 'tree',
        label: 'Family Tree',
        icon: GitFork,
        href: `/g/${groupSlug}/tree`,
      },
      {
        key: 'games',
        label: 'Games',
        icon: Gamepad2,
        href: `/g/${groupSlug}/games`,
      },
    ],
  }
}

export function getCommunityGroupToolbarConfig(groupSlug: string): GroupToolbarConfig {
  return {
    sortOptions: [
      { key: 'when_connected', label: 'When connected' },
      { key: 'firstName', label: 'First name' },
      { key: 'lastName', label: 'Last name' },
    ],
    features: {
      familyTree: false,
      games: true,
      resetButton: false,
    },
    viewModes: [
      {
        key: 'grid',
        label: 'View Grid',
        icon: LayoutGrid,
        href: `/g/${groupSlug}`,
      },
      {
        key: 'games',
        label: 'Games',
        icon: Gamepad2,
        href: `/g/${groupSlug}/games`,
      },
    ],
  }
}
