'use client'

import Modal from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { MemberWithUser } from '@/types'
import Image from 'next/image'
import { X } from 'lucide-react'
import { Gender } from '@/generated/prisma'

interface MemberDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  member: MemberWithUser | null
  relationship?: string
}

const getGenderPronoun = (gender: Gender | null) => {
  if (!gender) return null
  switch (gender) {
    case 'male':
      return 'He'
    case 'female':
      return 'She'
    case 'non_binary':
      return 'They'
    default:
      return null
  }
}

export function MemberDetailsModal({
  isOpen,
  onClose,
  member,
  relationship,
}: MemberDetailsModalProps) {
  if (!isOpen || !member) return null

  const genderPronoun = getGenderPronoun(member.user.gender)

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="relative">
        <button
          onClick={onClose}
          className="absolute -top-2 -right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <X className="h-5 w-5" />
          <span className="sr-only">Close</span>
        </button>
        <div className="flex flex-col items-center gap-4 pt-4">
          <div className="relative h-96 w-96">
            <Image
              src={member.user.photoUrl || '/default-avatar.png'}
              alt={`${member.user.firstName} ${member.user.lastName}`}
              layout="fill"
              objectFit="cover"
              className="rounded-md"
            />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {member.user.firstName} {member.user.lastName}
            {relationship && (
              <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                {relationship}
              </p>
            )}
          </h2>
          <div className="space-y-1 text-center text-sm text-gray-600 dark:text-gray-300">
            {genderPronoun && (
              <p>
                <strong>Gender:</strong> {genderPronoun}
              </p>
            )}
            {member.user.birthDate && (
              <p>
                <strong>Born:</strong>{' '}
                {new Date(member.user.birthDate).toLocaleDateString()}
              </p>
            )}
            {member.user.birthPlace && (
              <p>
                <strong>Birth Place:</strong> {member.user.birthPlace}
              </p>
            )}
            {member.user.deathDate && (
              <p>
                <strong>Died:</strong>{' '}
                {new Date(member.user.deathDate).toLocaleDateString()}
              </p>
            )}
            {member.user.deathPlace && (
              <p>
                <strong>In:</strong> {member.user.deathPlace}
              </p>
            )}
          </div>
        </div>
        <div className="mt-6 flex justify-center">
          <Button type="button" variant="link" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  )
}
