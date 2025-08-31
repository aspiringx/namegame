'use client';

import { useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface LoginHandlerProps {
  code: string;
}

export default function LoginHandler({ code }: LoginHandlerProps) {
  const router = useRouter();

  useEffect(() => {
    const attemptSignIn = async () => {
      try {
        const result = await signIn('one-time-code', {
          code,
          redirect: false, // We will handle redirect manually
        });

        if (result?.error) {
          throw new Error(result.error);
        }

        if (result?.ok) {
          toast.success('Login successful! Welcome back.');
          router.push('/me?sso=true');
          router.refresh(); // Refresh the page to update session state
        }
      } catch (error) {
        toast.error('Login failed. The link may be invalid or expired.');
        router.push('/login?error=sso_failed');
      }
    };

    attemptSignIn();
  }, [code, router]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center">
      <p className="text-lg">Please wait while we sign you in...</p>
    </div>
  );
}
