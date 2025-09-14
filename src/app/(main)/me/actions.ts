'use server'

import { z } from 'zod'
import bcrypt from 'bcrypt'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import { revalidatePath, revalidateTag } from 'next/cache'
import { getCodeTable } from '@/lib/codes'
import { parseDateAndDeterminePrecision } from '@/lib/utils'
import { getPhotoUrl } from '@/lib/photos'
import { uploadFile, deleteFile, UploadedUrls } from '@/lib/actions/storage'
import { sendVerificationEmail } from '@/lib/mail'
import { disposableEmailDomains } from '@/lib/disposable-email-domains'

export type State = {
  success: boolean
  message: string | null
  error?: string | null
  errors?: {
    firstName?: string[]
    lastName?: string[]
    email?: string[]
    password?: string[]
    photo?: string[]
    gender?: string[]
    birthDate?: string[]
    birthPlace?: string[]
  } | null
  newPhotoUrl?: string | null
  newFirstName?: string | null
  redirectUrl?: string | null
  emailUpdated?: boolean
}

const UserProfileSchema = z.object({
  password: z
    .string()
    .optional()
    .nullable()
    .refine((password) => {
      if (!password) return true // Allow empty password
      return (
        password.length >= 6 && /[a-zA-Z]/.test(password) && /\d/.test(password)
      )
    }, 'Password must be at least 6 characters and include both letters and numbers.'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.preprocess(
    (val) => (val === '' ? null : val),
    z.string().email('Invalid email address.').optional().nullable(),
  ),
  photo: z.instanceof(File).optional(),
  gender: z.enum(['male', 'female', 'non_binary']).optional().nullable(),
  birthDate: z.string().optional().nullable(),
  birthPlace: z.string().optional().nullable(),
  timezone: z.string().optional(),
})

export async function getUserUpdateRequirements(): Promise<{
  passwordRequired: boolean
  photoRequired: boolean
}> {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error('User not authenticated')
  }

  const [entityTypes, photoTypes] = await Promise.all([
    getCodeTable('entityType'),
    getCodeTable('photoType'),
  ])

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { password: true },
  })

  if (!user) {
    throw new Error('User not found')
  }

  const primaryPhoto = await prisma.photo.findFirst({
    where: {
      entityId: session.user.id,
      entityTypeId: entityTypes.user.id,
      typeId: photoTypes.primary.id,
    },
    select: {
      id: true,
      url: true,
      url_thumb: true,
      url_small: true,
      url_medium: true,
      url_large: true,
      entityId: true,
      entityTypeId: true,
      typeId: true,
      isBlocked: true,
      uploadedAt: true,
      createdAt: true,
      deletedAt: true,
      userId: true,
      groupId: true,
    },
  })

  let passwordRequired = false
  if (user.password) {
    passwordRequired = await bcrypt.compare('password123', user.password)
  }

  const photoRequired =
    !primaryPhoto || primaryPhoto.url.includes('dicebear.com')

  revalidatePath('/me')

  return { passwordRequired, photoRequired }
}

