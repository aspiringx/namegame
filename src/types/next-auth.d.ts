import { type DefaultSession, type DefaultUser } from 'next-auth';
import { type JWT as NextAuthJWT } from 'next-auth/jwt';

// The shape of the membership object stored in the JWT and session
export interface Membership {
  role: { code: string };
  group: { slug: string };
  groupId: number;
  userId: string;
}

declare module 'next-auth/jwt' {
  interface JWT extends NextAuthJWT {
    isSuperAdmin: boolean;
    id: string;
    firstName: string | null;
    memberships: Membership[];
    image?: string | null;
  }
}

declare module 'next-auth' {
  interface Session extends DefaultSession {
    isSuperAdmin: boolean; // For middleware
    user: {
      id: string;
      firstName: string | null;
      memberships: Membership[];
      isSuperAdmin: boolean;
      image?: string | null;
    } & DefaultSession['user'];
  }

  interface User extends DefaultUser {
    firstName: string | null;
    memberships: Membership[];
    isSuperAdmin: boolean;
    image?: string | null;
  }
}
