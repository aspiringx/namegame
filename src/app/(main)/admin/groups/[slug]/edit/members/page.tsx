import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { auth } from '@/auth';
import { getPublicUrl } from '@/lib/storage';
import GroupMembers, { GroupMember } from '../group-members';
import { PhotoType, EntityType } from '@/generated/prisma';
import type { GroupWithMembers } from '../layout';

const MEMBERS_PER_PAGE = 25;

export default async function ManageMembersPage({ 
  params: paramsProp,
  searchParams: searchParamsProp,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ page?: string }>;
}) {
  const params = await paramsProp;
  const searchParams = await searchParamsProp;
  const page = Number(searchParams?.page) || 1;

  const session = await auth();
  const currentUserId = session?.user?.id;

  if (!currentUserId) {
    notFound();
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: currentUserId },
    include: { groupMemberships: { include: { group: true } } },
  });

  const isSuperAdmin =
    currentUser?.groupMemberships.some(
      (m) => m.group.slug === 'global-admin' && m.role === 'super'
    ) ?? false;

  if (!isSuperAdmin) {
    notFound();
  }

  const group = await prisma.group.findUnique({
    where: { slug: params.slug },
  });

  if (!group) {
    notFound();
  }

  const [totalMembers, members] = await prisma.$transaction([
    prisma.groupUser.count({ where: { groupId: group.id } }),
    prisma.groupUser.findMany({
      where: { groupId: group.id },
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
      take: MEMBERS_PER_PAGE,
      skip: (page - 1) * MEMBERS_PER_PAGE,
      orderBy: {
        createdAt: 'desc',
      },
    }),
  ]);

  const totalPages = Math.ceil(totalMembers / MEMBERS_PER_PAGE);
  const isGlobalAdminGroup = group.slug === 'global-admin';

  const membersWithPhoto = await Promise.all(members.map(async (member) => {
    const photo = member.user.photos[0];
    const photoUrl = photo
      ? await getPublicUrl(photo.url)
      : `https://api.dicebear.com/8.x/personas/png?seed=${member.user.id}`;
    return {
      ...member,
      user: {
        ...member.user,
        photoUrl,
      },
    };
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Manage Members for {group.name}</h1>
      <GroupMembers
        group={group as GroupWithMembers}
        members={membersWithPhoto as GroupMember[]}
        totalMembers={totalMembers}
        isSuperAdmin={isSuperAdmin}
        isGlobalAdminGroup={isGlobalAdminGroup}
        page={page}
        totalPages={totalPages}
      />
    </div>
  );
}