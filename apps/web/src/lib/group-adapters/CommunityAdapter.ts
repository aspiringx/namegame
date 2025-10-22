import { ReactNode } from 'react'
import {
  GroupAdapter,
  MemberCardStrategy,
  GroupActions,
  DataFetcher,
} from './types'
import {
  GroupToolbarConfig,
  getCommunityGroupToolbarConfig,
} from '@/lib/group-toolbar-config'
import { GroupPageSettings, getDefaultSettings } from '@/lib/group-utils'
import { CommunityCardStrategy } from './strategies/CommunityCardStrategy'
import { MemberWithUser } from '@/types'

// Import tour steps
import { steps as communityTourSteps } from '@/components/tours/CommunityTour'
import { steps as communityTourMobileSteps } from '@/components/tours/CommunityTourMobile'

/**
 * Community group adapter implementation
 * Handles all community-specific behavior and rendering
 */
export class CommunityAdapter implements GroupAdapter {
  private cardStrategy: MemberCardStrategy

  constructor() {
    this.cardStrategy = new CommunityCardStrategy()
  }

  getToolbarConfig(groupSlug: string): GroupToolbarConfig {
    return getCommunityGroupToolbarConfig(groupSlug)
  }

  getMemberCardStrategy(): MemberCardStrategy {
    return this.cardStrategy
  }

  getActions(): GroupActions {
    return {
      handleSort: (
        key: string,
        settings: GroupPageSettings,
        setSettings: (settings: GroupPageSettings) => void,
      ) => {
        setSettings({
          ...settings,
          sortConfig: {
            key,
            direction:
              settings.sortConfig.key === key &&
              settings.sortConfig.direction === 'asc'
                ? 'desc'
                : 'asc',
          },
        })
      },
      handleSearch: (
        query: string,
        setSettings: (settings: GroupPageSettings | ((prev: GroupPageSettings) => GroupPageSettings)) => void,
      ) => {
        setSettings((prev: GroupPageSettings) => ({ ...prev, searchQuery: query }))
      },
      handleMemberAction: (_action: string, _member: MemberWithUser) => {
        // Community-specific member actions
        // TODO: Implement community-specific actions
      },
    }
  }

  getDataFetcher(): DataFetcher {
    return {
      getInitialData: async (_groupSlug: string) => {
        // Community-specific data fetching logic would go here
        // For now, return empty object as this is handled by existing code
        return {}
      },
      getDefaultSettings: () => this.getDefaultSettings(),
    }
  }

  getDefaultSettings(): GroupPageSettings {
    return getDefaultSettings('community')
  }

  getTourSteps(isMobile: boolean): any[] {
    return isMobile ? communityTourMobileSteps : communityTourSteps
  }

  renderSearchInput(
    _settings: GroupPageSettings,
    _setSettings: (settings: GroupPageSettings) => void,
    _memberCount: number,
  ): ReactNode {
    // Search input will be rendered by the parent component
    return null
  }

  renderAdditionalContent(): ReactNode {
    // Community groups don't need additional content
    return null
  }
}
