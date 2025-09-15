'use server'

import { z } from 'zod'
import {
  Gender,
  ManagedStatus,
  User,
  Photo,
  GroupUser,
} from '@/generated/prisma/client'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import bcrypt from 'bcrypt'
import { uploadFile, deleteFile, UploadedUrls } from '@/lib/actions/storage'
import { revalidatePath } from 'next/cache'
import crypto from 'crypto'
import { parseDateAndDeterminePrecision } from '@/lib/utils'
import { getCodeTable } from '@/lib/codes'
import { getPhotoUrl } from '@/lib/photos'
import { Group, GroupType } from '@/generated/prisma/client'

export type ManagedUserWithPhoto = User & {
  primaryPhoto: (Photo & { url: string }) | null
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
  updatedUser?: User & { photos: (Photo & { url: string })[] }
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

  let photoKeys: UploadedUrls | null = null
  try {
    photoKeys = await uploadFile(photo, 'user-photos', `temp-${Date.now()}`)
  } catch (uploadError) {
    console.error('Photo upload failed:', uploadError)
    return { error: 'Failed to upload photo. Please try again.' }
  }

  try {
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
          ...photoKeys,
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
    if (photoKeys) {
      const orphanedPhoto = {
        ...photoKeys,
        url_thumb: photoKeys.url_thumb ?? null,
        url_small: photoKeys.url_small ?? null,
        url_medium: photoKeys.url_medium ?? null,
        url_large: photoKeys.url_large ?? null,
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

  const photoMap = new Map(photos.map((p) => [p.entityId, p]))

  const usersWithPhotos = await Promise.all(
    managedUserRelations.map(async (rel) => {
      const user = rel.managed
      const photo = photoMap.get(user.id)
      const photoUrl = await getPhotoUrl(photo || null, { size: 'thumb' })

      return {
        ...user,
        managedStatus: user.managed as ManagedStatus,
        primaryPhoto: photo ? { ...photo, url: photoUrl } : null,
      }
    }),
  )

  return usersWithPhotos
}

export async function getRelatedUsers(userId: string): Promise<User[]> {
  const userRelations = await prisma.userUser.findMany({
    where: {
      OR: [{ user1Id: userId }, { user2Id: userId }],
    },
    include: {
      user1: true,
      user2: true,
    },
  })

  const relatedUsers = userRelations.flatMap((relation) => {
    if (relation.user1Id === userId) {
      return relation.user2
    } else {
      return relation.user1
    }
  })

  // Deduplicate users
  const uniqueUsers = Array.from(
    new Map(relatedUsers.map((u) => [u.id, u])).values(),
  )

  return uniqueUsers
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

  const managedUserRelation = await prisma.managedUser.findUnique({
    where: {
      managerId_managedId: {
        managedId: userId,
        managerId: managerId,
      },
    },
  })

  if (!managedUserRelation) {
    return { message: 'Forbidden' }
  }

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

  let newPhotoKeys: UploadedUrls | null = null
  if (newPhoto && newPhoto.size > 0) {
    try {
      newPhotoKeys = await uploadFile(newPhoto, 'user-photos', userId)
    } catch (uploadError) {
      console.error('Photo upload failed:', uploadError)
      return { error: 'Failed to upload photo. Please try again.' }
    }
  }

  let photoToDelete: Photo | null = null

  try {
    await prisma.$transaction(async (tx) => {
      const [photoTypes, entityTypes] = await Promise.all([
        getCodeTable('photoType'),
        getCodeTable('entityType'),
      ])

      if (newPhotoKeys) {
        const existingPrimaryPhoto = await tx.photo.findFirst({
          where: {
            entityId: userId,
            entityTypeId: entityTypes.user.id,
            typeId: photoTypes.primary.id,
          },
        })

        if (existingPrimaryPhoto) {
          photoToDelete = existingPrimaryPhoto
          await tx.photo.update({
            where: { id: existingPrimaryPhoto.id },
            data: { ...newPhotoKeys },
          })
        } else {
          await tx.photo.create({
            data: {
              ...newPhotoKeys,
              entityTypeId: entityTypes.user.id,
              entityId: userId,
              typeId: photoTypes.primary.id,
              userId: managerId,
            },
          })
        }
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

    if (photoToDelete) {
      await deleteFile(photoToDelete)
    }

    revalidatePath('/me/users')

    const updatedUser = await prisma.user.findUnique({ where: { id: userId } })

    if (!updatedUser) {
      return { error: 'Could not find updated user.' }
    }

    const [photoTypes, entityTypes] = await Promise.all([
      getCodeTable('photoType'),
      getCodeTable('entityType'),
    ])

    const primaryPhoto = await prisma.photo.findFirst({
      where: {
        entityId: userId,
        entityTypeId: entityTypes.user.id,
        typeId: photoTypes.primary.id,
      },
    })

    const photoUrl = await getPhotoUrl(primaryPhoto, { size: 'thumb' })

    const updatedUserWithPhoto = {
      ...updatedUser,
      photos: primaryPhoto ? [{ ...primaryPhoto, url: photoUrl }] : [],
    }

    return {
      success: true,
      message: 'User updated successfully.',
      redirectUrl: '/me/users',
      updatedUser: updatedUserWithPhoto,
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
      const photoDeletePromises = photos.map((photo) => deleteFile(photo))
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

  const managedUserRelations = await prisma.managedUser.findMany({
    where: { managedId: userId },
    include: {
      manager: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  })

  const managers = managedUserRelations.map((rel) => rel.manager)
  if (managers.length === 0) {
    return []
  }

  const managerIds = managers.map((m) => m.id)

  const [photoTypes, entityTypes] = await Promise.all([
    getCodeTable('photoType'),
    getCodeTable('entityType'),
  ])

  const photos = await prisma.photo.findMany({
    where: {
      entityId: { in: managerIds },
      entityTypeId: entityTypes.user.id,
      typeId: photoTypes.primary.id,
    },
  })

  const photoMap = new Map(photos.map((p) => [p.entityId, p]))

  const managersWithPhotoUrls = await Promise.all(
    managers.map(async (manager) => {
      const photo = photoMap.get(manager.id)
      const photoUrl = await getPhotoUrl(photo || null, { size: 'thumb' })
      return {
        ...manager,
        photoUrl: photoUrl,
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

export async function getGroupsForCurrentUser(): Promise<
  (Group & { groupType: GroupType })[]
> {
  const session = await auth()
  if (!session?.user?.id) {
    console.error('No session found')
    return []
  }

  const groupUsers: (GroupUser & {
    group: Group & { groupType: GroupType }
  })[] = await prisma.groupUser.findMany({
    where: { userId: session.user.id },
    include: {
      group: {
        include: {
          groupType: true,
        },
      },
    },
  })

  return groupUsers.map((gu) => gu.group)
}

export async function getGroupMembers(
  groupId: number,
): Promise<(User & { photos: (Photo & { url: string })[] })[]> {
  const session = await auth()
  if (!session?.user?.id) {
    return []
  }

  const groupMembers = await prisma.groupUser.findMany({
    where: { groupId },
    include: { user: true },
  })

  const users = groupMembers.map((gm) => gm.user)
  if (users.length === 0) {
    return []
  }

  const userIds = users.map((u) => u.id)

  const [photoTypes, entityTypes] = await Promise.all([
    getCodeTable('photoType'),
    getCodeTable('entityType'),
  ])

  const photos = await prisma.photo.findMany({
    where: {
      entityId: { in: userIds },
      entityTypeId: entityTypes.user.id,
      typeId: photoTypes.primary.id,
    },
  })

  const photoMap = new Map(photos.map((p) => [p.entityId, p]))

  const usersWithPhotoUrls = await Promise.all(
    users.map(async (user) => {
      const photo = photoMap.get(user.id)
      const photoUrl = await getPhotoUrl(photo || null, { size: 'thumb' })
      return {
        ...user,
        photos: photo ? [{ ...photo, url: photoUrl }] : [],
      }
    }),
  )

  return usersWithPhotoUrls
}
