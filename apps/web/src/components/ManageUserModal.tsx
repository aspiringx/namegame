'use client'

import { useState, useEffect, useTransition } from 'react'
import Modal from './ui/modal'
import { useSession } from 'next-auth/react'
import {
  getManagers,
  addManager,
  removeManager,
  getRelatedUsers,
  getGroupsForCurrentUser,
  getGroupMembers,
} from '@/app/(main)/me/users/actions'
import { createUserUserRelation } from '@/lib/actions'
import type { User, Group, GroupType } from '@namegame/db'
import { toast } from 'sonner'
import { Combobox } from './ui/combobox'
import Image from 'next/image'

interface ManageUserModalProps {
  isOpen: boolean
  onClose: () => void
  managedUser: User & { managers?: any[] }
}

export default function ManageUserModal({
  isOpen,
  onClose,
  managedUser,
}: ManageUserModalProps) {
  const { data: session } = useSession()
  const [managers, setManagers] = useState<any[]>([])
  const [isCurrentUserMananger, setIsCurrentUserManager] = useState(false)
  const [selectedMemberId, setSelectedMemberId] = useState('')
  const [relatedUsers, setRelatedUsers] = useState<User[]>([])
  const [isPending, startTransition] = useTransition()
  const [isDeleting, startDeletingTransition] = useTransition()
  const [managerToDelete, setManagerToDelete] = useState<any | null>(null)
  const [groups, setGroups] = useState<(Group & { groupType: GroupType })[]>([])
  const [managerSource, setManagerSource] = useState('direct') // 'direct' or a group ID
  const [potentialManagers, setPotentialManagers] = useState<User[]>([])

  useEffect(() => {
    if (isOpen && session?.user?.id) {
      setManagerSource('direct')
      const authenticatedUserId = session.user.id
      startTransition(async () => {
        const [fetchedManagers, fetchedRelatedUsers, fetchedGroups] =
          await Promise.all([
            getManagers(managedUser.id),
            getRelatedUsers(authenticatedUserId),
            getGroupsForCurrentUser(),
          ])
        setManagers(fetchedManagers)
        setRelatedUsers(fetchedRelatedUsers)
        setGroups(fetchedGroups)
        setIsCurrentUserManager(
          fetchedManagers.some((m) => m.id === authenticatedUserId),
        )
      })
    }
  }, [isOpen, managedUser.id, session?.user?.id])

  useEffect(() => {
    if (managerSource === 'direct') {
      setPotentialManagers(relatedUsers)
    } else {
      startTransition(async () => {
        const members = await getGroupMembers(parseInt(managerSource, 10))
        setPotentialManagers(members)
      })
    }
    setSelectedMemberId('') // Reset selection when source changes
  }, [managerSource, relatedUsers])

  const sourceOptions = [
    { value: 'direct', label: 'My direct relationships' },
    ...groups.map((group) => ({
      value: group.id.toString(),
      label: group.name,
    })),
  ]

  const handleAddManager = async () => {
    if (!selectedMemberId || !session?.user?.id) return

    startTransition(async () => {
      try {
        // If manager is from a group, create a user-user relationship first
        if (managerSource !== 'direct') {
          const group = groups.find((g) => g.id.toString() === managerSource)
          if (group) {
            const relationTypeCode =
              group.groupType.code === 'family' ? 'family' : 'friend'
            await createUserUserRelation(
              managedUser.id,
              selectedMemberId,
              relationTypeCode,
            )
          }
        }

        // Add the manager role
        await addManager(managedUser.id, selectedMemberId)

        // Refresh state
        const updatedManagers = await getManagers(managedUser.id)
        setManagers(updatedManagers)

        if (session?.user?.id) {
          const updatedRelatedUsers = await getRelatedUsers(session.user.id)
          setRelatedUsers(updatedRelatedUsers)
        }

        toast.success('Manager added successfully.')
        setSelectedMemberId('')
      } catch (error) {
        toast.error('Failed to add manager.')
        console.error(error)
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
      } catch {
        toast.error('Failed to remove manager.')
      }
    })
  }

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose}>
        <div className="p-6">
          <h3 className="mb-4 text-lg leading-6 font-medium text-gray-100">
            {`Manage ${managedUser.firstName}`}
          </h3>
          {isCurrentUserMananger && (
            <div className="space-y-4 border-b border-gray-200 py-4 border-gray-700">
              <h3 className="text-md font-medium text-gray-100">Add Manager</h3>
              <div className="flex flex-col space-y-4">
                <div>
                  <label
                    htmlFor="managerSource"
                    className="block text-sm font-medium text-gray-300"
                  >
                    Select Source
                  </label>
                  <Combobox
                    name="managerSource"
                    options={sourceOptions}
                    selectedValue={managerSource}
                    onSelectValue={setManagerSource}
                    placeholder="Select a source"
                  />
                </div>
                <div>
                  <label
                    htmlFor="managerId"
                    className="block text-sm font-medium text-gray-300"
                  >
                    Choose Manager
                  </label>
                  <div className="flex items-end space-x-2">
                    <div className="flex-grow">
                      <Combobox
                        name="managerId"
                        options={potentialManagers
                          .filter(
                            (user) =>
                              !managers.some((m) => m.id === user.id) &&
                              user.id !== managedUser.id &&
                              user.id !== session?.user?.id,
                          )
                          .map((user) => ({
                            value: user.id,
                            label: [user.firstName, user.lastName]
                              .filter(Boolean)
                              .join(' '),
                          }))}
                        selectedValue={selectedMemberId}
                        onSelectValue={setSelectedMemberId}
                        placeholder="Choose another manager"
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
              </div>
            </div>
          )}

          <div className="mt-6">
            <h4 className="text-md font-medium text-gray-100">
              Managing Users
            </h4>
            {managers.length > 0 ? (
              <ul className="mt-2 divide-y divide-gray-200 divide-gray-700">
                {managers.map((manager) => (
                  <li
                    key={manager.id}
                    className="flex items-center justify-between py-2"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative h-8 w-8 flex-shrink-0">
                        <Image
                          src={manager.photoUrl || '/images/default-avatar.png'}
                          alt={manager.firstName || 'User avatar'}
                          fill
                          className="rounded-full object-cover"
                        />
                      </div>
                      <span>
                        {[manager.firstName, manager.lastName]
                          .filter(Boolean)
                          .join(' ')}
                      </span>
                    </div>
                    {isCurrentUserMananger &&
                      session?.user?.id !== manager.id && (
                        <button
                          type="button"
                          onClick={() => setManagerToDelete(manager)}
                          className="text-red-500 hover:text-red-400"
                          aria-label={`Remove ${manager.firstName} as a manager`}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-gray-400">
                No managers assigned.
              </p>
            )}
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              className="inline-flex justify-center rounded-md border border-transparent bg-blue-800 px-4 py-2 text-sm font-medium text-blue-100 hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
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
        >
          <div className="p-6">
            <h3 className="mb-4 text-lg leading-6 font-medium text-gray-100">
              Confirm Removal
            </h3>
            <p className="text-sm text-gray-400">
              Are you sure you want to remove{' '}
              <strong>
                {[managerToDelete.firstName, managerToDelete.lastName]
                  .filter(Boolean)
                  .join(' ')}
              </strong>{' '}
              as a manager?
            </p>
            <div className="mt-6 flex justify-end space-x-2">
              <button
                type="button"
                className="inline-flex justify-center rounded-md border border-gray-600 bg-gray-700 px-4 py-2 text-sm font-medium text-gray-200 shadow-sm hover:bg-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
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
          </div>
        </Modal>
      )}
    </>
  )
}
