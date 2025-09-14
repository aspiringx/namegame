import 'server-only'
import { cache } from 'react'
import prisma from '@/lib/prisma'
import { getPublicUrl } from '@/lib/storage'
import { CommunityGroupData, MemberWithUser } from '@/types'
import { auth } from '@/auth'

// Fetches community group data
export const getGroup = cache(async (
  slug: string,
  limit?: number,
): Promise<CommunityGroupData | null> => {
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
      select: {
        entityId: true,
        url: true,
        url_thumb: true,
      },
    })

        const photoMap = new Map<string, { url: string; url_thumb: string | null }>()
    photos.forEach((photo) => {
      if (photo.entityId) {
        photoMap.set(photo.entityId, photo)
      }
    })

    // Fetch UserUser relations for the current user in this group first to
    // determine who has been greeted.
    const userRelations = await prisma.userUser.findMany({
      where: {
        user1Id: { in: memberUserIds },
        user2Id: { in: memberUserIds },
      },
    })

    const relatedUserMap = new Map<string, Date>()
    userRelations.forEach((relation) => {
      // Current user must be userId1 or userId2 to prove userUser relation.
      if (
        currentUserId === relation.user1Id ||
        currentUserId === relation.user2Id
      ) {
        const otherUserId =
          relation.user1Id === currentUserId
            ? relation.user2Id
            : relation.user1Id
        relatedUserMap.set(otherUserId, relation.updatedAt)
      }
    })

    const memberPromises = group.members.map(
      async (member): Promise<MemberWithUser> => {
                const photo = photoMap.get(member.userId)
        const preferredUrl = photo?.url_thumb ?? photo?.url
        let photoUrl: string | undefined
        if (preferredUrl) {
          photoUrl = await getPublicUrl(preferredUrl)
        }

        // Show full name only for the current user or for users they have greeted.
        const isGreeted = relatedUserMap.has(member.userId)
        const name =
          currentUserId === member.userId || isGreeted
            ? [member.user.firstName, member.user.lastName]
                .filter(Boolean)
                .join(' ')
            : member.user.firstName

        const connectedAt =
          member.userId === currentUserId
            ? new Date()
            : relatedUserMap.get(member.userId)

        return {
          ...member,
          connectedAt,
          user: {
            ...member.user,
            name,
            photoUrl: photoUrl || '/images/default-avatar.png',
          },
          parents: [],
          children: [],
        }
      },
    )

    const members = await Promise.all(memberPromises)

    const currentUserMember = members.find(
      (member) => member.userId === currentUserId,
    )

    const relatedMembers = members.filter(
      (member) =>
        member.userId === currentUserId || relatedUserMap.has(member.userId),
    )
    const notRelatedMembers = members.filter(
      (member) =>
        member.userId !== currentUserId && !relatedUserMap.has(member.userId),
    )

    // Sort relatedMembers by the relation's updatedAt date, descending.
    // The current user should always be last.
    const currentUserInList = relatedMembers.find(
      (m) => m.userId === currentUserId,
    )
    const otherRelatedMembers = relatedMembers.filter(
      (m) => m.userId !== currentUserId,
    )

    otherRelatedMembers.sort((a, b) => {
      if (a.connectedAt && b.connectedAt) {
        return b.connectedAt.getTime() - a.connectedAt.getTime()
      }
      return 0
    })

    const sortedRelatedMembers = [...otherRelatedMembers]
    if (currentUserInList) {
      sortedRelatedMembers.push(currentUserInList)
    }

    // Sort notRelatedMembers by lastName, then firstName, ascending
    notRelatedMembers.sort((a, b) => {
      const lastNameComparison = (a.user.lastName || '').localeCompare(
        b.user.lastName || '',
      )
      if (lastNameComparison !== 0) {
        return lastNameComparison
      }
      return (a.user.firstName || '').localeCompare(b.user.firstName || '')
    })

    const limitedRelatedMembers = limit
      ? sortedRelatedMembers.slice(0, limit)
      : sortedRelatedMembers
    const limitedNotRelatedMembers = limit
      ? notRelatedMembers.slice(0, limit)
      : notRelatedMembers

    return {
      ...group,
      logo,
      isSuperAdmin: !!superAdminMembership,
      members,
      memberCount: members.length,
      relatedMembers: limitedRelatedMembers,
      notRelatedMembers: limitedNotRelatedMembers,
      relatedCount: sortedRelatedMembers.length,
      notRelatedCount: notRelatedMembers.length,
      currentUserMember,
    }
})
