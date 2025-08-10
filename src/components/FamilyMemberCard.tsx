import Image from 'next/image'
import type { MemberWithUser as Member } from '@/types/index'
import { formatDistanceToNow } from 'date-fns'
import { MoreVertical } from 'lucide-react'
import { Dropdown, DropdownItem } from './ui/dropdown'
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
  const imageUrl = member.user.photoUrl || '/images/default-avatar.png'

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
            ? 'relative h-36 w-36 flex-shrink-0'
            : 'border-border relative aspect-square w-full overflow-hidden rounded-md border shadow-lg dark:shadow-lg dark:shadow-white/10'
        }
      >
        <Image
          src={imageUrl}
          alt={member.user.name || 'User avatar'}
          fill
          sizes={
            isListView
              ? '96px'
              : '(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 33vw'
          }
          className="rounded object-cover p-4"
        />
      </div>
      <div
        className={isListView ? 'flex w-full items-center justify-between' : 'relative mt-2'}
      >
        <div className={isListView ? 'text-left' : 'text-center'}>
          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
            {member.user.name}
          </p>
          {relationship && (
            <p className="text-xs text-blue-500 dark:text-blue-400">
              {relationship}
            </p>
          )}
        </div>
        <div className={isListView ? 'relative' : 'absolute right-0 top-0'}>
          <Dropdown
            trigger={<MoreVertical size={16} />}
            triggerClassName="rounded-full p-1 hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <DropdownItem onClick={() => console.log('Relate clicked')}>
              Relate
            </DropdownItem>
          </Dropdown>
        </div>
      </div>
    </div>
  )
}
