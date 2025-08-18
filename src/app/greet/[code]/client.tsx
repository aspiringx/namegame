'use client'

import { useState, useTransition } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Cookies from 'js-cookie'
import { handleGuestGreeting, CodeData } from '@/app/greet/[code]/actions'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function GreetPageClient({
  codeData,
  isValidCode,
}: {
  codeData: CodeData | null
  isValidCode: boolean
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()
  const [showSignupForm, setShowSignupForm] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [signInFailed, setSignInFailed] = useState(false)

  const handleLogin = () => {
    if (codeData?.group?.slug) {
      const callbackUrl = pathname
      router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`)
    } else {
      router.push('/login')
    }
  }

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!firstName.trim()) {
      alert('Please enter your first name.')
      return
    }

    startTransition(async () => {
      if (!codeData) {
        alert('An unexpected error occurred. Invalid data.')
        return
      }
      try {
        const result = await handleGuestGreeting(firstName, codeData)

        if (result.success && result.signInFailed && result.credentials) {
          // Account created, but auto sign-in failed. Set cookies for retry.
          Cookies.set('temp_user_credentials', JSON.stringify(result.credentials), {
            expires: 1, // Expires in 1 day
          })
          Cookies.set('post_login_redirect', `/g/${codeData.group.slug}`, {
            expires: 1,
          })
          setSignInFailed(true)
        } else if (result.success) {
          // Account created and signed in successfully.
          window.location.href = `/g/${codeData.group.slug}`
        } else {
          alert(result.error || 'An unknown error occurred.')
        }
      } catch (error) {
        console.error('Guest signup failed:', error)
        alert('An unexpected error occurred. Please try again.')
      }
    })
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="bg-background container mx-auto flex-grow px-4 py-18 sm:px-6 lg:px-8">
        {!isValidCode || !codeData ? (
          <div className="flex min-h-[calc(100vh-12rem)] flex-col items-center justify-center p-4 text-center">
            <div className="w-full max-w-md">
              <h1 className="text-destructive mb-4 text-4xl font-bold">
                Invalid Link
              </h1>
              <p className="text-xl">
                This greeting link is either expired or invalid. Please ask for a
                new one.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex min-h-[calc(100vh-12rem)] flex-col items-center justify-center p-6 text-center">
            <div className="w-full max-w-md">
              <h1 className="mb-4 text-4xl font-bold">
                Welcome to {codeData.group.name}!
              </h1>
              <p className="mb-8 text-2xl">
                {codeData.user.firstName} just greeted you.
              </p>

              {signInFailed ? (
                <div className="space-y-4 rounded-md border border-yellow-300 bg-yellow-50 p-6 text-yellow-800">
                  <h2 className="text-2xl font-bold">Connection Issue</h2>
                  <p className="text-left">
                    It looks like your internet connection is slow or sporadic. We've
                    created your account and will attempt to proceed when this
                    improves. If you have access to WiFi, consider enabling it and
                    tap Refresh.
                  </p>
                  <button
                    onClick={() => window.location.reload()}
                    className="bg-primary text-primary-foreground w-full rounded-md px-6 py-2"
                  >
                    Refresh
                  </button>
                </div>
              ) : !showSignupForm ? (
                <div className="space-y-4">
                  <p className="mb-8 text-left">
                    Enter (first-timers and guests) or Login to see{' '}
                    {codeData.user.firstName} and others at{' '}
                    {codeData.group.name}.
                  </p>
                  <div className="mb-8 flex justify-center gap-4">
                    <button
                      onClick={() => setShowSignupForm(true)}
                      className="bg-primary text-primary-foreground rounded-md border px-6 py-2"
                    >
                      Enter
                    </button>
                    <button
                      onClick={handleLogin}
                      className="rounded-md px-6 py-2"
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
                    className="w-full rounded-md border px-4 py-2 dark:bg-gray-800"
                    required
                  />
                  <button
                    type="submit"
                    disabled={isPending}
                    className="bg-primary text-primary-foreground w-full rounded-md px-6 py-2 disabled:opacity-50"
                  >
                    {isPending ? 'Entering...' : 'Enter the Group'}
                  </button>
                </form>
              )}
              <p className="mt-20 text-left text-gray-500 dark:text-gray-400">
                NameGame is the fun, easy way to meet and remember people in big
                groups.
              </p>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
