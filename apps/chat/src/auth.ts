import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

interface User {
  id: string;
  email: string;
  name?: string;
}

export async function authenticateSocket(socket: Socket): Promise<User | null> {
  try {
    const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET;

    if (!NEXTAUTH_SECRET) {
      console.error('[Auth] NEXTAUTH_SECRET environment variable is required');
      return null;
    }

    // Get token from handshake auth or query
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    
    if (!token || typeof token !== 'string') {
      console.log('[Auth] No token provided');
      return null;
    }

    // Verify JWT token
    const decoded = jwt.verify(token, NEXTAUTH_SECRET) as any;
    
    if (!decoded || !decoded.sub) {
      console.log('[Auth] Invalid token');
      return null;
    }

    // Return user info from token
    return {
      id: decoded.sub,
      email: decoded.email,
      name: decoded.name
    };

  } catch (error) {
    console.error('[Auth] Authentication error:', error);
    return null;
  }
}
