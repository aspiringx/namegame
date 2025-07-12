import { auth } from '@/auth';
import GreetButton from '@/components/GreetButton';
import Header from '@/components/Header';
import { GroupProvider } from '@/components/GroupProvider';
import { getGroup } from './data';
import { headers } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';

interface GroupLayoutProps {
  children: React.ReactNode;
  params: {
    slug: string;
  };
}

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const params = await props.params;
  const { slug } = params;
  const group = await getGroup(slug);

  if (!group) {
    return {
      title: 'Group Not Found',
    };
  }

  return {
    title: group.name,
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
  const group = await getGroup(slug);

  if (!group) {
    notFound();
  }

  const currentUserMembership = group.members.find((m) => m.user.id === session?.user?.id);

  const isSuperAdmin =
    session?.user?.roles.some(
      (r) => r.groupSlug === 'global-admin' && r.role === 'super'
    ) ?? false;

  // The /greet page is public and should not be protected by this authorization.
  if (!pathname.includes('/greet') && !currentUserMembership && !isSuperAdmin) {
    redirect('/');
  }



  const isAuthorizedMember = currentUserMembership && ['admin', 'member'].includes(currentUserMembership.role);

  return (
    <GroupProvider group={group}>
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
