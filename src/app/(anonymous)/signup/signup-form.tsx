'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
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

  return (
    <div className="flex flex-col justify-start items-center min-h-screen pt-12 sm:pt-12">
      <div className="w-full max-w-md p-8 space-y-6 bg-card text-card-foreground rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center">
          Sign up to play!
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Or{' '}
          <Link href="/login" className="font-medium text-primary hover:text-primary/80">
            Login
          </Link>
        </p>
        <form action={dispatch} className="space-y-6">
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-foreground"
            >
              Username <span className="text-destructive">*</span>
            </label>
            <div className="mt-1">
              <input
                id="username"
                name="username"
                type="text"
                placeholder="Username"
                required
                className="relative block w-full appearance-none rounded-md border border-input bg-background px-3 py-2 text-foreground placeholder-muted-foreground focus:z-10 focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
              />
              <p className="mt-2 text-xs text-muted-foreground">At least 3 characters and unique.</p>
              {state.errors?.username &&
                state.errors.username.map((error: string) => (
                  <p className="mt-2 text-sm text-destructive" key={error}>
                    {error}
                  </p>
                ))}
            </div>
          </div>

          <div>
            <label
              htmlFor="firstName"
              className="block text-sm font-medium text-foreground"
            >
              First Name <span className="text-destructive">*</span>
            </label>
            <div className="mt-1">
              <input
                id="firstName"
                name="firstName"
                type="text"
                placeholder="First Name"
                required
                className="relative block w-full appearance-none rounded-md border border-input bg-background px-3 py-2 text-foreground placeholder-muted-foreground focus:z-10 focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
              />
              {state.errors?.firstName &&
                state.errors.firstName.map((error: string) => (
                  <p className="mt-2 text-sm text-destructive" key={error}>
                    {error}
                  </p>
                ))}
            </div>
          </div>

          <div>
            <label
              htmlFor="lastName"
              className="block text-sm font-medium text-foreground"
            >
              Last Name
            </label>
            <div className="mt-1">
              <input
                id="lastName"
                name="lastName"
                type="text"
                placeholder="Last Name"
                className="relative block w-full appearance-none rounded-md border border-input bg-background px-3 py-2 text-foreground placeholder-muted-foreground focus:z-10 focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
              />
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
      </div>
    </div>
  );
}
