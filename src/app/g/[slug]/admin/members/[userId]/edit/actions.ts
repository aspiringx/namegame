'use server'

import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { isAdmin } from '@/lib/auth-utils'
import { revalidatePath } from 'next/cache'

interface UpdateMemberPayload {
  userId: string
  groupId: number
  roleId: number
}

export async function updateMemberRole(
  { userId, groupId, roleId }: UpdateMemberPayload,
  groupSlug: string,
) {
  const session = await auth()
  if (!session?.user) {
    throw new Error('Authentication required')
  }

  // Authorize: check if the current user is an admin of the group
  if (!(await isAdmin(session.user.id, groupId))) {
    throw new Error('You do not have permission to edit members in this group.')
  }

  try {
    // Update the user's role in the group
    await prisma.groupUser.update({
      where: {
        userId_groupId: {
          userId: userId,
          groupId: groupId,
        },
      },
      data: {
        roleId: roleId,
      },
    })
  } catch (error) {
    console.error('Database Error:', error)
    throw new Error('Failed to update member roles.')
  }

  revalidatePath(`/g/${groupSlug}/admin/members`)
  revalidatePath(`/g/${groupSlug}/admin/members/${userId}/edit`)
}
