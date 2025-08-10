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

export async function getGroupMembersForRelate(groupSlug: string) {
  const group = await prisma.group.findUnique({
    where: { slug: groupSlug },
    select: { members: { include: { user: true } } },
  })

  if (!group) {
    return []
  }

  return group.members.map(member => ({
    ...member,
    user: {
      ...member.user,
      name: [member.user.firstName, member.user.lastName].filter(Boolean).join(' '),
    },
  }))
}

export async function getFamilyRelationTypes() {
  return prisma.userUserRelationType.findMany({
    where: { category: 'family' },
  })
}

export async function getMemberRelations(userId: string, groupSlug: string) {
  const group = await prisma.group.findUnique({
    where: { slug: groupSlug },
    select: { id: true },
  })

  if (!group) {
    throw new Error('Group not found')
  }

  const relations = await prisma.userUser.findMany({
    where: {
      groupId: group.id,
      OR: [{ user1Id: userId }, { user2Id: userId }],
      relationType: {
        is: {
          category: 'family',
        },
      },
    },
    include: {
      relationType: true,
      user1: true,
      user2: true,
    },
  })

  return relations.map(r => ({
    ...r,
    relatedUser: r.user1Id === userId ? r.user2 : r.user1,
  }))
}

export async function addUserRelation(formData: FormData): Promise<{ success: boolean; message: string }> {
  try {
    const user1Id = formData.get('user1Id') as string
    const user2Id = formData.get('user2Id') as string
    const relationTypeIdStr = formData.get('relationTypeId') as string
    const groupSlug = formData.get('groupSlug') as string

    if (!user1Id || !user2Id || !relationTypeIdStr || !groupSlug) {
      return { success: false, message: 'Missing required fields.' }
    }

    const relationTypeId = Number(relationTypeIdStr)

    const group = await prisma.group.findUnique({
      where: { slug: groupSlug },
      select: { id: true },
    })

    if (!group) {
      return { success: false, message: 'Group not found.' }
    }

    const [u1, u2] = [user1Id, user2Id].sort()

    const existingRelation = await prisma.userUser.findFirst({
      where: {
        user1Id: u1,
        user2Id: u2,
        relationTypeId: relationTypeId,
        groupId: group.id,
      },
    })

    if (existingRelation) {
      return { success: false, message: 'This relationship already exists.' }
    }

    await prisma.userUser.create({
      data: {
        user1Id: u1,
        user2Id: u2,
        relationTypeId,
        groupId: group.id,
      },
    })

    return { success: true, message: 'Relationship added successfully.' }
  } catch (error) {
    console.error('Error adding user relation:', error)
    return { success: false, message: 'Failed to add relationship.' }
  }
}
