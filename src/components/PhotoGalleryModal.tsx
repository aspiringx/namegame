'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from './ui/button'

// Client-side helper to get next larger image size
function getNextSizeUrl(currentUrl: string): string {
  // Handle external URLs or default avatar
  if (currentUrl.startsWith('http') || currentUrl.includes('default-avatar')) {
    return currentUrl
  }

  // Parse the URL to find current size and upgrade to next size
  const sizeUpgrade: { [key: string]: string } = {
    'thumb': 'small',
    'small': 'medium', 
    'medium': 'large',
    'large': 'large' // Already at max size
  }

  // Find and replace the size in the URL
  for (const [currentSize, nextSize] of Object.entries(sizeUpgrade)) {
    if (currentUrl.includes(`.${currentSize}.webp`)) {
      return currentUrl.replace(`.${currentSize}.webp`, `.${nextSize}.webp`)
    }
  }

  // If no size pattern found, return original URL
  return currentUrl
}

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
  
  // Zoom state
  const [scale, setScale] = useState(1)
  const [translateX, setTranslateX] = useState(0)
  const [translateY, setTranslateY] = useState(0)
  const [lastTap, setLastTap] = useState(0)
  const [isPanning, setIsPanning] = useState(false)

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

  // Reset zoom when photo changes
  useEffect(() => {
    setScale(1)
    setTranslateX(0)
    setTranslateY(0)
    setIsPanning(false)
  }, [photoIndex])

  // Preload adjacent photos for smooth navigation
  useEffect(() => {
    if (!allMembers || allMembers.length <= 1) return

    const preloadImage = (url: string) => {
      const img = new window.Image()
      img.src = getNextSizeUrl(url)
    }

    // Preload previous 2 and next 2 photos
    for (let offset = -2; offset <= 2; offset++) {
      if (offset === 0) continue // Skip current photo
      
      const targetIndex = (photoIndex + offset + allMembers.length) % allMembers.length
      const member = allMembers[targetIndex]
      
      if (member?.user?.photoUrl) {
        preloadImage(member.user.photoUrl)
      }
    }
  }, [photoIndex, allMembers])

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

  // Zoom functions
  const handleDoubleTap = () => {
    if (scale === 1) {
      setScale(2)
    } else {
      setScale(1)
      setTranslateX(0)
      setTranslateY(0)
    }
  }

  // Touch handlers for swipe and zoom gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    const now = Date.now()
    
    setTouchStart({ x: touch.clientX, y: touch.clientY })
    setTouchEnd(null)
    
    // Double-tap detection
    if (now - lastTap < 300) {
      handleDoubleTap()
      setLastTap(0)
    } else {
      setLastTap(now)
    }
    
    // If already zoomed, enable panning
    if (scale > 1) {
      setIsPanning(true)
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    setTouchEnd({ x: touch.clientX, y: touch.clientY })
    
    // Handle panning when zoomed with constraints
    if (isPanning && touchStart && scale > 1) {
      const deltaX = touch.clientX - touchStart.x
      const deltaY = touch.clientY - touchStart.y
      
      // Calculate new positions
      let newTranslateX = translateX + deltaX
      let newTranslateY = translateY + deltaY
      
      // Constrain panning to keep photo visible
      // When scaled 2x, the image is twice as large, so we can pan up to 50% in each direction
      const maxTranslate = (scale - 1) * 200 // Adjust based on image size
      newTranslateX = Math.max(-maxTranslate, Math.min(maxTranslate, newTranslateX))
      newTranslateY = Math.max(-maxTranslate, Math.min(maxTranslate, newTranslateY))
      
      setTranslateX(newTranslateX)
      setTranslateY(newTranslateY)
      setTouchStart({ x: touch.clientX, y: touch.clientY })
    }
  }

  const handleTouchEnd = () => {
    setIsPanning(false)
    
    if (!touchStart || !touchEnd) return

    const deltaX = touchStart.x - touchEnd.x
    const deltaY = touchStart.y - touchEnd.y
    const minSwipeDistance = 50

    // Don't navigate if zoomed in (allow panning instead)
    if (scale > 1) {
      setTouchStart(null)
      setTouchEnd(null)
      return
    }

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

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 dark:bg-black/90"
      style={{ left: 0, right: 0, top: 0, bottom: 0, width: '100vw', height: '100vh' }}
      onClick={handleBackdropClick}
    >
      <div 
        className="relative max-h-[90vh] max-w-[90vw] md:max-h-[90vh] md:max-w-[90vw] lg:max-h-[95vh] lg:max-w-[95vw]"
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
              className={`absolute left-2 top-1/2 z-10 h-12 w-12 -translate-y-1/2 rounded-full text-white hover:bg-black/40 ${
                !canNavigatePrevious ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              onClick={handlePreviousClick}
              disabled={!canNavigatePrevious}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black/25">
                <ChevronLeft className="h-4 w-4" />
              </div>
            </Button>

            {/* Next button */}
            <Button
              variant="ghost"
              size="icon"
              className={`absolute right-2 top-1/2 z-10 h-12 w-12 -translate-y-1/2 rounded-full text-white hover:bg-black/40 ${
                !canNavigateNext ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              onClick={handleNextClick}
              disabled={!canNavigateNext}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black/25">
                <ChevronRight className="h-4 w-4" />
              </div>
            </Button>
          </>
        )}

        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 z-10 h-10 w-10 rounded-full bg-black/25 text-white hover:bg-black/40"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>

        {/* Photo counter */}
        <div className="absolute left-1/2 top-3 z-10 -translate-x-1/2 rounded-full bg-black/25 px-2 py-1 text-xs text-white">
          {photoIndex + 1} of {totalPhotos}
        </div>

        {/* Photo */}
        <Image
          src={getNextSizeUrl(photoUrl)}
          alt={`${memberName}'s photo`}
          width={800}
          height={800}
          className="h-[90vh] w-[90vw] md:h-[90vh] md:w-[90vw] lg:h-[95vh] lg:w-[95vw] rounded-lg object-cover transition-transform duration-200"
          style={{
            transform: `scale(${scale}) translate(${translateX}px, ${translateY}px)`,
            transformOrigin: 'center center',
            objectFit: 'contain',
          }}
          sizes="100vw"
        />

        {/* Member name overlay */}
        <div className="absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/25 px-3 py-1 text-sm text-white">
          {memberName}
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
