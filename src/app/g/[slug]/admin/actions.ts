'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import { uploadFile, deleteFile } from '@/lib/storage'
import { auth } from '@/auth'
import { getCodeTable } from '@/lib/codes'
import { isAdmin } from '@/lib/auth-utils'

// Define the schema for form validation using Zod
const GroupSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  slug: z.string().min(1, 'Slug is required.'),
  description: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  logo: z.instanceof(File).optional(),
})

export async function updateGroup(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error('You must be logged in to update a group.')
  }
  const userId = session.user.id
  const groupId = Number(formData.get('groupId'))

  const isGroupAdmin = await isAdmin(userId, groupId)
  if (!isGroupAdmin) {
    throw new Error('You do not have permission to update this group.')
  }

  // Extract and validate data
  const validatedFields = GroupSchema.safeParse({
    name: formData.get('name'),
    slug: formData.get('slug'),
    description: formData.get('description'),
    address: formData.get('address'),
    phone: formData.get('phone'),
    logo: formData.get('logo'),
  })

  if (!validatedFields.success) {
    // Handle validation errors
    console.error(validatedFields.error)
    throw new Error('Invalid form data.')
  }

  const { logo, ...groupData } = validatedFields.data

  try {
    const updatedGroup = await prisma.group.update({
      where: { id: groupId },
      data: {
        ...groupData,
        updatedById: userId,
      },
    })

    if (logo && logo.size > 0) {
      const [entityTypes, photoTypes] = await Promise.all([
        getCodeTable('entityType'),
        getCodeTable('photoType'),
      ])

      const groupEntityType = entityTypes.group
      const logoPhotoType = photoTypes.logo

      if (!groupEntityType || !logoPhotoType) {
        throw new Error(
          'Database Error: Could not find required code table entries.',
        )
      }

      const existingLogo = await prisma.photo.findFirst({
        where: {
          entityTypeId: groupEntityType.id,
          entityId: updatedGroup.id.toString(),
          typeId: logoPhotoType.id,
        },
      })

      const logoPaths = await uploadFile(
        logo,
        'groups',
        updatedGroup.id.toString(),
      )

      if (existingLogo) {
        await prisma.photo.update({
          where: { id: existingLogo.id },
          data: {
            ...logoPaths,
            userId: userId,
          },
        })
        // After successfully updating the DB, delete the old image.
        if (existingLogo.url) {
          await deleteFile(existingLogo.url)
        }
      } else {
        await prisma.photo.create({
          data: {
            ...logoPaths,
            typeId: logoPhotoType.id,
            entityTypeId: groupEntityType.id,
            entityId: updatedGroup.id.toString(),
            groupId: updatedGroup.id,
            userId: userId,
          },
        })
      }
    }
  } catch (error) {
    console.error('Database Error:', error)
    throw new Error('Failed to update group.')
  }

  revalidatePath(`/g/${groupData.slug}`)
  revalidatePath(`/g/${groupData.slug}/admin`)
  redirect(`/g/${groupData.slug}/admin`)
}

export async function getGroupAdmins(groupId: number) {
  const adminRole = await prisma.groupUserRole.findFirst({
    where: { code: 'admin' },
    select: { id: true },
  })

  if (!adminRole) {
    return []
  }

  const admins = await prisma.groupUser.findMany({
    where: {
      groupId: groupId,
      roleId: adminRole.id,
    },
    include: {
      user: true,
    },
  })

  return admins.map((admin) => admin.user)
}
