'use client'

import Link from 'next/link'
import UserMenu from './UserMenu'
import Image from 'next/image'
import { GroupData } from '@/types'
import { Settings } from 'lucide-react'

interface HeaderProps {
  group?: GroupData | null
  isGroupAdmin?: boolean
  groupSlug?: string
}

export default function Header({
  group,
  isGroupAdmin,
  groupSlug,
}: HeaderProps) {
  return (
    <header className="bg-background border-border sticky top-0 left-0 z-50 w-full border-b">
      <div className="container mx-auto flex h-full items-center justify-between px-5 py-1">
        {group ? (
          <Link href={`/g/${group.slug}`} className="flex items-center gap-2">
            {group.logoUrl && (
              <Image
                src={group.logoUrl}
                alt={`${group.name} logo`}
                width={32}
                height={32}
                className="h-10 w-10 object-cover"
              />
            )}
            <span className="block max-w-[200px] truncate text-xl font-bold text-gray-600 sm:max-w-none dark:text-gray-200">
              {group.name}
            </span>
          </Link>
        ) : (
          <Link
            href="/"
            className="flex items-center text-xl font-bold text-gray-600 dark:text-gray-200"
          >
            <Image
              src="/images/butterfly.png"
              alt="NameGame social butterfly"
              width={32}
              height={32}
              className="mx-auto h-auto md:max-w-[32px]"
            />
            NameGame
          </Link>
        )}
        <div className="flex items-center gap-4">
          {isGroupAdmin && groupSlug && (
            <Link
              href={`/g/${groupSlug}/admin`}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
            >
              <Settings size={24} />
            </Link>
          )}
          <UserMenu />
        </div>
      </div>
    </header>
  )
}
