'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { leaveGroup } from '@/app/(main)/me/actions'
import Modal from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface GroupListItemProps {
  group: {
    id: number
    name: string
    slug: string
  }
}

export function GroupListItem({ group }: GroupListItemProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleLeaveGroup = async () => {
    startTransition(async () => {
      const result = await leaveGroup(group.id.toString())
      if (result.success) {
        toast.success(`You have left the group "${group.name}".`)
        setIsModalOpen(false)
      } else {
        toast.error(result.error || 'An unexpected error occurred.')
      }
    })
  }

  return (
    <>
      <div className="flex items-center justify-between rounded-md p-2 hover:bg-gray-100">
        <a
          href={`/g/${group.slug}`}
          className="font-medium text-blue-600 hover:underline"
        >
          {group.name}
        </a>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setIsModalOpen(true)}
                className="rounded-full p-1 text-red-500 transition-colors hover:bg-red-100 hover:text-red-700"
                aria-label={`Leave group ${group.name}`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-x"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Leave group</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Confirm Leaving Group"
        >
          <div className="p-4">
            <p>Are you sure you want to leave the group "{group.name}"?</p>
            <div className="mt-6 flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleLeaveGroup}
                disabled={isPending}
              >
                {isPending ? 'Leaving...' : 'Leave'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}
