'use client'

import { useState, useEffect } from 'react'
import { MessageCircle } from 'lucide-react'
import ChatDrawer from './ChatDrawer'
import { useSession } from 'next-auth/react'
import { hasUnreadMessages } from '@/app/actions/chat'

interface ChatIconProps {
  // No props needed - we'll fetch unread status internally
}

export default function ChatIcon({}: ChatIconProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [hasUnread, setHasUnread] = useState(false)
  const { data: session } = useSession()

  // Check for unread messages on mount and when modal closes
  useEffect(() => {
    if (session?.user) {
      hasUnreadMessages().then(setHasUnread)
    }
  }, [session?.user, isModalOpen])

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
}
