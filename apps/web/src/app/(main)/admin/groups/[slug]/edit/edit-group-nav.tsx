'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Group } from '@namegame/db'

interface EditGroupNavProps {
  group: Group
}

export default function EditGroupNav({ group }: EditGroupNavProps) {
  const pathname = usePathname()

  const tabs = [
    { name: 'Edit Details', href: `/admin/groups/${group.slug}/edit` },
    {
      name: 'Manage Members',
      href: `/admin/groups/${group.slug}/edit/members`,
    },
  ]

  const tabBaseClasses =
    'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm'
  const activeTabClasses = 'border-indigo-500 text-indigo-600'
  const inactiveTabClasses =
    'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'

  return (
    <div className="border-b border-gray-700">
      <nav className="-mb-px flex space-x-8" aria-label="Tabs">
        {tabs.map((tab) => (
          <Link
            key={tab.name}
            href={tab.href}
            className={`${tabBaseClasses} ${
              pathname === tab.href ? activeTabClasses : inactiveTabClasses
            }`}
          >
            {tab.name}
          </Link>
        ))}
      </nav>
    </div>
  )
}
