'use server'

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
