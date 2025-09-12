'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'

import { getCodeTable } from '@/lib/codes'

export async function getGroupMembersForRelate(groupSlug: string) {
  const group = await prisma.group.findUnique({
    where: { slug: groupSlug },
    select: { members: { include: { user: true } } },
  })

  if (!group) {
    return []
  }

  return group.members.map((member) => ({
    ...member,
    user: {
      ...member.user,
      name: [member.user.firstName, member.user.lastName]
        .filter(Boolean)
        .join(' '),
    },
  }))
}

export async function createAcquaintanceRelationship(
  memberUserId: string,
  groupSlug: string,
) {
  const session = await auth()
  const currentUserId = session?.user?.id

  if (!currentUserId) {
    throw new Error('Not authenticated')
  }

  const [userUserRelationTypes] = await Promise.all([
    getCodeTable('userUserRelationType'),
  ])

  const acquaintanceRelationTypeId = userUserRelationTypes.acquaintance.id

  // Ensure consistent ordering of user IDs to prevent duplicate relationships
  const [user1Id, user2Id] = [currentUserId, memberUserId].sort()

  await prisma.userUser.create({
    data: {
      user1Id,
      user2Id,
      relationTypeId: acquaintanceRelationTypeId,
    },
  })

  revalidatePath(`/g/${groupSlug}`)
}
