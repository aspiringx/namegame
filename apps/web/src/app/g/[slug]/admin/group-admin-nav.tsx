'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface GroupAdminNavProps {
  slug: string
}

export default function GroupAdminNav({ slug }: GroupAdminNavProps) {
  const pathname = usePathname()

  const tabs = [
    { name: 'Group', href: `/g/${slug}/admin` },
    { name: 'Members', href: `/g/${slug}/admin/members` },
  ]

  const tabBaseClasses =
    'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm'
  const activeTabClasses = 'border-indigo-500 text-indigo-600'
  const inactiveTabClasses =
    'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'

  return (
    <div className="border-b border-gray-700">
      <nav
        className="-mb-px flex items-center justify-between"
        aria-label="Tabs"
      >
        <div className="flex space-x-8">
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
        </div>
        <Link
          href={`/g/${slug}`}
          className="inline-flex items-center gap-x-1.5 rounded-md bg-indigo-600 px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          To Group
        </Link>
      </nav>
    </div>
  )
}
