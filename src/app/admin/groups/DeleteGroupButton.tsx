'use client';

import { softDeleteGroup, hardDeleteGroup } from './actions';
import { useState, useTransition } from 'react';

export function DeleteGroupButton({ groupId }: { groupId: number }) {
  const [isPending, startTransition] = useTransition();
  const [showModal, setShowModal] = useState(false);

  const handleSoftDelete = () => {
    startTransition(async () => {
      const result = await softDeleteGroup(groupId);
      alert(result.message); // In a real app, you'd use a toast notification
      setShowModal(false);
    });
  };

  const handleHardDelete = () => {
    startTransition(async () => {
      const result = await hardDeleteGroup(groupId);
      alert(result.message);
      setShowModal(false);
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        disabled={isPending}
        className="font-medium text-red-600 hover:text-red-900 disabled:text-gray-400"
      >
        Delete
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/25 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Delete Group</h3>
            <p className="mb-6 text-wrap text-left">Are you sure? Soft-deleting will disable the group while hard-deleting will permanently remove it, but may fail if other relationships depend on it.</p>
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                disabled={isPending}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSoftDelete}
                disabled={isPending}
                className="px-4 py-2 rounded-md border border-transparent bg-yellow-500 text-white hover:bg-yellow-600 disabled:bg-yellow-300"
              >
                {isPending ? 'Deleting...' : 'Soft Delete'}
              </button>
              <button
                type="button"
                onClick={handleHardDelete}
                disabled={isPending}
                className="px-4 py-2 rounded-md border border-transparent bg-red-600 text-white hover:bg-red-700 disabled:bg-red-400"
              >
                {isPending ? 'Deleting...' : 'Hard Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
