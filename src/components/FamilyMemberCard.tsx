import Image from 'next/image'
import type { MemberWithUser as Member } from '@/types/index'
import { MoreVertical } from 'lucide-react'
import { Dropdown, DropdownItem } from './ui/dropdown'
import { useState } from 'react'
import ManageUserModal from './ManageUserModal'

interface FamilyMemberCardProps {
  member: Member
  viewMode: 'grid' | 'list'
  relationship?: string | null
  onRelate: (member: Member) => void
  currentUserId?: string
  isGroupAdmin?: boolean
  groupMembers: Member[]
}

export default function FamilyMemberCard({
  member,
  viewMode,
  relationship,
  onRelate,
  currentUserId,
  isGroupAdmin,
  groupMembers,
}: FamilyMemberCardProps) {
  const [isManageModalOpen, setIsManageModalOpen] = useState(false)
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
        className={isListView ? 'flex w-full items-center justify-between' : 'relative mt-2'}
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
        <div className={isListView ? 'relative' : 'absolute right-0 top-0'}>
          <Dropdown
            trigger={<MoreVertical size={16} />}
            triggerClassName="rounded-full p-1 hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <DropdownItem onClick={() => onRelate && onRelate(member)}>
              Relate
            </DropdownItem>
            <DropdownItem onClick={() => setIsManageModalOpen(true)}>
              Manage
            </DropdownItem>
          </Dropdown>
        </div>
      </div>
    </div>
      {isManageModalOpen && (
        <ManageUserModal
          isOpen={isManageModalOpen}
          onClose={() => setIsManageModalOpen(false)}
          managedUser={member.user}
          groupMembers={groupMembers}
        />
      )}
    </>
  )
}
