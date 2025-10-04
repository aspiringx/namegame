'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Send, ArrowLeft, Smile } from 'lucide-react'
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
  timestamp: Date
  type: 'text' | 'system'
}

// Mock messages for development
const mockMessages: ChatMessage[] = [
  {
    id: '1',
    content: 'Hey everyone! Are you coming to the BBQ this weekend?',
    authorId: 'user1',
    authorName: 'John Smith',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    type: 'text'
  },
  {
    id: '2',
    content: 'Yes! What should I bring?',
    authorId: 'user2',
    authorName: 'Sarah Johnson',
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
    type: 'text'
  },
  {
    id: '3',
    content: 'Maybe some drinks? I\'ve got the burgers covered.',
    authorId: 'user1',
    authorName: 'John Smith',
    timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    type: 'text'
  },
  {
    id: '4',
    content: 'Perfect! See you at 2pm',
    authorId: 'current',
    authorName: 'You',
    timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
    type: 'text'
  }
]

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
  const [newMessage, setNewMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const { socket, isConnected, sendMessage, joinConversation, leaveConversation } = useSocket()
  const { data: session } = useSession()
  const currentUserId = session?.user?.id

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
    }
  }, [isOpen])

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
  }, [isOpen, conversationId, isConnected, joinConversation, leaveConversation])

  const loadMessages = async () => {
    if (!conversationId) return
    
    setIsLoadingMessages(true)
    try {
      const response = await fetch(`/api/chat/messages/${conversationId}`)
      if (response.ok) {
        const { messages: msgs } = await response.json()
        setMessages(msgs.map((m: any) => ({
          id: m.id,
          content: m.content,
          authorId: m.authorId,
          authorName: m.authorName,
          timestamp: new Date(m.timestamp),
          type: m.type
        })))
      }
    } catch (error) {
      console.error('[ChatInterface] Error loading messages:', error)
    } finally {
      setIsLoadingMessages(false)
    }
  }

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
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
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

              return (
                <div
                  key={message.id}
                  className={`flex gap-3 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isCurrentUser && (
                    <div className="w-8 h-8 flex-shrink-0">
                      {showAvatar && (
                        <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                            {message.authorName.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
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
                      className={`px-4 py-2 rounded-2xl ${
                        isCurrentUser
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                    
                    <span className="text-xs text-gray-400 mt-1 px-3">
                      {formatTime(message.timestamp)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        ))}
        
        {!isLoadingMessages && isTyping && (
          <div className="flex gap-3">
            <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">•••</span>
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-2xl">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        
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
