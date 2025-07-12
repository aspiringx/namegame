'use client';

import { useState, useTransition, ChangeEvent, useMemo } from 'react';
import type { GroupWithMembers } from './layout';
import Image from 'next/image';
import { searchUsers, addMember, removeMember, updateMember } from './actions';
import { GroupUserRole } from '@/generated/prisma';

type UserWithPhotoUrl = Awaited<ReturnType<typeof searchUsers>>[0];

interface GroupMembersProps {
  group: GroupWithMembers;
  isSuperAdmin: boolean;
  isGlobalAdminGroup: boolean;
}

export default function GroupMembers({ group, isSuperAdmin, isGlobalAdminGroup }: GroupMembersProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserWithPhotoUrl[]>([]);
  const [isSearching, startSearchTransition] = useTransition();
  const [isAdding, startAddTransition] = useTransition();
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');

  type SortableKey = 'username' | 'name' | 'role' | 'memberSince';
  const [sortConfig, setSortConfig] = useState<{ key: SortableKey; direction: 'ascending' | 'descending' } | null>({
    key: 'memberSince',
    direction: 'descending',
  });

  const handleAddMember = async (formData: FormData) => {
    startAddTransition(async () => {
      await addMember(formData);
      setSearchQuery('');
      setSearchResults([]);
    });
  };

  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    startSearchTransition(async () => {
      if (query.length > 1) {
        const users = await searchUsers(group.id, query);
        setSearchResults(users as UserWithPhotoUrl[]);
      } else {
        setSearchResults([]);
      }
    });
  };

  const sortedMembers = useMemo(() => {
    let sortableItems = [...group.members];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let aValue, bValue;

        switch (sortConfig.key) {
          case 'username':
            aValue = a.user.username;
            bValue = b.user.username;
            break;
          case 'name':
            aValue = `${a.user.firstName} ${a.user.lastName}`;
            bValue = `${b.user.firstName} ${b.user.lastName}`;
            break;
          default:
            aValue = a[sortConfig.key];
            bValue = b[sortConfig.key];
        }

        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [group.members, sortConfig]);

  const filteredMembers = useMemo(() => {
    return sortedMembers.filter((member) => {
      const fullName = `${member.user.firstName} ${member.user.lastName}`;
      return (
        member.user.username.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
        fullName.toLowerCase().includes(memberSearchQuery.toLowerCase())
      );
    });
  }, [sortedMembers, memberSearchQuery]);

  const requestSort = (key: SortableKey) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (key: SortableKey) => {
    if (!sortConfig || sortConfig.key !== key) return null;
    return sortConfig.direction === 'ascending' ? ' ▲' : ' ▼';
  };

  return (
    <div>
      <div className="mb-8 p-4 border rounded-lg dark:border-gray-700">
        <h2 className="text-xl font-semibold mb-4">Add New Member</h2>
        <div className="max-w-lg">
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearch}
            placeholder="Search for users by name, username, or email..."
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
          />
          {isSearching && <p className="text-sm text-gray-500 mt-2">Searching...</p>}
          {searchResults.length > 0 && (
            <ul className="mt-4 space-y-2">
              {searchResults.map((user) => (
                <li key={user.id} className="p-2 border rounded-md dark:border-gray-600 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Image
                      src={user.photoUrl}
                      alt={`${user.username}'s profile picture`}
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                    <div>
                      <p className="font-semibold">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-sm text-gray-500">@{user.username}</p>
                    </div>
                  </div>
                  <form action={handleAddMember} className="min-w-[320px]">
                    <input type="hidden" name="groupId" value={group.id} />
                    <input type="hidden" name="userId" value={user.id} />
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        name="memberSince"
                        defaultValue={new Date().getFullYear()}
                        placeholder="YYYY"
                        className="block w-24 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                      <select
                        name="role"
                        defaultValue={GroupUserRole.member}
                        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      >
                        {(() => {
                          const availableRoles: GroupUserRole[] = [
                            GroupUserRole.guest,
                            GroupUserRole.member,
                            GroupUserRole.admin,
                          ];
                          if (isSuperAdmin && isGlobalAdminGroup) {
                            availableRoles.push(GroupUserRole.super);
                          }
                          return availableRoles.map((role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ));
                        })()}
                      </select>
                      <button
                        type="submit"
                        disabled={isAdding}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                      >
                        {isAdding ? 'Adding...' : 'Add'}
                      </button>
                    </div>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Current Members ({filteredMembers.length})</h2>
        <div className="mb-4 max-w-lg">
          <input
            type="text"
            value={memberSearchQuery}
            onChange={(e) => setMemberSearchQuery(e.target.value)}
            placeholder="Search current members by name or username..."
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
          />
        </div>
        <div className="-mx-4 mt-8 overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:-mx-6 md:mx-0 md:rounded-lg dark:ring-white dark:ring-opacity-10">
          <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th scope="col" className="relative py-3.5 pl-4 pr-3 sm:pl-6">
                  <span className="sr-only">Photo</span>
                </th>
                <th
                  scope="col"
                  className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white sm:pl-6"
                >
                  <button type="button" className="font-semibold" onClick={() => requestSort('username')}>
                    Username
                    <span className="ml-1">{getSortIndicator('username')}</span>
                  </button>
                </th>
                <th
                  scope="col"
                  className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white sm:table-cell"
                >
                  <button type="button" className="font-semibold" onClick={() => requestSort('name')}>
                    Name
                    <span className="ml-1">{getSortIndicator('name')}</span>
                  </button>
                </th>
                <th
                  scope="col"
                  className="hidden px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white md:table-cell"
                >
                  <button type="button" className="font-semibold" onClick={() => requestSort('role')}>
                    Role
                    <span className="ml-1">{getSortIndicator('role')}</span>
                  </button>
                </th>
                <th
                  scope="col"
                  className="hidden px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white md:table-cell"
                >
                  <button type="button" className="font-semibold" onClick={() => requestSort('memberSince')}>
                    Member Since
                    <span className="ml-1">{getSortIndicator('memberSince')}</span>
                  </button>
                </th>
                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
              {filteredMembers.map((member) =>
                editingMemberId === member.userId ? (
                  <tr key={member.userId}>
                    <td colSpan={6} className="p-0">
                      <form action={updateMember} onSubmit={() => setEditingMemberId(null)} className="w-full">
                        <input type="hidden" name="groupId" value={group.id} />
                        <input type="hidden" name="userId" value={member.userId} />
                        <div className="flex items-center justify-between p-4">
                          <div className="flex items-center gap-4 flex-grow">
                            <Image
                              className="h-10 w-10 rounded-full object-cover"
                              src={member.user.photoUrl!}
                              alt={`${member.user.username}'s profile picture`}
                              width={40}
                              height={40}
                            />
                            <div className="w-full max-w-xs sm:max-w-none">
                              <p className="font-medium text-gray-900 dark:text-white">{member.user.username}</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400 sm:table-cell">
                                {member.user.firstName} {member.user.lastName}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <select
                              name="role"
                              defaultValue={member.role}
                              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            >
                              {(() => {
                                const availableRoles: GroupUserRole[] = [
                                  GroupUserRole.guest,
                                  GroupUserRole.member,
                                  GroupUserRole.admin,
                                ];
                                if (isSuperAdmin && isGlobalAdminGroup) {
                                  availableRoles.push(GroupUserRole.super);
                                }
                                return availableRoles.map((role) => (
                                  <option key={role} value={role}>
                                    {role}
                                  </option>
                                ));
                              })()}
                            </select>
                            <input
                              type="number"
                              name="memberSince"
                              defaultValue={member.memberSince ?? ''}
                              placeholder="YYYY"
                              className="block w-24 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                          </div>
                          <div className="flex items-center gap-2 pl-4">
                            <button
                              type="submit"
                              className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingMemberId(null)}
                              className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </form>
                    </td>
                  </tr>
                ) : (
                  <tr key={member.userId}>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          <Image
                            className="h-10 w-10 rounded-full object-cover"
                            src={member.user.photoUrl!}
                            alt={`${member.user.username}'s profile picture`}
                            width={40}
                            height={40}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="w-full max-w-0 py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-white sm:w-auto sm:max-w-none sm:pl-6">
                      {member.user.username}
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400 sm:table-cell">
                      {member.user.firstName} {member.user.lastName}
                    </td>
                    <td className="hidden px-3 py-4 text-sm text-gray-500 dark:text-gray-400 md:table-cell">{member.role}</td>
                    <td className="hidden px-3 py-4 text-sm text-gray-500 dark:text-gray-400 md:table-cell">
                      {member.memberSince}
                    </td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                      <div className="flex items-center justify-end gap-4">
                        <button
                          type="button"
                          onClick={() => setEditingMemberId(member.userId)}
                          className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200"
                        >
                          Edit
                        </button>
                        <form action={removeMember} className="m-0">
                          <input type="hidden" name="groupId" value={group.id} />
                          <input type="hidden" name="userId" value={member.userId} />
                          <button
                            type="submit"
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200"
                          >
                            Remove
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
