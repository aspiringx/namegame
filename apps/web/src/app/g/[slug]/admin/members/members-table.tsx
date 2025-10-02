'use client'

import { useState, useTransition } from 'react'
import type { GroupUser, GroupUserRole, User } from '@namegame/db'
import Image from 'next/image'
import { useParams } from 'next/navigation'
import { updateMemberRole } from './actions'
import RemoveMemberButton from './remove-member-button'
import { LoginCodeModal } from '@/components/LoginCodeModal'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { KeyRound, Pencil, Check, X } from 'lucide-react'

type GroupUserWithRelations = GroupUser & {
  user: User & { photoUrl: string }
  role: GroupUserRole
}

export default function MembersTable({
  groupUsers,
  allRoles,
}: {
  groupUsers: GroupUserWithRelations[]
  allRoles: GroupUserRole[]
}) {
  const params = useParams()
  const slug = params.slug as string

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [selectedUserForLogin, setSelectedUserForLogin] = useState<User | null>(
    null,
  )
  const [isUpdating, startUpdateTransition] = useTransition()
  const [editingMemberUserId, setEditingMemberUserId] = useState<string | null>(
    null,
  )
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null)

  const handleLoginLinkClick = (user: User) => {
    setSelectedUserForLogin(user)
    setIsLoginModalOpen(true)
  }

  return (
    <div>
      <div className="mt-8 flow-root">
        <div className="-my-2">
          <div className="inline-block min-w-full py-2 align-middle">
            <table className="min-w-full table-fixed divide-y divide-gray-300 sm:table dark:divide-gray-700">
              <thead className="hidden sm:table-header-group">
                <tr>
                  <th
                    scope="col"
                    className="w-1/2 px-2 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"
                  >
                    Name
                  </th>
                  <th
                    scope="col"
                    className="w-1/4 px-2 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"
                  >
                    Roles
                  </th>
                  <th
                    scope="col"
                    className="relative w-1/4 py-3.5 pr-4 pl-3 sm:pr-0"
                  >
                    <span className="sr-only">Edit</span>
                  </th>
                </tr>
              </thead>
              <tbody className="block divide-y divide-gray-200 sm:table-row-group dark:divide-gray-800">
                {groupUsers.map((groupUser) => (
                  <tr
                    key={groupUser.userId}
                    className="flex flex-wrap items-start justify-between border-b border-gray-200 p-2 sm:table-row sm:p-0 dark:border-gray-800"
                  >
                    <td className="w-5/6 py-2 pr-2 sm:table-cell sm:w-auto sm:py-4 sm:pr-3 sm:pl-0">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          <Image
                            className="h-10 w-10 rounded-full"
                            src={groupUser.user.photoUrl}
                            alt={`${[
                              groupUser.user.firstName,
                              groupUser.user.lastName,
                            ]
                              .filter(Boolean)
                              .join(' ')}'s photo`}
                            width={40}
                            height={40}
                          />
                        </div>
                        <div className="ml-4 flex-1">
                          <div className="font-medium break-all text-gray-900 sm:max-w-[25ch] sm:truncate dark:text-white">
                            {[groupUser.user.firstName, groupUser.user.lastName]
                              .filter(Boolean)
                              .join(' ')}
                          </div>
                          <div className="break-all text-gray-500 sm:max-w-[25ch] sm:truncate dark:text-gray-400">
                            {groupUser.user.email}
                          </div>
                          <div className="text-sm text-gray-500 sm:hidden dark:text-gray-400">
                            {groupUser.role.code}
                          </div>
                          {editingMemberUserId === groupUser.userId && (
                            <div className="mt-3 sm:hidden">
                              <div className="flex items-center gap-3">
                                <Select
                                  onValueChange={setEditingRoleId}
                                  defaultValue={groupUser.roleId.toString()}
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Role" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {allRoles
                                      .filter((role) => role.code !== 'super')
                                      .map((role) => (
                                        <SelectItem
                                          key={role.id}
                                          value={role.id.toString()}
                                        >
                                          {role.code}
                                        </SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>
                                <form
                                  action={(formData) => {
                                    startUpdateTransition(async () => {
                                      await updateMemberRole(formData)
                                      setEditingMemberUserId(null)
                                    })
                                  }}
                                  className="contents"
                                >
                                  <input
                                    type="hidden"
                                    name="groupId"
                                    value={groupUser.groupId}
                                  />
                                  <input
                                    type="hidden"
                                    name="userId"
                                    value={groupUser.userId}
                                  />
                                  <input
                                    type="hidden"
                                    name="roleId"
                                    value={editingRoleId ?? groupUser.roleId}
                                  />
                                  <input
                                    type="hidden"
                                    name="groupSlug"
                                    value={slug}
                                  />
                                  <button
                                    type="submit"
                                    disabled={isUpdating}
                                    className="p-2 text-indigo-600 hover:text-indigo-900 disabled:opacity-50 dark:text-indigo-400 dark:hover:text-indigo-200"
                                  >
                                    <Check className="h-6 w-6" />
                                  </button>
                                </form>
                                <button
                                  type="button"
                                  onClick={() => setEditingMemberUserId(null)}
                                  className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                                >
                                  <X className="h-6 w-6" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-3 py-4 align-middle text-sm text-gray-500 sm:table-cell sm:w-1/4">
                      {editingMemberUserId === groupUser.userId ? (
                        <div className="flex items-center gap-3 dark:text-white">
                          <Select
                            onValueChange={setEditingRoleId}
                            defaultValue={groupUser.roleId.toString()}
                          >
                            <SelectTrigger className="w-full sm:w-auto">
                              <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                            <SelectContent>
                              {allRoles
                                .filter((role) => role.code !== 'super')
                                .map((role) => (
                                  <SelectItem
                                    key={role.id}
                                    value={role.id.toString()}
                                  >
                                    {role.code}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          <form
                            action={(formData) => {
                              startUpdateTransition(async () => {
                                await updateMemberRole(formData)
                                setEditingMemberUserId(null)
                              })
                            }}
                            className="contents"
                          >
                            <input
                              type="hidden"
                              name="groupId"
                              value={groupUser.groupId}
                            />
                            <input
                              type="hidden"
                              name="userId"
                              value={groupUser.userId}
                            />
                            <input
                              type="hidden"
                              name="roleId"
                              value={editingRoleId ?? groupUser.roleId}
                            />
                            <input
                              type="hidden"
                              name="groupSlug"
                              value={slug}
                            />
                            <button
                              type="submit"
                              disabled={isUpdating}
                              className="p-2 text-indigo-600 hover:text-indigo-900 disabled:opacity-50 dark:text-indigo-400 dark:hover:text-indigo-200"
                            >
                              <Check className="h-6 w-6" />
                            </button>
                          </form>
                          <button
                            type="button"
                            onClick={() => setEditingMemberUserId(null)}
                            className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                          >
                            <X className="h-6 w-6" />
                          </button>
                        </div>
                      ) : (
                        <>{groupUser.role.code}</>
                      )}
                    </td>
                    <td className="w-1/6 py-2 text-right text-sm font-medium sm:relative sm:table-cell sm:w-auto sm:py-4 sm:pr-0">
                      <div className="flex flex-col items-end gap-y-3 md:flex-row md:items-center md:justify-end md:gap-4">
                        {editingMemberUserId !== groupUser.userId && (
                          <>
                            <button
                              onClick={() => {
                                setEditingMemberUserId(groupUser.userId)
                                setEditingRoleId(groupUser.roleId.toString())
                              }}
                              className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200"
                            >
                              <Pencil className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() =>
                                handleLoginLinkClick(groupUser.user)
                              }
                              className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200"
                            >
                              <KeyRound className="h-5 w-5" />
                            </button>
                            <RemoveMemberButton
                              userId={groupUser.userId}
                              groupId={groupUser.groupId}
                              groupSlug={slug}
                            />
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {selectedUserForLogin && groupUsers.length > 0 && (
        <LoginCodeModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          user={selectedUserForLogin}
          groupId={groupUsers[0].groupId}
          groupSlug={slug}
        />
      )}
    </div>
  )
}
