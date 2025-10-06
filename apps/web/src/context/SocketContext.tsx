'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { io, Socket } from 'socket.io-client'
import { useSession } from 'next-auth/react'

interface SocketContextType {
  socket: Socket | null
  isConnected: boolean
  sendMessage: (conversationId: string, content: string) => void
  joinConversation: (conversationId: string) => void
  leaveConversation: (conversationId: string) => void
}

const SocketContext = createContext<SocketContextType | null>(null)

export function useSocket() {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}

interface SocketProviderProps {
  children: ReactNode
}

export function SocketProvider({ children }: SocketProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const { data: session } = useSession()

  useEffect(() => {
    if (!session?.user) return

    // Connect to chat service
    // Production: connects to separate chat.namegame.app subdomain
    // Development: connects directly to chat service on port 3001
    const chatUrl = process.env.NEXT_PUBLIC_CHAT_URL || 
      (process.env.NODE_ENV === 'production' 
        ? 'https://chat.namegame.app'
        : 'http://localhost:3001')
    
    const newSocket = io(chatUrl, {
      path: '/socket.io',
      transports: ['websocket', 'polling'], // Try websocket first, fall back to polling
      auth: {
        userId: session.user.id
      }
    })

    newSocket.on('connect', () => {
      setIsConnected(true)
    })

    newSocket.on('disconnect', () => {
      setIsConnected(false)
    })

    newSocket.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error)
      setIsConnected(false)
    })

    // Handle incoming messages
    newSocket.on('message', (message) => {
      console.log('[SocketContext] Received message event:', message)
      // Messages are handled by individual components listening to socket.on('message')
      // This handler just logs for debugging
    })

    // Handle typing indicators
    newSocket.on('user_typing', (_data) => {
      // TODO: Update typing state in chat components
    })

    newSocket.on('user_stopped_typing', (_data) => {
      // TODO: Update typing state in chat components
    })

    setSocket(newSocket)

    return () => {
      newSocket.close()
    }
  }, [session])

  const sendMessage = (conversationId: string, content: string) => {
    if (!socket || !isConnected) {
      console.error('[Socket] Cannot send message: not connected')
      return
    }

    socket.emit('send-message', {
      conversationId,
      content,
      type: 'text'
    })
  }

  const joinConversation = (conversationId: string) => {
    if (!socket || !isConnected) return
    socket.emit('join-conversation', conversationId)
  }

  const leaveConversation = (conversationId: string) => {
    if (!socket || !isConnected) return
    socket.emit('leave-conversation', conversationId)
  }

  const value: SocketContextType = {
    socket,
    isConnected,
    sendMessage,
    joinConversation,
    leaveConversation
  }

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  )
}
