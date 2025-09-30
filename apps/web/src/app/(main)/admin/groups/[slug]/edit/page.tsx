import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { getPhotoUrl } from '@/lib/photos'
import EditGroupForm from './edit-group-form'
import { getCodeTable } from '@/lib/codes'

export default async function EditGroupDetailsPage(props: {
  params: Promise<{ slug: string }>
}) {
  const params = await props.params
  const { slug } = params

  const [entityTypes, photoTypes] = await Promise.all([
    getCodeTable('entityType'),
    getCodeTable('photoType'),
  ])

  const group = await prisma.group.findUnique({
    where: {
      slug: slug,
    },
  })

  if (!group) {
    notFound()
  }

  const logo = await prisma.photo.findFirst({
    where: {
      entityId: group.id.toString(),
      entityTypeId: entityTypes.group.id,
      typeId: photoTypes.logo.id,
    },
  })
  const logoUrl = await getPhotoUrl(logo, { size: 'small' })

  return <EditGroupForm group={group} logoUrl={logoUrl} />
}
