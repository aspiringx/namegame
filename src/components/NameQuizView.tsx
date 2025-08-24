'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Modal from './ui/modal'
import type { MemberWithUser } from '@/types'
import {
  getQuizScores,
  saveQuizScore,
  getEligibleQuizMembers,
  generateQuizQuestion,
  clearQuizScores,
  resetCorrectGuesses,
} from '@/lib/quizUtils'
import Image from 'next/image'
import QuizCompleteView from './QuizCompleteView'
import { Button } from './ui/button'
import clsx from 'clsx'

interface NameQuizViewProps {
  members: MemberWithUser[]
  groupSlug: string
  currentUserId?: string
  onSwitchToGrid: () => void
  onSwitchToList: () => void
}

interface QuizQuestion {
  correctMember: MemberWithUser
  options: MemberWithUser[]
}

const NameQuizView: React.FC<NameQuizViewProps> = ({
  members,
  groupSlug,
  currentUserId,
  onSwitchToGrid,
  onSwitchToList,
}) => {
  const [question, setQuestion] = useState<QuizQuestion | null>(null)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [modalPerson, setModalPerson] = useState<MemberWithUser | null>(null)

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
      const correctMemberId = question.correctMember.userId
      saveQuizScore(groupSlug, correctMemberId, correct)
      const newScores = getQuizScores(groupSlug)
      const memberScore = newScores[correctMemberId]

      if (correct && memberScore && memberScore.correctGuesses === 3) {
        setTimeout(() => {
          setModalPerson(question.correctMember)
        }, 800)
      } else {
        setTimeout(() => {
          setScores(newScores)
        }, 800)
      }
    }
  }

  const handleKeepAtIt = () => {
    if (!modalPerson) return
    resetCorrectGuesses(groupSlug, modalPerson.userId)
    const newScores = getQuizScores(groupSlug)
    setScores(newScores)
    setModalPerson(null)
    loadNextQuestion()
  }

  const handleGotIt = () => {
    if (!modalPerson) return
    setModalPerson(null)
    setScores(getQuizScores(groupSlug))
    loadNextQuestion()
  }

  if (eligibleMembers.length === 0) {
    return (
      <QuizCompleteView
        groupSlug={groupSlug}
        onStartOver={handleStartOver}
        onSwitchToGrid={onSwitchToGrid}
        onSwitchToList={onSwitchToList}
      />
    )
  }

  if (!question) {
    return (
      <div className="py-8 text-center text-gray-500 dark:text-gray-400">
        Loading quiz...
      </div>
    )
  }

  return (
    <>
      <Modal isOpen={!!modalPerson} onClose={() => setModalPerson(null)}>
        <div className="p-6">
          <h2 className="mb-4 text-xl font-bold">Congratulations!</h2>
          <p className="mb-4">
            You've remembered {modalPerson?.user.name} three times!
          </p>
          <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
            <p>
              <strong>Keep at It:</strong> Keep this person in the quiz for
              three more tries.
            </p>
            <p>
              <strong>Got It:</strong> You're confident you remember them. We'll
              add them back after three months to keep you sharp.
            </p>
          </div>
          <div className="flex justify-end space-x-4">
            <Button
              onClick={handleKeepAtIt}
              className="bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            >
              Keep at It
            </Button>
            <Button
              onClick={handleGotIt}
              className="bg-indigo-600 text-white hover:bg-indigo-700"
            >
              Got It
            </Button>
          </div>
        </div>
      </Modal>
      <div className="flex flex-col items-center gap-4 py-4">
        <div className="relative h-64 w-64 overflow-hidden rounded-full shadow-lg">
          <Image
            src={
              question.correctMember.user.photoUrl ||
              '/images/default-avatar.png'
            }
            alt="Who is this?"
            fill
            sizes="224px"
            className="object-cover"
          />
        </div>
        <div className="grid w-full max-w-xs grid-cols-1 gap-2">
          {question.options.map((option) => {
            const isSelected = selectedAnswer === option.userId
            const isCorrectOption =
              question.correctMember.userId === option.userId

            return (
              <Button
                key={option.userId}
                onClick={() => handleAnswer(option.userId)}
                disabled={!!selectedAnswer}
                className={clsx('transition-colors', {
                  'bg-green-500 hover:bg-green-600': isSelected && isCorrect,
                  'bg-red-500 hover:bg-red-600': isSelected && !isCorrect,
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
    </>
  )
}

export default NameQuizView
