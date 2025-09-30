'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { verifyEmail } from './actions'
import { CheckCircle, XCircle, Loader } from 'lucide-react'
import Link from 'next/link'

function VerificationContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [result, setResult] = useState<{
    success: boolean
    message: string
    isAuthenticated: boolean
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) {
      setResult({
        success: false,
        message: 'No verification token found.',
        isAuthenticated: false,
      })
      setLoading(false)
      return
    }

    const processVerification = async () => {
      setLoading(true)
      const response = await verifyEmail(token)

      if (response.success && response.isAuthenticated) {
        // If the user is already logged in, redirect them to their profile.
        router.push('/me?verified=true')
        // We are redirecting, so no need to set state and cause a re-render here.
        return
      }

      setResult(response)
      setLoading(false)
    }

    processVerification()
  }, [token, router])

  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col items-center justify-start pt-12">
      <div className="bg-card text-card-foreground w-full max-w-md space-y-6 rounded-lg p-8 text-center shadow-md">
        {loading && (
          <div className="flex flex-col items-center space-y-4">
            <Loader className="text-primary h-16 w-16 animate-spin" />
            <h1 className="text-2xl font-bold">Verifying your email...</h1>
          </div>
        )}

        {!loading && result && (
          <div className="flex flex-col items-center space-y-4">
            {result.success ? (
              <CheckCircle className="h-16 w-16 text-green-500" />
            ) : (
              <XCircle className="h-16 w-16 text-red-500" />
            )}
            <h1 className="text-2xl font-bold">{result.message}</h1>
            {result.success && (
              <Link
                href="/login"
                className="text-primary-foreground bg-primary hover:bg-primary/90 focus:ring-primary inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-offset-2 focus:outline-none"
              >
                Click here to log in
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerificationContent />
    </Suspense>
  )
}
