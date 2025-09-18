import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getCodeTable } from '@/lib/codes'
import { getPhotoUrl } from '@/lib/photos'
import { headers } from 'next/headers'
import { getDeviceTypeFromHeaders } from '@/lib/device'

export default async function MeUsersLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login?callbackUrl=/me/users')
  }

  const headersList = await headers()
  const deviceType = getDeviceTypeFromHeaders(headersList)

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
  })

  const userImage = primaryPhoto
    ? await getPhotoUrl(primaryPhoto, {
        deviceType: deviceType as 'mobile' | 'desktop',
      })
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
