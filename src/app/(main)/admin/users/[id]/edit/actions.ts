'use server'

import { z } from 'zod'
import bcrypt from 'bcrypt'
import prisma from '@/lib/prisma'
import { revalidatePath, revalidateTag } from 'next/cache'
import { uploadFile, deleteFile, getPublicUrl } from '@/lib/storage'
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
        !val ||
        val.length === 0 ||
        /^(?=.*[a-zA-Z])(?=.*\d).{6,}$/.test(val),
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

  // Get the user to check password requirement
  const user = await prisma.user.findUnique({
    where: { id },
    select: { password: true },
  })

  if (!user) {
    return {
      errors: null,
      message: 'User not found.',
      values: {
        ...formValues,
        password: formData.get('password')?.toString() || '',
      },
    }
  }

  // Check if password is required (only if current password is 'password123')
  let passwordRequired = false
  if (user.password) {
    passwordRequired = await bcrypt.compare('password123', user.password)
  } else {
    passwordRequired = true // No password exists, so one is required
  }

  const password = formData.get('password')?.toString() || ''

  // If password is required but not provided, return error
  if (passwordRequired && !password) {
    return {
      errors: {
        password: ['Password is required for users with default password.'],
      },
      message: 'Password is required.',
      values: {
        ...formValues,
        password: '',
      },
    }
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

  // Parse dates if provided
  const parsedBirthDate = birthDate ? new Date(birthDate) : null
  const parsedDeathDate = deathDate ? new Date(deathDate) : null
  let photoUrl: string | null = null
  let updatedUser: User | null = null

  try {
    const [photoTypes, entityTypes] = await Promise.all([
      getCodeTable('photoType'),
      getCodeTable('entityType'),
    ])
    const primaryPhotoTypeId = photoTypes.primary.id
    const userEntityTypeId = entityTypes.user.id

    const { password: _password, ...userDataWithoutPassword } = userData

    const dataToUpdate: any = {
      ...userDataWithoutPassword,
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

    updatedUser = await prisma.user.update({
      where: { id },
      data: dataToUpdate,
    })

    // Handle photo upload if a new photo was provided
    if (photo && photo.size > 0) {
      // Upload the new photo to storage first
      const newPhotoKeys = await uploadFile(photo, 'user-photos', id)
      photoUrl = await getPublicUrl(newPhotoKeys.url)

      // Check if a primary photo record already exists for the user
      const existingPhoto = await prisma.photo.findFirst({
        where: {
          entityId: id,
          entityTypeId: userEntityTypeId,
          typeId: primaryPhotoTypeId,
        },
      })

      if (existingPhoto) {
        // If it exists, update the record with the new URL
        await prisma.photo.update({
          where: { id: existingPhoto.id },
          data: { ...newPhotoKeys, userId: updaterId }, // Update URLs and who updated it
        })
        // After successfully updating the DB, delete the old file from storage
        if (existingPhoto.url) {
          await deleteFile(existingPhoto.url)
        }
      } else {
        // If no primary photo exists, create a new one
        await prisma.photo.create({
          data: {
            ...newPhotoKeys,
            typeId: primaryPhotoTypeId,
            entityTypeId: userEntityTypeId,
            entityId: id,
            userId: updaterId, // The admin is the one who uploaded the photo
          },
        })
      }
    }
  } catch (error: any) {
    if (error.code === 'P2002' && error.meta?.target?.includes('username')) {
      return {
        message: 'This username is already taken.',
        errors: { username: ['Username must be unique.'] },
        values: { ...formValues, password: password || '' },
      }
    }
    console.error('Update user error:', error)
    return {
      errors: null,
      message: 'An unexpected error occurred. Please try again.',
      values: { ...formValues, password: password || '' },
    }
  }

  revalidatePath('/', 'layout')
  revalidatePath('/admin/users')
  revalidatePath(`/admin/users/${id}/edit`)
  revalidateTag('user-photo')

  if (!updatedUser) {
    return {
      errors: null,
      message: 'An unexpected error occurred and user data could not be refreshed.',
      success: false,
    }
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
