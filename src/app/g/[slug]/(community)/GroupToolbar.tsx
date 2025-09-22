'use client'

import React from 'react'
import { useTour } from '@reactour/tour'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'

import {
  ArrowUp,
  ArrowDown,
  LayoutGrid,
  HelpCircle,
  Image as Photo,
  Filter,
  Gamepad2,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu'

// This should be kept in sync with the one in CommunityGroupClient.tsx
interface GroupPageSettings {
  sortConfig: {
    key: 'when_connected' | 'firstName' | 'lastName'
    direction: 'asc' | 'desc'
  }
  searchQuery: string
  filterByRealPhoto: boolean
  filterConnectedStatus: 'all' | 'connected' | 'not_connected'
  gridSize: number
}

interface GridSizeConfig {
  min: number
  max: number
  default: number
}

interface GroupToolbarProps {
  settings: GroupPageSettings
  setSettings: React.Dispatch<React.SetStateAction<GroupPageSettings>>
  handleSort: (key: 'when_connected' | 'firstName' | 'lastName') => void
  setTourOpen: (isOpen: boolean) => void
  viewMode: 'grid' | 'games'
  groupSlug: string
  isMobile: boolean
  gridSizeConfig: GridSizeConfig
}

export default function GroupToolbar({
  settings,
  setSettings,
  handleSort,
  setTourOpen,
  viewMode,
  groupSlug,
  isMobile,
  gridSizeConfig,
}: GroupToolbarProps) {
  const sortOptions: {
    key: 'when_connected' | 'firstName' | 'lastName'
    label: string
  }[] = [
    { key: 'when_connected', label: 'When connected' },
    { key: 'firstName', label: 'First name' },
    { key: 'lastName', label: 'Last name' },
  ]

  const { setIsOpen: _setIsOpen } = useTour()
  const pathname = usePathname()
  const currentSortLabel = sortOptions.find(
    (o) => o.key === settings.sortConfig.key,
  )?.label

  const activeFilters = []
  if (settings.filterConnectedStatus !== 'all') {
    activeFilters.push(
      settings.filterConnectedStatus.charAt(0).toUpperCase() +
        settings.filterConnectedStatus.slice(1).replace('_', ' '),
    )
  }
  if (settings.filterByRealPhoto) {
    activeFilters.push('Real')
  }

  return (
    <div className="my-2 flex items-center justify-between">
      {/* Filter and Sort Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        {viewMode !== 'games' && (
          <>
            <div data-tour="filter-buttons">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center"
                  >
                    <Filter className="mr-2 h-4 w-4" />
                    <span>Filter</span>
                    {activeFilters.length > 0 && (
                      <span className="ml-2 hidden rounded-md bg-gray-200 px-2 py-0.5 text-xs font-semibold text-gray-700 md:inline dark:bg-gray-700 dark:text-gray-200">
                        {activeFilters.join(', ')}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Who to see:</DropdownMenuLabel>
                  <DropdownMenuRadioGroup
                    value={settings.filterConnectedStatus}
                    onValueChange={(value) =>
                      setSettings((prev) => ({
                        ...prev,
                        filterConnectedStatus: value as
                          | 'all'
                          | 'connected'
                          | 'not_connected',
                      }))
                    }
                  >
                    <DropdownMenuRadioItem
                      value="all"
                      onSelect={(e) => e.preventDefault()}
                    >
                      Everyone
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem
                      value="connected"
                      onSelect={(e) => e.preventDefault()}
                    >
                      Connected
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem
                      value="not_connected"
                      onSelect={(e) => e.preventDefault()}
                    >
                      Not connected
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                    checked={settings.filterByRealPhoto}
                    onCheckedChange={(checked) =>
                      setSettings((prev) => ({
                        ...prev,
                        filterByRealPhoto: checked,
                      }))
                    }
                    onSelect={(e) => e.preventDefault()}
                  >
                    <Photo className="mr-2 h-4 w-4" />
                    Real photos
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div data-tour="sort-buttons">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center"
                  >
                    <ArrowDown className="mr-2 h-4 w-4" />
                    <span>Sort</span>
                    {currentSortLabel && (
                      <span className="ml-2 hidden rounded-md bg-gray-200 px-2 py-0.5 text-xs font-semibold text-gray-700 md:inline dark:bg-gray-700 dark:text-gray-200">
                        {currentSortLabel}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {sortOptions.map((option) => (
                    <DropdownMenuItem
                      key={option.key}
                      onSelect={(e) => {
                        e.preventDefault()
                        handleSort(option.key)
                      }}
                    >
                      {option.label}
                      {settings.sortConfig.key === option.key &&
                        (settings.sortConfig.direction === 'asc' ? (
                          <ArrowUp className="ml-auto h-4 w-4" />
                        ) : (
                          <ArrowDown className="ml-auto h-4 w-4" />
                        ))}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTourOpen(true)}
          data-tour="tour-button"
        >
          <HelpCircle className="h-4 w-4" />
        </Button>
      </div>

      {/* View Mode Buttons */}
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant={!pathname.includes('/games') ? 'secondary' : 'ghost'}
              size="sm"
              data-tour="grid-button"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Grid Size</DropdownMenuLabel>
            <div className="px-3 py-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">
                  {gridSizeConfig.min}
                </span>
                <span className="text-sm font-medium">
                  {settings.gridSize} per row
                </span>
                <span className="text-sm text-muted-foreground">
                  {gridSizeConfig.max}
                </span>
              </div>
              <Slider
                value={[settings.gridSize]}
                onValueChange={(value) =>
                  setSettings(prev => ({ ...prev, gridSize: value[0] }))
                }
                min={gridSizeConfig.min}
                max={gridSizeConfig.max}
                step={1}
                className="w-32"
              />
            </div>
            <DropdownMenuSeparator />
            <Link href={`/g/${groupSlug}`}>
              <DropdownMenuItem>
                <LayoutGrid className="mr-2 h-4 w-4" />
                <span>View Grid</span>
              </DropdownMenuItem>
            </Link>
          </DropdownMenuContent>
        </DropdownMenu>
        <Link href={`/g/${groupSlug}/games`}>
          <Button
            variant={pathname.includes('/games') ? 'secondary' : 'ghost'}
            size="sm"
            data-tour="game-button"
          >
            <Gamepad2 className="h-6 w-6 text-orange-500" />
          </Button>
        </Link>
      </div>
    </div>
  )
}
