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

  const photoTypes = await getCodeTable('photoType');

  const user = await prisma.user.findUnique({
    where: {
      id: params.id,
    },
    include: {
      photos: {
        where: {
          typeId: photoTypes.primary.id,
        },
        take: 1,
      },
    },
  });

  if (!user) {
    notFound();
  }

  const hasPhoto = user.photos.length > 0;
  const photoUrl = user.photos[0]?.url;
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
