'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import { uploadFile } from '@/lib/storage'
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

  // This is for repopulating the form on error
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

  // validatedFields.data can't be null here because of the success check
  const { logo: initialLogo, ...groupData } = validatedFields.data!
  const logo = initialLogo === '' ? null : initialLogo

  try {
    const existingGroup = await prisma.group.findUnique({
      where: { slug: groupData.slug },
    })

    if (existingGroup) {
      return {
        errors: { slug: ['This slug is already in use.'] },
        message: 'Slug is already in use.',
        values: rawFormData,
      }
    }

    const [entityTypes, photoTypes] = await Promise.all([
      getCodeTable('entityType'),
      getCodeTable('photoType'),
    ])

    const groupEntityType = entityTypes.group
    const logoPhotoType = photoTypes.logo

    if (!groupEntityType || !logoPhotoType) {
      return {
        errors: {},
        message: 'Database Error: Could not find required code table entries.',
        values: rawFormData,
      }
    }

    const newGroup = await prisma.group.create({
      data: {
        ...groupData,
        idTree: Math.random().toString(36).substring(2, 15), // Placeholder
        createdById: userId,
        updatedById: userId,
      },
    })

    if (logo) {
      const matches = logo.match(/^data:(.+);base64,(.+)$/)
      if (matches && matches.length === 3) {
        const mimeType = matches[1]
        const base64Data = matches[2]
        const buffer = Buffer.from(base64Data, 'base64')
        const file = new File([buffer], 'logo.jpg', { type: mimeType })

        const logoPaths = await uploadFile(
          file,
          'groups',
          newGroup.id.toString(),
        )

        await prisma.photo.create({
          data: {
            ...logoPaths,
            entityId: newGroup.id.toString(),
            entityTypeId: groupEntityType.id,
            typeId: logoPhotoType.id,
            groupId: newGroup.id,
            userId: userId,
          },
        })
      }
    }
  } catch (e) {
    const message =
      e instanceof Error ? e.message : 'An unknown error occurred.'
    return {
      errors: {},
      message: `Database Error: ${message}`,
      values: rawFormData,
    }
  }

  revalidatePath('/admin/groups')
  redirect('/admin/groups')
}
