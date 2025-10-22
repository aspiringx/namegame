'use client'

import { useState, useEffect, useImperativeHandle, forwardRef, useRef } from 'react'
import { MessageCircle } from 'lucide-react'
import ChatDrawer from './ChatDrawer'
import { useSession } from 'next-auth/react'
import { hasUnreadMessages } from '@/app/actions/chat'
import { useSocket } from '@/context/SocketContext'

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
  const pendingUnreadTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Expose openChat method via ref
  useImperativeHandle(ref, () => ({
    openChat: () => setIsModalOpen(true)
  }))

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
  
  // Listen for new messages via socket to update unread indicator
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
    
    socket.on('message', handleNewMessage)
    
    return () => {
      socket.off('message', handleNewMessage)
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
