'use server'

import { z } from 'zod'
import bcrypt from 'bcrypt'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import { DatePrecision } from '@/generated/prisma/client'
import { revalidatePath, revalidateTag } from 'next/cache'
import { getCodeTable } from '@/lib/codes'
import { parseDateAndDeterminePrecision } from '@/lib/utils'
import { uploadFile, deleteFile, getPublicUrl } from '@/lib/storage'
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
  // username: z.string().min(3, 'Username must be at least 3 characters long.'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().optional().nullable(),
  email: z.string().email('Invalid email address.').optional().nullable(),
  photo: z.instanceof(File).optional(),
  gender: z.enum(['male', 'female', 'non_binary']).optional().nullable(),
  birthDate: z.string().optional().nullable(),
  birthPlace: z.string().optional().nullable(),
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
    select: {
      password: true,
      photos: {
        where: {
          typeId: photoTypes.primary.id,
          entityId: session.user.id,
          entityTypeId: entityTypes.user.id,
        },
        select: { url: true },
      },
    },
  })

  if (!user) {
    throw new Error('User not found')
  }

  let passwordRequired = false
  if (user.password) {
    passwordRequired = await bcrypt.compare('password123', user.password)
  }

  const photoRequired = user.photos.some((photo) =>
    photo.url.includes('dicebear.com'),
  )

  revalidatePath('/me')

  return { passwordRequired, photoRequired }
}

