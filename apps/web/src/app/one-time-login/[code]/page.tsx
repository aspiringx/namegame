import { notFound, redirect } from 'next/navigation'
import { addDays, isBefore } from 'date-fns'

import prisma from '@/lib/prisma'
import { auth } from '@/auth'
import LoginHandler from './LoginHandler'

async function validateCode(code: string) {
  const loginCode = await prisma.code.findUnique({
    where: { code },
  })

  if (!loginCode) {
    return { error: 'Invalid login code.' }
  }

  const expiresAt = addDays(loginCode.createdAt, 7)
  if (isBefore(expiresAt, new Date())) {
    return { error: 'Login code has expired.' }
  }

  return { success: true }
}

export default async function OneTimeLoginPage(props: {
  params: Promise<{ code: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await props.params
  const searchParams = await props.searchParams
  const session = await auth()

  const { code } = params
  if (!code) {
    notFound()
  }

  // If user is already logged in, invalidate the code and redirect with query params
  if (session?.user?.id) {
    // Invalidate the code so it can't be used again
    await prisma.code
      .delete({
        where: { code },
      })
      .catch(() => {
        // Code might already be deleted, ignore error
      })

    // Preserve query params (like ?chat=open) when redirecting
    const queryString = new URLSearchParams(
      searchParams as Record<string, string>,
    ).toString()
    const redirectUrl = queryString ? `/me?${queryString}` : '/me'
    redirect(redirectUrl)
  }

  const result = await validateCode(code)

  if (result.error) {
    const url = new URL('/login', 'https://namegame.app') // Base URL is required but not used for relative redirects
    url.searchParams.set('error', 'InvalidOrExpiredCode')
    url.searchParams.set('message', result.error)
    redirect(url.pathname + url.search)
  }

  return <LoginHandler code={code} searchParams={searchParams} />
}
