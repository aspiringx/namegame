'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import dynamic from 'next/dynamic'

// Dynamically import MakeConstellation to avoid SSR issues
const MakeConstellation = dynamic(
  () => import('@/app/constellations/MakeConstellation'),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-screen w-full items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-gray-700 border-t-indigo-500"></div>
          <p className="mt-4 text-sm text-gray-400">Loading your universe...</p>
        </div>
      </div>
    ),
  },
)

interface ConstellationModalProps {
  isOpen: boolean
  onClose: () => void
  groupName?: string
  people?: Array<{
    id: string
    name: string
    photo: string
  }>
}

export default function ConstellationModal({
  isOpen,
  onClose,
  groupName,
  people,
}: ConstellationModalProps) {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-gray-900">
      {/* Back button - floating top-left */}
      <div className="absolute left-4 top-4 z-10 sm:left-6 sm:top-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="flex items-center gap-2 bg-gray-800/80 text-white backdrop-blur-sm hover:bg-gray-700/80"
        >
          <X className="h-4 w-4" />
          <span className="hidden sm:inline">
            {groupName ? `Back to ${groupName}` : 'Back to group'}
          </span>
          <span className="sm:hidden">Back</span>
        </Button>
      </div>

      {/* Constellation experience */}
      <MakeConstellation people={people} hideHeader={true} />
    </div>
  )
}
