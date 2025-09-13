import { getGroup } from './data'
import { getFamilyRelationships } from './actions'
import { GroupProvider, GroupPageData } from '@/components/GroupProvider'
import { getPublicUrl } from '@/lib/storage'
import { notFound } from 'next/navigation'
import { MemberWithUser, GroupData } from '@/types'

export default async function FamilyGroupLayout({
  children,
  params: paramsPromise,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const params = await paramsPromise
  const familyGroupData = await getGroup(params.slug)
  if (!familyGroupData) {
    notFound()
  }

  const membersWithPhotoUrls = await Promise.all(
    familyGroupData.members.map(async (member: MemberWithUser) => ({
      ...member,
      user: {
        ...member.user,
        photoUrl: await getPublicUrl(member.user.photoUrl),
      },
    })),
  )

  const relationships = await getFamilyRelationships(params.slug)

  const { ...restOfFamilyGroupData } = familyGroupData

  const currentUserMember = membersWithPhotoUrls.find(
    (m) => m.userId === familyGroupData.currentUserMember?.userId,
  )

  const relatedMemberIds = new Set(
    relationships.flatMap((r) => [r.user1Id, r.user2Id]),
  )
  const relatedMembers = membersWithPhotoUrls.filter((m) =>
    relatedMemberIds.has(m.userId),
  )
  const notRelatedMembers = membersWithPhotoUrls.filter(
    (m) => !relatedMemberIds.has(m.userId),
  )

  const groupForProvider: GroupData = {
    ...restOfFamilyGroupData,
  }

  const groupDataForProvider: GroupPageData = {
    group: groupForProvider,
    relatedMembers: relatedMembers,
    notRelatedMembers: notRelatedMembers,
    currentUserMember: currentUserMember,
    isSuperAdmin: familyGroupData.isSuperAdmin,
    isGroupAdmin: currentUserMember?.role.code === 'admin',
    isAuthorizedMember: !!currentUserMember,
    relationships: relationships,
  }

  return <GroupProvider value={groupDataForProvider}>{children}</GroupProvider>
}
