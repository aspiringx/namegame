'use server'

import { z } from 'zod'
import { Gender, ManagedStatus, User, Photo } from '@/generated/prisma/client'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import bcrypt from 'bcrypt'
import { uploadFile, getPublicUrl, deleteFile } from '@/lib/storage'
import { revalidatePath } from 'next/cache'
import crypto from 'crypto'
import { parseDateAndDeterminePrecision } from '@/lib/utils'
import { getCodeTable } from '@/lib/codes'

export type ManagedUserWithPhoto = User & {
  photos: Photo[]
  managedStatus: ManagedStatus
}

export type State = {
  message?: string | null
  error?: string | null
  errors?: {
    firstName?: string[]
    lastName?: string[]
    email?: string[]
    password?: string[]
    photo?: string[]
    managed?: string[]
    birthDate?: string[]
    deathDate?: string[]
    _form?: string[]
  } | null
  success?: boolean
  redirectUrl?: string
  updatedUser?: User & { photos: Photo[] }
}

const CreateUserSchema = z
  .object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Invalid email address.').optional().nullable(),
    password: z.string().optional().nullable(),
    photo: z
      .instanceof(File)
      .refine((file) => file.size > 0, 'Profile picture is required.')
      .refine(
        (file) => file.size < 4 * 1024 * 1024,
        'Image must be less than 4MB.',
      ),
    managed: z.nativeEnum(ManagedStatus, {
      errorMap: () => ({ message: 'Please select a managed level.' }),
    }),
    gender: z.nativeEnum(Gender).optional().nullable(),
    birthDate: z.string().optional().nullable(),
    birthPlace: z.string().optional().nullable(),
    deathDate: z.string().optional().nullable(),
    deathPlace: z.string().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.managed === ManagedStatus.partial) {
      if (!data.email) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['email'],
          message: 'Email is required for partially managed users.',
        })
      }
      if (!data.password) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['password'],
          message: 'Password is required for partially managed users.',
        })
      } else if (data.password.length < 6) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['password'],
          message: 'Password must be at least 6 characters.',
        })
      }
    }
  })

export async function createManagedUser(
  prevState: State,
  formData: FormData,
): Promise<State> {
  const session = await auth()
  if (!session?.user?.id) {
    return {
      error: 'You must be logged in to create a managed user.',
    }
  }

  const validatedFields = CreateUserSchema.safeParse({
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    email: formData.get('email'),
    password: formData.get('password'),
    photo: formData.get('photo'),
    managed: formData.get('managed'),
    gender: formData.get('gender') || null,
    birthDate: formData.get('birthDate') || null,
    birthPlace: formData.get('birthPlace') || null,
    deathDate: formData.get('deathDate') || null,
    deathPlace: formData.get('deathPlace') || null,
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  const {
    firstName,
    lastName,
    email,
    password,
    photo,
    managed,
    gender,
    birthDate,
    birthPlace,
    deathDate,
    deathPlace,
  } = validatedFields.data
  const managerId = session.user.id

  try {
    // For fully managed users, if no password is provided, generate a secure random one.
    const finalPassword = password || crypto.randomBytes(16).toString('hex')
    const hashedPassword = await bcrypt.hash(finalPassword, 10)
    const username = `${firstName.toLowerCase()}${Date.now()}`.slice(0, 15)

    let birthDateData = {}
    if (birthDate) {
      const parsedDate = parseDateAndDeterminePrecision(birthDate)
      if (parsedDate) {
        birthDateData = {
          birthDate: parsedDate.date,
          birthDatePrecision: parsedDate.precision,
        }
      } else {
        return { errors: { birthDate: ['Invalid date format.'] } }
      }
    }

    let deathDateData = {}
    if (deathDate) {
      const parsedDate = parseDateAndDeterminePrecision(deathDate)
      if (parsedDate) {
        deathDateData = {
          deathDate: parsedDate.date,
          deathDatePrecision: parsedDate.precision,
        }
      } else {
        return { errors: { deathDate: ['Invalid date format.'] } }
      }
    }

    await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          username,
          firstName,
          lastName,
          email,
          password: hashedPassword,
          managed,
          gender,
          ...birthDateData,
          birthPlace,
          ...deathDateData,
          deathPlace,
          createdById: managerId,
        },
      })

      const photoKey = await uploadFile(photo, 'user-photos', newUser.id)

      await tx.managedUser.create({
        data: {
          managerId: managerId,
          managedId: newUser.id,
        },
      })

      const [photoTypes, entityTypes] = await Promise.all([
        getCodeTable('photoType'),
        getCodeTable('entityType'),
      ])

      await tx.photo.create({
        data: {
          url: photoKey,
          entityId: newUser.id,
          entityTypeId: entityTypes.user.id,
          typeId: photoTypes.primary.id,
          userId: managerId,
        },
      })
    })

    revalidatePath('/me/users')
    return {
      success: true,
      message: 'Managed user created successfully!',
      redirectUrl: '/me/users?success=Managed user created successfully!',
    }
  } catch (error: any) {
    console.error('Failed to create managed user:', error)
    if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
      return { errors: { email: ['This email is already in use.'] } }
    }
    return { error: 'An unexpected error occurred. Please try again.' }
  }
}

