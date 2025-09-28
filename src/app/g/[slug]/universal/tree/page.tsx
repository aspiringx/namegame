import { notFound, redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { getDeviceTypeFromHeaders } from '@/lib/device'
import { getGroupTypeBySlug } from '../../data'
import { getGroup as getFamilyGroup, getFamilyRelationships } from '../../(family)/data'
import { UniversalClient } from '@/components/UniversalClient'
import { FullRelationship } from '@/types'

interface UniversalTreePageProps {
  params: Promise<{ slug: string }>
}

/**
 * Universal Tree Page - Family groups only
 * Redirects community groups to main grid view
 * Uses UniversalClient with FamilyAdapter for tree view
 */
export default async function UniversalTreePage({
  params: paramsProp,
}: UniversalTreePageProps) {
  const params = await paramsProp
  const headersList = await headers()
  const deviceType = getDeviceTypeFromHeaders(headersList)

  // First, get the group type using the lightweight query
  const groupInfo = await getGroupTypeBySlug(params.slug)
  
  if (!groupInfo) {
    notFound()
  }

  const groupType = groupInfo.groupType.code

  // Redirect community groups to main page (tree view not supported)
  if (groupType === 'community') {
    redirect(`/g/${params.slug}`)
  }

  // Only family groups reach this point - use FamilyClient for tree view
  const groupData = await getFamilyGroup(params.slug, deviceType)

  if (!groupData) {
    notFound()
  }

  // Fetch relationship data for family groups
  const groupMemberIds = groupData.members.map((member) => member.userId)
  const relationships = await getFamilyRelationships(groupMemberIds) as FullRelationship[]

  return (
    <UniversalClient
      view="tree"
      initialMembers={groupData.members}
      groupSlug={params.slug}
      initialMemberCount={groupData.memberCount}
      initialRelationships={relationships}
    />
  )
}
