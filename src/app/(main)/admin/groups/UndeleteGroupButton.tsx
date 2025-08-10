'use client'

import { useTransition } from 'react'
import { undeleteGroup } from './actions'

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
      className="font-medium text-green-600 hover:text-green-900 disabled:text-gray-400"
    >
      {isPending ? 'Undeleting...' : 'Undelete'}
    </button>
  )
}
