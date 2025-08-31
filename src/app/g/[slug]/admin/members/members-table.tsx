'use client'

import { useState } from 'react'
import type { GroupUser, GroupUserRole, User } from '@/generated/prisma'
import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import RemoveMemberButton from './remove-member-button'
import { LoginCodeModal } from '@/components/LoginCodeModal'

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
            <table className="min-w-full table-fixed divide-y divide-gray-300 dark:divide-gray-700 sm:table">
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
              <tbody className="block divide-y divide-gray-200 dark:divide-gray-800 sm:table-row-group">
                {groupUsers.map((groupUser) => (
                  <tr
                  key={groupUser.userId}
                  className="block border-b border-gray-200 dark:border-gray-800 sm:table-row"
                >
                    <td className="block px-2 py-4 text-sm sm:table-cell sm:w-1/2 sm:pl-0">
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
                        <div className="ml-4">
                          <div className="truncate font-medium text-gray-900 dark:text-white max-w-[25ch] sm:max-w-none">
                            {[groupUser.user.firstName, groupUser.user.lastName]
                              .filter(Boolean)
                              .join(' ')}
                          </div>
                          <div className="truncate text-gray-500 dark:text-gray-400 max-w-[25ch] sm:max-w-none">
                            {groupUser.user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="block px-2 py-4 text-sm text-gray-500 sm:table-cell sm:w-1/4">
                      <span className="font-semibold sm:hidden">Role: </span>
                      {groupUser.role.code}
                    </td>
                    <td className="block px-4 py-4 text-sm font-medium sm:relative sm:table-cell sm:w-1/4 sm:px-2 sm:pr-0">
                      <div className="flex flex-col items-end space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
                      <Link
                        href={`/g/${slug}/admin/members/${groupUser.userId}/edit`}
                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200"
                      >
                        Edit
                      </Link>
                      <span className="hidden sm:inline mx-2 text-gray-300 dark:text-gray-600">
                        |
                      </span>
                      <button
                        onClick={() => handleLoginLinkClick(groupUser.user)}
                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200"
                      >
                        Login Link
                      </button>
                      <span className="hidden sm:inline mx-2 text-gray-300 dark:text-gray-600">
                        |
                      </span>
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
