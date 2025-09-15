import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getPublicUrl } from '@/lib/storage'
import { getCodeTable } from '@/lib/codes'

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
  })

  if (!user) {
    redirect('/api/auth/signout-and-redirect')
  }

  const [entityTypes, photoTypes] = await Promise.all([
    getCodeTable('entityType'),
    getCodeTable('photoType'),
  ])

  const primaryPhoto = await prisma.photo.findFirst({
    where: {
      entityId: user.id,
      entityTypeId: entityTypes.user.id,
      typeId: photoTypes.primary.id,
    },
    select: { url: true, url_thumb: true },
  })

  const userImage = primaryPhoto
    ? await getPublicUrl(primaryPhoto.url_thumb ?? primaryPhoto.url)
    : null

  const isGuest =
    !user.firstName ||
    !user.lastName ||
    !user.emailVerified ||
    !userImage ||
    userImage.includes('dicebear.com')

  if (isGuest) {
    redirect('/me')
  }

  return <>{children}</>
}
