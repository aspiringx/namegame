'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import { X } from 'lucide-react'
import { Button } from './ui/button'

interface PhotoGalleryModalProps {
  isOpen: boolean
  onClose: () => void
  photoUrl: string
  memberName: string
  photoIndex: number
  totalPhotos: number
}

export default function PhotoGalleryModal({
  isOpen,
  onClose,
  photoUrl,
  memberName,
  photoIndex,
  totalPhotos,
}: PhotoGalleryModalProps) {
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  // Add keyboard listener when modal opens
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 dark:bg-black/90"
      onClick={handleBackdropClick}
    >
      <div className="relative max-h-[90vh] max-w-[90vw]">
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
