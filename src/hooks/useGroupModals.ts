/**
 * Shared hook for group modal management
 * Used by both FamilyClient and CommunityClient
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import useLocalStorage from '@/hooks/useLocalStorage'
import type { MemberWithUser } from '@/types'

interface UseGroupModalsProps {
  groupSlug: string
  groupType: 'family' | 'community'
}

export function useGroupModals({ groupSlug, groupType: _groupType }: UseGroupModalsProps) {
  const router = useRouter()
  
  // Modal state
  const [isRelateModalOpen, setIsRelateModalOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<MemberWithUser | null>(null)
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false)
  const [memberToConnect, setMemberToConnect] = useState<MemberWithUser | null>(null)
  const [isIntroModalOpen, setIsIntroModalOpen] = useState(false)
  const [introSeen, setIntroSeen] = useLocalStorage(`games-intro-seen-${groupSlug}`, false)

  // Modal handlers
  const handleOpenRelateModal = (member: MemberWithUser) => {
    setSelectedMember(member)
    setIsRelateModalOpen(true)
  }

  const handleCloseRelateModal = () => {
    setIsRelateModalOpen(false)
    setSelectedMember(null)
  }

  const handleOpenConnectModal = (member: MemberWithUser) => {
    setMemberToConnect(member)
    setIsConnectModalOpen(true)
  }

  const handleCloseConnectModal = () => {
    setIsConnectModalOpen(false)
    setMemberToConnect(null)
  }

  const handleRelationshipChange = () => {
    router.refresh()
  }

  const handleCloseIntroModal = () => {
    setIsIntroModalOpen(false)
    setIntroSeen(true)
    router.push(`/g/${groupSlug}/games`)
  }

  // Community-specific connection handler
  const handleConfirmConnect = async (createConnectionFn?: (memberId: string, groupSlug: string) => Promise<void>) => {
    if (!memberToConnect || !createConnectionFn) {
      toast.error('Could not connect member. Please try again.')
      return
    }
    try {
      await createConnectionFn(memberToConnect.userId, groupSlug)
      toast.success(`You are now connected with ${memberToConnect.user.name}.`)
      router.refresh()
    } catch (error) {
      console.error('Failed to create connection:', error)
      toast.error('Failed to connect.')
    } finally {
      handleCloseConnectModal()
    }
  }

  return {
    // State
    isRelateModalOpen,
    selectedMember,
    isConnectModalOpen,
    memberToConnect,
    isIntroModalOpen,
    introSeen,
    
    // Setters
    setIsRelateModalOpen,
    setSelectedMember,
    setIsConnectModalOpen,
    setMemberToConnect,
    setIsIntroModalOpen,
    setIntroSeen,
    
    // Handlers
    handleOpenRelateModal,
    handleCloseRelateModal,
    handleOpenConnectModal,
    handleCloseConnectModal,
    handleRelationshipChange,
    handleCloseIntroModal,
    handleConfirmConnect,
  }
}
