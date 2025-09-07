import Image from 'next/image'
import Link from 'next/link'
import prisma from '@/lib/prisma'
import { getPublicUrl } from '@/lib/storage'
import { getCodeTable } from '@/lib/codes'
import { DeleteUserButton } from './DeleteUserButton'
import { UndeleteUserButton } from './UndeleteUserButton'
import { Edit, Trash2, RotateCcw } from 'lucide-react'

type SortableColumn = 'firstName' | 'lastName' | 'email' | 'phone' | 'updatedAt'
type Order = 'asc' | 'desc'

interface UsersTableProps {
  query: string
  sort: SortableColumn
  order: Order
  page: number
}

const USERS_PER_PAGE = 25

export default async function UsersTable({
  query,
  sort,
  order,
  page,
}: UsersTableProps) {
  const where = query
    ? {
        OR: [
          { firstName: { contains: query, mode: 'insensitive' as const } },
          { lastName: { contains: query, mode: 'insensitive' as const } },
          { email: { contains: query, mode: 'insensitive' as const } },
          { phone: { contains: query, mode: 'insensitive' as const } },
        ],
      }
    : {}

  const [photoTypes, entityTypes] = await Promise.all([
    getCodeTable('photoType'),
    getCodeTable('entityType'),
  ])

  const [totalUsers, users] = await prisma.$transaction([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: {
        [sort]: order,
      },
      skip: (page - 1) * USERS_PER_PAGE,
      take: USERS_PER_PAGE,
    }),
  ])

  const totalPages = Math.ceil(totalUsers / USERS_PER_PAGE)

  const userIds = users.map((user) => user.id)
  const photos = await prisma.photo.findMany({
    where: {
      entityId: { in: userIds },
      entityTypeId: entityTypes.user.id,
      typeId: photoTypes.primary.id,
    },
    select: {
      entityId: true,
      url: true,
    },
  })

  const photoUrlMap = new Map<string, string>()
  for (const photo of photos) {
    if (photo.entityId) {
      photoUrlMap.set(photo.entityId, photo.url)
    }
  }

  const usersWithPhotos = await Promise.all(
    users.map(async (user) => {
      const rawUrl = photoUrlMap.get(user.id)
      let photoUrl: string
      if (rawUrl) {
        if (rawUrl.startsWith('http')) {
          photoUrl = rawUrl
        } else {
          photoUrl = await getPublicUrl(rawUrl)
        }
      } else {
        photoUrl = '/images/default-avatar.png'
      }
      return { ...user, photoUrl }
    }),
  )

  const SortableHeader = ({
    column,
    title,
  }: {
    column: SortableColumn
    title: string
  }) => {
    const isCurrentSort = sort === column
    const newOrder = isCurrentSort && order === 'asc' ? 'desc' : 'asc'
    const arrow = isCurrentSort ? (order === 'asc' ? '↑' : '↓') : ''

    return (
      <Link
        href={`/admin/users?sort=${column}&order=${newOrder}&query=${query}&page=1`}
        className="flex items-center gap-2 whitespace-nowrap"
      >
        {title}
        {arrow && <span>{arrow}</span>}
      </Link>
    )
  }

  return (
    <>
      <div className="ring-opacity-5 dark:ring-opacity-10 -mx-4 mt-8 overflow-hidden shadow ring-1 ring-black sm:-mx-6 md:mx-0 md:rounded-lg dark:ring-white">
        <table className="w-full table-fixed divide-y divide-gray-300 dark:divide-gray-700">
          <thead>
            <tr>
              <th scope="col" className="w-24 px-4 py-3.5">
                <span className="sr-only">Photo</span>
              </th>
              {/* Desktop: Show separate First Name and Last Name columns */}
              <th className="hidden w-1/4 px-3 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase sm:table-cell">
                <SortableHeader column="firstName" title="First Name" />
              </th>
              <th className="hidden w-1/4 px-3 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase sm:table-cell">
                <SortableHeader column="lastName" title="Last Name" />
              </th>
              {/* Mobile: Show combined Name column */}
              <th className="px-3 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase sm:hidden">
                <SortableHeader column="firstName" title="Name" />
              </th>
              {/* Email column - hidden on mobile */}
              <th className="hidden w-1/4 px-3 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase sm:table-cell">
                <SortableHeader column="email" title="Email" />
              </th>
              {/* Updated column - hidden on mobile */}
              <th className="hidden w-1/6 px-3 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase sm:table-cell">
                <SortableHeader column="updatedAt" title="Updated" />
              </th>
              <th className="w-20 px-3 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
            {usersWithPhotos.map((user) => (
              <tr
                key={user.id}
                className={user.deletedAt ? 'bg-gray-200 dark:bg-gray-700' : ''}
              >
                <td className="px-4 py-4 text-sm whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-16 w-16 flex-shrink-0">
                      <Image
                        className="h-16 w-16 rounded-full object-cover"
                        src={user.photoUrl}
                        alt={`${user.firstName} ${user.lastName}'s profile picture`}
                        width={64}
                        height={64}
                      />
                    </div>
                  </div>
                </td>
                {/* Desktop: Show separate first and last name columns */}
                <td className="hidden px-3 py-4 text-sm font-medium text-gray-900 sm:table-cell dark:text-white">
                  <div className="min-w-0">
                    <span className="block truncate">{user.firstName}</span>
                  </div>
                </td>
                <td className="hidden px-3 py-4 text-sm font-medium text-gray-900 sm:table-cell dark:text-white">
                  <span className="block truncate">{user.lastName}</span>
                </td>
                {/* Mobile: Show combined name with email below if exists */}
                <td className="px-3 py-4 text-sm font-medium text-gray-900 sm:hidden dark:text-white">
                  <div className="min-w-0">
                    <span className="block truncate">
                      {user.firstName} {user.lastName}
                    </span>
                    {user.email && (
                      <span className="mt-1 block truncate text-sm text-gray-500 dark:text-gray-400">
                        {user.email}
                      </span>
                    )}
                  </div>
                </td>
                {/* Desktop: Show email in separate column */}
                <td className="hidden px-3 py-4 text-sm text-gray-500 sm:table-cell dark:text-gray-400">
                  {user.email && (
                    <span className="block truncate">{user.email}</span>
                  )}
                </td>
                {/* Desktop: Show updated date in separate column */}
                <td className="hidden px-3 py-4 text-sm text-gray-500 sm:table-cell dark:text-gray-400">
                  {new Date(user.updatedAt).toLocaleDateString()}
                </td>
                <td className="relative py-4 pr-4 pl-3 text-right text-sm font-medium whitespace-nowrap sm:pr-6">
                  {user.deletedAt ? (
                    <UndeleteUserButton userId={user.id} />
                  ) : (
                    <Link
                      href={`/admin/users/${user.id}/edit`}
                      className="inline-flex items-center text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200"
                      title="Edit user"
                    >
                      <Edit className="h-4 w-4" />
                    </Link>
                  )}
                  <span className="mx-2 text-gray-300 dark:text-gray-600">
                    |
                  </span>
                  <DeleteUserButton userId={user.id} />
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
            href={`/admin/users?page=${page - 1}&sort=${sort}&order=${order}&query=${query}`}
            className={`rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 ${
              page <= 1 ? 'pointer-events-none opacity-50' : ''
            }`}
          >
            Previous
          </Link>
          <Link
            href={`/admin/users?page=${page + 1}&sort=${sort}&order=${order}&query=${query}`}
            className={`rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 ${
              page >= totalPages ? 'pointer-events-none opacity-50' : ''
            }`}
          >
            Next
          </Link>
        </div>
      </div>
    </>
  )
}
