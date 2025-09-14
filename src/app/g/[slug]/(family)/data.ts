import 'server-only'
import { cache } from 'react'
import prisma from '@/lib/prisma'
import { getPublicPhoto } from '@/lib/photos'
import { getPublicUrl } from '@/lib/storage'
import { FamilyGroupData, MemberWithUser } from '@/types'
import { auth } from '@/auth'
import { FullRelationship } from '@/types'

export const getGroup = cache(async (
  slug: string,
  limit?: number,
): Promise<FamilyGroupData | null> => {
  const session = await auth()
  const currentUserId = session?.user?.id

  if (!currentUserId) {
    return null // Not authenticated
  }

  // Check if the user is a super admin
  const superAdminMembership = await prisma.groupUser.findFirst({
    where: {
      userId: currentUserId,
      group: { slug: 'global-admin' },
      role: { code: 'super' },
    },
  })

  const whereClause: any = { slug }
  if (!superAdminMembership) {
    whereClause.members = {
      some: {
        userId: currentUserId,
      },
    }
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
  })

  if (!group) {
    return null
  }

  // Fetch code table IDs for photo types
  const [userEntityType, primaryPhotoType, groupEntityType, logoPhotoType] =
    await Promise.all([
      prisma.entityType.findFirst({ where: { code: 'user' } }),
      prisma.photoType.findFirst({ where: { code: 'primary' } }),
      prisma.entityType.findFirst({ where: { code: 'group' } }),
      prisma.photoType.findFirst({ where: { code: 'logo' } }),
    ])

  const logoPhoto = await prisma.photo.findFirst({
    where: {
      entityId: group.id.toString(),
      entityTypeId: groupEntityType?.id,
      typeId: logoPhotoType?.id,
    },
  })
  const logo = logoPhoto?.url ? await getPublicUrl(logoPhoto.url) : undefined

  const memberUserIds = group.members.map((member) => member.userId)
  const photos = await prisma.photo.findMany({
    where: {
      entityId: { in: memberUserIds },
      entityTypeId: userEntityType?.id,
      typeId: primaryPhotoType?.id,
    },
  })

  const photoMap = new Map(photos.map((photo) => [photo.entityId, photo]))

  const memberPromises = group.members.map(
    async (member): Promise<MemberWithUser> => {
      const photo = photoMap.get(member.userId)
      const publicPhoto = await getPublicPhoto(photo || null)
      const photoUrl = publicPhoto?.url_thumb || '/images/default-avatar.png'

      return {
        ...member,
        user: {
          ...member.user,
          name: [member.user.firstName, member.user.lastName]
            .filter(Boolean)
            .join(' '),
          photoUrl,
        },
        parents: [],
        children: [],
      }
    },
  )

  const allMembers = await Promise.all(memberPromises)

  // Sort all members by lastName, then firstName, ascending
  allMembers.sort((a, b) => {
    const lastNameComparison = (a.user.lastName || '').localeCompare(
      b.user.lastName || '',
    )
    if (lastNameComparison !== 0) {
      return lastNameComparison
    }
    return (a.user.firstName || '').localeCompare(b.user.firstName || '')
  })

  const currentUserMember = allMembers.find(
    (member) => member.userId === currentUserId,
  )
  const limitedMembers = limit ? allMembers.slice(0, limit) : allMembers

  return {
    ...group,
    logo,
    isSuperAdmin: !!superAdminMembership,
    members: limitedMembers,
    memberCount: allMembers.length,
    currentUserMember,
  }
})

export const getFamilyRelationships = cache(async (
  groupMemberIds: string[],
): Promise<FullRelationship[]> => {
  const relationships = await prisma.userUser.findMany({
    where: {
      user1Id: {
        in: groupMemberIds,
      },
      user2Id: {
        in: groupMemberIds,
      },
    },
    include: {
      relationType: true,
      user1: true,
      user2: true,
    },
  })
  return relationships as FullRelationship[]
})
