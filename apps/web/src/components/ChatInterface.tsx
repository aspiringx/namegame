'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { X, Send, ArrowLeft, Smile } from 'lucide-react'
import Image from 'next/image'
import { useSocket } from '@/context/SocketContext'
import { useSession } from 'next-auth/react'

interface ChatInterfaceProps {
  isOpen: boolean
  onClose: () => void
  onBack: () => void
  conversationId?: string
  participants: string[]
  conversationName: string
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
  onClose,
  onBack,
  conversationId,
  participants,
  conversationName
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [hasMoreMessages, setHasMoreMessages] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [revealedTimestamps, setRevealedTimestamps] = useState<Set<string>>(new Set())
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const { socket, isConnected, sendMessage, joinConversation, leaveConversation } = useSocket()
  const { data: session } = useSession()
  const currentUserId = session?.user?.id

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
      // Convert socket message to our ChatMessage format
      const chatMessage: ChatMessage = {
        id: message.id,
        content: message.content,
        authorId: message.author?.id || message.authorId,
        authorName: message.author?.name || 'Unknown User',
        timestamp: new Date(message.createdAt),
        type: message.type || 'text'
      }
      
      setMessages(prev => [...prev, chatMessage])
    }

    socket.on('message', handleNewMessage)

    return () => {
      socket.off('message', handleNewMessage)
    }
  }, [socket])

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

  return (
    <div className="fixed inset-0 z-[60] bg-white dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {conversationName}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {participants.length} participant{participants.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
          >
            <X size={24} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
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
              
              // Show timestamp if:
              // 1. First message of the day
              // 2. Different author than previous
              // 3. More than 5 minutes since last message
              const prevMessage = dayMessages[index - 1]
              const timeDiff = prevMessage 
                ? (message.timestamp.getTime() - prevMessage.timestamp.getTime()) / 1000 / 60
                : Infinity
              const showTimestamp = index === 0 || 
                                   message.authorId !== prevMessage?.authorId || 
                                   timeDiff > 5
              
              const isTimestampRevealed = revealedTimestamps.has(message.id)
              const shouldShowTime = showTimestamp || isTimestampRevealed

              return (
                <div
                  key={message.id}
                  data-message-id={message.id}
                  className={`flex gap-3 mb-2 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isCurrentUser && (
                    <div className="w-8 h-8 flex-shrink-0">
                      {showAvatar && (
                        message.authorPhoto ? (
                          <Image
                            src={message.authorPhoto}
                            alt={message.authorName}
                            width={32}
                            height={32}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
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
                    
                    <div
                      onClick={() => {
                        setRevealedTimestamps(prev => {
                          const next = new Set(prev)
                          if (next.has(message.id)) {
                            next.delete(message.id)
                          } else {
                            next.add(message.id)
                          }
                          return next
                        })
                      }}
                      className={`px-4 py-2 rounded-2xl cursor-pointer ${
                        isCurrentUser
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                      }`}
                    >
                      {message.type === 'text' ? (
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
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
                    {shouldShowTime && (
                      <span className="text-xs text-gray-400 mt-1 px-3">
                        {formatTime(message.timestamp)}
                      </span>
                    )}
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
          <button className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white mb-2">
            <Smile size={24} />
          </button>
          
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
