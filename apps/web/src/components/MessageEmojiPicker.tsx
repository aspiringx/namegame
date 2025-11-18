'use client'

import { createPortal } from 'react-dom'
import { useEffect, useState } from 'react'
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react'

interface MessageEmojiPickerProps {
  isOpen: boolean
  onClose: () => void
  onEmojiSelect: (emoji: string) => void
  position: { x: number; y: number }
  showAbove: boolean
}

export default function MessageEmojiPicker({
  isOpen,
  onClose,
  onEmojiSelect,
  position,
  showAbove,
}: MessageEmojiPickerProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Ensure body scroll is not blocked when picker closes
  useEffect(() => {
    if (!isOpen) {
      // Force restore scroll when picker closes
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.touchAction = ''
    }
  }, [isOpen])

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onEmojiSelect(emojiData.emoji)
    onClose()
  }

  const handleQuickReaction = (emoji: string) => {
    onEmojiSelect(emoji)
    onClose()
  }

  if (!isOpen || !mounted) {
    return null
  }

  // Common quick reactions
  const quickReactions = ['👍', '❤️', '😂', '😮', '😢', '🎉']

  const pickerContent = (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60]"
        onClick={onClose}
        onTouchEnd={(e) => {
          e.preventDefault()
          onClose()
        }}
      />

      {/* Picker */}
      <div
        className="fixed z-[70] bg-gray-800 rounded-lg shadow-2xl overflow-hidden"
        style={{
          top: `${position.y}px`,
          left: `${position.x}px`,
          transform: showAbove ? 'translate(0, -100%)' : 'translate(0, 0)',
          marginTop: showAbove ? '-10px' : '10px',
        }}
      >
        {/* Quick Reactions Row */}
        <div className="flex gap-2 p-3 border-b border-gray-700">
          {quickReactions.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleQuickReaction(emoji)}
              className="text-2xl hover:scale-125 transition-transform p-1"
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* Full Emoji Picker */}
        <EmojiPicker
          onEmojiClick={handleEmojiClick}
          theme={Theme.AUTO}
          width={350}
          height={280}
          searchPlaceHolder="Search emoji..."
          previewConfig={{ showPreview: false }}
        />
      </div>
    </>
  )

  // Render picker in a portal to escape parent positioning context
  return createPortal(pickerContent, document.body)
}
