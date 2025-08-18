import { auth } from '@/auth'
import { getPublicUrl } from '@/lib/storage'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import UserProfileForm from './_components/user-profile-form'
import { getCodeTable } from '@/lib/codes'

export default async function UserProfilePage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const searchParams = await props.searchParams
  const session = await auth()

  if (!session?.user?.id) {
    // This is technically unreachable because the layout would have redirected.
    // We add it to satisfy TypeScript's null checks.
    redirect('/login?callbackUrl=/me')
  }

  const [photoTypes, entityTypes] = await Promise.all([
    getCodeTable('photoType'),
    getCodeTable('entityType'),
  ])

  // Get the primary photo for the current user.
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      photos: {
        where: {
          entityTypeId: entityTypes.user.id,
          entityId: session.user.id,
          typeId: photoTypes.primary.id,
        },
        orderBy: { type: { code: 'asc' } },
      },
    },
  })

  if (!user) {
    // This is also unreachable, but required for type safety.
    redirect('/api/auth/signout-and-redirect')
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

  return (
    <>
      {searchParams?.welcome === 'true' ? (
        <div className="mb-4 rounded-md bg-green-50 p-4 text-sm text-green-700 dark:bg-green-900 dark:text-green-300">
          Welcome, {user.firstName}!
        </div>
      ) : null}

      <UserProfileForm user={userWithPublicUrls} />
    </>
  )
}
