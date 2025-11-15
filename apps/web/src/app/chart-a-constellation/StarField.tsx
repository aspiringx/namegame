'use client'

// Chart Your Stars - 3D star field with 2D overlay
import { useState, useEffect, useCallback, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { StarData, StarOverlay } from './types'
import { MOCK_PEOPLE } from './mockData'
import { initializeStars } from './starData'
import Scene from './Scene'

export default function StarField() {
  const [_overlays, setOverlays] = useState<StarOverlay[]>([])
  const [useConstellationPositions, setUseConstellationPositions] =
    useState(false)
  const [manualControlsEnabled, setManualControlsEnabled] = useState(false)

  // Single source of truth: all star state keyed by person.id
  const [stars, setStars] = useState<Map<string, StarData>>(initializeStars)

  // Track viewport dimensions for precise positioning
  const [viewportDimensions, setViewportDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
  })

  // Track actual measured heights of header and nav panel
  const [layoutMeasurements, setLayoutMeasurements] = useState({
    headerHeight: 0,
    navPanelHeight: 0,
  })

  // Store initial nav panel height to prevent HUD jumping when text changes
  const initialNavPanelHeight = useRef<number>(0)

  const [targetStarIndex, setTargetStarIndex] = useState(0)
  const [previousStarIndex, setPreviousStarIndex] = useState(-1)
  const [narratorMessage, setNarratorMessage] = useState<string>('')
  const [displayedMessage, setDisplayedMessage] = useState<string>('')
  const [journeyPhase, setJourneyPhase] = useState<
    | 'intro'
    | 'selecting'
    | 'flying'
    | 'approaching'
    | 'arrived'
    | 'placed'
    | 'takeoff'
    | 'complete'
    | 'returning'
    | 'constellation-review'
  >('intro')
  const [introStep, setIntroStep] = useState(0)

  // Phase 1: Star selection state
  const [selectedStarIds, setSelectedStarIds] = useState<Set<string>>(new Set())
  const [visitQueue, setVisitQueue] = useState<string[]>([])
  const [showConstellationModal, setShowConstellationModal] = useState(false)

  // Derive placements from stars state
  const placements = new Map(
    Array.from(stars.entries())
      .filter(([_, star]) => star.placement)
      .map(([id, star]) => [id, star.placement!]),
  )

  // Track viewport dimensions and measure actual DOM elements
  const measureLayout = useCallback(() => {
    const width = window.innerWidth
    const height = window.innerHeight

    setViewportDimensions({ width, height })

    // Measure actual header bottom position
    const header = document.querySelector('header')
    const headerRect = header?.getBoundingClientRect()
    const headerBottom = headerRect ? headerRect.bottom : 0

    // Measure where nav panel actually starts on screen
    const navPanel = document.getElementById('nav-panel')
    const navPanelRect = navPanel?.getBoundingClientRect()
    const navPanelTop = navPanelRect ? navPanelRect.top : height
    const currentNavPanelHeight = height - navPanelTop

    // Store initial nav panel height on first measurement
    if (initialNavPanelHeight.current === 0 && currentNavPanelHeight > 0) {
      initialNavPanelHeight.current = currentNavPanelHeight
    }

    // Use initial height to prevent HUD jumping when nav panel text changes
    const measurements = {
      headerHeight: headerBottom,
      navPanelHeight: initialNavPanelHeight.current || currentNavPanelHeight,
    }
    setLayoutMeasurements(measurements)
  }, [])

  useEffect(() => {
    // Measure on mount and resize
    measureLayout()
    window.addEventListener('resize', measureLayout)

    return () => {
      window.removeEventListener('resize', measureLayout)
    }
  }, [measureLayout])

  // Remeasure when narrator message changes (nav panel appears/updates)
  useEffect(() => {
    if (narratorMessage) {
      // Small delay to ensure nav panel is rendered
      const timer = setTimeout(measureLayout, 50)
      return () => clearTimeout(timer)
    }
  }, [narratorMessage, measureLayout])

  // Show message instantly (typing effect removed)
  useEffect(() => {
    setDisplayedMessage(narratorMessage)
  }, [narratorMessage])

  // Intro sequence
  useEffect(() => {
    if (journeyPhase === 'intro') {
      // Multi-step intro messages
      const introMessages = [
        `Hi Mindy, welcome to the Hypothetical Group star cluster!`,
        `Our sensors vaguely detect ${MOCK_PEOPLE.length} stars you may (or may not) know.`,
        `<b>Your mission:</b> Chart the <i>current position</i> of stars in this cluster, in relation to you, to make a constellation.`,
        `Positions:<br /><br /><b>• Close</b>: Close friend, family<br /><b>• Near</b>: Passive friend, acquaintance<br /><b>• Far</b>: Unknown, distant`,
        'As you chart each star, a constellation will form, shaped by how you perceive relationships today.<br /><br />Ready?',
      ]
      setNarratorMessage(introMessages[introStep])
    }
  }, [journeyPhase, introStep])

  const handleBack = () => {
    if (journeyPhase === 'intro' && introStep > 0) {
      setIntroStep(introStep - 1)
    }
  }

  const startVisitingStars = () => {
    if (selectedStarIds.size === 0) {
      setNarratorMessage('Please select at least one star to visit.')
      return
    }

    // Create randomized queue from selected stars
    const selectedIds = Array.from(selectedStarIds)
    const shuffled = selectedIds.sort(() => Math.random() - 0.5)
    setVisitQueue(shuffled)

    // Start with first star in queue
    const firstPersonId = shuffled[0]
    const firstPersonIndex = MOCK_PEOPLE.findIndex(
      (p) => p.id === firstPersonId,
    )
    const firstPerson = MOCK_PEOPLE[firstPersonIndex]

    setTargetStarIndex(firstPersonIndex)
    setNarratorMessage(`Travelling to ${firstPerson.name}...`)
    setJourneyPhase('flying')
  }

  const handleProceed = () => {
    if (journeyPhase === 'intro') {
      // Progress through intro steps (0-4, total 5 messages)
      if (introStep < 4) {
        setIntroStep(introStep + 1)
      } else {
        // Intro complete, move to star selection
        setNarratorMessage(
          'Select stars to chart. You can begin with those you know or select all.',
        )
        setJourneyPhase('selecting')
      }
    } else if (journeyPhase === 'selecting') {
      // Start visiting selected stars in random order
      startVisitingStars()
    }
  }

  const handlePlacePerson = (circle: 'inner' | 'close' | 'outer') => {
    const person = MOCK_PEOPLE[targetStarIndex]

    // Update star with placement and mark as visited
    const updatedStars = new Map(stars)
    const starData = updatedStars.get(person.id)!
    starData.placement = circle
    starData.visited = true

    // Don't generate constellation position yet - let Scene.tsx handle it
    // when useConstellationPositions becomes true (on zoom out)
    // This prevents stars from jumping position immediately upon placement

    setStars(updatedStars)

    const circleLabel =
      circle === 'inner' ? 'Close' : circle === 'close' ? 'Near' : 'Far'

    // Remove current person from visit queue
    const updatedQueue = visitQueue.filter((id) => id !== person.id)
    setVisitQueue(updatedQueue)

    // Check if all stars are now placed
    const placedCount = Array.from(updatedStars.values()).filter(
      (s) => s.placement,
    ).length
    const allPlaced = placedCount === MOCK_PEOPLE.length

    if (allPlaced) {
      setNarratorMessage(
        `Journey complete! You've charted all ${MOCK_PEOPLE.length} stars in your constellation.`,
      )
      setJourneyPhase('complete')
    } else if (updatedQueue.length > 0) {
      // Continue with next star in queue - auto-proceed
      const nextPersonId = updatedQueue[0]
      const nextPersonIndex = MOCK_PEOPLE.findIndex(
        (p) => p.id === nextPersonId,
      )
      const nextPerson = MOCK_PEOPLE[nextPersonIndex]

      setNarratorMessage(
        `${person.name} charted as ${circleLabel}. Flying to ${nextPerson.name}...`,
      )
      setPreviousStarIndex(targetStarIndex)
      setTargetStarIndex(nextPersonIndex)
      setJourneyPhase('takeoff')
    } else {
      // Queue is empty - all selected stars visited
      const unchartedCount = MOCK_PEOPLE.length - placedCount
      if (unchartedCount > 0) {
        setNarratorMessage(
          `You've charted ${placedCount} stars! ${unchartedCount} 
          remain${
            unchartedCount === 1 ? 's' : ''
          } uncharted. Continue your journey, review stars, or zoom out to see your current constellation.`,
        )
      } else {
        setNarratorMessage(
          `Journey complete! You've charted all ${MOCK_PEOPLE.length} stars in your constellation.`,
        )
      }
      setJourneyPhase('complete')
    }
  }

  const handleProceedAfterPlacement = () => {
    // Check if there are more stars in the visit queue
    if (visitQueue.length > 0) {
      const nextPersonId = visitQueue[0]
      const nextUnvisitedIndex = MOCK_PEOPLE.findIndex(
        (p) => p.id === nextPersonId,
      )

      if (nextUnvisitedIndex >= 0) {
        const nextPerson = MOCK_PEOPLE[nextUnvisitedIndex]
        const distance = Math.floor(Math.random() * 100) + 50

        setNarratorMessage(
          `Next star: ${nextPerson.name}, currently ${distance} light years away.`,
        )
        setPreviousStarIndex(targetStarIndex)
        setTargetStarIndex(nextUnvisitedIndex)
        setJourneyPhase('takeoff')
      }
    } else {
      // No more stars in queue - should not reach here normally
      setNarratorMessage('All selected stars visited.')
      setJourneyPhase('complete')
    }
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100dvh' }}>
      <Canvas
        camera={{ position: [0, 0, 25], fov: 60 }}
        style={{ width: '100%', height: '100dvh' }}
      >
        <Scene
          stars={stars}
          onUpdateStars={setStars}
          onUpdateOverlays={setOverlays}
          targetStarIndex={targetStarIndex}
          previousStarIndex={previousStarIndex}
          viewportDimensions={viewportDimensions}
          layoutMeasurements={layoutMeasurements}
          onApproaching={(name: string) => {
            setNarratorMessage(`Approaching ${name}...`)
            setJourneyPhase('approaching')
          }}
          onArrived={(name: string) => {
            setNarratorMessage(`Arrived at ${name}! Where is this star today?`)
            setJourneyPhase('arrived')
          }}
          onTakeoffComplete={() => {
            // Transition to flying phase
            setJourneyPhase('flying')
          }}
          onReturnComplete={() => {
            // Update message based on completion status
            const chartedCount = placements.size
            const totalCount = MOCK_PEOPLE.length
            if (chartedCount === totalCount) {
              setNarratorMessage(
                'Your constellation is complete. All stars are in their places.',
              )
            } else {
              setNarratorMessage(
                `Viewing constellation... ${chartedCount} of ${totalCount} stars charted. Proceed with your journey or 
                explore with 🧑‍🚀.`,
              )
            }
          }}
          journeyPhase={journeyPhase}
          useConstellationPositions={useConstellationPositions}
          manualControlsEnabled={manualControlsEnabled}
        />
      </Canvas>

      {/* Manual Controls Toggle - Only in constellation view */}
      {journeyPhase === 'returning' && (
        <div className="fixed right-4 top-4 sm:right-6 sm:top-6 z-20">
          <button
            data-testid="manual-controls-toggle"
            onClick={() => {
              // Simply toggle manual controls - Scene.tsx handles camera state
              setManualControlsEnabled(!manualControlsEnabled)
            }}
            className={`group relative rounded-lg px-4 py-2.5 font-mono text-xs uppercase tracking-wider backdrop-blur-sm border-2 shadow-lg transition-all ${
              manualControlsEnabled
                ? 'bg-cyan-500/40 border-cyan-400 text-cyan-100 shadow-cyan-500/60 hover:bg-cyan-500/50'
                : 'bg-indigo-500/40 border-indigo-400 text-indigo-100 shadow-indigo-500/60 hover:bg-indigo-500/50'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-base">
                {manualControlsEnabled ? '🧑‍🚀' : '🚀'}
              </span>
              <span>{manualControlsEnabled ? 'Manual' : 'Auto-Pilot'}</span>
            </div>

            {/* Hint tooltip - shows on hover when manual mode is active */}
            {manualControlsEnabled && (
              <div className="absolute top-full right-0 mt-2 w-40 rounded-lg bg-slate-900/95 px-3 py-2 text-xs text-cyan-300 border border-cyan-500/30 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <div className="space-y-1">
                  <div>🖱️ Drag to rotate</div>
                  <div>🔍 Scroll to zoom</div>
                  <div className="pt-1 border-t border-cyan-500/30 text-cyan-400">
                    Click to reset
                  </div>
                </div>
              </div>
            )}
          </button>
        </div>
      )}

      {/* Navigation System - Control Panel Style */}
      {narratorMessage && (
        <div
          id="nav-panel"
          className="fixed left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-3xl px-2 sm:px-4"
          style={{ bottom: '1rem' }}
        >
          <div
            className={`relative overflow-hidden rounded-lg border-2 border-indigo-500/50 bg-gradient-to-b from-slate-900/50 to-slate-950/50 shadow-2xl backdrop-blur-sm`}
          >
            {/* Control panel accent lines */}
            <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-indigo-500 via-cyan-400 to-indigo-500"></div>
            <div className="absolute right-0 top-0 h-full w-1 bg-gradient-to-b from-indigo-500 via-cyan-400 to-indigo-500"></div>
            <div className="absolute left-0 bottom-0 h-1 w-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-indigo-500"></div>
            <div className="absolute right-0 bottom-0 h-1 w-full bg-gradient-to-l from-indigo-500 via-cyan-400 to-indigo-500"></div>

            {/* Content */}
            <div className="relative px-4 py-3 sm:px-6 sm:py-4">
              <div className="mb-1 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-cyan-400"></div>
                  <span className="text-xs font-mono uppercase tracking-wider text-cyan-400/70">
                    Navigation System
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {/* Zoom Out button - show during journey when stars are charted */}
                  {placements.size > 0 &&
                    placements.size < MOCK_PEOPLE.length &&
                    (journeyPhase === 'flying' ||
                      journeyPhase === 'approaching' ||
                      journeyPhase === 'arrived' ||
                      journeyPhase === 'takeoff') && (
                      <button
                        data-testid="zoom-out-button"
                        onClick={() => {
                          setNarratorMessage(
                            `Viewing constellation... ${placements.size} of ${MOCK_PEOPLE.length} stars charted. Explore with 🧑‍🚀 or...`,
                          )
                          setUseConstellationPositions(true)
                          setJourneyPhase('returning')
                        }}
                        className="text-xs px-2 py-1 rounded border border-indigo-400/50 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 hover:border-indigo-400 transition-colors"
                      >
                        ⊙ Zoom Out
                      </button>
                    )}
                </div>
              </div>
              <p
                className="font-mono text-xs leading-relaxed tracking-wide text-indigo-100 sm:text-sm pt-2"
                style={{ letterSpacing: '0.03em' }}
                dangerouslySetInnerHTML={{ __html: displayedMessage }}
              />

              {/* Star selection grid - show during selection phase */}
              {journeyPhase === 'selecting' && (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between text-xs text-indigo-300">
                    <span>{selectedStarIds.size} selected</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          setSelectedStarIds(
                            new Set(MOCK_PEOPLE.map((p) => p.id)),
                          )
                        }
                        className="px-2 py-1 rounded border border-indigo-400/30 bg-indigo-500/10 hover:bg-indigo-500/20 transition-colors"
                      >
                        Select All
                      </button>
                      <button
                        onClick={() => setSelectedStarIds(new Set())}
                        className="px-2 py-1 rounded border border-indigo-400/30 bg-indigo-500/10 hover:bg-indigo-500/20 transition-colors"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[40vh] overflow-y-auto pr-2">
                    {MOCK_PEOPLE.slice()
                      .sort((a, b) => {
                        const aLast = a.name.split(' ').slice(-1)[0]
                        const aFirst = a.name.split(' ').slice(0, -1).join(' ')
                        const bLast = b.name.split(' ').slice(-1)[0]
                        const bFirst = b.name.split(' ').slice(0, -1).join(' ')
                        const lastCompare = aLast.localeCompare(bLast)
                        return lastCompare !== 0
                          ? lastCompare
                          : aFirst.localeCompare(bFirst)
                      })
                      .map((person) => {
                        const isSelected = selectedStarIds.has(person.id)
                        return (
                          <button
                            key={person.id}
                            data-testid={`person-card-${person.id}`}
                            onClick={() => {
                              const newSelection = new Set(selectedStarIds)
                              if (isSelected) {
                                newSelection.delete(person.id)
                              } else {
                                newSelection.add(person.id)
                              }
                              setSelectedStarIds(newSelection)
                            }}
                            className={`flex items-center gap-2 p-2 rounded-lg border-2 transition-all ${
                              isSelected
                                ? 'border-cyan-400 bg-cyan-500/20'
                                : 'border-indigo-400/30 bg-indigo-500/10 hover:border-indigo-400/50'
                            }`}
                          >
                            <img
                              src={person.photo}
                              alt={person.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                            <span className="text-xs text-left text-white flex-1">
                              {person.name}
                            </span>
                            {isSelected && (
                              <span className="text-cyan-400">✓</span>
                            )}
                          </button>
                        )
                      })}
                  </div>
                </div>
              )}

              {/* Placement buttons - show when arrived at a star */}
              {journeyPhase === 'arrived' && (
                <div className="mt-3 flex gap-2">
                  <button
                    data-testid="placement-close"
                    onClick={() => handlePlacePerson('inner')}
                    className="flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-colors hover:bg-indigo-700 active:bg-indigo-800"
                  >
                    Close
                  </button>
                  <button
                    data-testid="placement-near"
                    onClick={() => handlePlacePerson('close')}
                    className="flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-colors hover:bg-indigo-700 active:bg-indigo-800"
                  >
                    Near
                  </button>
                  <button
                    data-testid="placement-far"
                    onClick={() => handlePlacePerson('outer')}
                    className="flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-colors hover:bg-indigo-700 active:bg-indigo-800"
                  >
                    Far
                  </button>
                </div>
              )}

              {/* Navigation buttons - show when waiting for user to advance */}
              {(journeyPhase === 'intro' ||
                journeyPhase === 'selecting' ||
                (journeyPhase === 'placed' &&
                  placements.size < MOCK_PEOPLE.length)) && (
                <div className="mt-3 flex gap-2">
                  {/* Back button - only show during intro if not on first step */}
                  {journeyPhase === 'intro' && introStep > 0 && (
                    <button
                      onClick={handleBack}
                      className="rounded border border-cyan-400/50 bg-cyan-500/10 px-3 py-2 font-mono text-sm font-medium text-cyan-400 transition-colors hover:bg-cyan-500/20 hover:border-cyan-400"
                      title="Previous message"
                    >
                      ←
                    </button>
                  )}
                  {/* Proceed button */}
                  <button
                    data-testid="proceed-button"
                    onClick={
                      journeyPhase === 'placed'
                        ? handleProceedAfterPlacement
                        : handleProceed
                    }
                    disabled={
                      journeyPhase === 'selecting' && selectedStarIds.size === 0
                    }
                    className={`flex-1 rounded border px-4 py-2 font-mono text-sm font-medium transition-colors ${
                      journeyPhase === 'selecting' && selectedStarIds.size === 0
                        ? 'border-cyan-400/20 bg-cyan-500/5 text-cyan-400/40 cursor-not-allowed'
                        : 'border-cyan-400/50 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 hover:border-cyan-400'
                    }`}
                  >
                    {journeyPhase === 'selecting'
                      ? `→ Visit ${selectedStarIds.size} Star${
                          selectedStarIds.size !== 1 ? 's' : ''
                        }`
                      : '→ Proceed'}
                  </button>
                </div>
              )}

              {/* Buttons in constellation view when not all stars charted */}
              {journeyPhase === 'returning' &&
                placements.size < MOCK_PEOPLE.length && (
                  <div className="mt-3 space-y-2">
                    <button
                      onClick={() => {
                        // Disable manual controls and return to auto-pilot
                        setManualControlsEnabled(false)

                        // Add all remaining unvisited stars to queue
                        const unvisitedIds = MOCK_PEOPLE.filter((p) => {
                          const starData = stars.get(p.id)!
                          return !starData.visited
                        }).map((p) => p.id)

                        if (unvisitedIds.length > 0) {
                          setVisitQueue(unvisitedIds)
                          const firstPersonId = unvisitedIds[0]
                          const firstPersonIndex = MOCK_PEOPLE.findIndex(
                            (p) => p.id === firstPersonId,
                          )
                          const firstPerson = MOCK_PEOPLE[firstPersonIndex]
                          setTargetStarIndex(firstPersonIndex)
                          setPreviousStarIndex(-1)
                          setNarratorMessage(`Flying to ${firstPerson.name}...`)
                          setJourneyPhase('flying')
                          setUseConstellationPositions(false)
                        }
                      }}
                      className="w-full rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-colors hover:bg-cyan-700 active:bg-cyan-800"
                    >
                      → Proceed
                    </button>
                    <button
                      onClick={() => {
                        setSelectedStarIds(new Set())
                        setShowConstellationModal(true)
                      }}
                      className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-colors hover:bg-indigo-700 active:bg-indigo-800"
                    >
                      ✦ Review
                    </button>
                  </div>
                )}

              {/* Action buttons when selected stars complete but uncharted remain */}
              {journeyPhase === 'complete' &&
                placements.size < MOCK_PEOPLE.length &&
                visitQueue.length === 0 && (
                  <div className="mt-3 space-y-2">
                    <button
                      onClick={() => {
                        // Disable manual controls when continuing journey
                        setManualControlsEnabled(false)
                        setUseConstellationPositions(false)

                        // Add all remaining unvisited stars to queue and start
                        const unvisitedIds = MOCK_PEOPLE.filter((p) => {
                          const starData = stars.get(p.id)!
                          return !starData.visited
                        }).map((p) => p.id)

                        if (unvisitedIds.length > 0) {
                          setVisitQueue(unvisitedIds)
                          const firstPersonId = unvisitedIds[0]
                          const firstPersonIndex = MOCK_PEOPLE.findIndex(
                            (p) => p.id === firstPersonId,
                          )
                          const firstPerson = MOCK_PEOPLE[firstPersonIndex]
                          setTargetStarIndex(firstPersonIndex)
                          setPreviousStarIndex(-1)
                          setNarratorMessage(`Flying to ${firstPerson.name}...`)
                          setJourneyPhase('flying')
                        }
                      }}
                      className="w-full rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-colors hover:bg-cyan-700 active:bg-cyan-800"
                    >
                      → Continue Journey
                    </button>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          setSelectedStarIds(new Set())
                          setShowConstellationModal(true)
                        }}
                        className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-colors hover:bg-indigo-700 active:bg-indigo-800"
                      >
                        ✦ Review
                      </button>
                      <button
                        data-testid="zoom-out-after-placement"
                        onClick={() => {
                          setNarratorMessage(
                            `Viewing constellation... ${placements.size} of ${MOCK_PEOPLE.length} stars charted. Explore with 🧑‍🚀 or...`,
                          )
                          setUseConstellationPositions(true)
                          setJourneyPhase('returning')
                        }}
                        className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-colors hover:bg-indigo-700 active:bg-indigo-800"
                      >
                        ⊙ Zoom Out
                      </button>
                    </div>
                  </div>
                )}

              {/* View Constellation button - large prominent button only when ALL stars charted */}
              {placements.size === MOCK_PEOPLE.length &&
                journeyPhase === 'complete' && (
                  <div className="mt-3">
                    <button
                      onClick={() => {
                        setNarratorMessage(
                          'Your constellation is complete. All stars are in their places.',
                        )
                        setUseConstellationPositions(true) // Trigger star repositioning
                        setJourneyPhase('returning')
                      }}
                      className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-colors hover:bg-indigo-700 active:bg-indigo-800"
                    >
                      ✦ View Constellation
                    </button>
                  </div>
                )}

              {/* Star counter footer */}
              <div className="mt-2 pt-1 pb-1 border-t border-indigo-500/30 text-center">
                <span className="text-xs font-mono text-indigo-300">
                  {journeyPhase === 'intro'
                    ? placements.size > 0
                      ? `${MOCK_PEOPLE.length} stars detected • ${placements.size} charted`
                      : `${MOCK_PEOPLE.length} stars detected`
                    : journeyPhase === 'returning'
                    ? `${placements.size} of ${MOCK_PEOPLE.length} stars charted`
                    : (() => {
                        const unplacedCount =
                          MOCK_PEOPLE.length - placements.size

                        // During 'placed' phase, find the next unvisited star for accurate count
                        let countIndex = targetStarIndex
                        if (journeyPhase === 'placed') {
                          // Find next unvisited star
                          const nextUnvisitedIndex = MOCK_PEOPLE.findIndex(
                            (p) => {
                              const starData = stars.get(p.id)!
                              return !starData.visited
                            },
                          )
                          if (nextUnvisitedIndex >= 0) {
                            countIndex = nextUnvisitedIndex
                          }
                        }

                        // Count unplaced stars up to and including the target/next star
                        const unplacedUpToCurrent = MOCK_PEOPLE.slice(
                          0,
                          countIndex + 1,
                        ).filter((p) => !placements.has(p.id)).length
                        return `Star ${unplacedUpToCurrent} of ${unplacedCount} remaining • ${placements.size} charted`
                      })()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Constellation Review Modal */}
      {showConstellationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="relative w-[90%] max-w-2xl max-h-[80vh] overflow-y-auto rounded-lg border-2 border-indigo-500/50 bg-gradient-to-b from-slate-900/95 to-slate-950/95 shadow-2xl">
            {/* Header */}
            <div className="sticky top-0 bg-slate-900/95 border-b border-indigo-500/30 p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">
                  Your Constellation ({placements.size}/{MOCK_PEOPLE.length}{' '}
                  charted)
                </h2>
                <button
                  onClick={() => setShowConstellationModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Close stars */}
              {Array.from(stars.entries()).filter(
                ([_, s]) => s.placement === 'inner',
              ).length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-cyan-400 mb-2">
                    ● Close (
                    {
                      Array.from(stars.entries()).filter(
                        ([_, s]) => s.placement === 'inner',
                      ).length
                    }
                    )
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {Array.from(stars.entries())
                      .filter(([_, s]) => s.placement === 'inner')
                      .map(([id]) => {
                        const person = MOCK_PEOPLE.find((p) => p.id === id)!
                        const isSelected = selectedStarIds.has(id)
                        return (
                          <button
                            key={id}
                            onClick={() => {
                              const newSelection = new Set(selectedStarIds)
                              if (isSelected) {
                                newSelection.delete(id)
                              } else {
                                newSelection.add(id)
                              }
                              setSelectedStarIds(newSelection)
                            }}
                            className={`flex items-center gap-2 p-2 rounded border-2 transition-all ${
                              isSelected
                                ? 'border-cyan-400 bg-cyan-500/20'
                                : 'border-indigo-400/30 bg-indigo-500/10 hover:border-indigo-400/50'
                            }`}
                          >
                            <img
                              src={person.photo}
                              alt={person.name}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                            <span className="text-xs text-white flex-1 text-left">
                              {person.name}
                            </span>
                            {isSelected && (
                              <span className="text-cyan-400">✓</span>
                            )}
                          </button>
                        )
                      })}
                  </div>
                </div>
              )}

              {/* Familiar/warm stars */}
              {Array.from(stars.entries()).filter(
                ([_, s]) => s.placement === 'close',
              ).length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-indigo-400 mb-2">
                    ● Near (
                    {
                      Array.from(stars.entries()).filter(
                        ([_, s]) => s.placement === 'close',
                      ).length
                    }
                    )
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {Array.from(stars.entries())
                      .filter(([_, s]) => s.placement === 'close')
                      .map(([id]) => {
                        const person = MOCK_PEOPLE.find((p) => p.id === id)!
                        const isSelected = selectedStarIds.has(id)
                        return (
                          <button
                            key={id}
                            onClick={() => {
                              const newSelection = new Set(selectedStarIds)
                              if (isSelected) {
                                newSelection.delete(id)
                              } else {
                                newSelection.add(id)
                              }
                              setSelectedStarIds(newSelection)
                            }}
                            className={`flex items-center gap-2 p-2 rounded border-2 transition-all ${
                              isSelected
                                ? 'border-cyan-400 bg-cyan-500/20'
                                : 'border-indigo-400/30 bg-indigo-500/10 hover:border-indigo-400/50'
                            }`}
                          >
                            <img
                              src={person.photo}
                              alt={person.name}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                            <span className="text-xs text-white flex-1 text-left">
                              {person.name}
                            </span>
                            {isSelected && (
                              <span className="text-cyan-400">✓</span>
                            )}
                          </button>
                        )
                      })}
                  </div>
                </div>
              )}

              {/* Distant/cold stars */}
              {Array.from(stars.entries()).filter(
                ([_, s]) => s.placement === 'outer',
              ).length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-gray-400 mb-2">
                    ● Far (
                    {
                      Array.from(stars.entries()).filter(
                        ([_, s]) => s.placement === 'outer',
                      ).length
                    }
                    )
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {Array.from(stars.entries())
                      .filter(([_, s]) => s.placement === 'outer')
                      .map(([id]) => {
                        const person = MOCK_PEOPLE.find((p) => p.id === id)!
                        const isSelected = selectedStarIds.has(id)
                        return (
                          <button
                            key={id}
                            onClick={() => {
                              const newSelection = new Set(selectedStarIds)
                              if (isSelected) {
                                newSelection.delete(id)
                              } else {
                                newSelection.add(id)
                              }
                              setSelectedStarIds(newSelection)
                            }}
                            className={`flex items-center gap-2 p-2 rounded border-2 transition-all ${
                              isSelected
                                ? 'border-cyan-400 bg-cyan-500/20'
                                : 'border-indigo-400/30 bg-indigo-500/10 hover:border-indigo-400/50'
                            }`}
                          >
                            <img
                              src={person.photo}
                              alt={person.name}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                            <span className="text-xs text-white flex-1 text-left">
                              {person.name}
                            </span>
                            {isSelected && (
                              <span className="text-cyan-400">✓</span>
                            )}
                          </button>
                        )
                      })}
                  </div>
                </div>
              )}

              {/* Uncharted stars - only show if there are any */}
              {Array.from(stars.entries()).filter(([_, s]) => !s.placement)
                .length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-gray-500 mb-2">
                    Uncharted (
                    {
                      Array.from(stars.entries()).filter(
                        ([_, s]) => !s.placement,
                      ).length
                    }
                    )
                  </h3>
                  <p className="text-xs text-gray-400 mb-2">
                    Select stars to visit next:
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {Array.from(stars.entries())
                      .filter(([_, s]) => !s.placement)
                      .map(([id]) => {
                        const person = MOCK_PEOPLE.find((p) => p.id === id)!
                        const isSelected = selectedStarIds.has(id)
                        return (
                          <button
                            key={id}
                            onClick={() => {
                              const newSelection = new Set(selectedStarIds)
                              if (isSelected) {
                                newSelection.delete(id)
                              } else {
                                newSelection.add(id)
                              }
                              setSelectedStarIds(newSelection)
                            }}
                            className={`flex items-center gap-2 p-2 rounded border-2 transition-all ${
                              isSelected
                                ? 'border-cyan-400 bg-cyan-500/20'
                                : 'border-gray-600 bg-gray-800/50 hover:border-gray-500'
                            }`}
                          >
                            <img
                              src={person.photo}
                              alt={person.name}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                            <span className="text-xs text-white flex-1 text-left">
                              {person.name}
                            </span>
                            {isSelected && (
                              <span className="text-cyan-400">✓</span>
                            )}
                          </button>
                        )
                      })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer with action buttons */}
            <div className="sticky bottom-0 bg-slate-900/95 border-t border-indigo-500/30 p-4">
              {selectedStarIds.size > 0 && (
                <button
                  onClick={() => {
                    setShowConstellationModal(false)
                    startVisitingStars()
                  }}
                  className="w-full rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-colors hover:bg-cyan-700 active:bg-cyan-800"
                >
                  → Visit {selectedStarIds.size} Selected Star
                  {selectedStarIds.size !== 1 ? 's' : ''}
                </button>
              )}
              <button
                onClick={() => setShowConstellationModal(false)}
                className="w-full mt-2 rounded border border-indigo-400/50 bg-indigo-500/10 px-4 py-2 text-sm font-medium text-indigo-300 transition-colors hover:bg-indigo-500/20"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
