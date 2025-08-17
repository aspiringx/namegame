import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { isAdmin } from '@/lib/auth-utils'
import EditMemberForm from './edit-member-form'

export default async function EditMemberPage({
  params: paramsPromise,
}: {
  params: Promise<{ slug: string; userId: string }>
}) {
  const params = await paramsPromise
  const session = await auth()
  const currentUser = session?.user

  if (!currentUser) {
    return notFound()
  }

  const group = await prisma.group.findUnique({
    where: { slug: params.slug },
  })

  if (!group) {
    return notFound()
  }

  const isGroupAdmin = await isAdmin(currentUser.id, group.id)
  if (!isGroupAdmin) {
    return notFound()
  }

  const member = await prisma.groupUser.findUnique({
    where: {
      userId_groupId: {
        userId: params.userId,
        groupId: group.id,
      },
    },
    include: {
      user: true,
      role: true,
    },
  })

  if (!member) {
    return notFound()
  }

  const allRoles = await prisma.groupUserRole.findMany({
    where: {
      code: { in: ['admin', 'member'] },
    },
  })

  return (
    <div className="mt-8">
      <EditMemberForm
        member={member}
        allRoles={allRoles}
        groupSlug={params.slug}
      />
    </div>
  )
}
