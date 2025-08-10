'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { newPassword } from './actions'

export default function NewPasswordForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [error, setError] = useState<string | undefined>('')
  const [success, setSuccess] = useState<string | undefined>('')
  const [isPending, setIsPending] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!password) {
      setError('Password is required.')
      return
    }

    setIsPending(true)

    try {
      const data = await newPassword(password, token)
      setError(data.error)
      setSuccess(data.success)
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-start pt-12 sm:pt-12">
      <div className="bg-card text-card-foreground w-full max-w-md space-y-6 rounded-lg p-8 shadow-md">
        <h1 className="text-center text-2xl font-bold">Enter a new password</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="password" className="sr-only">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="border-input bg-background text-foreground placeholder-muted-foreground focus:border-primary focus:ring-primary relative block w-full appearance-none rounded-md border px-3 py-2 focus:z-10 focus:outline-none sm:text-sm"
              placeholder="New password"
              value={password}
              onChange={(e) => {
                const newPassword = e.target.value
                setPassword(newPassword)
                if (newPassword === 'password123') {
                  setPasswordError('Please choose a more secure password.')
                } else {
                  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/
                  if (newPassword && !passwordRegex.test(newPassword)) {
                    setPasswordError(
                      'Must be 6+ characters with letters and numbers.',
                    )
                  } else {
                    setPasswordError(null)
                  }
                }
              }}
              disabled={isPending || !!success}
            />
            <p className="text-muted-foreground mt-2 text-xs">
              At least 6 characters with text and numbers.
            </p>
          </div>

          {passwordError && (
            <p className="text-destructive text-center text-sm">
              {passwordError}
            </p>
          )}
          {error && !passwordError && (
            <p className="text-destructive text-center text-sm">{error}</p>
          )}
          {success && (
            <p className="text-center text-sm text-green-500">{success}</p>
          )}

          <div>
            <button
              type="submit"
              disabled={isPending || !!success || !!passwordError}
              className="group bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary relative flex w-full justify-center rounded-md px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
            >
              {isPending ? 'Resetting...' : 'Reset password'}
            </button>
          </div>
          {success && (
            <p className="text-muted-foreground mt-2 text-center text-sm">
              <Link
                href="/login"
                className="text-primary hover:text-primary/80 font-medium"
              >
                Back to login
              </Link>
            </p>
          )}
        </form>
      </div>
    </div>
  )
}
