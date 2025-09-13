import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { getCodeTable } from '@/lib/codes'
import Breadcrumbs from '@/components/Breadcrumbs'
import EditGroupNav from './edit-group-nav'

export default async function EditGroupLayout(props: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { children } = props
  const params = await props.params
  const { slug } = params

  const [photoTypes, entityTypes] = await Promise.all([
    getCodeTable('photoType'),
    getCodeTable('entityType'),
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
