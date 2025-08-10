'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getLoginRedirectPath } from './actions'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    const callbackUrl = searchParams.get('callbackUrl') || undefined

    const result = await signIn('credentials', {
      redirect: false,
      email,
      password,
      callbackUrl,
    })

    if (result?.ok && !result.error) {
      if (callbackUrl) {
        router.push(callbackUrl)
      } else {
        const redirectPath = await getLoginRedirectPath()
        router.push(redirectPath)
      }
    } else {
      setError('Invalid email/username or password.')
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-start pt-12 sm:pt-12">
      <div className="bg-card text-card-foreground w-full max-w-md space-y-6 rounded-lg p-8 shadow-md">
        <h1 className="text-center text-2xl font-bold">Login</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="sr-only">
              Email or username
            </label>
            <input
              id="email"
              name="email"
              type="text"
              autoComplete="email"
              required
              className="border-input bg-background text-foreground placeholder-muted-foreground focus:border-primary focus:ring-primary relative block w-full appearance-none rounded-md border px-3 py-2 focus:z-10 focus:outline-none sm:text-sm"
              placeholder="Email or username"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setEmail(e.target.value)
              }
            />
          </div>
          <div>
            <label htmlFor="password" className="sr-only">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="border-input bg-background text-foreground placeholder-muted-foreground focus:border-primary focus:ring-primary relative block w-full appearance-none rounded-md border px-3 py-2 focus:z-10 focus:outline-none sm:text-sm"
              placeholder="Password"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setPassword(e.target.value)
              }
            />
          </div>

          {error && (
            <p className="text-destructive text-center text-sm">{error}</p>
          )}

          <div>
            <button
              type="submit"
              className="group bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary relative flex w-full justify-center rounded-md px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-offset-2 focus:outline-none"
            >
              Login
            </button>
          </div>
        </form>

        <p className="text-muted-foreground mt-4 mb-2 text-center text-sm">
          No account?{' '}
          <Link
            href="/signup"
            className="text-primary hover:text-primary/80 font-medium"
          >
            Sign up
          </Link>
        </p>
        <p className="text-muted-foreground mt-0 text-center text-sm">
          Forgot password?{' '}
          <Link
            href="/reset"
            className="text-primary hover:text-primary/80 font-medium"
          >
            Reset
          </Link>
        </p>
      </div>
    </div>
  )
}
