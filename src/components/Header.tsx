'use client';

import Link from 'next/link';
import UserMenu from './UserMenu';
import Image from 'next/image';
import { GroupData } from '@/types';
import { Settings } from 'lucide-react';

interface HeaderProps {
  group?: GroupData | null;
  isGroupAdmin?: boolean;
  groupSlug?: string;
}

export default function Header({ group, isGroupAdmin, groupSlug }: HeaderProps) {
  return (
    <header className="bg-background border-b border-border sticky top-0 left-0 w-full z-50">
      <div className="container mx-auto flex justify-between items-center px-5 py-1 h-full">
        {group ? (
          <Link
            href={`/g/${group.slug}`}
            className="block truncate text-xl font-bold text-gray-600 dark:text-gray-200 max-w-[200px] sm:max-w-none"
          >
            {group.name}
          </Link>
        ) : (
          <Link href="/" className="text-xl font-bold text-gray-600 dark:text-gray-200 flex items-center">
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
            <Link href={`/g/${groupSlug}/admin`} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white">
              <Settings size={24} />
            </Link>
          )}
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
