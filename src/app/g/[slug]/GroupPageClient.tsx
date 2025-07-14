'use client';

import { GroupData } from '@/types';
import Link from 'next/link';
import GroupTabs from './GroupTabs';
import { useState } from 'react';

export default function GroupPageClient({ groupData }: { groupData: GroupData }) {
  const [isExpanded, setIsExpanded] = useState(false);
  if (!groupData) {
    return <div>Group not found.</div>;
  }

  const { sunDeckMembers, iceBlockMembers, currentUserMember } = groupData;

  return (
    <div className="container mx-auto px-4 py-0">
      {/* {currentUserMember?.role === 'guest' && ( */}
      {currentUserMember && (
        <div className="mb-4 rounded-md bg-yellow-50 p-4 text-sm text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300">
          <p className="mb-4">
            Welcome {currentUserMember.user.firstName}, you're playing as a guest.
            {' '}
            <Link href="/user" className="font-bold underline hover:text-yellow-900 dark:hover:text-yellow-200">
              Click here to change your profile.
            </Link>
          </p>
          <p>
            <button 
              onClick={() => setIsExpanded(!isExpanded)} 
              className="focus:outline-none hover:underline hover:text-yellow-900 dark:hover:text-yellow-200"
              aria-expanded={isExpanded}
            >Learn more {isExpanded ? '▼' : '▶'}
            </button>
          </p>
          
          {isExpanded && (
            <div className="mt-3 pt-3 border-t border-yellow-200 dark:border-yellow-800">
              <ul className="list-disc list-outside space-y-2">
                <li>You can continue as a guest with limited features and visibility</li>
                <li>Your temporary username and password are: <i>{currentUserMember.user.username}</i> and <i>password123</i></li>
                <li><Link href="/user" className="font-bold underline hover:text-yellow-900 dark:hover:text-yellow-200">Change your username and password here</Link> to something more memorable</li>
                <li>Add your last name and a real photo if/when you want to unlock all features and be more visible</li>
              </ul>
            </div>
          )}
        </div>
      )}
      <GroupTabs sunDeckMembers={sunDeckMembers} iceBlockMembers={iceBlockMembers} currentUserMember={currentUserMember} />
    </div>
  );
}
