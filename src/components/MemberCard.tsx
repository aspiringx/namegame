import { useState } from 'react'
import Image from 'next/image'
import type { MemberWithUser as Member } from '@/types/index'
import { formatDistanceToNow } from 'date-fns'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { MoreVertical, Link, KeyRound, Users } from 'lucide-react'
import { Dropdown, DropdownItem } from './ui/dropdown'
import { LoginCodeModal } from './LoginCodeModal'

interface MemberCardProps {
  member: Member
  relationship?: string
  isGroupAdmin?: boolean
  onRelate: (member: Member) => void
  onConnect?: (member: Member) => void
  currentUserId?: string
  groupSlug?: string
}

export default function MemberCard({
  member,
  relationship,
  isGroupAdmin,
  onRelate,
  onConnect,
  currentUserId,
  groupSlug,
}: MemberCardProps) {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)

  const handleLoginLinkClick = () => {
    setIsLoginModalOpen(true)
  }

  const imageUrl = member.user.photoUrl || '/images/default-avatar.png'

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
          <div className="relative text-center">
            <div className="flex items-center justify-center gap-2">
              <div className="absolute top-1 left-0 flex h-full items-center">
                {!member.connectedAt && onConnect && member.userId !== currentUserId && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => onConnect(member)}
                          className="flex-shrink-0 rounded-full p-1 hover:bg-gray-200 dark:hover:bg-gray-600"
                        >
                          <Link className="h-4 w-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>I already know {member.user.name}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              <p className="mt-2 truncate text-sm font-medium text-gray-800 dark:text-gray-200">
                {member.user.name}
              </p>
            </div>
            {relationship && (
              <p className="truncate text-xs text-blue-500 dark:text-blue-400">
                {relationship}
              </p>
            )}
            {member.connectedAt && (
              <>
                {member.connectedAt ? (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <p className="cursor-pointer text-xs text-gray-500 underline decoration-dotted dark:text-gray-400">
                          {formatDistanceToNow(
                            new Date(member.connectedAt),
                            {
                              addSuffix: true,
                            },
                          )}
                        </p>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          {new Date(member.connectedAt).toLocaleString()}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : null}
              </>
            )}
          </div>
          <div className="absolute top-1 right-0">
            <Dropdown
              trigger={<MoreVertical size={16} />}
              triggerClassName="rounded-full p-1 hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <DropdownItem onClick={() => onRelate(member)}>
                <Users className="mr-2 h-4 w-4" />
                Relationships
              </DropdownItem>
              {isGroupAdmin && (
                <DropdownItem onClick={handleLoginLinkClick}>
                  <KeyRound className="mr-2 h-4 w-4" />
                  Get Login Code
                </DropdownItem>
              )}
            </Dropdown>
          </div>
        </div>
      </div>
      {isGroupAdmin && groupSlug && (
        <LoginCodeModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          user={member.user}
          groupId={member.groupId}
          groupSlug={groupSlug}
        />
      )}
    </>
  )
}
