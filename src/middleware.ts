import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import { NEXTAUTH_SECRET } from './auth.secret';

export default NextAuth({ ...authConfig, secret: NEXTAUTH_SECRET }).auth;



export const config = {
  // https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
  matcher: ['/((?!api|_next/static|_next/image|.*\.png$).*)'],
};
