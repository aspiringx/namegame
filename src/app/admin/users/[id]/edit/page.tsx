import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import EditUserForm from './edit-user-form';
import Breadcrumbs from '../../../../../components/Breadcrumbs';
import { getPublicUrl } from '@/lib/storage';
import { PhotoType } from '@/generated/prisma';

export default async function EditUserPage(props: {
  params?: Promise<{ id: string }>
}) {
  const params = await props.params;
  if (!params?.id) {
    notFound();
  }

  const user = await prisma.user.findUnique({
    where: {
      id: params.id,
    },
    include: {
      photos: {
        where: {
          type: PhotoType.primary,
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
    <div className="max-w-2xl mx-auto p-8 space-y-6">
      <Breadcrumbs breadcrumbs={breadcrumbs} />
      <h1 className="text-2xl font-bold mb-6">Edit User</h1>
      <EditUserForm user={user} photoUrl={publicPhotoUrl} hasPhoto={hasPhoto} />
    </div>
  );
}
