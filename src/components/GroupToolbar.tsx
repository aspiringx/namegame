'use client'

import React, { RefObject } from 'react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

import {
  ArrowUp,
  ArrowDown,
  LayoutGrid,
  HelpCircle,
  Image as Photo,
  Filter,
  Gamepad2,
  GitFork,
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

// Universal sort option type
interface SortOption {
  key: string
  label: string
}

// Universal settings interface
interface UniversalGroupSettings {
  sortConfig: {
    key: string
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

// Group-specific configuration
interface GroupToolbarConfig {
  sortOptions: SortOption[]
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

interface GroupToolbarProps {
  settings: UniversalGroupSettings
  setSettings: React.Dispatch<React.SetStateAction<UniversalGroupSettings>>
  handleSort: (key: string) => void
  setTourOpen: (isOpen: boolean) => void
  isMobile: boolean
  viewMode: string
  groupSlug: string
  gridSizeConfig: GridSizeConfig
  config: GroupToolbarConfig
  // Family-specific props (optional)
  familyTreeRef?: RefObject<any>
  isResetDisabled?: boolean
}

export default function GroupToolbar({
  settings,
  setSettings,
  handleSort,
  setTourOpen,
  isMobile,
  viewMode,
  groupSlug,
  gridSizeConfig,
  config,
  familyTreeRef,
  isResetDisabled = false,
}: GroupToolbarProps) {
  const pathname = usePathname()

  const currentSortLabel = config.sortOptions.find(
    (o) => o.key === settings.sortConfig.key,
  )?.label

  const activeFilters = []
  if (
    settings.filterConnectedStatus &&
    settings.filterConnectedStatus !== 'all'
  ) {
    activeFilters.push(
      settings.filterConnectedStatus.charAt(0).toUpperCase() +
        settings.filterConnectedStatus.slice(1).replace('_', ' '),
    )
  }
  if (settings.filterByRealPhoto) {
    activeFilters.push('Real')
  }

  const isTreeView = pathname.includes('/tree')
  const isGamesView = pathname.includes('/games')
  const isGridView = !isTreeView && !isGamesView

  return (
    <div className="my-2 flex items-center justify-between">
      {/* Left-side controls */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Family tree reset button */}
        {isTreeView && config.features.resetButton && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => familyTreeRef?.current?.reset()}
            className="flex items-center gap-1"
            disabled={isResetDisabled}
            data-tour="reset-tree-button"
          >
            Reset
          </Button>
        )}

        {/* Filter and Sort (not shown in games or tree view) */}
        {!isTreeView && !isGamesView && (
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
                    value={settings.filterConnectedStatus || 'all'}
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
                  {config.sortOptions.map((option) => (
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

        {/* Help/Tour button */}
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
        {isMobile ? (
          /* Mobile dropdown for all view modes */
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" data-tour="view-mode-mobile">
                {viewMode === 'grid' ? (
                  <LayoutGrid className="h-4 w-4" />
                ) : viewMode === 'tree' ? (
                  <GitFork className="h-4 w-4" />
                ) : (
                  <Gamepad2 className="h-4 w-4" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {config.viewModes.map((mode) => (
                <Link key={mode.key} href={mode.href}>
                  <DropdownMenuItem>
                    <mode.icon className="mr-2 h-4 w-4" />
                    <span>{mode.label}</span>
                  </DropdownMenuItem>
                </Link>
              ))}
              {isGridView && (
                <>
                  <DropdownMenuSeparator />
                  <div className="px-3 pt-2 pb-4">
                    <DropdownMenuLabel className="px-0 pb-2">
                      Grid Size
                    </DropdownMenuLabel>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-muted-foreground text-sm">
                        {gridSizeConfig.min}
                      </span>
                      <span className="text-sm font-medium">
                        {settings.gridSize} per row
                      </span>
                      <span className="text-muted-foreground text-sm">
                        {gridSizeConfig.max}
                      </span>
                    </div>
                    <Slider
                      value={[settings.gridSize || gridSizeConfig.default]}
                      onValueChange={(value) =>
                        setSettings((prev) => ({ ...prev, gridSize: value[0] }))
                      }
                      min={gridSizeConfig.min}
                      max={gridSizeConfig.max}
                      step={1}
                      className="w-32"
                    />
                  </div>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          /* Desktop individual buttons */
          <>
            {/* Grid view button - dropdown with size control if on grid view, direct link otherwise */}
            {isGridView ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" size="sm" data-tour="grid-button">
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Grid Size</DropdownMenuLabel>
                  <div className="px-3 pt-2 pb-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-muted-foreground text-sm">
                        {gridSizeConfig.min}
                      </span>
                      <span className="text-sm font-medium">
                        {settings.gridSize} per row
                      </span>
                      <span className="text-muted-foreground text-sm">
                        {gridSizeConfig.max}
                      </span>
                    </div>
                    <Slider
                      value={[settings.gridSize || gridSizeConfig.default]}
                      onValueChange={(value) => {
                        setSettings((prev) => ({ ...prev, gridSize: value[0] }))
                      }}
                      min={gridSizeConfig.min}
                      max={gridSizeConfig.max}
                      step={1}
                      className="w-32"
                    />
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href={`/g/${groupSlug}`}>
                <Button variant="ghost" size="sm" data-tour="grid-button">
                  <LayoutGrid className="h-4 w-4" />
                </Button>
              </Link>
            )}

            {/* Family tree button (if enabled) */}
            {config.features.familyTree && (
              <Link href={`/g/${groupSlug}/tree`}>
                <Button
                  variant={pathname.includes('/tree') ? 'secondary' : 'ghost'}
                  size="sm"
                  data-tour="tree-button"
                >
                  <GitFork className="h-4 w-4" />
                </Button>
              </Link>
            )}
          </>
        )}

        {/* Games button (desktop only - mobile has it in dropdown) */}
        {!isMobile && config.features.games && (
          <Link href={`/g/${groupSlug}/games`}>
            <Button
              variant={pathname.includes('/games') ? 'secondary' : 'ghost'}
              size="sm"
              data-tour="game-button"
            >
              <Gamepad2 className="h-4 w-4" />
            </Button>
          </Link>
        )}
      </div>
    </div>
  )
}
