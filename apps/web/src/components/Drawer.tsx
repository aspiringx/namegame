'use client'

import { ReactNode } from 'react'
import { X } from 'lucide-react'

interface DrawerProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  title?: string
  width?: 'sm' | 'md' | 'lg' | 'full'
}

const widthClasses = {
  sm: 'w-full md:w-[300px]',
  md: 'w-full md:w-[400px]',
  lg: 'w-full md:w-[600px]',
  full: 'w-full'
}

export default function Drawer({ 
  isOpen, 
  onClose, 
  children, 
  title,
  width = 'md' 
}: DrawerProps) {
  if (!isOpen) return null

  return (
    <>
      {/* Backdrop - only on mobile, allows interaction on desktop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 md:bg-transparent md:pointer-events-none transition-opacity"
      />

      {/* Drawer - slides in from right */}
      <div className={`fixed top-0 right-0 h-full z-50 bg-white dark:bg-gray-800 shadow-2xl ${widthClasses[width]} flex flex-col transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
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
