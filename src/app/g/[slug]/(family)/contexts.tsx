'use client'

import { createContext, useContext } from 'react'
import { MemberWithUser } from '@/types'

// Family Members Context
const FamilyMembersContext = createContext<MemberWithUser[]>([])

export const useFamilyMembers = () => useContext(FamilyMembersContext)

// Family Actions Context
const FamilyActionsContext = createContext<{
  onOpenRelateModal: (member: MemberWithUser) => void
  handleCloseRelateModal: () => void
  isRelateModalOpen: boolean
  selectedMember: MemberWithUser | null
}>({
  onOpenRelateModal: () => {},
  handleCloseRelateModal: () => {},
  isRelateModalOpen: false,
  selectedMember: null,
})

export const useFamilyActions = () => useContext(FamilyActionsContext)

// Family Data Context
export const FamilyDataContext = createContext<{
  relationshipMap: Map<string, { label: string; steps: number }>
}>({
  relationshipMap: new Map(),
})

export const useFamilyData = () => useContext(FamilyDataContext)

// Export contexts for providers
export { FamilyMembersContext, FamilyActionsContext }
