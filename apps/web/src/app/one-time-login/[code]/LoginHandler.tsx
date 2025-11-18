'use client'

import { useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface LoginHandlerProps {
  code: string
  searchParams: { [key: string]: string | string[] | undefined }
}

export default function LoginHandler({
  code,
  searchParams,
}: LoginHandlerProps) {
  const router = useRouter()

  useEffect(() => {
    const attemptSignIn = async () => {
      try {
        const result = await signIn('one-time-code', {
          code,
          redirect: false, // We will handle redirect manually
        })

        if (result?.error) {
          throw new Error(result.error)
        }

        if (result?.ok) {
          toast.success('Login successful! Welcome back.')

          // Preserve query params (like ?chat=open) when redirecting
          const queryString = new URLSearchParams(
            searchParams as Record<string, string>,
          ).toString()
          const redirectUrl = queryString
            ? `/me?${queryString}`
            : '/me?sso=true'

          router.push(redirectUrl)
          router.refresh() // Refresh the page to update session state
        }
      } catch {
        toast.error('Login failed. The link may be invalid or expired.')
        router.push('/login?error=sso_failed')
      }
    }

    attemptSignIn()
  }, [code, router, searchParams])

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center">
      <p className="text-lg">Please wait while we sign you in...</p>
    </div>
  )
}
