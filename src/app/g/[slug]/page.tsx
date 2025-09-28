import { getGroupTypeBySlug } from './data'
import { getGroup as getFamilyGroup, getFamilyRelationships } from './(family)/data'
import { getGroup as getCommunityGroup } from './(community)/data'
import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { getDeviceTypeFromHeaders } from '@/lib/device'
import { UniversalClient } from '@/components/UniversalClient'
import { FullRelationship } from '@/types'

export default async function GroupPage({
  params: paramsProp,
}: {
  params: Promise<{ slug: string }>
}) {
  const params = await paramsProp
  const headersList = await headers()
  const deviceType = getDeviceTypeFromHeaders(headersList)
  
  // First, get the group type using the lightweight query
  const groupInfo = await getGroupTypeBySlug(params.slug)
  
  if (!groupInfo) {
    notFound()
  }

  const groupType = groupInfo.groupType.code

  // Fetch data based on group type
  if (groupType === 'family') {
    const groupData = await getFamilyGroup(params.slug, deviceType)
    if (!groupData) {
      notFound()
    }

    // Fetch relationship data for family groups
    const groupMemberIds = groupData.members.map((member) => member.userId)
    const relationships = await getFamilyRelationships(groupMemberIds) as FullRelationship[]

    return (
      <UniversalClient
        view="grid"
        initialMembers={groupData.members}
        groupSlug={params.slug}
        initialMemberCount={groupData.memberCount}
        initialRelationships={relationships}
      />
    )
  } else {
    // Community group
    const groupData = await getCommunityGroup(params.slug, deviceType)
    if (!groupData) {
      notFound()
    }

    return (
      <UniversalClient
        view="grid"
        initialMembers={groupData.members}
        groupSlug={params.slug}
        initialMemberCount={groupData.memberCount}
      />
    )
  }
}
