'use server'

import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import { getPublicUrl } from '@/lib/storage'

export async function getGroupDataForEditPage(managedUserId: string) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error('Not authenticated')
  }
  const authdUserId = session.user.id

  const managedUser = await prisma.user.findUnique({
    where: {
      id: managedUserId,
      managedBy: {
        some: {
          managerId: authdUserId,
        },
      },
    },
    include: {
      photos: {
        where: { type: { code: 'primary' } },
        take: 1,
      },
      groupMemberships: {
        select: {
          group: true,
        },
      },
    },
  })

  if (!managedUser) {
    return { managedUser: null, authdUserGroups: [] }
  }

  if (managedUser.photos.length > 0 && managedUser.photos[0].url) {
    managedUser.photos[0].url = await getPublicUrl(managedUser.photos[0].url)
  }

  const authdUserGroups = await prisma.group.findMany({
    where: {
      members: {
        some: {
          userId: authdUserId,
        },
      },
    },
    include: {
      members: {
        select: {
          userId: true,
        },
      },
    },
  })

  return { managedUser, authdUserGroups }
}
