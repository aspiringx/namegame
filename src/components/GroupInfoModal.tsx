'use client'

import { useEffect, useState } from 'react'
import { GroupData } from '@/types'
import { getGroupAdmins } from '@/app/g/[slug]/admin/actions'
import { User } from '@/generated/prisma'
import { X } from 'lucide-react'
import Image from 'next/image'

interface GroupInfoModalProps {
  group: GroupData
  isOpen: boolean
  onClose: () => void
}

export default function GroupInfoModal({
  group,
  isOpen,
  onClose,
}: GroupInfoModalProps) {
  const [admins, setAdmins] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true)
      getGroupAdmins(group.id)
        .then(setAdmins)
        .catch(console.error)
        .finally(() => setIsLoading(false))
    }
  }, [isOpen, group.id])

  if (!isOpen) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-lg bg-white shadow-2xl dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <X size={24} />
        </button>
        <div className="p-6">
          {group.logo && (
            <div className="mb-4 flex justify-center">
              <Image
                src={group.logo}
                alt={`${group.name} logo`}
                width={128}
                height={128}
              />
            </div>
          )}
          <h2 className="mb-4 text-center text-2xl font-bold text-gray-800 dark:text-gray-100">
            {group.name}
          </h2>
          {group.description && (
            <p className="mb-4 max-h-24 overflow-y-auto whitespace-pre-wrap text-gray-600 dark:text-gray-300">
              {group.description}
            </p>
          )}
          {group.address && (
            <p className="mb-2 text-gray-600 dark:text-gray-300">
              <strong>Address:</strong> {group.address}
            </p>
          )}
          {group.phone && (
            <p className="mb-4 text-gray-600 dark:text-gray-300">
              <strong>Phone:</strong> {group.phone}
            </p>
          )}

          <h3 className="mt-6 mb-2 text-lg font-semibold text-gray-700 dark:text-gray-200">
            Admins
          </h3>
          {isLoading ? (
            <p className="text-gray-500 dark:text-gray-400">
              Loading admins...
            </p>
          ) : (
            <ul className="list-inside list-disc text-gray-600 dark:text-gray-300">
              {admins.map((admin) => (
                <li key={admin.id}>
                  {admin.firstName} {admin.lastName}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
