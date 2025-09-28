import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { getDeviceTypeFromHeaders } from '@/lib/device'
import { UniversalClient } from '@/components/UniversalClient'

// Import data functions from both group types
import { getGroupTypeBySlug } from './data'
import { getGroup as getCommunityGroup } from './(community)/data'
import { getGroup as getFamilyGroup, getFamilyRelationships } from './(family)/data'
import { FullRelationship, CommunityGroupData, FamilyGroupData } from '@/types'

type UniversalGroupData = CommunityGroupData | FamilyGroupData

interface UniversalPageProps {
  params: Promise<{ slug: string }>
  view?: 'grid' | 'tree' | 'games'
}

/**
 * Universal page component that handles both community and family groups
 * using the strategy pattern to eliminate duplication
 */
export default async function UniversalPage({
  params: paramsProp,
  view = 'grid'
}: UniversalPageProps) {
  const params = await paramsProp
  const headersList = await headers()
  const deviceType = getDeviceTypeFromHeaders(headersList)

  // First, get the group type using the lightweight query
  const groupInfo = await getGroupTypeBySlug(params.slug)
  
  if (!groupInfo) {
    notFound()
  }

  const groupType = groupInfo.groupType.code

  // Now call the appropriate data function based on group type
  let groupData: UniversalGroupData | null = null
  
  if (groupType === 'community') {
    groupData = await getCommunityGroup(params.slug, deviceType)
  } else if (groupType === 'family') {
    groupData = await getFamilyGroup(params.slug, deviceType)
  }

  if (!groupData) {
    notFound()
  }
  let relationships: FullRelationship[] = []
  let relationshipMap: Map<string, { label: string; steps: number }> | undefined

  if (groupType === 'family') {
    // Fetch relationship data for family groups
    const groupMemberIds = groupData.members.map((member) => member.userId)
    relationships = await getFamilyRelationships(groupMemberIds) as FullRelationship[]
    
    // Create relationship map (simplified version - would need full logic from FamilyClient)
    relationshipMap = new Map()
    relationships.forEach(rel => {
      // Add null checks to prevent errors
      if (rel.relatedUser && rel.relatedUser.id && rel.relationType) {
        relationshipMap!.set(rel.relatedUser.id, { 
          label: rel.relationType.code, 
          steps: 1 
        })
      }
    })
  }

  return (
    <UniversalClient
      view={view}
      initialMembers={groupData.members}
      groupSlug={params.slug}
      initialMemberCount={groupData.memberCount}
      initialRelationships={relationships}
    />
  )
}
