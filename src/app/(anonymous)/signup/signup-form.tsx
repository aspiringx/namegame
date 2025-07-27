'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { signup, type SignupState } from './actions';

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="group relative flex w-full justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50"
    >
      {pending ? 'Signing up...' : 'Sign up'}
    </button>
  );
}

export default function SignupForm() {
  const initialState: SignupState = { message: null, errors: {} };
  const [state, dispatch] = useActionState(signup, initialState);
  const [email, setEmail] = useState('');

  return (
    <div className="flex flex-col justify-start items-center min-h-screen pt-12 sm:pt-12">
      <div className="w-full max-w-md p-8 space-y-6 bg-card text-card-foreground rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center">
          Sign up to play!
        </h2>
        <form action={dispatch} className="space-y-6">
          <div className="flex">
            <div className="flex-grow">
              <label
                htmlFor="firstName"
                className="block text-sm font-medium text-foreground"
              >
                First <span className="text-destructive">*</span>
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                placeholder="First name"
                required
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-l-md rounded-r-none shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
              />
              {state.errors?.firstName &&
                state.errors.firstName.map((error: string) => (
                  <p className="mt-2 text-sm text-destructive" key={error}>
                    {error}
                  </p>
                ))}
            </div>

            <div className="flex-grow">
              <label
                htmlFor="lastName"
                className="block text-sm font-medium text-foreground"
              >
                Last <span className="text-destructive">*</span>
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                placeholder="Last name"
                required
                className="mt-1 -ml-px block w-full px-3 py-2 bg-white border border-gray-300 rounded-r-md rounded-l-none shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-foreground"
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
                  className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  <TooltipProvider disableHoverableContent={true}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button type="button" className="pointer-events-auto focus:outline-none">
                          <ShieldAlert className="h-5 w-5 text-red-500" aria-hidden="true" />
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
                <p className="mt-1 rounded-md text-xs bg-green-50 p-2 text-sm text-green-700 dark:bg-green-900 dark:text-green-300">
                  After submitting, check your email for a verification link.
                </p>
              )}
              {state.errors?.email &&
                state.errors.email.map((error: string) => (
                  <p className="mt-2 text-sm text-destructive" key={error}>
                    {error}
                  </p>
                ))}
            </div>
          </div>


          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-foreground"
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
                className="relative block w-full appearance-none rounded-md border border-input bg-background px-3 py-2 text-foreground placeholder-muted-foreground focus:z-10 focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
              />
              <p className="mt-2 text-xs text-muted-foreground">At least 6 characters with text and numbers.</p>
              {state.errors?.password &&
                state.errors.password.map((error: string) => (
                  <p className="mt-2 text-sm text-destructive" key={error}>
                    {error}
                  </p>
                ))}
            </div>
          </div>

          {state.message && (
            <div aria-live="polite" className="text-sm text-destructive">
              {state.message}
            </div>
          )}
          <div>
            <SubmitButton />
          </div>
        </form>

        <p className="mt-2 text-center text-sm text-muted-foreground">
          Have an account?{' '}
          <Link href="/login" className="font-medium text-primary hover:text-primary/80">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
