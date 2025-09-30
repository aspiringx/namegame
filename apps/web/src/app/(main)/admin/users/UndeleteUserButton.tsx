'use client'

import { useTransition } from 'react'
import { undeleteUser } from './actions'
import { RotateCcw } from 'lucide-react'

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
      className="inline-flex items-center font-medium text-green-600 hover:text-green-900 disabled:text-gray-400 dark:text-green-500 dark:hover:text-green-400"
      title={isPending ? 'Restoring...' : 'Undelete user'}
    >
      <RotateCcw className="h-4 w-4" />
    </button>
  )
}
