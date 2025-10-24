'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Send,
  ArrowLeft,
  Pencil,
  Check,
  X,
  ImagePlus,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  EyeOff,
  Trash2,
  Edit2,
} from 'lucide-react'
import Image from 'next/image'
import { useSocket } from '@/context/SocketContext'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import {
  updateConversationName,
  markConversationAsRead,
} from '@/app/actions/chat'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import MessageEmojiPicker from './MessageEmojiPicker'
import { processImageFile, ProcessedImage } from '@/lib/imageUtils'
import ConfirmDialog from './ConfirmDialog'

interface ChatInterfaceProps {
  isOpen: boolean
  onBack: () => void
  onClose: () => void
  conversationId?: string
  participants: string[]
  conversationName: string
  onNameUpdate?: (newName: string) => void
  onResize?: (isResizing: boolean) => void
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
  createdAt?: Date
  updatedAt?: Date
  type: 'text' | 'image' | 'mixed' | 'system' | 'link' | string
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
  isDeleted?: boolean
  isHidden?: boolean
}

export default function ChatInterface({
  isOpen,
  onBack,
  onClose,
  conversationId,
  participants,
  conversationName,
  onNameUpdate,
  onResize,
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
  const [authorPhotos, setAuthorPhotos] = useState<Map<string, string | null>>(
    new Map(),
  )
  const [isEditingName, setIsEditingName] = useState(false)
  const [editedName, setEditedName] = useState(conversationName)
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false)
  const [viewportOffset, setViewportOffset] = useState({ top: 0, height: 0 })
  const [isMobile, setIsMobile] = useState(false)
  const [isResizingDrawer, setIsResizingDrawer] = useState(false)
  const [emojiPickerState, setEmojiPickerState] = useState<{
    isOpen: boolean
    messageId: string | null
    position: { x: number; y: number }
    showAbove: boolean
  }>({
    isOpen: false,
    messageId: null,
    position: { x: 0, y: 0 },
    showAbove: true,
  })
  const [hasOtherUnread, setHasOtherUnread] = useState(false)
  const [pendingImages, setPendingImages] = useState<ProcessedImage[]>([])
  const [isProcessingImage, setIsProcessingImage] = useState(false)
  const [isSendingMessage, setIsSendingMessage] = useState(false)
  const [lightboxState, setLightboxState] = useState<{
    isOpen: boolean
    images: Array<{ base64: string; width: number; height: number }>
    currentIndex: number
  }>({ isOpen: false, images: [], currentIndex: 0 })
  const [moderationMenuMessageId, setModerationMenuMessageId] = useState<
    string | null
  >(null)
  const [moderationButtonVisibleId, setModerationButtonVisibleId] = useState<
    string | null
  >(null)
  const [isGroupAdmin, setIsGroupAdmin] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    type: 'delete' | 'hide'
    messageId: string | null
  }>({ isOpen: false, type: 'delete', messageId: null })
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editedContent, setEditedContent] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const messageBubbleRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const { socket, isConnected, joinConversation, leaveConversation } =
    useSocket()
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const currentUserId = session?.user?.id
  const hasScrolledToMessageRef = useRef(false)

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

  const loadMessages = useCallback(
    async (cursor?: string) => {
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
            createdAt: m.createdAt ? new Date(m.createdAt) : undefined,
            updatedAt: m.updatedAt ? new Date(m.updatedAt) : undefined,
            type: m.type,
            metadata: m.metadata,
            reactions: m.reactions || [],
            isDeleted: m.isDeleted || false,
            isHidden: m.isHidden || false,
          }))

          if (isInitialLoad) {
            setMessages(newMessages)
          } else {
            // Prepend older messages, avoiding duplicates
            // Save the first visible message to maintain scroll position
            const container = messagesContainerRef.current
            const firstVisibleMessage = container?.querySelector(
              '[data-message-id]',
            ) as HTMLElement
            const offsetBefore = firstVisibleMessage?.offsetTop || 0

            setMessages((prev) => {
              const existingIds = new Set(prev.map((m: ChatMessage) => m.id))
              const uniqueNewMessages = newMessages.filter(
                (m: ChatMessage) => !existingIds.has(m.id),
              )
              return [...uniqueNewMessages, ...prev]
            })

            // Restore scroll position relative to the same message
            requestAnimationFrame(() => {
              if (container && firstVisibleMessage) {
                const offsetAfter = firstVisibleMessage.offsetTop
                container.scrollTop =
                  container.scrollTop + (offsetAfter - offsetBefore)
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
    },
    [conversationId, authorPhotos],
  )

  const loadMoreMessages = useCallback(() => {
    if (!hasMoreMessages || isLoadingMore || messages.length === 0) return

    // Use the oldest message ID as cursor
    const oldestMessage = messages[0]
    loadMessages(oldestMessage.id)
  }, [hasMoreMessages, isLoadingMore, messages, loadMessages])

  // Auto-scroll to bottom when new messages arrive
  const previousMessageCount = useRef(0)
  const shouldAutoScroll = useRef(true) // Track if we should auto-scroll

  // Update shouldAutoScroll when user manually scrolls
  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return

    const handleScroll = () => {
      // If user scrolls up more than 150px from bottom, disable auto-scroll
      const scrollBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight
      shouldAutoScroll.current = scrollBottom < 150
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (messages.length === 0) return

    // If messages were added and auto-scroll is enabled, scroll to bottom
    if (messages.length > previousMessageCount.current) {
      const isInitialLoad = previousMessageCount.current === 0

      if (isInitialLoad || shouldAutoScroll.current) {
        // Check if we need to scroll to a specific message from URL
        const msgParam = searchParams.get('msg')
        if (msgParam && !hasScrolledToMessageRef.current) {
          // Try to scroll to specific message
          requestAnimationFrame(() => {
            const messageElement = messageBubbleRefs.current.get(msgParam)
            if (messageElement) {
              messageElement.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
              })
              hasScrolledToMessageRef.current = true
              // Highlight the message briefly
              messageElement.style.backgroundColor = 'rgba(59, 130, 246, 0.2)'
              setTimeout(() => {
                messageElement.style.backgroundColor = ''
              }, 2000)
            } else {
              // Message not found, scroll to bottom
              messagesEndRef.current?.scrollIntoView({ behavior: 'auto' })
            }
          })
        } else {
          // Normal scroll to bottom
          requestAnimationFrame(() => {
            messagesEndRef.current?.scrollIntoView({
              behavior: isInitialLoad ? 'auto' : 'smooth',
            })
          })
        }
      }
    }

    previousMessageCount.current = messages.length
  }, [messages, searchParams])

  // Reset scroll flag when conversation changes
  useEffect(() => {
    hasScrolledToMessageRef.current = false
  }, [conversationId])

  // Check if current user is a group admin for this conversation
  useEffect(() => {
    const checkGroupAdmin = async () => {
      if (!conversationId || !currentUserId) {
        setIsGroupAdmin(false)
        return
      }

      try {
        // Fetch conversation details to get groupId
        const response = await fetch(
          `/api/chat/conversations/${conversationId}`,
        )
        if (response.ok) {
          const { conversation } = await response.json()

          // If conversation has a groupId, check if user is admin
          if (conversation.groupId) {
            const adminCheckResponse = await fetch(
              `/api/group/${conversation.groupId}/is-admin`,
            )
            if (adminCheckResponse.ok) {
              const { isAdmin } = await adminCheckResponse.json()
              setIsGroupAdmin(isAdmin)
            } else {
              setIsGroupAdmin(false)
            }
          } else {
            setIsGroupAdmin(false)
          }
        }
      } catch (error) {
        console.error('[Chat] Error checking group admin status:', error)
        setIsGroupAdmin(false)
      }
    }

    checkGroupAdmin()
  }, [conversationId, currentUserId])

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

  // Detect mobile on mount
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Handle drawer resize
  useEffect(() => {
    if (!isResizingDrawer || !onResize) return

    const handleMouseMove = (e: MouseEvent) => {
      const MIN_WIDTH = 400
      const MAX_WIDTH_VW = 40
      const maxWidth = window.innerWidth * (MAX_WIDTH_VW / 100)
      const newWidth = Math.max(MIN_WIDTH, Math.min(window.innerWidth - e.clientX, maxWidth))
      
      // Update parent drawer width
      const drawerEl = document.querySelector('[data-chat-drawer]') as HTMLElement
      if (drawerEl) {
        drawerEl.style.width = `${newWidth}px`
      }
    }

    const handleMouseUp = () => {
      setIsResizingDrawer(false)
      onResize(false)
      
      // Save to localStorage
      const drawerEl = document.querySelector('[data-chat-drawer]') as HTMLElement
      if (drawerEl && typeof window !== 'undefined') {
        localStorage.setItem('chat-drawer-width', drawerEl.style.width.replace('px', ''))
      }
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizingDrawer, onResize])

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
  }, [isOpen, conversationId, isConnected])

  // Listen for incoming message notifications
  useEffect(() => {
    if (!socket) return

    const handleMessageNotification = async (notification: {
      messageId: string
      conversationId: string
    }) => {
      // CRITICAL: Only fetch message if it belongs to THIS conversation
      if (notification.conversationId !== conversationId) {
        return
      }

      // Check if we already have this message (optimistic or real)
      const exists = messages.some(
        (m) => m.id === notification.messageId || m.id.startsWith('temp-'),
      )
      if (exists) {
        // If it's our optimistic message, it will be replaced by the POST response
        return
      }
      // Fetch full message via HTTP
      try {
        const response = await fetch(
          `/api/chat/messages/${conversationId}?messageId=${notification.messageId}`,
        )
        if (!response.ok) {
          console.error(
            '[Chat] Failed to fetch message:',
            notification.messageId,
          )
          return
        }

        const data = await response.json()
        const message = data.messages?.[0]

        if (!message) {
          console.error('[Chat] Message not found:', notification.messageId)
          return
        }

        const authorId = message.author?.id || message.authorId

        // Convert to ChatMessage format
        const chatMessage: ChatMessage = {
          id: message.id,
          content: message.content,
          authorId,
          authorName: message.author?.name || 'Unknown User',
          authorPhoto: authorPhotos.get(authorId) || null,
          timestamp: new Date(message.createdAt),
          type: message.type || 'text',
          metadata: message.metadata,
          isDeleted: message.isDeleted || false,
          isHidden: message.isHidden || false,
        }

        // Add or update message
        setMessages((prev) => {
          // Check if this is replacing an optimistic message (temp ID)
          const optimisticIndex = prev.findIndex((m) => m.id.startsWith('temp-'))
          if (optimisticIndex !== -1 && chatMessage.authorId === session?.user?.id) {
            // Replace optimistic message with real one (has real ID now)
            const updated = [...prev]
            updated[optimisticIndex] = chatMessage
            return updated
          }
          
          // Check if message already exists with this ID
          const existingIndex = prev.findIndex((m) => m.id === chatMessage.id)
          if (existingIndex !== -1) {
            // Already have this message, don't duplicate
            return prev
          }
          
          // New message - add it
          return [...prev, chatMessage]
        })

        // Auto-mark as read if message is from someone else
        if (conversationId && authorId !== session?.user?.id) {
          markConversationAsRead(conversationId).then(() => {
            const channel = new BroadcastChannel('chat_read_updates')
            channel.postMessage({ type: 'conversation_read', conversationId })
            channel.close()
          })
        }
      } catch (error) {
        console.error('[Chat] Failed to fetch message:', error)
      }
    }

    socket.on('message_notification', handleMessageNotification)

    return () => {
      socket.off('message_notification', handleMessageNotification)
    }
  }, [socket, authorPhotos, conversationId, session?.user?.id, messages])

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

      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id !== data.messageId) return msg

          const reactions = msg.reactions || []
          const existingReaction = reactions.find((r) => r.emoji === data.emoji)

          if (data.action === 'add') {
            // Check if user already in reaction (prevent duplicates from multiple socket rooms)
            if (existingReaction?.userIds.includes(data.userId)) {
              return msg // Already added, skip
            }

            if (existingReaction) {
              // Add user to existing reaction
              return {
                ...msg,
                reactions: reactions.map((r) =>
                  r.emoji === data.emoji
                    ? {
                        ...r,
                        count: r.count + 1,
                        userIds: [...r.userIds, data.userId],
                        users: [
                          ...r.users,
                          { id: data.userId, name: data.userName },
                        ],
                      }
                    : r,
                ),
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
                    users: [{ id: data.userId, name: data.userName }],
                  },
                ],
              }
            }
          } else {
            // Remove reaction - check if user is actually in the reaction
            if (!existingReaction?.userIds.includes(data.userId)) {
              return msg // User not in reaction, skip
            }

            return {
              ...msg,
              reactions: reactions
                .map((r) =>
                  r.emoji === data.emoji
                    ? {
                        ...r,
                        count: r.count - 1,
                        userIds: r.userIds.filter((id) => id !== data.userId),
                        users: r.users.filter((u) => u.id !== data.userId),
                      }
                    : r,
                )
                .filter((r) => r.count > 0),
            }
          }
        }),
      )

      // Auto-mark as read if reaction is from someone else and conversation is open
      if (
        conversationId &&
        data.userId !== currentUserId &&
        data.action === 'add'
      ) {
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
        const isKeyboard =
          window.visualViewport.height < window.innerHeight * 0.75
        setIsKeyboardOpen(isKeyboard)
        setViewportOffset({
          top: window.visualViewport.offsetTop,
          height: window.visualViewport.height,
        })
      }
    }

    const checkInitialState = () => {
      if (window.visualViewport) {
        const isKeyboard =
          window.visualViewport.height < window.innerHeight * 0.75
        setIsKeyboardOpen(isKeyboard)
        setViewportOffset({
          top: window.visualViewport.offsetTop,
          height: window.visualViewport.height,
        })
      }
    }

    // Check immediately and after delays to catch keyboard opening
    checkInitialState()
    const timer1 = setTimeout(checkInitialState, 100)
    const timer2 = setTimeout(checkInitialState, 300)
    const timer3 = setTimeout(checkInitialState, 500)

    window.visualViewport?.addEventListener('resize', handleResize)
    window.visualViewport?.addEventListener('scroll', handleResize)
    window.addEventListener('resize', handleResize)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
      window.visualViewport?.removeEventListener('resize', handleResize)
      window.visualViewport?.removeEventListener('scroll', handleResize)
      window.removeEventListener('resize', handleResize)
    }
  }, [isKeyboardOpen])

  // Listen for notifications in OTHER conversations to show indicator
  useEffect(() => {
    if (!socket || !currentUserId) return

    const handleMessageNotification = (notification: any) => {
      // If notification is for a different conversation and not from me, show indicator
      if (
        notification.conversationId !== conversationId &&
        notification.authorId !== currentUserId
      ) {
        setHasOtherUnread(true)
      }
    }

    const handleOtherReaction = (data: any) => {
      // If reaction is in a different conversation and to your message, show indicator
      if (
        data.conversationId !== conversationId &&
        data.action === 'add' &&
        data.messageAuthorId === currentUserId &&
        data.userId !== currentUserId
      ) {
        setHasOtherUnread(true)
      }
    }

    const handleMessageDeleted = (data: {
      messageId: string
      conversationId: string
    }) => {
      if (data.conversationId === conversationId) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === data.messageId
              ? {
                  ...m,
                  content: '[Message deleted]',
                  type: 'system',
                  metadata: undefined,
                  isDeleted: true,
                }
              : m,
          ),
        )
      }
    }

    const handleMessageHidden = (data: {
      messageId: string
      conversationId: string
    }) => {
      if (data.conversationId === conversationId) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === data.messageId
              ? {
                  ...m,
                  content: '[Message hidden]',
                  type: 'system',
                  metadata: undefined,
                  isHidden: true,
                }
              : m,
          ),
        )
      }
    }

    const handleMessageEdited = (data: {
      messageId: string
      conversationId: string
      content: string
      updatedAt: string
    }) => {
      // Only update if it's for this conversation and not from current user
      if (data.conversationId === conversationId) {
        setMessages(prev => prev.map(m => 
          m.id === data.messageId 
            ? { ...m, content: data.content, updatedAt: new Date(data.updatedAt) }
            : m
        ))
        // Don't scroll - just update in place
      }
    }

    socket.on('message_notification', handleMessageNotification)
    socket.on('reaction', handleOtherReaction)
    socket.on('message_deleted', handleMessageDeleted)
    socket.on('message_hidden', handleMessageHidden)
    socket.on('message-edited', handleMessageEdited)

    return () => {
      socket.off('message_notification', handleMessageNotification)
      socket.off('reaction', handleOtherReaction)
      socket.off('message_deleted', handleMessageDeleted)
      socket.off('message_hidden', handleMessageHidden)
      socket.off('message-edited', handleMessageEdited)
    }
  }, [socket, conversationId, currentUserId])

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!lightboxState.isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxState({ ...lightboxState, isOpen: false })
      } else if (e.key === 'ArrowLeft' && lightboxState.images.length > 1) {
        setLightboxState({
          ...lightboxState,
          currentIndex:
            lightboxState.currentIndex === 0
              ? lightboxState.images.length - 1
              : lightboxState.currentIndex - 1,
        })
      } else if (e.key === 'ArrowRight' && lightboxState.images.length > 1) {
        setLightboxState({
          ...lightboxState,
          currentIndex:
            lightboxState.currentIndex === lightboxState.images.length - 1
              ? 0
              : lightboxState.currentIndex + 1,
        })
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [lightboxState])

  // Close moderation menu and button visibility on click outside
  useEffect(() => {
    if (!moderationMenuMessageId && !moderationButtonVisibleId) return

    const handleClickOutside = () => {
      setModerationMenuMessageId(null)
      setModerationButtonVisibleId(null)
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [moderationMenuMessageId, moderationButtonVisibleId])

  if (!isOpen) return null

  // Helper function to render message content with clickable, truncated URLs
  const renderMessageContent = (content: string, isCurrentUser: boolean) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g
    const parts = content.split(urlRegex)

    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        const displayUrl =
          part.length > 50 ? part.substring(0, 47) + '...' : part
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline px-1.5 py-0.5 mx-0.5 my-1 rounded font-normal underline decoration-1 underline-offset-2 break-all ${
              isCurrentUser
                ? 'bg-white/20 text-white hover:bg-white/30'
                : 'bg-blue-500/10 dark:bg-blue-400/20 text-blue-600 dark:text-blue-300 hover:bg-blue-500/20 dark:hover:bg-blue-400/30'
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
      console.warn(
        `Maximum ${MAX_IMAGES} images per message. First ${MAX_IMAGES} selected.`,
      )
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

      setPendingImages((prev) => [...prev, ...processedImages])
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
    setPendingImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSendMessage = async () => {
    if (
      (!newMessage.trim() && pendingImages.length === 0) ||
      !conversationId ||
      isSendingMessage
    )
      return

    const messageContent = newMessage.trim()
    const imagesToSend = pendingImages

    // Clear UI immediately for responsive feel
    setNewMessage('')
    setPendingImages([])
    setIsSendingMessage(true)

    // Determine message type and build metadata
    let messageType = 'text'
    let metadata: any = undefined

    if (imagesToSend.length > 0) {
      messageType = messageContent ? 'mixed' : 'image'
      metadata = {
        images: imagesToSend.map((img) => ({
          base64: img.base64,
          width: img.width,
          height: img.height,
          size: img.size,
        })),
      }
    }

    // Detect URLs and fetch link previews
    const urlRegex = /(https?:\/\/[^\s]+)/g
    const urls = messageContent.match(urlRegex)
    if (urls && urls.length > 0) {
      // Fetch preview for first URL only (to keep it simple)
      try {
        const response = await fetch('/api/chat/link-preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: urls[0] }),
        })
        if (response.ok) {
          const preview = await response.json()
          if (!metadata) metadata = {}
          metadata.links = [
            {
              url: urls[0],
              title: preview.title,
              description: preview.description,
              image: preview.image,
              siteName: preview.siteName,
            },
          ]
          if (messageType === 'text') messageType = 'link'
          if (messageType === 'mixed') messageType = 'mixed' // Keep as mixed if has images too
        }
      } catch (error) {
        console.error('[Chat] Failed to fetch link preview:', error)
        // Continue sending message without preview
      }
    }

    // Create optimistic message for immediate display
    const optimisticMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      content: messageContent,
      authorId: session?.user?.id || '',
      authorName: session?.user?.name || 'You',
      authorPhoto: null,
      timestamp: new Date(),
      type: messageType,
      metadata,
    }

    // Add optimistic message immediately
    setMessages((prev) => [...prev, optimisticMessage])

    // Send message via HTTP POST (handles large payloads better than WebSocket)
    try {
      const response = await fetch(`/api/chat/messages/${conversationId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: messageContent || '',
          type: messageType,
          metadata,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const realMessage = await response.json()

      // Replace optimistic message with real one (has real ID now)
      setMessages((prev) =>
        prev.map((m) =>
          m.id === optimisticMessage.id
            ? {
                ...m,
                id: realMessage.id,
                timestamp: new Date(realMessage.createdAt),
              }
            : m,
        ),
      )
    } catch (error) {
      console.error('[Chat] Failed to send message:', error)
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMessage.id))
      // TODO: Show error toast
    } finally {
      setIsSendingMessage(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Reaction handlers
  const handleLongPress = (
    messageId: string,
    event: React.MouseEvent | React.TouchEvent,
  ) => {
    event.preventDefault()

    // Save scroll position to prevent jump
    const messagesContainer = document.querySelector(
      '[data-messages-container]',
    )
    const scrollTop = messagesContainer?.scrollTop || 0

    const rect = event.currentTarget.getBoundingClientRect()

    // Position picker to stay on screen
    const pickerWidth = 350
    const pickerHeight = 350 // Quick reactions + compact emoji picker

    // Determine if message is on right side (current user's message)
    const message = messages.find((m) => m.id === messageId)
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
      showAbove,
    }
    setEmojiPickerState(newState)

    // Restore scroll position after state update (only if we have a valid position)
    if (scrollTop > 0) {
      requestAnimationFrame(() => {
        if (messagesContainer) {
          messagesContainer.scrollTop = scrollTop
        }
      })
    }
  }

  const handleEmojiSelect = async (emoji: string) => {
    if (!emojiPickerState.messageId || !conversationId) return

    // Save messageId before closing picker
    const messageId = emojiPickerState.messageId

    // Close picker immediately
    setEmojiPickerState({
      isOpen: false,
      messageId: null,
      position: { x: 0, y: 0 },
      showAbove: true,
    })

    // Save scroll position
    const messagesContainer = document.querySelector(
      '[data-messages-container]',
    )
    const scrollTop = messagesContainer?.scrollTop || 0

    // Determine if adding or removing BEFORE optimistic update
    const message = messages.find((m) => m.id === messageId)
    const existingReaction = message?.reactions?.find((r) => r.emoji === emoji)
    const isRemoving = existingReaction?.userIds.includes(currentUserId!)

    try {
      // Optimistic update
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id !== messageId) return msg

          const reactions = msg.reactions || []
          const existingReaction = reactions.find((r) => r.emoji === emoji)

          if (existingReaction) {
            // User already reacted with this emoji - remove it
            if (existingReaction.userIds.includes(currentUserId!)) {
              return {
                ...msg,
                reactions: reactions
                  .map((r) =>
                    r.emoji === emoji
                      ? {
                          ...r,
                          count: r.count - 1,
                          userIds: r.userIds.filter(
                            (id) => id !== currentUserId,
                          ),
                          users: r.users.filter((u) => u.id !== currentUserId),
                        }
                      : r,
                  )
                  .filter((r) => r.count > 0),
              }
            } else {
              // Add user to existing reaction
              return {
                ...msg,
                reactions: reactions.map((r) =>
                  r.emoji === emoji
                    ? {
                        ...r,
                        count: r.count + 1,
                        userIds: [...r.userIds, currentUserId!],
                        users: [
                          ...r.users,
                          {
                            id: currentUserId!,
                            name: session?.user?.name || 'You',
                          },
                        ],
                      }
                    : r,
                ),
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
                  users: [
                    { id: currentUserId!, name: session?.user?.name || 'You' },
                  ],
                },
              ],
            }
          }
        }),
      )

      // Use the isRemoving flag we determined before the optimistic update
      if (isRemoving) {
        // Remove reaction via API
        await fetch(
          `/api/chat/reactions/${messageId}?emoji=${encodeURIComponent(emoji)}`,
          {
            method: 'DELETE',
          },
        )

        // Emit socket event
        if (socket && isConnected) {
          socket.emit('send-reaction', {
            messageId,
            conversationId,
            emoji,
            action: 'remove',
          })
        }
      } else {
        // Add reaction via API
        await fetch(`/api/chat/reactions/${messageId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emoji }),
        })

        // Emit socket event
        if (socket && isConnected) {
          socket.emit('send-reaction', {
            messageId,
            conversationId,
            emoji,
            action: 'add',
          })
        }
      }

      // Restore scroll position after state update (only if we have a valid position)
      if (scrollTop > 0) {
        setTimeout(() => {
          if (messagesContainer) {
            messagesContainer.scrollTop = scrollTop
          }
        }, 0)
      }
    } catch (error) {
      console.error('[Chat] Error handling reaction:', error)
      // TODO: Revert optimistic update on error
    }
  }

  const handleReactionClick = async (messageId: string, emoji: string) => {
    if (!conversationId || !currentUserId) return

    try {
      const message = messages.find((m) => m.id === messageId)
      const reaction = message?.reactions?.find((r) => r.emoji === emoji)
      const isRemoving = reaction?.userIds.includes(currentUserId)

      // Optimistic update (same logic as handleEmojiSelect)
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id !== messageId) return msg

          const reactions = msg.reactions || []
          const existingReaction = reactions.find((r) => r.emoji === emoji)

          if (existingReaction?.userIds.includes(currentUserId)) {
            // Remove reaction
            return {
              ...msg,
              reactions: reactions
                .map((r) =>
                  r.emoji === emoji
                    ? {
                        ...r,
                        count: r.count - 1,
                        userIds: r.userIds.filter((id) => id !== currentUserId),
                        users: r.users.filter((u) => u.id !== currentUserId),
                      }
                    : r,
                )
                .filter((r) => r.count > 0),
            }
          } else {
            // Add reaction
            if (existingReaction) {
              return {
                ...msg,
                reactions: reactions.map((r) =>
                  r.emoji === emoji
                    ? {
                        ...r,
                        count: r.count + 1,
                        userIds: [...r.userIds, currentUserId],
                        users: [
                          ...r.users,
                          {
                            id: currentUserId,
                            name: session?.user?.name || 'You',
                          },
                        ],
                      }
                    : r,
                ),
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
                    users: [
                      { id: currentUserId, name: session?.user?.name || 'You' },
                    ],
                  },
                ],
              }
            }
          }
        }),
      )

      if (isRemoving) {
        await fetch(
          `/api/chat/reactions/${messageId}?emoji=${encodeURIComponent(emoji)}`,
          {
            method: 'DELETE',
          },
        )

        if (socket && isConnected) {
          socket.emit('send-reaction', {
            messageId,
            conversationId,
            emoji,
            action: 'remove',
          })
        }
      } else {
        await fetch(`/api/chat/reactions/${messageId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emoji }),
        })

        if (socket && isConnected) {
          socket.emit('send-reaction', {
            messageId,
            conversationId,
            emoji,
            action: 'add',
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
    <div 
      className="md:absolute md:inset-0 fixed left-0 right-0 bg-white dark:bg-gray-900 flex flex-col overflow-hidden z-50 transition-all duration-200 ease-out"
      style={isMobile ? {
        top: viewportOffset.top > 0 ? `${viewportOffset.top - 1}px` : '0px',
        bottom: '0px',
        height: viewportOffset.height > 0 ? `${viewportOffset.height}px` : '100vh'
      } : undefined}
    >
      {/* Resize handle - only on desktop */}
      {onResize && (
        <div
          className="hidden md:block absolute left-0 top-0 bottom-0 w-1 hover:w-2 cursor-col-resize bg-transparent hover:bg-blue-500 transition-all z-[60]"
          onMouseDown={(e) => {
            e.preventDefault()
            setIsResizingDrawer(true)
            onResize(true)
          }}
        />
      )}

      {/* Header - Fixed at top, outside scroll container */}
      <div
        className={`flex-shrink-0 z-10 flex items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition-all ${
          isKeyboardOpen ? 'p-2' : 'p-4'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {/* Dot indicator - green when unread messages in other conversations, gray otherwise */}
            <span
              className={`w-2 h-2 rounded-full flex-shrink-0 ${
                hasOtherUnread ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            />
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
                  className="p-2 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                >
                  <Check size={24} />
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                >
                  <X size={24} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h2
                  className={`font-semibold text-gray-900 dark:text-white truncate ${
                    isKeyboardOpen ? 'text-base' : 'text-lg'
                  }`}
                >
                  {conversationName}
                </h2>
                {conversationId && (
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <Pencil size={20} />
                  </button>
                )}
              </div>
            )}
            {shouldTruncateName ? (
              <TooltipProvider>
                <Tooltip
                  open={showParticipantList}
                  onOpenChange={setShowParticipantList}
                >
                  <TooltipTrigger asChild>
                    <button
                      className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                      onClick={() =>
                        setShowParticipantList(!showParticipantList)
                      }
                    >
                      {participantCount} participant
                      {participantCount > 1 ? 's' : ''}
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

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        data-messages-container
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
        ) : (
          Object.entries(groupedMessages).map(([dateKey, dayMessages]) => (
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
                const isModerated = message.isDeleted || message.isHidden
                const showAvatar =
                  !isCurrentUser &&
                  (index === 0 ||
                    dayMessages[index - 1]?.authorId !== message.authorId)

                // Show centered timestamp if more than 5 minutes since last message
                const prevMessage = dayMessages[index - 1]
                const timeDiff = prevMessage
                  ? (message.timestamp.getTime() -
                      prevMessage.timestamp.getTime()) /
                    1000 /
                    60
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
                          {showAvatar &&
                            (message.authorPhoto ? (
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
                                  {message.authorName
                                    .split(' ')
                                    .map((n) => n[0])
                                    .join('')}
                                </span>
                              </div>
                            ))}
                        </div>
                      )}

                      <div
                        className={`flex flex-col ${
                          isCurrentUser ? 'items-end' : 'items-start'
                        } max-w-[85%]`}
                      >
                        {!isCurrentUser && showAvatar && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 mb-1 px-3">
                            {message.authorName}
                          </span>
                        )}

                        <div
                          className={`px-4 py-2 rounded-2xl relative group transition-all ${
                            moderationMenuMessageId === message.id ||
                            moderationButtonVisibleId === message.id
                              ? 'min-h-[52px] pr-16'
                              : isModerated
                              ? 'pr-4'
                              : 'pr-4'
                          } ${
                            isCurrentUser
                              ? 'bg-blue-500'
                              : 'bg-gray-100 dark:bg-gray-700'
                          } ${
                            isModerated
                              ? isCurrentUser
                                ? 'text-blue-200 dark:text-blue-300 italic'
                                : 'text-gray-400 dark:text-gray-500 italic'
                              : isCurrentUser
                              ? 'text-white'
                              : 'text-gray-900 dark:text-white'
                          }`}
                          style={{
                            WebkitTouchCallout: 'none',
                            WebkitUserSelect: 'none',
                            userSelect: 'none',
                            touchAction: 'manipulation', // Prevent system context menu on long-press
                          }}
                          onClick={(e) => {
                            // Don't handle click if user was dragging or if long press was triggered
                            const target = e.currentTarget as any
                            if (
                              isDragging ||
                              isSwiping ||
                              target.preventClick
                            ) {
                              return
                            }

                            // Click message to show/hide three-dot button (not the menu)
                            e.stopPropagation()
                            setModerationButtonVisibleId(
                              moderationButtonVisibleId === message.id
                                ? null
                                : message.id,
                            )
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
                                handleLongPress(
                                  message.id,
                                  syntheticEvent as any,
                                )
                              }
                            }, 500)
                            ;(e.currentTarget as any).mouseHoldTimer = timer
                          }}
                          onMouseUp={(e) => {
                            const timer = (e.currentTarget as any)
                              .mouseHoldTimer
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
                            } else {
                              messageBubbleRefs.current.delete(message.id)
                            }
                          }}
                          onTouchStart={(e) => {
                            const target = e.currentTarget
                            const touchTarget = e.target as HTMLElement

                            // Don't handle long press on images, links, or buttons
                            if (
                              touchTarget.tagName === 'IMG' ||
                              touchTarget.tagName === 'A' ||
                              touchTarget.tagName === 'BUTTON' ||
                              touchTarget.closest('button')
                            ) {
                              return
                            }

                            // Store touch start time and position
                            ;(target as any).touchStartTime = Date.now()
                            ;(target as any).touchStartX = e.touches[0].clientX
                            ;(target as any).touchStartY = e.touches[0].clientY

                            // Start long press timer (only triggers if held for 500ms without moving)
                            const timer = setTimeout(() => {
                              if (!isSwiping) {
                                // Prevent click event from firing after long press
                                ;(target as any).preventClick = true

                                // Create synthetic event
                                const syntheticEvent = {
                                  currentTarget: target,
                                  preventDefault: () => {},
                                } as any
                                handleLongPress(message.id, syntheticEvent)
                              }
                            }, 500)
                            ;(target as any).longPressTimer = timer
                          }}
                          onTouchEnd={(e) => {
                            const target = e.currentTarget
                            const timer = (target as any).longPressTimer
                            if (timer) clearTimeout(timer)

                            // Clear preventClick flag after a short delay to allow click to fire
                            setTimeout(() => {
                              ;(target as any).preventClick = false
                            }, 50)
                          }}
                          onTouchMove={(e) => {
                            const target = e.currentTarget
                            const timer = (target as any).longPressTimer
                            if (timer) clearTimeout(timer)

                            // Check if moved significantly (cancel long press)
                            const startX = (target as any).touchStartX
                            const startY = (target as any).touchStartY
                            if (startX !== undefined && startY !== undefined) {
                              const deltaX = Math.abs(
                                e.touches[0].clientX - startX,
                              )
                              const deltaY = Math.abs(
                                e.touches[0].clientY - startY,
                              )
                              if (deltaX > 10 || deltaY > 10) {
                                ;(target as any).preventClick = false
                              }
                            }
                          }}
                        >
                          {/* Content wrapper to prevent overlap with button */}
                          <div className={
                            moderationMenuMessageId === message.id ||
                            moderationButtonVisibleId === message.id
                              ? 'pr-12'
                              : ''
                          }>
                            {/* Message text content or edit textarea */}
                            {editingMessageId === message.id ? (
                              <div className="space-y-2">
                                <textarea
                                  value={editedContent}
                                  onChange={(e) => setEditedContent(e.target.value)}
                                  className="w-full px-3 py-2 text-xl bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg resize-none"
                                  rows={3}
                                  autoFocus
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={async () => {
                                      if (!editedContent.trim()) return
                                      
                                      // Save edit
                                      try {
                                        const response = await fetch(`/api/chat/message/${message.id}`, {
                                          method: 'PATCH',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ content: editedContent.trim() }),
                                        })
                                        
                                        if (response.ok) {
                                          const updated = await response.json()
                                          
                                          // Optimistic update
                                          setMessages(prev => prev.map(m => 
                                            m.id === message.id 
                                              ? { ...m, content: editedContent.trim(), updatedAt: new Date(updated.updatedAt) }
                                              : m
                                          ))
                                          
                                          // Emit socket event for real-time update
                                          if (socket && isConnected) {
                                            socket.emit('message-edited', {
                                              messageId: message.id,
                                              conversationId,
                                              content: editedContent.trim(),
                                              updatedAt: updated.updatedAt,
                                            })
                                          }
                                          
                                          setEditingMessageId(null)
                                          setEditedContent('')
                                        }
                                      } catch (error) {
                                        console.error('[Chat] Error editing message:', error)
                                      }
                                    }}
                                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
                                  >
                                    <Check size={16} />
                                    Save
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingMessageId(null)
                                      setEditedContent('')
                                    }}
                                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center gap-2"
                                  >
                                    <X size={16} />
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              message.content && message.content.trim() && (
                                <div>
                                  <p
                                    className="text-xl whitespace-pre-wrap"
                                    style={{ WebkitTextSizeAdjust: '100%' }}
                                  >
                                    {renderMessageContent(
                                      message.content,
                                      isCurrentUser,
                                    )}
                                  </p>
                                  {/* Show (edited) indicator if message was edited */}
                                  {message.updatedAt && message.createdAt && 
                                   message.updatedAt.getTime() > message.createdAt.getTime() && (
                                    <span className="text-xs text-gray-400 dark:text-gray-500 italic ml-2">
                                      (edited)
                                    </span>
                                  )}
                                </div>
                              )
                            )}

                            {/* Message images */}
                            {message.metadata?.images &&
                              message.metadata.images.length > 0 && (
                                <div
                                  className={`mt-2 grid gap-2 ${
                                    message.metadata.images.length === 1
                                      ? 'grid-cols-1'
                                      : message.metadata.images.length === 2
                                      ? 'grid-cols-2'
                                      : 'grid-cols-3'
                                  }`}
                                >
                                  {message.metadata.images.map((image, idx) => (
                                    <div
                                      key={idx}
                                      className="relative aspect-square max-w-xs"
                                    >
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img
                                        src={image.base64}
                                        alt={`Image ${idx + 1}`}
                                        className="w-full h-full object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                        onClick={() => {
                                          setLightboxState({
                                            isOpen: true,
                                            images: message.metadata!.images!,
                                            currentIndex: idx,
                                          })
                                        }}
                                      />
                                    </div>
                                  ))}
                                </div>
                              )}

                            {/* Link preview */}
                            {message.metadata?.links &&
                              message.metadata.links.length > 0 && (
                                <div className="mt-2">
                                  {message.metadata.links.map((link, idx) => (
                                    <a
                                      key={idx}
                                      href={link.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={`block rounded-lg border overflow-hidden hover:opacity-90 transition-opacity ${
                                        isCurrentUser
                                          ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                                          : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800'
                                      }`}
                                    >
                                    {link.image && (
                                      <div className="w-full h-48 bg-gray-200 dark:bg-gray-700">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                          src={link.image}
                                          alt={link.title || 'Link preview'}
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                    )}
                                    <div className="p-3">
                                      {link.siteName && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                          {link.siteName}
                                        </p>
                                      )}
                                      {link.title && (
                                        <p className="font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">
                                          {link.title}
                                        </p>
                                      )}
                                      {link.description && (
                                        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                                          {link.description}
                                        </p>
                                      )}
                                    </div>
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Moderation menu button - top-right corner inside bubble */}
                          {!isModerated && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                // Toggle menu open/closed
                                const isOpening =
                                  moderationMenuMessageId !== message.id
                                if (isOpening) {
                                  setModerationMenuMessageId(message.id)
                                  setModerationButtonVisibleId(message.id)
                                } else {
                                  setModerationMenuMessageId(null)
                                  setModerationButtonVisibleId(null)
                                }
                              }}
                              className={`absolute top-1/2 -translate-y-1/2 right-2 p-2.5 rounded-full transition-all ${
                                isCurrentUser
                                  ? 'hover:bg-blue-600'
                                  : 'hover:bg-gray-200 dark:hover:bg-gray-600'
                              } ${
                                // Show button if menu is open OR on mobile if button visibility toggled
                                moderationMenuMessageId === message.id ||
                                moderationButtonVisibleId === message.id
                                  ? 'opacity-100 pointer-events-auto'
                                  : 'opacity-0 pointer-events-none'
                              }`}
                            >
                              <MoreVertical
                                size={24}
                                className={
                                  isCurrentUser
                                    ? 'text-white'
                                    : 'text-gray-500 dark:text-gray-400'
                                }
                              />
                            </button>
                          )}

                          {/* Moderation menu dropdown */}
                          {moderationMenuMessageId === message.id && (
                            <div className="absolute top-10 right-2 z-30 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 min-w-[140px]">
                              <div className="py-2">
                                {/* Edit - only for message owner */}
                                {isCurrentUser && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setEditingMessageId(message.id)
                                      setEditedContent(message.content)
                                      setModerationMenuMessageId(null)
                                    }}
                                    className="w-full px-4 py-3 text-left text-base text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3"
                                  >
                                    <Edit2 size={18} />
                                    Edit
                                  </button>
                                )}
                                {/* Hide */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setConfirmDialog({
                                      isOpen: true,
                                      type: 'hide',
                                      messageId: message.id,
                                    })
                                    setModerationMenuMessageId(null)
                                  }}
                                  className="w-full px-4 py-3 text-left text-base text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3"
                                >
                                  <EyeOff size={18} />
                                  Hide
                                </button>
                                {/* Delete - only for message owner or group admin */}
                                {(isCurrentUser || isGroupAdmin) && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setConfirmDialog({
                                        isOpen: true,
                                        type: 'delete',
                                        messageId: message.id,
                                      })
                                      setModerationMenuMessageId(null)
                                    }}
                                    className="w-full px-4 py-3 text-left text-base text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3"
                                  >
                                    <Trash2 size={18} />
                                    Delete
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Reactions */}
                        {message.reactions && message.reactions.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1 px-1">
                            {message.reactions.map((reaction) => (
                              <button
                                key={reaction.emoji}
                                onClick={() =>
                                  handleReactionClick(
                                    message.id,
                                    reaction.emoji,
                                  )
                                }
                                className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm transition-all ${
                                  reaction.userIds.includes(currentUserId || '')
                                    ? 'bg-blue-100 dark:bg-blue-900 border-2 border-blue-500'
                                    : 'bg-gray-100 dark:bg-gray-700 border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                                }`}
                                title={reaction.users
                                  .map((u) => u.name)
                                  .join(', ')}
                              >
                                <span>{reaction.emoji}</span>
                                <span className="text-xs font-medium">
                                  {reaction.count}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Timestamp - shows in the right margin when swiping */}
                      <div
                        className={`absolute right-0 top-1/2 -translate-y-1/2 transition-all duration-200 ${
                          showAllTimestamps
                            ? 'opacity-100 translate-x-16'
                            : 'opacity-0 translate-x-0 pointer-events-none'
                        }`}
                      >
                        <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                          {formatTime(message.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ))
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        {/* Image previews - dynamic grid layout */}
        {pendingImages.length > 0 && (
          <div
            className={`mb-3 grid gap-2 ${
              pendingImages.length === 1
                ? 'grid-cols-1'
                : pendingImages.length === 2
                ? 'grid-cols-2'
                : 'grid-cols-3'
            }`}
          >
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
            disabled={
              (!newMessage.trim() && pendingImages.length === 0) ||
              isSendingMessage ||
              isProcessingImage
            }
            className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-600 disabled:hover:bg-gray-300 transition-colors relative"
          >
            {isSendingMessage || isProcessingImage ? (
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
        onClose={() =>
          setEmojiPickerState({
            isOpen: false,
            messageId: null,
            position: { x: 0, y: 0 },
            showAbove: true,
          })
        }
        onEmojiSelect={handleEmojiSelect}
        position={emojiPickerState.position}
        showAbove={emojiPickerState.showAbove}
      />

      {/* Image Lightbox */}
      {lightboxState.isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={() => setLightboxState({ ...lightboxState, isOpen: false })}
          onTouchStart={(e) => {
            const touch = e.touches[0]
            ;(e.currentTarget as any).touchStartX = touch.clientX
          }}
          onTouchEnd={(e) => {
            const touchStartX = (e.currentTarget as any).touchStartX
            const touchEndX = e.changedTouches[0].clientX
            const diff = touchStartX - touchEndX

            if (Math.abs(diff) > 50 && lightboxState.images.length > 1) {
              if (diff > 0) {
                // Swiped left -> next image
                setLightboxState({
                  ...lightboxState,
                  currentIndex:
                    lightboxState.currentIndex ===
                    lightboxState.images.length - 1
                      ? 0
                      : lightboxState.currentIndex + 1,
                })
              } else {
                // Swiped right -> previous image
                setLightboxState({
                  ...lightboxState,
                  currentIndex:
                    lightboxState.currentIndex === 0
                      ? lightboxState.images.length - 1
                      : lightboxState.currentIndex - 1,
                })
              }
            }
          }}
        >
          <button
            className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-black/50 text-white hover:bg-black/70 flex items-center justify-center"
            onClick={() =>
              setLightboxState({ ...lightboxState, isOpen: false })
            }
          >
            <X size={20} />
          </button>

          {lightboxState.images.length > 1 && (
            <>
              <button
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-black/50 text-white hover:bg-black/70 flex items-center justify-center"
                onClick={(e) => {
                  e.stopPropagation()
                  setLightboxState({
                    ...lightboxState,
                    currentIndex:
                      lightboxState.currentIndex === 0
                        ? lightboxState.images.length - 1
                        : lightboxState.currentIndex - 1,
                  })
                }}
              >
                <ChevronLeft size={24} />
              </button>

              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-black/50 text-white hover:bg-black/70 flex items-center justify-center"
                onClick={(e) => {
                  e.stopPropagation()
                  setLightboxState({
                    ...lightboxState,
                    currentIndex:
                      lightboxState.currentIndex ===
                      lightboxState.images.length - 1
                        ? 0
                        : lightboxState.currentIndex + 1,
                  })
                }}
              >
                <ChevronRight size={24} />
              </button>

              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 px-3 py-1 rounded-full bg-black/60 text-white text-sm">
                {lightboxState.currentIndex + 1} / {lightboxState.images.length}
              </div>
            </>
          )}

          <div
            className="relative max-w-[90vw] max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightboxState.images[lightboxState.currentIndex].base64}
              alt={`Image ${lightboxState.currentIndex + 1}`}
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
            />
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={
          confirmDialog.type === 'delete' ? 'Delete Message' : 'Hide Message'
        }
        message={
          confirmDialog.type === 'delete'
            ? 'Delete this message for everyone in the conversation? People can delete their own message (irrelevant). Group admins can delete messages they deem inappropriate.'
            : 'Hide this message for everyone in the conversation? This should only be done when you feel the message is inappropriate (illegal, offensive, disrespectful, etc.).'
        }
        confirmText={confirmDialog.type === 'delete' ? 'Delete' : 'Hide'}
        cancelText="Cancel"
        variant={confirmDialog.type === 'delete' ? 'danger' : 'warning'}
        onConfirm={async () => {
          if (!confirmDialog.messageId) return

          try {
            if (confirmDialog.type === 'delete') {
              await fetch(`/api/chat/message/${confirmDialog.messageId}`, {
                method: 'DELETE',
              })
              // Socket will broadcast the update to all clients
            } else {
              await fetch(`/api/chat/message/${confirmDialog.messageId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'hide' }),
              })
              // Socket will broadcast the update to all clients
            }
          } catch (error) {
            console.error(`Failed to ${confirmDialog.type} message:`, error)
          }

          setConfirmDialog({ isOpen: false, type: 'delete', messageId: null })
        }}
        onCancel={() => {
          setConfirmDialog({ isOpen: false, type: 'delete', messageId: null })
        }}
      />
    </div>
  )
}
