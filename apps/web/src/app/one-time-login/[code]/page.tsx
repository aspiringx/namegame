import { notFound, redirect } from 'next/navigation';
import { addDays, isBefore } from 'date-fns';

import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import LoginHandler from './LoginHandler';

async function validateCode(code: string) {
  const loginCode = await prisma.code.findUnique({
    where: { code },
  });

  if (!loginCode) {
    return { error: 'Invalid login code.' };
  }

  const expiresAt = addDays(loginCode.createdAt, 7);
  if (isBefore(expiresAt, new Date())) {
    return { error: 'Login code has expired.' };
  }

  return { success: true };
}

export default async function OneTimeLoginPage(props: {
  params: Promise<{ code: string }>
}) {
  const params = await props.params
  const session = await auth();
  if (session?.user?.id) {
    redirect('/me');
  }

  const { code } = params;
  if (!code) {
    notFound();
  }

  const result = await validateCode(code);

  if (result.error) {
    const url = new URL('/login', 'https://namegame.app'); // Base URL is required but not used for relative redirects
    url.searchParams.set('error', 'InvalidOrExpiredCode');
    url.searchParams.set('message', result.error);
    redirect(url.pathname + url.search);
  }

  return <LoginHandler code={code} />;
}
