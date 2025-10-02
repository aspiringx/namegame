'use client'

import { useState, useMemo, useCallback } from 'react'
import { Search } from './Search'
import GroupsTable from './GroupsTable'
import type { Group } from '@namegame/db'
import { useDebouncedCallback } from 'use-debounce'
import { Button } from '@/components/ui/button'

type SortableColumn =
  | 'name'
  | 'slug'
  | 'description'
  | 'createdAt'
  | 'updatedAt'
type Order = 'asc' | 'desc'

const GROUPS_PER_PAGE = 25

export default function GroupsClient({
  initialGroups,
}: {
  initialGroups: Group[]
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [sort, setSort] = useState<{ column: SortableColumn; order: Order }>({
    column: 'createdAt',
    order: 'desc',
  })

  const handleSearch = useDebouncedCallback((term: string) => {
    setSearchTerm(term)
    setCurrentPage(1) // Reset to first page on new search
  }, 300)

  const handleSort = useCallback((column: SortableColumn) => {
    setSort((prevSort) => ({
      column,
      order:
        prevSort.column === column && prevSort.order === 'asc' ? 'desc' : 'asc',
    }))
    setCurrentPage(1)
  }, [])

  const filteredAndSortedGroups = useMemo(() => {
    let result = [...initialGroups]

    // Filtering
    if (searchTerm) {
      const query = searchTerm.toLowerCase()
      result = result.filter(
        (group) =>
          group.name.toLowerCase().includes(query) ||
          group.slug.toLowerCase().includes(query) ||
          (group.description || '').toLowerCase().includes(query),
      )
    }

    // Sorting
    result.sort((a, b) => {
      const aValue = a[sort.column]
      const bValue = b[sort.column]

      if (aValue === null || aValue === undefined) return 1
      if (bValue === null || bValue === undefined) return -1

      if (aValue < bValue) return sort.order === 'asc' ? -1 : 1
      if (aValue > bValue) return sort.order === 'asc' ? 1 : -1
      return 0
    })

    return result
  }, [initialGroups, searchTerm, sort])

  const totalPages = Math.ceil(filteredAndSortedGroups.length / GROUPS_PER_PAGE)

  const paginatedGroups = useMemo(() => {
    const start = (currentPage - 1) * GROUPS_PER_PAGE
    const end = start + GROUPS_PER_PAGE
    return filteredAndSortedGroups.slice(start, end)
  }, [filteredAndSortedGroups, currentPage])

  return (
    <>
      <div className="mt-4">
        <Search
          placeholder="Search groups..."
          onSearchChange={handleSearch}
          value={searchTerm}
        />
      </div>
      <GroupsTable groups={paginatedGroups} sort={sort} onSort={handleSort} />
      <div className="mt-4 flex items-center justify-between">
        <span className="text-sm text-gray-700 dark:text-gray-400">
          Page {currentPage} of {totalPages}
        </span>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
          >
            Previous
          </Button>
          <Button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </>
  )
}
