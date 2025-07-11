import type { Role as UserRole } from '@prisma/client';
import { type DefaultSession, type DefaultUser } from 'next-auth';
import { type JWT as NextAuthJWT } from 'next-auth/jwt';

// The shape of the role object stored in the JWT and session
export interface Role {
  role: UserRole;
  groupId: number;
  groupSlug: string;
}

declare module 'next-auth/jwt' {
  interface JWT extends NextAuthJWT {
    id: string;
    firstName: string | null;
    roles: Role[];
  }
}

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string;
      firstName: string | null;
      roles: Role[];
    } & DefaultSession['user'];
  }

  interface User extends DefaultUser {
    firstName: string | null;
    roles: Role[];
  }
}
