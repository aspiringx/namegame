'use client';

import { removeMember } from './actions';
import { useState, useTransition } from 'react';
import { useParams } from 'next/navigation';

export default function RemoveMemberButton({ userId, groupId }: { userId: string, groupId: number }) {
  const [isPending, startTransition] = useTransition();
  const [showModal, setShowModal] = useState(false);
  const params = useParams();
  const slug = params.slug as string;

  const handleRemove = () => {
    startTransition(async () => {
      try {
        await removeMember({ userId, groupId }, slug);
        // In a real app, you'd use a toast notification for success
      } catch (error) {
        // In a real app, you'd use a toast notification for error
        alert(error instanceof Error ? error.message : 'An unknown error occurred');
      }
      setShowModal(false);
    });
  };

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
        <div className="fixed inset-0 bg-black/25 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md dark:bg-gray-800">
            <h3 className="text-lg font-bold mb-4 dark:text-white">Remove Member</h3>
            <p className="mb-6 text-wrap text-left dark:text-gray-300">Are you sure you want to remove this member from the group? This action cannot be undone.</p>
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                disabled={isPending}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRemove}
                disabled={isPending}
                className="px-4 py-2 rounded-md border border-transparent bg-red-600 text-white hover:bg-red-700 disabled:bg-red-400"
              >
                {isPending ? 'Removing...' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
