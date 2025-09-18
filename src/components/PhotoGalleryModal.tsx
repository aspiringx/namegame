'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from './ui/button'

interface PhotoGalleryModalProps {
  isOpen: boolean
  onClose: () => void
  photoUrl: string
  memberName: string
  photoIndex: number
  totalPhotos: number
  // Navigation props
  allMembers?: Array<{ user: { photoUrl?: string; name?: string } }>
  onNavigate?: (newIndex: number) => void
}

export default function PhotoGalleryModal({
  isOpen,
  onClose,
  photoUrl,
  memberName,
  photoIndex,
  totalPhotos,
  allMembers = [],
  onNavigate,
}: PhotoGalleryModalProps) {
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null)
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null)

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  // Add keyboard listener when modal opens
  useEffect(() => {
    const handlePrevious = () => {
      if (onNavigate) {
        const newIndex = photoIndex === 0 ? totalPhotos - 1 : photoIndex - 1
        onNavigate(newIndex)
      }
    }

    const handleNext = () => {
      if (onNavigate) {
        const newIndex = photoIndex === totalPhotos - 1 ? 0 : photoIndex + 1
        onNavigate(newIndex)
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowLeft') {
        handlePrevious()
      } else if (e.key === 'ArrowRight') {
        handleNext()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose, photoIndex, totalPhotos, onNavigate])

  const canNavigatePrevious = totalPhotos > 1
  const canNavigateNext = totalPhotos > 1

  const handlePreviousClick = () => {
    if (onNavigate) {
      const newIndex = photoIndex === 0 ? totalPhotos - 1 : photoIndex - 1
      onNavigate(newIndex)
    }
  }

  const handleNextClick = () => {
    if (onNavigate) {
      const newIndex = photoIndex === totalPhotos - 1 ? 0 : photoIndex + 1
      onNavigate(newIndex)
    }
  }

  // Touch handlers for swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    setTouchStart({ x: touch.clientX, y: touch.clientY })
    setTouchEnd(null)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    setTouchEnd({ x: touch.clientX, y: touch.clientY })
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return

    const deltaX = touchStart.x - touchEnd.x
    const deltaY = touchStart.y - touchEnd.y
    const minSwipeDistance = 50

    // Horizontal swipe (left/right navigation)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
      if (deltaX > 0) {
        // Swiped left -> next photo
        if (onNavigate) {
          const newIndex = photoIndex === totalPhotos - 1 ? 0 : photoIndex + 1
          onNavigate(newIndex)
        }
      } else {
        // Swiped right -> previous photo
        if (onNavigate) {
          const newIndex = photoIndex === 0 ? totalPhotos - 1 : photoIndex - 1
          onNavigate(newIndex)
        }
      }
    }
    // Vertical swipe down (close modal)
    else if (deltaY < -minSwipeDistance) {
      onClose()
    }

    // Reset touch state
    setTouchStart(null)
    setTouchEnd(null)
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 dark:bg-black/90"
      onClick={handleBackdropClick}
    >
      <div 
        className="relative max-h-[90vh] max-w-[90vw]"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Navigation arrows */}
        {totalPhotos > 1 && onNavigate && (
          <>
            {/* Previous button */}
            <Button
              variant="ghost"
              size="icon"
              className={`absolute left-2 top-1/2 z-10 h-10 w-10 -translate-y-1/2 rounded-full bg-black/50 text-white hover:bg-black/70 ${
                !canNavigatePrevious ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              onClick={handlePreviousClick}
              disabled={!canNavigatePrevious}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>

            {/* Next button */}
            <Button
              variant="ghost"
              size="icon"
              className={`absolute right-2 top-1/2 z-10 h-10 w-10 -translate-y-1/2 rounded-full bg-black/50 text-white hover:bg-black/70 ${
                !canNavigateNext ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              onClick={handleNextClick}
              disabled={!canNavigateNext}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </>
        )}

        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 z-10 h-8 w-8 rounded-full bg-black/50 text-white hover:bg-black/70"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>

        {/* Photo counter */}
        <div className="absolute left-1/2 top-4 z-10 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-sm text-white">
          {photoIndex + 1} of {totalPhotos}
        </div>

        {/* Photo */}
        <Image
          src={photoUrl}
          alt={`${memberName}'s photo`}
          width={800}
          height={800}
          className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
        />

        {/* Member name overlay */}
        <div className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/50 px-4 py-2 text-white">
          {memberName}
        </div>
      </div>
    </div>
  )
}
