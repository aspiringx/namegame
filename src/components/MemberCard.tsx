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

interface MemberCardProps {
  member: Member;
  listType: 'sunDeck' | 'iceBlock';
}

export default function MemberCard({ member, listType }: MemberCardProps) {
  return (
    <div className="text-center transition-transform duration-300 ease-in-out">
      <div className="relative w-full aspect-square rounded-lg overflow-hidden shadow-lg">
        <Image
          src={member.user.photoUrl || '/images/default-avatar.png'}
          alt={member.user.name || 'User avatar'}
          fill
          className="object-cover"
        />
      </div>
      <p className="mt-2 text-sm font-medium text-gray-800 truncate dark:text-gray-200">
        {member.user.name}
      </p>
      {listType === 'sunDeck' && (
        <>
          {member.relationUpdatedAt ? (
            <Tooltip>
              <TooltipTrigger>
                <p className="text-xs text-gray-500 dark:text-gray-400 cursor-pointer underline decoration-dotted">
                  {formatDistanceToNow(new Date(member.relationUpdatedAt), { addSuffix: true })}
                </p>
              </TooltipTrigger>
              <TooltipContent>
                <p>{new Date(member.relationUpdatedAt).toLocaleString()}</p>
              </TooltipContent>
            </Tooltip>
          ) : null}
        </>
      )}
    </div>
  );
}
