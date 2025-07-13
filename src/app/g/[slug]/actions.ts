'use server';

import { revalidatePath } from 'next/cache';
import { createId } from '@paralleldrive/cuid2';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { getPublicUrl } from '@/lib/storage';
import { PhotoType } from '@/generated/prisma';
import { GroupWithMembers } from '@/types';

// Number of photos to retrieve at a time for infinite scroll. If a screen is 
// bigger, we'll retrieve more photos to fill the screen.
const PAGE_SIZE = 5;

type PaginatedMember = GroupWithMembers['members'][0];

export async function getPaginatedMembers(
  slug: string,
  listType: 'sunDeck' | 'iceBlock',
  page: number
): Promise<PaginatedMember[]> {
  const session = await auth();
  const currentUserId = session?.user?.id;

  if (!currentUserId) {
    return [];
  }

  const group = await prisma.group.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (!group) {
    return [];
  }

  const userRelations = await prisma.userUser.findMany({
    where: {
      groupId: group.id,
      OR: [{ user1Id: currentUserId }, { user2Id: currentUserId }],
    },
    select: { user1Id: true, user2Id: true, updatedAt: true },
  });

  const relatedUserMap = new Map<string, Date>();
  userRelations.forEach((relation) => {
    const otherUserId = relation.user1Id === currentUserId ? relation.user2Id : relation.user1Id;
    relatedUserMap.set(otherUserId, relation.updatedAt);
  });

  const allMemberIds = await prisma.groupUser.findMany({
    where: {
      groupId: group.id,
      userId: { not: currentUserId },
    },
    select: { userId: true },
  });

  let sortedUserIds: string[];

  if (listType === 'sunDeck') {
    const sunDeckUsers = allMemberIds
      .filter(({ userId }) => relatedUserMap.has(userId))
      .map(({ userId }) => ({ userId, metAt: relatedUserMap.get(userId)! }));

    sunDeckUsers.sort((a, b) => b.metAt.getTime() - a.metAt.getTime());
    sortedUserIds = sunDeckUsers.map((u) => u.userId);
  } else {
    const iceBlockUserIds = allMemberIds
      .filter(({ userId }) => !relatedUserMap.has(userId))
      .map(({ userId }) => userId);

    const users = await prisma.user.findMany({
      where: { id: { in: iceBlockUserIds } },
      select: { id: true, lastName: true, firstName: true },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    });
    sortedUserIds = users.map((u) => u.id);
  }

  const paginatedIds = sortedUserIds.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (paginatedIds.length === 0) {
    return [];
  }

  const members = await prisma.groupUser.findMany({
    where: {
      groupId: group.id,
      userId: { in: paginatedIds },
    },
    include: {
      user: {
        include: {
          photos: { where: { type: PhotoType.primary }, take: 1 },
        },
      },
    },
  });

  const memberMap = new Map(members.map((m) => [m.userId, m]));
  const sortedMembers = paginatedIds.map((id) => memberMap.get(id)).filter(Boolean) as typeof members;

  const memberPromises = sortedMembers.map(async (member) => {
    const primaryPhoto = member.user.photos[0];
    const photoUrl = primaryPhoto ? await getPublicUrl(primaryPhoto.url) : '/images/default-avatar.png';
    const name = [member.user.firstName, member.user.lastName].filter(Boolean).join(' ');

    return {
      ...member,
      user: {
        ...member.user,
        name,
        photoUrl,
      },
    };
  });

  return Promise.all(memberPromises);
}
