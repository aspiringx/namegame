import { MemberCardStrategy } from '../types'

/**
 * Community-specific member card strategy
 * Handles connection status and community-specific actions
 */
export class CommunityCardStrategy implements MemberCardStrategy {
  showRelationship = false
  relationshipClassName = ''
  relationshipClickable = false
  availableActions: Array<'relate' | 'connect' | 'admin'> = ['relate', 'connect', 'admin']
  cardClassName = 'community-member-card'
}
