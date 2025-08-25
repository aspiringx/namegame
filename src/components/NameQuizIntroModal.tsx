'use client'

import React from 'react'
import Modal from './ui/modal' // Corrected import
import { Button } from './ui/button'
import { X, Brain } from 'lucide-react'

interface NameQuizIntroModalProps {
  isOpen: boolean
  onClose: () => void
}

const NameQuizIntroModal: React.FC<NameQuizIntroModalProps> = ({
  isOpen,
  onClose,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="relative p-6">
        <div className="flex flex-col items-center justify-center text-center">
          <Brain className="mb-4 h-16 w-16 text-orange-500" />
          <h3 className="text-2xl font-bold">Welcome to the Name Quiz!</h3>
        </div>
        <div className="py-4 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Test your memory by picking the right name for each photo!
          </p>
        </div>
        <Button onClick={onClose} className="mt-4 w-full">
          Let's Go!
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

export default NameQuizIntroModal
