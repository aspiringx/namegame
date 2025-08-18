import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { GroupListItem } from './_components/group-list-item'

export default async function MyGroupsPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/me/groups')
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      groupMemberships: {
        orderBy: {
          group: {
            name: 'asc',
          },
        },
        include: {
          group: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      },
    },
  })

  if (!user) {
    redirect('/')
  }

  return (
    <div>
      <h3 className="mb-6">My Groups</h3>
      <p className="mb-6 text-sm font-medium text-gray-700 dark:text-gray-300">
        Visit or leave groups.
      </p>
      {user.groupMemberships.length > 0 ? (
        <div className="overflow-hidden bg-white shadow sm:rounded-md dark:bg-gray-800">
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {user.groupMemberships.map((membership) => (
              <li key={membership.groupId}>
                <GroupListItem group={membership.group} />
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-gray-500 dark:text-gray-400">
          You are not a member of any groups yet.
        </p>
      )}
    </div>
  )
}
