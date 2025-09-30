'use client'

import { useState, useMemo } from 'react'
import { Search } from './Search'
import MembersTable from './members-table'
import type { GroupUser, GroupUserRole, User } from '@/generated/prisma'
import { useDebouncedCallback } from 'use-debounce'
import { Button } from '@/components/ui/button'

type GroupUserWithRelations = GroupUser & {
  user: User & { photoUrl: string }
  role: GroupUserRole
}

const MEMBERS_PER_PAGE = 25

export default function MembersClient({
  initialMembers,
  allRoles,
}: {
  initialMembers: GroupUserWithRelations[]
  allRoles: GroupUserRole[]
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const handleSearch = useDebouncedCallback((term: string) => {
    setSearchTerm(term)
    setCurrentPage(1) // Reset to first page on new search
  }, 300)

  const filteredMembers = useMemo(() => {
    if (!searchTerm) return initialMembers

    return initialMembers.filter((member) => {
      const name =
        `${member.user.firstName || ''} ${member.user.lastName || ''}`.toLowerCase()
      const email = (member.user.email || '').toLowerCase()
      const query = searchTerm.toLowerCase()

      return name.includes(query) || email.includes(query)
    })
  }, [initialMembers, searchTerm])

  const totalPages = Math.ceil(filteredMembers.length / MEMBERS_PER_PAGE)

  const paginatedMembers = useMemo(() => {
    const start = (currentPage - 1) * MEMBERS_PER_PAGE
    const end = start + MEMBERS_PER_PAGE
    return filteredMembers.slice(start, end)
  }, [filteredMembers, currentPage])

  return (
    <div className="p-4">
      <div className="-mx-4 mt-8">
        <Search
          placeholder="Search members..."
          count={filteredMembers.length}
          onSearchChange={handleSearch}
        />
      </div>
      <div className="mt-8">
        <MembersTable groupUsers={paginatedMembers} allRoles={allRoles} />
      </div>
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
    </div>
  )
}
