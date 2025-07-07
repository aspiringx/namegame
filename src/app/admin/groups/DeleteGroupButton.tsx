'use client';

import { deleteGroup } from './actions';
import { useState, useTransition } from 'react';

export function DeleteGroupButton({ groupId }: { groupId: number }) {
  const [isPending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleConfirm = () => {
    startTransition(async () => {
      const result = await deleteGroup(groupId);
      if (result.success) {
        alert(result.message);
      } else {
        alert(result.message);
      }
      setShowConfirm(false);
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        disabled={isPending}
        className="font-medium text-red-600 hover:text-red-900 disabled:text-gray-400"
      >
        Delete
      </button>

      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl">
            <h3 className="text-lg font-bold mb-4">Confirm Deletion</h3>
            <p className="mb-4">Are you sure you want to delete this group? This action cannot be undone.</p>
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 rounded-md border border-gray-300"
                disabled={isPending}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isPending}
                className="px-4 py-2 rounded-md border border-transparent bg-red-600 text-white hover:bg-red-700 disabled:bg-red-400"
              >
                {isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