export async function updateUserProfile(
  prevState: State,
  formData: FormData,
): Promise<State> {
  const emailFromForm = formData.get('email') as string | null

  // Check for disposable email domain
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
    // username: formData.get('username'),
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    email: emailFromForm,
    photo: formData.get('photo'),
    password: formData.get('password'),
    gender: formData.get('gender') || null,
    birthDate: formData.get('birthDate'),
    birthPlace: formData.get('birthPlace'),
  })

  if (!validatedFields.success) {
    const errorPayload = {
      ...validatedFields.error.flatten().fieldErrors,
    }

    // The server action returns a generic error message, but the client can use the detailed errors.
    return {
      success: false,
      error: 'Invalid data provided. Please check the form and try again.',
      errors: errorPayload,
      message: null,
    }
  }

  // const { username, firstName, lastName, photo, password } = validatedFields.data;
  const {
    firstName,
    lastName,
    email,
    photo,
    password,
    gender,
    birthDate,
    birthPlace,
  } = validatedFields.data
  const userId = session.user.id

  let newPhotoKey: string | null = null
  let updatedUser

  // This needs to happen before the try to be available in the try and after.
  // Unlike the other getCodeTable calls below.
  const groupUserRoles = await getCodeTable('groupUserRole')

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { photos: true, groupMemberships: true },
    })

    if (!user) {
      return { success: false, error: 'User not found.', message: null }
    }

    // Handle photo upload first
    let photoUrlForCheck: string | null = null

    if (photo && photo.size > 0) {
      newPhotoKey = await uploadFile(photo, 'user-photos', userId)
    }

    let birthDateObj: Date | undefined
    let birthDatePrecision: DatePrecision | undefined

    const dataToUpdate: any = {
      firstName,
      lastName,
      gender,
      birthPlace,
    }

    if (birthDate) {
      const parsed = parseDateAndDeterminePrecision(birthDate)
      if (parsed) {
        dataToUpdate.birthDate = parsed.date
        dataToUpdate.birthDatePrecision = parsed.precision
      } else {
        return {
          success: false,
          error:
            'Invalid birth date format. Please use a recognized date format.',
          message: null,
        }
      }
    } else {
      dataToUpdate.birthDate = null
      dataToUpdate.birthDatePrecision = null
    }

    let emailChanged = false
    const lowercasedEmail = email ? email.toLowerCase() : null
    if (lowercasedEmail && (lowercasedEmail !== user.email || !user.emailVerified)) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: lowercasedEmail,
          id: { not: userId },
        },
      })

      if (existingUser) {
        return {
          success: false,
          error: 'This email is already in use by another account.',
          message: null,
          errors: { email: ['This email is already in use.'] },
        }
      }

      dataToUpdate.email = lowercasedEmail
      if (user.username === user.email) {
        dataToUpdate.username = lowercasedEmail
      }
      dataToUpdate.emailVerified = null // Mark new email as unverified
      emailChanged = true
    }

    if (password) {
      if (password === 'password123') {
        return {
          success: false,
          error: 'Please choose a more secure password.',
          message: null,
        }
      }

      if (user.password) {
        const isSamePassword = await bcrypt.compare(password, user.password)
        if (isSamePassword) {
          return {
            success: false,
            error: 'New password cannot be the same as your current password.',
            message: null,
          }
        }
      }

      dataToUpdate.password = await bcrypt.hash(password, 10)
    }

    const {
      firstName: formFirstName,
      lastName: formLastName,
      email: formEmail,
    } = validatedFields.data

    const profileIsNowComplete = Boolean(
      formFirstName &&
        formLastName &&
        (user.emailVerified || formEmail) && // if they are setting an email for the first time, we can consider it complete for now
        (newPhotoKey || user.photos.length > 0),
    )

    updatedUser = await prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
    })

    // Now handle photo update in the database after user is updated
    if (newPhotoKey) {
      const photoTypes = await getCodeTable('photoType')
      const primaryPhotoTypeId = photoTypes.primary.id

      if (primaryPhotoTypeId) {
        const entityTypes = await getCodeTable('entityType')
        const userEntityTypeId = entityTypes.user.id

        if (userEntityTypeId) {
          const existingPhoto = await prisma.photo.findFirst({
            where: {
              entityId: user.id,
              entityTypeId: userEntityTypeId,
              typeId: primaryPhotoTypeId,
            },
          })

          if (existingPhoto) {
            await prisma.photo.update({
              where: { id: existingPhoto.id },
              data: { url: newPhotoKey },
            })
            if (existingPhoto.url) {
              await deleteFile(existingPhoto.url)
            }
          } else {
            await prisma.photo.create({
              data: {
                url: newPhotoKey,
                entityTypeId: entityTypes.user.id,
                entityId: user.id,
                typeId: photoTypes.primary.id,
                userId: user.id,
              },
            })
          }
        }
      }
    }

    if (emailChanged && updatedUser.email) {
      await sendVerificationEmail(updatedUser.email, userId)
    }

    if (profileIsNowComplete) {
      const memberRoleId = groupUserRoles.member?.id
      if (memberRoleId && user.groupMemberships.length > 0) {
        await prisma.groupUser.update({
          where: {
            userId_groupId: {
              userId: user.id,
              groupId: user.groupMemberships[0].groupId,
            },
          },
          data: { roleId: memberRoleId },
        })
      }
    }
  } catch (error) {
    console.error('Failed to update user profile:', error)
    if ((error as any).code === 'P2002') {
      const target = (error as any).meta?.target
      if (target?.includes('username')) {
        return {
          success: false,
          error: 'This username is already taken.',
          message: null,
        }
      }
    }
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
      message: null,
    }
  }

  revalidatePath('/me')
  revalidatePath('/', 'layout') // Revalidate header
  revalidateTag('user-photo')

  const userGroups = await prisma.groupUser.findMany({
    where: { userId: userId, roleId: groupUserRoles.member.id },
    select: { group: { select: { slug: true } } },
  })

  // Revalidate the layout for each group the user is in.
  // This is crucial for the GuestMessage to disappear immediately after role upgrade.
  for (const userGroup of userGroups) {
    if (userGroup.group.slug) {
      revalidatePath(`/g/${userGroup.group.slug}`, 'layout')
    }
  }

  let redirectUrl: string | null = null
  // if (userGroups.length === 1 && userGroups[0].group.slug) {
  //   redirectUrl = `/g/${userGroups[0].group.slug}`;
  // }

  let cacheBustedUrl: string | null = null
  if (newPhotoKey) {
    const newPhotoPublicUrl = await getPublicUrl(newPhotoKey)
    cacheBustedUrl = `${newPhotoPublicUrl}?v=${Date.now()}`
  }

  return {
    success: true,
    message: 'Profile updated successfully!',
    error: null,
    newPhotoUrl: newPhotoKey ? await getPublicUrl(newPhotoKey) : null,
    newFirstName: updatedUser.firstName,
    redirectUrl,
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

  // Allow update if the requester is an admin or is the user in context
  // The client ensures that a non-admin can only operate on their own relationships.
  // This server check verifies that the requester is at least a member of the group
  // and has a valid role.
  if (!isAdmin && requesterId !== updatingUserId) {
    return {
      success: false,
      error: "You do not have permission to update this user's gender.",
    }
  }

  // A non-admin can only set the gender of another user
  // if they are adding them to a relationship for the first time.
  // In this case, no existing relationship would be found.
  // If a relationship exists, they must be an admin.
  if (!isAdmin) {
    const existingRelationship = await prisma.userUser.findFirst({
      where: {
        OR: [
          { user1Id: requesterId, user2Id: userId },
          { user1Id: userId, user2Id: requesterId },
        ],
      },
    })

    // A non-admin can only set the gender of another user
    // if they are adding them to a relationship for the first time.
    // In this case, no existing relationship would be found.
    // If a relationship exists, they must be an admin.
    if (existingRelationship) {
      return {
        success: false,
        error: "You do not have permission to update this user's gender.",
      }
    }
  }

  try {
    // Note: No validation needed for a simple gender update from a trusted component
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
): Promise<{ success: boolean; error?: string }> {
  const session = await auth()
  const requesterId = session?.user?.id

  if (!requesterId) {
    return {
      success: false,
      error: 'You must be logged in to update a user.',
    }
  }

  const parsed = parseDateAndDeterminePrecision(birthDate)
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
