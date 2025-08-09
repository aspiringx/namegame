import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { isAdmin } from '@/lib/auth-utils'
import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'
import GroupAdminNav from './group-admin-nav'

export default async function GroupAdminLayout({
  children,
  params: paramsPromise,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const params = await paramsPromise;
  const { slug } = params;
  const session = await auth();
  const user = session?.user;

  // 1. Check if user is logged in
  if (!user) {
    redirect(`/login?callbackUrl=/g/${slug}/admin`)
  }

  const group = await prisma.group.findUnique({
    where: { slug },
    select: { id: true },
  })

  if (!group) {
    notFound()
  }

  // 2. Check if user has the 'admin' role in the group
  const isGroupAdmin = await isAdmin(user.id, group.id)

  if (!isGroupAdmin) {
    // Redirect to group page if not a group admin
    redirect(`/g/${slug}`)
  }

  return (
    <div className="mx-auto mt-6 max-w-4xl px-4 sm:px-6 lg:px-8">
      <GroupAdminNav slug={slug} />
      {children}
    </div>
  )
}
