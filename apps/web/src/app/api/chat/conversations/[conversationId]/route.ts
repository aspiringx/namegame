import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { PrismaClient } from '@namegame/db'

const prisma = new PrismaClient()

// GET - Get a specific conversation details
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

    // Get the conversation
    const conversation = await prisma.chatConversation.findUnique({
      where: { id: conversationId },
      select: {
        id: true,
        type: true,
        name: true,
        groupId: true,
        participants: {
          select: {
            userId: true
          }
        }
      }
    })

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    // Check if user is a participant
    const isParticipant = conversation.participants.some(p => p.userId === session.user!.id)
    if (!isParticipant) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ conversation })
  } catch (error) {
    console.error('[API] Error fetching conversation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
