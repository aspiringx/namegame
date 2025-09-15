import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { auth } from '@/auth'
import { getPhotoUrl } from '@/lib/photos'
import GroupMembers, { GroupMember } from '../group-members'

import type { GroupWithMembers } from '@/types/index'

export default async function ManageMembersPage({
  params: paramsProp,
}: {
  params: Promise<{ slug: string }>
}) {
  const params = await paramsProp

  const session = await auth()
  const isSuperAdmin = session?.user?.isSuperAdmin

  if (!isSuperAdmin) {
    notFound()
  }

  const group = await prisma.group.findUnique({
    where: { slug: params.slug },
  })

  if (!group) {
    notFound()
  }

  const [members, groupUserRoles, entityTypes, photoTypes] =
    await prisma.$transaction([
      prisma.groupUser.findMany({
        where: { groupId: group.id },
        include: {
          role: true,
          user: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.groupUserRole.findMany(),
      prisma.entityType.findMany(),
      prisma.photoType.findMany(),
    ])

  const userEntityType = entityTypes.find((et) => et.code === 'user')
  const primaryPhotoType = photoTypes.find((pt) => pt.code === 'primary')

  const userIds = members.map((member) => member.userId)
  const photos = await prisma.photo.findMany({
    where: {
      entityId: { in: userIds },
      entityTypeId: userEntityType?.id,
      typeId: primaryPhotoType?.id,
    },
  })

  const photoMap = new Map(photos.map((p) => [p.entityId, p]))

  const isGlobalAdminGroup = group.slug === 'global-admin'

  const membersWithPhoto = await Promise.all(
    members.map(async (member) => {
      const photo = photoMap.get(member.userId)
      const photoUrl =
        (await getPhotoUrl(photo || null, { size: 'thumb' })) ||
        `https://api.dicebear.com/8.x/personas/png?seed=${member.user.id}`
      return {
        ...member,
        user: {
          ...member.user,
          photoUrl,
        },
      }
    }),
  )

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">
        Manage Members for {group.name}
      </h1>
      <GroupMembers
        group={group as GroupWithMembers}
        members={membersWithPhoto as GroupMember[]}
        isSuperAdmin={isSuperAdmin}
        isGlobalAdminGroup={isGlobalAdminGroup}
        groupUserRoles={groupUserRoles}
      />
    </div>
  )
}
