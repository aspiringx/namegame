'use client';

import { useState } from 'react';

// Dummy data for demonstration
const dummyRelationships = [
  {
    name: 'Sarah (Close Friend)',
    data: [
      { dimension: 'Proximity', value: 7, max: 10 },
      { dimension: 'Interest', value: 9, max: 10 },
      { dimension: 'Personal Time', value: 8, max: 10 },
      { dimension: 'Common Ground', value: 9, max: 10 },
      { dimension: 'Familiarity', value: 9, max: 10 },
    ],
    scores: {
      proximity: 7,
      interest: 9,
      personalTime: 8,
      commonGround: 9,
      familiarity: 9,
    },
  },
  {
    name: 'Mike (Work Colleague)',
    data: [
      { dimension: 'Proximity', value: 9, max: 10 },
      { dimension: 'Interest', value: 3, max: 10 },
      { dimension: 'Personal Time', value: 2, max: 10 },
      { dimension: 'Common Ground', value: 5, max: 10 },
      { dimension: 'Familiarity', value: 5, max: 10 },
    ],
    scores: {
      proximity: 9,
      interest: 3,
      personalTime: 2,
      commonGround: 5,
      familiarity: 5,
    },
  },
  {
    name: 'Alex (Acquaintance)',
    data: [
      { dimension: 'Proximity', value: 5, max: 10 },
      { dimension: 'Interest', value: 5, max: 10 },
      { dimension: 'Personal Time', value: 3, max: 10 },
      { dimension: 'Common Ground', value: 4, max: 10 },
      { dimension: 'Familiarity', value: 4, max: 10 },
    ],
    scores: {
      proximity: 5,
      interest: 5,
      personalTime: 3,
      commonGround: 4,
      familiarity: 4,
    },
  },
];

function calculateStarScore(scores: any) {
  // Simplified weighted average of 5 input dimensions
  const personalTimeScore = scores.personalTime * 0.30; // Highest weight
  const commonGroundScore = scores.commonGround * 0.25;
  const familiarityScore = scores.familiarity * 0.20;
  const interestScore = scores.interest * 0.15;
  const proximityScore = scores.proximity * 0.10;

  const total =
    personalTimeScore +
    commonGroundScore +
    familiarityScore +
    interestScore +
    proximityScore;

  return {
    total: total.toFixed(1),
    breakdown: {
      personalTime: scores.personalTime,
      commonGround: scores.commonGround,
      familiarity: scores.familiarity,
      interest: scores.interest,
      proximity: scores.proximity,
    },
  };
}

function getRelationshipLabel(score: number) {
  if (score >= 8) return 'Close Friend';
  if (score >= 5) return 'Friend';
  if (score >= 3) return 'Acquaintance';
  if (score >= 1) return 'Nodding Acquaintance';
  return 'Stranger';
}

