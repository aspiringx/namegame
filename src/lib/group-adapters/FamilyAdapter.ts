import { ReactNode } from 'react'
import {
  GroupAdapter,
  MemberCardStrategy,
  GroupActions,
  DataFetcher,
} from './types'
import {
  GroupToolbarConfig,
  getFamilyGroupToolbarConfig,
} from '@/lib/group-toolbar-config'
import { GroupPageSettings, getDefaultSettings } from '@/lib/group-utils'
import { FamilyCardStrategy } from './strategies/FamilyCardStrategy'
import { MemberWithUser } from '@/types'

// Import tour steps
import { steps as familyTourSteps } from '@/components/tours/FamilyTour'
import { steps as familyTourMobileSteps } from '@/components/tours/FamilyTourMobile'
import { steps as familyTreeSteps } from '@/components/tours/FamilyTreeTour'
import { steps as familyTreeMobileSteps } from '@/components/tours/FamilyTreeTourMobile'

/**
 * Family group adapter implementation
 * Handles all family-specific behavior including relationship mapping
 */
export class FamilyAdapter implements GroupAdapter {
  private cardStrategy: MemberCardStrategy

  constructor() {
    this.cardStrategy = new FamilyCardStrategy()
  }

  getToolbarConfig(groupSlug: string): GroupToolbarConfig {
    return getFamilyGroupToolbarConfig(groupSlug)
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
        const isSameKey = settings.sortConfig.key === key
        let newDirection: 'asc' | 'desc'

        if (isSameKey) {
          newDirection =
            settings.sortConfig.direction === 'asc' ? 'desc' : 'asc'
        } else {
          newDirection = key === 'joined' ? 'desc' : 'asc'
        }

        setSettings({
          ...settings,
          sortConfig: {
            key,
            direction: newDirection,
          },
        })
      },
      handleSearch: (
        query: string,
        setSettings: (settings: GroupPageSettings) => void,
      ) => {
        setSettings((prev) => ({ ...prev, searchQuery: query }))
      },
      handleMemberAction: (action: string, member: MemberWithUser) => {
        // Family-specific member actions
        console.log(`Family action: ${action} for member:`, member.user.name)
      },
    }
  }

  getDataFetcher(): DataFetcher {
    return {
      getInitialData: async (groupSlug: string) => {
        // Family-specific data fetching logic would go here
        // This would include relationship data fetching
        return {}
      },
      getDefaultSettings: () => this.getDefaultSettings(),
    }
  }

  getDefaultSettings(): GroupPageSettings {
    return getDefaultSettings('family')
  }

  getTourSteps(isMobile: boolean, view: string): any[] {
    if (view === 'tree') {
      return isMobile ? familyTreeMobileSteps : familyTreeSteps
    }
    return isMobile ? familyTourMobileSteps : familyTourSteps
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
    // Family groups might need additional content like focal user search
    // This would be implemented based on the view type
    return null
  }
}
