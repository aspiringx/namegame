'use server'

import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import { getPublicUrl } from '@/lib/storage'
import type { MemberWithUser, FullRelationship } from '@/types'
import { getCodeTable } from '@/lib/codes'

const PAGE_SIZE = 10

export async function getPaginatedMembers(
  slug: string,
  page: number,
): Promise<MemberWithUser[]> {
  const session = await auth()
  const currentUserId = session?.user?.id

  if (!currentUserId) {
    return []
  }

  const group = await prisma.group.findUnique({
    where: { slug },
    select: { id: true },
  })

  if (!group) {
    return []
  }

  const [totalMembers, photoTypes, entityTypes] = await Promise.all([
    prisma.groupUser.count({
      where: {
        groupId: group.id,
        userId: { not: currentUserId },
      },
    }),
    getCodeTable('photoType'),
    getCodeTable('entityType'),
  ])

  const members = await prisma.groupUser.findMany({
    where: {
      groupId: group.id,
      userId: { not: currentUserId },
    },
    include: {
      role: true,
      user: {
        include: {
          photos: {
            where: {
              typeId: photoTypes.primary.id,
              entityTypeId: entityTypes.user.id,
            },
            take: 1,
          },
        },
      },
    },
    orderBy: {
      user: {
        lastName: 'asc',
      },
    },
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  })

  const memberPromises = members.map(async (member) => {
    const primaryPhoto = member.user.photos[0]
    const photoUrl = primaryPhoto
      ? await getPublicUrl(primaryPhoto.url)
      : '/images/default-avatar.png'

    const name = [member.user.firstName, member.user.lastName]
      .filter(Boolean)
      .join(' ')

    return {
      ...member,
      user: {
        ...member.user,
        name,
        photoUrl,
      },
    }
  })

  return Promise.all(memberPromises)
}

export async function getFamilyRelationships(
  groupSlug: string,
): Promise<FullRelationship[]> {
  const group = await prisma.group.findUnique({
    where: { slug: groupSlug },
    select: { id: true },
  })

  if (!group) {
    return []
  }

  const groupMembers = await prisma.groupUser.findMany({
    where: { groupId: group.id },
    select: { userId: true },
  })
  const memberIds = groupMembers.map((member) => member.userId)

  const relationships = await prisma.userUser.findMany({
    where: {
      user1Id: { in: memberIds },
      user2Id: { in: memberIds },
      relationType: {
        category: 'family',
      },
    },
    include: {
      relationType: true,
    },
  })

  // The type assertion is needed because the generated client doesn't know
  // that `relationType` is non-null when the query filters on it.
  return relationships as FullRelationship[]
}
