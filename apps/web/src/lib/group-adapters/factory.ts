import { GroupAdapter, GroupType } from './types'
import { CommunityAdapter } from './CommunityAdapter'
import { FamilyAdapter } from './FamilyAdapter'

/**
 * Factory function to get the appropriate adapter for a group type
 * 
 * This is the main entry point for the strategy pattern.
 * Usage: const adapter = getGroupAdapter('family')
 */
export function getGroupAdapter(groupType: GroupType): GroupAdapter {
  switch (groupType) {
    case 'community':
      return new CommunityAdapter()
    case 'family':
      return new FamilyAdapter()
    default:
      throw new Error(`Unknown group type: ${groupType}`)
  }
}

/**
 * Helper to get group type from group data
 */
export function getGroupTypeFromCode(code: string): GroupType {
  switch (code) {
    case 'community':
      return 'community'
    case 'family':
      return 'family'
    default:
      throw new Error(`Unknown group type code: ${code}`)
  }
}
