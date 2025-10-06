'use server'

import prisma from '@/lib/prisma'
import { getPhotoUrl } from '@/lib/photos'
import { getCodeTable } from '@/lib/codes'
import { auth } from '@/auth'

export async function getGroupMemberPhotos(userIds: string[]) {
  if (userIds.length === 0) {
    return new Map<string, string>()
  }

  const entityTypes = await getCodeTable('entityType')
  const photoTypes = await getCodeTable('photoType')

  const photos = await prisma.photo.findMany({
    where: {
      entityId: { in: userIds },
      entityTypeId: entityTypes.user.id,
      typeId: photoTypes.primary.id,
    },
  })

  const photoMap = new Map<string, string>()
  
  await Promise.all(
    photos.map(async (photo) => {
      const photoUrl = await getPhotoUrl(photo, { size: 'thumb' })
      if (photoUrl) {
        photoMap.set(photo.entityId, photoUrl)
      }
    })
  )

  return photoMap
}

export async function getUserConnections() {
  const session = await auth()
  if (!session?.user?.id) {
    return []
  }

  const userId = session.user.id

  // Get UserUser relationships where current user is user1 or user2
  const connections = await prisma.userUser.findMany({
    where: {
      OR: [
        { user1Id: userId },
        { user2Id: userId },
      ],
    },
    include: {
      user1: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      user2: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  })

  // Map to get the "other" user and format the data
  const users = connections.map((conn) => {
    const otherUser = conn.user1Id === userId ? conn.user2 : conn.user1
    const firstName = otherUser.firstName || ''
    const lastName = otherUser.lastName || ''
    const name = lastName ? `${firstName} ${lastName}`.trim() : firstName
    
    return {
      id: otherUser.id,
      firstName,
      lastName,
      name,
    }
  })

  // Sort by lastName, then firstName
  users.sort((a, b) => {
    const lastNameCompare = a.lastName.localeCompare(b.lastName)
    if (lastNameCompare !== 0) return lastNameCompare
    return a.firstName.localeCompare(b.firstName)
  })

  return users
}

export async function updateConversationName(conversationId: string, name: string) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  // Verify user is a participant in this conversation
  const participant = await prisma.chatParticipant.findFirst({
    where: {
      conversationId,
      userId: session.user.id,
    },
  })

  if (!participant) {
    throw new Error('Not a participant in this conversation')
  }

  // Update conversation name (limit to 30 characters)
  const trimmedName = name.trim().slice(0, 30)
  const conversation = await prisma.chatConversation.update({
    where: { id: conversationId },
    data: { name: trimmedName || null }, // Set to null if empty
  })

  return { success: true, name: conversation.name }
}
