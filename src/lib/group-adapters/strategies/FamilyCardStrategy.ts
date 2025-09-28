import { MemberCardStrategy } from '../types'

/**
 * Family-specific member card strategy
 * Handles relationship display and family-specific actions
 */
export class FamilyCardStrategy implements MemberCardStrategy {
  showRelationship = true
  relationshipClassName =
    'text-xs text-blue-500 hover:underline focus:outline-none dark:text-blue-400'
  relationshipClickable = true
  availableActions: Array<'relate' | 'connect' | 'admin'> = ['relate', 'admin']
  cardClassName = 'family-member-card'
}
