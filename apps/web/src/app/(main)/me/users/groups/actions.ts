'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function addUserToGroup(userId: string, groupId: number) {
  try {
    const memberRole = await prisma.groupUserRole.findFirst({
      where: { code: 'member' },
    })

    if (!memberRole) {
      throw new Error("'member' role not found.")
    }

    await prisma.groupUser.create({
      data: {
        userId,
        groupId,
        roleId: memberRole.id,
      },
    })
    revalidatePath(`/me/users/${userId}/edit`)
    return { success: true }
  } catch (error) {
    console.error('Failed to add user to group:', error)
    return { success: false, message: 'Failed to add user to group.' }
  }
}

export async function removeUserFromGroup(userId: string, groupId: number) {
  try {
    await prisma.groupUser.deleteMany({
      where: {
        userId,
        groupId,
      },
    })
    revalidatePath(`/me/users/${userId}/edit`)
    return { success: true }
  } catch (error) {
    console.error('Failed to remove user from group:', error)
    return { success: false, message: 'Failed to remove user from group.' }
  }
}
