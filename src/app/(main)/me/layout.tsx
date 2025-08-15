'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function MeLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const tabs = [
    { name: 'Me', href: '/me' },
    { name: 'Groups', href: '/me/groups' },
  ]

  return (
    <main className="container mx-auto px-4 pb-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => (
              <Link
                key={tab.name}
                href={tab.href}
                className={`${
                  pathname === tab.href
                    ? 'border-indigo-500 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-500 dark:hover:text-gray-300'
                } border-b-2 px-1 py-4 text-sm font-medium whitespace-nowrap`}
              >
                {tab.name}
              </Link>
            ))}
          </nav>
        </div>
        {children}
      </div>
    </main>
  )
}
