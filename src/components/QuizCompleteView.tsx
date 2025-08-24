'use client'

import React, { useState } from 'react'
import Lottie from 'lottie-react'
import confettiAnimation from '@/animations/confetti.json'
import { Button } from '@/components/ui/button'

interface QuizCompleteViewProps {
  groupSlug: string
  onStartOver: () => void
}

const QuizCompleteView: React.FC<QuizCompleteViewProps> = ({
  groupSlug,
  onStartOver,
}) => {
  const [animationComplete, setAnimationComplete] = useState(false)

  const handleStartOver = () => {
    onStartOver()
  }

  return (
    <div className="py-8 text-center">
      <div style={{ height: 150 }} className="flex items-center justify-center">
        {!animationComplete ? (
          <Lottie
            animationData={confettiAnimation}
            loop={false}
            style={{ width: '100%', height: '100%' }}
            onComplete={() => setAnimationComplete(true)}
          />
        ) : (
          <Button onClick={handleStartOver}>Start Over</Button>
        )}
      </div>
      <h2 className="mt-4 text-2xl font-bold">Congratulations!</h2>
      <p className="mt-2 text-gray-600 dark:text-gray-400">
        You've remembered everyone you've greeted three times! In three months,
        we'll unlock them again to keep your memory fresh. Or click "Start Over"
        to play again.
      </p>
      <p className="mt-4 text-sm text-gray-500 dark:text-gray-500">
        We only show users you've greeted who have a real photo. Invite others
        to add their photo so you can remember them here.
      </p>
    </div>
  )
}

export default QuizCompleteView
