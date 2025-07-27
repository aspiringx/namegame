'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { newPassword } from './actions';

export default function NewPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [error, setError] = useState<string | undefined>('');
  const [success, setSuccess] = useState<string | undefined>('');
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!password) {
      setError('Password is required.');
      return;
    }

    setIsPending(true);

    try {
      const data = await newPassword(password, token);
      setError(data.error);
      setSuccess(data.success);
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="flex flex-col justify-start items-center min-h-screen pt-12 sm:pt-12">
      <div className="w-full max-w-md p-8 space-y-6 bg-card text-card-foreground rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center">Enter a new password</h1>
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
              className="relative block w-full appearance-none rounded-md border border-input bg-background px-3 py-2 text-foreground placeholder-muted-foreground focus:z-10 focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
              placeholder="New password"
              value={password}
              onChange={e => {
                const newPassword = e.target.value;
                setPassword(newPassword);
                if (newPassword === 'password123') {
                  setPasswordError('Please choose a more secure password.');
                } else {
                  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;
                  if (newPassword && !passwordRegex.test(newPassword)) {
                    setPasswordError('Must be 6+ characters with letters and numbers.');
                  } else {
                    setPasswordError(null);
                  }
                }
              }}
              disabled={isPending || !!success}
            />
            <p className="mt-2 text-xs text-muted-foreground">
              At least 6 characters with text and numbers.
            </p>
          </div>

          {passwordError && (
            <p className="text-sm text-center text-destructive">{passwordError}</p>
          )}
          {error && !passwordError && (
            <p className="text-sm text-center text-destructive">{error}</p>
          )}
          {success && (
            <p className="text-sm text-center text-green-500">{success}</p>
          )}

          <div>
            <button
              type="submit"
              disabled={isPending || !!success || !!passwordError}
              className="group relative flex w-full justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50"
            >
              {isPending ? 'Resetting...' : 'Reset password'}
            </button>
          </div>
          {success && (
            <p className="mt-2 text-center text-sm text-muted-foreground">
              <Link href="/login" className="font-medium text-primary hover:text-primary/80">
                Back to login
              </Link>
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
