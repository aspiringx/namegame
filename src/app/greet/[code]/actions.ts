'use server'

import { auth } from '@/auth'
import { createId } from '@paralleldrive/cuid2'

import prisma from '@/lib/prisma'
import bcrypt from 'bcrypt'
import { signIn } from '@/auth'
import { getCodeTable } from '@/lib/codes'

// A helper type for the codeData object to avoid passing the full prisma type to the client
export interface CodeData {
  id: number
  userId: string
  parentGroupId: number
  groupId: number
  code: string
  user: {
    firstName: string | null
    id: string
  }
  group: {
    name: string
    slug: string
    id: number
    groupType: {
      code: string
    }
  }
}

/**
 * Handles the greeting logic when an authenticated user scans a code.
 * It creates or updates the relationship between the two users and
 * ensures the scanner is a member of the group.
 */
export async function handleAuthenticatedGreeting(
  codeData: CodeData,
  currentUserId: string,
) {

  const [relationTypes, roleTypes, photoTypes, entityTypes] = await Promise.all(
    [
      getCodeTable('userUserRelationType'),
      getCodeTable('groupUserRole'),
      getCodeTable('photoType'),
      getCodeTable('entityType'),
    ],
  )

  const currentUser = await prisma.user.findUnique({
    where: { id: currentUserId },
    include: { photos: true },
  })

  if (!currentUser) {
    // This should not happen for an authenticated user, but as a safeguard:
    throw new Error('Current user not found during authenticated greeting.')
  }

  const primaryPhoto = currentUser.photos.find(
    (p) =>
      p.typeId === photoTypes.primary.id &&
      p.entityTypeId === entityTypes.user.id &&
      p.entityId === currentUser.id,
  )

  const isGuest =
    !currentUser.firstName ||
    !currentUser.lastName ||
    !currentUser.emailVerified ||
    !primaryPhoto ||
    primaryPhoto.url.includes('dicebear.com')

  const roleId = isGuest ? roleTypes.guest.id : roleTypes.member.id

  await prisma.$transaction(async (tx) => {
    // 1. Determine the relation type based on the group type
    const relationTypeId = codeData.group.groupType.code === 'family'
      ? relationTypes.family.id
      : relationTypes.acquaintance.id;

    // 2. Create or update the UserUser relationship
    const existingRelation = await tx.userUser.findFirst({
      where: {
        OR: [
          { user1Id: currentUserId, user2Id: codeData.user.id },
          { user1Id: codeData.user.id, user2Id: currentUserId },
        ],
      },
    });

    if (existingRelation) {
      await tx.userUser.update({
        where: {
          id: existingRelation.id,
        },
        data: {
          greetCount: { increment: 1 },
        },
      });
    } else {
      // For non-directional relationships, sort IDs to prevent duplicates
      const user1Id = currentUserId < codeData.user.id ? currentUserId : codeData.user.id;
      const user2Id = currentUserId > codeData.user.id ? currentUserId : codeData.user.id;

      await tx.userUser.create({
        data: {
          user1Id,
          user2Id,
          relationTypeId: relationTypeId,
          greetCount: 1,
        },
      });
    }

    // 2. Ensure the scanning user is a member of the group
    await tx.groupUser.upsert({
      where: {
        userId_groupId: {
          userId: currentUserId,
          groupId: codeData.groupId,
        },
      },
      update: {},
      create: {
        userId: currentUserId,
        groupId: codeData.groupId,
        roleId: roleId, // Dynamically assign role
      },
    })
  })
}

/**
 * Handles the greeting and sign-up logic for a new, unauthenticated user.
 * It creates a new user, establishes the relationship, and adds them to the group.
 */
export async function createGreetingCode(groupId: number) {
  const session = await auth()

  if (!session?.user) {
    throw new Error('You must be logged in to create a greeting code.')
  }
  const user = session.user

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const newCode = await prisma.$transaction(async (tx) => {
    await tx.code.deleteMany({
      where: {
        userId: user.id,
        groupId: groupId,
        createdAt: {
          lt: sevenDaysAgo,
        },
      },
    })

    const code = createId()
    const createdCode = await tx.code.create({
      data: {
        userId: user.id,
        groupId: groupId,
        parentGroupId: groupId, // As per instructions
        code: code,
      },
    })

    return createdCode
  })

  return newCode
}

/**
 * Handles the greeting and sign-up logic for a new, unauthenticated user.
 * It creates a new user, adds the user-user relationship, and adds them to the
 * group from which the greeting code was generated.
 */
export async function handleGuestGreeting(
  firstName: string,
  codeData: CodeData,
) {
  const hashedPassword = await bcrypt.hash('password123', 10)
  const username = `guest-${firstName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`

  try {
    const [photoTypes, entityTypes, relationTypes, roleTypes] =
      await Promise.all([
        getCodeTable('photoType'),
        getCodeTable('entityType'),
        getCodeTable('userUserRelationType'),
        getCodeTable('groupUserRole'),
      ])

    // The transaction block. All database operations inside will succeed or fail together.
    await prisma.$transaction(async (tx) => {
      // 1. Create the new guest user
      const newUser = await tx.user.create({
        data: {
          username,
          password: hashedPassword,
          firstName,
        },
      })

      // 2. Create a default profile picture for the new user
      const avatarUrl = `https://api.dicebear.com/8.x/personas/png?seed=${newUser.id}`
      await tx.photo.create({
        data: {
          userId: newUser.id,
          entityTypeId: entityTypes.user.id,
          entityId: newUser.id,
          url: avatarUrl,
          typeId: photoTypes.primary.id,
        },
      })

      // 3. Create the UserUser relationship
      // For non-directional relationships, sort IDs to prevent duplicates
      const user1Id = codeData.user.id < newUser.id ? codeData.user.id : newUser.id;
      const user2Id = codeData.user.id > newUser.id ? codeData.user.id : newUser.id;

      const relationTypeId = codeData.group.groupType.code === 'family'
        ? relationTypes.family.id
        : relationTypes.acquaintance.id;

      // We don't use upsert here because we don't expect a relationship to exist for a new guest.
      await tx.userUser.create({
        data: {
          user1Id,
          user2Id,
          relationTypeId: relationTypeId,
          greetCount: 1,
        },
      });

      // 4. Add the new user to the group as a guest
      await tx.groupUser.create({
        data: {
          userId: newUser.id,
          groupId: codeData.groupId,
          roleId: roleTypes.guest.id,
        },
      })
    })

    // 5. AFTER the transaction is successful, attempt to sign the new user in.
    try {
      await signIn('credentials', {
        email: username,
        password: 'password123',
        redirect: false, // We will handle redirection on the client
      })
      // On successful sign-in, we still return the credentials in case the client needs them.
      return { success: true, credentials: { username, password: 'password123' } }
    } catch (signInError) {
      console.error('Sign-in after guest greeting failed:', signInError)
      // The account is created, but sign-in failed. Return credentials for retry.
      return {
        success: true, // The account creation was successful.
        signInFailed: true, // Signal that the auto-login failed.
        credentials: { username, password: 'password123' },
      }
    }
  } catch (error) {
    console.error('Guest greeting failed:', error)
    // Check for unique constraint violation on username, though it's highly unlikely
    if (
      error instanceof Error &&
      error.message.includes('Unique constraint failed')
    ) {
      return {
        success: false,
        error: 'A user with a similar name already exists. Please try again.',
      }
    }
    return {
      success: false,
      error: 'Could not create guest account. Please try again later.',
    }
  }
}
