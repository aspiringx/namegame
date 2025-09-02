'use client'

import React, { useState, useTransition, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Info,
  ChevronUp,
  CheckCircle,
  X,
  MoreVertical,
  Edit,
  Trash2,
  AlertTriangle,
} from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import type { User, Photo, ManagedStatus } from '@/generated/prisma/client'
import { deleteManagedUser } from './actions'
import { allowUserToManageMe, revokeManagementPermission } from '@/lib/actions'
import { Combobox } from '@/components/ui/combobox'
import Modal from '@/components/ui/modal'

export type ManagedUserWithPhoto = User & {
  photos: Photo[]
  managedStatus: ManagedStatus
}

const getManagedStatusText = (status: ManagedStatus | null) => {
  switch (status) {
    case 'full':
      return 'Fully managed'
    case 'partial':
      return 'Partially managed'
    default:
      return 'Backup manager'
  }
}

export type UsersListProps = {
  managedUsers: ManagedUserWithPhoto[]
  usersManagingMe: (User & { photos: Photo[] })[]
  potentialManagers: User[]
  successMessage?: string | null
}

export default function UsersList({
  managedUsers,
  usersManagingMe,
  potentialManagers,
  successMessage,
}: UsersListProps) {
  const [showInfo, setShowInfo] = useState(false)
  const [hasAgreed, setHasAgreed] = useState(false)
  const [showSuccess, setShowSuccess] = useState(!!successMessage)
  const [isPending, startTransition] = useTransition()

  const managedUserAgreementKey = 'managedUserAgreement'

  useEffect(() => {
    const agreed = localStorage.getItem(managedUserAgreementKey) === 'true'
    setHasAgreed(agreed)
    if (!agreed) {
      setShowInfo(true) // Show info by default if they haven't agreed
    }
  }, [])

  const handleAgree = () => {
    localStorage.setItem(managedUserAgreementKey, 'true')
    setHasAgreed(true)
    setShowInfo(false)
  }

  const [selectedManagerId, setSelectedManagerId] = useState('')
  const [userToRevoke, setUserToRevoke] = useState<User | null>(null)
  const [userToDelete, setUserToDelete] = useState<ManagedUserWithPhoto | null>(
    null,
  )
  const [isTooltipOpen, setIsTooltipOpen] = useState(false)

  const handleAllow = () => {
    if (!selectedManagerId) return
    startTransition(async () => {
      const result = await allowUserToManageMe(selectedManagerId)
      if (result.success) {
        toast.success('Manager added successfully.')
        setSelectedManagerId('')
      } else {
        toast.error(result.message || 'Failed to add manager.')
      }
    })
  }

  const handleRevoke = () => {
    if (!userToRevoke) return
    startTransition(async () => {
      const result = await revokeManagementPermission(userToRevoke.id)
      if (result.success) {
        toast.success('Manager revoked successfully.')
        setUserToRevoke(null)
      } else {
        toast.error(result.message || 'Failed to revoke manager.')
      }
    })
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <h3>Managed Users</h3>
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="-my-2 ml-2 inline-flex items-center rounded-full p-2 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
          >
            <Info className="h-6 w-6 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" />
          </button>
        </div>
        <Button
          asChild
          className={`flex-shrink-0 ${!hasAgreed ? 'cursor-not-allowed opacity-50' : ''}`}
        >
          <Link
            href={hasAgreed ? '/me/users/create' : '#'}
            onClick={(e) => {
              if (!hasAgreed) {
                e.preventDefault()
                toast.info(
                  'Please agree to the terms for creating managed users first.',
                )
              }
            }}
          >
            Create
          </Link>
        </Button>
      </div>
      <h4 className="mb-4">Users I Manage</h4>
      {showSuccess && successMessage && (
        <div className="mb-4 rounded-md border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/30">
          <div className="flex">
            <div className="flex-shrink-0">
              <CheckCircle
                className="h-5 w-5 text-green-400"
                aria-hidden="true"
              />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                {successMessage}
              </p>
            </div>
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button
                  type="button"
                  onClick={() => setShowSuccess(false)}
                  className="inline-flex rounded-md bg-green-50 p-1.5 text-green-500 hover:bg-green-100 focus:ring-2 focus:ring-green-600 focus:ring-offset-2 focus:ring-offset-green-50 focus:outline-none dark:bg-transparent dark:text-green-300 dark:hover:bg-green-800/50"
                >
                  <span className="sr-only">Dismiss</span>
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showInfo && (
        <div
          id="managed-user-info"
          className="mb-6 rounded-md border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800"
        >
          <p className="mb-4 text-sm text-gray-700 dark:text-gray-300">
            Create and manage users who can't or shouldn't yet have their own
            accounts.
          </p>
          <p className="mb-4 text-sm text-gray-700 dark:text-gray-300">
            Examples: Minor children, deceased relatives, disabled individuals,
            people without internet access, pets, etc.
          </p>
          <p className="mb-4 text-sm text-gray-700 dark:text-gray-300">
            Multiple people can manage the same account (e.g. parents managing a
            child account, etc). After you create a user, Edit them to add
            others.
          </p>
          <p className="mb-4 text-sm text-gray-700 dark:text-gray-300">
            You can add managed users to your groups.
          </p>
          <p className="mb-4 text-sm text-red-700 italic dark:text-red-400">
            You must have permission or authority to create managed users, such
            as being a child's parent, direct descendent of a deceased person,
            permission from a living adult, etc.
          </p>
          {hasAgreed ? (
            <button
              type="button"
              onClick={() => setShowInfo(false)}
              className="mx-auto flex items-center pt-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <ChevronUp className="mr-1 h-4 w-4" />
              Close
            </button>
          ) : (
            <button
              type="button"
              onClick={handleAgree}
              className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              I Agree
            </button>
          )}
        </div>
      )}
      {managedUsers.length > 0 ? (
        <div className="mt-8 flow-root">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <ul
                role="list"
                className="divide-y divide-gray-200 dark:divide-gray-700"
              >
                {managedUsers.map((user) => (
                  <li key={user.id} className="flex items-center gap-x-6 py-5">
                    <Image
                      className="h-12 w-12 flex-none rounded-full bg-gray-50 dark:bg-gray-800"
                      src={user.photos[0]?.url || '/images/default-avatar.png'}
                      alt=""
                      width={48}
                      height={48}
                    />
                    <div className="min-w-0">
                      <p className="text-sm leading-6 font-semibold text-gray-900 dark:text-white">
                        {[user.firstName, user.lastName]
                          .filter(Boolean)
                          .join(' ')}
                      </p>
                      <p className="mt-1 truncate text-xs leading-5 text-gray-500 dark:text-gray-400">
                        {getManagedStatusText(user.managedStatus)}
                      </p>
                    </div>
                    <div className="ml-auto flex items-center gap-x-4">
                      <Button asChild variant="ghost" size="icon">
                        <Link href={`/me/users/${user.id}/edit`}>
                          <Edit className="h-5 w-5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" />
                          <span className="sr-only">Edit</span>
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setUserToDelete(user)}
                        className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-500"
                      >
                        <Trash2 className="h-5 w-5" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No managed users.
          </p>
        </div>
      )}

      <div className="mt-6 mb-4 flex flex-col">
        <h4 className="">Users Who Can Manage Me</h4>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Allow a trusted person to manage your account in case you become
          unable/unavailable.
        </p>
      </div>
      <div className="mt-4 rounded-lg border p-4">
        <div className="flex items-center gap-2">
          <div className="w-64">
            <Combobox
              options={potentialManagers.map((user) => ({
                value: user.id,
                label: [user.firstName, user.lastName]
                  .filter(Boolean)
                  .join(' '),
              }))}
              selectedValue={selectedManagerId}
              onSelectValue={setSelectedManagerId}
              placeholder="Select a user..."
            />
          </div>
          <Button
            onClick={handleAllow}
            disabled={!selectedManagerId || isPending}
          >
            {isPending ? 'Allowing...' : 'Allow'}
          </Button>
        </div>

        <h5 className="mt-6 mb-2 font-semibold">Current Managers</h5>
        {usersManagingMe.length > 0 ? (
          <ul className="space-y-2">
            {usersManagingMe.map((user) => (
              <li
                key={user.id}
                className="flex items-center justify-between rounded-md border p-2"
              >
                <span>
                  {[user.firstName, user.lastName].filter(Boolean).join(' ')}
                </span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setUserToRevoke(user)}
                >
                  Revoke
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No users are currently managing you.
          </p>
        )}
      </div>

      {userToRevoke && (
        <Modal isOpen={!!userToRevoke} onClose={() => setUserToRevoke(null)}>
          <div className="p-6">
            <h3 className="mb-4 text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">
              Confirm Revoke
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Are you sure you want to revoke management permissions for{' '}
              <strong>
                {[userToRevoke.firstName, userToRevoke.lastName]
                  .filter(Boolean)
                  .join(' ')}
              </strong>
              ?
            </p>
            <div className="mt-6 flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setUserToRevoke(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleRevoke}
                disabled={isPending}
              >
                {isPending ? 'Revoking...' : 'Revoke'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {userToDelete && (
        <AlertDialog
          open={!!userToDelete}
          onOpenChange={(open) => {
            if (!open) {
              setUserToDelete(null)
            }
          }}
        >
          <AlertDialogContent className="p-6">
            <AlertDialogHeader>
              <AlertDialogTitle>
                Are you sure you want to delete this user?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                user{' '}
                <strong>
                  {[userToDelete.firstName, userToDelete.lastName]
                    .filter(Boolean)
                    .join(' ')}
                </strong>{' '}
                and remove them from all associated groups.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  startTransition(async () => {
                    await deleteManagedUser(userToDelete.id)
                    setUserToDelete(null)
                  })
                }}
                disabled={isPending}
                className="bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
              >
                {isPending ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  )
}
