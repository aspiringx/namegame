import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { getPublicUrl } from '@/lib/storage';
import { EntityType, PhotoType, Prisma, User } from '@/generated/prisma';
import Breadcrumbs from '@/components/Breadcrumbs';
import EditGroupPageClient from './edit-group-page-client';
import { auth } from '@/auth';

const groupWithMembers = Prisma.validator<Prisma.GroupDefaultArgs>()({
  include: {
    photos: true,
    members: {
      include: {
        user: {
          include: {
            photos: true,
          },
        },
      },
    },
  },
});

type GroupPayload = Prisma.GroupGetPayload<typeof groupWithMembers>;

export type GroupWithMembers = Omit<GroupPayload, 'members'> & {
  members: (Omit<GroupPayload['members'][number], 'user'> & {
    user: GroupPayload['members'][number]['user'] & { photoUrl: string };
  })[];
};

export default async function EditGroupPage(props: { params: Promise<{ slug: string }> }) {
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
    currentUser?.groupMemberships.some((m) => m.group.slug === 'global-admin' && m.role === 'super') ?? false;

  const isGlobalAdminGroup = group.slug === 'global-admin';

  const groupWithMemberPhotos = {
    ...group,
    members: await Promise.all(
      group.members.map(async (member) => ({
        ...member,
        user: {
          ...member.user,
          photoUrl: member.user.photos?.[0]?.url
            ? await getPublicUrl(member.user.photos[0].url)
            : '/images/default-avatar.png',
        },
      }))
    ),
  };

  return (
    <div className="max-w-4xl mx-auto p-8 dark:bg-gray-900">
      <Breadcrumbs />
      <h1 className="text-2xl font-bold mb-6 dark:text-white">Edit Group: {group.name}</h1>
      <EditGroupPageClient
        group={groupWithMemberPhotos as unknown as GroupWithMembers}
        logoUrl={logoUrl}
        isSuperAdmin={isSuperAdmin}
        isGlobalAdminGroup={isGlobalAdminGroup}
      />
    </div>
  );
}
