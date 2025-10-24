import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { PrismaClient } from '@namegame/db'

const prisma = new PrismaClient()

// DELETE - Soft delete a message
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { messageId } = await params

    // Get the message
    const message = await prisma.chatMessage.findUnique({
      where: { id: messageId },
      select: {
        id: true,
        authorId: true,
        conversationId: true,
        conversation: {
          select: {
            groupId: true
          }
        }
      }
    })

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    // Check permissions: author or group admin can delete
    const isAuthor = message.authorId === session.user!.id
    
    let isGroupAdmin = false
    if (message.conversation.groupId) {
      // Check if user is an admin of the group
      const groupUser = await prisma.groupUser.findUnique({
        where: {
          userId_groupId: {
            userId: session.user!.id,
            groupId: message.conversation.groupId
          }
        },
        include: {
          role: true
        }
      })
      isGroupAdmin = groupUser?.role?.code === 'admin'
    }

    if (!isAuthor && !isGroupAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Soft delete the message
    await prisma.chatMessage.update({
      where: { id: messageId },
      data: { deletedAt: new Date() }
    })

    // Notify via PostgreSQL for socket broadcast
    await prisma.$executeRaw`
      SELECT pg_notify('message_deleted', ${JSON.stringify({
        messageId,
        conversationId: message.conversationId
      })})
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API] Error deleting message:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH - Hide or edit a message
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { messageId } = await params
    const body = await request.json()
    const { action, content } = body

    // Get message
    const message = await prisma.chatMessage.findUnique({
      where: { id: messageId },
      select: { 
        conversationId: true,
        authorId: true
      }
    })

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    // Handle edit action
    if (content !== undefined) {
      // Only author can edit
      if (message.authorId !== session.user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }

      // Update message content
      const updated = await prisma.chatMessage.update({
        where: { id: messageId },
        data: {
          content: content.trim(),
          updatedAt: new Date()
        },
        select: {
          updatedAt: true
        }
      })

      return NextResponse.json({ 
        success: true,
        updatedAt: updated.updatedAt
      })
    }

    // Handle hide action
    if (action === 'hide') {
      // Update message to mark as hidden
      await prisma.chatMessage.update({
        where: { id: messageId },
        data: {
          isHidden: true,
          hiddenBy: session.user.id,
          hiddenAt: new Date()
        }
      })

      // Notify via PostgreSQL for socket broadcast
      await prisma.$executeRaw`
        SELECT pg_notify('message_hidden', ${JSON.stringify({
          messageId,
          conversationId: message.conversationId
        })})
      `

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('[API] Error updating message:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
