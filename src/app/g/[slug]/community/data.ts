import 'server-only'
import prisma from '@/lib/prisma'
import { getPublicUrl } from '@/lib/storage'
import { GroupData, MemberWithUser } from '@/types'
import { auth } from '@/auth'

export const getGroup = async (
  slug: string,
  limit?: number,
): Promise<GroupData | null> => {
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
    },
  })

  const photoUrlMap = new Map<string, string>()
  photos.forEach((photo) => {
    if (photo.entityId) {
      photoUrlMap.set(photo.entityId, photo.url)
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
        relation.user1Id === currentUserId ? relation.user2Id : relation.user1Id
      relatedUserMap.set(otherUserId, relation.updatedAt)
    }
  })

  const memberPromises = group.members.map(
    async (member): Promise<MemberWithUser> => {
      const rawUrl = photoUrlMap.get(member.userId)
      let photoUrl: string | undefined
      if (rawUrl) {
        if (rawUrl.startsWith('http')) {
          photoUrl = rawUrl
        } else {
          photoUrl = await getPublicUrl(rawUrl)
        }
      }

      // Show full name only for the current user or for users they have greeted.
      const isGreeted = relatedUserMap.has(member.userId)
      const name =
        currentUserId === member.userId || isGreeted
          ? [member.user.firstName, member.user.lastName]
              .filter(Boolean)
              .join(' ')
          : member.user.firstName

      return {
        ...member,
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

  const resolvedMembers = await Promise.all(memberPromises)

  const greetedMembers: MemberWithUser[] = []
  const notGreetedMembers: MemberWithUser[] = []

  resolvedMembers.forEach((member) => {
    // The current user is always on their own greeted tab.
    // All other users are on the greeted tab if a relation exists.
    if (member.userId === currentUserId || relatedUserMap.has(member.userId)) {
      greetedMembers.push({
        ...member,
        relationUpdatedAt: relatedUserMap.get(member.userId),
      })
    } else {
      notGreetedMembers.push(member)
    }
  })

  const currentUserMember = greetedMembers.find(
    (member) => member.userId === currentUserId,
  )

  // Sort greetedMembers by the relation's updatedAt date, descending.
  // The current user should always be last.
  const currentUserInList = greetedMembers.find(
    (m) => m.userId === currentUserId,
  )
  const othergreetedMembers = greetedMembers.filter(
    (m) => m.userId !== currentUserId,
  )

  othergreetedMembers.sort((a, b) => {
    if (a.relationUpdatedAt && b.relationUpdatedAt) {
      return b.relationUpdatedAt.getTime() - a.relationUpdatedAt.getTime()
    }
    return 0
  })

  const sortedgreetedMembers = [...othergreetedMembers]
  if (currentUserInList) {
    sortedgreetedMembers.push(currentUserInList)
  }

  // Sort notGreetedMembers by lastName, then firstName, ascending
  notGreetedMembers.sort((a, b) => {
    const lastNameComparison = (a.user.lastName || '').localeCompare(
      b.user.lastName || '',
    )
    if (lastNameComparison !== 0) {
      return lastNameComparison
    }
    return (a.user.firstName || '').localeCompare(b.user.firstName || '')
  })

  const limitedgreetedMembers = limit
    ? sortedgreetedMembers.slice(0, limit)
    : sortedgreetedMembers
  const limitednotGreetedMembers = limit
    ? notGreetedMembers.slice(0, limit)
    : notGreetedMembers

  return {
    ...group,
    logo,
    isSuperAdmin: !!superAdminMembership,
    greetedMembers: limitedgreetedMembers,
    notGreetedMembers: limitednotGreetedMembers,
    greetedCount: sortedgreetedMembers.length,
    notGreetedCount: notGreetedMembers.length,
    currentUserMember,
  }
}
