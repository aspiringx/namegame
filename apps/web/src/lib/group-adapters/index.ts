/**
 * Group Adapters - Strategy Pattern Implementation
 * 
 * This module implements the strategy pattern to eliminate duplication
 * between different group types (family, community, etc.)
 * 
 * Usage:
 *   import { getGroupAdapter } from '@/lib/group-adapters'
 *   const adapter = getGroupAdapter('family')
 *   const strategy = adapter.getMemberCardStrategy()
 */

// Core types and interfaces
export type { 
  GroupAdapter, 
  MemberCardStrategy, 
  GroupActions, 
  DataFetcher,
  GroupType,
  MemberCardActionProps 
} from './types'

// Factory function
export { getGroupAdapter, getGroupTypeFromCode } from './factory'

// Concrete adapters
export { CommunityAdapter } from './CommunityAdapter'
export { FamilyAdapter } from './FamilyAdapter'

// Strategies
export { CommunityCardStrategy } from './strategies/CommunityCardStrategy'
export { FamilyCardStrategy } from './strategies/FamilyCardStrategy'