export async function getManagedUsers(): Promise<ManagedUserWithPhoto[]> {
  const session = await auth()
  if (!session?.user?.id) {
    return []
  }

  const managerId = session.user.id

  const [photoTypes, entityTypes] = await Promise.all([
    getCodeTable('photoType'),
    getCodeTable('entityType'),
  ])
  const primaryPhotoTypeId = photoTypes.primary.id
  const userEntityTypeId = entityTypes.user.id

  const managedUserRelations = await prisma.managedUser.findMany({
    where: { managerId },
    include: {
      managed: true,
    },
  })

  if (managedUserRelations.length === 0) {
    return []
  }

  const managedUserIds = managedUserRelations.map((rel) => rel.managedId)

  const photos = await prisma.photo.findMany({
    where: {
      entityId: { in: managedUserIds },
      entityTypeId: userEntityTypeId,
      typeId: primaryPhotoTypeId,
    },
  })

  const photosWithPublicUrls = await Promise.all(
    photos.map(async (photo) => {
      if (photo.url.startsWith('https')) {
        return photo
      }
      const publicUrl = await getPublicUrl(photo.url)
      return { ...photo, url: publicUrl }
    }),
  )

  const photoMap = new Map(photosWithPublicUrls.map((p) => [p.entityId, p]))

  const usersWithPhotos = managedUserRelations.map((rel) => {
    const user = rel.managed
    const photo = photoMap.get(user.id)

    return {
      ...user,
      managedStatus: user.managed as ManagedStatus,
      photos: photo ? [photo] : [],
    }
  })

  return usersWithPhotos
}

