"use client";

import { useState, useEffect, Fragment } from "react";
import { Tab } from "@headlessui/react";
import { useInView } from "react-intersection-observer";
import { GroupData, MemberWithUser } from "@/types";
import MemberCard from "@/components/MemberCard";
import { getPaginatedMembers } from "./actions";
import { useParams } from "next/navigation";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

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
  currentUserMember,
  slug,
  searchQuery,
}: {
  initialMembers: MemberWithUser[];
  listType: "sunDeck" | "iceBlock";
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

  return (
    <div
      className={`grid gap-4 ${
        listType === "iceBlock"
          ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
          : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
      }`}
    >
      {members.map((member) => (
        <MemberCard key={member.userId} member={member} listType={listType} />
      ))}
      {members.length === 0 && !hasMore && (
        <p className="text-center text-gray-500 dark:text-gray-400 col-span-1">
          Looks like you've greeted everyone!
        </p>
      )}
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

export default function GroupTabs({
  sunDeckMembers,
  iceBlockMembers,
  sunDeckCount,
  iceBlockCount,
  currentUserMember,
}: GroupTabsProps) {
  const [searchQueries, setSearchQueries] = useState({
    sunDeck: "",
    iceBlock: "",
  });
  const params = useParams();
  const slug = params.slug as string;
  const categories = {
    Greeted: { members: sunDeckMembers, type: "sunDeck" as const, count: sunDeckCount },
    "Not Greeted": { members: iceBlockMembers, type: "iceBlock" as const, count: iceBlockCount },
  };

  return (
    <TooltipProvider>
      <div className="w-full max-w-5xl mx-auto px-2 sm:px-0">
        <Tab.Group>
          <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/20 p-1">
            {Object.entries(categories).map(([category, { count }]) => (
              <Tab key={category} as={Fragment}>
                {({ selected }) => (
                  <button
                    className={classNames(
                      "w-full rounded-lg py-2.5 text-sm font-medium leading-5 flex items-center justify-center gap-2",
                      "ring-white/60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2",
                      selected
                        ? "bg-white text-blue-700 shadow"
                        : "text-blue-700 hover:bg-blue-500/10 dark:text-blue-200 dark:hover:bg-white/10 dark:hover:text-white"
                    )}
                  >
                    {category}
                    <Badge variant={selected ? "default" : "secondary"}>{count}</Badge>
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
                  "rounded-xl bg-white dark:bg-gray-800 p-3",
                  "ring-white/60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2"
                )}
              >
                {type === "sunDeck" ? (
                  <p className="text-sm mb-2 text-gray-500 dark:text-gray-400">
                    People you've greeted and when.
                  </p>
                ) : (
                  <p className="text-sm mb-2 text-gray-500 dark:text-gray-400">
                    Greet these people to see them in color.
                  </p>
                )}

                <div className="relative mb-4">
                  <input
                    type="text"
                    placeholder={`Search ${type === "sunDeck" ? "greeted" : "not greeted"} members...`}
                    value={searchQueries[type]}
                    onChange={(e) =>
                      setSearchQueries({
                        ...searchQueries,
                        [type]: e.target.value,
                      })
                    }
                    className="w-full px-3 pr-10 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-md dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {searchQueries[type] && (
                    <button
                      onClick={() =>
                        setSearchQueries({ ...searchQueries, [type]: '' })
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
