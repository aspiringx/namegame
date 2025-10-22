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

    // Broadcast reaction to conversation room
    io.to(`conversation:${conversationId}`).emit("reaction", {
      messageId,
      conversationId,
      emoji,
      action,
      userId,
      userName,
      timestamp: new Date().toISOString()
    });

    // Also broadcast to all participants' user rooms
    const { PrismaClient } = await import('@namegame/db');
    const prisma = new PrismaClient();
    
    const participants = await prisma.chatParticipant.findMany({
      where: { conversationId },
      select: { userId: true }
    });
    
    participants.forEach(participant => {
      io.to(`user:${participant.userId}`).emit("reaction", {
        messageId,
        conversationId,
        emoji,
        action,
        userId,
        userName,
        timestamp: new Date().toISOString()
      });
    });
    
    await prisma.$disconnect();

    console.log(
      `[Reaction] Broadcasted ${action} reaction to conversation:${conversationId} and ${participants.length} participants`
    );
  } catch (error) {
    console.error("[Reaction] Error handling reaction:", error);
  }
}
