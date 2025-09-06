import prisma from '@/lib/prisma'
import Link from 'next/link'
import { DeleteGroupButton } from './DeleteGroupButton'
import { UndeleteGroupButton } from './UndeleteGroupButton'
import { Edit, Trash2, RotateCcw } from 'lucide-react'

type SortableColumn =
  | 'name'
  | 'slug'
  | 'description'
  | 'createdAt'
  | 'updatedAt'
type Order = 'asc' | 'desc'

interface GroupsTableProps {
  query: string
  sort: SortableColumn
  order: Order
}

export default async function GroupsTable({
  query,
  sort,
  order,
}: GroupsTableProps) {
  const where = query
    ? {
        OR: [
          { name: { contains: query, mode: 'insensitive' as const } },
          { slug: { contains: query, mode: 'insensitive' as const } },
          { description: { contains: query, mode: 'insensitive' as const } },
        ],
      }
    : {}

  const groups = await prisma.group.findMany({
    where,
    orderBy: {
      [sort]: order,
    },
  })

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
        href={`/admin/groups?sort=${column}&order=${newOrder}&query=${query}`}
        className="flex items-center gap-2 whitespace-nowrap"
      >
        {title}
        {arrow && <span>{arrow}</span>}
      </Link>
    )
  }

  return (
    <div className="ring-opacity-5 dark:ring-opacity-10 -mx-4 mt-8 overflow-hidden shadow ring-1 ring-black sm:-mx-6 md:mx-0 md:rounded-lg dark:ring-white">
      <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
        <thead>
          <tr>
            <th
              scope="col"
              className="py-3.5 pr-3 pl-4 text-left text-sm font-semibold text-gray-900 sm:pl-6 dark:text-white"
            >
              <SortableHeader column="name" title="Name" />
            </th>
            <th
              scope="col"
              className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 sm:table-cell dark:text-white"
            >
              <SortableHeader column="slug" title="Slug" />
            </th>
            <th
              scope="col"
              className="hidden px-3 py-3.5 text-left text-sm font-semibold text-gray-900 md:table-cell dark:text-white"
            >
              <SortableHeader column="description" title="Description" />
            </th>
            <th
              scope="col"
              className="hidden px-3 py-3.5 text-left text-sm font-semibold text-gray-900 md:table-cell dark:text-white"
            >
              <SortableHeader column="createdAt" title="Created" />
            </th>
            <th
              scope="col"
              className="hidden px-3 py-3.5 text-left text-sm font-semibold text-gray-900 md:table-cell dark:text-white"
            >
              <SortableHeader column="updatedAt" title="Updated" />
            </th>
            <th scope="col" className="relative py-3.5 pr-4 pl-3 sm:pr-6">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
          {groups.map((group) => (
            <tr
              key={group.id}
              className={group.deletedAt ? 'bg-gray-200 dark:bg-gray-700' : ''}
            >
              <td className="w-full max-w-0 py-4 pr-3 pl-4 text-sm font-medium text-gray-900 sm:w-auto sm:max-w-none sm:pl-6 dark:text-white">
                {group.name}
              </td>
              <td className="px-3 py-4 text-sm text-gray-500 sm:table-cell dark:text-gray-400">
                <Link
                  href={`/g/${group.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200"
                >
                  {group.slug}
                </Link>
              </td>
              <td className="hidden px-3 py-4 text-sm text-gray-500 md:table-cell dark:text-gray-400">
                {group.description}
              </td>
              <td className="hidden px-3 py-4 text-sm text-gray-500 md:table-cell dark:text-gray-400">
                {new Date(group.createdAt).toLocaleDateString()}
              </td>
              <td className="hidden px-3 py-4 text-sm text-gray-500 md:table-cell dark:text-gray-400">
                {new Date(group.updatedAt).toLocaleDateString()}
              </td>
              <td className="relative py-4 pr-4 pl-3 text-right text-sm font-medium whitespace-nowrap sm:pr-6">
                {group.deletedAt ? (
                  <UndeleteGroupButton groupId={group.id} />
                ) : (
                  <Link
                    href={`/admin/groups/${group.slug}/edit`}
                    className="inline-flex items-center text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200"
                    title="Edit group"
                  >
                    <Edit className="h-4 w-4" />
                  </Link>
                )}
                <span className="mx-2 text-gray-300 dark:text-gray-600">|</span>
                <DeleteGroupButton groupId={group.id} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
