import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { Search } from './Search'
import MembersTable from './members-table'
import { getPublicUrl } from '@/lib/storage'

export default async function GroupMembersPage(props: {
  params: Promise<{ slug: string }>
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { slug } = await props.params
  const searchParams = await props.searchParams
  const searchTerm = (searchParams?.query as string) || ''

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
      // Assuming you have a way to identify primary photos, e.g., a specific photoTypeId or a flag
      // This part might need adjustment based on your exact schema for primary photos
    },
    select: {
      entityId: true,
      url: true,
    },
  })

  const photoUrlMap = new Map<string, string>()
  for (const photo of photos) {
    if (photo.entityId) {
      photoUrlMap.set(photo.entityId, photo.url)
    }
  }

  const membersWithPhoto = await Promise.all(
    groupUsers.map(async (member) => {
      const rawUrl = photoUrlMap.get(member.userId)
      let photoUrl: string
      if (rawUrl) {
        if (rawUrl.startsWith('http')) {
          photoUrl = rawUrl
        } else {
          photoUrl = await getPublicUrl(rawUrl)
        }
      } else {
        // Fallback to the default avatar
        photoUrl = '/images/default-avatar.png'
      }
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
    <div className="p-8">
      <h1 className="text-2xl font-bold">Members</h1>
      <div className="mt-4">
        <Search placeholder="Search members..." />
      </div>
      <div className="mt-8">
        <MembersTable groupUsers={membersWithPhoto} />
      </div>
    </div>
  )
}
