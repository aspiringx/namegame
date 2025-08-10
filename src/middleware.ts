import NextAuth from 'next-auth'
import { authConfig } from './auth.config'
import { NextResponse } from 'next/server'

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth

  const isOnAdmin = nextUrl.pathname.startsWith('/admin')

  if (isOnAdmin) {
    if (isLoggedIn && req.auth?.user?.isSuperAdmin) {
      return NextResponse.next()
    }
    return NextResponse.redirect(new URL('/', nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  // https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
}
