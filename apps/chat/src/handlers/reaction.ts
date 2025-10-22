import { Server, Socket } from "socket.io";

export async function handleReaction(
  io: Server,
  socket: Socket,
  data: {
    messageId: string;
    conversationId: string;
    emoji: string;
    action: 'add' | 'remove';
    userId: string;
    userName: string;
  }
) {
  try {
    const { messageId, conversationId, emoji, action, userId, userName } = data;

    console.log(
      `[Reaction] ${action === 'add' ? 'Added' : 'Removed'} reaction ${emoji} by ${userId} on message ${messageId}`
    );

    // Get message author and participants first
    const { PrismaClient } = await import('@namegame/db');
    const prisma = new PrismaClient();
    
    const [message, participants] = await Promise.all([
      prisma.chatMessage.findUnique({
        where: { id: messageId },
        select: { authorId: true }
      }),
      prisma.chatParticipant.findMany({
        where: { conversationId },
        select: { userId: true }
      })
    ]);
    
    const reactionData = {
      messageId,
      conversationId,
      emoji,
      action,
      userId,
      userName,
      messageAuthorId: message?.authorId,
      timestamp: new Date().toISOString()
    };

    // Broadcast reaction to conversation room
    io.to(`conversation:${conversationId}`).emit("reaction", reactionData);
    
    // Broadcast to all participants' user rooms
    participants.forEach(participant => {
      io.to(`user:${participant.userId}`).emit("reaction", reactionData);
    });
    
    // If adding a reaction to someone else's message, trigger notification for message author
    if (action === 'add' && message && message.authorId !== userId) {
      // Update conversation's lastMessageAt to trigger unread indicator
      await prisma.chatConversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date() }
      });
      
      console.log(
        `[Reaction] Triggered notification for message author ${message.authorId}`
      );
    }
    
    await prisma.$disconnect();

    console.log(
      `[Reaction] Broadcasted ${action} reaction to conversation:${conversationId} and ${participants.length} participants`
    );
  } catch (error) {
    console.error("[Reaction] Error handling reaction:", error);
  }
}
