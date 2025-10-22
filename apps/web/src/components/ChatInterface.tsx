'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, ArrowLeft, Pencil, Check, X } from 'lucide-react'
import Image from 'next/image'
import { useSocket } from '@/context/SocketContext'
import { useSession } from 'next-auth/react'
import { updateConversationName, markConversationAsRead } from '@/app/actions/chat'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface ChatInterfaceProps {
  isOpen: boolean
  onBack: () => void
  conversationId?: string
  participants: string[]
  conversationName: string
  onNameUpdate?: (newName: string) => void
}

interface ChatMessage {
  id: string
  content: string
  authorId: string
  authorName: string
  authorPhoto?: string | null
  timestamp: Date
  type: 'text' | 'system'
}

export default function ChatInterface({
  isOpen,
  onBack,
  conversationId,
  participants,
  conversationName,
  onNameUpdate
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [hasMoreMessages, setHasMoreMessages] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [showAllTimestamps, setShowAllTimestamps] = useState(false)
  const [authorPhotos, setAuthorPhotos] = useState<Map<string, string | null>>(new Map())
  const [isEditingName, setIsEditingName] = useState(false)
  const [editedName, setEditedName] = useState(conversationName)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)
  const { socket, isConnected, sendMessage, joinConversation, leaveConversation } = useSocket()
  const { data: session } = useSession()
  const currentUserId = session?.user?.id
  
  // Participant count (API already includes current user)
  const participantCount = participants.length
  const shouldTruncateName = conversationName.length > 30
  const [showParticipantList, setShowParticipantList] = useState(false)

  // Handle name save
  const handleSaveName = async () => {
    if (!conversationId || !editedName.trim()) {
      setIsEditingName(false)
      setEditedName(conversationName)
      return
    }

    try {
      const result = await updateConversationName(conversationId, editedName)
      if (result.success && onNameUpdate) {
        onNameUpdate(result.name || editedName)
      }
      setIsEditingName(false)
    } catch (error) {
      console.error('Failed to update conversation name:', error)
      setEditedName(conversationName)
      setIsEditingName(false)
    }
  }

  const handleCancelEdit = () => {
    setEditedName(conversationName)
    setIsEditingName(false)
  }

  // Focus name input when editing starts
  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus()
      nameInputRef.current.select()
    }
  }, [isEditingName])

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
    }
  }, [isOpen])

  const loadMessages = useCallback(async (cursor?: string) => {
    if (!conversationId) return
    
    const isInitialLoad = !cursor
    if (isInitialLoad) {
      setIsLoadingMessages(true)
    } else {
      setIsLoadingMore(true)
    }
    
    try {
      const url = cursor 
        ? `/api/chat/messages/${conversationId}?cursor=${cursor}`
        : `/api/chat/messages/${conversationId}`
      
      const response = await fetch(url)
      if (response.ok) {
        const { messages: msgs, hasMore } = await response.json()
        // Cache author photos
        const newPhotos = new Map(authorPhotos)
        msgs.forEach((m: any) => {
          if (m.authorId && m.authorPhoto && !newPhotos.has(m.authorId)) {
            newPhotos.set(m.authorId, m.authorPhoto)
          }
        })
        setAuthorPhotos(newPhotos)
        
        const newMessages = msgs.map((m: any) => ({
          id: m.id,
          content: m.content,
          authorId: m.authorId,
          authorName: m.authorName,
          authorPhoto: m.authorPhoto,
          timestamp: new Date(m.timestamp),
          type: m.type
        }))
        
        if (isInitialLoad) {
          setMessages(newMessages)
        } else {
          // Prepend older messages, avoiding duplicates
          // Save the first visible message to maintain scroll position
          const container = messagesContainerRef.current
          const firstVisibleMessage = container?.querySelector('[data-message-id]') as HTMLElement
          const offsetBefore = firstVisibleMessage?.offsetTop || 0
          
          setMessages(prev => {
            const existingIds = new Set(prev.map((m: ChatMessage) => m.id))
            const uniqueNewMessages = newMessages.filter((m: ChatMessage) => !existingIds.has(m.id))
            return [...uniqueNewMessages, ...prev]
          })
          
          // Restore scroll position relative to the same message
          requestAnimationFrame(() => {
            if (container && firstVisibleMessage) {
              const offsetAfter = firstVisibleMessage.offsetTop
              container.scrollTop = container.scrollTop + (offsetAfter - offsetBefore)
            }
          })
        }
        
        setHasMoreMessages(hasMore)
      }
    } catch (error) {
      console.error('[ChatInterface] Error loading messages:', error)
    } finally {
      if (isInitialLoad) {
        setIsLoadingMessages(false)
      } else {
        setIsLoadingMore(false)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId])
  
  const loadMoreMessages = useCallback(() => {
    if (!hasMoreMessages || isLoadingMore || messages.length === 0) return
    
    // Use the oldest message ID as cursor
    const oldestMessage = messages[0]
    loadMessages(oldestMessage.id)
  }, [hasMoreMessages, isLoadingMore, messages, loadMessages])

  // Auto-scroll to bottom when new messages arrive (only for new messages, not initial load)
  const previousMessageCount = useRef(0)
  useEffect(() => {
    if (messages.length > 0) {
      // Only scroll if messages were added to the end (new messages)
      if (messages.length > previousMessageCount.current) {
        const isInitialLoad = previousMessageCount.current === 0
        messagesEndRef.current?.scrollIntoView({ 
          behavior: isInitialLoad ? 'auto' : 'smooth' 
        })
      }
      previousMessageCount.current = messages.length
    }
  }, [messages])
  
  // Detect scroll to top for loading more messages
  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return
    
    const handleScroll = () => {
      // Load more when within 200px of top (gives time to load before reaching top)
      if (container.scrollTop < 200 && hasMoreMessages && !isLoadingMore) {
        loadMoreMessages()
      }
    }
    
    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [hasMoreMessages, isLoadingMore, messages, loadMoreMessages])

  // Load messages and join conversation when component mounts
  useEffect(() => {
    if (isOpen && conversationId) {
      // Load existing messages
      loadMessages()
      
      // Join conversation room
      if (isConnected) {
        joinConversation(conversationId)
      }
      
      return () => {
        if (isConnected) {
          leaveConversation(conversationId)
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, conversationId, isConnected, loadMessages])

  // Listen for incoming messages
  useEffect(() => {
    if (!socket) return

    const handleNewMessage = (message: any) => {
      const authorId = message.author?.id || message.authorId
      
      // Convert socket message to our ChatMessage format
      const chatMessage: ChatMessage = {
        id: message.id,
        content: message.content,
        authorId,
        authorName: message.author?.name || 'Unknown User',
        authorPhoto: authorPhotos.get(authorId) || null,
        timestamp: new Date(message.createdAt),
        type: message.type || 'text'
      }
      
      // Add message only if it doesn't already exist (prevent duplicates)
      setMessages(prev => {
        const exists = prev.some(m => m.id === chatMessage.id)
        if (exists) {
          return prev
        }
        return [...prev, chatMessage]
      })
      
      // Auto-mark as read if message is from someone else and conversation is open
      if (conversationId && authorId !== session?.user?.id) {
        markConversationAsRead(conversationId).then(() => {
          // Notify other components that read status changed
          const channel = new BroadcastChannel('chat_read_updates')
          channel.postMessage({ type: 'conversation_read', conversationId })
          channel.close()
        })
      }
    }

    socket.on('message', handleNewMessage)

    return () => {
      socket.off('message', handleNewMessage)
    }
  }, [socket, authorPhotos, conversationId, session?.user?.id])

  if (!isOpen) return null

  const handleSendMessage = () => {
    if (!newMessage.trim() || !conversationId) return

    const messageContent = newMessage.trim()
    setNewMessage('')

    // Send via Socket.io (message will come back via socket event for display)
    if (isConnected) {
      sendMessage(conversationId, messageContent)
    } else {
      console.error('[Chat] Cannot send message: not connected to chat service')
      // Show error to user
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (date: Date) => {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }
  }

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const dateKey = message.timestamp.toDateString()
    if (!groups[dateKey]) {
      groups[dateKey] = []
    }
    groups[dateKey].push(message)
    return groups
  }, {} as Record<string, ChatMessage[]>)

  if (!isOpen) return null
  
  return (
    <div className="absolute inset-0 bg-white dark:bg-gray-900 flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <button
            onClick={onBack}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white flex-shrink-0"
          >
            <ArrowLeft size={24} />
          </button>
          <div className="min-w-0 flex-1">
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <input
                  ref={nameInputRef}
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value.slice(0, 30))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveName()
                    if (e.key === 'Escape') handleCancelEdit()
                  }}
                  maxLength={30}
                  className="flex-1 px-2 py-1 text-lg font-semibold bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white"
                  placeholder="Conversation name"
                />
                <button
                  onClick={handleSaveName}
                  className="p-1 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                >
                  <Check size={20} />
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="p-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                >
                  <X size={20} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                  {conversationName}
                </h2>
                {conversationId && (
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <Pencil size={16} />
                  </button>
                )}
              </div>
            )}
            {shouldTruncateName ? (
              <TooltipProvider>
                <Tooltip open={showParticipantList} onOpenChange={setShowParticipantList}>
                  <TooltipTrigger asChild>
                    <button 
                      className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                      onClick={() => setShowParticipantList(!showParticipantList)}
                    >
                      {participantCount} participant{participantCount > 1 ? 's' : ''}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    <p className="font-semibold mb-1">Participants:</p>
                    <p>{conversationName}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {participantCount} participant{participantCount > 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={messagesContainerRef} 
        className="flex-1 overflow-y-auto p-4 space-y-4"
        onTouchStart={(e) => {
          const container = e.currentTarget
          container.dataset.touchStartX = String(e.touches[0].clientX)
          container.dataset.touchStartY = String(e.touches[0].clientY)
        }}
        onTouchMove={(e) => {
          const container = e.currentTarget
          const startX = Number(container.dataset.touchStartX || 0)
          const startY = Number(container.dataset.touchStartY || 0)
          const deltaX = startX - e.touches[0].clientX
          const deltaY = Math.abs(startY - e.touches[0].clientY)
          
          // Swipe left to reveal all timestamps
          if (deltaX > 50 && deltaY < 30) {
            setShowAllTimestamps(true)
          }
        }}
        onTouchEnd={() => setShowAllTimestamps(false)}
        onMouseDown={() => setShowAllTimestamps(true)}
        onMouseUp={() => setShowAllTimestamps(false)}
        onMouseLeave={() => setShowAllTimestamps(false)}
      >
        {isLoadingMore && (
          <div className="flex justify-center py-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          </div>
        )}
        
        {isLoadingMessages ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
            <p>Loading messages...</p>
          </div>
        ) : Object.entries(groupedMessages).map(([dateKey, dayMessages]) => (
          <div key={dateKey}>
            {/* Date separator */}
            <div className="flex items-center justify-center my-4">
              <div className="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  {formatDate(new Date(dateKey))}
                </span>
              </div>
            </div>

            {/* Messages for this date */}
            {dayMessages.map((message, index) => {
              const isCurrentUser = message.authorId === currentUserId
              const showAvatar = !isCurrentUser && (
                index === 0 || 
                dayMessages[index - 1]?.authorId !== message.authorId
              )
              
              // Show centered timestamp if more than 5 minutes since last message
              const prevMessage = dayMessages[index - 1]
              const timeDiff = prevMessage 
                ? (message.timestamp.getTime() - prevMessage.timestamp.getTime()) / 1000 / 60
                : Infinity
              const showCenteredTimestamp = timeDiff > 5

              return (
                <div key={message.id}>
                  {/* Centered timestamp separator */}
                  {showCenteredTimestamp && (
                    <div className="flex justify-center my-3">
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {formatTime(message.timestamp)}
                      </span>
                    </div>
                  )}
                  
                  {/* Message */}
                <div
                  data-message-id={message.id}
                  className={`flex gap-3 mb-2 relative transition-transform duration-200 ${
                    isCurrentUser ? 'justify-end' : 'justify-start'
                  } ${showAllTimestamps ? '-translate-x-16' : ''}`}
                >
                  {!isCurrentUser && (
                    <div className="w-12 h-8 flex-shrink-0">
                      {showAvatar && (
                        message.authorPhoto ? (
                          <Image
                            src={message.authorPhoto}
                            alt={message.authorName}
                            width={64}
                            height={64}
                            className="w-12 h-12 rounded-full object-cover"
                            quality={95}
                            unoptimized={false}
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                              {message.authorName.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  )}

                  <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'} max-w-[70%]`}>
                    {!isCurrentUser && showAvatar && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 mb-1 px-3">
                        {message.authorName}
                      </span>
                    )}
                    
                    <div className={`px-4 py-2 rounded-2xl ${
                        isCurrentUser
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                      }`}
                    >
                      {message.type === 'text' ? (
                        <p className="text-xl whitespace-pre-wrap" style={{ WebkitTextSizeAdjust: '100%' }}>{message.content}</p>
                      ) : (
                        <Image 
                          src={message.content} 
                          alt="Message attachment" 
                          width={200} 
                          height={150} 
                          className="max-w-xs h-auto rounded-lg" 
                        />
                      )}
                    </div>
                  </div>
                  
                  {/* Timestamp - shows in the right margin when swiping */}
                  <div className={`absolute right-0 top-1/2 -translate-y-1/2 transition-all duration-200 ${
                    showAllTimestamps ? 'opacity-100 translate-x-16' : 'opacity-0 translate-x-0 pointer-events-none'
                  }`}>
                    <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                      {formatTime(message.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
              )
            })}
          </div>
        ))}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-end gap-3">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              rows={1}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              style={{ minHeight: '48px', maxHeight: '120px' }}
            />
          </div>
          
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-600 disabled:hover:bg-gray-300 transition-colors"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  )
}
