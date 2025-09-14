import { getGroup } from './data'
import { getFamilyRelationships } from './actions'
import { GroupProvider, GroupPageData } from '@/components/GroupProvider'
import { notFound } from 'next/navigation'
import { GroupData } from '@/types'

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

  const relationships = await getFamilyRelationships(params.slug)

  const { ...restOfFamilyGroupData } = familyGroupData

  const currentUserMember = familyGroupData.members.find(
    (m) => m.userId === familyGroupData.currentUserMember?.userId,
  )

  const relatedMemberIds = new Set(
    relationships.flatMap((r) => [r.user1Id, r.user2Id]),
  )
  const relatedMembers = familyGroupData.members.filter((m) =>
    relatedMemberIds.has(m.userId),
  )
  const notRelatedMembers = familyGroupData.members.filter(
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
