import { auth } from '@/auth';
import Header from '@/components/Header';
import { GroupProvider } from '@/components/GroupProvider';
import { getGroup } from './data';
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

  const isMember = group.members.some((m) => m.user.id === session?.user?.id);

  const isSuperAdmin =
    session?.user?.roles.some(
      (r) => r.groupSlug === 'global-admin' && r.role === 'super'
    ) ?? false;

  if (!isMember && !isSuperAdmin) {
    redirect('/');
  }



  return (
  <GroupProvider group={group}>
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow pt-20">
        {children}
      </main>
    </div>
  </GroupProvider>
);
}
