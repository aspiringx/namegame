import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { auth } from '@/auth';
import { getPublicUrl } from '@/lib/storage';
import GroupMembers, { GroupMember } from '../group-members';

import type { GroupWithMembers } from '@/types/index';

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
  const isSuperAdmin = session?.user?.isSuperAdmin;

  if (!isSuperAdmin) {
    notFound();
  }

  const group = await prisma.group.findUnique({
    where: { slug: params.slug },
  });

  if (!group) {
    notFound();
  }

  const [totalMembers, members, groupUserRoles] = await prisma.$transaction([
    prisma.groupUser.count({ where: { groupId: group.id } }),
    prisma.groupUser.findMany({
      where: { groupId: group.id },
      include: {
        role: true,
        user: {
          include: {
            photos: {
              where: {
                entityType: { code: 'user', groupId: null },
                type: { code: 'primary', groupId: null },
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
    prisma.groupUserRole.findMany({ where: { groupId: null } }),
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
        groupUserRoles={groupUserRoles}
      />
    </div>
  );
}