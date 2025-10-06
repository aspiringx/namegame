'use client'

import { useState, useEffect, useImperativeHandle, forwardRef } from 'react'
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
  
  // Listen for new messages via socket to update unread indicator
  useEffect(() => {
    if (!socket || !session?.user) return
    
    const handleNewMessage = (message: any) => {
      // If the message is from someone else, optimistically show green dot
      if (message.author?.id !== session.user?.id) {
        setHasUnread(true)
      }
      // If user sent the message themselves, no need to update
    }
    
    socket.on('message', handleNewMessage)
    
    return () => {
      socket.off('message', handleNewMessage)
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
