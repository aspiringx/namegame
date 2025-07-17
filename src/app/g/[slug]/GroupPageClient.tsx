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

  const { sunDeckMembers, iceBlockMembers, currentUserMember, sunDeckCount, iceBlockCount } = groupData;

  return (
    <div className="container mx-auto px-4 py-0">
      {currentUserMember?.role === 'guest' && (
        <div className="mb-4 rounded-md bg-yellow-50 p-4 text-sm text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300">
          <p className="mb-4">
            Welcome {currentUserMember.user.firstName}! You're playing as a guest.
            {' '}
            <Link href="/user" className="font-bold underline hover:text-yellow-900 dark:hover:text-yellow-200">
              Click here to update your profile.
            </Link>
          </p>
          <p>
            <button 
              onClick={() => setIsExpanded(!isExpanded)} 
              className="focus:outline-none hover:underline hover:text-yellow-900 dark:hover:text-yellow-200"
              aria-expanded={isExpanded}
            >Tap here to learn more {isExpanded ? '▼' : '▶'}
            </button>
          </p>
          
          {isExpanded && (
            <div className="mt-3 ml-4 pt-3 border-t border-yellow-200 dark:border-yellow-800">
              <ul className="list-disc list-outside space-y-2">
                <li><b>You're welcome to continue as a guest</b> with limited features and visibility</li>
                <li><b>Your temporary username and password are <i>{currentUserMember.user.username}</i> and <i>password123</i></b></li>
                <li className="ml-4">You can change them in your <Link href="/user" className="font-bold underline hover:text-yellow-900 dark:hover:text-yellow-200">profile</Link></li>
                <li><b>Save your credentials</b> to login here or on other devices after this session expires</li>
                <li><b>Add your last name and a pic</b> to unlock features and be more visible in this group</li>
              </ul>
              <p className="mt-4 -ml-4"><b>Any other questions?</b> Just ask the person who greeted you last (first pic below).</p>
              <div className="mt-4 text-center">
                <button 
                  onClick={() => setIsExpanded(!isExpanded)} 
                  className="px-4 py-2 rounded-md dark:border-yellow-700 bg-yellow-100 dark:bg-yellow-900 text-yellow-900 dark:text-yellow-100 hover:bg-yellow-200 dark:hover:bg-yellow-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                  aria-expanded={isExpanded}
                >
                  Close guest tips
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      <GroupTabs sunDeckMembers={sunDeckMembers} iceBlockMembers={iceBlockMembers} currentUserMember={currentUserMember} sunDeckCount={sunDeckCount} iceBlockCount={iceBlockCount} />
    </div>
  );
}
