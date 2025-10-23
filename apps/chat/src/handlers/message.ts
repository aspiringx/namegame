import { Socket } from 'socket.io';
import { PrismaClient } from '@namegame/db';

const prisma = new PrismaClient();

interface User {
  id: string;
  email: string;
  name?: string;
}

interface MessageData {
  conversationId: string;
  content: string;
  type?: 'text' | 'image' | 'link' | 'mixed' | 'system';
  metadata?: any; // Images, link previews, etc.
}

export async function handleMessage(socket: Socket, user: User, data: MessageData) {
  try {
    const { conversationId, content, type = 'text', metadata } = data;

    // Validate input
    if (!conversationId || !content?.trim()) {
      socket.emit('error', { message: 'Invalid message data' });
      return;
    }

    // TODO: Verify user has permission to send messages to this conversation
    // This would check if user is a participant in the conversation

    // Save message to database
    const message = await prisma.chatMessage.create({
      data: {
        content: content.trim(),
        type,
        metadata: metadata || undefined,
        authorId: user.id,
        conversationId,
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        conversation: {
          select: {
            id: true,
            type: true,
            groupId: true
          }
        }
      }
    });

    // Update conversation's lastMessageAt (tracks message/reaction activity)
    await prisma.chatConversation.update({
      where: { id: conversationId },
      data: { 
        lastMessageAt: new Date()
      }
    });

    // Trigger PostgreSQL NOTIFY to broadcast to all chat servers
    await prisma.$executeRaw`
      SELECT pg_notify('new_message', ${JSON.stringify({
        id: message.id,
        content: message.content,
        type: message.type,
        metadata: message.metadata,
        conversationId: message.conversationId,
        conversation: message.conversation,
        author: {
          id: message.author.id,
          name: `${message.author.firstName} ${message.author.lastName || ''}`.trim(),
          email: message.author.email
        },
        createdAt: message.createdAt.toISOString()
      })})
    `;

    console.log(`[Message] Message sent by ${user.id} to conversation ${conversationId}`);

  } catch (error) {
    console.error('[Message] Error handling message:', error);
    socket.emit('error', { message: 'Failed to send message' });
  }
}
