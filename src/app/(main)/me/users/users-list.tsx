'use client'

import React, { useState, useTransition } from 'react'
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
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { User, Photo, ManagedStatus } from '@/generated/prisma/client'
import { deleteManagedUser } from './actions'

type ManagedUserWithPhoto = User & {
  photos: Photo[]
  managedStatus: ManagedStatus
}

interface UsersListProps {
  managedUsers: ManagedUserWithPhoto[]
  successMessage?: string
}

export default function UsersList({
  managedUsers,
  successMessage,
}: UsersListProps) {
  const [showInfo, setShowInfo] = useState(false)
  const [showSuccess, setShowSuccess] = useState(!!successMessage)
  const [userToDelete, setUserToDelete] = useState<ManagedUserWithPhoto | null>(
    null,
  )
  const [isPending, startTransition] = useTransition()

  return (
    <div>
      <div className="mb-6 flex flex-col items-end gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="w-full flex-grow text-sm font-medium text-gray-700 dark:text-gray-300">
          Create managed users to include those who can't participate for
          themselves.
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="-my-2 ml-2 inline-flex items-center rounded-full p-2 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
          >
            <Info className="h-6 w-6 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" />
          </button>
        </p>
        <Button asChild className="flex-shrink-0">
          <Link href="/me/users/create">Create</Link>
        </Button>
      </div>
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

      {managedUsers.length > 0 && (
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
                      src={user.photos[0]?.url || '/default-avatar.png'}
                      alt=""
                      width={48}
                      height={48}
                    />
                    <div className="min-w-0">
                      <p className="text-sm leading-6 font-semibold text-gray-900 dark:text-white">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="mt-1 truncate text-xs leading-5 text-gray-500 dark:text-gray-400">
                        {user.managedStatus === 'partial'
                          ? user.email
                          : 'Fully managed'}
                      </p>
                    </div>
                    <div className="ml-auto">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem asChild>
                            <Link href={`/me/users/${user.id}/edit`}>
                              <Edit className="mr-2 h-4 w-4" />
                              <span>Edit</span>
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setUserToDelete(user)}
                            className="text-red-600 dark:text-red-400"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Delete</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {showInfo && (
        <div
          id="managed-user-info"
          className="mb-6 rounded-md border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800"
        >
          <p className="mb-4 text-sm font-medium text-gray-700 dark:text-gray-300">
            Perfect for including minor children, deceased relatives (in a
            family group), people with disabilities, or people without internet
            access.
          </p>
          <p className="mb-4 text-sm font-medium text-gray-700 dark:text-gray-300">
            Managed users:
            <ul className="mt-4 list-inside list-disc space-y-2">
              <li>Don't require separate logins or emails</li>
              <li>
                Multiple people can manage the same users (two parents of a
                child, adult children of a deceased parent, etc.)
              </li>
              <li>
                Parents can give control of the account to children, either
                partially or fully
              </li>
              <li>
                Birth dates are required to determine age. Birth locations,
                death dates, and death locations are optional, but nice in
                family groups.
              </li>
            </ul>
          </p>
          <button
            type="button"
            onClick={() => setShowInfo(false)}
            className="mx-auto flex items-center pt-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <ChevronUp className="mr-1 h-4 w-4" />
            Close
          </button>
        </div>
      )}
      <AlertDialog
        open={!!userToDelete}
        onOpenChange={() => setUserToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want to delete this user?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              user and remove them from all associated groups.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (userToDelete) {
                  startTransition(async () => {
                    await deleteManagedUser(userToDelete.id)
                    setUserToDelete(null)
                  })
                }
              }}
              disabled={isPending}
              className="bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
            >
              {isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
