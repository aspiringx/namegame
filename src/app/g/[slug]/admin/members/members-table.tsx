'use client'

import { useState } from 'react'
import type { GroupUser, GroupUserRole, User } from '@/generated/prisma'
import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import RemoveMemberButton from './remove-member-button'
import { LoginCodeModal } from '@/components/LoginCodeModal'
import { KeyRound, Pencil } from 'lucide-react'

type GroupUserWithRelations = GroupUser & {
  user: User & { photoUrl: string }
  role: GroupUserRole
}

export default function MembersTable({
  groupUsers,
}: {
  groupUsers: GroupUserWithRelations[]
}) {
  const params = useParams()
  const slug = params.slug as string

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [selectedUserForLogin, setSelectedUserForLogin] = useState<User | null>(
    null,
  )

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
                            Role: {groupUser.role.code}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-3 py-4 text-sm text-gray-500 sm:table-cell sm:w-1/4">
                      <span className="font-semibold sm:hidden">Role: </span>
                      {groupUser.role.code}
                    </td>
                    <td className="w-1/6 py-2 text-right text-sm font-medium sm:relative sm:table-cell sm:w-auto sm:py-4 sm:pr-0">
                      <div className="flex flex-col items-center space-y-4 sm:flex-row sm:space-y-0 sm:space-x-2">
                        <Link
                          href={`/g/${slug}/admin/members/${groupUser.userId}/edit`}
                          className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200"
                        >
                          <Pencil className="h-5 w-5" />
                        </Link>
                        <button
                          onClick={() => handleLoginLinkClick(groupUser.user)}
                          className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200"
                        >
                          <KeyRound className="h-5 w-5" />
                        </button>
                        <RemoveMemberButton
                          userId={groupUser.userId}
                          groupId={groupUser.groupId}
                        />
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
