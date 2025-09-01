'use server'

import type { User } from '@/generated/prisma'
import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import type {
  FullRelationship,
  UserUserRelationType,
} from '@/types'
import { getCodeTable } from '@/lib/codes'
import { getPublicUrl } from './storage'

export async function getSecureImageUrl(
  storagePath: string | null | undefined,
) {
  if (!storagePath) {
    return '/images/default-avatar.png'
  }
  return getPublicUrl(storagePath)
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
      AND: [
        {
          OR: [{ user1Id: userId }, { user2Id: userId }],
        },
        {
          OR: [
            { user1Id: { in: memberIds }, user2Id: userId },
            { user1Id: userId, user2Id: { in: memberIds } },
          ],
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

export async function getUsersManagingMe() {
  const session = await auth()
  if (!session?.user?.id) {
    return []
  }

  const managers = await prisma.managedUser.findMany({
    where: {
      managedId: session.user.id,
    },
    include: {
      manager: {
        include: {
          photos: {
            where: { type: { code: 'primary' } },
            take: 1,
          },
        },
      },
    },
  })

  return managers.map(m => m.manager)
}

export async function getPotentialManagers() {
  const session = await auth()
  if (!session?.user?.id) {
    return []
  }
  const userId = session.user.id

  const existingManagers = await prisma.managedUser.findMany({
    where: { managedId: userId },
    select: { managerId: true },
  })
  const existingManagerIds = existingManagers.map(m => m.managerId)

  const userRelations = await prisma.userUser.findMany({
    where: {
      OR: [{ user1Id: userId }, { user2Id: userId }],
    },
    include: {
      user1: true,
      user2: true,
    },
  })

  const relatedUsers = new Map<string, User>()
  userRelations.forEach(rel => {
    const otherUser = rel.user1Id === userId ? rel.user2 : rel.user1
    if (!existingManagerIds.includes(otherUser.id)) {
      relatedUsers.set(otherUser.id, otherUser)
    }
  })

  return Array.from(relatedUsers.values())
}

export async function allowUserToManageMe(managerId: string): Promise<{ success: boolean; message?: string }> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, message: 'Not authenticated' }
  }
  const managedId = session.user.id

  try {
    await prisma.managedUser.create({
      data: {
        managerId,
        managedId,
      },
    })
    revalidatePath('/me/users')
    return { success: true }
  } catch (error) {
    console.error('Failed to allow user to manage:', error)
    return { success: false, message: 'A database error occurred.' }
  }
}

export async function revokeManagementPermission(managerId: string): Promise<{ success: boolean; message?: string }> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, message: 'Not authenticated' }
  }
  const managedId = session.user.id

  try {
    await prisma.managedUser.delete({
      where: {
        managerId_managedId: {
          managerId,
          managedId,
        },
      },
    })
    revalidatePath('/me/users')
    return { success: true }
  } catch (error) {
    console.error('Failed to revoke management permission:', error)
    return { success: false, message: 'A database error occurred.' }
  }
}

