'use client'

import React from 'react'
import { Button } from '@/components/ui/button'

interface QuizCompleteViewProps {
  onStartOver: () => void
  onSwitchToGrid: () => void
}

const QuizCompleteView: React.FC<QuizCompleteViewProps> = ({
  onStartOver,
  onSwitchToGrid,
}) => {
  const handleStartOver = () => {
    onStartOver()
  }

  return (
    <div className="mx-auto max-w-[600px] py-8 text-center">
      <div className="flex flex-col items-center gap-4">
        <Button onClick={handleStartOver}>Start Over</Button>
        <p className="text-sm text-gray-400">
          Or switch back to{' '}
          <button
            onClick={onSwitchToGrid}
            className="underline hover:text-gray-200"
          >
            Grid
          </button>{' '}
          view.
        </p>
      </div>
      <h2 className="mt-4 text-2xl font-bold">Congratulations!</h2>
      <p className="mt-2 text-left text-gray-400">
        Click &quot;Start Over&quot; to play again.
      </p>
      <p className="mt-4 text-left text-gray-600 italic text-gray-400">
        p.s. We only show users have a real photo.
      </p>
    </div>
  )
}

export default QuizCompleteView
