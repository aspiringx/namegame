'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Users, User, MessageCircle } from 'lucide-react'
import { useGroup } from '@/components/GroupProvider'
import Drawer from './Drawer'
import ParticipantSelector from './ParticipantSelector'
import ChatInterface from './ChatInterface'
import {
  markConversationAsRead,
  markAllConversationsAsRead,
} from '@/app/actions/chat'
import { useSocket } from '@/context/SocketContext'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'

interface ChatDrawerProps {
  isOpen: boolean
  onClose: () => void
}

interface Conversation {
  id: string
  name: string
  lastMessage: string
  timestamp: string
  hasUnread: boolean
  isGroup: boolean
  participants: Array<{ id: string; name: string }>
}

// Helper function to format participant names with truncation
function formatParticipantNames(
  names: string[],
  maxNames: number = 15,
): string {
  if (names.length <= maxNames) {
    return names.join(', ')
  }

  const displayedNames = names.slice(0, maxNames).join(', ')
  const remainingCount = names.length - maxNames
  return `${displayedNames}... and ${remainingCount} more`
}

export default function ChatDrawer({ isOpen, onClose }: ChatDrawerProps) {
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
  const { socket } = useSocket()
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const updateQueueRef = useRef<Set<string>>(new Set())
  const updateTimerRef = useRef<NodeJS.Timeout | null>(null)
  const hasProcessedURLRef = useRef(false)

  const loadConversations = useCallback(async (cursor?: string) => {
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
        const newConversations = convos.map((c: any) => {
          const participantNames = c.participants.map((p: any) => p.name)
          return {
            id: c.id,
            name: c.name || formatParticipantNames(participantNames),
            lastMessage: '', // TODO: Get last message
            timestamp: c.lastMessageAt
              ? new Date(c.lastMessageAt).toLocaleString()
              : '',
            hasUnread: c.hasUnread || false,
            isGroup: c.participants.length > 2,
            participants: c.participants || [],
          }
        })

        if (isInitialLoad) {
          setConversations(newConversations)
        } else {
          // Append to end
          setConversations((prev) => [...prev, ...newConversations])
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
  }, [])

  // Batch update conversations - fetches multiple conversations at once
  const batchUpdateConversations = useCallback(
    async (conversationIds: string[]) => {
      if (conversationIds.length === 0) return

      try {
        // Fetch updated conversation data for specific IDs
        const response = await fetch(
          '/api/chat/conversations?' +
            new URLSearchParams({
              ids: conversationIds.join(','),
            }),
        )

        if (response.ok) {
          const { conversations: updatedConvos } = await response.json()

          // Update local state with fresh data
          setConversations((prev) => {
            const updated = [...prev]
            updatedConvos.forEach((newConvo: any) => {
              const index = updated.findIndex((c) => c.id === newConvo.id)
              if (index !== -1) {
                const participantNames = newConvo.participants.map(
                  (p: any) => p.name,
                )
                updated[index] = {
                  id: newConvo.id,
                  name:
                    newConvo.name || formatParticipantNames(participantNames),
                  lastMessage: '',
                  timestamp: newConvo.lastMessageAt
                    ? new Date(newConvo.lastMessageAt).toLocaleString()
                    : '',
                  hasUnread: newConvo.hasUnread || false,
                  isGroup: newConvo.participants.length > 2,
                  participants: newConvo.participants || [],
                }
              }
            })
            return updated
          })
        }
      } catch (error) {
        console.error('[ChatDrawer] Error batch updating conversations:', error)
      }
    },
    [],
  )

  // Load conversations when modal opens
  useEffect(() => {
    if (isOpen) {
      loadConversations()
    }
  }, [isOpen, loadConversations])

  // Refresh conversations when returning from chat interface to drawer
  useEffect(() => {
    if (isOpen && !showChatInterface && !showParticipantSelector) {
      // Refresh to get latest unread status
      loadConversations()
    }
  }, [isOpen, showChatInterface, showParticipantSelector, loadConversations])

  // Listen for new messages via socket and queue updates with debouncing
  useEffect(() => {
    if (!socket || !isOpen || !session?.user) return

    const handleNewMessage = (message: any) => {
      const conversationId = message.conversationId
      if (!conversationId) return

      // Only queue update if message is from someone else
      // (sender's own messages shouldn't trigger unread indicators)
      const authorId = message.author?.id || message.authorId
      if (authorId === session.user?.id) {
        return
      }

      // Add to update queue
      updateQueueRef.current.add(conversationId)

      // Clear existing timer
      if (updateTimerRef.current) {
        clearTimeout(updateTimerRef.current)
      }

      // Set new timer to batch update after 5 seconds
      updateTimerRef.current = setTimeout(() => {
        const idsToUpdate = Array.from(updateQueueRef.current)
        batchUpdateConversations(idsToUpdate)
        updateQueueRef.current.clear()
        updateTimerRef.current = null
      }, 5000)
    }

    const handleReaction = (data: any) => {
      // Only update when someone ADDS a reaction to YOUR message
      // Check: action is 'add', message author is you, and reactor is not you
      if (
        data.action !== 'add' ||
        data.messageAuthorId !== session.user?.id ||
        data.userId === session.user?.id
      ) {
        return
      }

      const { conversationId } = data

      // Add to update queue
      updateQueueRef.current.add(conversationId)

      // Clear existing timer
      if (updateTimerRef.current) {
        clearTimeout(updateTimerRef.current)
      }

      // Set new timer to batch update after 5 seconds
      updateTimerRef.current = setTimeout(() => {
        const idsToUpdate = Array.from(updateQueueRef.current)
        batchUpdateConversations(idsToUpdate)
        updateQueueRef.current.clear()
        updateTimerRef.current = null
      }, 5000)
    }

    socket.on('message', handleNewMessage)
    socket.on('reaction', handleReaction)

    return () => {
      socket.off('message', handleNewMessage)
      socket.off('reaction', handleReaction)
      if (updateTimerRef.current) {
        clearTimeout(updateTimerRef.current)
      }
    }
  }, [socket, isOpen, session?.user, batchUpdateConversations])

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

  const loadMoreConversations = useCallback(() => {
    if (!hasMoreConversations || isLoadingMore || conversations.length === 0)
      return

    // Use the last conversation ID as cursor
    const lastConversation = conversations[conversations.length - 1]
    loadConversations(lastConversation.id)
  }, [hasMoreConversations, isLoadingMore, conversations, loadConversations])

  // Detect scroll to bottom for loading more conversations
  useEffect(() => {
    const container = conversationsListRef.current
    if (!container) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      // Load more when within 100px of bottom
      if (
        scrollHeight - scrollTop - clientHeight < 100 &&
        hasMoreConversations &&
        !isLoadingMore
      ) {
        loadMoreConversations()
      }
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [
    hasMoreConversations,
    isLoadingMore,
    conversations,
    loadMoreConversations,
  ])

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
          name: null, // Let API generate name from participants
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create conversation')
      }

      const { conversation } = await response.json()

      // Use saved name if available, otherwise generate from participants
      const participantNames = conversation.participants.map((p: any) => p.name)
      const displayName =
        conversation.name || formatParticipantNames(participantNames)

      setCurrentConversation({
        id: conversation.id,
        participants: conversation.participants.map((p: any) => p.id),
        name: displayName,
      })

      // Show chat interface and hide selector
      setShowParticipantSelector(false)
      setShowChatInterface(true)
    } catch (error) {
      console.error('[ChatModal] Error creating conversation:', error)
      // TODO: Show error message to user
    }
  }

  const handleOpenConversation = useCallback(
    async (conversation: Conversation) => {
      setCurrentConversation({
        id: conversation.id,
        participants: conversation.participants.map((p) => p.id),
        name: conversation.name,
      })
      setShowChatInterface(true)

      // Update URL with conversation ID
      const params = new URLSearchParams(window.location.search)
      params.set('chat', conversation.id)
      router.replace(`?${params.toString()}`, { scroll: false })

      // Mark as read when opening
      if (conversation.id) {
        await markConversationAsRead(conversation.id)
        // Update local state
        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === conversation.id ? { ...conv, hasUnread: false } : conv,
          ),
        )
        // Notify other components (like ChatIcon) that read status changed
        const channel = new BroadcastChannel('chat_read_updates')
        channel.postMessage({
          type: 'conversation_read',
          conversationId: conversation.id,
        })
        channel.close()
      }
    },
    [router],
  )

  const handleNameUpdate = (newName: string) => {
    if (currentConversation) {
      setCurrentConversation({
        ...currentConversation,
        name: newName,
      })

      // Update in conversations list
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === currentConversation.id
            ? { ...conv, name: newName }
            : conv,
        ),
      )
    }
  }

  const handleBackToConversations = () => {
    setShowChatInterface(false)
    setCurrentConversation(null)

    // Update URL to show conversations list
    const params = new URLSearchParams(window.location.search)
    params.set('chat', 'open')
    params.delete('msg')
    router.replace(`?${params.toString()}`, { scroll: false })
  }

  const handleMarkAllAsRead = async () => {
    await markAllConversationsAsRead()
    // Update all conversations to mark as read
    setConversations((prev) =>
      prev.map((conv) => ({ ...conv, hasUnread: false })),
    )
    // Notify other components (like ChatIcon) that all conversations are read
    const channel = new BroadcastChannel('chat_read_updates')
    channel.postMessage({ type: 'all_read' })
    channel.close()
  }
  // Handle opening conversation from URL param
  useEffect(() => {
    if (!isOpen || hasProcessedURLRef.current || conversations.length === 0)
      return

    const chatParam = searchParams.get('chat')
    if (chatParam && chatParam !== 'open') {
      // Try to find and open the conversation
      const conversation = conversations.find((c) => c.id === chatParam)
      if (conversation) {
        hasProcessedURLRef.current = true
        handleOpenConversation(conversation)
      }
    }
  }, [isOpen, conversations, searchParams, handleOpenConversation])

  useEffect(() => {
    if (!isOpen) {
      setShowChatInterface(false)
      setShowParticipantSelector(false)
      setCurrentConversation(null)
      hasProcessedURLRef.current = false
    }
  }, [isOpen])

  return (
    <>
      <Drawer
        isOpen={isOpen}
        onClose={onClose}
        title={showChatInterface ? undefined : 'Messages'}
        width="md"
      >
        {/* New Message Buttons */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 space-y-2">
          {group && (
            <button
              onClick={handleNewGroupMessage}
              className="w-full flex items-center gap-3 p-3 text-left bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
            >
              <Users size={20} className="text-blue-600 dark:text-blue-400" />
              <span className="text-blue-600 dark:text-blue-400 font-medium">
                New chat in {group.name}
              </span>
            </button>
          )}
          <button
            onClick={handleNewGlobalMessage}
            className="w-full flex items-center gap-3 p-3 text-left bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            <User size={20} className="text-gray-600 dark:text-gray-400" />
            <span className="text-gray-600 dark:text-gray-400 font-medium">
              New direct chat
            </span>
          </button>

          {/* Mark all as read button - only show if there are unread conversations */}
          {conversations.some((c) => c.hasUnread) && (
            <button
              onClick={handleMarkAllAsRead}
              className="w-full flex items-center justify-center gap-2 p-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Mark all as read
            </button>
          )}
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
                  onClick={() => handleOpenConversation(conversation)}
                  className="w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {conversation.isGroup ? (
                      <Users
                        size={16}
                        className="text-gray-400 flex-shrink-0"
                      />
                    ) : (
                      <User size={16} className="text-gray-400 flex-shrink-0" />
                    )}
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {conversation.name}
                    </p>
                    {conversation.hasUnread && (
                      <span className="ml-auto flex-shrink-0 w-2 h-2 bg-green-500 rounded-full" />
                    )}
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

        {/* Participant Selector - inside drawer */}
        <ParticipantSelector
          isOpen={showParticipantSelector}
          onClose={() => setShowParticipantSelector(false)}
          onStartChat={handleStartChat}
          mode={selectorMode}
        />

        {/* Chat Interface - inside drawer */}
        {currentConversation && (
          <ChatInterface
            isOpen={showChatInterface}
            onBack={handleBackToConversations}
            onClose={onClose}
            conversationId={currentConversation.id}
            participants={currentConversation.participants}
            conversationName={currentConversation.name}
            onNameUpdate={handleNameUpdate}
          />
        )}
      </Drawer>
    </>
  )
}
