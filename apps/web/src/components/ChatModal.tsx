'use client'

import { useState } from 'react'
import { X, Users, User, MessageCircle } from 'lucide-react'
import { useGroup } from '@/components/GroupProvider'
import ParticipantSelector from './ParticipantSelector'

interface ChatModalProps {
  isOpen: boolean
  onClose: () => void
}

interface Conversation {
  id: string
  name: string
  lastMessage: string
  timestamp: string
  unreadCount: number
  isGroup: boolean
}

// Mock data for development
const mockConversations: Conversation[] = [
  {
    id: '1',
    name: 'John Smith',
    lastMessage: 'Hey, are you coming to the BBQ?',
    timestamp: '2m ago',
    unreadCount: 2,
    isGroup: false
  },
  {
    id: '2', 
    name: 'Sarah, Mike, Lisa',
    lastMessage: 'Perfect! See you there',
    timestamp: '1h ago',
    unreadCount: 0,
    isGroup: true
  }
]

export default function ChatModal({ isOpen, onClose }: ChatModalProps) {
  const [conversations] = useState<Conversation[]>(mockConversations)
  const [showParticipantSelector, setShowParticipantSelector] = useState(false)
  const [selectorMode, setSelectorMode] = useState<'group' | 'global'>('group')
  const groupData = useGroup()
  const group = groupData?.group

  const handleNewGroupMessage = () => {
    setSelectorMode('group')
    setShowParticipantSelector(true)
  }

  const handleNewGlobalMessage = () => {
    setSelectorMode('global')
    setShowParticipantSelector(true)
  }

  const handleStartChat = (participants: string[]) => {
    // TODO: Create new conversation and open chat interface
    console.log('Starting chat with participants:', participants, 'mode:', selectorMode)
    setShowParticipantSelector(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md h-[600px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Messages</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        {/* New Message Buttons */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 space-y-2">
          {group && (
            <button 
              onClick={handleNewGroupMessage}
              className="w-full flex items-center gap-3 p-3 text-left bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
            >
              <Users size={20} className="text-blue-600 dark:text-blue-400" />
              <span className="text-blue-600 dark:text-blue-400 font-medium">
                New in {group.name}
              </span>
            </button>
          )}
          <button 
            onClick={handleNewGlobalMessage}
            className="w-full flex items-center gap-3 p-3 text-left bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            <User size={20} className="text-gray-600 dark:text-gray-400" />
            <span className="text-gray-600 dark:text-gray-400 font-medium">
              New Global Message
            </span>
          </button>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
              <MessageCircle size={48} className="mb-4 opacity-50" />
              <p>No conversations yet</p>
              <p className="text-sm">Start a new message to get chatting!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  className="w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {conversation.isGroup ? (
                          <Users size={16} className="text-gray-400 flex-shrink-0" />
                        ) : (
                          <User size={16} className="text-gray-400 flex-shrink-0" />
                        )}
                        <p className="font-medium text-gray-900 dark:text-white truncate">
                          {conversation.name}
                        </p>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-1">
                        {conversation.lastMessage}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 ml-2">
                      <span className="text-xs text-gray-400">
                        {conversation.timestamp}
                      </span>
                      {conversation.unreadCount > 0 && (
                        <span className="bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Participant Selector */}
      <ParticipantSelector
        isOpen={showParticipantSelector}
        onClose={() => setShowParticipantSelector(false)}
        onStartChat={handleStartChat}
        mode={selectorMode}
      />
    </div>
  )
}
