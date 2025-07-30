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
    <div className={isListView ? 'flex items-center gap-4 py-3' : 'text-center transition-transform duration-300 ease-in-out'}>
      <div className={isListView ? 'relative w-24 h-24 rounded overflow-hidden' : 'relative w-full aspect-square rounded-md overflow-hidden shadow-lg'}>
        <Image
          src={member.user.photoUrl || '/images/default-avatar.png'}
          alt={member.user.name || 'User avatar'}
          fill
          className="object-cover"
        />
      </div>
      <div className={isListView ? 'text-left' : 'mt-2'}>
        <p className="text-sm font-medium text-gray-800 truncate dark:text-gray-200">
          {member.user.name}
        </p>
        {relationship && (
          <p className="text-xs text-blue-500 dark:text-blue-400 truncate">
            {relationship}
          </p>
        )}
      </div>
    </div>
  );
}
