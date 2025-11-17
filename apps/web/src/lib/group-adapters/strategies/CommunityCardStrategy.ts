import { MemberCardStrategy } from '../types'

/**
 * Community-specific member card strategy
 * Handles connection display and community-specific actions
 */
export class CommunityCardStrategy implements MemberCardStrategy {
  showRelationship = false
  relationshipClassName = ''
  relationshipClickable = false
  availableActions: Array<'relate' | 'connect' | 'admin'> = [
    'relate',
    'connect',
    'admin',
  ]
  cardClassName = 'community-member-card'

  // Community-specific: show connected time instead of relationships
  showConnectedTime = true
  connectedTimeClassName = 'cursor-pointer text-xs text-gray-400'
}
