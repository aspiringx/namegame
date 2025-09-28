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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LoginCodeModal } from './LoginCodeModal'
import PhotoGalleryModal from './PhotoGalleryModal'

interface MemberCardProps {
  member: Member
  relationship?: string
  isGroupAdmin?: boolean
  onRelate: (member: Member) => void
  onConnect?: (member: Member) => void
  currentUserId?: string
  groupSlug?: string
  // Photo gallery props
  allMembers?: Member[]
  memberIndex?: number
}

export default function MemberCard({
  member,
  // relationship,
  isGroupAdmin,
  onRelate,
  onConnect,
  currentUserId,
  groupSlug,
  allMembers = [],
  memberIndex = 0,
}: MemberCardProps) {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(memberIndex)

  const handleLoginLinkClick = () => {
    setIsLoginModalOpen(true)
  }

  const handlePhotoClick = () => {
    setCurrentPhotoIndex(memberIndex)
    setIsPhotoModalOpen(true)
  }

  const handleNavigate = (newIndex: number) => {
    setCurrentPhotoIndex(newIndex)
  }

  const currentMember = allMembers[currentPhotoIndex] || member
  const imageUrl = member.user.photoUrl || '/images/default-avatar.png'

  // Apply grayscale for non-connected users in community groups
  const isConnected = member.connectedAt
  const photoClassName = `rounded object-cover${isConnected ? '' : ' grayscale'}`

  return (
    <>
      <div className="text-center transition-transform duration-300 ease-in-out">
        <div
          className="relative aspect-square w-full cursor-pointer overflow-hidden rounded-lg shadow-lg transition-shadow duration-200 hover:shadow-xl"
          onClick={handlePhotoClick}
        >
          <Image
            src={imageUrl}
            alt={member.user.name || 'User avatar'}
            fill
            sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 33vw"
            className={photoClassName}
          />
        </div>
        <div className="items-top mt-2 flex justify-between gap-2">
          <div className="w-8">&nbsp;</div>
          <div className="w-7/10">
            <div className="truncate text-xs text-gray-800 dark:text-gray-200">
              {member.user.name}
            </div>
            {member.connectedAt && (
              <div>
                {member.connectedAt ? (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <p className="cursor-pointer text-xs text-gray-500 dark:text-gray-400">
                          {formatDistanceToNow(new Date(member.connectedAt), {
                            addSuffix: true,
                          })}
                        </p>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{new Date(member.connectedAt).toLocaleString()}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : null}
              </div>
            )}
          </div>

          <div className="vertical-align-top">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="rounded-full p-1 hover:bg-gray-200 dark:hover:bg-gray-700">
                  <MoreVertical size={16} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onRelate(member)}>
                  <Users className="mr-2 h-4 w-4" />
                  Relationships
                </DropdownMenuItem>
                {!member.connectedAt &&
                  onConnect &&
                  member.userId !== currentUserId && (
                    <DropdownMenuItem onClick={() => onConnect(member)}>
                      <Link className="mr-2 h-4 w-4" />
                      Connect
                    </DropdownMenuItem>
                  )}
                {isGroupAdmin && (
                  <DropdownMenuItem onClick={handleLoginLinkClick}>
                    <KeyRound className="mr-2 h-4 w-4" />
                    Get Login Code
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      {/* I believe we only show relationship in family groups. */}
      {/* {relationship && (
              <p className="truncate text-xs text-blue-500 dark:text-blue-400">
                {relationship}
              </p>
            )} */}

      {isGroupAdmin && groupSlug && (
        <LoginCodeModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          user={member.user}
          groupId={member.groupId}
          groupSlug={groupSlug}
        />
      )}
      <PhotoGalleryModal
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
        photoUrl={currentMember.user.photoUrl || '/images/default-avatar.png'}
        memberName={currentMember.user.name || 'Unknown'}
        photoIndex={currentPhotoIndex}
        totalPhotos={allMembers.length || 1}
        allMembers={allMembers}
        onNavigate={handleNavigate}
      />
    </>
  )
}
