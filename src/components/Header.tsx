'use client';

import Link from 'next/link';
import UserMenu from './UserMenu';
import { useGroup } from './GroupProvider';

export default function Header() {
  const { group } = useGroup();

  return (
    <header className="bg-background border-b border-border fixed top-0 left-0 w-full z-50">
      <div className="container mx-auto flex justify-between items-center px-5 py-1 h-full">
        {group ? (
          <Link
            href={`/g/${group.slug}`}
            className="block truncate text-xl font-bold text-gray-600 dark:text-gray-200 max-w-[200px] sm:max-w-none"
          >
            {group.name}
          </Link>
        ) : (
          <Link href="/" className="text-xl font-bold text-gray-600 dark:text-gray-200">
            NameGame
          </Link>
        )}
        <UserMenu />
      </div>
    </header>
  );
}
