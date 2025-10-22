'use client'

import { useState, useEffect } from 'react'
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react'

interface MessageEmojiPickerProps {
  isOpen: boolean
  onClose: () => void
  onEmojiSelect: (emoji: string) => void
  position: { x: number; y: number }
}

const RECENT_EMOJIS_KEY = 'namegame_recent_emojis'
const MAX_RECENT = 18

export default function MessageEmojiPicker({
  isOpen,
  onClose,
  onEmojiSelect,
  position
}: MessageEmojiPickerProps) {
  const [recentEmojis, setRecentEmojis] = useState<string[]>([])

  // Load recent emojis from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(RECENT_EMOJIS_KEY)
    if (stored) {
      try {
        setRecentEmojis(JSON.parse(stored))
      } catch (e) {
        console.error('Failed to parse recent emojis:', e)
      }
    }
  }, [])

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    const emoji = emojiData.emoji
    
    // Update recent emojis
    const updated = [emoji, ...recentEmojis.filter(e => e !== emoji)].slice(0, MAX_RECENT)
    setRecentEmojis(updated)
    localStorage.setItem(RECENT_EMOJIS_KEY, JSON.stringify(updated))
    
    onEmojiSelect(emoji)
    onClose()
  }

  const handleQuickReaction = (emoji: string) => {
    // Update recent emojis
    const updated = [emoji, ...recentEmojis.filter(e => e !== emoji)].slice(0, MAX_RECENT)
    setRecentEmojis(updated)
    localStorage.setItem(RECENT_EMOJIS_KEY, JSON.stringify(updated))
    
    onEmojiSelect(emoji)
    onClose()
  }

  if (!isOpen) return null

  // Common quick reactions
  const quickReactions = ['👍', '❤️', '😂', '😮', '😢', '🎉']

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40"
        onClick={onClose}
      />
      
      {/* Picker */}
      <div 
        className="fixed z-50 bg-white dark:bg-gray-800 rounded-lg shadow-2xl"
        style={{
          top: `${position.y}px`,
          left: `${position.x}px`,
          transform: 'translate(-50%, -100%)',
          marginTop: '-10px'
        }}
      >
        {/* Quick Reactions Row */}
        <div className="flex gap-2 p-3 border-b border-gray-200 dark:border-gray-700">
          {quickReactions.map(emoji => (
            <button
              key={emoji}
              onClick={() => handleQuickReaction(emoji)}
              className="text-2xl hover:scale-125 transition-transform p-1"
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* Recent Emojis (if any) */}
        {recentEmojis.length > 0 && (
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Recently Used</p>
            <div className="flex flex-wrap gap-1">
              {recentEmojis.slice(0, 12).map((emoji, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickReaction(emoji)}
                  className="text-xl hover:scale-125 transition-transform p-1"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Full Emoji Picker */}
        <EmojiPicker
          onEmojiClick={handleEmojiClick}
          theme={Theme.AUTO}
          width={320}
          height={400}
          searchPlaceHolder="Search emoji..."
          previewConfig={{ showPreview: false }}
        />
      </div>
    </>
  )
}
