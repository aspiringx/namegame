'use client';

import { useState, useTransition, ChangeEvent, useMemo } from 'react';
import type { GroupWithMembers } from '@/types/index';
import Image from 'next/image';
import Link from 'next/link';
import { searchUsers, addMember, removeMember, updateMember } from './actions';
import { GroupUser, User } from '@/generated/prisma';

type UserWithPhotoUrl = Awaited<ReturnType<typeof searchUsers>>[0];

type GroupUserRoleType = {
  id: number;
  code: string;
};

export type GroupMember = Omit<GroupUser, 'role'> & {
  role: GroupUserRoleType;
  user: User & { photoUrl: string };
};

interface GroupMembersProps {
  group: GroupWithMembers;
  members: GroupMember[];
  totalMembers: number;
  isSuperAdmin: boolean;
  isGlobalAdminGroup: boolean;
  page: number;
  totalPages: number;
  groupUserRoles: GroupUserRoleType[];
}

export default function GroupMembers({ group, members, totalMembers, isSuperAdmin, isGlobalAdminGroup, page, totalPages, groupUserRoles, }: GroupMembersProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserWithPhotoUrl[]>([]);
  const [isSearching, startSearchTransition] = useTransition();
  const [isAdding, startAddTransition] = useTransition();
  const [editingMemberUserId, setEditingMemberUserId] = useState<string | null>(null);
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
    let sortableItems = [...members];
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
          case 'role':
            aValue = a.role.code;
            bValue = b.role.code;
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
  }, [members, sortConfig]);

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
                        name="roleId"
                        defaultValue={groupUserRoles.find(r => r.code === 'member')?.id}
                        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      >
                        {groupUserRoles
                          .filter(role => (isSuperAdmin && isGlobalAdminGroup) || role.code !== 'super')
                          .map((role) => (
                            <option key={role.id} value={role.id}>
                              {role.code}
                            </option>
                          ))}
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
        <h2 className="text-xl font-semibold mb-4">Current Members ({totalMembers})</h2>
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
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6 dark:text-white">
                  <button onClick={() => requestSort('name')} className="group inline-flex">
                    Name
                    <span className="ml-2 flex-none rounded text-gray-400 group-hover:bg-gray-200 dark:group-hover:bg-gray-600">
                      {getSortIndicator('name')}
                    </span>
                  </button>
                </th>
                <th
                  scope="col"
                  className="hidden px-3 py-3.5 text-left text-sm font-semibold text-gray-900 sm:table-cell dark:text-white"
                >
                  <button onClick={() => requestSort('username')} className="group inline-flex">
                    Username
                    <span className="ml-2 flex-none rounded text-gray-400 group-hover:bg-gray-200 dark:group-hover:bg-gray-600">
                      {getSortIndicator('username')}
                    </span>
                  </button>
                </th>
                <th
                  scope="col"
                  className="hidden px-3 py-3.5 text-left text-sm font-semibold text-gray-900 lg:table-cell dark:text-white"
                >
                  <button onClick={() => requestSort('role')} className="group inline-flex">
                    Role
                    <span className="ml-2 flex-none rounded text-gray-400 group-hover:bg-gray-200 dark:group-hover:bg-gray-600">
                      {getSortIndicator('role')}
                    </span>
                  </button>
                </th>
                <th
                  scope="col"
                  className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"
                >
                  <button onClick={() => requestSort('memberSince')} className="group inline-flex">
                    Member Since
                    <span className="ml-2 flex-none rounded text-gray-400 group-hover:bg-gray-200 dark:group-hover:bg-gray-600">
                      {getSortIndicator('memberSince')}
                    </span>
                  </button>
                </th>
                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                  <span className="sr-only">Edit</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-600 dark:bg-gray-800">
              {filteredMembers.map((member) => (
                <tr key={member.userId}>
                  <td className="w-full max-w-0 py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:w-auto sm:max-w-none sm:pl-6 dark:text-white">
                    <div className="flex items-center gap-4">
                      <Image
                        src={member.user.photoUrl}
                        alt={`${member.user.username}'s profile picture`}
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                      <div>
                        {member.user.firstName} {member.user.lastName}
                        <dl className="font-normal lg:hidden">
                          <dt className="sr-only">Username</dt>
                          <dd className="mt-1 truncate text-gray-700 dark:text-gray-400">@{member.user.username}</dd>
                        </dl>
                      </div>
                    </div>
                  </td>
                  <td className="hidden px-3 py-4 text-sm text-gray-500 sm:table-cell dark:text-gray-400">
                    @{member.user.username}
                  </td>
                  <td className="hidden px-3 py-4 text-sm text-gray-500 lg:table-cell dark:text-gray-400">
                    {editingMemberUserId === member.userId ? (
                      <form action={updateMember}>
                        <input type="hidden" name="groupId" value={member.groupId} />
                        <input type="hidden" name="userId" value={member.userId} />
                        <select
                          name="roleId"
                          defaultValue={member.roleId}
                          className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                          {groupUserRoles
                            .filter(role => (isSuperAdmin && isGlobalAdminGroup) || role.code !== 'super')
                            .map((role) => (
                              <option key={role.id} value={role.id}>
                                {role.code}
                              </option>
                            ))}
                        </select>
                      </form>
                    ) : (
                      member.role.code
                    )}
                  </td>
                  <td className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {editingMemberUserId === member.userId ? (
                      <form action={updateMember}>
                        <input type="hidden" name="groupId" value={member.groupId} />
                        <input type="hidden" name="userId" value={member.userId} />
                        <input
                          type="number"
                          name="memberSince"
                          defaultValue={member.memberSince ?? new Date().getFullYear()}
                          placeholder="YYYY"
                          className="block w-24 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </form>
                    ) : (
                      member.memberSince
                    )}
                  </td>
                  <td className="py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                    {editingMemberUserId === member.userId ? (
                      <div className="flex gap-2">
                        <form action={updateMember}>
                          <input type="hidden" name="groupId" value={member.groupId} />
                          <input type="hidden" name="userId" value={member.userId} />
                          <button
                            type="submit"
                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200"
                          >
                            Save
                          </button>
                        </form>
                        <button
                          onClick={() => setEditingMemberUserId(null)}
                          className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingMemberUserId(member.userId)}
                          className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200"
                        >
                          Edit
                        </button>
                        <form action={removeMember}>
                          <input type="hidden" name="groupId" value={member.groupId} />
                          <input type="hidden" name="userId" value={member.userId} />
                          <button
                            type="submit"
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200"
                          >
                            Remove
                          </button>
                        </form>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-gray-700 dark:text-gray-400">
            Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <Link
              href={`?page=${page - 1}`}
              className={`px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700 ${
                page <= 1 ? 'pointer-events-none opacity-50' : ''
              }`}
            >
              Previous
            </Link>
            <Link
              href={`?page=${page + 1}`}
              className={`px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700 ${page >= totalPages ? 'pointer-events-none opacity-50' : ''}`}>

              Next
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
