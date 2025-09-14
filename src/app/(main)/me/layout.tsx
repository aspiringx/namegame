import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import MeTabs from './_components/me-tabs'
import { getPublicUrl } from '@/lib/storage'
import { getCodeTable } from '@/lib/codes'

export default async function MeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/me')
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

  return (
    <main className="container mx-auto mb-12 px-4 pb-8">
      <div className="mx-auto max-w-2xl">
        <MeTabs isGuest={isGuest} />
        {children}
      </div>
    </main>
  )
}
