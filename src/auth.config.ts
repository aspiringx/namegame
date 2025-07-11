import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  providers: [], // We will add the providers in the main auth.ts file
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnAdmin = nextUrl.pathname.startsWith('/admin');

      if (isOnAdmin) {
        if (isLoggedIn) {
          // Check for 'super' role in the 'global-admin' group
          const isSuperAdmin = auth.user.roles?.some(
            (r) => r.groupSlug === 'global-admin' && r.role === 'super'
          );
          if (isSuperAdmin) {
            return true; // Allow access
          }
          return false; // Redirect to home page for non-super-admins
        }
        return false; // Redirect unauthenticated users to login page
      }
      return true; // Allow all other pages
    },
    jwt({ token, user }) {
      if (user && user.id) {
        // On initial sign-in, populate the token
        token.id = user.id;
        token.firstName = user.firstName;
        token.roles = user.roles;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id;
      session.user.firstName = token.firstName;
      session.user.roles = token.roles;
      return session;
    },
  },
} satisfies NextAuthConfig;
