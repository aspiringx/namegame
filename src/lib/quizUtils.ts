import type { MemberWithUser } from '@/types'

const QUIZ_STORAGE_PREFIX = 'namegame-quiz-'

interface QuizScore {
  userId: string
  correctGuesses: number
  lastCorrectTimestamp: number
}

// Spaced repetition interval: 3 months in milliseconds
const SPACED_REPETITION_INTERVAL = 3 * 30 * 24 * 60 * 60 * 1000

export const getQuizScores = (groupSlug: string): Record<string, QuizScore> => {
  if (typeof window === 'undefined') {
    return {}
  }
  const key = `${QUIZ_STORAGE_PREFIX}${groupSlug}`
  try {
    const scores = localStorage.getItem(key)
    return scores ? JSON.parse(scores) : {}
  } catch (error) {
    console.error('Error reading quiz scores from localStorage:', error)
    return {}
  }
}

export const saveQuizScore = (
  groupSlug: string,
  userId: string,
  isCorrect: boolean,
) => {
  if (typeof window === 'undefined') {
    return
  }
  const key = `${QUIZ_STORAGE_PREFIX}${groupSlug}`
  const scores = getQuizScores(groupSlug)
  const userScore = scores[userId] || {
    userId,
    correctGuesses: 0,
    lastCorrectTimestamp: 0,
  }

  if (isCorrect) {
    userScore.correctGuesses += 1
    userScore.lastCorrectTimestamp = Date.now()
  }

  scores[userId] = userScore

  try {
    localStorage.setItem(key, JSON.stringify(scores))
  } catch (error) {
    console.error('Error saving quiz scores to localStorage:', error)
  }
}

export const getEligibleQuizMembers = (
  members: MemberWithUser[],
  scores: Record<string, QuizScore>,
): MemberWithUser[] => {
  const now = Date.now()
  return members.filter((member) => {
    const score = scores[member.userId]
    if (!score) {
      return true // Never been guessed
    }
    // Exclude if guessed correctly 3 or more times, unless enough time has passed
    if (score.correctGuesses >= 3) {
      return now - score.lastCorrectTimestamp > SPACED_REPETITION_INTERVAL
    }
    return true // Fewer than 3 correct guesses
  })
}

export const generateQuizQuestion = (
  eligibleMembers: MemberWithUser[],
  allMembers: MemberWithUser[],
) => {
  if (eligibleMembers.length === 0) {
    return null
  }

  // Select a random member to be the correct answer
  const correctMember =
    eligibleMembers[Math.floor(Math.random() * eligibleMembers.length)]

  // Get two other random members for incorrect options
  const otherMembers = allMembers.filter(
    (m) => m.userId !== correctMember.userId,
  )

  // Not enough members to create a full quiz, but we can proceed with fewer options
  const numOptions = Math.min(2, otherMembers.length)

  const incorrectOptions: MemberWithUser[] = []
  while (incorrectOptions.length < numOptions && otherMembers.length > 0) {
    const randomIndex = Math.floor(Math.random() * otherMembers.length)
    const randomMember = otherMembers.splice(randomIndex, 1)[0]
    incorrectOptions.push(randomMember)
  }

  const options = [correctMember, ...incorrectOptions].sort(
    () => Math.random() - 0.5,
  ) // Shuffle options

  return {
    correctMember,
    options,
  }
}

export const clearQuizScores = (groupSlug: string) => {
  if (typeof window === 'undefined') {
    return
  }
  const key = `${QUIZ_STORAGE_PREFIX}${groupSlug}`
  try {
    localStorage.removeItem(key)
  } catch (error) {
    console.error('Error clearing quiz scores from localStorage:', error)
  }
}
