import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { DeleteGroupButton } from './DeleteGroupButton';

// This page is a React Server Component, so we can fetch data directly.
export default async function AdminGroupsPage() {
  const groups = await prisma.group.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  });

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">All Groups</h1>
        <Link
          href="/admin/groups/create"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Create New Group
        </Link>
      </div>
      <div className="-mx-4 mt-8 overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:-mx-6 md:mx-0 md:rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                Name
              </th>
              <th scope="col" className="hidden px-3 py-3.5 text-left text-sm font-semibold text-gray-900 sm:table-cell">
                Slug
              </th>
              <th scope="col" className="hidden px-3 py-3.5 text-left text-sm font-semibold text-gray-900 lg:table-cell">
                Description
              </th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Created
              </th>
              <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {groups.map((group) => (
              <tr key={group.id}>
                <td className="w-full max-w-0 py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:w-auto sm:max-w-none sm:pl-6">
                  {group.name}
                </td>
                <td className="hidden px-3 py-4 text-sm text-gray-500 sm:table-cell">{group.slug}</td>
                <td className="hidden px-3 py-4 text-sm text-gray-500 lg:table-cell">{group.description}</td>
                <td className="px-3 py-4 text-sm text-gray-500">{new Date(group.createdAt).toLocaleDateString()}</td>
                <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                  <Link href={`/admin/groups/${group.slug}/edit`} className="text-indigo-600 hover:text-indigo-900">
                    Edit
                  </Link>
                  <span className="text-gray-300 mx-2">|</span>
                  <DeleteGroupButton groupId={group.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
