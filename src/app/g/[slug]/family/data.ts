import 'server-only';
import { cache } from 'react';
import prisma from '@/lib/prisma';
import { getPublicUrl } from '@/lib/storage';
import { FamilyGroupData, MemberWithUser } from '@/types';
import { auth } from '@/auth';

export const getGroup = async (slug: string, limit?: number): Promise<FamilyGroupData | null> => {

  const session = await auth();
  const currentUserId = session?.user?.id;

  if (!currentUserId) {
    return null; // Not authenticated
  }

  // Check if the user is a super admin
  const superAdminMembership = await prisma.groupUser.findFirst({
    where: {
      userId: currentUserId,
      group: { slug: 'global-admin' },
      role: { code: 'super' },
    },
  });

  const whereClause: any = { slug };
  if (!superAdminMembership) {
    whereClause.members = {
      some: {
        userId: currentUserId,
      },
    };
  }

  const group = await prisma.group.findUnique({
    where: { slug },
    include: {
      groupType: true,
      photos: true,
      members: {
        orderBy: {
          updatedAt: 'desc',
        },
        include: {
          user: true,
          role: true,
        },
      },
    },
  });

  if (!group) {
    return null;
  }

  // Fetch code table IDs for photo types
  const [userEntityType, primaryPhotoType, groupEntityType, logoPhotoType] = await Promise.all([
    prisma.entityType.findFirst({ where: { code: 'user' } }),
    prisma.photoType.findFirst({ where: { code: 'primary' } }),
    prisma.entityType.findFirst({ where: { code: 'group' } }),
    prisma.photoType.findFirst({ where: { code: 'logo' } }),
  ]);

  const logoPhoto = await prisma.photo.findFirst({
    where: {
      entityId: group.id.toString(),
      entityTypeId: groupEntityType?.id,
      typeId: logoPhotoType?.id,
    },
  });
  const logo = logoPhoto?.url ? await getPublicUrl(logoPhoto.url) : undefined;

  const memberUserIds = group.members.map((member) => member.userId);
  const photos = await prisma.photo.findMany({
    where: {
      entityId: { in: memberUserIds },
      entityTypeId: userEntityType?.id,
      typeId: primaryPhotoType?.id,
    },
    select: {
      entityId: true,
      url: true,
    },
  });

  const photoUrlMap = new Map<string, string>();
  photos.forEach((photo) => {
    if (photo.entityId) {
      photoUrlMap.set(photo.entityId, photo.url);
    }
  });

  const memberPromises = group.members.map(async (member): Promise<MemberWithUser> => {
    const rawUrl = photoUrlMap.get(member.userId);
    let photoUrl: string | undefined;
    if (rawUrl) {
      if (rawUrl.startsWith('http')) {
        photoUrl = rawUrl;
      } else {
        photoUrl = await getPublicUrl(rawUrl);
      }
    }

    // For family groups, we always show the full name.
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

  const allMembers = await Promise.all(memberPromises);

  // Sort all members by lastName, then firstName, ascending
  allMembers.sort((a, b) => {
    const lastNameComparison = (a.user.lastName || '').localeCompare(b.user.lastName || '');
    if (lastNameComparison !== 0) {
      return lastNameComparison;
    }
    return (a.user.firstName || '').localeCompare(b.user.firstName || '');
  });

  const currentUserMember = allMembers.find((member) => member.userId === currentUserId);
  const limitedMembers = limit ? allMembers.slice(0, limit) : allMembers;

  return {
    ...group,
    logo,
    isSuperAdmin: !!superAdminMembership,
    members: limitedMembers,
    memberCount: allMembers.length,
    currentUserMember,
  };
};
