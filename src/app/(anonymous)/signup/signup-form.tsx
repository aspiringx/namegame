'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'
import { ShieldAlert } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { signup, type SignupState } from './actions'

function SubmitButton({ disabled }: { disabled?: boolean }) {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="group bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary relative flex w-full justify-center rounded-md px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
    >
      {pending ? 'Signing up...' : 'Sign up'}
    </button>
  )
}

export default function SignupForm() {
  const initialState: SignupState = { message: null, errors: {} }
  const [state, dispatch] = useActionState(signup, initialState)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState<string | null>(null)

  return (
    <div className="flex min-h-screen flex-col items-center justify-start pt-12 sm:pt-12">
      <div className="bg-card text-card-foreground w-full max-w-md space-y-6 rounded-lg p-8 shadow-md">
        <h2 className="text-center text-2xl font-bold">Sign up to play!</h2>
        <form action={dispatch} className="space-y-6">
          <div className="flex">
            <div className="flex-grow">
              <label
                htmlFor="firstName"
                className="text-foreground block text-sm font-medium"
              >
                First <span className="text-destructive">*</span>
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                placeholder="First name"
                required
                className="mt-1 block w-full rounded-l-md rounded-r-none border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
              />
              {state.errors?.firstName &&
                state.errors.firstName.map((error: string) => (
                  <p className="text-destructive mt-2 text-sm" key={error}>
                    {error}
                  </p>
                ))}
            </div>

            <div className="flex-grow">
              <label
                htmlFor="lastName"
                className="text-foreground block text-sm font-medium"
              >
                Last <span className="text-destructive">*</span>
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                placeholder="Last name"
                required
                className="mt-1 -ml-px block w-full rounded-l-none rounded-r-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="email"
              className="text-foreground block text-sm font-medium"
            >
              Email <span className="text-destructive">*</span>
            </label>
            <div className="mt-1">
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-md border-gray-300 py-2 pr-10 pl-3 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  <TooltipProvider disableHoverableContent={true}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="pointer-events-auto focus:outline-none"
                        >
                          <ShieldAlert
                            className="h-5 w-5 text-red-500"
                            aria-hidden="true"
                          />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Verification will be required to complete signup.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
              {email.includes('@') && (
                <p className="mt-1 rounded-md bg-green-50 p-2 text-sm text-xs text-green-700 dark:bg-green-900 dark:text-green-300">
                  After submitting, check your email for a verification link.
                </p>
              )}
              {state.errors?.email &&
                state.errors.email.map((error: string) => (
                  <p className="text-destructive mt-2 text-sm" key={error}>
                    {error}
                  </p>
                ))}
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="text-foreground block text-sm font-medium"
            >
              Password <span className="text-destructive">*</span>
            </label>
            <div className="mt-1">
              <input
                id="password"
                name="password"
                type="password"
                placeholder="Password"
                required
                value={password}
                onChange={(e) => {
                  const newPassword = e.target.value
                  setPassword(newPassword)
                  if (newPassword === 'password123') {
                    setPasswordError('Please choose a more secure password.')
                  } else {
                    setPasswordError(null)
                  }
                }}
                className="border-input bg-background text-foreground placeholder-muted-foreground focus:border-primary focus:ring-primary relative block w-full appearance-none rounded-md border px-3 py-2 focus:z-10 focus:outline-none sm:text-sm"
              />
              {passwordError ? (
                <p className="text-destructive mt-2 text-xs">{passwordError}</p>
              ) : (
                <p className="text-muted-foreground mt-2 text-xs">
                  At least 6 characters with text and numbers.
                </p>
              )}
              {state.errors?.password &&
                !passwordError &&
                state.errors.password.map((error: string) => (
                  <p className="text-destructive mt-2 text-sm" key={error}>
                    {error}
                  </p>
                ))}
            </div>
          </div>

          {state.message && (
            <div aria-live="polite" className="text-destructive text-sm">
              {state.message}
            </div>
          )}
          <div>
            <SubmitButton disabled={!!passwordError} />
          </div>
        </form>

        <p className="text-muted-foreground mt-2 text-center text-sm">
          Have an account?{' '}
          <Link
            href="/login"
            className="text-primary hover:text-primary/80 font-medium"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  )
}
