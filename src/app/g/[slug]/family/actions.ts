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

  const groupMembers = await prisma.groupUser.findMany({
    where: { groupId: group.id },
    select: { userId: true },
  })
  const memberIds = groupMembers.map((m) => m.userId)

  const relations = await prisma.userUser.findMany({
    where: {
      relationType: {
        category: 'family',
      },
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

export async function addUserRelation(
  formData: FormData,
): Promise<{ success: boolean; message: string }> {
  try {
    // The user FOR which we're creating a relationship (card selected in ui).
    const user1Id = formData.get('user1Id') as string
    // The user TO which we're creating a relationship.
    // If bi-directional (not parent), the order of user1Id and user2Id doesn't matter.
    // If uni-directional (parent), user1Id is the parent and user2Id is the child.
    const user2Id = formData.get('user2Id') as string
    let relationTypeIdStr = formData.get('relationTypeId') as string

    if (!user1Id || !user2Id || !relationTypeIdStr) {
      return { success: false, message: 'Missing required fields.' }
    }

    // Order here only matters for parent/child relationships. Will change
    // below if needed.
    let u1 = user1Id
    let u2 = user2Id

    if (relationTypeIdStr === 'child') {
      // Change it to parent where user2Id is the child of user1Id.
      relationTypeIdStr = 'parent'
    } else if (relationTypeIdStr === 'parent') {
      // Here', if user1Id is the child creating a 'parent' relation, we swap
      // the userIds so user2Id becomes user1Id and vice versa since order
      // matters.
      u1 = user2Id
      u2 = user1Id
    }

    // Now we that we've removed the inverse child relation type, we can
    // validate the chosen type on the server.
    const relationType = await prisma.userUserRelationType.findFirst({
      where: { code: relationTypeIdStr },
    })
    if (!relationType) {
      return { success: false, message: 'Relation type not found.' }
    }

    let whereClause
    if (relationType.code === 'spouse' || relationType.code === 'partner') {
      // Bidirectional spouse/partner check. Either can be user1Id or user2Id.
      whereClause = {
        relationTypeId: relationType.id,
        OR: [{ user1Id: u1, user2Id: u1 }],
      }
    } else {
      // Directional check for other types (e.g., parent). From swapping above,
      // u1 should always be the parent if the relation exists.
      whereClause = {
        user1Id: u1,
        user2Id: u2,
        relationTypeId: relationType.id,
      }
    }

    const existingRelation = await prisma.userUser.findFirst({
      where: whereClause,
    })

    if (existingRelation) {
      if (existingRelation.groupId) {
        // Relationship exists but is tied to a group, so make it global
        await prisma.userUser.update({
          where: { id: existingRelation.id },
          data: { groupId: null },
        })
        return {
          success: true,
          message: 'Relationship updated successfully.',
        }
      }
      // Relationship already exists and is global, so do nothing
      return { success: true, message: 'This relationship already exists.' }
    }

    // Create a new global relationship
    await prisma.userUser.create({
      data: {
        user1Id: u1,
        user2Id: u2,
        relationTypeId: relationType.id,
        groupId: null, // Explicitly set groupId to null
      },
    })
    return { success: true, message: 'Relationship added successfully.' }
  } catch (error) {
    console.error('Error adding user relation:', error)
    return { success: false, message: 'Failed to add relationship.' }
  }
}

export async function deleteUserRelation(
  userUserId: number,
  groupSlug: string,
): Promise<{ success: boolean; message: string }> {
  try {
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) {
      return { success: false, message: 'Not authenticated.' }
    }

    const groupUserRoles = await getCodeTable('groupUserRole')

    const membership = await prisma.groupUser.findFirst({
      where: {
        group: {
          slug: groupSlug,
        },
        userId: userId,
        roleId: groupUserRoles.admin.id,
      },
    })

    if (!membership) {
      return { success: false, message: 'Not authorized.' }
    }

    const relation = await prisma.userUser.findUnique({
      where: { id: userUserId },
    })

    if (!relation) {
      return { success: false, message: 'Relationship not found.' }
    }

    await prisma.userUser.delete({
      where: { id: userUserId },
    })

    return { success: true, message: 'Relationship deleted.' }
  } catch (error) {
    console.error('Error deleting user relation:', error)
    return { success: false, message: 'Failed to delete relationship.' }
  }
}
