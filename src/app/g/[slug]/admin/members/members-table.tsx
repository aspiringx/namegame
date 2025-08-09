'use client'

import type { GroupUser, GroupUserRole, User } from '@/generated/prisma'
import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import RemoveMemberButton from './remove-member-button'

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

  return (
    <div>
      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <table className="min-w-full table-fixed divide-y divide-gray-300 dark:divide-gray-700">
              <thead>
                <tr>
                  <th
                    scope="col"
                    className="w-1/2 px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"
                  >
                    Name
                  </th>
                  <th
                    scope="col"
                    className="w-1/4 px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"
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
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {groupUsers.map((groupUser) => (
                  <tr key={groupUser.userId}>
                    <td className="py-4 pr-3 pl-4 text-sm break-all sm:pl-0">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          <Image
                            className="h-10 w-10 rounded-full"
                            src={groupUser.user.photoUrl}
                            alt=""
                            width={40}
                            height={40}
                          />
                        </div>
                        <div className="ml-4">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {[groupUser.user.firstName, groupUser.user.lastName]
                              .filter(Boolean)
                              .join(' ')}
                          </div>
                          <div className="text-gray-500 dark:text-gray-400">
                            {groupUser.user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-500">
                      {groupUser.role.code}
                    </td>
                    <td className="relative py-4 pr-4 pl-3 text-right text-sm font-medium sm:pr-0">
                      <Link
                        href={`/g/${slug}/admin/members/${groupUser.userId}/edit`}
                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200"
                      >
                        Edit
                      </Link>
                      <span className="mx-2 text-gray-300 dark:text-gray-600">
                        |
                      </span>
                      <RemoveMemberButton
                        userId={groupUser.userId}
                        groupId={groupUser.groupId}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
