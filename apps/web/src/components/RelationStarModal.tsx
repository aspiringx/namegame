'use client'

import { useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { X, ChevronDown, ChevronUp } from 'lucide-react'
import Image from 'next/image'

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

export default function RelationStarModal({
  isOpen,
  onClose,
  memberName,
  memberPhotoUrl,
  currentUserFirstName,
  memberFirstName,
}: RelationStarModalProps) {
  const [interactiveScores, setInteractiveScores] = useState({
    proximity: 0,
    interest: 0,
    personalTime: 0,
    commonGround: 0,
    familiarity: 0,
  })
  const [relationshipGoals, setRelationshipGoals] = useState('')
  const [aiInsight, setAiInsight] = useState<string | null>(null)
  const [isLoadingAI, setIsLoadingAI] = useState(false)
  const [isSlidersCollapsed, setIsSlidersCollapsed] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  const handleSliderChange = (dimension: keyof typeof interactiveScores, value: number) => {
    setInteractiveScores((prev) => ({
      ...prev,
      [dimension]: value,
    }))
  }

  const calculateStarScore = () => {
    const personalTimeScore = interactiveScores.personalTime * 0.30
    const commonGroundScore = interactiveScores.commonGround * 0.25
    const familiarityScore = interactiveScores.familiarity * 0.20
    const interestScore = interactiveScores.interest * 0.15
    const proximityScore = interactiveScores.proximity * 0.10
    return personalTimeScore + commonGroundScore + familiarityScore + interestScore + proximityScore
  }

  const handleAIAssessment = async () => {
    setIsLoadingAI(true)
    setAiError(null)
    setAiInsight(null)

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
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to generate assessment')
      }

      setAiInsight(data.assessment.text)
    } catch (error) {
      setAiError(error instanceof Error ? error.message : 'An unexpected error occurred')
    } finally {
      setIsLoadingAI(false)
    }
  }

  const handleStartOver = () => {
    setAiInsight(null)
    setRelationshipGoals('')
    setAiError(null)
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
              <Dialog.Panel className="relative w-full max-w-5xl transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all dark:bg-gray-900">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-200 p-6 dark:border-gray-700">
                  <div className="flex items-center gap-4">
                    <div className="relative h-12 w-12 overflow-hidden rounded-full">
                      <Image
                        src={memberPhotoUrl}
                        alt={memberName}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <Dialog.Title className="text-xl font-bold text-gray-900 dark:text-gray-100">
                        Your Relation Constellation with {memberName}
                      </Dialog.Title>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Reflect on your relationship
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="max-h-[calc(90vh-120px)] overflow-y-auto p-6">
                  <div className="grid gap-8 lg:grid-cols-2">
                    {/* Left: Sliders */}
                    <div>
                      <p className="mb-6 text-sm text-gray-700 dark:text-gray-300">
                        Use the sliders to indicate how you see this relationship today. Get optional insights from the Relation AI.
                      </p>
                      
                      {/* Collapsible Sliders Section */}
                      <div className="mb-6">
                        <button
                          onClick={() => setIsSlidersCollapsed(!isSlidersCollapsed)}
                          className="mb-4 flex w-full items-center justify-between text-sm font-semibold text-gray-900 hover:text-indigo-600 dark:text-gray-100 dark:hover:text-indigo-400"
                        >
                          <span>Assessment Questions</span>
                          {isSlidersCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                        </button>
                        
                        {!isSlidersCollapsed && (
                      <div className="space-y-6">
                        {[
                          { key: 'proximity', label: 'How often are you near this person?', hint: '(physical and/or virtual proximity)', minLabel: 'Never', maxLabel: 'Daily' },
                          { key: 'commonGround', label: 'How much common ground do you share?', hint: '(interests, values, experiences)', minLabel: 'None', maxLabel: 'A lot' },
                          { key: 'familiarity', label: 'How well do you know them?', hint: '(from name recognition to deep understanding)', minLabel: 'Not at all', maxLabel: 'Very well' },
                          { key: 'interest', label: 'How interested are you in this relationship?', hint: '(desire, ability, commitment)', minLabel: 'Not at all', maxLabel: 'Very interested' },
                          { key: 'personalTime', label: 'How much personal time do you spend together?', hint: '(time together focused on each other in spaces where you can talk freely, not formal/bigger gatherings or doing required tasks)', minLabel: 'None', maxLabel: 'A lot' },
                        ].map(({ key, label, hint, minLabel, maxLabel }) => (
                          <div key={key}>
                            <div className="mb-2 flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  {label}
                                </label>
                                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">{hint}</div>
                              </div>
                              <span className="flex-shrink-0 text-lg font-bold text-indigo-700 dark:text-indigo-300">
                                {interactiveScores[key as keyof typeof interactiveScores]}
                              </span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="10"
                              value={interactiveScores[key as keyof typeof interactiveScores]}
                              onChange={(e) => handleSliderChange(key as keyof typeof interactiveScores, parseInt(e.target.value))}
                              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 dark:bg-gray-700 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-600 [&::-webkit-slider-thumb]:dark:bg-indigo-400 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-indigo-600 [&::-moz-range-thumb]:dark:bg-indigo-400"
                            />
                            <div className="mt-1 flex justify-between text-xs text-gray-500 dark:text-gray-400">
                              <span>0 - {minLabel}</span>
                              <span>10 - {maxLabel}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                        )}
                      </div>

                      {/* Relationship Goals */}
                      <div className="mt-8">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          What would you like or hope for in this relationship?
                        </label>
                        <div className="mb-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                          (optionally provide more context for a better response)
                        </div>
                        <textarea
                          value={relationshipGoals}
                          onChange={(e) => setRelationshipGoals(e.target.value)}
                          placeholder={`e.g., I'd like to feel closer to ${memberName}, or I want to maintain this friendship despite living far apart...`}
                          maxLength={500}
                          rows={3}
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
                        />
                        <div className="text-right text-xs text-gray-500 dark:text-gray-400">
                          {relationshipGoals.length}/500 characters
                        </div>
                      </div>

                      {/* Privacy Notice */}
                      <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                        <div className="flex items-start gap-2">
                          <svg className="h-5 w-5 flex-shrink-0 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          <div className="text-xs text-gray-700 dark:text-gray-300">
                            <strong className="font-semibold">Your privacy matters.</strong> Your responses and AI insights are completely private and only visible to you. They are not shared with group admins, other users, or anyone else.
                          </div>
                        </div>
                      </div>

                      {/* AI Assessment Button */}
                      <div className="mt-6">
                        <button
                          onClick={aiInsight ? handleStartOver : handleAIAssessment}
                          disabled={!aiInsight && (isLoadingAI || Object.values(interactiveScores).every(v => v === 0))}
                          className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500 dark:disabled:bg-gray-700 dark:disabled:text-gray-400"
                        >
                          {aiInsight ? (
                            'Start Over'
                          ) : isLoadingAI ? (
                            <span className="flex items-center justify-center gap-2">
                              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                              Generating insights...
                            </span>
                          ) : Object.values(interactiveScores).every(v => v === 0) ? (
                            'Adjust sliders to get Relation Insights'
                          ) : (
                            'Get Relation Insights'
                          )}
                        </button>

                        {aiError && (
                          <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-200">
                            {aiError}
                          </div>
                        )}

                        {aiInsight && (
                          <>
                            {/* Divider before AI Insights */}
                            <div className="my-6 border-t-2 border-gray-300 dark:border-gray-600" />
                            
                            <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-6 dark:border-indigo-900 dark:bg-indigo-950">
                              <h4 className="mb-4 text-lg font-semibold text-indigo-900 dark:text-indigo-100">
                                Relation Insights from the Stars
                              </h4>
                              <div 
                                className="prose prose-sm prose-indigo dark:prose-invert max-w-none text-indigo-800 dark:text-indigo-200 [&>p]:mb-4 [&>div]:space-y-2 [&_ul]:space-y-3 [&_li]:leading-relaxed"
                                dangerouslySetInnerHTML={{ __html: aiInsight }}
                              />
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Right: Chart and Score */}
                    <div className="space-y-6">
                      {/* Mini Chart */}
                      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                        <h3 className="mb-4 text-xl font-bold">Star Chart</h3>
                        <div className="relative mx-auto aspect-square w-full">
                          <svg viewBox="-10 -10 340 340" className="h-full w-full">
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
                                className="stroke-gray-300 dark:stroke-gray-600"
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
                                className="fill-gray-600 dark:fill-gray-400"
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
                              const angle = (idx * (360 / 5) - 90 + 30) * (Math.PI / 180);
                              const x = 160 + 160 * Math.cos(angle);
                              const y = 160 + 160 * Math.sin(angle);
                              return (
                                <line
                                  key={idx}
                                  x1="160"
                                  y1="160"
                                  x2={x}
                                  y2={y}
                                  stroke="currentColor"
                                  strokeWidth="1"
                                  className="stroke-gray-300 dark:stroke-gray-600"
                                />
                              );
                            })}
                            
                            {/* Filled area */}
                            <path
                              d={[
                                { key: 'proximity', value: interactiveScores.proximity },
                                { key: 'interest', value: interactiveScores.interest },
                                { key: 'personalTime', value: interactiveScores.personalTime },
                                { key: 'commonGround', value: interactiveScores.commonGround },
                                { key: 'familiarity', value: interactiveScores.familiarity },
                              ].map((item, idx) => {
                                const angle = (idx * (360 / 5) - 90 + 30) * (Math.PI / 180);
                                const length = item.value * 16;
                                const x = 160 + length * Math.cos(angle);
                                const y = 160 + length * Math.sin(angle);
                                return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                              }).join(' ') + ' Z'}
                              fill="#4f46e5"
                              fillOpacity="0.15"
                              stroke="#4f46e5"
                              strokeWidth="3"
                              opacity="0.6"
                            />
                            
                            {/* Points */}
                            {[
                              { key: 'proximity', value: interactiveScores.proximity, dimension: 'Proximity' },
                              { key: 'interest', value: interactiveScores.interest, dimension: 'Interest' },
                              { key: 'personalTime', value: interactiveScores.personalTime, dimension: 'Personal Time' },
                              { key: 'commonGround', value: interactiveScores.commonGround, dimension: 'Common Ground' },
                              { key: 'familiarity', value: interactiveScores.familiarity, dimension: 'Familiarity' },
                            ].map((item, idx) => {
                              const angle = (idx * (360 / 5) - 90 + 30) * (Math.PI / 180);
                              const length = item.value * 16;
                              // No offset needed now that chart is rotated away from edges
                              const offset = 0;
                              const x = 160 + (length + offset) * Math.cos(angle);
                              const y = 160 + (length + offset) * Math.sin(angle);
                              
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
                                    // Use minimum distance of 60px from center for low values to avoid overlap
                                    const labelDistance = Math.max(length - 30, 60);
                                    const labelX = 160 + labelDistance * Math.cos(angle);
                                    const labelY = 160 + labelDistance * Math.sin(angle);
                                    
                                    return (
                                      <>
                                        {item.dimension === 'Personal Time' ? (
                                        <>
                                          <text
                                            x={labelX}
                                            y={labelY - 6}
                                            textAnchor="middle"
                                            fontSize="14"
                                            fontWeight="600"
                                            fill="currentColor"
                                            className="fill-gray-900 dark:fill-gray-100"
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
                                            className="fill-gray-900 dark:fill-gray-100"
                                          >
                                            Time
                                          </text>
                                        </>
                                      ) : item.dimension === 'Common Ground' ? (
                                        <>
                                          <text
                                            x={labelX}
                                            y={labelY - 6}
                                            textAnchor="middle"
                                            fontSize="14"
                                            fontWeight="600"
                                            fill="currentColor"
                                            className="fill-gray-900 dark:fill-gray-100"
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
                                            className="fill-gray-900 dark:fill-gray-100"
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
                                          className="fill-gray-900 dark:fill-gray-100"
                                        >
                                          {item.dimension}
                                        </text>
                                      )}
                                      </>
                                    );
                                  })()}
                                </g>
                              );
                            })}
                          </svg>
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="border-t border-gray-200 dark:border-gray-700" />

                      {/* Star Score */}
                      <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                        <h3 className="mb-3 text-lg font-bold">Star Score</h3>
                        <div className="mb-4 text-center">
                          <div className="font-bold">
                            <span className="text-4xl text-indigo-600 dark:text-indigo-400">{starScore.toFixed(1)}</span>
                            <span className="text-2xl text-gray-400 dark:text-gray-600">/10</span>
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {starScore >= 8 ? 'Close Friend' : starScore >= 5 ? 'Friend' : starScore >= 3 ? 'Acquaintance' : starScore >= 1 ? 'Nodding Acquaintance' : 'Stranger'}
                          </div>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">
                              Personal Time (30%)
                            </span>
                            <span className="font-medium">{interactiveScores.personalTime}/10</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">
                              Common Ground (25%)
                            </span>
                            <span className="font-medium">{interactiveScores.commonGround}/10</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">
                              Familiarity (20%)
                            </span>
                            <span className="font-medium">{interactiveScores.familiarity}/10</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">
                              Interest (15%)
                            </span>
                            <span className="font-medium">{interactiveScores.interest}/10</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">
                              Proximity (10%)
                            </span>
                            <span className="font-medium">{interactiveScores.proximity}/10</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
