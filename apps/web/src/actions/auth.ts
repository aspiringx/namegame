'use server'

import { auth } from '@/auth'
import { z } from 'zod'
import { nanoid } from 'nanoid'
import prisma from '@/lib/prisma'

const createLoginCodeSchema = z.object({
  userId: z.string().min(1, 'User ID is required.'),
  groupId: z.coerce
    .number()
    .int()
    .positive('Group ID must be a positive integer.'),
  groupSlug: z.string().min(1, 'Group slug is required.'),
})

export async function createLoginCode(formData: FormData) {
  try {
    const validatedFields = createLoginCodeSchema.safeParse({
      userId: formData.get('userId'),
      groupId: formData.get('groupId'),
      groupSlug: formData.get('groupSlug'),
    })

    if (!validatedFields.success) {
      return { error: 'Invalid input.' }
    }

    const { userId, groupId } = validatedFields.data

    const code = nanoid(32)

    await prisma.code.create({
      data: {
        userId,
        groupId,
        parentGroupId: groupId,
        code,
      },
    })

    return { code }
  } catch (error) {
    console.error('Failed to create login code:', error)
    return { error: 'A database error occurred.' }
  }
}

export async function getRecentGroups() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { groups: [] }
    }
    const userId = session.user.id

    const groupUsers = await prisma.groupUser.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: 5,
      include: {
        group: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
    })

    if (!groupUsers) {
      return { groups: [] }
    }

    const sortedGroups = groupUsers
      .map((gu) => gu.group)
      .sort((a, b) => a.name.localeCompare(b.name))

    return { groups: sortedGroups }
  } catch (error) {
    console.error('Failed to fetch recent groups:', error)
    return { error: 'A database error occurred.' }
  }
}
