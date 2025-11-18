'use client'

import { useState, useEffect } from 'react'
import { X, Search, Check } from 'lucide-react'
import Image from 'next/image'
import { useGroup } from '@/components/GroupProvider'
import { getGroupMemberPhotos, getUserConnections } from '@/app/actions/chat'

interface ParticipantSelectorProps {
  isOpen: boolean
  onClose: () => void
  onStartChat: (participantIds: string[]) => void
  mode: 'group' | 'global'
}

interface Participant {
  id: string
  name: string
  avatar?: string
}

// Cache for loaded connections to avoid re-querying
const globalConnectionsCache: Participant[] = []
const groupPhotosCache = new Map<string, Map<string, string>>()

// Recipient limits
const MAX_GLOBAL_RECIPIENTS = 15 // For direct messages outside groups
const MAX_GROUP_RECIPIENTS = 100 // For messages within a group (no practical limit)

export default function ParticipantSelector({
  isOpen,
  onClose,
  onStartChat,
  mode,
}: ParticipantSelectorProps) {
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [photoMap, setPhotoMap] = useState<Map<string, string>>(new Map())
  const [globalConnections, setGlobalConnections] = useState<Participant[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const groupData = useGroup()
  const group = groupData?.group

  // Load thumb photos for group members
  useEffect(() => {
    if (!isOpen || mode !== 'group' || !groupData?.group) return

    const groupId = (groupData.group as any).id

    // Check cache first
    if (groupPhotosCache.has(groupId)) {
      setPhotoMap(groupPhotosCache.get(groupId)!)
      return
    }

    const members = (groupData.group as any).members || []
    const userIds = members
      .map((m: any) => m.user.id)
      .filter((id: string) => id !== groupData.currentUserMember?.user.id)

    if (userIds.length > 0) {
      getGroupMemberPhotos(userIds).then((photos) => {
        setPhotoMap(photos)
        groupPhotosCache.set(groupId, photos)
      })
    }
  }, [isOpen, mode, groupData])

  // Load global connections from UserUser relationships
  useEffect(() => {
    if (!isOpen || mode !== 'global') return

    // Use cache if available
    if (globalConnectionsCache.length > 0) {
      setGlobalConnections(globalConnectionsCache)
      return
    }

    setIsLoading(true)
    getUserConnections().then((connections) => {
      const userIds = connections.map((c) => c.id)

      // Load photos for connections
      if (userIds.length > 0) {
        getGroupMemberPhotos(userIds).then(setPhotoMap)
      }

      // Set and cache connections
      setGlobalConnections(connections)
      globalConnectionsCache.push(...connections)
      setIsLoading(false)
    })
  }, [isOpen, mode])

  if (!isOpen) return null

  // Get real group members or global connections
  const groupMembers: Participant[] =
    mode === 'group' && groupData?.group && (groupData.group as any).members
      ? (groupData.group as any).members
          .map((member: any) => ({
            id: member.user.id,
            name: member.user.name || 'Unknown User',
            avatar: photoMap.get(member.user.id) || undefined,
          }))
          .filter((p: any) => p.id !== groupData.currentUserMember?.user.id) // Exclude current user
      : []

  // Map global connections to include avatars
  const globalConnectionsWithAvatars: Participant[] = globalConnections.map(
    (conn) => ({
      ...conn,
      avatar: photoMap.get(conn.id) || undefined,
    }),
  )

  const participants =
    mode === 'group' ? groupMembers : globalConnectionsWithAvatars
  const filteredParticipants = participants.filter((p: Participant) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const toggleParticipant = (participantId: string) => {
    setSelectedParticipants((prev) => {
      const isSelected = prev.includes(participantId)

      if (isSelected) {
        // Deselecting - always allowed
        return prev.filter((id) => id !== participantId)
      } else {
        // Selecting - check limits
        const maxRecipients =
          mode === 'global' ? MAX_GLOBAL_RECIPIENTS : MAX_GROUP_RECIPIENTS
        if (prev.length >= maxRecipients) {
          // Show error or just prevent selection
          return prev
        }
        return [...prev, participantId]
      }
    })
  }

  const handleSelectAll = () => {
    const maxRecipients =
      mode === 'global' ? MAX_GLOBAL_RECIPIENTS : MAX_GROUP_RECIPIENTS
    const participantIds = filteredParticipants.map((p) => p.id)

    if (participantIds.length <= maxRecipients) {
      // Select all if within limit
      setSelectedParticipants(participantIds)
    } else {
      // Select first N up to limit
      setSelectedParticipants(participantIds.slice(0, maxRecipients))
    }
  }

  const handleDeselectAll = () => {
    setSelectedParticipants([])
  }

  const handleStartChat = () => {
    if (selectedParticipants.length > 0) {
      onStartChat(selectedParticipants)
      setSelectedParticipants([])
      setSearchQuery('')
      onClose()
    }
  }

  const title =
    mode === 'group'
      ? `New message in ${group?.name || 'Group'}`
      : 'New global message'

  const maxRecipients =
    mode === 'global' ? MAX_GLOBAL_RECIPIENTS : MAX_GROUP_RECIPIENTS
  const isAtLimit = selectedParticipants.length >= maxRecipients
  const connectionCount = participants.length
  const wouldExceedLimit = filteredParticipants.length > maxRecipients
  const subtitle =
    mode === 'group'
      ? `${connectionCount} other group member${
          connectionCount !== 1 ? 's' : ''
        }`
      : `${connectionCount} direct connection${
          connectionCount !== 1 ? 's' : ''
        }`

  if (!isOpen) return null

  return (
    <div className="absolute inset-0 bg-gray-900 flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div>
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <p className="text-sm text-gray-400">{subtitle}</p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-400 hover:text-white"
        >
          <X size={24} />
        </button>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-gray-700">
        <div className="relative mb-3">
          <Search
            size={20}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search people..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <div className="flex gap-2">
            <button
              onClick={handleSelectAll}
              disabled={
                filteredParticipants.length === 0 ||
                selectedParticipants.length === filteredParticipants.length ||
                isAtLimit
              }
              className="flex-1 px-3 py-1.5 text-sm border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {wouldExceedLimit
                ? `Select up to ${maxRecipients}`
                : 'Select All'}
            </button>
            <button
              onClick={handleDeselectAll}
              disabled={selectedParticipants.length === 0}
              className="flex-1 px-3 py-1.5 text-sm border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Deselect All
            </button>
          </div>
        </div>
      </div>

      {/* Participant List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <p>Loading connections...</p>
          </div>
        ) : filteredParticipants.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <p>No people found</p>
            {searchQuery && (
              <p className="text-sm">Try adjusting your search</p>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200 divide-gray-700">
            {filteredParticipants.map((participant) => {
              const isSelected = selectedParticipants.includes(participant.id)
              const isDisabled = !isSelected && isAtLimit

              return (
                <button
                  key={participant.id}
                  onClick={() => toggleParticipant(participant.id)}
                  disabled={isDisabled}
                  className={`w-full p-4 text-left transition-colors ${
                    isDisabled
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="relative flex-shrink-0">
                        <Image
                          src={
                            participant.avatar || '/images/default-avatar.png'
                          }
                          alt={participant.name}
                          width={40}
                          height={40}
                          className="w-10 h-10 rounded-full object-cover"
                          quality={95}
                          unoptimized={false}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white truncate">
                          {participant.name}
                        </p>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <Check size={16} className="text-white" />
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm text-gray-400">
              {selectedParticipants.length} selected
              {isAtLimit && (
                <span className="ml-2 text-amber-400">
                  (max {maxRecipients})
                </span>
              )}
            </p>
          </div>
          <button
            onClick={handleStartChat}
            disabled={selectedParticipants.length === 0}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-600 disabled:hover:bg-gray-300 transition-colors"
          >
            Start Chat
          </button>
        </div>
      </div>
    </div>
  )
}
