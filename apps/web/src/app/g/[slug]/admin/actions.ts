'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import { uploadFile, deleteFile } from '@/lib/actions/storage'
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

  let newLogoKeys = null
  if (logo && logo.size > 0) {
    try {
      newLogoKeys = await uploadFile(logo, 'groups', groupId.toString())
    } catch (uploadError) {
      console.error('Logo upload failed:', uploadError)
      throw new Error('Failed to upload logo.')
    }
  }

  // Fetch code tables outside transaction to reduce transaction time
  let entityTypes: Record<string, { id: number; code: string }> | undefined
  let photoTypes: Record<string, { id: number; code: string }> | undefined
  if (newLogoKeys) {
    ;[entityTypes, photoTypes] = await Promise.all([
      getCodeTable('entityType'),
      getCodeTable('photoType'),
    ])
  }

  let logoToDelete = null

  try {
    await prisma.$transaction(async (tx) => {
      await tx.group.update({
        where: { id: groupId },
        data: {
          ...groupData,
          updatedById: userId,
        },
      })

      if (newLogoKeys && entityTypes && photoTypes) {
        const groupEntityType = entityTypes.group
        const logoPhotoType = photoTypes.logo

        if (!groupEntityType || !logoPhotoType) {
          throw new Error(
            'Database Error: Could not find required code table entries.',
          )
        }

        const existingLogo = await tx.photo.findFirst({
          where: {
            entityTypeId: groupEntityType.id,
            entityId: groupId.toString(),
            typeId: logoPhotoType.id,
          },
        })

        if (existingLogo) {
          logoToDelete = existingLogo
          await tx.photo.update({
            where: { id: existingLogo.id },
            data: {
              ...newLogoKeys,
              userId: userId,
            },
          })
        } else {
          await tx.photo.create({
            data: {
              ...newLogoKeys,
              typeId: logoPhotoType.id,
              entityTypeId: groupEntityType.id,
              entityId: groupId.toString(),
              groupId: groupId,
              userId: userId,
            },
          })
        }
      }
    })

    if (logoToDelete) {
      await deleteFile(logoToDelete)
    }
  } catch (error) {
    if (newLogoKeys) {
      const orphanedPhoto = {
        ...newLogoKeys,
        url_thumb: newLogoKeys.url_thumb ?? null,
        url_small: newLogoKeys.url_small ?? null,
        url_medium: newLogoKeys.url_medium ?? null,
        url_large: newLogoKeys.url_large ?? null,
        id: 0,
        entityId: '',
        entityTypeId: 0,
        typeId: 0,
        isBlocked: false,
        uploadedAt: new Date(),
        createdAt: new Date(),
        deletedAt: null,
        userId: null,
        groupId: null,
      }
      await deleteFile(orphanedPhoto)
    }
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
