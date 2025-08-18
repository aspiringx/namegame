'use server'

import { revalidatePath } from 'next/cache'
import { createId } from '@paralleldrive/cuid2'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import { getPublicUrl } from '@/lib/storage'
import type { MemberWithUser, FullRelationship } from '@/types'
import { getCodeTable } from '@/lib/codes'

// Number of photos to retrieve at a time for infinite scroll. If a screen is
// bigger, we'll retrieve more photos to fill the screen.
const PAGE_SIZE = 5

export async function getPaginatedMembers(
  slug: string,
  listType: 'greeted' | 'notGreeted',
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

  const allGroupMembers = await prisma.groupUser.findMany({
    where: {
      groupId: group.id,
    },
    select: { userId: true },
  })
  const allMemberIdsInGroup = allGroupMembers.map((m) => m.userId)

  const userRelations = await prisma.userUser.findMany({
    where: {
      user1Id: { in: allMemberIdsInGroup },
      user2Id: { in: allMemberIdsInGroup },
    },
    select: { user1Id: true, user2Id: true, updatedAt: true },
  })

  const relatedUserMap = new Map<string, Date>()
  userRelations.forEach((relation) => {
    // Current user must be userId1 or userId2 to prove userUser relation.
    if (
      currentUserId === relation.user1Id ||
      currentUserId === relation.user2Id
    ) {
      const otherUserId =
        relation.user1Id === currentUserId ? relation.user2Id : relation.user1Id
      relatedUserMap.set(otherUserId, relation.updatedAt)
    }
  })

  let sortedUserIds: string[]

  if (listType === 'greeted') {
    const allOtherMemberIds = allMemberIdsInGroup.filter(
      (id) => id !== currentUserId,
    )

    const greetedUsers = allOtherMemberIds
      .filter((userId) => relatedUserMap.has(userId))
      .map((userId) => ({ userId, metAt: relatedUserMap.get(userId)! }))

    greetedUsers.sort((a, b) => b.metAt.getTime() - a.metAt.getTime())
    sortedUserIds = greetedUsers.map((u) => u.userId)
  } else {
    const allOtherMemberIds = allMemberIdsInGroup.filter(
      (id) => id !== currentUserId,
    )

    const notGreetedUserIds = allOtherMemberIds.filter(
      (userId) => !relatedUserMap.has(userId),
    )

    const users = await prisma.user.findMany({
      where: { id: { in: notGreetedUserIds } },
      select: { id: true, lastName: true, firstName: true },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    })
    sortedUserIds = users.map((u) => u.id)
  }

  const paginatedIds = sortedUserIds.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  )

  if (paginatedIds.length === 0) {
    return []
  }

  const [photoTypes, entityTypes] = await Promise.all([
    getCodeTable('photoType'),
    getCodeTable('entityType'),
  ])

  const members = await prisma.groupUser.findMany({
    where: {
      groupId: group.id,
      userId: { in: paginatedIds },
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
  })

  const memberMap = new Map(members.map((m) => [m.userId, m]))
  const sortedMembers = paginatedIds
    .map((id) => memberMap.get(id))
    .filter(Boolean) as typeof members

  const memberPromises = sortedMembers.map(async (member) => {
    const primaryPhoto = member.user.photos[0]
    const photoUrl = primaryPhoto
      ? await getPublicUrl(primaryPhoto.url)
      : '/images/default-avatar.png'

    let name: string
    let relationUpdatedAt: Date | undefined

    if (listType === 'greeted') {
      name = [member.user.firstName, member.user.lastName]
        .filter(Boolean)
        .join(' ')
      relationUpdatedAt = relatedUserMap.get(member.userId)
    } else {
      name = member.user.firstName
    }

    return {
      ...member,
      relationUpdatedAt,
      user: {
        ...member.user,
        name,
        photoUrl,
      },
    }
  })

  return Promise.all(memberPromises)
}

export async function getGroupMembersForRelate(groupSlug: string) {
  const group = await prisma.group.findUnique({
    where: { slug: groupSlug },
    select: { members: { include: { user: true } } },
  })

  if (!group) {
    return []
  }

  return group.members.map((member) => ({
    ...member,
    user: {
      ...member.user,
      name: [member.user.firstName, member.user.lastName]
        .filter(Boolean)
        .join(' '),
    },
  }))
}

export async function getMemberRelations(userId: string, groupSlug: string) {
  const group = await prisma.group.findUnique({
    where: { slug: groupSlug },
    select: { id: true },
  })

  if (!group) {
    throw new Error('Group not found')
  }

  const groupMembers = await prisma.groupUser.findMany({
    where: { groupId: group.id },
    select: { userId: true },
  })
  const memberIds = groupMembers.map((m: { userId: string }) => m.userId)

  const relations = await prisma.userUser.findMany({
    where: {
      OR: [
        {
          user1Id: userId,
          user2Id: { in: memberIds },
        },
        {
          user2Id: userId,
          user1Id: { in: memberIds },
        },
      ],
    },
    include: {
      relationType: true,
      user1: true,
      user2: true,
    },
  })
  return relations.map((r) => ({
    ...r,
    relatedUser: r.user1Id === userId ? r.user2 : r.user1,
  }))
}

export async function getRelationTypes() {
  return prisma.userUserRelationType.findMany({
    select: { id: true, code: true, category: true },
  })
}

