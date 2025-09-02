import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { GuestMessage } from '@/components/GuestMessage'
import MeTabs from './_components/me-tabs'
import { getPublicUrl } from '@/lib/storage'

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

  return (
    <main className="container mx-auto mb-12 px-4 pb-8">
      <div className="mx-auto max-w-2xl">
        <MeTabs isGuest={isGuest} />
        {children}
      </div>
    </main>
  )
}
