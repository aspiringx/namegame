'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { X, Users, User, MessageCircle } from 'lucide-react'
import { useGroup } from '@/components/GroupProvider'
import ParticipantSelector from './ParticipantSelector'
import ChatInterface from './ChatInterface'

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

export default function ChatModal({ isOpen, onClose }: ChatModalProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoadingConversations, setIsLoadingConversations] = useState(false)
  const [hasMoreConversations, setHasMoreConversations] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [showParticipantSelector, setShowParticipantSelector] = useState(false)
  const [showChatInterface, setShowChatInterface] = useState(false)
  const [selectorMode, setSelectorMode] = useState<'group' | 'global'>('group')
  const [currentConversation, setCurrentConversation] = useState<{
    id?: string
    participants: string[]
    name: string
  } | null>(null)
  const groupData = useGroup()
  const group = groupData?.group
  const conversationsListRef = useRef<HTMLDivElement>(null)

  // Load conversations when modal opens
  useEffect(() => {
    if (isOpen) {
      loadConversations()
    }
  }, [isOpen])
  
  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const loadConversations = async (cursor?: string) => {
    const isInitialLoad = !cursor
    if (isInitialLoad) {
      setIsLoadingConversations(true)
    } else {
      setIsLoadingMore(true)
    }
    
    try {
      const url = cursor 
        ? `/api/chat/conversations?cursor=${cursor}`
        : '/api/chat/conversations'
      
      const response = await fetch(url)
      if (response.ok) {
        const { conversations: convos, hasMore } = await response.json()
        const newConversations = convos.map((c: any) => ({
          id: c.id,
          name: c.name || c.participants.map((p: any) => p.name).join(', '),
          lastMessage: '', // TODO: Get last message
          timestamp: c.lastMessageAt ? new Date(c.lastMessageAt).toLocaleString() : '',
          unreadCount: 0, // TODO: Calculate unread
          isGroup: c.participants.length > 2
        }))
        
        if (isInitialLoad) {
          setConversations(newConversations)
        } else {
          // Append to end
          setConversations(prev => [...prev, ...newConversations])
        }
        
        setHasMoreConversations(hasMore)
      }
    } catch (error) {
      console.error('[ChatModal] Error loading conversations:', error)
    } finally {
      if (isInitialLoad) {
        setIsLoadingConversations(false)
      } else {
        setIsLoadingMore(false)
      }
    }
  }
  
  const loadMoreConversations = useCallback(() => {
    if (!hasMoreConversations || isLoadingMore || conversations.length === 0) return
    
    // Use the last conversation ID as cursor
    const lastConversation = conversations[conversations.length - 1]
    loadConversations(lastConversation.id)
  }, [hasMoreConversations, isLoadingMore, conversations])
  
  // Detect scroll to bottom for loading more conversations
  useEffect(() => {
    const container = conversationsListRef.current
    if (!container) return
    
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      // Load more when within 100px of bottom
      if (scrollHeight - scrollTop - clientHeight < 100 && hasMoreConversations && !isLoadingMore) {
        loadMoreConversations()
      }
    }
    
    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [hasMoreConversations, isLoadingMore, conversations, loadMoreConversations])

  const handleNewGroupMessage = () => {
    setSelectorMode('group')
    setShowParticipantSelector(true)
  }

  const handleNewGlobalMessage = () => {
    setSelectorMode('global')
    setShowParticipantSelector(true)
  }

  const handleStartChat = async (participantIds: string[]) => {
    try {
      // Create conversation in database (name will be generated from participants)
      const response = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantIds,
          type: 'direct',
          groupId: selectorMode === 'group' ? group?.id : null,
          name: null // Let API generate name from participants
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create conversation')
      }

      const { conversation } = await response.json()
      
      // Use participant names for display (shows all participants)
      const displayName = conversation.participants
        .map((p: any) => p.name)
        .join(', ')
      
      setCurrentConversation({
        id: conversation.id,
        participants: participantIds,
        name: displayName
      })
      
      // Show chat interface and hide selector
      setShowParticipantSelector(false)
      setShowChatInterface(true)
    } catch (error) {
      console.error('[ChatModal] Error creating conversation:', error)
      // TODO: Show error message to user
    }
  }

  const handleOpenExistingChat = (conversation: Conversation) => {
    setCurrentConversation({
      id: conversation.id,
      participants: [conversation.name], // Mock - would be actual participant IDs
      name: conversation.name
    })
    setShowChatInterface(true)
  }

  const handleBackToConversations = () => {
    setShowChatInterface(false)
    setCurrentConversation(null)
  }

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setShowChatInterface(false)
      setShowParticipantSelector(false)
      setCurrentConversation(null)
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
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
        <div ref={conversationsListRef} className="flex-1 overflow-y-auto">
          {isLoadingConversations ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
              <p>Loading conversations...</p>
            </div>
          ) : conversations.length === 0 ? (
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
                  onClick={() => handleOpenExistingChat(conversation)}
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
              
              {/* Loading more indicator */}
              {isLoadingMore && (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                </div>
              )}
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

      {/* Chat Interface */}
      {currentConversation && (
        <ChatInterface
          isOpen={showChatInterface}
          onClose={onClose}
          onBack={handleBackToConversations}
          conversationId={currentConversation.id}
          participants={currentConversation.participants}
          conversationName={currentConversation.name}
        />
      )}
    </div>
  )
}
