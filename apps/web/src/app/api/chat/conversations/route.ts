import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { participantIds, type = 'direct', groupId = null, name = null } = body

    if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
      return NextResponse.json({ error: 'Invalid participant IDs' }, { status: 400 })
    }

    // Include current user in participants
    const allParticipantIds = [...new Set([session.user.id, ...participantIds])]

    // Validate that user has relationships with all participants (or they're in the same group)
    if (type === 'group' && groupId) {
      // For group chats, verify all participants are in the group
      const groupMembers = await prisma.groupUser.findMany({
        where: {
          groupId,
          userId: { in: allParticipantIds }
        }
      })
      
      if (groupMembers.length !== allParticipantIds.length) {
        return NextResponse.json({ error: 'All participants must be members of the group' }, { status: 403 })
      }
    } else {
      // For direct chats, verify user has relationships with all other participants
      const currentUserId = session.user!.id // Already validated above
      const otherParticipantIds = participantIds.filter((id: string) => id !== currentUserId)
      
      if (otherParticipantIds.length > 0) {
        const relationships = await prisma.userUser.findMany({
          where: {
            OR: [
              { user1Id: currentUserId, user2Id: { in: otherParticipantIds } },
              { user2Id: currentUserId, user1Id: { in: otherParticipantIds } }
            ]
          }
        })
        
        if (relationships.length !== otherParticipantIds.length) {
          return NextResponse.json({ error: 'You can only create conversations with users you have a relationship with' }, { status: 403 })
        }
      }
    }

    // Check if conversation already exists with these exact participants
    const existingConversation = await prisma.chatConversation.findFirst({
      where: {
        type,
        groupId,
        participants: {
          every: {
            userId: { in: allParticipantIds }
          }
        }
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      }
    })

    // If conversation exists and has same number of participants, return it
    if (existingConversation && existingConversation.participants.length === allParticipantIds.length) {
      return NextResponse.json({
        conversation: {
          id: existingConversation.id,
          type: existingConversation.type,
          name: existingConversation.name,
          groupId: existingConversation.groupId,
          participants: existingConversation.participants.map(p => ({
            id: p.user.id,
            name: `${p.user.firstName} ${p.user.lastName || ''}`.trim()
          }))
        }
      })
    }

    // Create new conversation
    const conversation = await prisma.chatConversation.create({
      data: {
        type,
        groupId,
        name,
        participants: {
          create: allParticipantIds.map(userId => ({
            userId,
            joinedAt: new Date()
          }))
        }
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json({
      conversation: {
        id: conversation.id,
        type: conversation.type,
        name: conversation.name,
        groupId: conversation.groupId,
        participants: conversation.participants.map(p => ({
          id: p.user.id,
          name: `${p.user.firstName} ${p.user.lastName || ''}`.trim()
        }))
      }
    })

  } catch (error) {
    console.error('[API] Error creating conversation:', error)
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    )
  }
}

// Get user's conversations
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const cursor = searchParams.get('cursor') // Conversation ID to load after
    const idsParam = searchParams.get('ids') // Comma-separated conversation IDs to fetch
    const conversationIds = idsParam ? idsParam.split(',').filter(id => id.trim()) : null

    const conversations = await prisma.chatConversation.findMany({
      where: {
        // Only add ID filter if specific IDs are requested
        ...(conversationIds && conversationIds.length > 0 ? { id: { in: conversationIds } } : {}),
        participants: {
          some: {
            userId: session.user.id
          }
        }
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        messages: {
          select: {
            id: true,
            updatedAt: true,
            authorId: true
          },
          orderBy: {
            updatedAt: 'desc'
          },
          take: 1
        },
        _count: {
          select: {
            messages: true
          }
        }
      },
      orderBy: {
        lastMessageAt: 'desc'
      },
      // Only apply pagination if not fetching specific IDs
      ...(!conversationIds ? {
        take: 15, // Load 15 most recent conversations
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {})
      } : {})
    })

    const hasMore = conversations.length === 15
    const userId = session.user.id

    // Calculate unread status for each conversation by checking for activity from others
    const conversationsWithUnread = await Promise.all(conversations.map(async conv => {
      const currentUserParticipant = conv.participants.find(p => p.userId === userId)
      const lastReadAt = currentUserParticipant?.lastReadAt
      
      // Get most recent message from someone else
      const lastMessageFromOthers = await prisma.chatMessage.findFirst({
        where: {
          conversationId: conv.id,
          authorId: { not: userId }
        },
        orderBy: { updatedAt: 'desc' },
        select: { updatedAt: true }
      })
      
      // Get most recent reaction from someone else to YOUR messages
      const lastReactionFromOthers = await prisma.chatMessageReaction.findFirst({
        where: {
          message: { 
            conversationId: conv.id,
            authorId: userId  // Only reactions to YOUR messages
          },
          userId: { not: userId }  // From someone else
        },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true }
      })
      
      // Find the most recent activity from others
      const timestamps = [
        lastMessageFromOthers?.updatedAt,
        lastReactionFromOthers?.createdAt
      ].filter(Boolean) as Date[]
      
      const lastActivityFromOthers = timestamps.length > 0 
        ? new Date(Math.max(...timestamps.map(d => d.getTime())))
        : null
      
      // Has unread if there's activity from others after lastReadAt
      const hasUnread = lastActivityFromOthers && 
        (!lastReadAt || lastActivityFromOthers > lastReadAt)
      
      return {
        id: conv.id,
        type: conv.type,
        name: conv.name,
        groupId: conv.groupId,
        lastMessageAt: conv.lastMessageAt,
        messageCount: conv._count.messages,
        hasUnread,
        participants: conv.participants.map(p => ({
          id: p.user.id,
          name: `${p.user.firstName} ${p.user.lastName || ''}`.trim()
        }))
      }
    }))

    // Sort: unread conversations first (by most recent message), then read conversations (by most recent message)
    conversationsWithUnread.sort((a, b) => {
      if (a.hasUnread && !b.hasUnread) return -1
      if (!a.hasUnread && b.hasUnread) return 1
      
      // Both have same unread status, sort by lastMessageAt
      const aTime = a.lastMessageAt?.getTime() || 0
      const bTime = b.lastMessageAt?.getTime() || 0
      return bTime - aTime
    })

    return NextResponse.json({
      conversations: conversationsWithUnread,
      hasMore
    })

  } catch (error) {
    console.error('[API] Error fetching conversations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    )
  }
}
