'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function MeTabs({ isGuest }: { isGuest: boolean }) {
  const pathname = usePathname()

  let tabs = [
    { name: 'Me', href: '/me' },
    { name: 'Groups', href: '/me/groups' },
    { name: 'Managed Users', href: '/me/users' },
  ]

  if (isGuest) {
    tabs = tabs.filter((tab) => tab.name !== 'Managed Users')
  }

  return (
    <div className="mb-6 border-b border-gray-700">
      <nav className="-mb-px flex space-x-8" aria-label="Tabs">
        {tabs.map((tab) => (
          <Link
            key={tab.name}
            href={tab.href}
            className={`${
              pathname === tab.href
                ? 'border-indigo-500 text-indigo-600 border-indigo-400 text-indigo-400'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-400 hover:border-gray-500 hover:text-gray-300'
            } border-b-2 px-1 py-4 text-sm font-medium whitespace-nowrap`}
          >
            {tab.name}
          </Link>
        ))}
      </nav>
    </div>
  )
}