export async function addUserRelation(
  formData: FormData,
  groupSlug: string,
): Promise<{
  success: boolean
  message: string
  relation?: FullRelationship
}> {
  try {
    const session = await auth()
    const loggedInUserId = session?.user?.id

    if (!loggedInUserId) {
      return { success: false, message: 'Not authenticated.' }
    }

    return await prisma.$transaction(async (tx) => {
      const user1Id = formData.get('user1Id') as string

      if (!user1Id) {
        return { success: false, message: 'User to relate not specified.' }
      }

      const membership = await tx.groupUser.findFirst({
        where: {
          group: { slug: groupSlug },
          userId: loggedInUserId,
        },
      })

      if (!membership) {
        return { success: false, message: 'Not authorized.' }
      }

      const user2Id = formData.get('user2Id') as string
      const relationTypeIdValue = formData.get('relationTypeId')

      if (!user1Id || !user2Id || !relationTypeIdValue) {
        return { success: false, message: 'Missing required fields.' }
      }

      let u1 = user1Id
      let u2 = user2Id
      let relationType: UserUserRelationType | null = null

      if (relationTypeIdValue === 'child' || relationTypeIdValue === 'parent') {
        relationType = await tx.userUserRelationType.findFirst({
          where: { code: 'parent' },
        })
      } else {
        const relationTypeId = parseInt(relationTypeIdValue as string, 10)
        if (isNaN(relationTypeId)) {
          return { success: false, message: 'Invalid relation type ID.' }
        }
        relationType = await tx.userUserRelationType.findUnique({
          where: { id: relationTypeId },
        })
      }
      if (!relationType) {
        return { success: false, message: 'Relation type not found.' }
      }

      if (relationType.code === 'parent' && relationTypeIdValue !== 'child') {
        u1 = user2Id
        u2 = user1Id
      } else if (relationType.code === 'spouse' || relationType.code === 'partner') {
        // Canonicalize user IDs for symmetrical relationships
        u1 = user1Id < user2Id ? user1Id : user2Id
        u2 = user1Id < user2Id ? user2Id : user1Id
      }

      let whereClause
      if (relationType.code === 'spouse' || relationType.code === 'partner') {
        whereClause = {
          relationTypeId: relationType.id,
          OR: [
            { user1Id: u1, user2Id: u2 },
            { user1Id: u2, user2Id: u1 },
          ],
        }
      } else {
        whereClause = {
          user1Id: u1,
          user2Id: u2,
          relationTypeId: relationType.id,
        }
      }

      const existingRelation = await tx.userUser.findFirst({
        where: whereClause,
      })

      if (existingRelation) {
        return {
          success: true,
          message: 'This relationship already exists.',
          relation: existingRelation as FullRelationship,
        }
      }

      const createdRelation = await tx.userUser.create({
        data: {
          user1Id: u1,
          user2Id: u2,
          relationTypeId: relationType.id,
        },
      })

      // Re-fetch the relation to include the relationType object
      const newRelationWithDetails = await tx.userUser.findUnique({
        where: { id: createdRelation.id },
        include: {
          relationType: true,
          user1: true,
          user2: true,
        },
      })

      revalidatePath(`/g/${groupSlug}`)
      return {
        success: true,
        message: 'Relationship added successfully.',
        relation: newRelationWithDetails as FullRelationship,
      }
    })
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

    const relation = await prisma.userUser.findUnique({
      where: { id: userUserId },
    })

    if (!relation) {
      return { success: false, message: 'Relationship not found.' }
    }

    const isUserInRelation =
      relation.user1Id === userId || relation.user2Id === userId

    if (!isUserInRelation) {
      const groupUserRoles = await getCodeTable('groupUserRole')
      const membership = await prisma.groupUser.findFirst({
        where: {
          group: { slug: groupSlug },
          userId: userId,
          roleId: groupUserRoles.admin.id,
        },
      })

      if (!membership) {
        return { success: false, message: 'Not authorized.' }
      }
    }

    await prisma.userUser.delete({
      where: { id: userUserId },
    })

    revalidatePath(`/g/${groupSlug}`)
    return { success: true, message: 'Relationship deleted.' }
  } catch (error) {
    console.error('Error deleting user relation:', error)
    return { success: false, message: 'Failed to delete relationship.' }
  }
}

