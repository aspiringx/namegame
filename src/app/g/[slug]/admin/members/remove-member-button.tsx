'use client'

import { removeMember } from './actions'
import { useState, useTransition } from 'react'
import { useParams } from 'next/navigation'

export default function RemoveMemberButton({
  userId,
  groupId,
}: {
  userId: string
  groupId: number
}) {
  const [isPending, startTransition] = useTransition()
  const [showModal, setShowModal] = useState(false)
  const params = useParams()
  const slug = params.slug as string

  const handleRemove = () => {
    startTransition(async () => {
      try {
        await removeMember({ userId, groupId }, slug)
        // In a real app, you'd use a toast notification for success
      } catch (error) {
        // In a real app, you'd use a toast notification for error
        alert(
          error instanceof Error ? error.message : 'An unknown error occurred',
        )
      }
      setShowModal(false)
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        disabled={isPending}
        className="font-medium text-red-600 hover:text-red-900 disabled:text-gray-400 dark:text-red-500 dark:hover:text-red-400 dark:disabled:text-gray-500"
      >
        Remove
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
            <h3 className="mb-4 text-lg font-bold dark:text-white">
              Remove Member
            </h3>
            <p className="mb-6 text-left text-wrap dark:text-gray-300">
              Are you sure you want to remove this member from the group? This
              action cannot be undone.
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
                onClick={handleRemove}
                disabled={isPending}
                className="rounded-md border border-transparent bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:bg-red-400"
              >
                {isPending ? 'Removing...' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