export default function RelationshipStarPage() {
  const [selectedRelationship, setSelectedRelationship] = useState(0);
  const [isInteractive, setIsInteractive] = useState(false);
  const [interactiveScores, setInteractiveScores] = useState({
    proximity: 0,
    interest: 0,
    personalTime: 0,
    commonGround: 0,
    familiarity: 0,
  });
  const [relationshipGoals, setRelationshipGoals] = useState('');
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const current = isInteractive
    ? {
        name: 'Your Assessment',
        data: [
          { dimension: 'Proximity', value: interactiveScores.proximity, max: 10 },
          { dimension: 'Interest', value: interactiveScores.interest, max: 10 },
          { dimension: 'Personal Time', value: interactiveScores.personalTime, max: 10 },
          { dimension: 'Common Ground', value: interactiveScores.commonGround, max: 10 },
          { dimension: 'Familiarity', value: interactiveScores.familiarity, max: 10 },
        ],
        scores: interactiveScores,
      }
    : dummyRelationships[selectedRelationship];
  
  const starScore = calculateStarScore(current.scores);

  const handleSliderChange = (dimension: string, value: number) => {
    setInteractiveScores(prev => ({
      ...prev,
      [dimension]: value,
    }));
  };

  const handleAIAssessment = async () => {
    setIsLoadingAI(true);
    setAiError(null);
    setAiInsight(null);

    try {
      const response = await fetch('/api/relation-star/ai-assessment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...interactiveScores,
          relationshipGoals: relationshipGoals || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to generate assessment');
      }

      setAiInsight(data.assessment.text);
    } catch (error) {
      setAiError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsLoadingAI(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 pb-24">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="mb-4 text-4xl font-bold">
          Relation Star
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          A visual framework for understanding and strengthening your
          relationships
        </p>
      </div>

      {/* Selector */}
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:justify-center sm:gap-4">
        {dummyRelationships.map((rel, idx) => (
          <button
            key={idx}
            onClick={() => {
              setIsInteractive(false);
              setSelectedRelationship(idx);
            }}
            className={`rounded-lg px-4 py-3 text-sm font-medium transition-colors sm:px-6 sm:text-base ${
              !isInteractive && selectedRelationship === idx
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {rel.name}
          </button>
        ))}
        <button
          onClick={() => setIsInteractive(true)}
          className={`rounded-lg px-4 py-3 text-sm font-medium transition-colors sm:px-6 sm:text-base ${
            isInteractive
              ? 'bg-green-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          Try It
        </button>
      </div>

      {/* Interactive Mode - Two Column Layout on Desktop */}
      {isInteractive && (
        <div className="mb-8 grid gap-8 lg:grid-cols-2">
          {/* Left: Sliders */}
          <div className="rounded-lg border border-green-200 bg-green-50 p-6 dark:border-green-900 dark:bg-green-950">
            <h2 className="mb-4 text-xl font-bold text-green-900 dark:text-green-100">
              Make a Relation Star
            </h2>
            <p className="mb-6 text-sm text-green-800 dark:text-green-200">
              Think of a relationship and adjust the sliders to show how you see 
              it today. 
            </p>
            <div className="space-y-6">
              {[
                { key: 'proximity', label: 'How often are you near this person?', hint: '(physically or virtually)', minLabel: 'Never', maxLabel: 'Daily' },
                { key: 'interest', label: 'How interested are you in this relationship?', hint: '(desire, ability, commitment)', minLabel: 'Not at all', maxLabel: 'Very interested' },
                { key: 'personalTime', label: 'How much personal time do you spend together?', hint: '(focused on each other/voluntary activities, not formal/required group tasks)', minLabel: 'None', maxLabel: 'A lot' },
                { key: 'commonGround', label: 'How much common ground do you share?', hint: '(interests, values, experiences)', minLabel: 'None', maxLabel: 'A lot' },
                { key: 'familiarity', label: 'How well do you know them?', hint: '(from name recognition to deep understanding)', minLabel: 'Not at all', maxLabel: 'Very well' },
              ].map(({ key, label, hint, minLabel, maxLabel }) => (
                <div key={key}>
                  <div className="mb-2 flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {label}
                      </label>
                      <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">{hint}</div>
                    </div>
                    <span className="text-lg font-bold text-green-700 dark:text-green-300 flex-shrink-0">
                      {interactiveScores[key as keyof typeof interactiveScores]}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={interactiveScores[key as keyof typeof interactiveScores]}
                    onChange={(e) => handleSliderChange(key, parseInt(e.target.value))}
                    className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 dark:bg-gray-700"
                    style={{
                      background: `linear-gradient(to right, #4f46e5 0%, #4f46e5 ${interactiveScores[key as keyof typeof interactiveScores] * 10}%, #e5e7eb ${interactiveScores[key as keyof typeof interactiveScores] * 10}%, #e5e7eb 100%)`
                    }}
                  />
                  <div className="mt-1 flex justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>0 - {minLabel}</span>
                    <span>10 - {maxLabel}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Relationship Goals */}
            <div className="mt-8 space-y-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                What would you like or hope for in this relationship? <span className="text-gray-500">(optional)</span>
              </label>
              <textarea
                value={relationshipGoals}
                onChange={(e) => setRelationshipGoals(e.target.value)}
                placeholder="e.g., I'd like to feel closer to my teenage daughter, or I want to maintain this friendship despite living far apart..."
                maxLength={500}
                rows={3}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
              />
              <div className="text-xs text-gray-500 dark:text-gray-400 text-right">
                {relationshipGoals.length}/500 characters
              </div>
            </div>

            {/* AI Assessment Button */}
            <div className="mt-6">
              <button
                onClick={handleAIAssessment}
                disabled={isLoadingAI || Object.values(interactiveScores).every(v => v === 0)}
                className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500 dark:disabled:bg-gray-700 dark:disabled:text-gray-400"
              >
                {isLoadingAI ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Generating insights...
                  </span>
                ) : Object.values(interactiveScores).every(v => v === 0) ? (
                  'Adjust sliders to get AI insights'
                ) : (
                  'Get AI Insight (Sign in required)'
                )}
              </button>
              
              {aiError && (
                <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-200">
                  {aiError}
                </div>
              )}
              
              {aiInsight && (
                <div className="mt-4 rounded-lg border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-900 dark:bg-indigo-950">
                  <h4 className="mb-2 font-semibold text-indigo-900 dark:text-indigo-100">
                    AI Insight
                  </h4>
                  <p className="text-sm text-indigo-800 dark:text-indigo-200">
                    {aiInsight}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right: Chart and Score */}
          <div className="space-y-6">
            {/* Mini Chart */}
            <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <h3 className="mb-3 text-lg font-bold">Star Chart</h3>
              <div className="relative mx-auto aspect-square w-full">
                <svg viewBox="0 0 240 240" className="h-full w-full">
                  {/* Center point */}
                  <circle cx="120" cy="120" r="2" fill="#4f46e5" />
                  
                  {/* Concentric circles */}
                  {[20, 40, 60, 80, 100].map((radius) => (
                    <circle
                      key={radius}
                      cx="120"
                      cy="120"
                      r={radius}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="0.5"
                      className="stroke-gray-300 dark:stroke-gray-600"
                    />
                  ))}
                  
                  {/* Axes */}
                  {current.data.map((_, idx) => {
                    const angle = (idx * (360 / current.data.length) - 90) * (Math.PI / 180);
                    const x = 120 + 100 * Math.cos(angle);
                    const y = 120 + 100 * Math.sin(angle);
                    return (
                      <line
                        key={idx}
                        x1="120"
                        y1="120"
                        x2={x}
                        y2={y}
                        stroke="currentColor"
                        strokeWidth="0.5"
                        className="stroke-gray-300 dark:stroke-gray-600"
                      />
                    );
                  })}
                  
                  {/* Filled area */}
                  <path
                    d={current.data.map((item, idx) => {
                      const angle = (idx * (360 / current.data.length) - 90) * (Math.PI / 180);
                      const length = item.value * 10;
                      const x = 120 + length * Math.cos(angle);
                      const y = 120 + length * Math.sin(angle);
                      return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                    }).join(' ') + ' Z'}
                    fill="#4f46e5"
                    fillOpacity="0.15"
                    stroke="#4f46e5"
                    strokeWidth="2"
                    opacity="0.6"
                  />
                  
                  {/* Points */}
                  {current.data.map((item, idx) => {
                    const angle = (idx * (360 / current.data.length) - 90) * (Math.PI / 180);
                    const length = item.value * 10;
                    const x = 120 + length * Math.cos(angle);
                    const y = 120 + length * Math.sin(angle);
                    
                    return (
                      <g key={idx}>
                        <circle
                          cx={x}
                          cy={y}
                          r="6"
                          fill="#4f46e5"
                          opacity="0.3"
                        />
                        <circle
                          cx={x}
                          cy={y}
                          r="3"
                          fill="#4f46e5"
                        />
                        
                        {/* Labels - only show if value > 0 */}
                        {item.value > 0 && (
                          <>
                            {item.dimension === 'Personal Time' ? (
                              <>
                                <text
                                  x={120 + (length + 20) * Math.cos(angle)}
                                  y={120 + (length + 20) * Math.sin(angle) - 4}
                                  textAnchor="middle"
                                  fontSize="9"
                                  fill="currentColor"
                                  className="fill-gray-600 dark:fill-gray-400"
                                >
                                  Personal
                                </text>
                                <text
                                  x={120 + (length + 20) * Math.cos(angle)}
                                  y={120 + (length + 20) * Math.sin(angle) + 5}
                                  textAnchor="middle"
                                  fontSize="9"
                                  fill="currentColor"
                                  className="fill-gray-600 dark:fill-gray-400"
                                >
                                  Time
                                </text>
                              </>
                            ) : item.dimension === 'Common Ground' ? (
                              <>
                                <text
                                  x={120 + (length + 20) * Math.cos(angle)}
                                  y={120 + (length + 20) * Math.sin(angle) - 4}
                                  textAnchor="middle"
                                  fontSize="9"
                                  fill="currentColor"
                                  className="fill-gray-600 dark:fill-gray-400"
                                >
                                  Common
                                </text>
                                <text
                                  x={120 + (length + 20) * Math.cos(angle)}
                                  y={120 + (length + 20) * Math.sin(angle) + 5}
                                  textAnchor="middle"
                                  fontSize="9"
                                  fill="currentColor"
                                  className="fill-gray-600 dark:fill-gray-400"
                                >
                                  Ground
                                </text>
                              </>
                            ) : (
                              <text
                                x={120 + (length + 20) * Math.cos(angle)}
                                y={120 + (length + 20) * Math.sin(angle)}
                                textAnchor="middle"
                                fontSize="9"
                                fill="currentColor"
                                className="fill-gray-600 dark:fill-gray-400"
                              >
                                {item.dimension}
                              </text>
                            )}
                          </>
                        )}
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* Mini Score Breakdown */}
            <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <h3 className="mb-3 text-lg font-bold">Star Score</h3>
              <div className="mb-4 text-center">
                <div className="text-4xl font-bold text-indigo-600">
                  {starScore.total}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {getRelationshipLabel(parseFloat(starScore.total))}
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Personal Time (30%)
                  </span>
                  <span className="font-medium">{starScore.breakdown.personalTime}/10</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Common Ground (25%)
                  </span>
                  <span className="font-medium">
                    {starScore.breakdown.commonGround}/10
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Familiarity (20%)
                  </span>
                  <span className="font-medium">
                    {starScore.breakdown.familiarity}/10
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Interest (15%)
                  </span>
                  <span className="font-medium">
                    {starScore.breakdown.interest}/10
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Proximity (10%)
                  </span>
                  <span className="font-medium">
                    {starScore.breakdown.proximity}/10
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Grid - Only show when not in interactive mode */}
      {!isInteractive && (
        <div className="grid gap-8 lg:grid-cols-2">
        {/* Chart */}
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800 sm:p-6">
          <h2 className="mb-4 text-xl font-bold">Star Chart</h2>
          <div className="relative mx-auto aspect-square w-full max-w-md">
            <svg viewBox="0 0 240 240" className="h-full w-full">
              {/* Center point */}
              <circle cx="120" cy="120" r="2" fill="#4f46e5" />
              
              {/* Grid circles */}
              {[2, 4, 6, 8, 10].map((val) => (
                <circle
                  key={val}
                  cx="120"
                  cy="120"
                  r={val * 8}
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="0.5"
                  className="dark:stroke-gray-600"
                />
              ))}
              
              {/* Scale numbers (0, 5, 10) positioned horizontally to the left */}
              {[0, 5, 10].map((val) => (
                <text
                  key={val}
                  x={120 - val * 8 - 5}
                  y="123"
                  textAnchor="middle"
                  fontSize="8"
                  fill="currentColor"
                  className="fill-gray-500 dark:fill-gray-400"
                >
                  {val}
                </text>
              ))}
              
              {/* Filled area with very low opacity */}
              <path
                d={current.data.map((item, idx) => {
                  const angle = (idx * (360 / current.data.length) - 90) * (Math.PI / 180);
                  const length = item.value * 8;
                  const x = 120 + length * Math.cos(angle);
                  const y = 120 + length * Math.sin(angle);
                  return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                }).join(' ') + ' Z'}
                fill="#4f46e5"
                fillOpacity="0.15"
                stroke="#4f46e5"
                strokeWidth="2"
                opacity="0.6"
              />
              
              {/* Points with glow at each dimension */}
              {current.data.map((item, idx) => {
                const angle = (idx * (360 / current.data.length) - 90) * (Math.PI / 180);
                const length = item.value * 8;
                const x = 120 + length * Math.cos(angle);
                const y = 120 + length * Math.sin(angle);
                
                return (
                  <g key={idx}>
                    {/* Glow effect */}
                    <circle
                      cx={x}
                      cy={y}
                      r="8"
                      fill="#818cf8"
                      opacity="0.3"
                    />
                    <circle
                      cx={x}
                      cy={y}
                      r="5"
                      fill="#4f46e5"
                    />
                    <circle
                      cx={x}
                      cy={y}
                      r="3"
                      fill="#c7d2fe"
                    />
                    {/* Label */}
                    {item.dimension === 'Personal Time' ? (
                      <>
                        <text
                          x={120 + (length + 25) * Math.cos(angle)}
                          y={120 + (length + 25) * Math.sin(angle) - 4}
                          textAnchor="middle"
                          fontSize="9"
                          fill="currentColor"
                          className="fill-gray-600 dark:fill-gray-400"
                        >
                          Personal
                        </text>
                        <text
                          x={120 + (length + 25) * Math.cos(angle)}
                          y={120 + (length + 25) * Math.sin(angle) + 5}
                          textAnchor="middle"
                          fontSize="9"
                          fill="currentColor"
                          className="fill-gray-600 dark:fill-gray-400"
                        >
                          Time
                        </text>
                      </>
                    ) : item.dimension === 'Common Ground' ? (
                      <>
                        <text
                          x={120 + (length + 25) * Math.cos(angle)}
                          y={120 + (length + 25) * Math.sin(angle) - 4}
                          textAnchor="middle"
                          fontSize="9"
                          fill="currentColor"
                          className="fill-gray-600 dark:fill-gray-400"
                        >
                          Common
                        </text>
                        <text
                          x={120 + (length + 25) * Math.cos(angle)}
                          y={120 + (length + 25) * Math.sin(angle) + 5}
                          textAnchor="middle"
                          fontSize="9"
                          fill="currentColor"
                          className="fill-gray-600 dark:fill-gray-400"
                        >
                          Ground
                        </text>
                      </>
                    ) : (
                      <text
                        x={120 + (length + 25) * Math.cos(angle)}
                        y={120 + (length + 25) * Math.sin(angle)}
                        textAnchor="middle"
                        fontSize="9"
                        fill="currentColor"
                        className="fill-gray-600 dark:fill-gray-400"
                      >
                        {item.dimension}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Star Score */}
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800 sm:p-6">
          <h2 className="mb-4 text-xl font-bold">Star Score</h2>
          <div className="mb-6">
            <div className="mb-2 text-5xl font-bold text-indigo-600">
              {starScore.total}
              <span className="text-2xl text-gray-500">/10</span>
            </div>
            <div className="text-lg font-medium text-gray-700 dark:text-gray-300">
              {getRelationshipLabel(parseFloat(starScore.total))}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-gray-700 dark:text-gray-300">
              Score Breakdown:
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Personal Time (30%)
                </span>
                <span className="font-medium">{starScore.breakdown.personalTime}/10</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Common Ground (25%)
                </span>
                <span className="font-medium">
                  {starScore.breakdown.commonGround}/10
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Familiarity (20%)
                </span>
                <span className="font-medium">
                  {starScore.breakdown.familiarity}/10
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Interest (15%)
                </span>
                <span className="font-medium">
                  {starScore.breakdown.interest}/10
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Proximity (10%)
                </span>
                <span className="font-medium">
                  {starScore.breakdown.proximity}/10
                </span>
              </div>
              <div className="border-t border-gray-200 pt-2 dark:border-gray-700">
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>{starScore.total}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Educational Content */}
      <div className="mt-12 space-y-8">
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-2xl font-bold">
            How to Read the Star Chart
          </h2>
          <div className="space-y-4 text-gray-700 dark:text-gray-300">
            <p>
              The <strong>Relationship Star Chart</strong> visualizes five key
              dimensions of your relationships. Each axis represents a different
              aspect, scored from 0-10. The dimensions are weighted differently in the final Star Score because they have different impacts on relationship depth:
            </p>
            <ul className="ml-6 list-disc space-y-2">
              <li>
                <strong>Personal Time (30%)</strong>: Time spent focusing on each
                other (not tasks or large groups). <em>Weighted highest because this is the primary way deep relationships are built.</em>
              </li>
              <li>
                <strong>Common Ground (25%)</strong>: Shared identity, experiences, interests, and values that create natural connection points. <em>Essential for having things to talk about and do together.</em>
              </li>
              <li>
                <strong>Familiarity (20%)</strong>: How well you know them (from basic
                recognition to deep understanding). <em>Knowing someone deeply enables trust and vulnerability.</em>
              </li>
              <li>
                <strong>Interest (15%)</strong>: Your desire, ability, and commitment to the relationship. <em>Your investment matters, but actions (time spent) matter more than intentions.</em>
              </li>
              <li>
                <strong>Proximity (10%)</strong>: How often you're near this person—physically (neighbors, coworkers), emotionally (frequent calls/texts), or through shared groups (church, school, clubs). <em>Proximity creates opportunities, but doesn't guarantee depth.</em>
              </li>
            </ul>
            <p>
              <strong>The star points matter!</strong> Each glowing point extends outward from the center based on that dimension's strength. A larger star constellation with points reaching further out indicates a stronger relationship. Shorter points reveal areas where the relationship could grow.
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-2xl font-bold">
            Understanding Your Star Score
          </h2>
          <div className="space-y-4 text-gray-700 dark:text-gray-300">
            <p>
              The <strong>Star Score</strong> is a weighted calculation that
              reflects relationship strength:
            </p>
            <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
              <div className="space-y-2 font-mono text-sm">
                <div>Star Score = </div>
                <div className="ml-4">Personal Time × 30%</div>
                <div className="ml-4">+ Common Ground × 25%</div>
                <div className="ml-4">+ Familiarity × 20%</div>
                <div className="ml-4">+ Interest × 15%</div>
                <div className="ml-4">+ Proximity × 10%</div>
              </div>
            </div>
            <p>
              <strong>Why these weights?</strong> Personal time is the primary way deep relationships are built (30%). 
              Common ground provides essential connection points (25%). Deep knowledge enables trust (20%). 
              Your investment matters, but actions matter more than intentions (15%). Proximity creates opportunities but doesn't guarantee depth (10%).
            </p>
            <div className="mt-4">
              <h3 className="mb-2 font-semibold">Score Ranges:</h3>
              <ul className="ml-6 list-disc space-y-1">
                <li>
                  <strong>8-10</strong>: Close Friend
                </li>
                <li>
                  <strong>5-7</strong>: Friend
                </li>
                <li>
                  <strong>3-4</strong>: Acquaintance
                </li>
                <li>
                  <strong>1-2</strong>: Nodding Acquaintance
                </li>
                <li>
                  <strong>0</strong>: Stranger
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-2xl font-bold">Example Insights</h2>
          <div className="space-y-6">
            {/* Sarah Example */}
            <div>
              <h3 className="mb-2 font-semibold text-indigo-600">
                Sarah (Close Friend) - Score: {calculateStarScore(dummyRelationships[0].scores).total}
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                Sarah's star is large and well-balanced. High scores across all
                dimensions indicate a strong, healthy friendship. You've invested
                significant personal time together (8/10), shared formative
                experiences (9/10), and know each other deeply (9/10). This is a
                close friendship with strong mutual commitment.
              </p>
            </div>

            {/* Mike Example */}
            <div>
              <h3 className="mb-2 font-semibold text-indigo-600">
                Mike (Work Colleague) - Score: {calculateStarScore(dummyRelationships[1].scores).total}
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                Mike's star shows high proximity (9/10) but low personal time
                (2/10). This is typical of work relationships—you see each other
                often and collaborate on tasks, but haven't spent much
                relationship-focused time together. The algorithm correctly
                identifies this as an acquaintance, not a friend, despite the high
                task-focused time (9/10).
              </p>
            </div>

            {/* Alex Example */}
            <div>
              <h3 className="mb-2 font-semibold text-indigo-600">
                Alex (Acquaintance) - Score: {calculateStarScore(dummyRelationships[2].scores).total}
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                Alex's star is smaller and more evenly distributed at moderate
                levels. You have some desire to deepen the relationship (6/10) but
                haven't yet invested much personal time (3/10) or built deep
                familiarity (4/10). This represents potential—with intentional
                effort, this could grow into a friendship.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-6 dark:border-indigo-900 dark:bg-indigo-950">
          <h2 className="mb-4 text-2xl font-bold text-indigo-900 dark:text-indigo-100">
            Key Insight: Personal Time Matters Most
          </h2>
          <p className="text-indigo-800 dark:text-indigo-200">
            Notice how Mike (work colleague) has high proximity but a low Star Score. This is intentional—the algorithm heavily
            weights <strong>Personal Time</strong> (30%), followed by <strong>Common Ground</strong> (25%) and <strong>Familiarity</strong> (20%). 
            You can spend 40 hours a week with someone on work projects and still be acquaintances if you
            never spend time focusing on each other as people or building common ground beyond work.
          </p>
        </div>
      </div>
    </div>
  );
}
