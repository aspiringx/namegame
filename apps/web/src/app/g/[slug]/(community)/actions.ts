'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'

import { getCodeTable } from '@/lib/codes'
import { getPhotoUrl } from '@/lib/photos'

export async function getGroupMembersForRelate(groupSlug: string): Promise<any[]> {
  const group = await prisma.group.findUnique({
    where: { slug: groupSlug },
    select: { members: { include: { user: true } } },
  })

  if (!group) {
    return []
  }

  const [photoTypes, entityTypes] = await Promise.all([
    getCodeTable('photoType'),
    getCodeTable('entityType'),
  ])

  const memberIds = group.members.map((m) => m.userId)
  const photos = await prisma.photo.findMany({
    where: {
      entityId: { in: memberIds },
      entityTypeId: entityTypes.user.id,
      typeId: photoTypes.primary.id,
    },
  })

  const photosByUserId = new Map(photos.map((p) => [p.entityId, p]))

  const memberPromises = group.members.map(async (member) => {
    const primaryPhoto = photosByUserId.get(member.userId)
    const photoUrl = await getPhotoUrl(primaryPhoto || null, { size: 'thumb' })

    return {
      ...member,
      user: {
        ...member.user,
        name: `${member.user.firstName} ${member.user.lastName}`.trim(),
        photoUrl,
      },
    }
  })

  return Promise.all(memberPromises)
}

export async function createAcquaintanceRelationship(
  memberUserId: string,
  groupSlug: string,
) {
  const session = await auth()
  const currentUserId = session?.user?.id

  if (!currentUserId) {
    throw new Error('Not authenticated')
  }

  const [userUserRelationTypes] = await Promise.all([
    getCodeTable('userUserRelationType'),
  ])

  const acquaintanceRelationTypeId = userUserRelationTypes.acquaintance.id

  // Ensure consistent ordering of user IDs to prevent duplicate relationships
  const [user1Id, user2Id] = [currentUserId, memberUserId].sort()

  await prisma.userUser.create({
    data: {
      user1Id,
      user2Id,
      relationTypeId: acquaintanceRelationTypeId,
    },
  })

  revalidatePath(`/g/${groupSlug}`)
}
