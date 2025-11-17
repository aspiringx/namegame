'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useDeviceInfo } from '@/hooks/useDeviceInfo'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { X, ChevronDown, ChevronUp, Plus, Info } from 'lucide-react'
import Image from 'next/image'
import { Dropdown, DropdownItem } from '@/components/ui/dropdown'

interface RelationStarModalProps {
  isOpen: boolean
  onClose: () => void
  memberName: string
  memberPhotoUrl: string
  userId: string
  memberId: string
  currentUserFirstName?: string
  memberFirstName?: string
}

interface Snapshot {
  id: string
  scores: {
    proximity: number
    interest: number
    personalTime: number
    commonGround: number
    familiarity: number
  }
  starScore: number
  relationshipLabel: string
  relationshipGoals?: string
  response: string
  createdAt: string
}

export default function RelationStarModal({
  isOpen,
  onClose,
  memberName,
  memberPhotoUrl,
  memberId,
  currentUserFirstName,
  memberFirstName,
}: RelationStarModalProps) {
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [snapshots, setSnapshots] = useState<Snapshot[]>([])
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string | null>(
    null,
  )

  const router = useRouter()
  const { data: session } = useSession()
  const deviceInfo = useDeviceInfo(session)
  const [isCreatingNew, setIsCreatingNew] = useState(false)

  // Form state (for creating new snapshots)
  const [interactiveScores, setInteractiveScores] = useState({
    proximity: 0,
    interest: 0,
    personalTime: 0,
    commonGround: 0,
    familiarity: 0,
  })
  const [relationshipGoals, setRelationshipGoals] = useState('')
  const [aiInsight, setAiInsight] = useState<string | null>(null)
  const [currentAssessmentId, setCurrentAssessmentId] = useState<string | null>(
    null,
  )
  const [isLoadingAI, setIsLoadingAI] = useState(false)
  const [isSlidersCollapsed, setIsSlidersCollapsed] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  // Fetch history function
  const fetchHistory = useCallback(async () => {
    setIsLoadingHistory(true)
    try {
      const response = await fetch(
        `/api/relation-star/history?memberId=${memberId}`,
      )
      const data = await response.json()

      if (response.ok && data.assessments) {
        setSnapshots(data.assessments)
        // Select the most recent snapshot by default
        if (data.assessments.length > 0) {
          setSelectedSnapshotId(data.assessments[0].id)
          setIsCreatingNew(false)
        } else {
          // No history - show creation form
          setIsCreatingNew(true)
        }
      }
    } catch (error) {
      console.error('Failed to fetch history:', error)
      // On error, default to creation mode
      setIsCreatingNew(true)
    } finally {
      setIsLoadingHistory(false)
    }
  }, [memberId])

  // Fetch history when modal opens
  useEffect(() => {
    if (isOpen && memberId) {
      fetchHistory()
    }
  }, [isOpen, memberId, fetchHistory])

  const selectedSnapshot = snapshots.find((s) => s.id === selectedSnapshotId)

  const handleSliderChange = (
    dimension: keyof typeof interactiveScores,
    value: number,
  ) => {
    setInteractiveScores((prev) => ({
      ...prev,
      [dimension]: value,
    }))
  }

  const calculateStarScore = () => {
    const personalTimeScore = interactiveScores.personalTime * 0.3
    const commonGroundScore = interactiveScores.commonGround * 0.25
    const familiarityScore = interactiveScores.familiarity * 0.2
    const interestScore = interactiveScores.interest * 0.15
    const proximityScore = interactiveScores.proximity * 0.1
    return (
      personalTimeScore +
      commonGroundScore +
      familiarityScore +
      interestScore +
      proximityScore
    )
  }

  const handleAIAssessment = async () => {
    setIsLoadingAI(true)
    setAiError(null)
    setAiInsight(null)
    setIsSlidersCollapsed(true) // Collapse sliders immediately when button is clicked

    try {
      const response = await fetch('/api/relation-star/ai-assessment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...interactiveScores,
          relationshipGoals: relationshipGoals || undefined,
          currentUserFirstName: currentUserFirstName || undefined,
          memberFirstName: memberFirstName || undefined,
          aboutUserId: memberId, // The user this assessment is about
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.message || data.error || 'Failed to generate assessment',
        )
      }

      setAiInsight(data.assessment.text)
      setCurrentAssessmentId(data.assessment.id)
      // Refresh history to include the new snapshot
      await fetchHistory()
    } catch (error) {
      setAiError(
        error instanceof Error ? error.message : 'An unexpected error occurred',
      )
    } finally {
      setIsLoadingAI(false)
    }
  }

  const handleStartOver = () => {
    setAiInsight(null)
    setCurrentAssessmentId(null)
    setRelationshipGoals('')
    setAiError(null)
    setIsSlidersCollapsed(false) // Expand sliders when starting over
  }

  const handleNewInsights = () => {
    // Reset form state
    setInteractiveScores({
      proximity: 0,
      interest: 0,
      personalTime: 0,
      commonGround: 0,
      familiarity: 0,
    })
    setRelationshipGoals('')
    setAiInsight(null)
    setCurrentAssessmentId(null)
    setAiError(null)
    setIsSlidersCollapsed(false)
    setIsCreatingNew(true)
  }

  const starScore = calculateStarScore()

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="relative w-full max-w-5xl transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all bg-gray-900">
                {/* Header */}
                <div className="border-b border-gray-200 p-4 sm:p-6 border-gray-700">
                  {/* Top row: Title and Close button */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                      <div className="relative h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 overflow-hidden rounded-full">
                        <Image
                          src={memberPhotoUrl}
                          alt={memberName}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <Dialog.Title className="text-lg sm:text-xl font-bold text-gray-100 truncate">
                          ⭐ Cosmic Insights
                        </Dialog.Title>
                        <p className="text-xs sm:text-sm text-gray-400">
                          Reflect on your relationship with {memberName}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={onClose}
                      className="flex-shrink-0 rounded-full p-2 hover:bg-gray-100 hover:bg-gray-800"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Snapshot selector and New button (only show if there's history) */}
                  {!isLoadingHistory && snapshots.length > 0 && (
                    <div className="mt-4 flex flex-col sm:flex-row items-stretch gap-3 sm:gap-4">
                      <Dropdown
                        trigger={
                          <div className="flex w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 hover:bg-gray-50 border-gray-600 bg-gray-800 text-gray-100 hover:bg-gray-700">
                            <span className="truncate">
                              {selectedSnapshot
                                ? `${new Date(
                                    selectedSnapshot.createdAt,
                                  ).toLocaleDateString()} - ${selectedSnapshot.starScore.toFixed(
                                    1,
                                  )}/10 (${selectedSnapshot.relationshipLabel})`
                                : 'Select a snapshot'}
                            </span>
                            <ChevronDown className="ml-2 h-4 w-4 flex-shrink-0" />
                          </div>
                        }
                        triggerClassName="w-full sm:flex-1"
                        menuClassName="absolute left-0 z-10 mt-2 w-full origin-top-left rounded-md border border-gray-200 bg-white text-gray-900 shadow-lg focus:outline-none border-gray-700 bg-gray-800 text-gray-200"
                      >
                        {snapshots.map((snapshot, index) => (
                          <div key={snapshot.id}>
                            {index > 0 && (
                              <div className="my-1 border-t border-gray-700" />
                            )}
                            <DropdownItem
                              onClick={() => {
                                setSelectedSnapshotId(snapshot.id)
                                setIsCreatingNew(false)
                              }}
                            >
                              <div className="flex items-center justify-between gap-3 w-full">
                                <span className="font-medium">
                                  {new Date(
                                    snapshot.createdAt,
                                  ).toLocaleDateString()}
                                </span>
                                <span className="text-xs opacity-75 whitespace-nowrap">
                                  {snapshot.starScore.toFixed(1)}/10 ·{' '}
                                  {snapshot.relationshipLabel}
                                </span>
                              </div>
                            </DropdownItem>
                          </div>
                        ))}
                      </Dropdown>
                      {!isCreatingNew && (
                        <div className="flex gap-3 sm:contents">
                          <button
                            onClick={handleNewInsights}
                            className="flex-[2] sm:flex-initial sm:w-auto flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 whitespace-nowrap"
                          >
                            <Plus className="h-4 w-4" />
                            New
                          </button>
                          <button
                            onClick={() => {
                              if (deviceInfo.isPWA) {
                                router.push('/stars')
                              } else {
                                window.open('/stars', '_blank')
                              }
                            }}
                            className="flex-1 sm:flex-initial sm:w-auto flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 border-gray-600 bg-gray-800 text-gray-300 hover:bg-gray-700 whitespace-nowrap"
                          >
                            <Info className="h-4 w-4" />
                            Help
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="max-h-[calc(90vh-120px)] min-h-[400px] overflow-y-auto p-4 sm:p-6">
                  {/* Show loading state */}
                  {isLoadingHistory ? (
                    <div className="flex items-center justify-center py-24">
                      <div className="text-center">
                        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-indigo-600"></div>
                        <p className="mt-4 text-sm text-gray-400">
                          Loading history...
                        </p>
                      </div>
                    </div>
                  ) : isCreatingNew ? (
                    // Creation mode - show the input form
                    <div className="grid gap-8 lg:grid-cols-2">
                      {/* Left: Sliders */}
                      <div>
                        {/* Collapsible Sliders Section */}
                        <div className="mb-6">
                          <button
                            onClick={() =>
                              setIsSlidersCollapsed(!isSlidersCollapsed)
                            }
                            className="mb-4 flex w-full items-center justify-between text-xl font-semibold text-gray-900 hover:text-indigo-600 text-gray-100 hover:text-indigo-400"
                          >
                            <span>Map the Relationship</span>
                            {isSlidersCollapsed ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronUp className="h-4 w-4" />
                            )}
                          </button>

                          {!isSlidersCollapsed && (
                            <div className="space-y-6">
                              <p className="mb-6 text-sm text-gray-300">
                                Map your relationship in the stars and get
                                cosmic insights.
                              </p>

                              {[
                                {
                                  key: 'proximity',
                                  label:
                                    '⭐ How often are you near this person?',
                                  hint: 'Physical and/or virtual proximity',
                                  minLabel: 'Never',
                                  maxLabel: 'Daily',
                                },
                                {
                                  key: 'commonGround',
                                  label:
                                    '⭐ How much common ground do you share?',
                                  hint: 'Interests, values, experiences',
                                  minLabel: 'None',
                                  maxLabel: 'A lot',
                                },
                                {
                                  key: 'familiarity',
                                  label: '⭐ How well do you know them?',
                                  hint: 'From name recognition to deep understanding',
                                  minLabel: 'Not at all',
                                  maxLabel: 'Very well',
                                },
                                {
                                  key: 'interest',
                                  label:
                                    '⭐ How interested are you in this relationship?',
                                  hint: 'Desire, ability, commitment',
                                  minLabel: 'Not at all',
                                  maxLabel: 'Very interested',
                                },
                                {
                                  key: 'personalTime',
                                  label:
                                    '⭐  How much personal time do you spend together?',
                                  hint: 'Time together focused on each other in spaces where you can talk freely, not formal/bigger gatherings or doing required tasks',
                                  minLabel: 'None',
                                  maxLabel: 'A lot',
                                },
                              ].map(
                                ({ key, label, hint, minLabel, maxLabel }) => (
                                  <div key={key}>
                                    <div className="mb-2 flex items-start justify-between gap-4">
                                      <div className="flex-1">
                                        <label className="text-sm font-medium text-gray-300">
                                          {label}
                                        </label>
                                        <div className="mt-1 text-xs text-gray-400">
                                          {hint}
                                        </div>
                                      </div>
                                      <span className="flex-shrink-0 text-lg font-bold text-indigo-300">
                                        {
                                          interactiveScores[
                                            key as keyof typeof interactiveScores
                                          ]
                                        }
                                      </span>
                                    </div>
                                    <input
                                      type="range"
                                      min="0"
                                      max="10"
                                      value={
                                        interactiveScores[
                                          key as keyof typeof interactiveScores
                                        ]
                                      }
                                      onChange={(e) =>
                                        handleSliderChange(
                                          key as keyof typeof interactiveScores,
                                          parseInt(e.target.value),
                                        )
                                      }
                                      className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-700 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-indigo-600 [&::-moz-range-thumb]:bg-indigo-400 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-600 [&::-webkit-slider-thumb]:bg-indigo-400"
                                    />
                                    <div className="mt-1 flex justify-between text-xs text-gray-400">
                                      <span>0 - {minLabel}</span>
                                      <span>10 - {maxLabel}</span>
                                    </div>
                                  </div>
                                ),
                              )}
                            </div>
                          )}
                        </div>

                        {/* Relationship Goals */}
                        <div className="mt-8">
                          <h3 className="mb-4 text-xl font-bold">
                            Cosmic Insights
                          </h3>
                          <label className="block text-sm font-medium text-gray-300">
                            Relationship context
                          </label>
                          <div className="mt-1 mb-2 text-xs text-gray-400">
                            Provide relationship context (status, dynamics,
                            hopes, etc.) for personalized insights.
                          </div>
                          <textarea
                            value={relationshipGoals}
                            onChange={(e) =>
                              setRelationshipGoals(e.target.value)
                            }
                            placeholder={`e.g., I'd like to feel closer to ${memberName}, or I want to maintain this friendship despite living far apart...`}
                            maxLength={500}
                            rows={3}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none border-gray-600 bg-gray-800 text-gray-100 placeholder-gray-500"
                          />
                          <div className="text-right text-xs text-gray-400">
                            {relationshipGoals.length}/500 characters
                          </div>
                        </div>

                        {/* Privacy Notice - Only show when at least one slider has a value */}
                        {!Object.values(interactiveScores).every(
                          (v) => v === 0,
                        ) && (
                          <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4 border-gray-700 bg-gray-800">
                            <div className="flex items-start gap-2">
                              <svg
                                className="h-5 w-5 flex-shrink-0 text-gray-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                />
                              </svg>
                              <div className="text-xs text-gray-300">
                                <strong className="font-semibold">
                                  Your privacy matters.
                                </strong>{' '}
                                Your responses and AI insights are completely
                                private and only visible to you.
                              </div>
                            </div>
                          </div>
                        )}

                        {/* AI Assessment Button - Only show when at least one slider has a value */}
                        {!Object.values(interactiveScores).every(
                          (v) => v === 0,
                        ) && (
                          <div className="mt-6">
                            <button
                              onClick={
                                aiInsight ? handleStartOver : handleAIAssessment
                              }
                              disabled={!aiInsight && isLoadingAI}
                              className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500 disabled:bg-gray-700 disabled:text-gray-400"
                            >
                              {aiInsight ? (
                                'Start Over'
                              ) : isLoadingAI ? (
                                <span className="flex items-center justify-center gap-2">
                                  <svg
                                    className="h-4 w-4 animate-spin"
                                    viewBox="0 0 24 24"
                                  >
                                    <circle
                                      className="opacity-25"
                                      cx="12"
                                      cy="12"
                                      r="10"
                                      stroke="currentColor"
                                      strokeWidth="4"
                                      fill="none"
                                    />
                                    <path
                                      className="opacity-75"
                                      fill="currentColor"
                                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    />
                                  </svg>
                                  Gathering wisdom...
                                </span>
                              ) : (
                                'Get Cosmic Insights'
                              )}
                            </button>

                            {aiError && (
                              <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-800 bg-red-900/20 text-red-200">
                                {aiError}
                              </div>
                            )}

                            {aiInsight && (
                              <>
                                {/* Divider before AI Insights */}
                                <div className="my-6 border-t-2 border-gray-600" />

                                <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-6 border-indigo-900 bg-indigo-950">
                                  <div className="mb-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                      <h4 className="text-lg font-semibold text-indigo-100">
                                        Your Cosmic Insights
                                      </h4>
                                      {currentAssessmentId && (
                                        <button
                                          onClick={() => {
                                            if (deviceInfo.isPWA) {
                                              router.push(
                                                `/cosmic-insights/${currentAssessmentId}`,
                                              )
                                            } else {
                                              window.open(
                                                `/cosmic-insights/${currentAssessmentId}`,
                                                '_blank',
                                              )
                                            }
                                          }}
                                          className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
                                        >
                                          <svg
                                            className="h-4 w-4"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth={2}
                                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                            />
                                          </svg>
                                          Full Page
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                  <div
                                    className="prose prose-sm prose-indigo prose-invert max-w-none text-indigo-200 [&_li]:leading-relaxed [&_ul]:space-y-3 [&>div]:space-y-2 [&>p]:mb-8"
                                    dangerouslySetInnerHTML={{
                                      __html: aiInsight,
                                    }}
                                  />
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Right: Chart and Score */}
                      <div className="space-y-6">
                        {/* Mini Chart */}
                        <div className="rounded-lg border border-gray-200 bg-white p-6 border-gray-700 bg-gray-800">
                          <h3 className="mb-4 text-xl font-bold">Star Chart</h3>
                          <div className="relative mx-auto aspect-square w-full">
                            <svg
                              viewBox="-10 -10 340 340"
                              className="h-full w-full"
                            >
                              {/* Center point */}
                              <circle cx="160" cy="160" r="3" fill="#4f46e5" />

                              {/* Concentric circles */}
                              {[32, 64, 96, 128, 160].map((radius) => (
                                <circle
                                  key={radius}
                                  cx="160"
                                  cy="160"
                                  r={radius}
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="1"
                                  className="stroke-gray-300 stroke-gray-600"
                                />
                              ))}

                              {/* Scale labels (0, 5, 10) straight up from center */}
                              {[0, 5, 10].map((val) => (
                                <text
                                  key={val}
                                  x="160"
                                  y={160 - val * 16 - (val === 0 ? 12 : 0) + 5}
                                  textAnchor="middle"
                                  fontSize="14"
                                  fontWeight="500"
                                  fill="currentColor"
                                  className="fill-gray-600 fill-gray-400"
                                >
                                  {val}
                                </text>
                              ))}

                              {/* Axes */}
                              {[
                                { key: 'proximity', label: 'Proximity' },
                                { key: 'interest', label: 'Interest' },
                                { key: 'personalTime', label: 'Personal Time' },
                                { key: 'commonGround', label: 'Common Ground' },
                                { key: 'familiarity', label: 'Familiarity' },
                              ].map((_, idx) => {
                                const angle =
                                  (idx * (360 / 5) - 90 + 30) * (Math.PI / 180)
                                const x = 160 + 160 * Math.cos(angle)
                                const y = 160 + 160 * Math.sin(angle)
                                return (
                                  <line
                                    key={idx}
                                    x1="160"
                                    y1="160"
                                    x2={x}
                                    y2={y}
                                    stroke="currentColor"
                                    strokeWidth="1"
                                    className="stroke-gray-300 stroke-gray-600"
                                  />
                                )
                              })}

                              {/* Filled area */}
                              <path
                                d={
                                  [
                                    {
                                      key: 'proximity',
                                      value: interactiveScores.proximity,
                                    },
                                    {
                                      key: 'interest',
                                      value: interactiveScores.interest,
                                    },
                                    {
                                      key: 'personalTime',
                                      value: interactiveScores.personalTime,
                                    },
                                    {
                                      key: 'commonGround',
                                      value: interactiveScores.commonGround,
                                    },
                                    {
                                      key: 'familiarity',
                                      value: interactiveScores.familiarity,
                                    },
                                  ]
                                    .map((item, idx) => {
                                      const angle =
                                        (idx * (360 / 5) - 90 + 30) *
                                        (Math.PI / 180)
                                      const length = item.value * 16
                                      const x = 160 + length * Math.cos(angle)
                                      const y = 160 + length * Math.sin(angle)
                                      return `${
                                        idx === 0 ? 'M' : 'L'
                                      } ${x} ${y}`
                                    })
                                    .join(' ') + ' Z'
                                }
                                fill="#4f46e5"
                                fillOpacity="0.15"
                                stroke="#4f46e5"
                                strokeWidth="3"
                                opacity="0.6"
                              />

                              {/* Points */}
                              {[
                                {
                                  key: 'proximity',
                                  value: interactiveScores.proximity,
                                  dimension: 'Proximity',
                                },
                                {
                                  key: 'interest',
                                  value: interactiveScores.interest,
                                  dimension: 'Interest',
                                },
                                {
                                  key: 'personalTime',
                                  value: interactiveScores.personalTime,
                                  dimension: 'Personal Time',
                                },
                                {
                                  key: 'commonGround',
                                  value: interactiveScores.commonGround,
                                  dimension: 'Common Ground',
                                },
                                {
                                  key: 'familiarity',
                                  value: interactiveScores.familiarity,
                                  dimension: 'Familiarity',
                                },
                              ].map((item, idx) => {
                                const angle =
                                  (idx * (360 / 5) - 90 + 30) * (Math.PI / 180)
                                const length = item.value * 16
                                // No offset needed now that chart is rotated away from edges
                                const offset = 0
                                const x =
                                  160 + (length + offset) * Math.cos(angle)
                                const y =
                                  160 + (length + offset) * Math.sin(angle)

                                return (
                                  <g key={idx}>
                                    {/* Dots - drawn before labels */}
                                    <circle
                                      cx={x}
                                      cy={y}
                                      r="8"
                                      fill="#4f46e5"
                                      opacity="0.3"
                                    />
                                    <circle
                                      cx={x}
                                      cy={y}
                                      r="4"
                                      fill="#4f46e5"
                                    />
                                    {/* Twinkle effect - white flash */}
                                    <circle
                                      cx={x}
                                      cy={y}
                                      r="3"
                                      fill="white"
                                      opacity="0"
                                    >
                                      <animate
                                        attributeName="opacity"
                                        values="0;0;0.8;0;0"
                                        dur="2.5s"
                                        repeatCount="indefinite"
                                        begin={`${idx * 0.5}s`}
                                      />
                                    </circle>

                                    {/* Labels - always show, with smart positioning */}
                                    {(() => {
                                      // Use a smaller distance to keep labels within viewBox
                                      const labelDistance = 145
                                      const labelX =
                                        160 + labelDistance * Math.cos(angle)
                                      const labelY =
                                        160 + labelDistance * Math.sin(angle)

                                      return (
                                        <>
                                          {item.dimension ===
                                          'Personal Time' ? (
                                            <>
                                              <text
                                                x={labelX}
                                                y={labelY - 6}
                                                textAnchor="middle"
                                                fontSize="14"
                                                fontWeight="600"
                                                fill="currentColor"
                                                className="fill-gray-900 fill-gray-100"
                                              >
                                                Personal
                                              </text>
                                              <text
                                                x={labelX}
                                                y={labelY + 6}
                                                textAnchor="middle"
                                                fontSize="14"
                                                fontWeight="600"
                                                fill="currentColor"
                                                className="fill-gray-900 fill-gray-100"
                                              >
                                                Time
                                              </text>
                                            </>
                                          ) : item.dimension ===
                                            'Common Ground' ? (
                                            <>
                                              <text
                                                x={labelX}
                                                y={labelY - 6}
                                                textAnchor="middle"
                                                fontSize="14"
                                                fontWeight="600"
                                                fill="currentColor"
                                                className="fill-gray-900 fill-gray-100"
                                              >
                                                Common
                                              </text>
                                              <text
                                                x={labelX}
                                                y={labelY + 6}
                                                textAnchor="middle"
                                                fontSize="14"
                                                fontWeight="600"
                                                fill="currentColor"
                                                className="fill-gray-900 fill-gray-100"
                                              >
                                                Ground
                                              </text>
                                            </>
                                          ) : (
                                            <text
                                              x={labelX}
                                              y={labelY}
                                              textAnchor="middle"
                                              fontSize="14"
                                              fontWeight="600"
                                              fill="currentColor"
                                              className="fill-gray-900 fill-gray-100"
                                            >
                                              {item.dimension}
                                            </text>
                                          )}
                                        </>
                                      )
                                    })()}
                                  </g>
                                )
                              })}
                            </svg>
                          </div>
                        </div>

                        {/* Divider */}
                        <div className="border-t border-gray-700" />

                        {/* Star Score */}
                        <div className="rounded-lg border border-gray-200 bg-white p-4 border-gray-700 bg-gray-800">
                          <h3 className="mb-4 text-xl font-bold">Star Score</h3>
                          <div className="mb-4 text-center">
                            <div className="font-bold">
                              <span className="text-4xl text-indigo-400">
                                {starScore.toFixed(1)}
                              </span>
                              <span className="text-2xl text-gray-600">
                                /10
                              </span>
                            </div>
                            <div className="text-sm text-gray-400">
                              {starScore >= 8
                                ? 'Close Friend'
                                : starScore >= 5
                                ? 'Friend'
                                : starScore >= 3
                                ? 'Acquaintance'
                                : starScore >= 1
                                ? 'Nodding Acquaintance'
                                : 'Stranger'}
                            </div>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-400">
                                Personal Time (30%)
                              </span>
                              <span className="font-medium">
                                {interactiveScores.personalTime}/10
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">
                                Common Ground (25%)
                              </span>
                              <span className="font-medium">
                                {interactiveScores.commonGround}/10
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">
                                Familiarity (20%)
                              </span>
                              <span className="font-medium">
                                {interactiveScores.familiarity}/10
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">
                                Interest (15%)
                              </span>
                              <span className="font-medium">
                                {interactiveScores.interest}/10
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">
                                Proximity (10%)
                              </span>
                              <span className="font-medium">
                                {interactiveScores.proximity}/10
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : selectedSnapshot ? (
                    // Read-only mode - show historical snapshot
                    <div className="grid gap-8 lg:grid-cols-2">
                      {/* Left: Saved Context and AI Response */}
                      <div className="space-y-6">
                        {selectedSnapshot.relationshipGoals && (
                          <div>
                            <h3 className="mb-4 text-xl font-bold">
                              Relationship Context
                            </h3>
                            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700 border-gray-700 bg-gray-800 text-gray-300">
                              {selectedSnapshot.relationshipGoals}
                            </div>
                          </div>
                        )}

                        <div>
                          <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-6 border-indigo-900 bg-indigo-950">
                            <div className="mb-4">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <h3 className="text-xl font-bold text-indigo-100">
                                  Your Cosmic Insights
                                </h3>
                                <button
                                  onClick={() => {
                                    if (deviceInfo.isPWA) {
                                      router.push(
                                        `/cosmic-insights/${selectedSnapshot.id}`,
                                      )
                                    } else {
                                      window.open(
                                        `/cosmic-insights/${selectedSnapshot.id}`,
                                        '_blank',
                                      )
                                    }
                                  }}
                                  className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
                                >
                                  <svg
                                    className="h-4 w-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                    />
                                  </svg>
                                  Full Page
                                </button>
                              </div>
                            </div>
                            <div
                              className="prose prose-sm prose-indigo prose-invert max-w-none text-indigo-200 [&_li]:leading-relaxed [&_ul]:space-y-3 [&>div]:space-y-2 [&>p]:mb-8"
                              dangerouslySetInnerHTML={{
                                __html: selectedSnapshot.response,
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Right: Chart and Score */}
                      <div className="space-y-6">
                        {/* Star Chart */}
                        <div className="rounded-lg border border-gray-200 bg-white p-6 border-gray-700 bg-gray-800">
                          <h3 className="mb-4 text-xl font-bold">Star Chart</h3>
                          <div className="relative mx-auto aspect-square w-full">
                            <svg
                              viewBox="-10 -10 340 340"
                              className="h-full w-full"
                            >
                              {/* Center point */}
                              <circle cx="160" cy="160" r="3" fill="#4f46e5" />

                              {/* Concentric circles */}
                              {[32, 64, 96, 128, 160].map((radius) => (
                                <circle
                                  key={radius}
                                  cx="160"
                                  cy="160"
                                  r={radius}
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="1"
                                  className="stroke-gray-300 stroke-gray-600"
                                />
                              ))}

                              {/* Scale labels */}
                              {[0, 5, 10].map((val) => (
                                <text
                                  key={val}
                                  x="160"
                                  y={160 - val * 16 - (val === 0 ? 12 : 0) + 5}
                                  textAnchor="middle"
                                  fontSize="14"
                                  fontWeight="500"
                                  fill="currentColor"
                                  className="fill-gray-500 fill-gray-400"
                                >
                                  {val}
                                </text>
                              ))}

                              {/* Axes */}
                              {Object.keys(selectedSnapshot.scores).map(
                                (_, idx) => {
                                  const angle =
                                    (idx * (360 / 5) - 90 + 30) *
                                    (Math.PI / 180)
                                  const x = 160 + 160 * Math.cos(angle)
                                  const y = 160 + 160 * Math.sin(angle)
                                  return (
                                    <line
                                      key={idx}
                                      x1="160"
                                      y1="160"
                                      x2={x}
                                      y2={y}
                                      stroke="currentColor"
                                      strokeWidth="1"
                                      className="stroke-gray-300 stroke-gray-600"
                                    />
                                  )
                                },
                              )}

                              {/* Filled area */}
                              <path
                                d={
                                  Object.values(selectedSnapshot.scores)
                                    .map((value: number, idx) => {
                                      const angle =
                                        (idx * (360 / 5) - 90 + 30) *
                                        (Math.PI / 180)
                                      const length = value * 16
                                      const x = 160 + length * Math.cos(angle)
                                      const y = 160 + length * Math.sin(angle)
                                      return `${
                                        idx === 0 ? 'M' : 'L'
                                      } ${x} ${y}`
                                    })
                                    .join(' ') + ' Z'
                                }
                                fill="#4f46e5"
                                fillOpacity="0.15"
                                stroke="#4f46e5"
                                strokeWidth="3"
                                opacity="0.6"
                              />

                              {/* Points */}
                              {Object.values(selectedSnapshot.scores).map(
                                (value: number, idx) => {
                                  const angle =
                                    (idx * (360 / 5) - 90 + 30) *
                                    (Math.PI / 180)
                                  const length = value * 16
                                  const x = 160 + length * Math.cos(angle)
                                  const y = 160 + length * Math.sin(angle)

                                  return (
                                    <g key={idx}>
                                      <circle
                                        cx={x}
                                        cy={y}
                                        r="6"
                                        fill="#4f46e5"
                                        stroke="white"
                                        strokeWidth="2"
                                      />
                                    </g>
                                  )
                                },
                              )}

                              {/* Labels */}
                              {[
                                { key: 'proximity', label: 'Proximity' },
                                { key: 'interest', label: 'Interest' },
                                {
                                  key: 'personalTime',
                                  label: 'Personal\nTime',
                                },
                                {
                                  key: 'commonGround',
                                  label: 'Common\nGround',
                                },
                                { key: 'familiarity', label: 'Familiarity' },
                              ].map((dim, idx) => {
                                const angle =
                                  (idx * (360 / 5) - 90 + 30) * (Math.PI / 180)
                                const labelDistance = 145
                                const x = 160 + labelDistance * Math.cos(angle)
                                const y = 160 + labelDistance * Math.sin(angle)

                                return (
                                  <text
                                    key={dim.key}
                                    x={x}
                                    y={y}
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    fontSize="14"
                                    fontWeight="600"
                                    fill="currentColor"
                                    className="fill-gray-700 fill-gray-300"
                                  >
                                    {dim.label.split('\n').map((line, i) => (
                                      <tspan
                                        key={i}
                                        x={x}
                                        dy={i === 0 ? 0 : 16}
                                      >
                                        {line}
                                      </tspan>
                                    ))}
                                  </text>
                                )
                              })}
                            </svg>
                          </div>
                        </div>

                        {/* Star Score */}
                        <div className="rounded-lg border border-gray-200 bg-white p-4 border-gray-700 bg-gray-800">
                          <h3 className="mb-4 text-xl font-bold">Star Score</h3>
                          <div className="mb-4 text-center">
                            <div className="font-bold">
                              <span className="text-4xl text-indigo-400">
                                {selectedSnapshot.starScore.toFixed(1)}
                              </span>
                              <span className="text-2xl text-gray-400">
                                /10
                              </span>
                            </div>
                            <div className="mt-2 text-sm font-medium text-gray-400">
                              {selectedSnapshot.relationshipLabel}
                            </div>
                          </div>

                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-400">
                                Personal Time (30%)
                              </span>
                              <span className="font-medium">
                                {selectedSnapshot.scores.personalTime}/10
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">
                                Common Ground (25%)
                              </span>
                              <span className="font-medium">
                                {selectedSnapshot.scores.commonGround}/10
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">
                                Familiarity (20%)
                              </span>
                              <span className="font-medium">
                                {selectedSnapshot.scores.familiarity}/10
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">
                                Interest (15%)
                              </span>
                              <span className="font-medium">
                                {selectedSnapshot.scores.interest}/10
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">
                                Proximity (10%)
                              </span>
                              <span className="font-medium">
                                {selectedSnapshot.scores.proximity}/10
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
