import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { getPublicUrl } from '@/lib/storage';
import { EntityType, PhotoType } from '@/generated/prisma';
import EditGroupForm from './edit-group-form';

export default async function EditGroupDetailsPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const { slug } = params;
  const group = await prisma.group.findUnique({
    where: {
      slug: slug,
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

  return <EditGroupForm group={group} logoUrl={logoUrl} />;
}

