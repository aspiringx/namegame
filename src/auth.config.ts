import type { NextAuthConfig } from 'next-auth';
import { getToken } from 'next-auth/jwt';
import { NEXTAUTH_SECRET } from './auth.secret';

// This configuration is for the middleware and is Edge-safe.
export const authConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    // The `authorized` callback runs in the middleware.
    // We can't use `getToken` here without a secret, and we can't access process.env.
    // The main `auth` function in middleware.ts will handle the logic.
    async authorized({ request }) {
      const token = await getToken({ req: request, secret: NEXTAUTH_SECRET });
      const { pathname } = request.nextUrl;
      if (pathname.startsWith('/admin')) {
        // The token contains the `isSuperAdmin` flag from the `jwt` callback.
        return !!token?.isSuperAdmin;
      }

      // Allow all other requests by default.
      return true;
    },
  },
  providers: [], // Add providers in the main auth.ts
} satisfies NextAuthConfig;
