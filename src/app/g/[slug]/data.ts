import 'server-only';
import { cache } from 'react';
import prisma from '@/lib/prisma';
import { getPublicUrl } from '@/lib/storage';
import { GroupWithMembers } from '@/types';
import { auth } from '@/auth';

export const getGroup = cache(async (slug: string): Promise<GroupWithMembers | null> => {
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

  const groupWithMemberDetails: GroupWithMembers = {
    ...group,
    members: resolvedMembers,
  };

  return groupWithMemberDetails;
});
