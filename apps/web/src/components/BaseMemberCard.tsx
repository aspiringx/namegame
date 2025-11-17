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
import RelationStarModal from './RelationStarModal'
import { MemberCardStrategy } from '@/lib/group-adapters/types'

interface BaseMemberCardProps {
  member: Member
  strategy: MemberCardStrategy
  relationship?: string | null
  isGroupAdmin?: boolean
  currentUserId?: string
  currentUserFirstName?: string
  groupSlug?: string
  // Photo gallery props
  allMembers?: Member[]
  memberIndex?: number
  // Strategy-specific action handlers
  onRelate?: (member: Member) => void
  onConnect?: (member: Member) => void
}

/**
 * Universal member card component that uses strategy pattern
 * to handle group-specific rendering and behavior.
 *
 * Used by UniversalClient to provide consistent member card rendering
 * across all group types. Legacy MemberCard and FamilyMemberCard
 * components are still used by older parts of the codebase.
 */
export default function BaseMemberCard({
  member,
  strategy,
  relationship,
  isGroupAdmin,
  currentUserId,
  currentUserFirstName,
  groupSlug,
  allMembers = [],
  memberIndex = 0,
  onRelate,
  onConnect,
}: BaseMemberCardProps) {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false)
  const [isRelationStarModalOpen, setIsRelationStarModalOpen] = useState(false)
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

  // Determine if user is connected (for community groups)
  const isConnected = !strategy.showConnectedTime || member.connectedAt
  const photoClassName = `rounded object-cover${
    isConnected ? '' : ' grayscale'
  }`

  // Note: actionProps removed since we're using strategy configuration directly

  // Get strategy-specific CSS classes
  const cardClassName = strategy.cardClassName || ''

  return (
    <>
      <div
        className={`text-center transition-transform duration-300 ease-in-out ${cardClassName}`}
      >
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
            <div className="truncate text-xs text-gray-200">
              {member.user.name}
            </div>
            {/* Strategy-specific relationship rendering */}
            {strategy.showRelationship && relationship && (
              <button
                className={strategy.relationshipClassName}
                onClick={() =>
                  strategy.relationshipClickable && onRelate?.(member)
                }
                disabled={!strategy.relationshipClickable}
              >
                {relationship}
              </button>
            )}

            {/* Strategy-specific connected time rendering (community groups) */}
            {member.userId !== currentUserId &&
              strategy.showConnectedTime &&
              member.connectedAt && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <p className={strategy.connectedTimeClassName}>
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
              )}
          </div>
          <div className="vertical-align-top">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="rounded-full p-1 hover:bg-gray-200 hover:bg-gray-700">
                  <MoreVertical size={16} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {/* Relation Star - available to all users for their own relationships */}
                {member.userId !== currentUserId && (
                  <DropdownMenuItem
                    onClick={() => setIsRelationStarModalOpen(true)}
                  >
                    <span className="mr-2">⭐</span>
                    Cosmic Insights
                  </DropdownMenuItem>
                )}
                {/* Strategy-specific actions */}
                {strategy.availableActions.includes('relate') && (
                  <DropdownMenuItem onClick={() => onRelate?.(member)}>
                    <Users className="mr-2 h-4 w-4" />
                    Relationships
                  </DropdownMenuItem>
                )}
                {strategy.availableActions.includes('connect') &&
                  !member.connectedAt &&
                  member.userId !== currentUserId && (
                    <DropdownMenuItem onClick={() => onConnect?.(member)}>
                      <Link className="mr-2 h-4 w-4" />
                      Connect
                    </DropdownMenuItem>
                  )}
                {/* Common admin action */}
                {isGroupAdmin &&
                  strategy.availableActions.includes('admin') && (
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

      {/* Common modals */}
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
      <RelationStarModal
        isOpen={isRelationStarModalOpen}
        onClose={() => setIsRelationStarModalOpen(false)}
        memberName={member.user.name || 'Unknown'}
        memberPhotoUrl={member.user.photoUrl || '/images/default-avatar.png'}
        userId={currentUserId || ''}
        memberId={member.userId}
        currentUserFirstName={currentUserFirstName}
        memberFirstName={member.user.firstName || undefined}
      />
    </>
  )
}
