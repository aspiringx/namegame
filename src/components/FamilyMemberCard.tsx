'use client';

import Image from 'next/image';
import type { MemberWithUser as Member } from '@/types/index';
import { formatDistanceToNow } from 'date-fns';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface FamilyMemberCardProps {
  member: Member;
  viewMode: 'grid' | 'list';
  relationship?: string;
}

export default function FamilyMemberCard({ member, viewMode, relationship }: FamilyMemberCardProps) {
  const isListView = viewMode === 'list';

  return (
    <div
      className={isListView ? 'grid grid-cols-[auto,1fr] items-center gap-4 py-3 border-b' : 'text-center transition-transform duration-300 ease-in-out'}
    >
      <div className={isListView ? 'relative w-24 h-24' : 'relative w-full aspect-square rounded-md overflow-hidden border border-border shadow-lg dark:shadow-lg dark:shadow-white/10'}>
        <Image
          src={member.user.photoUrl || '/images/default-avatar.png'}
          alt={member.user.name || 'User avatar'}
          fill
          className="object-cover p-4 rounded"
        />
      </div>
      <div className={isListView ? 'text-left' : 'mt-2'}>
        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
          {member.user.name}
        </p>
        {relationship && (
          <p className="text-xs text-blue-500 dark:text-blue-400">
            {relationship}
          </p>
        )}
      </div>
    </div>
  );
}
