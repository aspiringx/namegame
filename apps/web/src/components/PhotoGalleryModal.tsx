'use client'

import { useEffect, useState, useCallback } from 'react'
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
  const [isPanning, setIsPanning] = useState(false)
  const [panStartTranslate, setPanStartTranslate] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [scale, setScale] = useState(1)
  const [translateX, setTranslateX] = useState(0)
  const [translateY, setTranslateY] = useState(0)
  const [lastTap, setLastTap] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [mouseStart, setMouseStart] = useState<{ x: number; y: number } | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  // Zoom functions
  const handleDoubleTap = useCallback(() => {
    if (scale === 1) {
      setScale(2)
    } else {
      setScale(1)
      setTranslateX(0)
      setTranslateY(0)
    }
  }, [scale])

  // Mouse handlers for desktop panning
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true)
      setMouseStart({ x: e.clientX, y: e.clientY })
      setPanStartTranslate({ x: translateX, y: translateY })
      e.preventDefault()
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && mouseStart && scale > 1) {
      const deltaX = e.clientX - mouseStart.x
      const deltaY = e.clientY - mouseStart.y
      
      // Calculate new positions based on cumulative movement from original mouse start
      let newTranslateX = panStartTranslate.x + deltaX
      let newTranslateY = panStartTranslate.y + deltaY
      
      // Constrain panning to keep photo visible
      const maxTranslate = (scale - 1) * 200
      newTranslateX = Math.max(-maxTranslate, Math.min(maxTranslate, newTranslateX))
      newTranslateY = Math.max(-maxTranslate, Math.min(maxTranslate, newTranslateY))
      
      setTranslateX(newTranslateX)
      setTranslateY(newTranslateY)
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    setMouseStart(null)
  }

  // Enhanced keyboard accessibility when modal opens
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return
      
      switch (e.key) {
        case 'Escape':
          onClose()
          break
        case 'ArrowLeft':
          e.preventDefault()
          if (onNavigate && !isTransitioning && totalPhotos > 1) {
            setIsTransitioning(true)
            const newIndex = photoIndex === 0 ? totalPhotos - 1 : photoIndex - 1
            onNavigate(newIndex)
            setTimeout(() => setIsTransitioning(false), 300)
          }
          break
        case 'ArrowRight':
          e.preventDefault()
          if (onNavigate && !isTransitioning && totalPhotos > 1) {
            setIsTransitioning(true)
            const newIndex = photoIndex === totalPhotos - 1 ? 0 : photoIndex + 1
            onNavigate(newIndex)
            setTimeout(() => setIsTransitioning(false), 300)
          }
          break
        case ' ':
        case 'Enter':
          e.preventDefault()
          // Space or Enter toggles zoom
          handleDoubleTap()
          break
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.addEventListener('mouseup', handleMouseUp)
      // Focus management - trap focus in modal
      document.body.style.overflow = 'hidden'
      
      return () => {
        document.removeEventListener('keydown', handleKeyDown)
        document.removeEventListener('mouseup', handleMouseUp)
        document.body.style.overflow = 'unset'
      }
    }
  }, [isOpen, onClose, photoIndex, totalPhotos, onNavigate, isTransitioning, handleDoubleTap])

  // Reset zoom when photo changes
  useEffect(() => {
    setScale(1)
    setTranslateX(0)
    setTranslateY(0)
    setIsPanning(false)
  }, [photoIndex])

  // Preload adjacent photos for smooth navigation
  useEffect(() => {
    if (!allMembers || allMembers.length <= 1 || typeof window === 'undefined') return

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
    if (onNavigate && !isTransitioning) {
      setIsTransitioning(true)
      const newIndex = photoIndex === 0 ? totalPhotos - 1 : photoIndex - 1
      onNavigate(newIndex)
      // Reset transition state after animation
      setTimeout(() => setIsTransitioning(false), 300)
    }
  }

  const handleNextClick = () => {
    if (onNavigate && !isTransitioning) {
      setIsTransitioning(true)
      const newIndex = photoIndex === totalPhotos - 1 ? 0 : photoIndex + 1
      onNavigate(newIndex)
      // Reset transition state after animation
      setTimeout(() => setIsTransitioning(false), 300)
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
    
    // If already zoomed, enable panning and store current translate values
    if (scale > 1) {
      setIsPanning(true)
      setPanStartTranslate({ x: translateX, y: translateY })
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    setTouchEnd({ x: touch.clientX, y: touch.clientY })
    
    // Handle panning when zoomed with constraints
    if (isPanning && touchStart && scale > 1) {
      const deltaX = touch.clientX - touchStart.x
      const deltaY = touch.clientY - touchStart.y
      
      // Calculate new positions based on cumulative movement from original touch start
      let newTranslateX = panStartTranslate.x + deltaX
      let newTranslateY = panStartTranslate.y + deltaY
      
      // Constrain panning to keep photo visible
      const maxTranslate = (scale - 1) * 200
      newTranslateX = Math.max(-maxTranslate, Math.min(maxTranslate, newTranslateX))
      newTranslateY = Math.max(-maxTranslate, Math.min(maxTranslate, newTranslateY))
      
      setTranslateX(newTranslateX)
      setTranslateY(newTranslateY)
      // Don't update touchStart during move - this was causing the jitter
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

  if (!isOpen || typeof window === 'undefined') return null

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 dark:bg-black/90"
      style={{ left: 0, right: 0, top: 0, bottom: 0, width: '100vw', height: '100vh' }}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="Photo gallery"
      aria-describedby="photo-counter"
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
              aria-label="Previous photo"
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
              aria-label="Next photo"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black/25">
                <ChevronRight className="h-4 w-4" />
              </div>
            </Button>
          </>
        )}

        {/* Close button - positioned relative to viewport, aligned with counter */}
        <Button
          variant="ghost"
          size="icon"
          className="fixed right-4 top-4 z-20 h-8 w-8 rounded-full bg-black/25 text-white hover:bg-black/40"
          onClick={onClose}
          aria-label="Close photo gallery"
        >
          <X className="h-4 w-4" />
        </Button>

        {/* Photo counter - positioned relative to viewport */}
        <div 
          id="photo-counter"
          className="fixed left-1/2 top-4 z-20 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs text-white border border-white/20 backdrop-blur-sm"
          aria-live="polite"
          aria-atomic="true"
        >
          {photoIndex + 1} of {totalPhotos}
        </div>

        {/* Photo */}
        <Image
          src={getNextSizeUrl(photoUrl)}
          alt={`Photo of ${memberName}, image ${photoIndex + 1} of ${totalPhotos}`}
          width={800}
          height={800}
          className={`h-[90vh] w-[90vw] md:h-[90vh] md:w-[90vw] lg:h-[95vh] lg:w-[95vw] max-w-[1920px] rounded-lg object-cover transition-all duration-300 ease-out ${
            scale > 1 ? 'cursor-grab' : 'cursor-pointer'
          } ${isDragging ? 'cursor-grabbing' : ''}`}
          style={{
            transform: `scale(${scale}) translate(${translateX}px, ${translateY}px)`,
            transformOrigin: 'center center',
            objectFit: 'contain',
          }}
          sizes="100vw"
          role="img"
          aria-describedby="member-name"
          onDoubleClick={handleDoubleTap}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
        />

        {/* Member name overlay - positioned relative to viewport */}
        <div 
          id="member-name"
          className="fixed bottom-6 left-1/2 z-20 -translate-x-1/2 rounded-full bg-black/60 px-4 py-2 text-sm text-white border border-white/20 backdrop-blur-sm text-center whitespace-nowrap max-w-[calc(100vw-2rem)]"
        >
          {memberName}
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
