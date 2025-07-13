import 'server-only';
import { cache } from 'react';
import prisma from '@/lib/prisma';
import { getPublicUrl } from '@/lib/storage';
import { GroupWithMembers } from '@/types';
import { auth } from '@/auth';

export const getGroup = cache(async (slug: string, limit?: number) => {
  const session = await auth();
  const currentUserId = session?.user?.id;

  const group = await prisma.group.findUnique({
    where: { slug },
    include: {
      photos: true,
      members: {
        orderBy: {
          updatedAt: 'desc',
        },
        include: {
          user: {
            include: {
              photos: true, // Correct relation is 'photos'
            },
          },
        },
      },
    },
  });

  if (!group) {
    return null;
  }

  const memberPromises = group.members.map(async (member) => {
    const primaryPhoto = member.user.photos.find((p) => p.type === 'primary');
    let photoUrl: string | undefined;
    if (primaryPhoto?.url) {
      if (primaryPhoto.url.startsWith('http')) {
        photoUrl = primaryPhoto.url;
      } else {
        photoUrl = await getPublicUrl(primaryPhoto.url);
      }
    }
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

  const resolvedMembers = await Promise.all(memberPromises);

  // Fetch UserUser relations for the current user in this group
  const userRelations = await prisma.userUser.findMany({
    where: {
      groupId: group.id,
      OR: [{ user1Id: currentUserId }, { user2Id: currentUserId }],
    },
  });

  const relatedUserMap = new Map<string, Date>();
  userRelations.forEach((relation) => {
    const otherUserId = relation.user1Id === currentUserId ? relation.user2Id : relation.user1Id;
    relatedUserMap.set(otherUserId, relation.updatedAt);
  });

  const sunDeckMembers: GroupWithMembers['members'] = [];
  const iceBlockMembers: GroupWithMembers['members'] = [];

  const foundMember = resolvedMembers.find((member) => member.userId === currentUserId);
  const currentUserMember = foundMember ? JSON.parse(JSON.stringify(foundMember)) : undefined;

  resolvedMembers.forEach((member) => {
    if (member.userId === currentUserId) {
      return; // Skip the current user from normal processing
    }

    if (relatedUserMap.has(member.userId)) {
      sunDeckMembers.push({
        ...member,
        relationUpdatedAt: relatedUserMap.get(member.userId),
      });
    } else {
      iceBlockMembers.push(member);
    }
  });

  // Sort sunDeckMembers by the relation's updatedAt date, descending
  sunDeckMembers.sort((a, b) => {
    if (a.relationUpdatedAt && b.relationUpdatedAt) {
      return b.relationUpdatedAt.getTime() - a.relationUpdatedAt.getTime();
    }
    return 0;
  });

  // Sort iceBlockMembers by lastName, then firstName, ascending
  iceBlockMembers.sort((a, b) => {
    const lastNameComparison = (a.user.lastName || '').localeCompare(b.user.lastName || '');
    if (lastNameComparison !== 0) {
      return lastNameComparison;
    }
    return (a.user.firstName || '').localeCompare(b.user.firstName || '');
  });

  const limitedSunDeckMembers = limit ? sunDeckMembers.slice(0, limit) : sunDeckMembers;
  const limitedIceBlockMembers = limit ? iceBlockMembers.slice(0, limit) : iceBlockMembers;

  return {
    group,
    sunDeckMembers: limitedSunDeckMembers,
    iceBlockMembers: limitedIceBlockMembers,
    currentUserMember,
  };
});
