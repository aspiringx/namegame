import { ReactNode } from 'react'
import { MemberWithUser } from '@/types'
import { GroupPageSettings } from '@/lib/group-utils'
import { GroupToolbarConfig } from '@/lib/group-toolbar-config'

/**
 * Strategy Pattern Implementation for Group Types
 * 
 * This file defines the core interfaces for the group adapter pattern
 * that eliminates 800-1300 lines of duplication between group types.
 */

// Core member card strategy interface - simplified to avoid JSX in .ts files
export interface MemberCardStrategy {
  // Configuration for how to display relationships
  showRelationship: boolean
  relationshipClassName?: string
  relationshipClickable?: boolean
  
  // Configuration for connected time display (community groups)
  showConnectedTime?: boolean
  connectedTimeClassName?: string
  
  // Configuration for available actions
  availableActions: Array<'relate' | 'connect' | 'admin'>
  
  // CSS class for the card
  cardClassName?: string
}

// Props passed to member card action renderers
export interface MemberCardActionProps {
  onRelate?: (member: MemberWithUser) => void
  onConnect?: (member: MemberWithUser) => void
  currentUserId?: string
  isGroupAdmin?: boolean
}

// Data fetching strategy interface
export interface DataFetcher {
  getInitialData(groupSlug: string): Promise<any>
  getDefaultSettings(): GroupPageSettings
}

// Group-specific actions interface
export interface GroupActions {
  handleSort: (key: string, settings: GroupPageSettings, setSettings: (settings: GroupPageSettings | ((prev: GroupPageSettings) => GroupPageSettings)) => void) => void
  handleSearch: (query: string, setSettings: (settings: GroupPageSettings | ((prev: GroupPageSettings) => GroupPageSettings)) => void) => void
  handleMemberAction: (action: string, member: MemberWithUser) => void
}

// Main group adapter interface
export interface GroupAdapter {
  getToolbarConfig(groupSlug: string): GroupToolbarConfig
  getMemberCardStrategy(): MemberCardStrategy
  getActions(): GroupActions
  getDataFetcher(): DataFetcher
  getDefaultSettings(): GroupPageSettings
  
  // Tour configuration
  getTourSteps(isMobile: boolean, view: string): any[]
  
  // View-specific rendering
  renderSearchInput?(settings: GroupPageSettings, setSettings: (settings: GroupPageSettings) => void, memberCount: number): ReactNode
  renderAdditionalContent?(): ReactNode
}

// Group type enum for factory
export type GroupType = 'family' | 'community'

// Factory function type
export type GroupAdapterFactory = (groupType: GroupType) => GroupAdapter
