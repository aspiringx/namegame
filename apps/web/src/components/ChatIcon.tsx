'use client'

import { useState } from 'react'
import { MessageCircle } from 'lucide-react'
import ChatModal from './ChatModal'
import { useSession } from 'next-auth/react'

interface ChatIconProps {
  unreadCount?: number
}

export default function ChatIcon({ unreadCount = 0 }: ChatIconProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { data: session } = useSession()

  // Don't show chat for unauthenticated users
  if (!session?.user) {
    return null
  }

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="relative text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
        aria-label={`Chat${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <MessageCircle size={24} />
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
      
      <ChatModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  )
}
