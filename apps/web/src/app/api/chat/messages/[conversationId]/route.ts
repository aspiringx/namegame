import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import { getCodeTable } from '@/lib/codes'
import { getPhotoUrl } from '@/lib/photos'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { conversationId } = await params
    const { searchParams } = new URL(request.url)
    const cursor = searchParams.get('cursor') // Message ID to load before

    // Verify user is a participant in this conversation
    const conversation = await prisma.chatConversation.findFirst({
      where: {
        id: conversationId,
        participants: {
          some: {
            userId: session.user.id
          }
        }
      }
    })

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    // Get messages (most recent 50, or 50 before cursor)
    const messages = await prisma.chatMessage.findMany({
      where: {
        conversationId,
        ...(cursor ? { id: { lt: cursor } } : {}) // Load messages before cursor
      },
      orderBy: {
        createdAt: 'desc' // Get newest first
      },
      take: 50, // Limit to 50 messages
      include: {
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    })

    // Reverse to show oldest first in UI
    messages.reverse()
    
    const hasMore = messages.length === 50 // If we got 50, there might be more

    // Load photos for all authors
    const [photoTypes, entityTypes] = await Promise.all([
      getCodeTable('photoType'),
      getCodeTable('entityType'),
    ])

    // Get unique author IDs and load their user data
    const authorIds = [...new Set(messages.map(m => m.authorId))]
    const users = await prisma.user.findMany({
      where: {
        id: { in: authorIds }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true
      }
    })
    
    const usersByIdMap = new Map(users.map(u => [u.id, u]))
    
    // Load photos for authors
    const photos = await prisma.photo.findMany({
      where: {
        entityId: { in: authorIds },
        entityTypeId: entityTypes.user.id,
        typeId: photoTypes.primary.id,
      },
    })

    const photosByUserId = new Map(photos.map(p => [p.entityId, p]))

    // Build messages with photo URLs and reactions
    const messagesWithPhotos = await Promise.all(
      messages.map(async (msg) => {
        const user = usersByIdMap.get(msg.authorId)
        const primaryPhoto = photosByUserId.get(msg.authorId)
        const photoUrl = await getPhotoUrl(primaryPhoto || null, { size: 'thumb' })

        // Group reactions by emoji
        const reactionsByEmoji = new Map<string, { emoji: string; count: number; userIds: string[]; users: { id: string; name: string }[] }>()
        
        msg.reactions.forEach(reaction => {
          const existing = reactionsByEmoji.get(reaction.emoji)
          const userName = `${reaction.user.firstName} ${reaction.user.lastName || ''}`.trim()
          
          if (existing) {
            existing.count++
            existing.userIds.push(reaction.userId)
            existing.users.push({ id: reaction.userId, name: userName })
          } else {
            reactionsByEmoji.set(reaction.emoji, {
              emoji: reaction.emoji,
              count: 1,
              userIds: [reaction.userId],
              users: [{ id: reaction.userId, name: userName }]
            })
          }
        })

        return {
          id: msg.id,
          content: msg.content,
          type: msg.type,
          authorId: msg.authorId,
          authorName: user ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Unknown User',
          authorPhoto: photoUrl,
          createdAt: msg.createdAt.toISOString(),
          timestamp: msg.createdAt,
          reactions: Array.from(reactionsByEmoji.values())
        }
      })
    )

    return NextResponse.json({
      messages: messagesWithPhotos,
      hasMore
    })

  } catch (error) {
    console.error('[API] Error fetching messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}
