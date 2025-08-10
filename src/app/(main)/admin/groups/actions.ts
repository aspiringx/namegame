'use server'

import { z } from 'zod'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'

export interface FormState {
  message?: string
  errors?: {
    name?: string[]
    slug?: string[]
    description?: string[]
  }
}

const GroupSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters long.'),
  slug: z
    .string()
    .min(3, 'Slug must be at least 3 characters long.')
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Slug can only contain lowercase letters, numbers, and hyphens.',
    ),
  description: z.string().optional(),
})

export async function createGroup(
  prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await auth()
  const userId = session?.user?.id

  if (!userId) {
    return { message: 'You must be logged in to create a group.' }
  }

  const validatedFields = GroupSchema.safeParse({
    name: formData.get('name'),
    slug: formData.get('slug'),
    description: formData.get('description'),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  try {
    await prisma.$transaction(async (tx) => {
      const group = await tx.group.create({
        data: {
          name: validatedFields.data.name,
          slug: validatedFields.data.slug,
          description: validatedFields.data.description,
          idTree: validatedFields.data.slug + '-' + Date.now(), // Temporary unique value
          createdBy: { connect: { id: userId } },
          updatedBy: { connect: { id: userId } },
        },
      })

      await tx.group.update({
        where: { id: group.id },
        data: { idTree: group.id.toString() },
      })
    })
  } catch (error) {
    console.error('Failed to create group:', error)
    return {
      message: 'Failed to create group. The slug may already be in use.',
    }
  }

  revalidatePath('/admin/groups')
  redirect('/admin/groups')
}

export async function softDeleteGroup(groupId: number) {
  const session = await auth()
  const userId = session?.user?.id

  if (!userId) {
    return {
      success: false,
      message: 'You must be logged in to perform this action.',
    }
  }

  try {
    await prisma.group.update({
      where: { id: groupId },
      data: {
        deletedAt: new Date(),
        updatedBy: { connect: { id: userId } },
      },
    })
    revalidatePath('/admin/groups')
    return { success: true, message: 'Group soft-deleted successfully.' }
  } catch (error) {
    console.error('Database Error:', error)
    return { success: false, message: 'Failed to soft-delete group.' }
  }
}

export async function hardDeleteGroup(groupId: number) {
  try {
    const childGroups = await prisma.group.count({
      where: { parentId: groupId },
    })

    if (childGroups > 0) {
      return {
        success: false,
        message:
          'Cannot delete this group because it has child groups. Please reassign or delete them first.',
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.code.deleteMany({ where: { groupId } })
      await tx.link.deleteMany({ where: { groupId } })
      await tx.iceBreaker.deleteMany({ where: { groupId } })
      await tx.photo.deleteMany({ where: { groupId } })
      await tx.userUser.deleteMany({ where: { groupId } })
      await tx.groupUser.deleteMany({ where: { groupId } })
      await tx.group.delete({ where: { id: groupId } })
    })

    revalidatePath('/admin/groups')
    return { success: true, message: 'Group deleted successfully.' }
  } catch (error) {
    console.error('Database Error:', error)
    return { success: false, message: 'Failed to delete group.' }
  }
}

export async function undeleteGroup(groupId: number) {
  const session = await auth()
  const userId = session?.user?.id

  if (!userId) {
    return {
      success: false,
      message: 'You must be logged in to perform this action.',
    }
  }

  try {
    await prisma.group.update({
      where: { id: groupId },
      data: {
        deletedAt: null,
        updatedBy: { connect: { id: userId } },
      },
    })
    revalidatePath('/admin/groups')
    return { success: true, message: 'Group restored successfully.' }
  } catch (error) {
    console.error('Database Error:', error)
    return { success: false, message: 'Failed to restore group.' }
  }
}
