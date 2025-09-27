import { getGroup, getFamilyRelationships } from './data'
import { UniversalGroupClient } from '@/components/UniversalGroupClient'
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
    <UniversalGroupClient
      members={groupData.members}
      groupSlug={params.slug}
      groupType="family"
      initialRelationships={relationships as FullRelationship[]}
      initialMemberCount={groupData.memberCount}
      view="grid"
    />
  )
}
