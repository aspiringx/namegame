import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

// Initialize NextAuth.js with the Edge-safe configuration.
// The `auth` middleware will handle authorization based on the `authorized` callback in `authConfig`.
export default NextAuth(authConfig).auth;

export const config = {
  // Match all routes except for static files, API routes, and image assets.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};