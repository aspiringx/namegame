import { auth } from '@/auth';
import GreetButton from '@/components/GreetButton';
import Header from '@/components/Header';
import { GroupProvider } from '@/components/GroupProvider';
import { getGroupTypeBySlug } from './data';
import { getGroup as getAllGroup } from './all/data';
import { getGroup as getFamilyGroup } from './family/data';
import { GroupData, FamilyGroupData } from '@/types';

// Helper to fetch the correct group data based on type
const getGroupForLayout = async (slug: string, limit?: number): Promise<GroupData | FamilyGroupData | null> => {
  const groupTypeData = await getGroupTypeBySlug(slug);
  if (!groupTypeData) {
    return null;
  }

  if (groupTypeData.groupType.code === 'family') {
    return getFamilyGroup(slug, limit);
  }

  return getAllGroup(slug, limit);
};

import { headers } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const params = await props.params;
  const { slug } = params;
  const data = await getGroupForLayout(slug, 5);

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
  const data = await getGroupForLayout(slug, 5);

  if (!data) {
    notFound();
  }

  // Adapt data for GroupProvider based on group type
  const isFamilyGroup = 'members' in data;

  const groupForProvider: GroupData = isFamilyGroup
    ? {
        ...(data as FamilyGroupData),
        sunDeckMembers: [],
        iceBlockMembers: (data as FamilyGroupData).members,
        sunDeckCount: 0,
        iceBlockCount: (data as FamilyGroupData).memberCount,
      }
    : (data as GroupData);

  const { sunDeckMembers, iceBlockMembers, currentUserMember, isSuperAdmin } = groupForProvider;

  // The /greet page is public and should not be protected by this authorization.
  if (!pathname.includes('/greet') && !currentUserMember && !isSuperAdmin) {
    redirect('/');
  }

  const isAuthorizedMember = !!(currentUserMember && ['admin', 'member', 'super'].includes(currentUserMember.role.code));

  return (
    <GroupProvider
      value={{ 
        group: groupForProvider, 
        sunDeckMembers, 
        iceBlockMembers, 
        currentUserMember, 
        isSuperAdmin, 
        isAuthorizedMember 
      }}
    >
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
