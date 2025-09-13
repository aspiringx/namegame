'use client'

import React from 'react'
import Modal from './ui/modal' // Corrected import
import { Button } from './ui/button'
import { X, Gamepad2 } from 'lucide-react'

interface GamesIntroModalProps {
  isOpen: boolean
  onClose: () => void
}

const GamesIntroModal: React.FC<GamesIntroModalProps> = ({
  isOpen,
  onClose,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="relative p-6">
        <div className="flex flex-col items-center justify-center text-center">
          <Gamepad2 className="mb-4 h-16 w-16 text-orange-500" />
          <h3 className="text-2xl font-bold">Play Together!</h3>
        </div>
        <p className="my-4 text-left">
          Have fun and get to know each other better with group games, starting
          with Name Quiz.
        </p>
        <ul className="my-4 ml-4 list-disc space-y-2 text-left">
          <li>
            <b>Solo:</b> Games you can play alone, any time, to remember names
            and faces
          </li>
          <li>
            <b>Sync:</b> Games you play together at the same time
          </li>
          <li>
            <b>Async:</b> Games you play together over time, when it&apos;s
            convenient
          </li>
        </ul>

        <Button onClick={onClose} className="mt-4 w-full">
          Got it!
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Modal>
  )
}

export default GamesIntroModal
