'use client'

import { useTransition } from 'react'
import { undeleteGroup } from './actions'
import { RotateCcw } from 'lucide-react'

export function UndeleteGroupButton({ groupId }: { groupId: number }) {
  const [isPending, startTransition] = useTransition()

  const handleClick = () => {
    startTransition(async () => {
      const result = await undeleteGroup(groupId)
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
      className="inline-flex items-center font-medium text-green-600 hover:text-green-900 disabled:text-gray-400 text-green-500 hover:text-green-400"
      title={isPending ? 'Undeleting...' : 'Undelete group'}
    >
      <RotateCcw className="h-4 w-4" />
    </button>
  )
}
