'use client'

import React, { useState, useEffect, useMemo } from 'react'
import type { MemberWithUser } from '@/types'
import {
  getQuizScores,
  saveQuizScore,
  getEligibleQuizMembers,
  generateQuizQuestion,
  clearQuizScores,
} from '@/lib/quizUtils'
import Image from 'next/image'
import QuizCompleteView from './QuizCompleteView'
import { Button } from './ui/button'
import clsx from 'clsx'

interface NameQuizViewProps {
  members: MemberWithUser[]
  groupSlug: string
  currentUserId?: string
}

interface QuizQuestion {
  correctMember: MemberWithUser
  options: MemberWithUser[]
}

const NameQuizView: React.FC<NameQuizViewProps> = ({
  members,
  groupSlug,
  currentUserId,
}) => {
  const [question, setQuestion] = useState<QuizQuestion | null>(null)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)

  const quizPoolMembers = useMemo(
    () =>
      currentUserId
        ? members.filter((member) => member.userId !== currentUserId)
        : members,
    [members, currentUserId],
  )

  const membersWithPhotos = useMemo(
    () =>
      quizPoolMembers.filter(
        (member) =>
          member.user.photoUrl &&
          !member.user.photoUrl.includes('default-avatar.png') &&
          !member.user.photoUrl.includes('dicebear.com'),
      ),
    [quizPoolMembers],
  )

  const [scores, setScores] = useState(() => getQuizScores(groupSlug))

  const eligibleMembers = useMemo(
    () => getEligibleQuizMembers(membersWithPhotos, scores),
    [membersWithPhotos, scores],
  )

  const loadNextQuestion = () => {
    setSelectedAnswer(null)
    setIsCorrect(null)
    const nextQuestion = generateQuizQuestion(eligibleMembers, quizPoolMembers)
    setQuestion(nextQuestion)
  }

  // Load a question whenever the eligible members pool changes.
  useEffect(() => {
    // Do not run on initial mount if members aren't loaded yet.
    if (membersWithPhotos.length > 0) {
      loadNextQuestion()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scores, membersWithPhotos])

  const handleStartOver = () => {
    clearQuizScores(groupSlug)
    setScores({})
  }

  const handleAnswer = (selectedUserId: string) => {
    if (selectedAnswer) return

    const correct = selectedUserId === question?.correctMember.userId
    setSelectedAnswer(selectedUserId)
    setIsCorrect(correct)

    if (question) {
      saveQuizScore(groupSlug, question.correctMember.userId, correct)
    }

    // After a delay to show feedback, update scores to trigger the next question.
    setTimeout(() => {
      setScores(getQuizScores(groupSlug))
    }, 1500)
  }

  if (eligibleMembers.length === 0) {
    return <QuizCompleteView groupSlug={groupSlug} onStartOver={handleStartOver} />
  }

  if (!question) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        Loading quiz...
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative h-48 w-48 overflow-hidden rounded-full shadow-lg">
        <Image
          src={question.correctMember.user.photoUrl || '/images/default-avatar.png'}
          alt="Who is this?"
          fill
          sizes="192px"
          className="object-cover"
        />
      </div>
      <div className="grid grid-cols-1 gap-2 w-full max-w-xs">
        {question.options.map((option) => {
          const isSelected = selectedAnswer === option.userId
          const isCorrectOption = question.correctMember.userId === option.userId

          return (
            <Button
              key={option.userId}
              onClick={() => handleAnswer(option.userId)}
              disabled={!!selectedAnswer}
              className={clsx('transition-colors', {
                'bg-green-500 hover:bg-green-600':
                  isSelected && isCorrect,
                'bg-red-500 hover:bg-red-600':
                  isSelected && !isCorrect,
                'border-2 border-green-500':
                  selectedAnswer && isCorrectOption && !isSelected,
              })}
            >
              {option.user.name}
            </Button>
          )
        })}
      </div>
    </div>
  )
}

export default NameQuizView
