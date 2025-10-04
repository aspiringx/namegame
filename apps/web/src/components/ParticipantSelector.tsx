'use client'

import { useState, useEffect } from 'react'
import { X, Search, Check } from 'lucide-react'
import Image from 'next/image'
import { useGroup } from '@/components/GroupProvider'
import { getGroupMemberPhotos } from '@/app/actions/chat'

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

// Mock data for global connections (TODO: load from UserUser relationships)
const mockGlobalConnections: Participant[] = [
  { id: '5', name: 'David Chen' },
  { id: '6', name: 'Emma Davis' },
  { id: '7', name: 'Alex Rodriguez' },
]

export default function ParticipantSelector({ 
  isOpen, 
  onClose, 
  onStartChat, 
  mode 
}: ParticipantSelectorProps) {
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [photoMap, setPhotoMap] = useState<Map<string, string>>(new Map())
  const groupData = useGroup()
  const group = groupData?.group

  // Load thumb photos for group members
  useEffect(() => {
    if (!isOpen || mode !== 'group' || !groupData?.group) return
    
    const members = (groupData.group as any).members || []
    const userIds = members
      .map((m: any) => m.user.id)
      .filter((id: string) => id !== groupData.currentUserMember?.user.id)
    
    if (userIds.length > 0) {
      getGroupMemberPhotos(userIds).then(setPhotoMap)
    }
  }, [isOpen, mode, groupData])

  if (!isOpen) return null

  // Get real group members or use mock global connections
  const groupMembers: Participant[] = mode === 'group' && groupData?.group && (groupData.group as any).members 
    ? (groupData.group as any).members
        .map((member: any) => ({
          id: member.user.id,
          name: member.user.name || 'Unknown User',
          avatar: photoMap.get(member.user.id) || undefined
        }))
        .filter((p: any) => p.id !== groupData.currentUserMember?.user.id) // Exclude current user
    : []

  const participants = mode === 'group' ? groupMembers : mockGlobalConnections
  const filteredParticipants = participants.filter((p: Participant) => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const toggleParticipant = (participantId: string) => {
    setSelectedParticipants(prev => 
      prev.includes(participantId)
        ? prev.filter(id => id !== participantId)
        : [...prev, participantId]
    )
  }

  const handleStartChat = () => {
    if (selectedParticipants.length > 0) {
      onStartChat(selectedParticipants)
      setSelectedParticipants([])
      setSearchQuery('')
      onClose()
    }
  }

  const title = mode === 'group' 
    ? `New message in ${group?.name || 'Group'}`
    : 'New global message'

  const subtitle = mode === 'group'
    ? 'Choose group members to message'
    : 'Choose from your connections'

  if (!isOpen) return null
  
  return (
    <div className="absolute inset-0 bg-white dark:bg-gray-900 flex flex-col z-50">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search people..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Participant List */}
        <div className="flex-1 overflow-y-auto">
          {filteredParticipants.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
              <p>No people found</p>
              {searchQuery && (
                <p className="text-sm">Try adjusting your search</p>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredParticipants.map((participant) => (
                <button
                  key={participant.id}
                  onClick={() => toggleParticipant(participant.id)}
                  className="w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        {participant.avatar ? (
                          <Image
                            src={participant.avatar}
                            alt={participant.name}
                            width={80}
                            height={80}
                            className="w-10 h-10 rounded-full object-cover"
                            quality={95}
                            unoptimized={false}
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {participant.name.split(' ').map((n: string) => n[0]).join('')}
                            </span>
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {participant.name}
                        </p>
                      </div>
                    </div>
                    {selectedParticipants.includes(participant.id) && (
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <Check size={16} className="text-white" />
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {selectedParticipants.length} selected
            </p>
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
