'use client';

import { useState, useEffect, Fragment } from 'react';
import { Tab } from '@headlessui/react';
import { useInView } from 'react-intersection-observer';
import { GroupWithMembers } from '@/types';
import MemberCard from '@/components/MemberCard';
import { getPaginatedMembers } from './actions';
import { useParams } from 'next/navigation';

interface GroupTabsProps {
  sunDeckMembers: GroupWithMembers['members'];
  iceBlockMembers: GroupWithMembers['members'];
}

function classNames(...classes: (string | boolean)[]) {
  return classes.filter(Boolean).join(' ');
}

function MemberList({ initialMembers, listType }: { initialMembers: GroupWithMembers['members']; listType: 'sunDeck' | 'iceBlock' }) {
  const params = useParams();
  const slug = params.slug as string;
  const [members, setMembers] = useState(initialMembers);
  const [page, setPage] = useState(2);
  const [hasMore, setHasMore] = useState(initialMembers.length > 0);
  const [isLoading, setIsLoading] = useState(false);
  const { ref, inView } = useInView({ threshold: 0 });

  useEffect(() => {
    if (inView && hasMore && !isLoading) {
      setIsLoading(true);
      getPaginatedMembers(slug, listType, page).then((newMembers) => {
        if (newMembers.length > 0) {
          setMembers((prev) => [...prev, ...newMembers]);
          setPage((prev) => prev + 1);
        } else {
          setHasMore(false);
        }
        setIsLoading(false);
      });
    }
  }, [inView, hasMore, isLoading, slug, listType, page]);

  return (
    <div className="grid grid-cols-1 gap-4">
      {members.map((member) => (
        <MemberCard key={member.userId} member={member} />
      ))}
      {members.length === 0 && !hasMore && (
        <p className="text-center text-gray-500 dark:text-gray-400 col-span-1">No members found.</p>
      )}
      {hasMore && (
        <div ref={ref} className="text-center text-gray-500 dark:text-gray-400 col-span-1 py-4">
          {isLoading ? 'Loading...' : ''}
        </div>
      )}
    </div>
  );
}

export default function GroupTabs({ sunDeckMembers, iceBlockMembers }: GroupTabsProps) {
  const categories = {
    'Greeted': { members: sunDeckMembers, type: 'sunDeck' as const },
    'Not Greeted': { members: iceBlockMembers, type: 'iceBlock' as const },
  };

  return (
    <div className="w-full max-w-md px-2 sm:px-0">
      <Tab.Group>
        <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/20 p-1">
          {Object.keys(categories).map((category) => (
            <Tab
              key={category}
              as={Fragment}
            >
              {({ selected }) => (
                <button className={classNames(
                  'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                  'ring-white/60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                  selected
                    ? 'bg-white text-blue-700 shadow'
                    : 'text-blue-700 hover:bg-blue-500/10 dark:text-blue-200 dark:hover:bg-white/10 dark:hover:text-white'
                )}>
                  {category}
                </button>
              )}
            </Tab>
          ))}
        </Tab.List>
        <Tab.Panels className="mt-2">
          {Object.values(categories).map(({ members, type }, idx) => (
            <Tab.Panel
              key={idx}
              className={classNames(
                'rounded-xl bg-white dark:bg-gray-800 p-3',
                'ring-white/60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2'
              )}
            >
              <MemberList initialMembers={members} listType={type} />
            </Tab.Panel>
          ))}
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
}
