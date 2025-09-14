import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { Search } from './Search'
import MembersTable from './members-table'
import { getPhotoUrl } from '@/lib/photos'
import { getCodeTable } from '@/lib/codes'

export default async function GroupMembersPage(props: {
  params: Promise<{ slug: string }>
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { slug } = await props.params
  const searchParams = await props.searchParams
  const searchTerm = (searchParams?.query as string) || ''

  const [allRoles, photoTypes, entityTypes] = await Promise.all([
    prisma.groupUserRole.findMany(),
    getCodeTable('photoType'),
    getCodeTable('entityType'),
  ])

  const group = await prisma.group.findUnique({
    where: { slug },
    include: {
      members: {
        where: {
          user: {
            OR: [
              {
                firstName: {
                  contains: searchTerm,
                  mode: 'insensitive',
                },
              },
              {
                lastName: {
                  contains: searchTerm,
                  mode: 'insensitive',
                },
              },
              {
                email: {
                  contains: searchTerm,
                  mode: 'insensitive',
                },
              },
            ],
          },
        },
        include: {
          user: true,
          role: true, // Each GroupUser has one role
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
      const photoUrl = await getPhotoUrl(photo || null, 'thumb') || '/images/default-avatar.png'
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
    <div className="p-4">
      <div className="-mx-4 mt-8">
        <Search
          placeholder="Search members..."
          count={membersWithPhoto.length}
        />
      </div>
      <div className="mt-8">
        <MembersTable groupUsers={membersWithPhoto} allRoles={allRoles} />
      </div>
    </div>
  )
}
