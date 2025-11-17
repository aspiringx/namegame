'use client'

import { useState } from 'react'
import type { Group, User } from '@namegame/db'
import { Badge } from '@/components/ui/badge'
import { ChevronDown, X } from 'lucide-react'
import { addUserToGroup, removeUserFromGroup } from '../users/groups/actions'
import RemoveFromGroupModal from '@/app/(main)/me/_components/remove-from-group-modal'

interface GroupsSectionProps {
  managedUser: User & { groupMemberships: { group: Group }[] }
  authdUserGroups: (Group & { members: { userId: string }[] })[]
}

export default function GroupsSection({
  managedUser,
  authdUserGroups,
}: GroupsSectionProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [groupToRemove, setGroupToRemove] = useState<Group | null>(null)

  const managedUserGroupIds = new Set(
    managedUser.groupMemberships.map((g) => g.group.id),
  )

  const handleAdd = async (groupId: number) => {
    await addUserToGroup(managedUser.id, groupId)
  }

  const handleRemove = (group: Group) => {
    setGroupToRemove(group)
    setIsModalOpen(true)
  }

  const confirmRemove = async () => {
    if (groupToRemove) {
      await removeUserFromGroup(managedUser.id, groupToRemove.id)
      setIsModalOpen(false)
      setGroupToRemove(null)
    }
  }

  return (
    <div className="border-t border-gray-200 py-6 border-gray-700">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between text-left text-lg font-medium text-gray-100"
      >
        <div className="flex items-center gap-x-2">
          <span>Groups</span>
          <Badge variant="secondary">
            {managedUser.groupMemberships.length}
          </Badge>
        </div>
        <ChevronDown
          className={`h-5 w-5 transform transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      {isOpen && (
        <div className="mt-4 space-y-2">
          {authdUserGroups.map((group) => (
            <div
              key={group.id}
              className="flex items-center justify-between rounded-md bg-gray-50 p-3 bg-gray-800"
            >
              <span className="font-medium text-gray-200">{group.name}</span>
              {managedUserGroupIds.has(group.id) ? (
                <button
                  type="button"
                  onClick={() => handleRemove(group)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="h-5 w-5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleAdd(group.id)}
                  className="rounded-md bg-indigo-600 px-3 py-1 text-sm text-white hover:bg-indigo-700"
                >
                  Add
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      {groupToRemove && (
        <RemoveFromGroupModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onConfirm={confirmRemove}
          groupName={groupToRemove.name}
          userName={`${managedUser.firstName} ${managedUser.lastName}`}
        />
      )}
    </div>
  )
}
