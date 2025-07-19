import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import UserProfileForm from './_components/user-profile-form';
import { getPublicUrl } from '@/lib/storage';
import Link from 'next/link';
import Image from 'next/image';
import { getCodeTable } from '@/lib/codes';

export default async function UserProfilePage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const searchParams = await props.searchParams;
  const session = await auth();


  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/user');
  }

  const [photoTypes, entityTypes] = await Promise.all([
    getCodeTable('photoType'),
    getCodeTable('entityType'),
  ]);

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
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
          role: {
            select: {
              code: true,
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

  const primaryPhoto = await prisma.photo.findFirst({
    where: {
      entityId: user.id,
      entityTypeId: entityTypes.user.id,
      typeId: photoTypes.primary.id,
    },
  });

  const photoUrl = await getPublicUrl(primaryPhoto?.url);

  const isGuest = user.groupMemberships.some((m) => m.role.code === 'guest');

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {searchParams?.welcome === 'true' && user && user.groupMemberships.length > 0 ? (
          <div className="mb-4 rounded-md bg-green-50 p-4 text-sm text-green-700 dark:bg-green-900 dark:text-green-300">
            Welcome, {user.firstName}! Click a group to start playing or update your profile below.
          </div>
        ) : null }

        <Image
          src="/images/butterflies.png"
          alt="NameGame social butterflies"
          width={50}
          height={50}
          className="float-right" style={{ marginTop: '-4px' }}
        />
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

        <div className="mt-12 max-w-2xl mx-auto">
        <Image
          src="/images/butterflies.png"
          alt="NameGame social butterflies"
          width={50}
          height={50}
          className="float-right" style={{ marginTop: '-4px' }}
        />
        <h2 className="text-2xl font-bold mb-6">My Profile</h2>
        {isGuest && (
          <div className="mb-4 rounded-md bg-yellow-50 p-4 text-sm text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300">
            <p className="font-bold mb-4">You're playing as a guest with limited features.</p>
            <ul className="list-disc list-outside space-y-2 ml-4">
              <li><b>Tip:</b> You can change your username and password (default for new players is <i>password123</i>) and continue as a guest</li>
              <li><b>Tip:</b> Add your last name and a profile pic to unlock all features and become more visible</li>
            </ul>
          </div>
        )}

        <UserProfileForm user={user} photoUrl={photoUrl} />

      </div>
    </main>
  );
}
