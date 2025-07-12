import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { getPublicUrl } from '@/lib/storage';
import { EntityType, PhotoType, Prisma } from '@/generated/prisma';
import { auth } from '@/auth';
import GroupMembers from '../group-members';
import { GroupWithMembers, GroupPayload } from '../layout';

export default async function ManageMembersPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const session = await auth();
  const group = await prisma.group.findUnique({
    where: {
      slug: slug,
    },
    include: {
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
    <GroupMembers
      group={groupWithMemberPhotos as unknown as GroupWithMembers}
      isSuperAdmin={isSuperAdmin}
      isGlobalAdminGroup={isGlobalAdminGroup}
    />
  );
}