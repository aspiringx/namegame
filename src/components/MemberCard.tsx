import Image from 'next/image'
import type { MemberWithUser as Member } from '@/types/index'
import { formatDistanceToNow } from 'date-fns'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { MoreVertical } from 'lucide-react'
import { Dropdown, DropdownItem } from './ui/dropdown'

interface MemberCardProps {
  member: Member
  listType: 'greeted' | 'notGreeted'
  viewMode: 'grid' | 'list' | 'quiz'
  relationship?: string
  isGroupAdmin?: boolean
  onRelate: (member: Member) => void
  currentUserId?: string
}

export default function MemberCard({
  member,
  listType,
  viewMode,
  relationship,
  isGroupAdmin,
  onRelate,
  currentUserId,
}: MemberCardProps) {
  const imageUrl = member.user.photoUrl || '/images/default-avatar.png'
  
  if (listType === 'greeted' && viewMode === 'list') {
    return (
      <>
        <div className="flex items-center space-x-4 p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700">
          <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded">
            <Image
              src={imageUrl}
              alt={member.user.name || 'User avatar'}
              fill
              sizes="96px"
              className="object-cover"
            />
          </div>
          <div className="flex-grow truncate">
            <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-200">
              {member.user.name}
            </p>
            {relationship && (
              <p className="truncate text-xs text-blue-500 dark:text-blue-400">
                {relationship}
              </p>
            )}
            {member.relationUpdatedAt ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <p className="cursor-pointer text-xs text-gray-500 underline decoration-dotted dark:text-gray-400">
                      {formatDistanceToNow(new Date(member.relationUpdatedAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{new Date(member.relationUpdatedAt).toLocaleString()}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : null}
          </div>
          <div className="relative">
            <Dropdown
              trigger={<MoreVertical size={16} />}
              triggerClassName="rounded-full p-1 hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <DropdownItem onClick={() => onRelate(member)}>Relate</DropdownItem>
            </Dropdown>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="text-center transition-transform duration-300 ease-in-out">
        <div className="relative aspect-square w-full overflow-hidden rounded-lg shadow-lg">
          <Image
            src={imageUrl}
            alt={member.user.name || 'User avatar'}
            fill
            sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 33vw"
            className={`object-cover`}
          />
        </div>
        <div className="relative mt-2">
          <div className="text-center">
            <p className="mt-2 truncate text-sm font-medium text-gray-800 dark:text-gray-200">
              {member.user.name}
            </p>
            {relationship && (
              <p className="truncate text-xs text-blue-500 dark:text-blue-400">
                {relationship}
              </p>
            )}
            {listType === 'greeted' && (
              <>
                {member.relationUpdatedAt ? (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <p className="cursor-pointer text-xs text-gray-500 underline decoration-dotted dark:text-gray-400">
                          {formatDistanceToNow(
                            new Date(member.relationUpdatedAt),
                            {
                              addSuffix: true,
                            }
                          )}
                        </p>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          {new Date(
                            member.relationUpdatedAt
                          ).toLocaleString()}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : null}
              </>
            )}
          </div>
          <div className="absolute right-0 top-0">
            <Dropdown
              trigger={<MoreVertical size={16} />}
              triggerClassName="rounded-full p-1 hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <DropdownItem onClick={() => onRelate(member)}>Relate</DropdownItem>
            </Dropdown>
          </div>
        </div>
      </div>
    </>
  )
}
