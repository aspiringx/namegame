import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

interface User {
  id: string;
  email: string;
  name?: string;
}

export async function authenticateSocket(socket: Socket): Promise<User | null> {
  try {
    // TEMPORARY: Skip JWT validation for testing
    // TODO: Implement proper JWT authentication
    const userId = socket.handshake.auth?.userId;
    
    if (!userId) {
      console.log('[Auth] No userId provided');
      return null;
    }
    
    // Fetch real user data from database
    const { PrismaClient } = await import('@namegame/db');
    const prisma = new PrismaClient();
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true
      }
    });
    
    await prisma.$disconnect();
    
    if (!user) {
      console.log('[Auth] User not found:', userId);
      return null;
    }
    
    // Return user with formatted name
    return {
      id: user.id,
      email: user.email || '',
      name: `${user.firstName} ${user.lastName || ''}`.trim()
    };

  } catch (error) {
    console.error('[Auth] Authentication error:', error);
    return null;
  }
}
