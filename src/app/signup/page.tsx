import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import SignupForm from './signup-form';

export default async function SignupPage() {
  const session = await auth();

  if (session) {
    redirect('/');
  }

  return <SignupForm />;
}

