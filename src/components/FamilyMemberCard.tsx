import { useState } from 'react'
import Image from 'next/image'
import type { MemberWithUser as Member } from '@/types/index'
import { MoreVertical, Users, KeyRound } from 'lucide-react'
import { Dropdown, DropdownItem } from './ui/dropdown'
import { LoginCodeModal } from './LoginCodeModal'

interface FamilyMemberCardProps {
  member: Member
  viewMode: 'grid' | 'list'
  relationship?: string | null
  onRelate: (member: Member) => void
  currentUserId?: string
  isGroupAdmin?: boolean
  groupSlug?: string
}

export default function FamilyMemberCard({
  member,
  viewMode,
  relationship,
  onRelate,
  currentUserId,
  isGroupAdmin,
  groupSlug,
}: FamilyMemberCardProps) {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)

  const handleLoginLinkClick = () => {
    setIsLoginModalOpen(true)
  }
  const isListView = viewMode === 'list'
  const imageUrl = member.user.photoUrl || '/images/default-avatar.png'

  return (
    <>
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
          className={
            isListView
              ? 'flex w-full items-center justify-between'
              : 'relative mt-2'
          }
        >
          <div className={isListView ? 'text-left' : 'text-center'}>
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
          <div
            className={isListView ? 'relative' : 'absolute top-0 right-0 -mt-1'}
          >
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
    </>
  )
}
