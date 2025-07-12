import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import EditGroupForm from './edit-group-form';
import { getPublicUrl } from '@/lib/storage';
import { EntityType, PhotoType } from '@/generated/prisma';
import Breadcrumbs from '../../../../../components/Breadcrumbs';

export default async function EditGroupPage({ params }: { params: Promise<{ slug: string }> }) {
  const group = await prisma.group.findUnique({
    where: {
      slug: (await params).slug,
    },
    include: {
      photos: {
        where: {
          entityType: EntityType.group,
          type: PhotoType.logo,
        },
        take: 1,
      },
    },
  });

  if (!group) {
    notFound();
  }

  const logo = group?.photos[0];
  const logoUrl = await getPublicUrl(logo?.url);

  return (
        <div className="max-w-2xl mx-auto p-8">
      <Breadcrumbs />
      <h1 className="text-2xl font-bold mb-6">Edit Group</h1>
      <EditGroupForm group={group} logoUrl={logoUrl} />
    </div>
  );
}
