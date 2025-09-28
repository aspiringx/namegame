import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { getDeviceTypeFromHeaders } from '@/lib/device'
import { UniversalClient } from '@/components/UniversalClient'
// Import data functions from both group types
import { getGroupTypeBySlug } from '../data'
import { getGroup as getCommunityGroup } from '../(community)/data'
import { getGroup as getFamilyGroup, getFamilyRelationships } from '../(family)/data'
import { FullRelationship, CommunityGroupData, FamilyGroupData } from '@/types'

type UniversalGroupData = CommunityGroupData | FamilyGroupData

interface UniversalTestPageProps {
  params: Promise<{ slug: string }>
}

/**
 * TEST PAGE for Universal Client
 * Visit /g/[slug]/universal to test the strategy pattern implementation
 * This is a safe test route that doesn't break existing functionality
 */
export default async function UniversalTestPage({
  params: paramsProp,
}: UniversalTestPageProps) {
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

  // Fetch additional data for family groups
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
    <div>
      {/* Test banner */}
      <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm">
              <strong>TEST MODE:</strong> This is the new Universal Client using the strategy pattern. 
              Group type detected: <strong>{groupType}</strong> | 
              Members: <strong>{groupData.members.length}</strong> | 
              Relationships: <strong>{relationships.length}</strong>
            </p>
          </div>
        </div>
      </div>

      <UniversalClient
        view="grid"
        initialMembers={groupData.members}
        groupSlug={params.slug}
        initialMemberCount={groupData.memberCount}
        initialRelationships={relationships}
        relationshipMap={relationshipMap}
      />
    </div>
  )
}
