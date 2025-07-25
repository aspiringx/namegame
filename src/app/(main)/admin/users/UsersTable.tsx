import Image from 'next/image';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import { getPublicUrl } from '@/lib/storage';
import { getCodeTable } from '@/lib/codes';
import { DeleteUserButton } from './DeleteUserButton';
import { UndeleteUserButton } from './UndeleteUserButton';

type SortableColumn = 'username' | 'firstName' | 'lastName' | 'email' | 'phone' | 'createdAt' | 'updatedAt';
type Order = 'asc' | 'desc';

interface UsersTableProps {
  query: string;
  sort: SortableColumn;
  order: Order;
  page: number;
}

const USERS_PER_PAGE = 25;

export default async function UsersTable({ query, sort, order, page }: UsersTableProps) {
  const where = query
    ? {
        OR: [
          { username: { contains: query, mode: 'insensitive' as const } },
          { firstName: { contains: query, mode: 'insensitive' as const } },
          { lastName: { contains: query, mode: 'insensitive' as const } },
          { email: { contains: query, mode: 'insensitive' as const } },
          { phone: { contains: query, mode: 'insensitive' as const } },
        ],
      }
    : {};

  const [photoTypes, entityTypes] = await Promise.all([
    getCodeTable('photoType'),
    getCodeTable('entityType'),
  ]);

  const [totalUsers, users] = await prisma.$transaction([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: {
        [sort]: order,
      },
      skip: (page - 1) * USERS_PER_PAGE,
      take: USERS_PER_PAGE,
    }),
  ]);

  const totalPages = Math.ceil(totalUsers / USERS_PER_PAGE);

  const userIds = users.map((user) => user.id);
  const photos = await prisma.photo.findMany({
    where: {
      entityId: { in: userIds },
      entityTypeId: entityTypes.user.id,
      typeId: photoTypes.primary.id,
    },
    select: {
      entityId: true,
      url: true,
    },
  });

  const photoUrlMap = new Map<string, string>();
  for (const photo of photos) {
    if (photo.entityId) {
      photoUrlMap.set(photo.entityId, photo.url);
    }
  }

  const usersWithPhotos = await Promise.all(
    users.map(async (user) => {
      const rawUrl = photoUrlMap.get(user.id);
      let photoUrl: string;
      if (rawUrl) {
        if (rawUrl.startsWith('http')) {
          photoUrl = rawUrl;
        } else {
          photoUrl = await getPublicUrl(rawUrl);
        }
      } else {
        photoUrl = '/images/default-avatar.png';
      }
      return { ...user, photoUrl };
    })
  );

  const SortableHeader = ({ column, title }: { column: SortableColumn; title: string }) => {
    const isCurrentSort = sort === column;
    const newOrder = isCurrentSort && order === 'asc' ? 'desc' : 'asc';
    const arrow = isCurrentSort ? (order === 'asc' ? '↑' : '↓') : '';

    return (
      <Link
        href={`/admin/users?sort=${column}&order=${newOrder}&query=${query}&page=1`}
        className="flex items-center gap-2 whitespace-nowrap"
      >
        {title}
        {arrow && <span>{arrow}</span>}
      </Link>
    );
  };

  return (
    <>
      <div className="-mx-4 mt-8 overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:-mx-6 md:mx-0 md:rounded-lg dark:ring-white dark:ring-opacity-10">
        <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
          <thead>
            <tr>
              <th scope="col" className="relative py-3.5 pl-4 pr-3 sm:pl-6">
                <span className="sr-only">Photo</span>
              </th>
              <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white sm:pl-6">
                <SortableHeader column="username" title="Username" />
              </th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white sm:table-cell">
                <SortableHeader column="firstName" title="First Name" />
              </th>
              <th scope="col" className="hidden px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white md:table-cell">
                <SortableHeader column="lastName" title="Last Name" />
              </th>

              <th scope="col" className="hidden px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white md:table-cell">
                <SortableHeader column="createdAt" title="Created" />
              </th>
              <th scope="col" className="hidden px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white md:table-cell">
                <SortableHeader column="updatedAt" title="Updated" />
              </th>
              <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
            {usersWithPhotos.map((user) => (
              <tr key={user.id} className={user.deletedAt ? 'bg-gray-200 dark:bg-gray-700' : ''}>
                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                  <div className="flex items-center">
                    <div className="h-10 w-10 flex-shrink-0">
                      <Image
                        className="h-10 w-10 rounded-full"
                        src={user.photoUrl}
                        alt={`${user.username}'s profile picture`}
                        width={40}
                        height={40}
                      />
                    </div>
                  </div>
                </td>
                <td className="w-full max-w-0 py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-white sm:w-auto sm:max-w-none sm:pl-6">
                  {user.username}
                </td>
                <td className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400 sm:table-cell">
                  {user.firstName}
                </td>
                <td className="hidden px-3 py-4 text-sm text-gray-500 dark:text-gray-400 md:table-cell">{user.lastName}</td>

                <td className="hidden px-3 py-4 text-sm text-gray-500 dark:text-gray-400 md:table-cell">{new Date(user.createdAt).toLocaleDateString()}</td>
                <td className="hidden px-3 py-4 text-sm text-gray-500 dark:text-gray-400 md:table-cell">{new Date(user.updatedAt).toLocaleDateString()}</td>
                <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                  {user.deletedAt ? (
                    <UndeleteUserButton userId={user.id} />
                  ) : (
                    <Link href={`/admin/users/${user.id}/edit`} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200">
                      Edit
                    </Link>
                  )}
                  <span className="text-gray-300 dark:text-gray-600 mx-2">|</span>
                  <DeleteUserButton userId={user.id} />
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
            href={`/admin/users?page=${page - 1}&sort=${sort}&order=${order}&query=${query}`}
            className={`px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700 ${
              page <= 1 ? 'pointer-events-none opacity-50' : ''
            }`}
          >
            Previous
          </Link>
          <Link
            href={`/admin/users?page=${page + 1}&sort=${sort}&order=${order}&query=${query}`}
            className={`px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700 ${
              page >= totalPages ? 'pointer-events-none opacity-50' : ''
            }`}
          >
            Next
          </Link>
        </div>
      </div>
    </>
  );
}
