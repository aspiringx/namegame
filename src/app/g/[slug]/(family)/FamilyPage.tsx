import { getGroup, getFamilyRelationships } from './data'
import { FamilyClient } from './FamilyClient'
import { notFound } from 'next/navigation'
import { FullRelationship } from '@/types'
import { headers } from 'next/headers'
import { getDeviceTypeFromHeaders } from '@/lib/device'

interface FamilyPageProps {
  params: Promise<{ slug: string }>
}

export default async function FamilyPage({
  params: paramsProp,
}: FamilyPageProps) {
  const params = await paramsProp
  const headersList = await headers()
  const deviceType = getDeviceTypeFromHeaders(headersList)
  const groupData = await getGroup(params.slug, deviceType)
  if (!groupData) {
    notFound()
  }

  const groupMemberIds = groupData.members.map((member) => member.userId)
  const relationships = await getFamilyRelationships(groupMemberIds)

  return (
    <FamilyClient
      initialMembers={groupData.members}
      groupSlug={params.slug}
      initialMemberCount={groupData.memberCount}
      initialRelationships={relationships as FullRelationship[]}
      view="grid"
    />
  )
}
