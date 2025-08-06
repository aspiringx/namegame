"use client";

import { useState, useEffect, Fragment, useMemo } from "react";
import { useRouter } from 'next/navigation';
import { Tab } from "@headlessui/react";
import { useInView } from "react-intersection-observer";
import { MemberWithUser, FullRelationship } from "@/types";
import MemberCard from "@/components/MemberCard";
import { getPaginatedMembers } from "./actions";
import { getRelationship } from '@/lib/family-tree';
import { useGroup } from '@/components/GroupProvider';
import { GuestMessage } from '@/components/GuestMessage';
import { TooltipProvider } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown, LayoutGrid, List } from "lucide-react";


interface GroupTabsProps {
  sunDeckMembers: MemberWithUser[];
  iceBlockMembers: MemberWithUser[];
  sunDeckCount: number;
  iceBlockCount: number;
  currentUserMember: MemberWithUser | undefined;
}

function classNames(...classes: (string | boolean)[]) {
  return classes.filter(Boolean).join(" ");
}

function SearchableMemberList({
  initialMembers,
  listType,
  slug,
  searchQuery,
  viewMode,
}: {
  initialMembers: MemberWithUser[];
  listType: "sunDeck" | "iceBlock";
  slug: string;
  searchQuery: string;
  viewMode: 'grid' | 'list';
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
    if (inView && hasMore && !isLoading && slug) {
      setIsLoading(true);
      getPaginatedMembers(slug, listType, page).then((newMembers) => {
        if (newMembers.length > 0) {
          setMembers((prev) => {
            const existingUserIds = new Set(prev.map((m) => m.userId));
            const uniqueNewMembers = newMembers.filter(
              (m) => !existingUserIds.has(m.userId)
            );
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

  const isListView = listType === 'sunDeck' && viewMode === 'list';

  return (
    <div className={isListView ? 'divide-y divide-gray-200 dark:divide-gray-700' : `grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3`}>
      {members.map((member) => (
        <MemberCard
          key={member.userId}
          member={member}
          listType={listType}
          viewMode={viewMode}
        />
      ))}
      {hasMore && (
        <div
          ref={ref}
          className="text-center text-gray-500 dark:text-gray-400 col-span-1 py-4"
        >
          {isLoading ? "Loading..." : ""}
        </div>
      )}
    </div>
  );
}

type SortKey = "greeted" | "firstName" | "lastName";
type SortDirection = "asc" | "desc";

type TabInfo = {
  name: string;
  count: number;
  members: MemberWithUser[];
  type: "sunDeck" | "iceBlock";
};

export default function GroupTabs({
  sunDeckMembers,
  iceBlockMembers,
  sunDeckCount,
  iceBlockCount,
  currentUserMember,
}: GroupTabsProps) {
  const router = useRouter();


  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({ 
    key: 'greeted', 
    direction: 'desc' 
  });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { group, isAuthorizedMember, currentUserMember: ego } = useGroup();

  const [searchQueries, setSearchQueries] = useState({
    sunDeck: '',
    iceBlock: '',
  });

  const handleSort = (key: SortKey) => {
    setSortConfig(current => {
      if (current.key === key) {
        return { ...current, direction: current.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: key === 'greeted' ? 'desc' : 'asc' };
    });
  };

  const sortedMembers = useMemo(() => {
    const sortableSunDeck = [...sunDeckMembers];
    const sortableIceBlock = [...iceBlockMembers];

    const sortFunction = (a: MemberWithUser, b: MemberWithUser) => {
      if (sortConfig.key === 'greeted') {
        const aDate = a.relationUpdatedAt ? new Date(a.relationUpdatedAt).getTime() : 0;
        const bDate = b.relationUpdatedAt ? new Date(b.relationUpdatedAt).getTime() : 0;
        return sortConfig.direction === 'asc' ? aDate - bDate : bDate - aDate;
      }
      const aVal = a.user[sortConfig.key] || '';
      const bVal = b.user[sortConfig.key] || '';
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    };

    sortableSunDeck.sort(sortFunction);
    sortableIceBlock.sort(sortFunction);

    return { sunDeck: sortableSunDeck, iceBlock: sortableIceBlock };
  }, [sunDeckMembers, iceBlockMembers, sortConfig]);

  const sunDeckTab = {
    name: "Greeted",
    type: 'sunDeck' as const,
    members: sortedMembers.sunDeck,
    count: sunDeckCount,
  };
  const iceBlockTab = {
    name: "Not Greeted",
    type: 'iceBlock' as const,
    members: sortedMembers.iceBlock,
    count: iceBlockCount,
  };

  const tabs = [sunDeckTab, iceBlockTab];

  useEffect(() => {
    // Using `isAuthorizedMember === false` to prevent redirecting on the initial `undefined` state.
    if (isAuthorizedMember === false) {
      router.push('/');
    }
  }, [isAuthorizedMember, router]);


  return (
    <TooltipProvider>
      <div className="w-full px-2 sm:px-0">
        <Tab.Group>
          <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/20 p-1">
            {tabs.map((tab) => (
              <Tab
                key={tab.name}
                className={({ selected }) =>
                  classNames(
                    "w-full py-2.5 text-sm leading-5 font-medium rounded-lg",
                    "focus:outline-none focus:ring-2 ring-offset-2 ring-offset-blue-400 ring-white ring-opacity-60",
                    selected
                     ? 'bg-white text-blue-700 shadow dark:bg-gray-800 dark:text-white'
                      : 'text-gray-600 dark:text-blue-100 hover:bg-white/[0.12] hover:text-white'
                  )
                }
              >
                {({ selected }) => (
                  <div className="flex items-center justify-center gap-2">
                    <span>{tab.name}</span>
                    <Badge
                      className={classNames(
                        'px-2 py-0.5 text-xs font-medium rounded-full',
                        selected
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                      )}
                    >
                      {tab.count}
                    </Badge>
                  </div>
                )}
              </Tab>
            ))}
          </Tab.List>
          <Tab.Panels className="mt-2">
            {tabs.map((tab: TabInfo) => (
              <Tab.Panel
                key={tab.name}
                className={classNames(
                  'rounded-xl bg-white p-3 dark:bg-gray-800',
                  'ring-white/60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2'
                )}
              >
                {tab.type === 'sunDeck' ? (
                  <div className="flex items-center mb-4">
                    <div className="flex items-center gap-2">
                    {(['greeted', 'firstName', 'lastName'] as const).map(key => {
                      const isActive = sortConfig.key === key;
                      const SortIcon = sortConfig.direction === 'asc' ? ArrowUp : ArrowDown;
                      return (
                        <Button 
                          key={key} 
                          variant={isActive ? "secondary" : "ghost"} 
                          size="sm"
                          onClick={() => handleSort(key)}
                          className="capitalize flex items-center gap-1"
                        >
                          {key.replace('Name', '')}
                          {isActive && <SortIcon className="h-4 w-4" />}
                        </Button>
                      );
                    })}
                    </div>
                    <div className="flex items-center gap-2 ml-auto">
                      <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('grid')}>
                        <LayoutGrid className="h-4 w-4" />
                      </Button>
                      <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('list')}>
                        <List className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm mb-4 text-gray-500 dark:text-gray-400">
                    People you haven't greeted.
                  </p>
                )}

                {tab.count > 3 && (
                <div className="relative mb-4">
                  <input
                    type="text"
                    placeholder={`Search ${tab.type === "sunDeck" ? "greeted" : "not greeted"} members...`}
                    value={searchQueries[tab.type]}
                    onChange={(e) =>
                      setSearchQueries({
                        ...searchQueries,
                        [tab.type]: e.target.value,
                      })
                    }
                    className="w-full px-3 pr-10 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-md dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {searchQueries[tab.type] && (
                    <button
                      onClick={() =>
                        setSearchQueries({ ...searchQueries, [tab.type]: '' })
                      }
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      aria-label="Clear search"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  )}
                </div>
                )}
                <SearchableMemberList
                  initialMembers={tab.members}
                  listType={tab.type}
                  slug={group?.slug || ''}
                  searchQuery={searchQueries[tab.type]}
                  viewMode={viewMode}
                />
              </Tab.Panel>
            ))}
          </Tab.Panels>
        </Tab.Group>
      </div>
    </TooltipProvider>
  );
}
