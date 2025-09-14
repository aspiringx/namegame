'use server'

import prisma from '@/lib/prisma'
import { getPhotoUrl } from '@/lib/photos'
import type { MemberWithUser, FullRelationship } from '@/types'
import { getCodeTable } from '@/lib/codes'

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
  const memberIds = groupMembers.map(
    (member: { userId: string }) => member.userId,
  )

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

  return relationships as FullRelationship[]
}

export async function getGroupMembersForRelate(
  groupSlug: string,
): Promise<MemberWithUser[]> {
  const group = await prisma.group.findUnique({
    where: { slug: groupSlug },
    select: { id: true },
  })

  if (!group) {
    return []
  }

  const membersWithoutPhotos = await prisma.groupUser.findMany({
    where: {
      groupId: group.id,
    },
    include: {
      role: true,
      user: true,
    },
  })

  if (membersWithoutPhotos.length === 0) {
    return []
  }

  const [photoTypes, entityTypes] = await Promise.all([
    getCodeTable('photoType'),
    getCodeTable('entityType'),
  ])

  const memberIds = membersWithoutPhotos.map((m) => m.userId)
  const photos = await prisma.photo.findMany({
    where: {
      entityId: { in: memberIds },
      entityTypeId: entityTypes.user.id,
      typeId: photoTypes.primary.id,
    },
  })

  const photosByUserId = new Map(photos.map((p) => [p.entityId, p]))

  const memberPromises = membersWithoutPhotos.map(async (member) => {
    const primaryPhoto = photosByUserId.get(member.userId)
    const photoUrl = await getPhotoUrl(primaryPhoto || null, 'thumb')

    const name = [member.user.firstName, member.user.lastName]
      .filter(Boolean)
      .join(' ')

    return {
      ...member,
      parents: [],
      children: [],
      user: {
        ...member.user,
        name,
        photoUrl,
        status: 'active',
      },
    }
  })

  return Promise.all(memberPromises)
}
