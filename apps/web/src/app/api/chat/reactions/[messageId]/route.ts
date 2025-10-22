import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'

// POST /api/chat/reactions/[messageId] - Add reaction
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { emoji } = await request.json()
    
    if (!emoji || typeof emoji !== 'string') {
      return NextResponse.json({ error: 'Invalid emoji' }, { status: 400 })
    }

    const { messageId } = await params

    // Verify message exists and user has access to the conversation
    const message = await prisma.chatMessage.findUnique({
      where: { id: messageId },
      include: {
        conversation: {
          include: {
            participants: {
              where: { userId: session.user.id }
            }
          }
        }
      }
    })

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    if (message.conversation.participants.length === 0) {
      return NextResponse.json({ error: 'Not a participant in this conversation' }, { status: 403 })
    }

    // Create or update reaction (upsert handles duplicates)
    const reaction = await prisma.chatMessageReaction.upsert({
      where: {
        messageId_userId_emoji: {
          messageId,
          userId: session.user.id,
          emoji
        }
      },
      create: {
        messageId,
        userId: session.user.id,
        emoji
      },
      update: {}, // No update needed if it exists
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    })

    return NextResponse.json(reaction)
  } catch (error) {
    console.error('[API] Error adding reaction:', error)
    return NextResponse.json({ error: 'Failed to add reaction' }, { status: 500 })
  }
}

// DELETE /api/chat/reactions/[messageId]?emoji=👍 - Remove reaction
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const emoji = searchParams.get('emoji')
    
    if (!emoji) {
      return NextResponse.json({ error: 'Emoji parameter required' }, { status: 400 })
    }

    const { messageId } = await params

    // Verify message exists and user has access to the conversation
    const message = await prisma.chatMessage.findUnique({
      where: { id: messageId },
      include: {
        conversation: {
          include: {
            participants: {
              where: { userId: session.user.id }
            }
          }
        }
      }
    })

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    if (message.conversation.participants.length === 0) {
      return NextResponse.json({ error: 'Not a participant in this conversation' }, { status: 403 })
    }

    // Delete the reaction
    await prisma.chatMessageReaction.deleteMany({
      where: {
        messageId,
        userId: session.user.id,
        emoji
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API] Error removing reaction:', error)
    return NextResponse.json({ error: 'Failed to remove reaction' }, { status: 500 })
  }
}
