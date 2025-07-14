import { auth } from '@/auth';
import GreetButton from '@/components/GreetButton';
import Header from '@/components/Header';
import { GroupProvider } from '@/components/GroupProvider';
import { getGroup } from './data';
import { headers } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const params = await props.params;
  const { slug } = params;
  const data = await getGroup(slug, 5);

  if (!data) {
    return {
      title: 'Group Not Found',
    };
  }

  return {
    title: data.name,
  };
}

export default async function GroupLayout(props: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  const headersList = await headers();
  const pathname = headersList.get('next-url') || '';
  const params = await props.params;

  const {
    children
  } = props;

  const { slug } = params;
  const session = await auth();
  const data = await getGroup(slug, 5);

  if (!data) {
    notFound();
  }

  const { sunDeckMembers, iceBlockMembers, currentUserMember, isSuperAdmin } = data;

  // The /greet page is public and should not be protected by this authorization.
  if (!pathname.includes('/greet') && !currentUserMember && !isSuperAdmin) {
    redirect('/');
  }

  const isAuthorizedMember = currentUserMember && ['admin', 'member', 'super'].includes(currentUserMember.role);

  return (
    <GroupProvider value={{ group: data, sunDeckMembers, iceBlockMembers, currentUserMember, isSuperAdmin }}>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow pt-20 pb-24">
          {children}
        </main>
        <footer className="fixed bottom-0 left-0 w-full h-16 bg-white dark:bg-gray-900 flex justify-center items-center shadow-[0_-2px_4px_rgba(0,0,0,0.1)] dark:shadow-[0_-2px_4px_rgba(255,255,255,0.1)]">
          {isAuthorizedMember ? (
            <GreetButton />
          ) : (
            <p className="text-gray-600 dark:text-gray-400">&copy; 2025 NameGame</p>
          )}
        </footer>
      </div>
    </GroupProvider>
  );
}
