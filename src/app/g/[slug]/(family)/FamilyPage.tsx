import { getGroup, getFamilyRelationships } from './data'
import { FamilyGroupClient } from './FamilyGroupClient'
import { notFound } from 'next/navigation'
import { FullRelationship } from '@/types'

interface FamilyPageProps {
  params: Promise<{ slug: string }>
}

export default async function FamilyPage({
  params: paramsProp,
}: FamilyPageProps) {
  const params = await paramsProp
  const groupData = await getGroup(params.slug)
  if (!groupData) {
    notFound()
  }

  const groupMemberIds = groupData.members.map((member) => member.userId)

  const relationships = await getFamilyRelationships(groupMemberIds)

  return (
    <FamilyGroupClient
      initialMembers={groupData.members}
      groupSlug={params.slug}
      initialMemberCount={groupData.memberCount}
      initialRelationships={relationships as FullRelationship[]}
      view="grid"
    ></FamilyGroupClient>
  )
}
