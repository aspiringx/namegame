'use client'

import React, { RefObject } from 'react'
import type { FamilyTreeRef } from './FamilyTree'
import { Button } from '@/components/ui/button'
import { usePathname, useParams } from 'next/navigation'
import Link from 'next/link'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
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

// This should be kept in sync with the one in FamilyGroupClient.tsx
interface GroupPageSettings {
  sortConfig: {
    key: 'joined' | 'firstName' | 'lastName' | 'closest'
    direction: 'asc' | 'desc'
  }
  viewMode: 'grid' | 'tree' | 'games'
  searchQuery: string
  filterByRealPhoto: boolean
  filterConnectedStatus: 'all' | 'connected' | 'not_connected'
}

interface GroupToolbarProps {
  settings: GroupPageSettings
  setSettings: React.Dispatch<React.SetStateAction<GroupPageSettings>>
  handleSort: (key: 'joined' | 'firstName' | 'lastName' | 'closest') => void
  setTourOpen: (isOpen: boolean) => void
  isMobile: boolean
  familyTreeRef?: RefObject<FamilyTreeRef | null>
  isResetDisabled?: boolean
}

export default function GroupToolbar({
  settings,
  setSettings,
  handleSort,
  setTourOpen,
  isMobile,
  familyTreeRef,
  isResetDisabled,
}: GroupToolbarProps) {
  const sortOptions: {
    key: 'joined' | 'firstName' | 'lastName' | 'closest'
    label: string
  }[] = [
    { key: 'closest', label: 'Closest relation' },
    { key: 'joined', label: 'When joined' },
    { key: 'firstName', label: 'First name' },
    { key: 'lastName', label: 'Last name' },
  ]

  const currentSortLabel = sortOptions.find(
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

  const pathname = usePathname()
  const params = useParams()
  const isTreeView = pathname.includes('/tree')

  return (
        <div className="my-2 flex items-center justify-between">
      {/* Left-side controls */}
      <div className="flex flex-wrap items-center gap-1">
        {isTreeView ? (
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
        ) : (
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
      <div className="flex items-center gap-1">
        {isMobile ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" data-tour="view-mode-mobile">
                {settings.viewMode === 'grid' ? (
                  <LayoutGrid className="h-4 w-4" />
                ) : (
                  <GitFork className="h-4 w-4" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem
              >
                <LayoutGrid className="mr-2 h-4 w-4" />
                <span>Photos</span>
              </DropdownMenuItem>
              <DropdownMenuItem
              >
                <GitFork className="mr-2 h-4 w-4" />
                <span>Family Tree</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <>
            <Link href={`/g/${params.slug}`}>
              <Button
                variant={!pathname.includes('/tree') && !pathname.includes('/games') ? 'secondary' : 'ghost'}
                size="sm"
                data-tour="grid-button"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </Link>
            <Link href={`/g/${params.slug}/tree`}>
              <Button
                variant={pathname.includes('/tree') ? 'secondary' : 'ghost'}
                size="sm"
                data-tour="tree-button"
              >
                <GitFork className="h-4 w-4" />
              </Button>
            </Link>
          </>
        )}

        <Link href={`/g/${params.slug}/games`}>
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
