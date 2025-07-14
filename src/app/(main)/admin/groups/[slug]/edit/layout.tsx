import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { getPublicUrl } from '@/lib/storage';
import { auth } from '@/auth';
import { EntityType, PhotoType, Prisma } from '@/generated/prisma';
import Breadcrumbs from '@/components/Breadcrumbs';
import EditGroupNav from './edit-group-nav';
import type { GroupPayload, GroupWithMembers } from '@/types/index';



export default async function EditGroupLayout(props: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  const { children } = props;
  const params = await props.params;
  const { slug } = params;
  const session = await auth();
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
      members: {
        include: {
          user: {
            include: {
              photos: {
                where: {
                  entityType: EntityType.user,
                  type: PhotoType.primary,
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
  });

  if (!group) {
    notFound();
  }

  const logo = group?.photos[0];
  const logoUrl = await getPublicUrl(logo?.url);

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
    : null;

  const isSuperAdmin =
    currentUser?.groupMemberships.some((m: { group: { slug: string }; role: string }) => m.group.slug === 'global-admin' && m.role === 'super') ?? false;

  const isGlobalAdminGroup = group.slug === 'global-admin';

  const groupWithMemberPhotos = {
    ...group,
    members: await Promise.all(
      group.members.map(async (member: GroupPayload['members'][number]) => ({
        ...member,
        user: {
          ...member.user,
          photoUrl: await (async () => {
            const rawUrl = member.user.photos?.[0]?.url;
            if (rawUrl) {
              if (rawUrl.startsWith('http')) {
                return rawUrl;
              }
              return getPublicUrl(rawUrl);
            }
            return '/images/default-avatar.png';
          })(),
        },
      }))
    ),
  };

  return (
    <div className="max-w-4xl mx-auto p-8 dark:bg-gray-900">
      <Breadcrumbs />
      <h1 className="text-2xl font-bold mb-6 dark:text-white">Edit Group: {group.name}</h1>
      <EditGroupNav group={group} />
      <div className="mt-6">{children}</div>
    </div>
  );
}