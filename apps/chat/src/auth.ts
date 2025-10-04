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

    console.log('[Auth] TEMP: Allowing connection for userId:', userId);
    
    // Return mock user info for testing
    return {
      id: userId,
      email: `${userId}@example.com`,
      name: `User ${userId}`
    };

  } catch (error) {
    console.error('[Auth] Authentication error:', error);
    return null;
  }
}
