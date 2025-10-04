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
    const newSocket = io('http://localhost:3001', {
      auth: {
        userId: session.user.id
      }
    })

    newSocket.on('connect', () => {
      console.log('[Socket] Connected to chat service')
      setIsConnected(true)
    })

    newSocket.on('disconnect', () => {
      console.log('[Socket] Disconnected from chat service')
      setIsConnected(false)
    })

    newSocket.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error)
      setIsConnected(false)
    })

    // Handle incoming messages
    newSocket.on('new_message', (message) => {
      console.log('[Socket] Received message:', message)
      // TODO: Update message state in chat components
    })

    // Handle typing indicators
    newSocket.on('user_typing', (data) => {
      console.log('[Socket] User typing:', data)
      // TODO: Update typing state in chat components
    })

    newSocket.on('user_stopped_typing', (data) => {
      console.log('[Socket] User stopped typing:', data)
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

    socket.emit('send_message', {
      conversationId,
      content,
      type: 'text'
    })
  }

  const joinConversation = (conversationId: string) => {
    if (!socket || !isConnected) return
    
    socket.emit('join_conversation', conversationId)
    console.log('[Socket] Joined conversation:', conversationId)
  }

  const leaveConversation = (conversationId: string) => {
    if (!socket || !isConnected) return
    
    socket.emit('leave_conversation', conversationId)
    console.log('[Socket] Left conversation:', conversationId)
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