export async function updateManagedUser(
  userId: string,
  prevState: State,
  formData: FormData,
): Promise<State> {
  const session = await auth()
  if (!session?.user?.id) {
    return { message: 'Not authenticated' }
  }
  const managerId = session.user.id

  // Verify that the current user is the manager of the user being updated
  const managedUserRelation = await prisma.managedUser.findUnique({
    where: {
      managerId_managedId: {
        managedId: userId,
        managerId: managerId,
      },
    },
    include: {
      managed: true,
    },
  })

  if (!managedUserRelation) {
    return { message: 'Forbidden' }
  }

  if (!managedUserRelation || !managedUserRelation.managed) {
    return { message: 'Forbidden' }
  }

  const userToUpdate = managedUserRelation.managed

  const UpdateUserSchema = z
    .object({
      firstName: z.string().min(1, 'First name is required.'),
      lastName: z.string().min(1, 'Last name is required.'),
      email: z
        .string()
        .email('Invalid email address.')
        .optional()
        .or(z.literal(''))
        .nullable(),
      password: z
        .string()
        .min(6, 'Password must be at least 6 characters.')
        .optional()
        .or(z.literal(''))
        .nullable(),
      photo: z.instanceof(File).optional(),
      birthDate: z.string().optional(),
      birthPlace: z.string().optional(),
      deathDate: z.string().optional(),
      deathPlace: z.string().optional(),
      gender: z.nativeEnum(Gender).optional(),
      managedStatus: z.nativeEnum(ManagedStatus).optional(),
    })
    .superRefine((data, ctx) => {
      if (data.managedStatus === ManagedStatus.partial) {
        if (!data.email) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['email'],
            message: 'Email is required for partially managed users.',
          })
        }
        if (
          data.password &&
          data.password.length > 0 &&
          data.password.length < 6
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['password'],
            message: 'Password must be at least 6 characters.',
          })
        }
      }
    })

  const validatedFields = UpdateUserSchema.safeParse({
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    email: formData.get('email'),
    password: formData.get('password'),
    photo: formData.get('photo'),
    birthDate: formData.get('birthDate'),
    birthPlace: formData.get('birthPlace'),
    deathDate: formData.get('deathDate'),
    deathPlace: formData.get('deathPlace'),
    gender: formData.get('gender') || undefined,
    managedStatus: formData.get('managed'),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Please correct the errors below.',
    }
  }

  const {
    firstName,
    lastName,
    email,
    password,
    photo: newPhoto,
    birthDate,
    birthPlace,
    deathDate,
    deathPlace,
    gender,
    managedStatus,
  } = validatedFields.data

  try {
    await prisma.$transaction(async (tx) => {
      let photoUrl: string | undefined
      let photoTypeId: number | undefined

      if (newPhoto && newPhoto.size > 0) {
        // Handle photo upload: delete old, upload new
        const existingPhoto = await tx.photo.findFirst({
          where: {
            entityId: userId,
            entityTypeId: (await getCodeTable('entityType')).user.id,
            typeId: (await getCodeTable('photoType')).primary.id,
          },
        })

        if (existingPhoto?.url) {
          await deleteFile(existingPhoto.url)
          await tx.photo.delete({ where: { id: existingPhoto.id } })
        }

        const newPhotoKey = await uploadFile(newPhoto, 'user-photos', userId)
        await tx.photo.create({
          data: {
            url: newPhotoKey,
            entityTypeId: (await getCodeTable('entityType')).user.id,
            entityId: userId,
            typeId: (await getCodeTable('photoType')).primary.id,
            userId: managerId,
          },
        })
      }

      let hashedPassword
      if (password) {
        hashedPassword = await bcrypt.hash(password, 10)
      }

      const birthDateInfo = birthDate
        ? parseDateAndDeterminePrecision(birthDate)
        : null

      const deathDateInfo = deathDate
        ? parseDateAndDeterminePrecision(deathDate)
        : null

      const dataToUpdate: any = {
        firstName,
        lastName,
        gender: gender,
        birthDate: birthDateInfo?.date,
        birthDatePrecision: birthDateInfo?.precision,
        birthPlace: birthPlace,
        deathDate: deathDateInfo?.date,
        deathDatePrecision: deathDateInfo?.precision,
        deathPlace: deathPlace,
        managed: managedStatus,
      }

      if (managedStatus === ManagedStatus.partial) {
        dataToUpdate.email = email || undefined
        if (hashedPassword) {
          dataToUpdate.password = hashedPassword
        }
      }

      await tx.user.update({
        where: { id: userId },
        data: dataToUpdate,
      })
    })

    revalidatePath('/me/users')

    // After the transaction, fetch the updated user with the new photo URL
    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        photos: {
          where: { type: { code: 'primary' } },
          take: 1,
        },
      },
    })

    if (updatedUser && updatedUser.photos[0] && !updatedUser.photos[0].url.startsWith('https')) {
      updatedUser.photos[0].url = await getPublicUrl(updatedUser.photos[0].url)
    }

    return {
      success: true,
      message: 'User updated successfully.',
      redirectUrl: '/me/users',
      updatedUser: updatedUser as User & { photos: Photo[] },
    }
  } catch (error: any) {
    console.error('Failed to update user:', error)
    if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
      return { errors: { email: ['This email is already in use.'] } }
    }
    return { error: 'An unexpected error occurred. Please try again.' }
  }
}

