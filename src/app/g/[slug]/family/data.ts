import 'server-only'
import prisma from '@/lib/prisma'
import { getPublicUrl } from '@/lib/storage'
import { FamilyGroupData, FullRelationship, MemberWithUser } from '@/types'
import { auth } from '@/auth'

export async function getGroup(
  slug: string,
  limit?: number,
): Promise<FamilyGroupData | null> {
  const session = await auth()
  const currentUserId = session?.user?.id

  if (!currentUserId) {
    return null // Not authenticated
  }

  const group = await prisma.group.findUnique({
    where: { slug },
    include: {
      groupType: true,
      members: {
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

  // Fetch photos for all members
  const memberUserIds = group.members.map((member) => member.userId)
  const [userEntityType, primaryPhotoType] = await Promise.all([
    prisma.entityType.findFirst({ where: { code: 'user' } }),
    prisma.photoType.findFirst({ where: { code: 'primary' } }),
  ])

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
  for (const photo of photos) {
    if (photo.entityId && photo.url) {
      if (photo.url.startsWith('http')) {
        photoUrlMap.set(photo.entityId, photo.url)
      } else {
        photoUrlMap.set(photo.entityId, await getPublicUrl(photo.url))
      }
    }
  }

  const groupMemberIds = group.members.map((member) => member.userId)

  const rawRelationships = await prisma.userUser.findMany({
    where: {
      OR: [
        { user1Id: { in: groupMemberIds }, user2Id: { in: groupMemberIds } },
        { user2Id: { in: groupMemberIds }, user1Id: { in: groupMemberIds } },
      ],
    },
    include: {
      relationType: true,
      user1: true,
      user2: true,
    },
  })

  // Construct MemberWithUser objects
  const memberMap = new Map<string, MemberWithUser>()
  group.members.forEach((member) => {
    const name = [member.user.firstName, member.user.lastName]
      .filter(Boolean)
      .join(' ')

    memberMap.set(member.userId, {
      ...member,
      user: {
        ...member.user,
        name,
        photoUrl: photoUrlMap.get(member.userId),
      },
      parents: [],
      children: [],
    })
  })

  // Populate parent/child connections
  rawRelationships.forEach((rel) => {
    if (rel.relationType.code === 'parent') {
      const parent = memberMap.get(rel.user1Id)
      const child = memberMap.get(rel.user2Id)
      if (parent && child) {
        child.parents.push(parent)
        parent.children.push(child)
      }
    } else if (rel.relationType.code === 'child') {
      const child = memberMap.get(rel.user1Id)
      const parent = memberMap.get(rel.user2Id)
      if (parent && child) {
        child.parents.push(parent)
        parent.children.push(child)
      }
    }
  })

  const allMembers = Array.from(memberMap.values())

  const currentUserMember = allMembers.find(
    (member) => member.userId === currentUserId,
  )

  const isSuperAdmin = await prisma.groupUser.findFirst({
    where: {
      userId: currentUserId,
      group: { slug: 'global-admin' },
      role: { code: 'super' },
    },
  });

  return {
    ...group,
    isSuperAdmin: !!isSuperAdmin,
    members: allMembers,
    memberCount: allMembers.length,
    currentUserMember,
    relationships: rawRelationships as FullRelationship[],
  }
}
