import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import EditUserForm from './edit-user-form';
import Breadcrumbs from '@/components/Breadcrumbs';
import { getPublicUrl } from '@/lib/storage';
import { getCodeTable } from '@/lib/codes';

export default async function EditUserPage(props: {
  params?: Promise<{ id: string }>
}) {
  const params = await props.params;
  if (!params?.id) {
    notFound();
  }

  const [photoTypes, entityTypes] = await Promise.all([
    getCodeTable('photoType'),
    getCodeTable('entityType'),
  ]);

  const user = await prisma.user.findUnique({
    where: {
      id: params.id,
    },
  });

  if (!user) {
    notFound();
  }

  const primaryPhoto = await prisma.photo.findFirst({
    where: {
      entityId: user.id,
      entityTypeId: entityTypes.user.id,
      typeId: photoTypes.primary.id,
    },
  });

  const hasPhoto = !!primaryPhoto;
  const photoUrl = primaryPhoto?.url;
  const publicPhotoUrl = await getPublicUrl(photoUrl);

  const breadcrumbs = [
    { label: 'Users', href: '/admin/users' },
    { label: 'Edit User', href: `/admin/users/${params.id}/edit`, active: true },
  ];

  return (
    <div className="max-w-2xl mx-auto p-8 space-y-6 dark:bg-gray-900">
      <Breadcrumbs breadcrumbs={breadcrumbs} />
      <h1 className="text-2xl font-bold mb-6 dark:text-white">Edit User</h1>
      <EditUserForm user={user} photoUrl={publicPhotoUrl} hasPhoto={hasPhoto} />
    </div>
  );
}
