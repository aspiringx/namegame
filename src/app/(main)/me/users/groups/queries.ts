'use server'

import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import { getPublicPhoto } from '@/lib/photos'

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
      groupMemberships: {
        select: {
          group: true,
        },
      },
    },
  })

  if (!managedUser) {
    return { managedUser: null, authdUserGroups: [], publicPhotoUrl: null }
  }

  // First, try to find the primary photo.
  let photo = await prisma.photo.findFirst({
    where: {
      entityId: managedUserId,
      entityType: { code: 'user' },
      type: { code: 'primary' },
    },
    orderBy: { createdAt: 'desc' },
  })

  // If no primary photo, fall back to the most recent photo.
  if (!photo) {
    photo = await prisma.photo.findFirst({
      where: {
        entityId: managedUserId,
        entityType: { code: 'user' },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  // Attach the photo to the user object to match the expected type.
  const userWithPhoto = { ...managedUser, photos: photo ? [photo] : [] }

  const publicPhoto = await getPublicPhoto(photo)
  const publicPhotoUrl = publicPhoto?.url_thumb

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

  return { managedUser: userWithPhoto, authdUserGroups, publicPhotoUrl }
}
