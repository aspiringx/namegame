import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { getPhotoUrl } from '@/lib/photos'
import { getCodeTable } from '@/lib/codes'
import MembersClient from './MembersClient'

export default async function GroupMembersPage(props: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await props.params

  const [allRoles, photoTypes, entityTypes] = await Promise.all([
    prisma.groupUserRole.findMany(),
    getCodeTable('photoType'),
    getCodeTable('entityType'),
  ])

  const group = await prisma.group.findUnique({
    where: { slug },
    include: {
      members: {
        include: {
          user: true,
          role: true,
        },
        orderBy: {
          user: {
            username: 'asc',
          },
        },
      },
    },
  })

  if (!group) {
    notFound()
  }

  const groupUsers = group.members

  const userIds = groupUsers.map((gu) => gu.userId)
  const photos = await prisma.photo.findMany({
    where: {
      entityId: { in: userIds },
      entityTypeId: entityTypes.user.id,
      typeId: photoTypes.primary.id,
    },
  })

  const photoMap = new Map(photos.map((p) => [p.entityId, p]))

  const membersWithPhoto = await Promise.all(
    groupUsers.map(async (member) => {
      const photo = photoMap.get(member.userId)
      const photoUrl =
        (await getPhotoUrl(photo || null, { size: 'thumb' })) ||
        '/images/default-avatar.png'
      return {
        ...member,
        user: {
          ...member.user,
          photoUrl,
        },
      }
    }),
  )

  return <MembersClient initialMembers={membersWithPhoto} allRoles={allRoles} />
}
