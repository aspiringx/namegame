'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, ArrowLeft, Pencil, Check, X, ImagePlus } from 'lucide-react'
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
import MessageEmojiPicker from './MessageEmojiPicker'
import { processImageFile, ProcessedImage } from '@/lib/imageUtils'

interface ChatInterfaceProps {
  isOpen: boolean
  onBack: () => void
  onClose: () => void
  conversationId?: string
  participants: string[]
  conversationName: string
  onNameUpdate?: (newName: string) => void
}

interface MessageReaction {
  emoji: string
  count: number
  userIds: string[]
  users: { id: string; name: string }[]
}

interface ChatMessage {
  id: string
  content: string
  authorId: string
  authorName: string
  authorPhoto?: string | null
  timestamp: Date
  type: 'text' | 'image' | 'mixed' | 'system'
  metadata?: {
    images?: Array<{
      base64: string
      width: number
      height: number
      size: number
    }>
    links?: Array<{
      url: string
      title?: string
      description?: string
      image?: string
      siteName?: string
    }>
  }
  reactions?: MessageReaction[]
}

export default function ChatInterface({
  isOpen,
  onBack,
  onClose,
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
  const [isSwiping, setIsSwiping] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartX, setDragStartX] = useState(0)
  const [authorPhotos, setAuthorPhotos] = useState<Map<string, string | null>>(new Map())
  const [isEditingName, setIsEditingName] = useState(false)
  const [editedName, setEditedName] = useState(conversationName)
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false)
  const [emojiPickerState, setEmojiPickerState] = useState<{
    isOpen: boolean
    messageId: string | null
    position: { x: number; y: number }
    showAbove: boolean
  }>({ isOpen: false, messageId: null, position: { x: 0, y: 0 }, showAbove: true })
  const [hasOtherUnread, setHasOtherUnread] = useState(false)
  const [pendingImages, setPendingImages] = useState<ProcessedImage[]>([])
  const [isProcessingImage, setIsProcessingImage] = useState(false)
  const [isSendingMessage, setIsSendingMessage] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const messageBubbleRefs = useRef<Map<string, HTMLDivElement>>(new Map())
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
          type: m.type,
          metadata: m.metadata,
          reactions: m.reactions || []
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
        type: message.type || 'text',
        metadata: message.metadata
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

  // Listen for reaction updates
  useEffect(() => {
    if (!socket) return

    const handleReactionUpdate = (data: {
      messageId: string
      emoji: string
      action: 'add' | 'remove'
      userId: string
      userName: string
    }) => {
      // Skip if this is our own action (already handled optimistically)
      if (data.userId === currentUserId) return

      setMessages(prev => prev.map(msg => {
        if (msg.id !== data.messageId) return msg

        const reactions = msg.reactions || []
        const existingReaction = reactions.find(r => r.emoji === data.emoji)

        if (data.action === 'add') {
          // Check if user already in reaction (prevent duplicates from multiple socket rooms)
          if (existingReaction?.userIds.includes(data.userId)) {
            return msg // Already added, skip
          }

          if (existingReaction) {
            // Add user to existing reaction
            return {
              ...msg,
              reactions: reactions.map(r =>
                r.emoji === data.emoji
                  ? {
                      ...r,
                      count: r.count + 1,
                      userIds: [...r.userIds, data.userId],
                      users: [...r.users, { id: data.userId, name: data.userName }]
                    }
                  : r
              )
            }
          } else {
            // New reaction
            return {
              ...msg,
              reactions: [
                ...reactions,
                {
                  emoji: data.emoji,
                  count: 1,
                  userIds: [data.userId],
                  users: [{ id: data.userId, name: data.userName }]
                }
              ]
            }
          }
        } else {
          // Remove reaction - check if user is actually in the reaction
          if (!existingReaction?.userIds.includes(data.userId)) {
            return msg // User not in reaction, skip
          }

          return {
            ...msg,
            reactions: reactions.map(r =>
              r.emoji === data.emoji
                ? {
                    ...r,
                    count: r.count - 1,
                    userIds: r.userIds.filter(id => id !== data.userId),
                    users: r.users.filter(u => u.id !== data.userId)
                  }
                : r
            ).filter(r => r.count > 0)
          }
        }
      }))
      
      // Auto-mark as read if reaction is from someone else and conversation is open
      if (conversationId && data.userId !== currentUserId && data.action === 'add') {
        markConversationAsRead(conversationId).then(() => {
          // Notify other components that read status changed
          const channel = new BroadcastChannel('chat_read_updates')
          channel.postMessage({ type: 'conversation_read', conversationId })
          channel.close()
        })
      }
    }

    socket.on('reaction', handleReactionUpdate)

    return () => {
      socket.off('reaction', handleReactionUpdate)
    }
  }, [socket, currentUserId, conversationId])

  // Detect keyboard open by viewport height change
  useEffect(() => {
    const handleResize = () => {
      if (window.visualViewport) {
        const isKeyboard = window.visualViewport.height < window.innerHeight * 0.75
        setIsKeyboardOpen(isKeyboard)
      }
    }
    
    window.visualViewport?.addEventListener('resize', handleResize)
    window.addEventListener('resize', handleResize)
    
    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  // Listen for messages/reactions in OTHER conversations to show indicator
  useEffect(() => {
    if (!socket || !currentUserId) return
    
    const handleOtherMessage = (message: any) => {
      // If message is in a different conversation, show indicator
      if (message.conversationId !== conversationId && message.author?.id !== currentUserId) {
        setHasOtherUnread(true)
      }
    }
    
    const handleOtherReaction = (data: any) => {
      // If reaction is in a different conversation and to your message, show indicator
      if (data.conversationId !== conversationId && data.action === 'add' && 
          data.messageAuthorId === currentUserId && data.userId !== currentUserId) {
        setHasOtherUnread(true)
      }
    }
    
    socket.on('message', handleOtherMessage)
    socket.on('reaction', handleOtherReaction)
    
    return () => {
      socket.off('message', handleOtherMessage)
      socket.off('reaction', handleOtherReaction)
    }
  }, [socket, conversationId, currentUserId])

  if (!isOpen) return null

  // Helper function to render message content with clickable, truncated URLs
  const renderMessageContent = (content: string, isCurrentUser: boolean) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g
    const parts = content.split(urlRegex)
    
    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        const displayUrl = part.length > 50 ? part.substring(0, 47) + '...' : part
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-block px-2 py-0.5 mx-0.5 rounded-md font-medium underline break-all ${
              isCurrentUser 
                ? 'bg-blue-600 text-gray-100 hover:bg-blue-700' 
                : 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800'
            }`}
          >
            {displayUrl}
          </a>
        )
      }
      return <span key={index}>{part}</span>
    })
  }

  // Handle image selection (supports multiple images)
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const MAX_IMAGES = 9
    const filesToProcess = Array.from(files).slice(0, MAX_IMAGES)
    
    // Show toast if user selected more than max
    if (files.length > MAX_IMAGES) {
      // TODO: Show toast notification
      console.warn(`Maximum ${MAX_IMAGES} images per message. First ${MAX_IMAGES} selected.`)
    }

    setIsProcessingImage(true)
    try {
      const processedImages: ProcessedImage[] = []
      
      for (const file of filesToProcess) {
        try {
          const processed = await processImageFile(file)
          processedImages.push(processed)
        } catch (error) {
          console.error('[Chat] Error processing image:', error)
          // Continue processing other images
        }
      }
      
      setPendingImages(prev => [...prev, ...processedImages])
    } finally {
      setIsProcessingImage(false)
      // Reset input so same files can be selected again
      if (imageInputRef.current) {
        imageInputRef.current.value = ''
      }
    }
  }

  // Remove a pending image by index
  const handleRemoveImage = (index: number) => {
    setPendingImages(prev => prev.filter((_, i) => i !== index))
  }

  const handleSendMessage = () => {
    if ((!newMessage.trim() && pendingImages.length === 0) || !conversationId || isSendingMessage) return

    const messageContent = newMessage.trim()
    const imagesToSend = pendingImages
    
    // Clear UI immediately for responsive feel
    setNewMessage('')
    setPendingImages([])
    setIsSendingMessage(true)

    if (!isConnected) {
      console.error('[Chat] Cannot send message: not connected to chat service')
      setIsSendingMessage(false)
      return
    }

    // Determine message type and build metadata
    let messageType = 'text'
    let metadata: any = undefined

    if (imagesToSend.length > 0) {
      messageType = messageContent ? 'mixed' : 'image'
      metadata = {
        images: imagesToSend.map(img => ({
          base64: img.base64,
          width: img.width,
          height: img.height,
          size: img.size
        }))
      }
    }

    // Send message with images and/or text
    sendMessage(conversationId, messageContent || ' ', {
      type: messageType,
      metadata
    })
    
    // Reset sending state after a brief delay (message should be sent by then)
    setTimeout(() => {
      setIsSendingMessage(false)
    }, 500)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Reaction handlers
  const handleLongPress = (messageId: string, event: React.MouseEvent | React.TouchEvent) => {
    event.preventDefault()
    
    // Save scroll position to prevent jump
    const messagesContainer = document.querySelector('[data-messages-container]')
    const scrollTop = messagesContainer?.scrollTop || 0
    
    const rect = event.currentTarget.getBoundingClientRect()
    
    // Position picker to stay on screen
    const pickerWidth = 350
    const pickerHeight = 350 // Quick reactions + compact emoji picker
    
    // Determine if message is on right side (current user's message)
    const message = messages.find(m => m.id === messageId)
    const isCurrentUserMessage = message?.authorId === currentUserId
    
    // Horizontal positioning
    let x: number
    if (isCurrentUserMessage) {
      // Right-aligned message: try to position picker to the left of message
      x = rect.right - pickerWidth
    } else {
      // Left-aligned message: try to position picker to the right of message
      x = rect.left
    }
    
    // Keep within screen bounds horizontally
    x = Math.max(10, Math.min(x, window.innerWidth - pickerWidth - 10))
    
    // Vertical positioning - check if there's room above or below
    const spaceAbove = rect.top
    const spaceBelow = window.innerHeight - rect.bottom
    
    let y: number
    let showAbove: boolean
    
    if (spaceBelow >= pickerHeight + 20) {
      // Enough space below
      y = rect.bottom + 10
      showAbove = false
    } else if (spaceAbove >= pickerHeight + 20) {
      // Not enough below, but enough above
      y = rect.top - 10
      showAbove = true
    } else {
      // Not enough space either way - center vertically
      y = Math.max(10, (window.innerHeight - pickerHeight) / 2)
      showAbove = false
    }
    
    const newState = {
      isOpen: true,
      messageId,
      position: { x, y },
      showAbove
    }
    setEmojiPickerState(newState)
    
    // Restore scroll position after state update
    requestAnimationFrame(() => {
      if (messagesContainer) {
        messagesContainer.scrollTop = scrollTop
      }
    })
  }

  const handleEmojiSelect = async (emoji: string) => {
    if (!emojiPickerState.messageId || !conversationId) return

    // Save messageId before closing picker
    const messageId = emojiPickerState.messageId

    // Close picker immediately
    setEmojiPickerState({ isOpen: false, messageId: null, position: { x: 0, y: 0 }, showAbove: true })

    // Save scroll position
    const messagesContainer = document.querySelector('[data-messages-container]')
    const scrollTop = messagesContainer?.scrollTop || 0

    // Determine if adding or removing BEFORE optimistic update
    const message = messages.find(m => m.id === messageId)
    const existingReaction = message?.reactions?.find(r => r.emoji === emoji)
    const isRemoving = existingReaction?.userIds.includes(currentUserId!)

    try {
      // Optimistic update
      setMessages(prev => prev.map(msg => {
        if (msg.id !== messageId) return msg
        
        const reactions = msg.reactions || []
        const existingReaction = reactions.find(r => r.emoji === emoji)
        
        if (existingReaction) {
          // User already reacted with this emoji - remove it
          if (existingReaction.userIds.includes(currentUserId!)) {
            return {
              ...msg,
              reactions: reactions.map(r => 
                r.emoji === emoji
                  ? {
                      ...r,
                      count: r.count - 1,
                      userIds: r.userIds.filter(id => id !== currentUserId),
                      users: r.users.filter(u => u.id !== currentUserId)
                    }
                  : r
              ).filter(r => r.count > 0)
            }
          } else {
            // Add user to existing reaction
            return {
              ...msg,
              reactions: reactions.map(r =>
                r.emoji === emoji
                  ? {
                      ...r,
                      count: r.count + 1,
                      userIds: [...r.userIds, currentUserId!],
                      users: [...r.users, { id: currentUserId!, name: session?.user?.name || 'You' }]
                    }
                  : r
              )
            }
          }
        } else {
          // New reaction
          return {
            ...msg,
            reactions: [
              ...reactions,
              {
                emoji,
                count: 1,
                userIds: [currentUserId!],
                users: [{ id: currentUserId!, name: session?.user?.name || 'You' }]
              }
            ]
          }
        }
      }))

      // Use the isRemoving flag we determined before the optimistic update
      if (isRemoving) {
        // Remove reaction via API
        await fetch(`/api/chat/reactions/${messageId}?emoji=${encodeURIComponent(emoji)}`, {
          method: 'DELETE'
        })
        
        // Emit socket event
        if (socket && isConnected) {
          socket.emit('send-reaction', {
            messageId,
            conversationId,
            emoji,
            action: 'remove'
          })
        }
      } else {
        // Add reaction via API
        await fetch(`/api/chat/reactions/${messageId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emoji })
        })
        
        // Emit socket event
        if (socket && isConnected) {
          socket.emit('send-reaction', {
            messageId,
            conversationId,
            emoji,
            action: 'add'
          })
        }
      }
      
      // Restore scroll position after state update
      setTimeout(() => {
        if (messagesContainer) {
          messagesContainer.scrollTop = scrollTop
        }
      }, 0)
    } catch (error) {
      console.error('[Chat] Error handling reaction:', error)
      // TODO: Revert optimistic update on error
    }
  }

  const handleReactionClick = async (messageId: string, emoji: string) => {
    if (!conversationId || !currentUserId) return

    try {
      const message = messages.find(m => m.id === messageId)
      const reaction = message?.reactions?.find(r => r.emoji === emoji)
      const isRemoving = reaction?.userIds.includes(currentUserId)

      // Optimistic update (same logic as handleEmojiSelect)
      setMessages(prev => prev.map(msg => {
        if (msg.id !== messageId) return msg
        
        const reactions = msg.reactions || []
        const existingReaction = reactions.find(r => r.emoji === emoji)
        
        if (existingReaction?.userIds.includes(currentUserId)) {
          // Remove reaction
          return {
            ...msg,
            reactions: reactions.map(r => 
              r.emoji === emoji
                ? {
                    ...r,
                    count: r.count - 1,
                    userIds: r.userIds.filter(id => id !== currentUserId),
                    users: r.users.filter(u => u.id !== currentUserId)
                  }
                : r
            ).filter(r => r.count > 0)
          }
        } else {
          // Add reaction
          if (existingReaction) {
            return {
              ...msg,
              reactions: reactions.map(r =>
                r.emoji === emoji
                  ? {
                      ...r,
                      count: r.count + 1,
                      userIds: [...r.userIds, currentUserId],
                      users: [...r.users, { id: currentUserId, name: session?.user?.name || 'You' }]
                    }
                  : r
              )
            }
          } else {
            return {
              ...msg,
              reactions: [
                ...reactions,
                {
                  emoji,
                  count: 1,
                  userIds: [currentUserId],
                  users: [{ id: currentUserId, name: session?.user?.name || 'You' }]
                }
              ]
            }
          }
        }
      }))

      if (isRemoving) {
        await fetch(`/api/chat/reactions/${messageId}?emoji=${encodeURIComponent(emoji)}`, {
          method: 'DELETE'
        })
        
        if (socket && isConnected) {
          socket.emit('send-reaction', {
            messageId,
            conversationId,
            emoji,
            action: 'remove'
          })
        }
      } else {
        await fetch(`/api/chat/reactions/${messageId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emoji })
        })
        
        if (socket && isConnected) {
          socket.emit('send-reaction', {
            messageId,
            conversationId,
            emoji,
            action: 'add'
          })
        }
      }
    } catch (error) {
      console.error('[Chat] Error toggling reaction:', error)
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
      {/* Header - Absolute on mobile (fixed causes issues with iOS keyboard), fixed on desktop */}
      <div className={`absolute md:fixed top-0 left-0 right-0 z-20 flex items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition-all ${
        isKeyboardOpen ? 'p-2' : 'p-4'
      }`}>
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {/* Dot indicator - green when unread messages in other conversations, gray otherwise */}
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
              hasOtherUnread ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
            }`} />
            <button
              onClick={() => {
                setHasOtherUnread(false)
                onBack()
              }}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white flex-shrink-0 md:block"
            >
              <ArrowLeft size={24} />
            </button>
          </div>
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
                <h2 className={`font-semibold text-gray-900 dark:text-white truncate ${
                  isKeyboardOpen ? 'text-base' : 'text-lg'
                }`}>
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
        
        {/* Close button - visible on all screens */}
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white flex-shrink-0"
          aria-label="Close chat"
        >
          <X size={24} />
        </button>
      </div>

      {/* Messages - Add top padding to account for fixed header */}
      <div 
        ref={messagesContainerRef}
        data-messages-container
        className="flex-1 overflow-y-auto p-4 space-y-4"
        style={{ paddingTop: isKeyboardOpen ? '60px' : '76px' }}
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
            setIsSwiping(true)
          }
        }}
        onTouchEnd={() => {
          setShowAllTimestamps(false)
          setIsSwiping(false)
        }}
        onMouseDown={(e) => {
          setDragStartX(e.clientX)
        }}
        onMouseMove={(e) => {
          if (dragStartX > 0) {
            const deltaX = dragStartX - e.clientX
            if (Math.abs(deltaX) > 5) {
              // User is dragging, not holding
              setIsDragging(true)
            }
            if (deltaX > 50) {
              setShowAllTimestamps(true)
            }
          }
        }}
        onMouseUp={() => {
          setIsDragging(false)
          setShowAllTimestamps(false)
          setDragStartX(0)
        }}
        onMouseLeave={() => {
          setIsDragging(false)
          setShowAllTimestamps(false)
          setDragStartX(0)
        }}
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

                  <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'} max-w-[85%]`}>
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
                      style={{
                        WebkitTouchCallout: 'none',
                        WebkitUserSelect: 'none',
                        userSelect: 'none',
                        touchAction: 'none'
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        // Always call handleLongPress - let the timer handle deduplication
                        handleLongPress(message.id, e)
                        return false
                      }}
                      onMouseDown={(e) => {
                        const target = e.currentTarget
                        const startX = e.clientX
                        const startY = e.clientY
                        ;(target as any).mouseDownX = startX
                        ;(target as any).mouseDownY = startY
                        
                        const timer = setTimeout(() => {
                          if (!isDragging) {
                            // Create a synthetic event with the saved target
                            const syntheticEvent = {
                              ...e,
                              currentTarget: target,
                              preventDefault: () => {},
                            }
                            handleLongPress(message.id, syntheticEvent as any)
                          }
                        }, 500)
                        ;(e.currentTarget as any).mouseHoldTimer = timer
                      }}
                      onMouseUp={(e) => {
                        const timer = (e.currentTarget as any).mouseHoldTimer
                        if (timer) clearTimeout(timer)
                        ;(e.currentTarget as any).mouseDownX = undefined
                        ;(e.currentTarget as any).mouseDownY = undefined
                      }}
                      onMouseMove={(e) => {
                        const target = e.currentTarget as any
                        const startX = target.mouseDownX
                        const startY = target.mouseDownY
                        
                        // Only cancel if mouse moved significantly (>10px)
                        if (startX !== undefined && startY !== undefined) {
                          const deltaX = Math.abs(e.clientX - startX)
                          const deltaY = Math.abs(e.clientY - startY)
                          
                          if (deltaX > 10 || deltaY > 10) {
                            const timer = target.mouseHoldTimer
                            if (timer) clearTimeout(timer)
                          }
                        }
                      }}
                      ref={(el) => {
                        if (el) {
                          messageBubbleRefs.current.set(message.id, el)
                          
                          // Add non-passive touch event listener to prevent context menu
                          const handleTouchStart = (e: TouchEvent) => {
                            e.preventDefault() // This works because listener is non-passive
                            
                            const target = e.currentTarget as HTMLElement
                            ;(target as any).touchStartTime = Date.now()
                            
                            const timer = setTimeout(() => {
                              if (!isSwiping) {
                                // Create synthetic event
                                const syntheticEvent = {
                                  currentTarget: target,
                                  preventDefault: () => {},
                                } as any
                                handleLongPress(message.id, syntheticEvent)
                              }
                            }, 500)
                            ;(target as any).longPressTimer = timer
                          }
                          
                          const handleTouchEnd = (e: TouchEvent) => {
                            const timer = ((e.currentTarget as HTMLElement) as any).longPressTimer
                            if (timer) clearTimeout(timer)
                          }
                          
                          const handleTouchMove = (e: TouchEvent) => {
                            const timer = ((e.currentTarget as HTMLElement) as any).longPressTimer
                            if (timer) clearTimeout(timer)
                          }
                          
                          // Remove old listeners if they exist
                          el.removeEventListener('touchstart', handleTouchStart as any)
                          el.removeEventListener('touchend', handleTouchEnd as any)
                          el.removeEventListener('touchmove', handleTouchMove as any)
                          
                          // Add non-passive listeners
                          el.addEventListener('touchstart', handleTouchStart, { passive: false })
                          el.addEventListener('touchend', handleTouchEnd, { passive: false })
                          el.addEventListener('touchmove', handleTouchMove, { passive: false })
                        } else {
                          messageBubbleRefs.current.delete(message.id)
                        }
                      }}
                    >
                      {/* Message text content */}
                      {message.content && message.content.trim() && (
                        <p className="text-xl whitespace-pre-wrap" style={{ WebkitTextSizeAdjust: '100%' }}>
                          {renderMessageContent(message.content, isCurrentUser)}
                        </p>
                      )}
                      
                      {/* Message images */}
                      {message.metadata?.images && message.metadata.images.length > 0 && (
                        <div className={`mt-2 grid gap-2 ${
                          message.metadata.images.length === 1 ? 'grid-cols-1' :
                          message.metadata.images.length === 2 ? 'grid-cols-2' :
                          'grid-cols-3'
                        }`}>
                          {message.metadata.images.map((image, idx) => (
                            <div key={idx} className="relative aspect-square max-w-xs">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={image.base64}
                                alt={`Image ${idx + 1}`}
                                className="w-full h-full object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => {
                                  // TODO: Open lightbox/modal to view full size
                                  window.open(image.base64, '_blank')
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Reactions */}
                    {message.reactions && message.reactions.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1 px-1">
                        {message.reactions.map((reaction) => (
                          <button
                            key={reaction.emoji}
                            onClick={() => handleReactionClick(message.id, reaction.emoji)}
                            className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm transition-all ${
                              reaction.userIds.includes(currentUserId || '')
                                ? 'bg-blue-100 dark:bg-blue-900 border-2 border-blue-500'
                                : 'bg-gray-100 dark:bg-gray-700 border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                            }`}
                            title={reaction.users.map(u => u.name).join(', ')}
                          >
                            <span>{reaction.emoji}</span>
                            <span className="text-xs font-medium">{reaction.count}</span>
                          </button>
                        ))}
                      </div>
                    )}
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
        {/* Image previews - dynamic grid layout */}
        {pendingImages.length > 0 && (
          <div className={`mb-3 grid gap-2 ${
            pendingImages.length === 1 ? 'grid-cols-1' :
            pendingImages.length === 2 ? 'grid-cols-2' :
            'grid-cols-3'
          }`}>
            {pendingImages.map((image, index) => (
              <div key={index} className="relative aspect-square">
                {/* Using <img> instead of <Image> because src is base64 data URL (already optimized client-side) */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.base64}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-full object-cover rounded-lg border-2 border-blue-500"
                />
                <button
                  onClick={() => handleRemoveImage(index)}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-gray-600 dark:bg-gray-500 text-white rounded-full flex items-center justify-center hover:bg-gray-700 dark:hover:bg-gray-600 shadow-md"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
        
        <div className="flex items-end gap-3">
          {/* Hidden file input - supports multiple selection */}
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            onChange={handleImageSelect}
            className="hidden"
          />
          
          {/* Image button */}
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            disabled={isProcessingImage}
            className="w-12 h-12 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 relative"
          >
            {isProcessingImage ? (
              <div className="w-5 h-5 border-2 border-gray-600 dark:border-gray-300 border-t-transparent rounded-full animate-spin" />
            ) : (
              <ImagePlus size={20} />
            )}
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
            disabled={(!newMessage.trim() && pendingImages.length === 0) || isSendingMessage}
            className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-600 disabled:hover:bg-gray-300 transition-colors relative"
          >
            {isSendingMessage ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send size={20} />
            )}
          </button>
        </div>
      </div>

      {/* Emoji Picker */}
      <MessageEmojiPicker
        isOpen={emojiPickerState.isOpen}
        onClose={() => setEmojiPickerState({ isOpen: false, messageId: null, position: { x: 0, y: 0 }, showAbove: true })}
        onEmojiSelect={handleEmojiSelect}
        position={emojiPickerState.position}
        showAbove={emojiPickerState.showAbove}
      />
    </div>
  )
}
