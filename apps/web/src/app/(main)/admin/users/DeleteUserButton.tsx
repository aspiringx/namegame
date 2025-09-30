'use client'

import { softDeleteUser, hardDeleteUser } from './actions'
import { useState, useTransition } from 'react'
import { Trash2 } from 'lucide-react'

export function DeleteUserButton({ userId }: { userId: string }) {
  const [isPending, startTransition] = useTransition()
  const [showModal, setShowModal] = useState(false)

  const handleSoftDelete = () => {
    startTransition(async () => {
      const result = await softDeleteUser(userId)
      alert(result.message) // In a real app, you'd use a toast notification
      setShowModal(false)
    })
  }

  const handleHardDelete = () => {
    startTransition(async () => {
      const result = await hardDeleteUser(userId)
      alert(result.message)
      setShowModal(false)
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        disabled={isPending}
        className="inline-flex items-center font-medium text-red-600 hover:text-red-900 disabled:text-gray-400 dark:text-red-500 dark:hover:text-red-400 dark:disabled:text-gray-500"
        title="Delete user"
      >
        <Trash2 className="h-4 w-4" />
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
            <h3 className="mb-4 text-lg font-bold dark:text-white">
              Delete User
            </h3>
            <p className="mb-6 text-left text-wrap dark:text-gray-300">
              Are you sure? Soft-deleting will disable the user while
              hard-deleting will permanently remove it, but may fail if other
              relationships depend on it.
            </p>
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                disabled={isPending}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSoftDelete}
                disabled={isPending}
                className="rounded-md border border-transparent bg-yellow-500 px-4 py-2 text-white hover:bg-yellow-600 disabled:bg-yellow-300"
              >
                {isPending ? 'Deleting...' : 'Soft Delete'}
              </button>
              <button
                type="button"
                onClick={handleHardDelete}
                disabled={isPending}
                className="rounded-md border border-transparent bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:bg-red-400"
              >
                {isPending ? 'Deleting...' : 'Hard Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
