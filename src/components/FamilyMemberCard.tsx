import { useState } from 'react'
import Image from 'next/image'
import type { MemberWithUser as Member } from '@/types/index'
import { MoreVertical, Users, KeyRound } from 'lucide-react'
import { Dropdown, DropdownItem } from './ui/dropdown'
import { LoginCodeModal } from './LoginCodeModal'
import PhotoGalleryModal from './PhotoGalleryModal'

interface FamilyMemberCardProps {
  member: Member
  relationship?: string | null
  onRelate: (member: Member) => void
  currentUserId?: string
  isGroupAdmin?: boolean
  groupSlug?: string
  // Photo gallery props
  allMembers?: Member[]
  memberIndex?: number
}

export default function FamilyMemberCard({
  member,
  relationship,
  onRelate,
  currentUserId: _currentUserId,
  isGroupAdmin,
  groupSlug,
  allMembers = [],
  memberIndex = 0,
}: FamilyMemberCardProps) {
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

  return (
    <>
      <div className="text-center transition-transform duration-300 ease-in-out">
        <div 
          className="border-border relative aspect-square w-full overflow-hidden rounded-md border shadow-lg cursor-pointer hover:shadow-xl transition-shadow duration-200 dark:shadow-lg dark:shadow-white/10"
          onClick={handlePhotoClick}
        >
          <Image
            src={imageUrl}
            alt={member.user.name || 'User avatar'}
            fill
            sizes={'(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 33vw'}
            className="rounded object-cover p-4"
          />
        </div>
        <div className="relative mt-2">
          <div className={'text-center'}>
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
              {member.user.name}
            </p>
            {relationship && (
              <button
                onClick={() => onRelate && onRelate(member)}
                className="text-left text-xs text-blue-500 hover:underline focus:outline-none dark:text-blue-400"
              >
                {relationship}
              </button>
            )}
          </div>
          <div className={'absolute top-0 right-0 -mt-1'}>
            <Dropdown
              trigger={<MoreVertical size={16} />}
              triggerClassName="rounded-full p-1 hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <DropdownItem onClick={() => onRelate && onRelate(member)}>
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
