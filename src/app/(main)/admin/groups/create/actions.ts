'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import { deleteFile, uploadFile } from '@/lib/storage'
import { auth } from '@/auth'
import { getCodeTable } from '@/lib/codes'

// Define the schema for form validation using Zod
const CreateGroupSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters long.'),
  slug: z
    .string()
    .min(3, 'Slug must be at least 3 characters long.')
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Slug can only contain lowercase letters, numbers, and hyphens.',
    ),
  description: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  logo: z.string().optional(),
  groupTypeId: z.coerce.number({
    required_error: 'Group type is required.',
    invalid_type_error: 'Group type is required.',
  }),
})

export interface State {
  message: string | null
  errors: {
    name?: string[]
    slug?: string[]
    description?: string[]
    address?: string[]
    phone?: string[]
    logo?: string[]
    groupTypeId?: string[]
  }
  values: {
    name: string
    slug: string
    description: string
    address: string
    phone: string
    groupTypeId: number
  }
}

export async function createGroup(
  prevState: State,
  formData: FormData,
): Promise<State> {
  const session = await auth()
  if (!session?.user?.id) {
    return {
      message: 'You must be logged in to create a group.',
      errors: {},
      values: {
        name: '',
        slug: '',
        description: '',
        address: '',
        phone: '',
        groupTypeId: 0,
      },
    }
  }
  const userId = session.user.id

  const validatedFields = CreateGroupSchema.safeParse({
    name: formData.get('name'),
    slug: formData.get('slug'),
    description: formData.get('description'),
    address: formData.get('address'),
    phone: formData.get('phone'),
    logo: formData.get('logo'),
    groupTypeId: formData.get('groupTypeId'),
  })

  const rawFormData = {
    name: (formData.get('name') as string) || '',
    slug: (formData.get('slug') as string) || '',
    description: (formData.get('description') as string) || '',
    address: (formData.get('address') as string) || '',
    phone: (formData.get('phone') as string) || '',
    groupTypeId: parseInt((formData.get('groupTypeId') as string) || '0', 10),
  }

  if (!validatedFields.success) {
    const fieldErrors = validatedFields.error.flatten().fieldErrors
    const errorFields = Object.keys(fieldErrors)
      .map((field) => field.charAt(0).toUpperCase() + field.slice(1))
      .join(', ')

    return {
      errors: fieldErrors,
      message: `Please correct the invalid fields: ${errorFields}.`,
      values: rawFormData,
    }
  }

  const { logo: base64Logo, ...groupData } = validatedFields.data
  let newLogoKeys = null

  if (base64Logo) {
    const matches = base64Logo.match(/^data:(.+);base64,(.+)$/)
    if (matches && matches.length === 3) {
      const mimeType = matches[1]
      const base64Data = matches[2]
      const buffer = Buffer.from(base64Data, 'base64')
      const file = new File([buffer], 'logo.jpg', { type: mimeType })

      try {
        // We need an ID for the upload, but the group doesn't exist yet.
        // We'll use a temporary placeholder and rely on the transaction to ensure consistency.
        const tempIdForUpload = `temp-${Date.now()}`
        newLogoKeys = await uploadFile(file, 'groups', tempIdForUpload)
      } catch (uploadError) {
        console.error('Logo upload failed:', uploadError)
        return {
          errors: {},
          message: 'Failed to upload logo. Please try again.',
          values: rawFormData,
        }
      }
    }
  }

  try {
    await prisma.$transaction(async (tx) => {
      const existingGroup = await tx.group.findUnique({
        where: { slug: groupData.slug },
      })

      if (existingGroup) {
        throw new Error('This slug is already in use.')
      }

      const newGroup = await tx.group.create({
        data: {
          ...groupData,
          idTree: Math.random().toString(36).substring(2, 15), // Placeholder
          createdById: userId,
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

        await tx.photo.create({
          data: {
            ...newLogoKeys,
            entityId: newGroup.id.toString(),
            entityTypeId: groupEntityType.id,
            typeId: logoPhotoType.id,
            groupId: newGroup.id,
            userId: userId,
          },
        })
      }
    })
  } catch (error: any) {
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

    if (error.message.includes('slug is already in use')) {
      return {
        errors: { slug: ['This slug is already in use.'] },
        message: 'Slug is already in use.',
        values: rawFormData,
      }
    }

    return {
      errors: {},
      message: `Database Error: ${error.message || 'An unknown error occurred.'}`,
      values: rawFormData,
    }
  }

  revalidatePath('/admin/groups')
  redirect('/admin/groups')
}
