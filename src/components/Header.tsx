'use client';

import Link from 'next/link';
import UserMenu from './UserMenu';
import { useGroup } from './GroupProvider';

export default function Header() {
  const group = useGroup();

  return (
    <header className="bg-white dark:bg-gray-900 shadow-md fixed top-0 left-0 w-full z-50">
      <div className="container mx-auto flex justify-between items-center px-5 py-3 h-full">
        {group ? (
          <Link
            href={`/g/${group.slug}`}
            className="block truncate text-2xl font-bold text-indigo-600 dark:text-indigo-400 max-w-[200px] sm:max-w-none"
          >
            {group.name}
          </Link>
        ) : (
          <Link href="/" className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
            NameGame
          </Link>
        )}
        <UserMenu />
      </div>
    </header>
  );
}
