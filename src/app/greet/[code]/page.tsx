import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import GreetPageClient from './client'; // Keep client component separate

// This is the main page component, which is a Server Component.
export default async function GreetPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const session = await auth();

  const codeData = await prisma.code.findUnique({
    where: { code },
    include: {
      user: { select: { firstName: true, id: true } },
      group: { select: { slug: true, id: true } },
    },
  });

  const isValidCode = !!codeData;

  // If the code is valid and the user is authenticated, handle the greeting and redirect.
  if (isValidCode && session?.user?.id) {
    // Prevent users from greeting themselves.
    if (session.user.id === codeData.user.id) {
      return redirect(`/g/${codeData.group.slug}`);
    }

    // The action is defined in a separate file to keep this component clean.
    const { handleAuthenticatedGreeting } = await import('./actions');
    await handleAuthenticatedGreeting(codeData, session.user.id);
    return redirect(`/g/${codeData.group.slug}`);
  }

  // If the code is invalid or the user is not authenticated, render the client component.
  return <GreetPageClient codeData={codeData} isValidCode={isValidCode} />;
}
