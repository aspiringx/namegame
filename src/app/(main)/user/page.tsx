import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import UserProfileForm from './_components/user-profile-form';
import { getPublicUrl } from '@/lib/storage';
import Link from 'next/link';



export default async function UserProfilePage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const searchParams = await props.searchParams;
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/user');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      photos: {
        where: { type: 'primary', entityType: 'user' },
        take: 1,
      },
      groupMemberships: {
        orderBy: {
          group: {
            name: 'asc',
          },
        },
        include: {
          group: {
            select: {
              name: true,
              slug: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    // This should theoretically not happen if a session exists
    redirect('/login?callbackUrl=/user');
  }

  const photoUrl = await getPublicUrl(user.photos[0]?.url);

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {searchParams?.welcome === 'true' && user && (
          <div className="mb-4 rounded-md bg-green-50 p-4 text-sm text-green-700 dark:bg-green-900 dark:text-green-300">
            Welcome, {user.firstName}! Click a group link below to start playing.
          </div>
        )}
        <h1 className="text-3xl font-bold mb-6">My Profile</h1>
        <UserProfileForm user={user} photoUrl={photoUrl} />

        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold mb-4">My Groups</h2>
          {user.groupMemberships.length > 0 ? (
            <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {user.groupMemberships.map((membership) => (
                  <li key={membership.groupId}>
                    <Link
                      href={`/g/${membership.group.slug}`}
                      className="block hover:bg-gray-50 dark:hover:bg-gray-700 px-4 py-4 sm:px-6"
                    >
                      <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 truncate">
                        {membership.group.name}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">You are not a member of any groups yet.</p>
          )}
        </div>
      </div>
    </main>
  );
}
