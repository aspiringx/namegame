import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'
import EditUserForm from './edit-user-form'
import Breadcrumbs from '@/components/Breadcrumbs'
import { getPhotoUrl } from '@/lib/photos'
import { getCodeTable } from '@/lib/codes'

export default async function EditUserPage(props: {
  params?: Promise<{ id: string }>
}) {
  const params = await props.params
  if (!params?.id) {
    notFound()
  }

  const [photoTypes, entityTypes] = await Promise.all([
    getCodeTable('photoType'),
    getCodeTable('entityType'),
  ])

  const user = await prisma.user.findUnique({
    where: {
      id: params.id,
    },
  })

  if (!user) {
    notFound()
  }

  const primaryPhoto = await prisma.photo.findFirst({
    where: {
      entityId: user.id,
      entityTypeId: entityTypes.user.id,
      typeId: photoTypes.primary.id,
    },
  })

  const publicPhotoUrl = await getPhotoUrl(primaryPhoto, { size: 'thumb' })
  const hasPhoto = !!publicPhotoUrl && !publicPhotoUrl.includes('default-avatar')

  const breadcrumbs = [
    { label: 'Users', href: '/admin/users' },
    {
      label: 'Edit User',
      href: `/admin/users/${params.id}/edit`,
      active: true,
    },
  ]

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-8 dark:bg-gray-900">
      <Breadcrumbs breadcrumbs={breadcrumbs} />
      <h1 className="mb-6 text-2xl font-bold dark:text-white">Edit User</h1>
      <EditUserForm
        user={user}
        photoUrl={publicPhotoUrl || '/images/default-avatar.png'}
        hasPhoto={hasPhoto}
      />
    </div>
  )
}
