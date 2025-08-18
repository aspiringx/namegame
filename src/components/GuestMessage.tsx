'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function GuestMessage({ isGuest }: { isGuest: boolean }) {
  const pathname = usePathname()

  if (!isGuest) {
    return null
  }

  const updateProfileContentUserPage = (
    <span className="">Add required fields</span>
  )
  const updateProfileContentGroupPage = (
    <span className="">Update your profile</span>
  )

  return (
    <div className="mb-4 rounded-md bg-yellow-50 p-4 text-sm text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
      You're playing as a guest with limited features.{' '}
      {pathname === '/me' ? (
        updateProfileContentUserPage
      ) : (
        <Link
          href="/me"
          className="font-medium underline hover:text-yellow-900 dark:hover:text-yellow-200"
        >
          {updateProfileContentGroupPage}
        </Link>
      )}{' '}
      for full access.
    </div>
  )
}