export async function deleteManagedUser(userId: string) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  const managerId = session.user.id

  // Verify the user is a manager of the user to be deleted
  const managedUserRelation = await prisma.managedUser.findUnique({
    where: {
      managerId_managedId: {
        managerId,
        managedId: userId,
      },
    },
  })

  if (!managedUserRelation) {
    throw new Error('Forbidden')
  }

  // In a transaction, delete the user and all related data
  await prisma.$transaction(async (tx) => {
    // 1. Delete Photos from storage and database
    const entityTypes = await getCodeTable('entityType')
    const userEntityTypeId = entityTypes.user.id

    const photos = await tx.photo.findMany({
      where: { entityId: userId, entityTypeId: userEntityTypeId },
    })
    if (photos.length > 0) {
      const photoDeletePromises = photos.map((photo) => deleteFile(photo.url))
      await Promise.all(photoDeletePromises)
      await tx.photo.deleteMany({
        where: { entityId: userId, entityTypeId: userEntityTypeId },
      })
    }

    // 2. Delete UserUser relationships
    await tx.userUser.deleteMany({
      where: { OR: [{ user1Id: userId }, { user2Id: userId }] },
    })

    // 3. Delete GroupUser memberships
    await tx.groupUser.deleteMany({ where: { userId } })

    // 4. Delete Greetings
    await tx.greeting.deleteMany({
      where: { OR: [{ user1Id: userId }, { user2Id: userId }] },
    })

    // 5. Delete Messages
    await tx.message.deleteMany({ where: { userId } })

    // 6. Delete Codes
    await tx.code.deleteMany({ where: { userId } })

    // 7. Finally, delete the user. Prisma's onDelete: Cascade will handle
    // Accounts, Sessions, and ManagedUser entries.
    await tx.user.delete({ where: { id: userId } })
  })

  revalidatePath('/me/users')
  return { success: true, message: 'User deleted successfully.' }
}

export async function getManagers(userId: string) {
  const session = await auth()
  if (!session?.user?.id) {
    return []
  }

  const managers = await prisma.managedUser.findMany({
    where: { managedId: userId },
    include: {
      manager: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          photos: {
            where: { type: { code: 'primary' } },
            take: 1,
          },
        },
      },
    },
  })

  const managersWithPhotoUrls = await Promise.all(
    managers.map(async (m) => {
      const photoUrl = m.manager.photos[0]?.url
        ? await getPublicUrl(m.manager.photos[0].url)
        : null
      return {
        ...m.manager,
        photoUrl,
      }
    }),
  )

  return managersWithPhotoUrls
}

export async function addManager(managedUserId: string, managerUserId: string) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  // Optional: Add a check to ensure the current user has permission to add managers

  await prisma.managedUser.create({
    data: {
      managedId: managedUserId,
      managerId: managerUserId,
    },
  })

  revalidatePath(`/g/[slug]`) // Or a more specific path
  return { success: true, message: 'Manager added successfully.' }
}

export async function removeManager(
  managedUserId: string,
  managerUserId: string,
) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  // Prevent a manager from removing themselves
  if (session.user.id === managerUserId) {
    throw new Error('Cannot remove yourself as a manager.')
  }

  // Optional: Add a check to ensure the current user has permission to remove managers

  await prisma.managedUser.delete({
    where: {
      managerId_managedId: {
        managerId: managerUserId,
        managedId: managedUserId,
      },
    },
  })

  revalidatePath(`/g/[slug]`) // Or a more specific path
  return { success: true, message: 'Manager removed successfully.' }
}
