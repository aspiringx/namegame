import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { conversationId } = await params

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

    // Get messages (most recent 50)
    const messages = await prisma.chatMessage.findMany({
      where: {
        conversationId
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc' // Get newest first
      },
      take: 50 // Limit to 50 most recent messages
    })

    // Reverse to show oldest first in UI
    messages.reverse()

    return NextResponse.json({
      messages: messages.map(msg => ({
        id: msg.id,
        content: msg.content,
        type: msg.type,
        authorId: msg.authorId,
        authorName: `${msg.author.firstName} ${msg.author.lastName || ''}`.trim(),
        createdAt: msg.createdAt.toISOString(),
        timestamp: msg.createdAt
      }))
    })

  } catch (error) {
    console.error('[API] Error fetching messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}
