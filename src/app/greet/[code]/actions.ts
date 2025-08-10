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
  const user1Id =
    currentUserId < codeData.user.id ? currentUserId : codeData.user.id
  const user2Id =
    currentUserId > codeData.user.id ? currentUserId : codeData.user.id

  const [relationTypes, roleTypes] = await Promise.all([
    getCodeTable('userUserRelationType'),
    getCodeTable('groupUserRole'),
  ])

  await prisma.$transaction(async (tx) => {
    // 1. Create or update the UserUser relationship
    await tx.userUser.upsert({
      where: {
        user_relation_type_group_unique: {
          user1Id,
          user2Id,
          relationTypeId: relationTypes.acquaintance.id,
          groupId: codeData.groupId,
        },
      },
      update: {
        greetCount: { increment: 1 },
      },
      create: {
        user1Id,
        user2Id,
        groupId: codeData.groupId,
        relationTypeId: relationTypes.acquaintance.id,
        greetCount: 1,
      },
    })

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
        roleId: roleTypes.guest.id,
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
 * It creates a new user, establishes the relationship, and adds them to the group.
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

    await prisma.$transaction(async (tx) => {
      // 1. Create the new guest user
      const newUser = await tx.user.create({
        data: {
          username,
          password: hashedPassword,
          firstName,
        },
      })

      // 2. Create the UserUser relationship
      const user1Id =
        newUser.id < codeData.user.id ? newUser.id : codeData.user.id
      const user2Id =
        newUser.id > codeData.user.id ? newUser.id : codeData.user.id

      // 3. Create a default profile picture for the new user
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

      // 4. Create or update the UserUser relationship
      await tx.userUser.upsert({
        where: {
          user_relation_type_group_unique: {
            user1Id,
            user2Id,
            relationTypeId: relationTypes.acquaintance.id,
            groupId: codeData.groupId,
          },
        },
        update: {
          greetCount: { increment: 1 },
        },
        create: {
          user1Id,
          user2Id,
          groupId: codeData.groupId,
          relationTypeId: relationTypes.acquaintance.id,
          greetCount: 1,
        },
      })

      // 3. Add the new user to the group as a guest
      await tx.groupUser.create({
        data: {
          userId: newUser.id,
          groupId: codeData.groupId,
          roleId: roleTypes.guest.id,
        },
      })
    })

    // 4. After the transaction is successful, sign the new user in
    await signIn('credentials', {
      email: username,
      password: 'password123',
      redirect: false, // We will handle redirection on the client
    })

    return { success: true }
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
