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

    const conversations = await prisma.chatConversation.findMany({
      where: {
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
            createdAt: true
          },
          orderBy: {
            createdAt: 'desc'
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
      take: 15, // Load 15 most recent conversations
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {})
    })

    const hasMore = conversations.length === 15
    const userId = session.user.id

    // Calculate unread status for each conversation
    const conversationsWithUnread = conversations.map(conv => {
      const currentUserParticipant = conv.participants.find(p => p.userId === userId)
      const lastReadAt = currentUserParticipant?.lastReadAt
      const lastMessage = conv.messages[0]
      
      // Has unread if there's a message after lastReadAt (or no lastReadAt)
      const hasUnread = lastMessage && (!lastReadAt || lastMessage.createdAt > lastReadAt)
      
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
    })

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
