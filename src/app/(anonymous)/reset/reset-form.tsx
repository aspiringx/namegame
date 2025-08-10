'use client'

import Link from 'next/link'
import { useState } from 'react'
import { sendPasswordResetLink } from './actions'

export default function ResetForm() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsLoading(true)

    const result = await sendPasswordResetLink(email)

    if (result.error) {
      setError(result.error)
    } else if (result.success) {
      setSuccess(result.success)
    }
    setIsLoading(false)
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-start pt-12 sm:pt-12">
      <div className="bg-card text-card-foreground w-full max-w-md space-y-6 rounded-lg p-8 shadow-md">
        <h1 className="text-center text-2xl font-bold">Reset Password</h1>
        <p className="text-muted-foreground mt-2 text-center text-sm">
          Only works with a verified email address.
        </p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="sr-only">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="border-input bg-background text-foreground placeholder-muted-foreground focus:border-primary focus:ring-primary relative block w-full appearance-none rounded-md border px-3 py-2 focus:z-10 focus:outline-none sm:text-sm"
              placeholder="Email address"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setEmail(e.target.value)
              }
              disabled={isLoading}
            />
          </div>

          {error && (
            <p className="text-destructive text-center text-sm">{error}</p>
          )}
          {success && (
            <p className="text-center text-sm text-green-500">{success}</p>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading || !!success}
              className="group bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary relative flex w-full justify-center rounded-md px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
            >
              {isLoading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </div>
          <p className="text-muted-foreground mt-2 text-center text-sm">
            Remember your password?{' '}
            <Link
              href="/login"
              className="text-primary hover:text-primary/80 font-medium"
            >
              Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
