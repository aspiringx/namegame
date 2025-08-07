'use client'

import Image from 'next/image'
import type { MemberWithUser as Member } from '@/types/index'
import { formatDistanceToNow } from 'date-fns'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface FamilyMemberCardProps {
  member: Member
  viewMode: 'grid' | 'list'
  relationship?: string
}

export default function FamilyMemberCard({
  member,
  viewMode,
  relationship,
}: FamilyMemberCardProps) {
  const isListView = viewMode === 'list'

  return (
    <div
      className={
        isListView
          ? 'flex items-center gap-4 border-b py-0'
          : 'text-center transition-transform duration-300 ease-in-out'
      }
    >
      <div
        className={
          isListView
            ? 'relative h-24 w-24 flex-shrink-0'
            : 'border-border relative aspect-square w-full overflow-hidden rounded-md border shadow-lg dark:shadow-lg dark:shadow-white/10'
        }
      >
        <Image
          src={member.user.photoUrl || '/images/default-avatar.png'}
          alt={member.user.name || 'User avatar'}
          fill
          className="rounded object-cover p-4"
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
  )
}
