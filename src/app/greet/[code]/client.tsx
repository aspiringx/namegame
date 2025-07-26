'use client';

import { useState, useTransition } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { handleGuestGreeting, CodeData } from '@/app/greet/[code]/actions';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function GreetPageClient({ codeData, isValidCode }: { codeData: CodeData | null; isValidCode: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [showSignupForm, setShowSignupForm] = useState(false);
  const [firstName, setFirstName] = useState('');

  const handleLogin = () => {
    if (codeData?.group?.slug) {
      const callbackUrl = pathname;
      router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
    } else {
      // Fallback to the default login page if slug is not available
      router.push('/login');
    }
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!firstName.trim()) {
      alert('Please enter your first name.');
      return;
    }

    startTransition(async () => {
      if (!codeData) {
        alert('An unexpected error occurred. Invalid data.');
        return;
      }
      try {
        const result = await handleGuestGreeting(firstName, codeData);
        if (result.success) {
          // The guest user was created and logged in successfully.
          // Now, redirect to the group page.
          window.location.href = `/g/${codeData.group.slug}`;
        } else {
          alert(result.error || 'An unknown error occurred.');
        }
      } catch (error) {
        console.error('Guest signup failed:', error);
        alert('An unexpected error occurred. Please try again.');
      }
    });
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-18 bg-background">
        {(!isValidCode || !codeData) ? (
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] text-center p-4">
            <div className="max-w-md w-full">
              <h1 className="text-4xl font-bold mb-4 text-destructive">Invalid Link</h1>
              <p className="text-xl">
                This greeting link is either expired or invalid. Please ask for a new one.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] text-center p-6 ">
            <div className="max-w-md w-full">
              <h1 className="text-4xl font-bold mb-4">Welcome to {codeData.group.name}!</h1>
              <p className="text-2xl mb-8">
                {codeData.user.firstName} just greeted you.
              </p>

              {!showSignupForm ? (
                <div className="space-y-4">
                  <p className="text-left mb-8">
                    Enter (first-timers and guests) or Login to 
                    see {codeData.user.firstName} and others at {codeData.group.name}. 
                  </p>
                  <div className="text-mb-8">
                  </div>
                  <div className="flex justify-center gap-4 mb-8">
                    <button
                      onClick={() => setShowSignupForm(true)}
                      className="px-6 py-2 rounded-md border bg-primary text-primary-foreground"
                    >
                      Enter
                    </button>
                    <button
                      onClick={handleLogin}
                      className="px-6 py-2 rounded-md"
                    >
                      Login
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleFormSubmit} className="space-y-4">
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Enter with just your first name"
                    className="w-full px-4 py-2 border rounded-md dark:bg-gray-800"
                    required
                  />
                  <button
                    type="submit"
                    disabled={isPending}
                    className="w-full px-6 py-2 rounded-md bg-primary text-primary-foreground disabled:opacity-50"
                  >
                    {isPending ? 'Entering...' : 'Enter the Group'}
                  </button>
                </form>
              )}
              <p className="text-left mt-20 text-gray-500 dark:text-gray-400">
                NameGame is the fun, easy way to meet and remember people in big groups.
              </p>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
