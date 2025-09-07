'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { isAdmin } from '@/lib/auth-utils'
import { auth } from '@/auth'

export async function removeMember(
  { userId, groupId }: { userId: string; groupId: number },
  groupSlug: string,
) {
  const session = await auth()
  const user = session?.user

  if (!user) {
    throw new Error('You must be logged in to perform this action.')
  }

  const group = await prisma.group.findUnique({
    where: { slug: groupSlug },
  })

  if (!group) {
    throw new Error('Group not found.')
  }

  if (!(await isAdmin(user.id, group.id))) {
    throw new Error('You do not have permission to perform this action.')
  }

  try {
    await prisma.groupUser.delete({
      where: { userId_groupId: { userId, groupId } },
    })
  } catch (error) {
    console.error('Database Error:', error)
    throw new Error('Failed to remove member.')
  }

  revalidatePath(`/g/${groupSlug}/admin/members`)
}

export async function updateMemberRole(formData: FormData) {
  const session = await auth()
  if (!session?.user) {
    throw new Error('Authentication required')
  }

  const userId = formData.get('userId') as string
  const groupId = parseInt(formData.get('groupId') as string, 10)
  const roleId = parseInt(formData.get('roleId') as string, 10)
  const groupSlug = formData.get('groupSlug') as string

  if (isNaN(groupId) || isNaN(roleId) || !userId || !groupSlug) {
    throw new Error('Invalid data provided.')
  }

  if (!(await isAdmin(session.user.id, groupId))) {
    throw new Error('You do not have permission to edit members in this group.')
  }

  try {
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
}
