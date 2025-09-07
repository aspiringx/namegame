'use client'

import { useState, useTransition, ChangeEvent, useMemo } from 'react'
import type { GroupWithMembers } from '@/types/index'
import Image from 'next/image'
import Link from 'next/link'
import { LoginCodeModal } from '@/components/LoginCodeModal'
import { searchUsers, addMember, removeMember, updateMember } from './actions'
import { GroupUser, User } from '@/generated/prisma'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { KeyRound, Pencil, Trash2, Check, X } from 'lucide-react'

type UserWithPhotoUrl = Awaited<ReturnType<typeof searchUsers>>[0]

type GroupUserRoleType = {
  id: number
  code: string
}

export type GroupMember = Omit<GroupUser, 'role'> & {
  role: GroupUserRoleType
  user: User & { photoUrl: string }
}

interface GroupMembersProps {
  group: GroupWithMembers
  members: GroupMember[]
  totalMembers: number
  isSuperAdmin: boolean
  isGlobalAdminGroup: boolean
  page: number
  totalPages: number
  groupUserRoles: GroupUserRoleType[]
}

export default function GroupMembers({
  group,
  members,
  totalMembers,
  isSuperAdmin,
  isGlobalAdminGroup,
  page,
  totalPages,
  groupUserRoles,
}: GroupMembersProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<UserWithPhotoUrl[]>([])
  const [isSearching, startSearchTransition] = useTransition()
  const [isAdding, startAddTransition] = useTransition()
  const [isUpdating, startUpdateTransition] = useTransition()
  const [editingMemberUserId, setEditingMemberUserId] = useState<string | null>(
    null,
  )
  const [memberSearchQuery, setMemberSearchQuery] = useState('')
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [selectedUserForLogin, setSelectedUserForLogin] = useState<User | null>(
    null,
  )
  const [addFormRoleId, setAddFormRoleId] = useState<string>(
    groupUserRoles.find((r) => r.code === 'member')?.id.toString() || '',
  )
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null)

  type SortableKey = 'email' | 'name' | 'role' | 'createdAt'
  const [sortConfig, setSortConfig] = useState<{
    key: SortableKey
    direction: 'ascending' | 'descending'
  } | null>({
    key: 'createdAt',
    direction: 'descending',
  })

  const handleAddMember = async (formData: FormData) => {
    startAddTransition(async () => {
      await addMember(formData)
      setSearchQuery('')
      setSearchResults([])
    })
  }

  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)
    startSearchTransition(async () => {
      if (query.length > 1) {
        const users = await searchUsers(group.id, query)
        setSearchResults(users as UserWithPhotoUrl[])
      } else {
        setSearchResults([])
      }
    })
  }

  const sortedMembers = useMemo(() => {
    let sortableItems = [...members]
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let aValue, bValue

        switch (sortConfig.key) {
          case 'email':
            aValue = a.user.email
            bValue = b.user.email
            break
          case 'name':
            aValue = `${a.user.firstName} ${a.user.lastName}`
            bValue = `${b.user.firstName} ${b.user.lastName}`
            break
          case 'role':
            aValue = a.role.code
            bValue = b.role.code
            break
          case 'createdAt':
            aValue = a.createdAt
            bValue = b.createdAt
            break
          default:
            // This will handle any unexpected keys gracefully.
            const key = sortConfig.key
            aValue = a[key as keyof typeof a]
            bValue = b[key as keyof typeof b]
        }

        if (aValue === null || aValue === undefined) return 1
        if (bValue === null || bValue === undefined) return -1

        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1
        }
        return 0
      })
    }
    return sortableItems
  }, [members, sortConfig])

  const filteredMembers = useMemo(() => {
    if (!memberSearchQuery) return sortedMembers
    return sortedMembers.filter((member) => {
      const fullName = `${member.user.firstName} ${member.user.lastName}`
      const searchLower = memberSearchQuery.toLowerCase()

      const nameMatch = fullName.toLowerCase().includes(searchLower)
      const emailMatch = member.user.email?.toLowerCase().includes(searchLower)
      const usernameMatch = member.user.username
        ?.toLowerCase()
        .includes(searchLower)

      return nameMatch || emailMatch || usernameMatch
    })
  }, [sortedMembers, memberSearchQuery])

  const requestSort = (key: SortableKey) => {
    let direction: 'ascending' | 'descending' = 'ascending'
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === 'ascending'
    ) {
      direction = 'descending'
    }
    setSortConfig({ key, direction })
  }

  const getSortIndicator = (key: SortableKey) => {
    if (!sortConfig || sortConfig.key !== key) return null
    return sortConfig.direction === 'ascending' ? ' ▲' : ' ▼'
  }

  return (
    <div>
      <LoginCodeModal
        isOpen={isLoginModalOpen}
        onClose={() => {
          setIsLoginModalOpen(false)
          setSelectedUserForLogin(null)
        }}
        user={selectedUserForLogin}
        groupId={group.id}
        groupSlug={group.slug}
      />
      <div className="mb-8 rounded-lg border p-4 dark:border-gray-700">
        <h2 className="mb-4 text-xl font-semibold">Add New Member</h2>
        <div className="max-w-lg">
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearch}
            placeholder="Search for users by name, email, or username..."
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
          />
          {isSearching && (
            <p className="mt-2 text-sm text-gray-500">Searching...</p>
          )}
          {searchResults.length > 0 && (
            <ul className="mt-4 space-y-2">
              {searchResults.map((user) => (
                <li
                  key={user.id}
                  className="flex flex-col items-stretch gap-y-4 rounded-md border p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-y-0 sm:p-2 dark:border-gray-600"
                >
                  <div className="flex flex-col items-end gap-y-3 md:flex-row md:items-center md:justify-end md:gap-4">
                    <Image
                      src={user.photoUrl}
                      alt={`${user.username}'s profile picture`}
                      width={48}
                      height={48}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-semibold">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <form action={handleAddMember}>
                    <input type="hidden" name="groupId" value={group.id} />
                    <input type="hidden" name="userId" value={user.id} />
                    <input type="hidden" name="roleId" value={addFormRoleId} />
                    <div className="flex flex-col items-end gap-y-3 md:flex-row md:items-center md:justify-end md:gap-4">
                      <Select
                        onValueChange={setAddFormRoleId}
                        defaultValue={addFormRoleId}
                      >
                        <SelectTrigger className="w-full sm:w-auto">
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        <SelectContent>
                          {groupUserRoles
                            .filter(
                              (role) =>
                                (isSuperAdmin && isGlobalAdminGroup) ||
                                role.code !== 'super',
                            )
                            .map((role) => (
                              <SelectItem
                                key={role.id}
                                value={role.id.toString()}
                              >
                                {role.code}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <button
                        type="submit"
                        disabled={isAdding}
                        className="inline-flex shrink-0 items-center justify-center rounded-md border border-transparent bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
                      >
                        {isAdding ? 'Adding...' : 'Add'}
                      </button>
                    </div>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-xl font-semibold">
          Current Members ({totalMembers})
        </h2>
        <div className="mb-4 max-w-lg">
          <input
            type="text"
            value={memberSearchQuery}
            onChange={(e) => setMemberSearchQuery(e.target.value)}
            placeholder="Search current members by name or email..."
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
          />
        </div>
        <div className="ring-opacity-5 -mx-4 mt-8 overflow-hidden shadow ring-1 ring-black sm:-mx-6 md:mx-0 md:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                                <th
                  scope="col"
                  className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white sm:pl-6"
                >
                  <button
                    onClick={() => requestSort('name')}
                    className="group inline-flex"
                  >
                    Name
                    <span className="ml-2 flex-none rounded text-gray-400 group-hover:bg-gray-200 dark:group-hover:bg-gray-600">
                      {getSortIndicator('name')}
                    </span>
                  </button>
                </th>
                <th
                  scope="col"
                  className="hidden w-1/4 px-3 py-3.5 text-left text-sm font-semibold text-gray-900 sm:table-cell"
                >
                  <button
                    onClick={() => requestSort('email')}
                    className="group inline-flex"
                  >
                    Email
                    <span className="ml-2 flex-none rounded text-gray-400 group-hover:bg-gray-200 dark:group-hover:bg-gray-600">
                      {getSortIndicator('email')}
                    </span>
                  </button>
                </th>
                                <th
                  scope="col"
                  className="hidden px-3 py-3.5 text-left text-sm font-semibold text-gray-900 lg:table-cell"
                >
                  Role
                </th>
                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                  <span className="sr-only">Edit</span>
                </th>
              </tr>
            </thead>
                        <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
              {filteredMembers.map((member) => (
                <tr key={member.userId}>
                  <td className="w-full max-w-0 py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-white sm:w-auto sm:max-w-none sm:pl-6">
                    <div className="flex items-center gap-4">
                      <Image
                        src={member.user.photoUrl}
                        alt={`${member.user.username}'s profile picture`}
                        width={40}
                        height={40}
                        className="h-10 w-10 rounded-full"
                      />
                      <div className="min-w-0 flex-auto">
                        <p className="font-semibold">
                          {member.user.firstName} {member.user.lastName}
                        </p>
                        <dl className="font-normal lg:hidden">
                          <dt className="sr-only">Role</dt>
                          <dd className="mt-1 truncate text-gray-500 dark:text-gray-400">
                            {editingMemberUserId !== member.userId &&
                              member.role.code}
                          </dd>
                          <dt className="sr-only sm:hidden">Email</dt>
                          <dd className="mt-1 truncate text-gray-500 dark:text-gray-400 sm:hidden">
                            {member.user.email}
                          </dd>
                        </dl>
                        {editingMemberUserId === member.userId && (
                          <div className="mt-3 flex items-center gap-3 lg:hidden">
                            <Select
                              onValueChange={setEditingRoleId}
                              defaultValue={member.roleId.toString()}
                            >
                              <SelectTrigger className="min-w-0 flex-1">
                                <SelectValue placeholder="Role" />
                              </SelectTrigger>
                              <SelectContent>
                                {groupUserRoles
                                  .filter(
                                    (role) =>
                                      (isSuperAdmin && isGlobalAdminGroup) ||
                                      role.code !== 'super',
                                  )
                                  .map((role) => (
                                    <SelectItem
                                      key={role.id}
                                      value={role.id.toString()}
                                    >
                                      {role.code}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                            <form
                              id={`update-form-${member.userId}-mobile`}
                              action={(formData) => {
                                startUpdateTransition(async () => {
                                  await updateMember(formData)
                                  setEditingMemberUserId(null)
                                })
                              }}
                              className="contents"
                            >
                              <input
                                type="hidden"
                                name="groupId"
                                value={member.groupId}
                              />
                              <input
                                type="hidden"
                                name="userId"
                                value={member.userId}
                              />
                              <input
                                type="hidden"
                                name="roleId"
                                value={editingRoleId ?? member.roleId}
                              />
                              <button
                                type="submit"
                                disabled={isUpdating}
                                className="p-2 text-indigo-600 hover:text-indigo-900 disabled:opacity-50 dark:text-indigo-400 dark:hover:text-indigo-200"
                              >
                                <Check className="h-6 w-6" />
                                <span className="sr-only">
                                  {isUpdating ? 'Saving...' : 'Save'}
                                </span>
                              </button>
                            </form>
                            <button
                              type="button"
                              onClick={() => setEditingMemberUserId(null)}
                              className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                              <X className="h-6 w-6" />
                              <span className="sr-only">Cancel</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="hidden px-3 py-4 text-sm text-gray-500 dark:text-gray-400 sm:table-cell">
                    {member.user.email}
                  </td>
                  <td className="hidden px-3 py-4 text-sm text-gray-500 dark:text-gray-400 lg:table-cell">
                    {editingMemberUserId === member.userId ? (
                      <Select
                        onValueChange={setEditingRoleId}
                        defaultValue={member.roleId.toString()}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        <SelectContent>
                          {groupUserRoles
                            .filter(
                              (role) =>
                                (isSuperAdmin && isGlobalAdminGroup) ||
                                role.code !== 'super',
                            )
                            .map((role) => (
                              <SelectItem
                                key={role.id}
                                value={role.id.toString()}
                              >
                                {role.code}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      member.role.code
                    )}
                  </td>
                  <td className="py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                    {editingMemberUserId === member.userId ? (
                      <div className="hidden items-center justify-end gap-x-4 lg:flex">
                        <form
                          id={`update-form-${member.userId}`}
                          action={(formData) => {
                            startUpdateTransition(async () => {
                              await updateMember(formData)
                              setEditingMemberUserId(null)
                            })
                          }}
                          className="contents"
                        >
                          <input
                            type="hidden"
                            name="groupId"
                            value={member.groupId}
                          />
                          <input
                            type="hidden"
                            name="userId"
                            value={member.userId}
                          />
                          <input
                            type="hidden"
                            name="roleId"
                            value={editingRoleId ?? member.roleId}
                          />
                          <button
                            type="submit"
                            disabled={isUpdating}
                            className="text-indigo-600 hover:text-indigo-900 disabled:opacity-50 dark:text-indigo-400 dark:hover:text-indigo-200"
                          >
                            <Check className="h-5 w-5" />
                            <span className="sr-only">
                              {isUpdating ? 'Saving...' : 'Save'}
                            </span>
                          </button>
                        </form>
                        <button
                          type="button"
                          onClick={() => setEditingMemberUserId(null)}
                          className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                          <X className="h-5 w-5" />
                          <span className="sr-only">Cancel</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-end gap-y-3 sm:flex-row sm:items-center sm:justify-end sm:gap-x-4">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => {
                                  setSelectedUserForLogin(member.user as User)
                                  setIsLoginModalOpen(true)
                                }}
                                className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200"
                              >
                                <KeyRound className="h-5 w-5" />
                                <span className="sr-only">Login Link</span>
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Login Link</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => {
                                  setEditingMemberUserId(member.userId)
                                  setEditingRoleId(member.roleId.toString()) // Pre-fill the role ID
                                }}
                                className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200"
                              >
                                <Pencil className="h-5 w-5" />
                                <span className="sr-only">Edit</span>
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Edit</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <form action={removeMember}>
                          <input
                            type="hidden"
                            name="groupId"
                            value={member.groupId}
                          />
                          <input
                            type="hidden"
                            name="userId"
                            value={member.userId}
                          />
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type="submit"
                                  className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200"
                                >
                                  <Trash2 className="h-5 w-5" />
                                  <span className="sr-only">Remove</span>
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Remove</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </form>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-gray-700 dark:text-gray-400">
            Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <Link
              href={`?page=${page - 1}`}
              className={`rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 ${
                page <= 1 ? 'pointer-events-none opacity-50' : ''
              }`}
            >
              Previous
            </Link>
            <Link
              href={`?page=${page + 1}`}
              className={`rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 ${page >= totalPages ? 'pointer-events-none opacity-50' : ''}`}
            >
              Next
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
