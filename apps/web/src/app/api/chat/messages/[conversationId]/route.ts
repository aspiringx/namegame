import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import { getCodeTable } from '@/lib/codes'
import { getPhotoUrl } from '@/lib/photos'

// POST - Create a new message
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { conversationId } = await params
    const { content, type, metadata } = await request.json()

    // Verify user is a participant
    const conversation = await prisma.chatConversation.findFirst({
      where: {
        id: conversationId,
        participants: {
          some: { userId: session.user.id },
        },
      },
    })

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 },
      )
    }

    // Create message
    const message = await prisma.chatMessage.create({
      data: {
        conversationId,
        authorId: session.user.id,
        content: content || '',
        type: type || 'text',
        metadata: metadata || null,
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    // Notify via PostgreSQL for socket broadcast
    await prisma.$executeRaw`
      SELECT pg_notify('new_message', ${JSON.stringify({
        messageId: message.id,
        conversationId: message.conversationId,
      })})
    `

    // Return the created message
    return NextResponse.json({
      id: message.id,
      conversationId: message.conversationId,
      authorId: message.authorId,
      content: message.content,
      type: message.type,
      metadata: message.metadata,
      createdAt: message.createdAt,
      author: {
        id: message.author.id,
        name: `${message.author.firstName} ${message.author.lastName}`,
      },
    })
  } catch (error) {
    console.error('[API] Error creating message:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { conversationId } = await params
    const { searchParams } = new URL(request.url)
    const cursor = searchParams.get('cursor') // Message ID to load before
    const messageId = searchParams.get('messageId') // Fetch specific message

    // Verify user is a participant in this conversation
    const conversation = await prisma.chatConversation.findFirst({
      where: {
        id: conversationId,
        participants: {
          some: {
            userId: session.user.id,
          },
        },
      },
    })

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 },
      )
    }

    // If messageId is provided, fetch only that message
    if (messageId) {
      const message = await prisma.chatMessage.findUnique({
        where: {
          id: messageId,
        },
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      })

      if (!message || message.conversationId !== conversationId) {
        return NextResponse.json(
          { error: 'Message not found' },
          { status: 404 },
        )
      }

      const formattedMessage = {
        id: message.id,
        conversationId: message.conversationId,
        authorId: message.authorId,
        content: message.content,
        type: message.type,
        metadata: message.metadata,
        createdAt: message.createdAt,
        author: {
          id: message.author.id,
          name: `${message.author.firstName} ${
            message.author.lastName || ''
          }`.trim(),
        },
      }

      return NextResponse.json({
        messages: [formattedMessage],
        hasMore: false,
      })
    }

    // Get messages (most recent 50, or 50 before cursor)
    // Include deleted and hidden messages, but we'll replace their content
    const messages = await prisma.chatMessage.findMany({
      where: {
        conversationId,
        ...(cursor ? { id: { lt: cursor } } : {}), // Load messages before cursor
      },
      orderBy: {
        createdAt: 'desc', // Get newest first
      },
      take: 50, // Limit to 50 messages
      include: {
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
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
    const authorIds = [...new Set(messages.map((m) => m.authorId))]
    const users = await prisma.user.findMany({
      where: {
        id: { in: authorIds },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    })

    const usersByIdMap = new Map(users.map((u) => [u.id, u]))

    // Load photos for authors
    const photos = await prisma.photo.findMany({
      where: {
        entityId: { in: authorIds },
        entityTypeId: entityTypes.user.id,
        typeId: photoTypes.primary.id,
      },
    })

    const photosByUserId = new Map(photos.map((p) => [p.entityId, p]))

    // Build messages with photo URLs and reactions
    const messagesWithPhotos = await Promise.all(
      messages.map(async (msg) => {
        const user = usersByIdMap.get(msg.authorId)
        const primaryPhoto = photosByUserId.get(msg.authorId)
        const photoUrl = await getPhotoUrl(primaryPhoto || null, {
          size: 'thumb',
        })

        // Group reactions by emoji
        const reactionsByEmoji = new Map<
          string,
          {
            emoji: string
            count: number
            userIds: string[]
            users: { id: string; name: string }[]
          }
        >()

        msg.reactions.forEach((reaction) => {
          const existing = reactionsByEmoji.get(reaction.emoji)
          const userName = `${reaction.user.firstName} ${
            reaction.user.lastName || ''
          }`.trim()

          if (existing) {
            existing.count++
            existing.userIds.push(reaction.userId)
            existing.users.push({ id: reaction.userId, name: userName })
          } else {
            reactionsByEmoji.set(reaction.emoji, {
              emoji: reaction.emoji,
              count: 1,
              userIds: [reaction.userId],
              users: [{ id: reaction.userId, name: userName }],
            })
          }
        })

        // Replace content for deleted/hidden messages
        const isDeleted = msg.deletedAt !== null
        const isHidden = msg.isHidden
        
        return {
          id: msg.id,
          content: isDeleted ? '[Message deleted]' : isHidden ? '[Message hidden]' : msg.content,
          type: isDeleted || isHidden ? 'system' : msg.type,
          metadata: isDeleted || isHidden ? null : msg.metadata, // Clear metadata for moderated messages
          authorId: msg.authorId,
          authorName: user
            ? `${user.firstName} ${user.lastName || ''}`.trim()
            : 'Unknown User',
          authorPhoto: photoUrl,
          createdAt: msg.createdAt.toISOString(),
          timestamp: msg.createdAt,
          reactions: Array.from(reactionsByEmoji.values()),
          isDeleted,
          isHidden,
        }
      }),
    )

    return NextResponse.json({
      messages: messagesWithPhotos,
      hasMore,
    })
  } catch (error) {
    console.error('[API] Error fetching messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 },
    )
  }
}
