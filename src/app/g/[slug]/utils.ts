import { cache } from 'react'
import { getGroupTypeBySlug } from './data'
import { getGroup as getCommunityGroup } from './(community)/data'
import { getGroup as getFamilyGroup } from './(family)/data'
import { FamilyGroupData, CommunityGroupData } from '@/types'

// Helper to fetch the correct group data based on type
export const getGroupForLayout = cache(
  async (
    slug: string,
    limit?: number,
    deviceType: 'mobile' | 'desktop' = 'desktop',
  ): Promise<CommunityGroupData | FamilyGroupData | null> => {
    const groupTypeData = await getGroupTypeBySlug(slug)
    if (!groupTypeData) {
      return null
    }

    if (groupTypeData.groupType.code === 'family') {
            return getFamilyGroup(slug, limit, deviceType)
    }

        return getCommunityGroup(slug, limit, deviceType)
  },
)
