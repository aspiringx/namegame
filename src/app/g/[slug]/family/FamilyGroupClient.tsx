'use client';

import { useState, useEffect, useMemo } from 'react';
import { useInView } from 'react-intersection-observer';
import { MemberWithUser } from '@/types';
import { getPaginatedMembers } from './actions';
import FamilyMemberCard from '@/components/FamilyMemberCard';
import { getFamilyRelationships } from './actions';
import { getRelationship } from '@/lib/family-tree';
import { Button } from '@/components/ui/button';
import { ArrowUp, ArrowDown, LayoutGrid, List } from 'lucide-react';
import { useGroup } from '@/components/GroupProvider';
import { GuestMessage } from '@/components/GuestMessage';

type SortKey = 'firstName' | 'lastName';
type SortDirection = 'asc' | 'desc';

interface FamilyGroupClientProps {
  initialMembers: MemberWithUser[];
  groupSlug: string;
  initialMemberCount: number;
}

export function FamilyGroupClient({
  initialMembers,
  groupSlug,
  initialMemberCount,
}: FamilyGroupClientProps) {
  const [members, setMembers] = useState(initialMembers);
  const [page, setPage] = useState(2);
  const [hasMore, setHasMore] = useState(initialMembers.length < initialMemberCount);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({ key: 'firstName', direction: 'asc' });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { group, isAuthorizedMember, currentUserMember } = useGroup();
  const [relationshipMap, setRelationshipMap] = useState<Map<string, string>>(new Map());
  const { ref, inView } = useInView();

  useEffect(() => {
    async function fetchAndSetRelationships() {
      if (group?.slug && currentUserMember) {
        const relationships = await getFamilyRelationships(group.slug);
        const newMap = new Map<string, string>();

        for (const alter of members) {
          if (alter.userId === currentUserMember.userId) continue;
          const result = getRelationship(currentUserMember.userId, alter.userId, relationships);
          if (result) {
            newMap.set(alter.userId, result.relationship || '');
          }
        }
        setRelationshipMap(newMap);
      }
    }

    fetchAndSetRelationships();
  }, [group, members, currentUserMember]);

  useEffect(() => {
    const loadMoreMembers = async () => {
      if (inView && hasMore) {
        if (!groupSlug) return;
        const newMembers = await getPaginatedMembers(groupSlug, page);
        if (newMembers.length > 0) {
          setMembers((prevMembers) => [...prevMembers, ...newMembers]);
          setPage((prevPage) => prevPage + 1);
        } else {
          setHasMore(false);
        }
      }
    };

    loadMoreMembers();
  }, [inView, hasMore, page, groupSlug]);

  const handleSort = (key: SortKey) => {
    setSortConfig(prev => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const filteredAndSortedMembers = useMemo(() => {
    const sortFunction = (a: MemberWithUser, b: MemberWithUser) => {
      const aName = a.user.name || '';
      const bName = b.user.name || '';
      let aValue: string, bValue: string;

      if (sortConfig.key === 'lastName') {
        aValue = aName.split(' ').pop() || '';
        bValue = bName.split(' ').pop() || '';
      } else { // firstName
        aValue = aName.split(' ')[0] || '';
        bValue = bName.split(' ')[0] || '';
      }

      if (aValue.toLowerCase() < bValue.toLowerCase()) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue.toLowerCase() > bValue.toLowerCase()) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    };

    return members
      .filter(member =>
        member.user.name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort(sortFunction);
  }, [members, searchQuery, sortConfig]);

  return (
    <div className="container mx-auto px-4 py-0">
      <div className="flex items-center mb-4">
        <div className="flex items-center gap-2">
          {(['firstName', 'lastName'] as const).map(key => {
            const isActive = sortConfig.key === key;
            const SortIcon = sortConfig.direction === 'asc' ? ArrowUp : ArrowDown;
            return (
              <Button
                key={key}
                variant={isActive ? 'secondary' : 'ghost'}
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
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="relative mb-4">
        <input
          type="text"
          placeholder="Search members..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 pr-10 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-md dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div
        className={
          viewMode === 'list'
            ? "flex flex-col gap-2 divide-y divide-gray-200 dark:divide-gray-700"
            : "grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
        }
      >
        {filteredAndSortedMembers.map((member) => (
          <FamilyMemberCard
            key={member.userId}
            member={member}
            viewMode={viewMode}
            relationship={relationshipMap.get(member.userId)}
          />
        ))}
      </div>

      {hasMore && (
        <div ref={ref} className="text-center p-4">
          Loading more...
        </div>
      )}
    </div>
  );
}
