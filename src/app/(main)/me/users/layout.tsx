import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getPublicUrl } from '@/lib/storage'

export default async function MeUsersLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/me/users')
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      photos: {
        take: 1,
        where: {
          type: { code: 'primary' },
        },
      },
    },
  })

  if (!user) {
    redirect('/api/auth/signout-and-redirect')
  }

  const userImage = user.photos[0]
    ? await getPublicUrl(user.photos[0].url)
    : null

  const isGuest =
    !user.firstName ||
    !user.lastName ||
    !user.emailVerified ||
    (userImage?.includes('dicebear.com') ?? true)

  if (isGuest) {
    redirect('/me')
  }

  return <>{children}</>
}
