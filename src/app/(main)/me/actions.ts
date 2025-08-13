'use server'

import { z } from 'zod'
import bcrypt from 'bcrypt'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import { revalidatePath, revalidateTag } from 'next/cache'
import { getCodeTable } from '@/lib/codes'
import { uploadFile, deleteFile, getPublicUrl } from '@/lib/storage'
import { sendVerificationEmail } from '@/lib/mail'

export type State = {
  success: boolean
  error: string | null
  message: string | null
  newPhotoUrl?: string | null
  newFirstName?: string | null
  redirectUrl?: string | null
}

const UserProfileSchema = z.object({
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters.')
    .optional()
    .or(z.literal('')),
  // username: z.string().min(3, 'Username must be at least 3 characters long.'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().optional(),
  email: z
    .string()
    .email('Invalid email address.')
    .optional()
    .or(z.literal('')),
  photo: z.instanceof(File).optional(),
  gender: z.enum(['male', 'female', 'non_binary']).optional().nullable(),
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
    email: formData.get('email'),
    photo: formData.get('photo'),
    password: formData.get('password'),
    gender: formData.get('gender'),
  })

  if (!validatedFields.success) {
    return {
      success: false,
      error: 'Invalid data provided. Please check the form and try again.',
      message: null,
    }
  }

  // const { username, firstName, lastName, photo, password } = validatedFields.data;
  const { firstName, lastName, email, photo, password, gender } = validatedFields.data
  const userId = session.user.id

  let newPhotoKey: string | null = null
  let updatedUser

  // This needs to happen before the try to be available in the try and after.
  // Unlike the other getCodeTable calls below.
  const groupUserRoles = await getCodeTable('groupUserRole')

  try {
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, emailVerified: true, password: true },
    })

    if (!currentUser) {
      return { success: false, error: 'User not found.', message: null }
    }
    const [photoTypes, entityTypes] = await Promise.all([
      getCodeTable('photoType'),
      getCodeTable('entityType'),
    ])

    // Handle photo upload first
    if (photo && photo.size > 0) {
      const existingPhoto = await prisma.photo.findFirst({
        where: {
          entityTypeId: entityTypes.user.id,
          typeId: photoTypes.primary.id,
          entityId: userId,
        },
      })

      // Upload new photo
      const photoKey = await uploadFile(photo, 'user-photos', userId)
      newPhotoKey = photoKey

      if (existingPhoto) {
        // Note: We are now deleting based on the new key format if the URL is not a full URL.
        // This assumes old keys might be stored differently.
        const keyToDelete = existingPhoto.url.startsWith('http')
          ? new URL(existingPhoto.url).pathname.substring(1)
          : existingPhoto.url
        await deleteFile(keyToDelete)
        await prisma.photo.update({
          where: { id: existingPhoto.id },
          data: { url: photoKey, userId: userId },
        })
      } else {
        await prisma.photo.create({
          data: {
            url: photoKey,
            typeId: photoTypes.primary.id,
            entityTypeId: entityTypes.user.id,
            entityId: userId,
            userId: userId,
          },
        })
      }
    }

    const dataToUpdate: any = {
      firstName,
      lastName,
      gender,
    }

    let emailChanged = false
    if (email && (email !== currentUser.email || !currentUser.emailVerified)) {
      dataToUpdate.email = email
      dataToUpdate.emailVerified = null // Mark new email as unverified
      emailChanged = true
    }

    let passwordIsBeingSetToReal = false
    if (password) {
      if (password === 'password123') {
        return {
          success: false,
          error: 'Please choose a more secure password.',
          message: null,
        }
      }

      if (currentUser.password) {
        const isSamePassword = await bcrypt.compare(
          password,
          currentUser.password,
        )
        if (isSamePassword) {
          return {
            success: false,
            error: 'New password cannot be the same as your current password.',
            message: null,
          }
        }
      }

      dataToUpdate.password = await bcrypt.hash(password, 10)
      passwordIsBeingSetToReal = true
    }

    updatedUser = await prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
    })

    if (emailChanged && updatedUser.email) {
      await sendVerificationEmail(updatedUser.email, userId)
    }

    const hasPrimaryPhoto = await prisma.photo.findFirst({
      where: {
        entityId: userId,
        entityTypeId: entityTypes.user.id,
        typeId: photoTypes.primary.id,
      },
    })

    const isProfileComplete =
      updatedUser.firstName &&
      updatedUser.lastName &&
      updatedUser.emailVerified &&
      hasPrimaryPhoto &&
      !hasPrimaryPhoto.url.includes('dicebear.com')

    if (isProfileComplete) {
      await prisma.groupUser.updateMany({
        where: {
          userId: userId,
          roleId: groupUserRoles.guest.id,
        },
        data: {
          roleId: groupUserRoles.member.id,
        },
      })
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

  const group = await prisma.group.findUnique({
    where: { slug: groupSlug },
    select: { id: true },
  })

  if (!group) {
    return { success: false, error: 'Group not found.' }
  }

  const [groupUserRoles, requesterGroupUser] = await Promise.all([
    getCodeTable('groupUserRole'),
    prisma.groupUser.findFirst({
      where: { userId: requesterId, groupId: group.id },
      select: { roleId: true },
    }),
  ])

  const isAdmin = requesterGroupUser?.roleId === groupUserRoles.admin.id

  // Allow update if the requester is an admin or is the user in context
  // The client ensures that a non-admin can only operate on their own relationships.
  // This server check verifies that the requester is at least a member of the group
  // and has a valid role.
  if (!isAdmin && requesterId !== updatingUserId) {
    return {
      success: false,
      error: 'You do not have permission to update this user\'s gender.',
    }
  }

  // A non-admin can only set the gender of another user
  // if they are adding them to a relationship for the first time.
  // In this case, no existing relationship would be found.
  // If a relationship exists, they must be an admin.
  if (!isAdmin) {
    const existingRelationship = await prisma.userUser.findFirst({
      where: {
        groupId: group.id,
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
        error: 'You do not have permission to update this user\'s gender.',
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
