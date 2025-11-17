'use client'

import { ReactNode, useState, useEffect, useRef } from 'react'
import { X } from 'lucide-react'

interface DrawerProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  title?: string
  width?: 'sm' | 'md' | 'lg' | 'full'
  resizable?: boolean
  storageKey?: string
}

const widthClasses = {
  sm: 'w-full md:w-[300px]',
  md: 'w-full md:w-[400px]',
  lg: 'w-full md:w-[600px]',
  full: 'w-full',
}

const MIN_WIDTH = 400
const MAX_WIDTH_VW = 40

export default function Drawer({
  isOpen,
  onClose,
  children,
  title,
  width = 'md',
  resizable = false,
  storageKey = 'drawer-width',
}: DrawerProps) {
  const [drawerWidth, setDrawerWidth] = useState<number | null>(null)
  const [isResizing, setIsResizing] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)
  const [swipeStartX, setSwipeStartX] = useState<number | null>(null)
  const [swipeOffset, setSwipeOffset] = useState(0)
  const drawerRef = useRef<HTMLDivElement>(null)

  // Detect desktop on mount
  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 768)
    }
    checkDesktop()
    window.addEventListener('resize', checkDesktop)
    return () => window.removeEventListener('resize', checkDesktop)
  }, [])

  // Load saved width from localStorage on mount (always, not just when resizable)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        setDrawerWidth(parseInt(saved, 10))
      }
    }
  }, [storageKey])

  // Handle mouse move during resize
  useEffect(() => {
    if (!isResizing) return

    const handleMouseMove = (e: MouseEvent) => {
      const maxWidth = window.innerWidth * (MAX_WIDTH_VW / 100)
      const newWidth = Math.max(
        MIN_WIDTH,
        Math.min(window.innerWidth - e.clientX, maxWidth),
      )
      setDrawerWidth(newWidth)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      if (drawerWidth && typeof window !== 'undefined') {
        localStorage.setItem(storageKey, drawerWidth.toString())
      }
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing, drawerWidth, storageKey])

  if (!isOpen) return null

  // Only apply custom width on desktop, let mobile use full width
  const drawerStyle =
    isDesktop && drawerWidth ? { width: `${drawerWidth}px` } : undefined

  return (
    <>
      {/* Backdrop - only on mobile, allows interaction on desktop */}
      <div className="fixed inset-0 bg-black/50 z-40 md:bg-transparent md:pointer-events-none transition-opacity" />

      {/* Drawer - slides in from right */}
      <div
        ref={drawerRef}
        data-chat-drawer
        className={`fixed top-0 md:top-[64px] right-0 h-full md:h-[calc(100vh-64px)] z-50 bg-white bg-gray-800 shadow-2xl ${
          !drawerWidth ? widthClasses[width] : 'w-full'
        } flex flex-col ${
          isResizing || swipeOffset > 0
            ? ''
            : 'transition-transform duration-300'
        } ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        style={{
          ...drawerStyle,
          transform:
            swipeOffset > 0 ? `translateX(${swipeOffset}px)` : undefined,
        }}
        onTouchStart={(e) => {
          if (!isDesktop && isOpen) {
            setSwipeStartX(e.touches[0].clientX)
          }
        }}
        onTouchMove={(e) => {
          if (!isDesktop && swipeStartX !== null) {
            const currentX = e.touches[0].clientX
            const diff = currentX - swipeStartX

            // Only allow swiping right (positive diff)
            if (diff > 0) {
              setSwipeOffset(diff)
            }
          }
        }}
        onTouchEnd={() => {
          if (!isDesktop && swipeOffset > 0) {
            // Close if swiped more than 100px
            if (swipeOffset > 100) {
              onClose()
            }
            setSwipeOffset(0)
            setSwipeStartX(null)
          }
        }}
      >
        {/* Resize handle - only on desktop when resizable */}
        {resizable && (
          <div
            className="hidden md:block absolute left-0 top-0 bottom-0 w-1 hover:w-2 cursor-col-resize bg-transparent hover:bg-blue-500 transition-all z-10"
            onMouseDown={(e) => {
              e.preventDefault()
              setIsResizing(true)
            }}
          />
        )}

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 text-white">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-400 hover:text-white"
            >
              <X size={24} />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col relative">
          {children}
        </div>
      </div>
    </>
  )
}
