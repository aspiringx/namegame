'use server'

import { z } from 'zod'
import bcrypt from 'bcrypt'
import prisma from '@/lib/prisma'
import { revalidatePath, revalidateTag } from 'next/cache'
import { getPublicUrl } from '@/lib/storage'
import { uploadFile, deleteFile } from '@/lib/actions/storage'
import { getCodeTable } from '@/lib/codes'
import { auth } from '@/auth'
import { Gender, DatePrecision, User } from '@/generated/prisma/client'

const FormSchema = z.object({
  username: z.string().min(1, 'Username is required.'),
  firstName: z.string().min(1, 'First name is required.'),
  lastName: z.string().optional(),
  email: z
    .string()
    .email('Invalid email address.')
    .optional()
    .or(z.literal('')),
  phone: z.string().optional(),
  gender: z.nativeEnum(Gender).optional().nullable(),
  birthDate: z.string().optional().or(z.literal('')),
  birthPlace: z.string().optional(),
  deathDate: z.string().optional().or(z.literal('')),
  photo: z
    .instanceof(File, { message: 'Photo is required.' })
    .optional()
    .refine(
      (file) => !file || file.size === 0 || file.type.startsWith('image/'),
      {
        message: 'Only images are allowed.',
      },
    )
    .refine((file) => !file || file.size < 10 * 1024 * 1024, {
      message: 'File is too large. Max 10MB.',
    }),
  password: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine(
      (val) =>
        !val || val.length === 0 || /^(?=.*[a-zA-Z])(?=.*\d).{6,}$/.test(val),
      {
        message: 'Password must have 6+ characters with letters and numbers.',
      },
    )
    .refine((val) => !val || !val.toLowerCase().includes('pass'), {
      message: 'Password cannot contain the word "pass".',
    }),
  photoUrl: z.string().optional().nullable(),
})

export type State = {
  errors: {
    username?: string[]
    firstName?: string[]
    lastName?: string[]
    email?: string[]
    phone?: string[]
    gender?: string[]
    birthDate?: string[]
    birthPlace?: string[]
    deathDate?: string[]
    password?: string[]
    photo?: string[]
  } | null
  message: string | null
  success?: boolean
  photoUrl?: string | null
  values?: {
    username: string
    firstName: string
    lastName: string
    email: string
    phone: string
    gender?: Gender | null
    birthDate?: Date | null
    birthPlace?: string | null
    deathDate?: Date | null
    password?: string
  }
}

export async function getUserUpdateRequirements(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { password: true },
  })

  if (!user) {
    throw new Error('User not found')
  }

  let passwordRequired = false
  if (user.password) {
    // Password is required only if current password is the default 'password123'
    passwordRequired = await bcrypt.compare('password123', user.password)
  } else {
    passwordRequired = true // No password exists, so one is required
  }

  revalidatePath(`/admin/users/${userId}/edit`)

  return { passwordRequired }
}

