'use client'

import React, { useState } from 'react'
import Lottie from 'lottie-react'
import confettiAnimation from '@/animations/confetti.json'
import { Button } from '@/components/ui/button'

interface QuizCompleteViewProps {
  groupSlug: string
  onStartOver: () => void
  onSwitchToGrid: () => void
  onSwitchToList: () => void
}

const QuizCompleteView: React.FC<QuizCompleteViewProps> = ({
  onStartOver,
  onSwitchToGrid,
  onSwitchToList,
}) => {
  const [animationComplete, setAnimationComplete] = useState(false)

  const handleStartOver = () => {
    onStartOver()
  }

  return (
    <div className="mx-auto max-w-[600px] py-8 text-center">
      <div style={{ height: 150 }} className="flex items-center justify-center">
        {!animationComplete ? (
          <Lottie
            animationData={confettiAnimation}
            loop={false}
            style={{ width: '100%', height: '100%' }}
            onComplete={() => setAnimationComplete(true)}
          />
        ) : (
          <div className="flex flex-col items-center gap-4">
            <Button onClick={handleStartOver}>Start Over</Button>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Or switch back to{' '}
              <button
                onClick={onSwitchToGrid}
                className="underline hover:text-gray-700 dark:hover:text-gray-200"
              >
                Grid
              </button>{' '}
              or{' '}
              <button
                onClick={onSwitchToList}
                className="underline hover:text-gray-700 dark:hover:text-gray-200"
              >
                List
              </button>{' '}
              view.
            </p>
          </div>
        )}
      </div>
      <h2 className="mt-4 text-2xl font-bold">Congratulations!</h2>
      <p className="mt-2 text-left text-gray-600 dark:text-gray-400">
        You've remembered everyone you've greeted three times!
      </p>
      <p className="mt-2 text-left text-gray-600 dark:text-gray-400">
        In three months, we'll unlock them again to keep your memory fresh. Or
        click "Start Over" to play again.
      </p>
      <p className="mt-4 text-left text-gray-600 italic dark:text-gray-400">
        p.s. We only show users have a real photo. Invite others to add their
        photo so you can remember them here too.
      </p>
    </div>
  )
}

export default QuizCompleteView
