import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { getPublicUrl } from '@/lib/storage'
import { auth } from '@/auth'
import { getCodeTable } from '@/lib/codes'
import Breadcrumbs from '@/components/Breadcrumbs'
import EditGroupNav from './edit-group-nav'
import type { GroupPayload } from '@/types/index'

export default async function EditGroupLayout(props: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { children } = props
  const params = await props.params
  const { slug } = params
  const session = await auth()

  const [photoTypes, entityTypes, roleTypes] = await Promise.all([
    getCodeTable('photoType'),
    getCodeTable('entityType'),
    getCodeTable('groupUserRole'),
  ])

  const group = await prisma.group.findUnique({
    where: {
      slug: slug,
    },
    include: {
      photos: {
        where: {
          entityTypeId: entityTypes.group.id,
          typeId: photoTypes.logo.id,
        },
        take: 1,
      },
      members: {
        include: {
          user: {
            include: {
              photos: {
                where: {
                  entityTypeId: entityTypes.user.id,
                  typeId: photoTypes.primary.id,
                },
                take: 1,
              },
            },
          },
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

  const logo = group?.photos[0]
  const logoUrl = await getPublicUrl(logo?.url)

  const currentUser = session?.user?.id
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
          groupMemberships: {
            include: {
              group: true,
            },
          },
        },
      })
    : null

  const isGlobalAdminGroup = group.slug === 'global-admin'

  const groupWithMemberPhotos = {
    ...group,
    members: await Promise.all(
      group.members.map(async (member: GroupPayload['members'][number]) => ({
        ...member,
        user: {
          ...member.user,
          photoUrl: await (async () => {
            const rawUrl = member.user.photos?.[0]?.url
            if (rawUrl) {
              if (rawUrl.startsWith('http')) {
                return rawUrl
              }
              return getPublicUrl(rawUrl)
            }
            return '/images/default-avatar.png'
          })(),
        },
      })),
    ),
  }

  return (
    <div className="mx-auto max-w-4xl p-8 dark:bg-gray-900">
      <Breadcrumbs />
      <h1 className="mb-6 text-2xl font-bold dark:text-white">
        Edit Group: {group.name}
      </h1>
      <EditGroupNav group={group} />
      <div className="mt-6">{children}</div>
    </div>
  )
}