export async function updateUserRelation(
  userUserId: number,
  newRelationTypeId: string | number,
  groupSlug: string,
  mainUserId: string, // The user whose profile/card is being viewed
): Promise<{ success: boolean; message: string }> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, message: 'Not authenticated.' }
    }
    const loggedInUserId = session.user.id

    return await prisma.$transaction(async (tx) => {
      const group = await tx.group.findUnique({
        where: { slug: groupSlug },
        include: {
          members: {
            include: {
              role: true,
            },
          },
        },
      })

      if (!group) {
        return { success: false, message: 'Group not found.' }
      }

      const userInGroup = group.members.find(
        (ug) => ug.userId === loggedInUserId,
      )

      if (!userInGroup) {
        return { success: false, message: 'Not a member of this group.' }
      }

      const oldRelation = await tx.userUser.findUnique({
        where: { id: userUserId },
      })

      if (!oldRelation) {
        return { success: false, message: 'Relationship not found.' }
      }

      const isUserInRelation = [oldRelation.user1Id, oldRelation.user2Id].includes(
        loggedInUserId,
      )
      const isAdmin = userInGroup.role.code === 'admin'

      if (!isUserInRelation && !isAdmin) {
        return { success: false, message: 'Not authorized.' }
      }

      let u1: string, u2: string
      let newRelationType: UserUserRelationType | null

      // Determine the code of the new relationship type to handle directional logic
      let newRelationTypeCode: string | undefined;
      if (newRelationTypeId === 'parent' || newRelationTypeId === 'child') {
        newRelationTypeCode = newRelationTypeId;
      } else {
        const relationId = parseInt(newRelationTypeId as string, 10);
        if (isNaN(relationId)) {
          return { success: false, message: 'Invalid relation type ID.' };
        }
        newRelationTypeCode = (await tx.userUserRelationType.findUnique({
          where: { id: relationId },
          select: { code: true },
        }))?.code;
      }

      const relatedUserId =
        oldRelation.user1Id === mainUserId
          ? oldRelation.user2Id
          : oldRelation.user1Id


      if (newRelationTypeCode === 'parent' || newRelationTypeCode === 'child') {
        newRelationType = await tx.userUserRelationType.findFirst({
          where: { code: 'parent' },
        });

        if (newRelationTypeCode === 'parent') {
          // The related user is the PARENT of the main user.
          u1 = relatedUserId;
          u2 = mainUserId;
        } else { // newRelationTypeCode === 'child'
          // The related user is the CHILD of the main user.
          u1 = mainUserId;
          u2 = relatedUserId;
        }
      } else {
        const relationId = parseInt(newRelationTypeId as string, 10);
        if (isNaN(relationId)) {
          return { success: false, message: 'Invalid relation type ID.' };
        }
        newRelationType = await tx.userUserRelationType.findUnique({
          where: { id: relationId },
        });

        // For symmetrical relationships, canonicalize user IDs to prevent duplicates.
        if (newRelationType?.code === 'spouse' || newRelationType?.code === 'partner') {
          u1 = oldRelation.user1Id < oldRelation.user2Id ? oldRelation.user1Id : oldRelation.user2Id;
          u2 = oldRelation.user1Id < oldRelation.user2Id ? oldRelation.user2Id : oldRelation.user1Id;
        } else {
          // For other non-directional relationships, keep the original user order.
          u1 = oldRelation.user1Id;
          u2 = oldRelation.user2Id;
        }
      }

      if (!newRelationType) {
        return { success: false, message: 'New relation type not found.' }
      }

      // Atomically delete the old relation and any potential inverse duplicates, then create the new one.
      await tx.userUser.deleteMany({
        where: {
          relationTypeId: oldRelation.relationTypeId,
          OR: [
            { user1Id: oldRelation.user1Id, user2Id: oldRelation.user2Id },
            { user1Id: oldRelation.user2Id, user2Id: oldRelation.user1Id },
          ],
        },
      })

      // Also delete any target duplicates before creating the new one
      await tx.userUser.deleteMany({
        where: {
          relationTypeId: newRelationType.id,
          OR: [
            { user1Id: u1, user2Id: u2 },
            { user1Id: u2, user2Id: u1 },
          ],
        },
      })

      const newRelation = await tx.userUser.create({
        data: {
          user1Id: u1,
          user2Id: u2,
          relationTypeId: newRelationType.id,
        },
      })

      revalidatePath(`/g/${groupSlug}`)
      return { success: true, message: 'Relationship updated.' }
    })
  } catch (error) {
    console.error('Error updating user relation:', error)
    return { success: false, message: 'Failed to update relationship.' }
  }
}

export async function getRelationTypes() {
  return prisma.userUserRelationType.findMany({
    select: { id: true, code: true, category: true },
  })
}

export async function createUserUserRelation(
  user1Id: string,
  user2Id: string,
  relationTypeCode: 'family' | 'friend',
): Promise<{ success: boolean; message: string }> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, message: 'Not authenticated.' }
    }

    const relationType = await prisma.userUserRelationType.findFirst({
      where: { code: relationTypeCode },
    })

    if (!relationType) {
      return { success: false, message: 'Relation type not found.' }
    }

    // Avoid creating duplicate relationships
    const existingRelation = await prisma.userUser.findFirst({
      where: {
        relationTypeId: relationType.id,
        OR: [
          { user1Id: user1Id, user2Id: user2Id },
          { user1Id: user2Id, user2Id: user1Id },
        ],
      },
    })

    if (existingRelation) {
      return { success: true, message: 'Relationship already exists.' }
    }

    await prisma.userUser.create({
      data: {
        user1Id,
        user2Id,
        relationTypeId: relationType.id,
      },
    })

    revalidatePath('/me/users') // Or a more specific path
    return { success: true, message: 'Relationship created successfully.' }
  } catch (error) {
    console.error('Error creating user-user relation:', error)
    return { success: false, message: 'Failed to create relationship.' }
  }
}
