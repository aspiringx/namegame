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
    birthDate: user.birthDate ? user.birthDate.toISOString() : null,
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
    <>
      <GuestMessage isGuest={isGuest} />
      {searchParams?.welcome === 'true' ? (
        <div className="mb-4 rounded-md bg-green-50 p-4 text-sm text-green-700 dark:bg-green-900 dark:text-green-300">
          Welcome, {user.firstName}! You can update your profile information below.
        </div>
      ) : null}

      <UserProfileForm user={userWithPublicUrls} />
    </>
  )
}