export async function updateUserProfile(
  prevState: State,
  formData: FormData,
): Promise<State> {
  const emailFromForm = formData.get('email') as string | null

  if (emailFromForm) {
    const domain = emailFromForm.split('@')[1]
    if (domain && disposableEmailDomains.has(domain.toLowerCase())) {
      return {
        success: false,
        message: null,
        error:
          'Please use a permanent email address. Disposable emails are not allowed.',
        errors: {
          email: [
            'Please use a permanent email address. Disposable emails are not allowed.',
          ],
        },
      }
    }
  }
  const session = await auth()
  if (!session?.user?.id) {
    return {
      success: false,
      error: 'You must be logged in to update your profile.',
      message: null,
    }
  }

  const validatedFields = UserProfileSchema.safeParse({
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    email: emailFromForm,
    photo: formData.get('photo'),
    password: formData.get('password'),
    gender: formData.get('gender') || null,
    birthDate: formData.get('birthDate'),
    birthPlace: formData.get('birthPlace'),
    timezone: formData.get('timezone'),
  })

  if (!validatedFields.success) {
    return {
      success: false,
      error: 'Invalid data provided. Please check the form and try again.',
      errors: validatedFields.error.flatten().fieldErrors,
      message: null,
    }
  }

  const {
    firstName,
    lastName,
    email,
    photo,
    password,
    gender,
    birthDate,
    birthPlace,
    timezone,
  } = validatedFields.data
  const userId = session.user.id

  let newPhotoKeys: UploadedUrls | null = null
  let updatedUser
  let emailChanged = false

  if (photo && photo.size > 0) {
    try {
      newPhotoKeys = await uploadFile(photo, 'user-photos', userId)
    } catch (uploadError) {
      console.error('Photo upload failed:', uploadError)
      return {
        success: false,
        error: 'Failed to upload photo. Please try again.',
        message: null,
      }
    }
  }

  const groupUserRoles = await getCodeTable('groupUserRole')
  let photoToDelete = null

  try {
    updatedUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        include: { groupMemberships: true },
      })

      if (!user) {
        throw new Error('User not found.')
      }

      const dataToUpdate: any = {
        firstName,
        lastName,
        gender,
        birthPlace,
      }

      if (birthDate) {
        const parsed = parseDateAndDeterminePrecision(birthDate, timezone)
        if (parsed) {
          dataToUpdate.birthDate = parsed.date
          dataToUpdate.birthDatePrecision = parsed.precision
        } else {
          throw new Error('Invalid birth date format.')
        }
      } else {
        dataToUpdate.birthDate = null
        dataToUpdate.birthDatePrecision = null
      }

      const lowercasedEmail = email ? email.toLowerCase() : null

      if (lowercasedEmail !== user.email?.toLowerCase()) {
        dataToUpdate.email = lowercasedEmail
        dataToUpdate.emailVerified = null
        emailChanged = true

        if (lowercasedEmail) {
          const existingUser = await tx.user.findFirst({
            where: {
              email: { equals: lowercasedEmail, mode: 'insensitive' },
              id: { not: userId },
            },
          })
          if (existingUser) {
            throw new Error('This email is already in use by another account.')
          }
        }
      }

      if (password) {
        if (password === 'password123') {
          throw new Error('Please choose a more secure password.')
        }
        if (user.password) {
          const isSamePassword = await bcrypt.compare(password, user.password)
          if (isSamePassword) {
            throw new Error(
              'New password cannot be the same as your current password.',
            )
          }
        }
        dataToUpdate.password = await bcrypt.hash(password, 10)
      }

      const internalUpdatedUser = await tx.user.update({
        where: { id: userId },
        data: dataToUpdate,
      })

      if (newPhotoKeys) {
        const [photoTypes, entityTypes] = await Promise.all([
          getCodeTable('photoType'),
          getCodeTable('entityType'),
        ])
        const primaryPhotoTypeId = photoTypes.primary.id
        const userEntityTypeId = entityTypes.user.id

        if (primaryPhotoTypeId && userEntityTypeId) {
          const existingPhoto = await tx.photo.findFirst({
            where: {
              entityId: user.id,
              entityTypeId: userEntityTypeId,
              typeId: primaryPhotoTypeId,
            },
          })

          if (existingPhoto) {
            photoToDelete = existingPhoto
            await tx.photo.update({
              where: { id: existingPhoto.id },
              data: { ...newPhotoKeys },
            })
          } else {
            await tx.photo.create({
              data: {
                ...newPhotoKeys,
                entityTypeId: userEntityTypeId,
                entityId: user.id,
                typeId: primaryPhotoTypeId,
                userId: user.id,
              },
            })
          }
        }
      }

      if (emailChanged && internalUpdatedUser.email) {
        await sendVerificationEmail(
          internalUpdatedUser.email,
          userId,
          internalUpdatedUser.firstName,
        )
      }

      const { firstName: formFirstName, lastName: formLastName } =
        validatedFields.data
      const primaryPhoto = await tx.photo.findFirst({
        where: {
          entityId: user.id,
          entityTypeId: (await getCodeTable('entityType')).user.id,
          typeId: (await getCodeTable('photoType')).primary.id,
        },
        select: { id: true },
      })

      const profileIsNowComplete = Boolean(
        formFirstName &&
          formLastName &&
          user.emailVerified &&
          (newPhotoKeys || primaryPhoto),
      )

      if (profileIsNowComplete) {
        const memberRoleId = groupUserRoles.member?.id
        const guestRoleId = groupUserRoles.guest?.id
        if (memberRoleId && guestRoleId && user.groupMemberships.length > 0) {
          await tx.groupUser.updateMany({
            where: { userId: user.id, roleId: guestRoleId },
            data: { roleId: memberRoleId },
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

    console.error('Failed to update user profile:', error)
    return {
      success: false,
      error: error.message || 'An unexpected error occurred. Please try again.',
      message: null,
    }
  }

  revalidatePath('/me')
  revalidatePath('/', 'layout')
  revalidateTag('user-photo')

  const userGroups = await prisma.groupUser.findMany({
    where: { userId: userId, roleId: groupUserRoles.member.id },
    select: { group: { select: { slug: true } } },
  })

  for (const userGroup of userGroups) {
    if (userGroup.group.slug) {
      revalidatePath(`/g/${userGroup.group.slug}`, 'layout')
    }
  }

  let redirectUrl: string | null = null

  const primaryPhoto = await prisma.photo.findFirst({
    where: {
      entityId: userId,
      entityTypeId: (await getCodeTable('entityType')).user.id,
      typeId: (await getCodeTable('photoType')).primary.id,
    },
  })

  const currentPhotoUrl = await getPhotoUrl(primaryPhoto, 'thumb')

  return {
    success: true,
    message: 'Profile updated successfully!',
    error: null,
    newPhotoUrl: newPhotoKeys
      ? `${currentPhotoUrl}?v=${Date.now()}`
      : currentPhotoUrl,
    newFirstName: updatedUser.firstName,
    redirectUrl,
    emailUpdated: emailChanged,
  }
}

export async function updateUserGender(
  userId: string, // This is user2Id
  gender: 'male' | 'female' | 'non_binary' | null,
  groupSlug: string,
  updatingUserId: string,
): Promise<{
  success: boolean
  error?: string
}> {
  const session = await auth()
  const requesterId = session?.user?.id

  if (!requesterId) {
    return {
      success: false,
      error: 'You must be logged in to update a user.',
    }
  }

  const groupUserRoles = await getCodeTable('groupUserRole')

  const requesterGroupUser = await prisma.groupUser.findFirst({
    where: { user: { id: requesterId }, group: { slug: groupSlug } },
    select: { roleId: true },
  })

  const isAdmin = requesterGroupUser?.roleId === groupUserRoles.admin.id

  if (!isAdmin && requesterId !== updatingUserId) {
    return {
      success: false,
      error: "You do not have permission to update this user's gender.",
    }
  }

  if (!isAdmin) {
    const existingRelationship = await prisma.userUser.findFirst({
      where: {
        OR: [
          { user1Id: requesterId, user2Id: userId },
          { user1Id: userId, user2Id: requesterId },
        ],
      },
    })

    if (existingRelationship) {
      return {
        success: false,
        error: "You do not have permission to update this user's gender.",
      }
    }
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { gender },
    })
    revalidatePath('/', 'layout')
    return { success: true }
  } catch (error) {
    console.error('Failed to update user gender:', error)
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    }
  }
}

