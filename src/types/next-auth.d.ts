// src/types/next-auth.d.ts
import { type DefaultSession, type DefaultUser } from 'next-auth';
import 'next-auth/jwt';

export interface Membership {
  role: {
    code: string;
  };
  group: {
    slug: string;
  };
  groupId: number;
  userId: string;
}

declare module 'next-auth' {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session extends DefaultSession {
    user?: User;
  }

  /**
   * The shape of the user object returned in the OAuth providers' `profile` callback,
   * or the second parameter of the `session` callback, when using a database.
   */
  interface User extends DefaultUser {
    id: string;
    firstName?: string | null;
    isSuperAdmin?: boolean;
    memberships?: Membership[];
    image?: string | null;
  }
}

declare module 'next-auth/jwt' {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT {
    id?: string;
    firstName?: string | null;
    isSuperAdmin?: boolean;
    memberships?: Membership[];
    image?: string | null;
  }
}
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
