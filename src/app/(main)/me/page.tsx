import { auth } from '@/auth'
import { getPublicUrl } from '@/lib/storage'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import UserProfileForm from './_components/user-profile-form'
import Link from 'next/link'
import Image from 'next/image'
import { getCodeTable } from '@/lib/codes'
import { GuestMessage } from '@/components/GuestMessage'

export default async function UserProfilePage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const searchParams = await props.searchParams
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/me')
  }

  const { user: userEntityType } = await getCodeTable('entityType')

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
      photos: {
        where: { entityTypeId: userEntityType.id },
        orderBy: { type: { code: 'asc' } },
      },
    },
  })

  if (!user) {
    // This should theoretically not happen if a session exists, but if it does,
    // redirecting to the home page is a safe fallback.
    redirect('/')
  }

  const userWithPublicUrls = {
    ...user,
    image: user.photos[0] ? await getPublicUrl(user.photos[0].url) : null,
    emailVerified: user.emailVerified ? user.emailVerified.toISOString() : null,
    photos: await Promise.all(
      user.photos.map(async (photo) => ({
        ...photo,
        url: await getPublicUrl(photo.url),
      })),
    ),
  }

  const isGuest =
    !user.firstName ||
    !user.lastName ||
    !user.emailVerified ||
    (userWithPublicUrls.image?.includes('dicebear.com') ?? true)

  return (
    <main className="container mx-auto px-4 pt-4 pb-8">
      <div className="mx-auto max-w-2xl">
        <GuestMessage isGuest={isGuest} />
        {searchParams?.welcome === 'true' &&
        user &&
        user.groupMemberships.length > 0 ? (
          <div className="mb-4 rounded-md bg-green-50 p-4 text-sm text-green-700 dark:bg-green-900 dark:text-green-300">
            Welcome, {user.firstName}! Click a group below to start playing or
            update your profile.
          </div>
        ) : null}

        <div className="mx-auto max-w-2xl">
          <Image
            src="/images/butterflies.png"
            alt="NameGame social butterflies"
            width={32}
            height={32}
            className="float-right opacity-70"
          />
          <h2 className="mb-6 text-xl font-bold">Me</h2>

          <UserProfileForm user={userWithPublicUrls} />

          <Image
            src="/images/butterflies.png"
            alt="NameGame social butterflies"
            width={32}
            height={32}
            className="float-right mt-8 opacity-70"
          />
          <h2 className="mt-12 mb-4 text-xl font-bold">My Groups</h2>
          {user.groupMemberships.length > 0 ? (
            <div className="overflow-hidden bg-white shadow sm:rounded-md dark:bg-gray-800">
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {user.groupMemberships.map((membership) => (
                  <li key={membership.groupId}>
                    <Link
                      href={`/g/${membership.group.slug}`}
                      className="block px-4 py-4 hover:bg-gray-50 sm:px-6 dark:hover:bg-gray-700"
                    >
                      <p className="truncate text-sm font-medium text-indigo-600 dark:text-indigo-400">
                        {membership.group.name}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">
              You are not a member of any groups yet.
            </p>
          )}
        </div>
      </div>
    </main>
  )
}
