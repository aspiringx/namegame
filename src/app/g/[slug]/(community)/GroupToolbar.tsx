'use client'

import React from 'react'
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
import clsx from 'clsx'

// This should be kept in sync with the one in CommunityGroupClient.tsx
interface GroupPageSettings {
  sortConfig: {
    key: 'when_connected' | 'firstName' | 'lastName'
    direction: 'asc' | 'desc'
  }
  viewMode: 'grid' | 'quiz'
  searchQuery: string
  filterByRealPhoto: boolean
  filterConnectedStatus: 'all' | 'connected' | 'not_connected'
}

interface GroupToolbarProps {
  settings: GroupPageSettings
  setSettings: React.Dispatch<React.SetStateAction<GroupPageSettings>>
  handleSort: (key: 'when_connected' | 'firstName' | 'lastName') => void
  handleSwitchToQuiz: () => void
  setTourOpen: (isOpen: boolean) => void
}

export default function GroupToolbar({
  settings,
  setSettings,
  handleSort,
  handleSwitchToQuiz,
  setTourOpen,
}: GroupToolbarProps) {
  const sortOptions: {
    key: 'when_connected' | 'firstName' | 'lastName'
    label: string
  }[] = [
    { key: 'when_connected', label: 'When connected' },
    { key: 'firstName', label: 'First name' },
    { key: 'lastName', label: 'Last name' },
  ]

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
      <div className="flex flex-wrap items-center gap-1">
        <div data-tour="filter-buttons">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center">
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
                    filterConnectedStatus: value as 'all' | 'connected' | 'not_connected',
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
              <Button variant="outline" size="sm" className="flex items-center">
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
        <Button
          variant={settings.viewMode === 'grid' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setSettings((prev) => ({ ...prev, viewMode: 'grid' }))}
          data-tour="grid-button"
        >
          <LayoutGrid className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSwitchToQuiz}
          data-tour="game-button"
        >
          <Gamepad2 className="h-6 w-6 text-orange-500" />
        </Button>
      </div>
    </div>
  )
}