export async function updateUserBirthDate(
  userId: string,
  birthDate: string,
  groupSlug: string,
  timezone?: string,
): Promise<{ success: boolean; error?: string }> {
  const session = await auth()
  const requesterId = session?.user?.id

  if (!requesterId) {
    return {
      success: false,
      error: 'You must be logged in to update a user.',
    }
  }

  const parsed = parseDateAndDeterminePrecision(birthDate, timezone)
  if (!parsed) {
    return { success: false, error: 'Invalid date format.' }
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        birthDate: parsed.date,
        birthDatePrecision: parsed.precision,
      },
    })
    revalidatePath(`/g/${groupSlug}/family`)
    return { success: true }
  } catch (error) {
    console.error('Failed to update user birth date:', error)
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    }
  }
}

export async function leaveGroup(groupId: string): Promise<{
  success: boolean
  error?: string
}> {
  const session = await auth()
  if (!session?.user?.id) {
    return {
      success: false,
      error: 'You must be logged in to leave a group.',
    }
  }

  const numericGroupId = parseInt(groupId, 10)
  if (isNaN(numericGroupId)) {
    return {
      success: false,
      error: 'Invalid group ID.',
    }
  }

  try {
    await prisma.groupUser.delete({
      where: {
        userId_groupId: {
          userId: session.user.id,
          groupId: numericGroupId,
        },
      },
    })

    revalidatePath('/me/groups')

    return { success: true }
  } catch (error) {
    console.error('Failed to leave group:', error)
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    }
  }
}

export async function resendVerificationEmail(): Promise<{
  success: boolean
  message: string
}> {
  const session = await auth()
  if (!session?.user?.id) {
    return {
      success: false,
      message: 'You must be logged in to resend a verification email.',
    }
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, firstName: true, emailVerified: true },
  })

  if (!user) {
    return { success: false, message: 'User not found.' }
  }

  if (user.emailVerified) {
    return { success: false, message: 'Your email is already verified.' }
  }

  if (!user.email) {
    return { success: false, message: 'You do not have an email set.' }
  }

  try {
    await sendVerificationEmail(user.email, session.user.id, user.firstName)
    return {
      success: true,
      message: `Verification email sent to ${user.email}.`,
    }
  } catch (error) {
    console.error('Failed to resend verification email:', error)
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again.',
    }
  }
}
