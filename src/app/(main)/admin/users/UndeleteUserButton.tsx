'use client'

import { useTransition } from 'react'
import { undeleteUser } from './actions'

export function UndeleteUserButton({ userId }: { userId: string }) {
  const [isPending, startTransition] = useTransition()

  const handleClick = () => {
    startTransition(async () => {
      const result = await undeleteUser(userId)
      if (result?.message) {
        alert(result.message)
      }
    })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="font-medium text-green-600 hover:text-green-900 disabled:text-gray-400"
    >
      {isPending ? 'Restoring...' : 'Undelete'}
    </button>
  )
}