export async function updateUser(
  id: string,
  prevState: State,
  formData: FormData,
): Promise<State> {
  const formValues = {
    username: formData.get('username')?.toString() || '',
    firstName: formData.get('firstName')?.toString() || '',
    lastName: formData.get('lastName')?.toString() || '',
    email: formData.get('email')?.toString() || '',
    phone: formData.get('phone')?.toString() || '',
    gender: formData.get('gender') as Gender | null,
    birthDate: formData.get('birthDate')
      ? new Date(formData.get('birthDate') as string)
      : null,
    birthPlace: formData.get('birthPlace')?.toString() || '',
    deathDate: formData.get('deathDate')
      ? new Date(formData.get('deathDate') as string)
      : null,
  }

  const session = await auth()
  if (!session?.user?.id) {
    return {
      errors: null,
      message: 'You must be logged in to update a user.',
      values: {
        ...formValues,
        password: formData.get('password')?.toString() || '',
      },
    }
  }
  const updaterId = session.user.id

  const validatedFields = FormSchema.safeParse({
    username: formData.get('username'),
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    gender: formData.get('gender') || null,
    birthDate: formData.get('birthDate'),
    birthPlace: formData.get('birthPlace'),
    deathDate: formData.get('deathDate'),
    photo: formData.get('photo'),
    password: formData.get('password'),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Validation failed. Please check the fields.',
      values: {
        ...formValues,
        password: formData.get('password')?.toString() || '',
      },
    }
  }

  const { photo, birthDate, deathDate, ...userData } = validatedFields.data
  const validatedPassword = validatedFields.data.password

  let newPhotoKeys = null
  if (photo && photo.size > 0) {
    try {
      newPhotoKeys = await uploadFile(photo, 'user-photos', id)
    } catch (uploadError) {
      console.error('Photo upload failed:', uploadError)
      return {
        success: false,
        message: 'Failed to upload photo. Please try again.',
        errors: { photo: ['Upload failed.'] },
      }
    }
  }

  let photoToDelete = null
  let updatedUser: User | null = null

  try {
    updatedUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id } })
      if (!user) {
        throw new Error('User not found.')
      }

      const parsedBirthDate = birthDate ? new Date(birthDate) : null
      const parsedDeathDate = deathDate ? new Date(deathDate) : null

      const dataToUpdate: any = {
        ...userData,
        lastName: userData.lastName || null,
        email: userData.email || null,
        phone: userData.phone || null,
        gender: userData.gender || null,
        birthDate: parsedBirthDate,
        birthPlace: userData.birthPlace || null,
        deathDate: parsedDeathDate,
        birthDatePrecision: parsedBirthDate ? DatePrecision.DAY : null,
        deathDatePrecision: parsedDeathDate ? DatePrecision.DAY : null,
        updatedBy: { connect: { id: updaterId } },
      }

      if (validatedPassword) {
        dataToUpdate.password = await bcrypt.hash(validatedPassword, 10)
      }

      const internalUpdatedUser = await tx.user.update({
        where: { id },
        data: dataToUpdate,
      })

      if (newPhotoKeys) {
        const [photoTypes, entityTypes] = await Promise.all([
          getCodeTable('photoType'),
          getCodeTable('entityType'),
        ])
        const primaryPhotoTypeId = photoTypes.primary.id
        const userEntityTypeId = entityTypes.user.id

        const existingPhoto = await tx.photo.findFirst({
          where: {
            entityId: id,
            entityTypeId: userEntityTypeId,
            typeId: primaryPhotoTypeId,
          },
        })

        if (existingPhoto) {
          photoToDelete = existingPhoto
          await tx.photo.update({
            where: { id: existingPhoto.id },
            data: { ...newPhotoKeys, userId: updaterId },
          })
        } else {
          await tx.photo.create({
            data: {
              ...newPhotoKeys,
              typeId: primaryPhotoTypeId,
              entityTypeId: userEntityTypeId,
              entityId: id,
              userId: updaterId,
            },
          })
        }
      }
      return internalUpdatedUser
    })

    if (photoToDelete) {
      await deleteFile(photoToDelete)
    }
  } catch (error: any) {
    if (newPhotoKeys) {
      const orphanedPhoto = {
        ...newPhotoKeys,
        url_thumb: newPhotoKeys.url_thumb ?? null,
        url_small: newPhotoKeys.url_small ?? null,
        url_medium: newPhotoKeys.url_medium ?? null,
        url_large: newPhotoKeys.url_large ?? null,
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

    if (error.code === 'P2002' && error.meta?.target?.includes('username')) {
      return {
        message: 'This username is already taken.',
        errors: { username: ['Username must be unique.'] },
        values: { ...formValues, password: validatedPassword || '' },
      }
    }
    console.error('Update user error:', error)
    return {
      errors: null,
      message:
        error.message || 'An unexpected error occurred. Please try again.',
      values: { ...formValues, password: validatedPassword || '' },
    }
  }

  revalidatePath('/', 'layout')
  revalidatePath('/admin/users')
  revalidatePath(`/admin/users/${id}/edit`)
  revalidateTag('user-photo')

  if (!updatedUser) {
    return {
      errors: null,
      message:
        'An unexpected error occurred and user data could not be refreshed.',
      success: false,
    }
  }

  const primaryPhoto = await prisma.photo.findFirst({
    where: {
      entityId: id,
      entityTypeId: (await getCodeTable('entityType')).user.id,
      typeId: (await getCodeTable('photoType')).primary.id,
    },
    select: { url: true, url_thumb: true },
  })

  let photoUrl: string | null = null
  if (primaryPhoto) {
    const urlToFetch = primaryPhoto.url_thumb ?? primaryPhoto.url
    const publicUrl = await getPublicUrl(urlToFetch)
    photoUrl = newPhotoKeys ? `${publicUrl}?v=${Date.now()}` : publicUrl
  }

  return {
    ...prevState,
    message: 'User updated successfully.',
    errors: null,
    success: true,
    photoUrl,
    values: {
      username: updatedUser.username,
      firstName: updatedUser.firstName || '',
      lastName: updatedUser.lastName || '',
      email: updatedUser.email || '',
      phone: updatedUser.phone || '',
      gender: updatedUser.gender,
      birthDate: updatedUser.birthDate,
      birthPlace: updatedUser.birthPlace || '',
      deathDate: updatedUser.deathDate,
      password: '', // Always return empty password
    },
  }
}
