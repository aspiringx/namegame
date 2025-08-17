'use client'

import { useState, useEffect, useTransition } from 'react'
import Modal from './ui/modal'
import { useSession } from 'next-auth/react'
import { getManagers, addManager, removeManager } from '@/app/(main)/me/users/actions'
import { User } from '@/generated/prisma/client'
import { toast } from 'sonner'
import { Combobox } from './ui/combobox'
import Image from 'next/image'

interface ManageUserModalProps {
  isOpen: boolean
  onClose: () => void
  managedUser: User & { managers?: any[] }
  groupMembers: any[]
}

export default function ManageUserModal({ 
  isOpen, 
  onClose, 
  managedUser, 
  groupMembers 
}: ManageUserModalProps) {
  const { data: session } = useSession()
  const [managers, setManagers] = useState<any[]>([])
  const [isCurrentUserMananger, setIsCurrentUserManager] = useState(false)
  const [selectedMemberId, setSelectedMemberId] = useState('')
  const [isPending, startTransition] = useTransition()
  const [isDeleting, startDeletingTransition] = useTransition()
  const [managerToDelete, setManagerToDelete] = useState<any | null>(null)

  useEffect(() => {
    if (isOpen) {
      startTransition(async () => {
        const fetchedManagers = await getManagers(managedUser.id)
        setManagers(fetchedManagers)
        setIsCurrentUserManager(
          fetchedManagers.some((m) => m.id === session?.user?.id)
        )
      })
    }
  }, [isOpen, managedUser.id, session?.user?.id])

  const handleAddManager = async () => {
    if (!selectedMemberId) return

    startTransition(async () => {
      try {
        await addManager(managedUser.id, selectedMemberId)
        const updatedManagers = await getManagers(managedUser.id)
        setManagers(updatedManagers)
        toast.success('Manager added successfully.')
        setSelectedMemberId('')
      } catch (error) {
        toast.error('Failed to add manager.')
      }
    })
  }

  const handleRemoveManager = async () => {
    if (!managerToDelete) return

    startDeletingTransition(async () => {
      try {
        await removeManager(managedUser.id, managerToDelete.id)
        setManagers((prev) => prev.filter((m) => m.id !== managerToDelete.id))
        toast.success('Manager removed successfully.')
        setManagerToDelete(null)
      } catch (error) {
        toast.error('Failed to remove manager.')
      }
    })
  }

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={`Manage ${managedUser.firstName}`}>
        <div className="mt-4">
          {isCurrentUserMananger && (
            <div className="space-y-4 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-md font-medium text-gray-900 dark:text-gray-100">Add Manager</h3>
              <div className="flex items-center space-x-2">
                <div className="flex-grow">
                  <Combobox
                    name="managerId"
                    options={groupMembers
                      .filter(gm => !managers.some(m => m.id === gm.user.id) && gm.user.id !== managedUser.id)
                      .map(gm => ({ value: gm.user.id, label: `${gm.user.firstName} ${gm.user.lastName}` }))}
                    selectedValue={selectedMemberId}
                    onSelectValue={setSelectedMemberId}
                    placeholder="Select a group member"
                  />
                </div>
                <button 
                  onClick={handleAddManager} 
                  disabled={isPending || !selectedMemberId}
                  className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isPending ? 'Adding...' : 'Add'}
                </button>
              </div>
            </div>
          )}

          <div className="mt-6">
            <h4 className="text-md font-medium text-gray-900 dark:text-gray-100">
              Managing Users
            </h4>
            {managers.length > 0 ? (
              <ul className="mt-2 divide-y divide-gray-200 dark:divide-gray-700">
                {managers.map(manager => (
                  <li key={manager.id} className="flex items-center justify-between py-2">
                    <div className="flex items-center space-x-3">
                      <div className="relative h-8 w-8 flex-shrink-0">
                        <Image
                          src={manager.photoUrl || '/images/default-avatar.png'}
                          alt={manager.firstName || 'User avatar'}
                          fill
                          className="rounded-full object-cover"
                        />
                      </div>
                      <span>{manager.firstName} {manager.lastName}</span>
                    </div>
                    {isCurrentUserMananger && session?.user?.id !== manager.id && (
                      <button
                        type="button"
                        onClick={() => setManagerToDelete(manager)}
                        className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-500"
                        aria-label={`Remove ${manager.firstName} as a manager`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                No managers assigned.
              </p>
            )}
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              className="inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:bg-blue-800 dark:text-blue-100 dark:hover:bg-blue-700"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
      {managerToDelete && (
        <Modal
          isOpen={!!managerToDelete}
          onClose={() => setManagerToDelete(null)}
          title="Confirm Removal"
        >
          <div className="mt-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Are you sure you want to remove {' '}
              <strong>
                {managerToDelete.firstName} {managerToDelete.lastName}
              </strong>{' '}
              as a manager?
            </p>
          </div>
          <div className="mt-6 flex justify-end space-x-2">
            <button
              type="button"
              className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              onClick={() => setManagerToDelete(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isDeleting}
              className="inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={handleRemoveManager}
            >
              {isDeleting ? 'Removing...' : 'Remove'}
            </button>
          </div>
        </Modal>
      )}
    </>
  )
}
