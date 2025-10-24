'use client'

import { useState, useEffect, useImperativeHandle, forwardRef, useRef, useCallback } from 'react'
import { MessageCircle } from 'lucide-react'
import ChatDrawer from './ChatDrawer'
import { useSession } from 'next-auth/react'
import { hasUnreadMessages } from '@/app/actions/chat'
import { useSocket } from '@/context/SocketContext'
import { useRouter, useSearchParams } from 'next/navigation'

interface ChatIconProps {
  // No props needed - we'll fetch unread status internally
}

export interface ChatIconRef {
  openChat: () => void
}

const ChatIcon = forwardRef<ChatIconRef, ChatIconProps>(function ChatIcon({}, ref) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [hasUnread, setHasUnread] = useState(false)
  const { data: session } = useSession()
  const { socket } = useSocket()
  const router = useRouter()
  const searchParams = useSearchParams()
  const pendingUnreadTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isInitialMount = useRef(true)

  // Expose openChat method via ref
  useImperativeHandle(ref, () => ({
    openChat: () => {
      setIsModalOpen(true)
      updateURL('open')
    }
  }))

  // Helper to update URL without adding to history
  const updateURL = useCallback((chatState: string | null) => {
    const params = new URLSearchParams(window.location.search)
    
    if (chatState) {
      params.set('chat', chatState)
    } else {
      params.delete('chat')
      params.delete('msg') // Also clear message param when closing
    }
    
    const newURL = params.toString() ? `?${params.toString()}` : window.location.pathname
    router.replace(newURL, { scroll: false })
  }, [router])

  // Read URL params on mount to restore chat state
  useEffect(() => {
    if (!isInitialMount.current) return
    isInitialMount.current = false
    
    const chatParam = searchParams.get('chat')
    if (chatParam) {
      setIsModalOpen(true)
      // ChatDrawer will handle opening the specific conversation
    } else {
      // Fallback to localStorage for refresh without URL params
      const savedState = localStorage.getItem('chatDrawerState')
      if (savedState) {
        try {
          const { isOpen } = JSON.parse(savedState)
          if (isOpen) {
            setIsModalOpen(true)
          }
        } catch {
          // Ignore parse errors
        }
      }
    }
  }, [searchParams])

  // Sync URL when drawer opens/closes
  useEffect(() => {
    if (isInitialMount.current) return
    
    if (isModalOpen) {
      const chatParam = searchParams.get('chat')
      // Only update if not already set (to preserve conversation ID)
      if (!chatParam) {
        updateURL('open')
      }
      // Save to localStorage
      localStorage.setItem('chatDrawerState', JSON.stringify({ isOpen: true }))
    } else {
      updateURL(null)
      localStorage.setItem('chatDrawerState', JSON.stringify({ isOpen: false }))
    }
  }, [isModalOpen, searchParams, updateURL])

  // Check for unread messages on mount and when modal closes
  useEffect(() => {
    if (session?.user) {
      hasUnreadMessages().then(setHasUnread)
    }
  }, [session?.user, isModalOpen])
  
  // Listen for conversation read events via BroadcastChannel
  useEffect(() => {
    if (!session?.user) return
    
    const channel = new BroadcastChannel('chat_read_updates')
    const handleReadUpdate = () => {
      // Cancel any pending timeout that would show green dot
      if (pendingUnreadTimeoutRef.current) {
        clearTimeout(pendingUnreadTimeoutRef.current)
        pendingUnreadTimeoutRef.current = null
      }
      // Refetch unread status when any conversation is marked as read
      hasUnreadMessages().then(setHasUnread)
    }
    channel.addEventListener('message', handleReadUpdate)
    
    return () => {
      channel.removeEventListener('message', handleReadUpdate)
      channel.close()
    }
  }, [session?.user])
  
  // Listen for new messages and reactions via socket to update unread indicator
  useEffect(() => {
    if (!socket || !session?.user) return
    
    const handleNewMessage = (message: any) => {
      // If the message is from someone else, delay showing green dot
      // This allows auto-mark-as-read to complete first if conversation is open
      if (message.author?.id !== session.user?.id) {
        // Clear any existing timeout first
        if (pendingUnreadTimeoutRef.current) {
          clearTimeout(pendingUnreadTimeoutRef.current)
        }
        // Set new timeout
        pendingUnreadTimeoutRef.current = setTimeout(() => {
          setHasUnread(true)
          pendingUnreadTimeoutRef.current = null
        }, 400) // 400ms delay - enough time for auto-mark-as-read to complete
      }
      // If user sent the message themselves, no need to update
    }
    
    const handleReaction = (data: any) => {
      // Only show green dot when someone ADDS a reaction to YOUR message
      // Check: action is 'add', message author is you, and reactor is not you
      if (data.action === 'add' && data.messageAuthorId === session.user?.id && data.userId !== session.user?.id) {
        // Clear any existing timeout first
        if (pendingUnreadTimeoutRef.current) {
          clearTimeout(pendingUnreadTimeoutRef.current)
        }
        // Set new timeout
        pendingUnreadTimeoutRef.current = setTimeout(() => {
          setHasUnread(true)
          pendingUnreadTimeoutRef.current = null
        }, 400)
      }
    }
    
    socket.on('message', handleNewMessage)
    socket.on('reaction', handleReaction)
    
    return () => {
      socket.off('message', handleNewMessage)
      socket.off('reaction', handleReaction)
      if (pendingUnreadTimeoutRef.current) {
        clearTimeout(pendingUnreadTimeoutRef.current)
        pendingUnreadTimeoutRef.current = null
      }
    }
  }, [socket, session?.user])

  // Don't show chat for unauthenticated users
  if (!session?.user) {
    return null
  }

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="relative text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
        aria-label={`Chat${hasUnread ? ' (unread messages)' : ''}`}
      >
        <MessageCircle size={24} />
        {hasUnread && (
          <span className="absolute top-0 right-0 w-2 h-2 bg-green-500 rounded-full" />
        )}
      </button>
      
      <ChatDrawer isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  )
})

export default ChatIcon
