import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { DeleteGroupButton } from './DeleteGroupButton';
import { UndeleteGroupButton } from './UndeleteGroupButton';
import { Search } from './Search';

export const dynamic = 'force-dynamic';

type SortableColumn = 'name' | 'slug' | 'description' | 'createdAt' | 'updatedAt';

// This page is a React Server Component, so we can fetch data directly.
export default async function AdminGroupsPage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  const query = (searchParams?.query as string) || '';
  const sort = (searchParams.sort as SortableColumn) || 'createdAt';
  const order = (searchParams.order as 'asc' | 'desc') || 'desc';

  const where = query
    ? {
        OR: [
          { name: { contains: query, mode: 'insensitive' as const } },
          { slug: { contains: query, mode: 'insensitive' as const } },
          { description: { contains: query, mode: 'insensitive' as const } },
        ],
      }
    : {};

  const groups = await prisma.group.findMany({
    where,
    orderBy: {
      [sort]: order,
    },
  });

  const SortableHeader = ({ column, title }: { column: SortableColumn, title: string }) => {
    const isCurrentSort = sort === column;
    const newOrder = isCurrentSort && order === 'asc' ? 'desc' : 'asc';
    const arrow = isCurrentSort ? (order === 'asc' ? '↑' : '↓') : '';

    return (
      <Link href={`/admin/groups?sort=${column}&order=${newOrder}`} className="flex items-center gap-2 whitespace-nowrap">
        {title}
        {arrow && <span>{arrow}</span>}
      </Link>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex flex-col gap-2 pr-4">
          <h1 className="text-2xl font-bold">Parent Groups</h1>
          <p>
            These are top-level NameGame groups. Soft-deleted groups are inactive 
            and may be undeleted to reactivate them. 
          </p>
        </div>
        <Link
          href="/admin/groups/create"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Create
        </Link>
      </div>
      <div className="mt-4">
        <Search placeholder="Search groups..." />
      </div>
      <div className="-mx-4 mt-8 overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:-mx-6 md:mx-0 md:rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead>
            <tr>
              <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                <SortableHeader column="name" title="Name" />
              </th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 sm:table-cell">
                <SortableHeader column="slug" title="Slug" />
              </th>
              <th scope="col" className="hidden px-3 py-3.5 text-left text-sm font-semibold text-gray-900 md:table-cell">
                <SortableHeader column="description" title="Description" />
              </th>
              <th scope="col" className="hidden px-3 py-3.5 text-left text-sm font-semibold text-gray-900 md:table-cell">
                <SortableHeader column="createdAt" title="Created" />
              </th>
              <th scope="col" className="hidden px-3 py-3.5 text-left text-sm font-semibold text-gray-900 md:table-cell">
                <SortableHeader column="updatedAt" title="Updated" />
              </th>
              <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {groups.map((group) => (
              <tr key={group.id} className={group.deletedAt ? 'bg-gray-200' : ''}>
                <td className="w-full max-w-0 py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:w-auto sm:max-w-none sm:pl-6">
                  {group.name}
                </td>
                <td className="px-3 py-4 text-sm text-gray-500 sm:table-cell">
                  <Link href={`/${group.slug}`} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-900">
                    {group.slug}
                  </Link>
                </td>
                <td className="hidden px-3 py-4 text-sm text-gray-500 md:table-cell">{group.description}</td>
                <td className="hidden px-3 py-4 text-sm text-gray-500 md:table-cell">{new Date(group.createdAt).toLocaleDateString()}</td>
                <td className="hidden px-3 py-4 text-sm text-gray-500 md:table-cell">{new Date(group.updatedAt).toLocaleDateString()}</td>
                <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                  {group.deletedAt ? (
                    <UndeleteGroupButton groupId={group.id} />
                  ) : (
                    <Link href={`/admin/groups/${group.slug}/edit`} className="text-indigo-600 hover:text-indigo-900">
                      Edit
                    </Link>
                  )}
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
