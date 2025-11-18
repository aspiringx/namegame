'use client'

import Link from 'next/link'
import { DeleteGroupButton } from './DeleteGroupButton'
import { UndeleteGroupButton } from './UndeleteGroupButton'
import { Edit } from 'lucide-react'
import type { Group } from '@namegame/db'

type SortableColumn =
  | 'name'
  | 'slug'
  | 'description'
  | 'createdAt'
  | 'updatedAt'
type Order = 'asc' | 'desc'

interface GroupsTableProps {
  groups: Group[]
  sort: { column: SortableColumn; order: Order }
  onSort: (column: SortableColumn) => void
}

export default function GroupsTable({
  groups,
  sort,
  onSort,
}: GroupsTableProps) {
  const SortableHeader = ({
    column,
    title,
  }: {
    column: SortableColumn
    title: string
  }) => {
    const isCurrentSort = sort.column === column
    const arrow = isCurrentSort ? (sort.order === 'asc' ? '↑' : '↓') : ''

    return (
      <button
        onClick={() => onSort(column)}
        className="flex items-center gap-2 whitespace-nowrap"
      >
        {title}
        {arrow && <span>{arrow}</span>}
      </button>
    )
  }

  return (
    <div className="ring-opacity-5 ring-opacity-10 -mx-4 mt-8 overflow-hidden shadow ring-1 ring-black sm:-mx-6 md:mx-0 md:rounded-lg ring-white">
      <table className="min-w-full divide-y divide-gray-300 divide-gray-700">
        <thead>
          <tr>
            <th
              scope="col"
              className="py-3.5 pr-3 pl-4 text-left text-sm font-semibold text-white sm:pl-6"
            >
              <SortableHeader column="name" title="Name" />
            </th>
            <th
              scope="col"
              className="px-3 py-3.5 text-left text-sm font-semibold text-white sm:table-cell"
            >
              <SortableHeader column="slug" title="Slug" />
            </th>
            <th
              scope="col"
              className="hidden px-3 py-3.5 text-left text-sm font-semibold text-white md:table-cell"
            >
              <SortableHeader column="description" title="Description" />
            </th>
            <th
              scope="col"
              className="hidden px-3 py-3.5 text-left text-sm font-semibold text-white md:table-cell"
            >
              <SortableHeader column="createdAt" title="Created" />
            </th>
            <th
              scope="col"
              className="hidden px-3 py-3.5 text-left text-sm font-semibold text-white md:table-cell"
            >
              <SortableHeader column="updatedAt" title="Updated" />
            </th>
            <th scope="col" className="relative py-3.5 pr-4 pl-3 sm:pr-6">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white divide-gray-700 bg-gray-800">
          {groups.map((group) => (
            <tr key={group.id} className={group.deletedAt ? 'bg-gray-700' : ''}>
              <td className="w-full max-w-0 py-4 pr-3 pl-4 text-sm font-medium text-white sm:w-auto sm:max-w-none sm:pl-6">
                {group.name}
              </td>
              <td className="px-3 py-4 text-sm text-gray-500 sm:table-cell text-gray-400">
                <Link
                  href={`/g/${group.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:text-indigo-400 hover:text-indigo-200"
                >
                  {group.slug}
                </Link>
              </td>
              <td className="hidden px-3 py-4 text-sm text-gray-500 md:table-cell text-gray-400">
                {group.description}
              </td>
              <td className="hidden px-3 py-4 text-sm text-gray-500 md:table-cell text-gray-400">
                {new Date(group.createdAt).toLocaleDateString()}
              </td>
              <td className="hidden px-3 py-4 text-sm text-gray-500 md:table-cell text-gray-400">
                {new Date(group.updatedAt).toLocaleDateString()}
              </td>
              <td className="relative py-4 pr-4 pl-3 text-right text-sm font-medium whitespace-nowrap sm:pr-6">
                {group.deletedAt ? (
                  <UndeleteGroupButton groupId={group.id} />
                ) : (
                  <Link
                    href={`/admin/groups/${group.slug}/edit`}
                    className="inline-flex items-center text-indigo-600 hover:text-indigo-400 hover:text-indigo-200"
                    title="Edit group"
                  >
                    <Edit className="h-4 w-4" />
                  </Link>
                )}
                <span className="mx-2 text-gray-600">|</span>
                <DeleteGroupButton groupId={group.id} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
