'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { verifyEmail } from './actions';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import Link from 'next/link';

function VerificationContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setResult({ success: false, message: 'No verification token found.' });
      setLoading(false);
      return;
    }

    const processVerification = async () => {
      setLoading(true);
      const response = await verifyEmail(token);
      setResult(response);
      setLoading(false);
    };

    processVerification();
  }, [token]);

  return (
    <div className="flex flex-col items-center justify-start pt-12 min-h-screen bg-background text-foreground">
      <div className="w-full max-w-md p-8 space-y-6 text-center bg-card text-card-foreground rounded-lg shadow-md">
        {loading && (
          <div className="flex flex-col items-center space-y-4">
            <Loader className="w-16 h-16 text-primary animate-spin" />
            <h1 className="text-2xl font-bold">Verifying your email...</h1>
          </div>
        )}

        {!loading && result && (
          <div className="flex flex-col items-center space-y-4">
            {result.success ? (
              <CheckCircle className="w-16 h-16 text-green-500" />
            ) : (
              <XCircle className="w-16 h-16 text-red-500" />
            )}
            <h1 className="text-2xl font-bold">{result.message}</h1>
            {result.success && (
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                Click here to log in
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerificationContent />
    </Suspense>
  );
}
