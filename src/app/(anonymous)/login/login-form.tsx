'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Cookies from 'js-cookie'
import { getLoginRedirectPath } from './actions'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [autoLoginStatus, setAutoLoginStatus] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail')
    if (savedEmail) {
      setEmail(savedEmail)
      setRememberMe(true)
    }

    const attemptAutoLogin = async () => {
      const tempCredentialsCookie = Cookies.get('temp_user_credentials')
      const redirectUrl = Cookies.get('post_login_redirect')

      if (tempCredentialsCookie && redirectUrl) {
        setAutoLoginStatus('Attempting to log you in automatically...')
        const credentials = JSON.parse(tempCredentialsCookie)

        const result = await signIn('credentials', {
          redirect: false,
          email: credentials.username,
          password: credentials.password,
        })

        if (result?.ok) {
          if (rememberMe) {
            localStorage.setItem('rememberedEmail', credentials.username)
          } else {
            localStorage.removeItem('rememberedEmail')
          }
          // On success, clean up the cookies and redirect.
          Cookies.remove('temp_user_credentials')
          Cookies.remove('post_login_redirect')
          window.location.href = redirectUrl
        } else {
          // On failure, keep the cookies and inform the user so they can retry.
          setAutoLoginStatus(
            'Automatic login failed. Please try again or enter your credentials manually.',
          )
        }
      }
    }

    attemptAutoLogin()
  }, [rememberMe])

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
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email)
      } else {
        localStorage.removeItem('rememberedEmail')
      }

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

          {autoLoginStatus && (
            <p className="text-muted-foreground text-center text-sm">
              {autoLoginStatus}
            </p>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label
                htmlFor="remember-me"
                className="text-foreground ml-2 block text-sm"
              >
                Remember me
              </label>
            </div>
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
