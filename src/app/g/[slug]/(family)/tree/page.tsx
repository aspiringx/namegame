import { notFound } from 'next/navigation'
import { FullRelationship } from '@/types'
import { getGroup, getFamilyRelationships } from '../data'
import { FamilyGroupClient } from '../FamilyGroupClient'
import TreeView from '../TreeView'

interface FamilyTreePageProps {
  params: Promise<{ slug: string }>
}

export default async function FamilyTreePage({ params: paramsPromise }: FamilyTreePageProps) {
  const params = await paramsPromise
  const groupData = await getGroup(params.slug)
  if (!groupData || groupData.groupType.code !== 'family') {
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
      view="tree"
    />
  )
}
