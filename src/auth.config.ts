// src/auth.config.ts
import type { NextAuthConfig } from 'next-auth';
import type { Membership } from '@/types/next-auth';

// This is the base, Edge-safe NextAuth configuration.
export const authConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnAdmin = nextUrl.pathname.startsWith('/admin');
      if (isOnAdmin) {
        if (isLoggedIn && auth.user.isSuperAdmin) return true;
        return false; // Redirect unauthenticated users to login page
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        // On sign-in, enrich the token with data from the `authorize` callback
        if (user.id) {
          token.id = user.id;
        }
        token.isSuperAdmin = user.isSuperAdmin;
        token.memberships = user.memberships;
        token.firstName = user.firstName;
        token.image = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      // Pass the enriched token data to the client-side session
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.isSuperAdmin = token.isSuperAdmin as boolean;
        session.user.memberships = token.memberships as Membership[];
        session.user.firstName = token.firstName as string | null;
        session.user.image = token.image as string | null;
      }
      return session;
    },
  },
  providers: [], // Providers are added in the server-only file
} satisfies NextAuthConfig;