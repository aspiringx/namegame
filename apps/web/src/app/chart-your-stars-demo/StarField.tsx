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
    | 'flying'
    | 'approaching'
    | 'arrived'
    | 'placed'
    | 'takeoff'
    | 'complete'
    | 'returning'
  >('intro')
  const [introStep, setIntroStep] = useState(0)

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
    const header = document.querySelector('h1')?.parentElement
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
        `Mindy, welcome to the Trail Blazers star cluster!`,
        `It has ${MOCK_PEOPLE.length} stars. Each is a person in this sector of your universe.`,
        `Your mission is to chart the <i>current</i> position of each star to form a constellation. Each may be...`,
        `<i>Close</i>: tight family/friends/like-family<br /><i>Familiar</i>: near, but passively close<br /><i>Distant</i>: unfamiliar or feels far`,
        'Are you ready?',
      ]
      setNarratorMessage(introMessages[introStep])
    }
  }, [journeyPhase, introStep])

  const handleBack = () => {
    if (journeyPhase === 'intro' && introStep > 0) {
      setIntroStep(introStep - 1)
    }
  }

  const handleProceed = () => {
    if (journeyPhase === 'intro') {
      // Progress through intro steps (0-4, total 5 messages)
      if (introStep < 4) {
        setIntroStep(introStep + 1)
      } else {
        // Intro complete, start with first star (index 0)
        const firstPerson = MOCK_PEOPLE[0]
        setTargetStarIndex(0)
        setNarratorMessage(`Travelling to ${firstPerson.name}...`)
        setJourneyPhase('flying')
      }
    }
  }

  const handlePlacePerson = (circle: 'inner' | 'close' | 'outer') => {
    const person = MOCK_PEOPLE[targetStarIndex]

    // Update star with placement and mark as visited
    const updatedStars = new Map(stars)
    const starData = updatedStars.get(person.id)!
    starData.placement = circle
    starData.visited = true
    setStars(updatedStars)

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
    } else {
      // Find next unvisited star in MOCK_PEOPLE order using the UPDATED stars map
      const nextUnvisitedIndex = MOCK_PEOPLE.findIndex((p) => {
        const starData = updatedStars.get(p.id)!
        return !starData.visited
      })

      if (nextUnvisitedIndex >= 0) {
        const nextPerson = MOCK_PEOPLE[nextUnvisitedIndex]
        const circleLabel =
          circle === 'inner'
            ? 'Close'
            : circle === 'close'
            ? 'Familiar'
            : 'Distant'
        setNarratorMessage(
          `${person.name} charted as ${circleLabel}. Next up: ${nextPerson.name}`,
        )
        setJourneyPhase('placed')
      } else {
        // No more unvisited stars
        setNarratorMessage(
          `Journey complete! You've charted all ${MOCK_PEOPLE.length} stars in your constellation.`,
        )
        setJourneyPhase('complete')
      }
    }
  }

  const handleProceedAfterPlacement = () => {
    // Find next unvisited star in MOCK_PEOPLE order
    const nextUnvisitedIndex = MOCK_PEOPLE.findIndex((p) => {
      const starData = stars.get(p.id)!
      return !starData.visited
    })

    if (nextUnvisitedIndex >= 0) {
      const nextPerson = MOCK_PEOPLE[nextUnvisitedIndex]
      const distance = Math.floor(Math.random() * 100) + 50

      setNarratorMessage(
        `Next star: ${nextPerson.name}, currently ${distance} light years away.`,
      )
      setPreviousStarIndex(targetStarIndex)
      setTargetStarIndex(nextUnvisitedIndex)
      setJourneyPhase('takeoff')
    } else {
      setNarratorMessage('Journey complete! All stars have been charted.')
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
                `Viewing constellation... ${chartedCount} of ${totalCount} stars charted. You can resume your journey anytime.`,
              )
            }
          }}
          journeyPhase={journeyPhase}
          useConstellationPositions={useConstellationPositions}
        />
      </Canvas>

      {/* Navigation System - Control Panel Style */}
      {narratorMessage && (
        <div
          id="nav-panel"
          className="fixed left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-3xl px-2 sm:px-4"
          style={{ bottom: '1rem' }}
        >
          <div className="relative overflow-hidden rounded-lg border-2 border-indigo-500/50 bg-gradient-to-b from-slate-900 to-slate-950 shadow-2xl">
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
                {/* View Constellation - small button in header when journey incomplete */}
                {placements.size > 0 &&
                  placements.size < MOCK_PEOPLE.length &&
                  journeyPhase === 'placed' && (
                    <button
                      onClick={() => {
                        setNarratorMessage(
                          `Viewing constellation... ${placements.size} of ${MOCK_PEOPLE.length} stars charted. You can resume your journey anytime.`,
                        )
                        setUseConstellationPositions(true)
                        setJourneyPhase('returning')
                      }}
                      className="text-xs px-2 py-1 rounded border border-indigo-400/50 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 hover:border-indigo-400 transition-colors"
                    >
                      ✦ Zoom Out
                    </button>
                  )}
              </div>
              <p
                className="font-mono text-xs leading-relaxed tracking-wide text-indigo-100 sm:text-sm pt-2"
                style={{ letterSpacing: '0.03em' }}
                dangerouslySetInnerHTML={{ __html: displayedMessage }}
              />

              {/* Placement buttons - show when arrived at a star */}
              {journeyPhase === 'arrived' && (
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => handlePlacePerson('inner')}
                    className="flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-colors hover:bg-indigo-700 active:bg-indigo-800"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => handlePlacePerson('close')}
                    className="flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-colors hover:bg-indigo-700 active:bg-indigo-800"
                  >
                    Familiar
                  </button>
                  <button
                    onClick={() => handlePlacePerson('outer')}
                    className="flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-colors hover:bg-indigo-700 active:bg-indigo-800"
                  >
                    Distant
                  </button>
                </div>
              )}

              {/* Navigation buttons - show when waiting for user to advance */}
              {(journeyPhase === 'intro' ||
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
                    onClick={
                      journeyPhase === 'placed'
                        ? handleProceedAfterPlacement
                        : handleProceed
                    }
                    className="flex-1 rounded border border-cyan-400/50 bg-cyan-500/10 px-4 py-2 font-mono text-sm font-medium text-cyan-400 transition-colors hover:bg-cyan-500/20 hover:border-cyan-400"
                  >
                    → Proceed
                  </button>
                </div>
              )}

              {/* Resume Journey button - show in constellation view when not all stars charted */}
              {journeyPhase === 'returning' &&
                placements.size < MOCK_PEOPLE.length && (
                  <div className="mt-3">
                    <button
                      onClick={() => {
                        // Find next unvisited star from MOCK_PEOPLE
                        const nextUnvisitedIndex = MOCK_PEOPLE.findIndex(
                          (p) => {
                            const starData = stars.get(p.id)!
                            return !starData.visited
                          },
                        )

                        if (nextUnvisitedIndex >= 0) {
                          const nextPerson = MOCK_PEOPLE[nextUnvisitedIndex]
                          setTargetStarIndex(nextUnvisitedIndex)
                          setPreviousStarIndex(-1) // No previous star when resuming from constellation
                          setNarratorMessage(`Flying to ${nextPerson.name}...`)
                          setJourneyPhase('flying')
                          setUseConstellationPositions(false) // Exit constellation view
                        }
                      }}
                      className="w-full rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-colors hover:bg-cyan-700 active:bg-cyan-800"
                    >
                      → Resume Journey
                    </button>
                  </div>
                )}

              {/* View Constellation button - large prominent button only when journey complete */}
              {placements.size === MOCK_PEOPLE.length &&
                journeyPhase === 'complete' && (
                  <div className="mt-3">
                    <button
                      onClick={() => {
                        const chartedCount = placements.size
                        const totalCount = MOCK_PEOPLE.length
                        if (chartedCount === totalCount) {
                          setNarratorMessage(
                            'Your constellation is complete. All stars are in their places.',
                          )
                        } else {
                          setNarratorMessage(
                            `Viewing constellation... ${chartedCount} of ${totalCount} stars charted. You can resume your journey anytime.`,
                          )
                        }
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
    </div>
  )
}
