'use client';

import { useGroup } from '@/components/GroupProvider';
import Link from 'next/link';
import GroupTabs from './GroupTabs';

export default function GroupPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const { sunDeckMembers, iceBlockMembers, currentUserMember } = useGroup();

    return (
    <div className="container mx-auto px-4 py-0">
      {currentUserMember?.role === 'guest' && (
        <div className="mb-4 rounded-md bg-blue-50 p-4 text-sm text-blue-700 dark:bg-blue-900 dark:text-blue-300">
          Hi {currentUserMember.user.firstName}, you're playing as a guest.
          If/when you want to unlock all features,{' '}
          <Link href="/user" className="font-bold underline hover:text-blue-800 dark:hover:text-blue-200">
            complete your profile here
          </Link>{' '}
          with just a last name and photo. 
        </div>
      )}
      <GroupTabs sunDeckMembers={sunDeckMembers} iceBlockMembers={iceBlockMembers} currentUserMember={currentUserMember} />
    </div>
  );
}
