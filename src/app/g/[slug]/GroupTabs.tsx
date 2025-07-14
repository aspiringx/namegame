'use client';

import { useState, useEffect, Fragment } from 'react';
import { Tab } from '@headlessui/react';
import { useInView } from 'react-intersection-observer';
import { GroupData, MemberWithUser } from '@/types';
import MemberCard from '@/components/MemberCard';
import { getPaginatedMembers } from './actions';
import { useParams } from 'next/navigation';
import { TooltipProvider } from '@/components/ui/tooltip';

interface GroupTabsProps {
  sunDeckMembers: MemberWithUser[];
  iceBlockMembers: MemberWithUser[];
  currentUserMember: MemberWithUser | undefined;
}

function classNames(...classes: (string | boolean)[]) {
  return classes.filter(Boolean).join(' ');
}

function SearchableMemberList({
  initialMembers,
  listType,
  currentUserMember,
  slug,
  searchQuery,
}: {
  initialMembers: MemberWithUser[];
  listType: 'sunDeck' | 'iceBlock';
  currentUserMember?: MemberWithUser;
  slug: string;
  searchQuery: string;
}) {
  const [members, setMembers] = useState(initialMembers);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialMembers.length > 9);
  const [isLoading, setIsLoading] = useState(false);
  const { ref, inView } = useInView({ threshold: 0 });

  useEffect(() => {
    setMembers(
      initialMembers.filter((member) =>
        member.user.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [searchQuery, initialMembers]);

  useEffect(() => {
    if (inView && hasMore && !isLoading) {
      setIsLoading(true);
      getPaginatedMembers(slug, listType, page).then((newMembers) => {
        if (newMembers.length > 0) {
          setMembers((prev) => {
            const existingUserIds = new Set(prev.map((m) => m.userId));
            const uniqueNewMembers = newMembers.filter((m) => !existingUserIds.has(m.userId));
            return [...prev, ...uniqueNewMembers];
          });
          setPage((prev) => prev + 1);
        } else {
          setHasMore(false);
        }
        setIsLoading(false);
      });
    }
  }, [inView, hasMore, isLoading, slug, listType, page]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {members.map((member) => (
        <MemberCard key={member.userId} member={member} listType={listType} />
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

export default function GroupTabs({ sunDeckMembers, iceBlockMembers, currentUserMember }: GroupTabsProps) {
  const [searchQueries, setSearchQueries] = useState({ sunDeck: '', iceBlock: '' });
  const params = useParams();
  const slug = params.slug as string;
  const categories = {
    'Greeted': { members: sunDeckMembers, type: 'sunDeck' as const },
    'Not Greeted': { members: iceBlockMembers, type: 'iceBlock' as const },
  };

  return (
    <TooltipProvider>
      <div className="w-full max-w-5xl mx-auto px-2 sm:px-0">
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
                {type === 'sunDeck' ? (
                  <p className="text-sm mb-2 text-gray-500 dark:text-gray-400">
                    People you've greeted and when.
                  </p>
                ) : (
                  <p className="text-sm mb-2 text-gray-500 dark:text-gray-400">
                    Greet these people to see bigger color pics and info they've shared.
                  </p>
                )}

                <div className="mb-4">
                  <input
                    type="text"
                    placeholder={`Search ${type === 'sunDeck' ? 'greeted' : 'not greeted'} members...`}
                    value={searchQueries[type]}
                    onChange={(e) => setSearchQueries({ ...searchQueries, [type]: e.target.value })}
                    className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-md dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                                <SearchableMemberList
                  initialMembers={members}
                  listType={type}
                  currentUserMember={currentUserMember}
                  slug={slug}
                  searchQuery={searchQueries[type]}
                />
              </Tab.Panel>
            ))}
          </Tab.Panels>
        </Tab.Group>
      </div>
    </TooltipProvider>
  );
}
