'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import { getPublicUrl } from '@/lib/storage'
import { uploadFile, deleteFile } from '@/lib/actions/storage'
import { auth } from '@/auth'
import { getCodeTable } from '@/lib/codes'

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

  const validatedFields = GroupSchema.safeParse({
    name: formData.get('name'),
    slug: formData.get('slug'),
    description: formData.get('description'),
    address: formData.get('address'),
    phone: formData.get('phone'),
    logo: formData.get('logo'),
  })

  if (!validatedFields.success) {
    console.error(validatedFields.error)
    throw new Error('Invalid form data.')
  }

  const { logo, ...groupData } = validatedFields.data
  const groupId = Number(formData.get('groupId'))

  let newLogoKeys = null
  if (logo && logo.size > 0) {
    try {
      newLogoKeys = await uploadFile(logo, 'groups', groupId.toString())
    } catch (uploadError) {
      console.error('Logo upload failed:', uploadError)
      throw new Error('Failed to upload logo.')
    }
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

      if (newLogoKeys) {
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

  revalidatePath('/admin/groups')
  revalidatePath(`/admin/groups/${groupData.slug}`)
  redirect('/admin/groups')
}

export async function searchUsers(groupId: number, query: string) {
  if (!query) {
    return []
  }

  const [photoTypes, entityTypes] = await Promise.all([
    getCodeTable('photoType'),
    getCodeTable('entityType'),
  ])

  const users = await prisma.user.findMany({
    where: {
      deletedAt: null,
      groupMemberships: {
        none: {
          groupId: groupId,
        },
      },
      OR: [
        { username: { contains: query, mode: 'insensitive' } },
        { firstName: { contains: query, mode: 'insensitive' } },
        { lastName: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
      ],
    },
    take: 10,
  })

  if (users.length === 0) {
    return []
  }

  const userIds = users.map((u) => u.id)
  const photos = await prisma.photo.findMany({
    where: {
      entityId: { in: userIds },
      entityTypeId: entityTypes.user.id,
      typeId: photoTypes.primary.id,
    },
  })

  const photoMap = new Map(photos.map((p) => [p.entityId, p]))

  return Promise.all(
    users.map(async (user) => {
      const photo = photoMap.get(user.id)
      let photoUrl = '/images/default-avatar.png'
      if (photo) {
        photoUrl = await getPublicUrl(photo.url_thumb || photo.url)
      }

      return {
        ...user,
        photoUrl,
      }
    }),
  )
}

const AddMemberSchema = z.object({
  groupId: z.coerce.number(),
  userId: z.string(),
  roleId: z.coerce.number(),
})

export async function addMember(formData: FormData) {
  const validatedFields = AddMemberSchema.safeParse({
    groupId: formData.get('groupId'),
    userId: formData.get('userId'),
    roleId: formData.get('roleId'),
  })

  if (!validatedFields.success) {
    throw new Error('Invalid form data.')
  }

  const { groupId, userId, roleId } = validatedFields.data

  await prisma.groupUser.create({
    data: {
      groupId,
      userId,
      roleId,
      memberSince: new Date().getFullYear(), // Set current year by default
    },
  })

  const group = await prisma.group.findUnique({ where: { id: groupId } })
  revalidatePath(`/admin/groups/${group?.slug}/edit`)
}

const RemoveMemberSchema = z.object({
  groupId: z.coerce.number(),
  userId: z.string(),
})

export async function removeMember(formData: FormData) {
  const validatedFields = RemoveMemberSchema.safeParse({
    groupId: formData.get('groupId'),
    userId: formData.get('userId'),
  })

  if (!validatedFields.success) {
    throw new Error('Invalid form data.')
  }

  const { groupId, userId } = validatedFields.data

  await prisma.groupUser.delete({
    where: {
      userId_groupId: {
        userId,
        groupId,
      },
    },
  })

  const group = await prisma.group.findUnique({ where: { id: groupId } })
  revalidatePath(`/admin/groups/${group?.slug}/edit`)
}

const UpdateMemberSchema = z.object({
  groupId: z.coerce.number(),
  userId: z.string(),
  roleId: z.coerce.number(),
})

export async function updateMember(formData: FormData) {
  const validatedFields = UpdateMemberSchema.safeParse({
    groupId: formData.get('groupId'),
    userId: formData.get('userId'),
    roleId: formData.get('roleId'),
  })

  if (!validatedFields.success) {
    console.error(validatedFields.error)
    throw new Error('Invalid form data.')
  }

  const { groupId, userId, roleId } = validatedFields.data

  await prisma.groupUser.update({
    where: {
      userId_groupId: {
        userId,
        groupId,
      },
    },
    data: {
      roleId,
    },
  })

  const group = await prisma.group.findUnique({ where: { id: groupId } })
  revalidatePath(`/admin/groups/${group?.slug}/edit`)
}
