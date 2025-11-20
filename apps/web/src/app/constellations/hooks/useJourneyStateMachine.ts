/**
 * useJourneyStateMachine
 *
 * Central state management for the star charting journey.
 * Manages all journey phases, star selection, and navigation flow.
 *
 * This hook ensures that all state transitions are atomic and consistent.
 * Instead of scattered setState calls throughout the app, all journey actions
 * (like zoomOut, placeStar, continueJourney) are handled here with guaranteed
 * state consistency.
 *
 * Returns:
 * - state: Current journey state (phase, selected stars, target star, etc.)
 * - actions: Functions to trigger state transitions (zoomOut, placeStar, etc.)
 * - shouldResetCamera: Ref that signals Scene.tsx when to recalculate constellation position
 */

import { useState, useCallback, useRef, useMemo, useEffect } from 'react'
import { StarData, JourneyPhase, Person } from '../types'
import { MOCK_PEOPLE } from '../mockData'

interface JourneyState {
  phase: JourneyPhase
  introStep: number
  targetStarIndex: number
  previousStarIndex: number
  selectedStarIds: Set<string>
  visitQueue: string[]
  useConstellationPositions: boolean
  manualControlsEnabled: boolean
  narratorMessage: string
}

interface JourneyActions {
  // Intro flow
  advanceIntro: () => void
  backIntro: () => void
  startSelection: () => void

  // Star selection
  toggleStarSelection: (starId: string) => void
  selectAllStars: () => void
  clearStars: () => void
  startVisitingSelectedStars: () => void

  // Journey flow
  onApproaching: (name: string) => void
  onArrived: (name: string) => void
  placeStar: (starId: string, placement: 'inner' | 'close' | 'outer') => void
  onTakeoffComplete: () => void
  proceedAfterPlacement: () => void

  // Constellation view
  zoomOut: () => void
  enableManualControls: (enabled: boolean) => void
  openReviewModal: () => void
  closeReviewModal: () => void
  continueJourney: () => void

  // Internal callbacks
  onReturnComplete: () => void
}

export function useJourneyStateMachine(
  stars: Map<string, StarData>,
  onStarsUpdate: (
    updater: (prev: Map<string, StarData>) => Map<string, StarData>,
  ) => void,
  groupName: string,
  people: Person[] = MOCK_PEOPLE,
  currentUserName?: string,
) {
  const INTRO_MESSAGES = useMemo(() => {
    const greeting = currentUserName
      ? `Hi ${currentUserName}, welcome to the ${groupName} cluster. Sensors detect ${people.length} stars.`
      : `Welcome to the ${groupName} cluster. Sensors detect ${people.length} stars.`
    return [
      greeting,
      `A <b>cluster</b> is a random group of stars in your vicinity.<br /><br />A <b>constellation</b> is a meaningful pattern formed by relationships you perceive.`,
      `<b>Your mission:</b> Map the positions of the stars relative to you to form a constellation.`,
      `Positions:<br /><br /><b>• Close</b>: Close friend, family<br /><b>• Near</b>: Passive friend, acquaintance<br /><b>• Far</b>: Unknown, distant<br /><br />Ready?`,
    ]
  }, [groupName, people.length, currentUserName])

  const [state, setState] = useState<JourneyState>({
    phase: 'intro',
    introStep: 0,
    targetStarIndex: 0,
    previousStarIndex: -1,
    selectedStarIds: new Set(),
    visitQueue: [],
    useConstellationPositions: false,
    manualControlsEnabled: false,
    narratorMessage: INTRO_MESSAGES[0],
  })

  // Track if we need to reset camera (used by Scene.tsx)
  const shouldResetCamera = useRef(false)

  // When firstName changes from empty to filled, update to show the first real intro message
  useEffect(() => {
    if (state.phase === 'intro' && state.introStep === 0) {
      setState((prev) => ({
        ...prev,
        narratorMessage: INTRO_MESSAGES[0],
      }))
    }
  }, [state.phase, state.introStep, INTRO_MESSAGES])

  const advanceIntro = useCallback(() => {
    setState((prev) => {
      const lastIntroStep = INTRO_MESSAGES.length - 1
      if (prev.introStep < lastIntroStep) {
        const nextStep = prev.introStep + 1
        return {
          ...prev,
          introStep: nextStep,
          narratorMessage: INTRO_MESSAGES[nextStep],
        }
      }
      return {
        ...prev,
        phase: 'selecting',
        narratorMessage:
          'Select stars to map. If you know people, begin with them.',
      }
    })
  }, [INTRO_MESSAGES])

  const backIntro = useCallback(() => {
    setState((prev) => {
      // If in selecting phase, go back to last intro message
      if (prev.phase === 'selecting') {
        const lastIntroStep = INTRO_MESSAGES.length - 1
        return {
          ...prev,
          phase: 'intro',
          introStep: lastIntroStep,
          narratorMessage: INTRO_MESSAGES[lastIntroStep],
        }
      }
      // If in intro phase, go to previous step
      if (prev.introStep > 0) {
        const prevStep = prev.introStep - 1
        return {
          ...prev,
          introStep: prevStep,
          narratorMessage: INTRO_MESSAGES[prevStep],
        }
      }
      return prev
    })
  }, [INTRO_MESSAGES])

  const startSelection = useCallback(() => {
    setState((prev) => ({
      ...prev,
      phase: 'selecting',
      narratorMessage:
        'Select stars to map. You can begin with those you know or select all.',
    }))
  }, [])

  const selectAllStars = useCallback(() => {
    setState((prev) => ({
      ...prev,
      selectedStarIds: new Set(people.map((p) => p.id)),
    }))
  }, [])

  const clearStars = useCallback(() => {
    setState((prev) => ({
      ...prev,
      selectedStarIds: new Set(),
    }))
  }, [])

  const toggleStarSelection = useCallback((starId: string) => {
    setState((prev) => {
      const newSelection = new Set(prev.selectedStarIds)
      if (newSelection.has(starId)) {
        newSelection.delete(starId)
      } else {
        newSelection.add(starId)
      }
      return { ...prev, selectedStarIds: newSelection }
    })
  }, [])

  const startVisitingSelectedStars = useCallback(() => {
    setState((prev) => {
      const selectedIds = Array.from(prev.selectedStarIds)
      if (selectedIds.length === 0) return prev

      // Shuffle selected stars for random visit order
      const shuffled = [...selectedIds].sort(() => Math.random() - 0.5)
      const firstPersonId = shuffled[0]
      const firstPersonIndex = people.findIndex((p) => p.id === firstPersonId)
      const firstPerson = people[firstPersonIndex]

      return {
        ...prev,
        visitQueue: shuffled,
        targetStarIndex: firstPersonIndex,
        previousStarIndex: -1,
        phase: 'flying',
        narratorMessage: `Travelling to ${firstPerson.name}...`,
        useConstellationPositions: false,
        manualControlsEnabled: false,
      }
    })
  }, [])

  const onApproaching = useCallback((name: string) => {
    setState((prev) => ({
      ...prev,
      phase: 'approaching',
      narratorMessage: `Approaching ${name}...`,
    }))
  }, [])

  const onArrived = useCallback((name: string) => {
    setState((prev) => ({
      ...prev,
      phase: 'arrived',
      narratorMessage: `Arrived at ${name}! Where is this star today?`,
    }))
  }, [])

  const placeStar = useCallback(
    (starId: string, placement: 'inner' | 'close' | 'outer') => {
      // Update star data
      onStarsUpdate((prevStars) => {
        const newStars = new Map(prevStars)
        const starData = newStars.get(starId)
        if (starData) {
          newStars.set(starId, {
            ...starData,
            placement,
            visited: true,
          })
        }
        return newStars
      })

      setState((prev) => {
        // Remove from queue
        const updatedQueue = prev.visitQueue.filter((id) => id !== starId)

        // Count total placed stars
        const placedCount =
          Array.from(stars.values()).filter((s) => s.placement !== null)
            .length + 1 // +1 for the star we just placed

        // Check if journey is complete
        if (placedCount === people.length) {
          shouldResetCamera.current = true // Signal to Scene.tsx to zoom out
          return {
            ...prev,
            visitQueue: updatedQueue,
            phase: 'returning-journey-complete',
            useConstellationPositions: true,
            narratorMessage: `Journey complete! You've mapped all ${people.length} stars in your constellation.`,
          }
        }

        // Check if there are more stars in the current queue
        if (updatedQueue.length > 0) {
          const nextPersonId = updatedQueue[0]
          const nextPersonIndex = people.findIndex((p) => p.id === nextPersonId)
          const nextPerson = people[nextPersonIndex]

          return {
            ...prev,
            visitQueue: updatedQueue,
            previousStarIndex: prev.targetStarIndex,
            targetStarIndex: nextPersonIndex,
            phase: 'takeoff',
            narratorMessage: `Taking off to ${nextPerson.name}...`,
          }
        }

        // Queue is empty - all selected stars visited
        shouldResetCamera.current = true // Signal to Scene.tsx to zoom out
        const unchartedCount = MOCK_PEOPLE.length - placedCount
        return {
          ...prev,
          visitQueue: updatedQueue,
          phase: 'returning-batch-complete',
          useConstellationPositions: true,
          narratorMessage:
            unchartedCount > 0
              ? `${placedCount} of ${MOCK_PEOPLE.length} stars mapped. ${unchartedCount} remain.`
              : `Journey complete! You've mapped all ${MOCK_PEOPLE.length} stars.`,
        }
      })
    },
    [stars, onStarsUpdate],
  )

  const onTakeoffComplete = useCallback(() => {
    setState((prev) => ({
      ...prev,
      phase: 'flying',
    }))
  }, [])

  const proceedAfterPlacement = useCallback(() => {
    setState((prev) => {
      // Find next unvisited star
      const nextUnvisitedIndex = MOCK_PEOPLE.findIndex((p) => {
        const starData = stars.get(p.id)!
        return !starData.visited
      })

      if (nextUnvisitedIndex !== -1) {
        const nextPerson = MOCK_PEOPLE[nextUnvisitedIndex]
        return {
          ...prev,
          previousStarIndex: prev.targetStarIndex,
          targetStarIndex: nextUnvisitedIndex,
          phase: 'takeoff',
          narratorMessage: `Taking off to ${nextPerson.name}...`,
        }
      }

      return {
        ...prev,
        phase: 'complete',
        narratorMessage: 'All selected stars visited.',
      }
    })
  }, [stars])

  const zoomOut = useCallback(() => {
    shouldResetCamera.current = true // Signal to Scene.tsx to reset
    setState((prev) => {
      const placedCount = Array.from(stars.values()).filter(
        (s) => s.placement !== null,
      ).length

      return {
        ...prev,
        phase: 'returning',
        useConstellationPositions: true,
        narratorMessage: `Viewing constellation... ${placedCount} of ${MOCK_PEOPLE.length} stars mapped.`,
      }
    })
  }, [stars])

  const enableManualControls = useCallback((enabled: boolean) => {
    setState((prev) => ({
      ...prev,
      manualControlsEnabled: enabled,
    }))
  }, [])

  const openReviewModal = useCallback(() => {
    setState((prev) => ({
      ...prev,
      phase: 'constellation-review',
      selectedStarIds: new Set(), // Clear selection when opening modal
    }))
  }, [])

  const closeReviewModal = useCallback(() => {
    setState((prev) => {
      // Restore the appropriate returning phase based on completion status
      const placedCount = Array.from(stars.values()).filter(
        (s) => s.placement !== null,
      ).length
      const isJourneyComplete = placedCount === MOCK_PEOPLE.length
      const isBatchComplete = prev.visitQueue.length === 0 && !isJourneyComplete

      return {
        ...prev,
        phase: isJourneyComplete
          ? 'returning-journey-complete'
          : isBatchComplete
          ? 'returning-batch-complete'
          : 'returning',
      }
    })
  }, [stars])

  const continueJourney = useCallback(() => {
    setState((prev) => {
      // Disable manual controls when continuing journey
      const updatedState = {
        ...prev,
        manualControlsEnabled: false,
        useConstellationPositions: false,
      }

      // Add all remaining unvisited stars to queue
      const unvisitedIds = MOCK_PEOPLE.filter((p) => {
        const starData = stars.get(p.id)!
        return !starData.visited
      }).map((p) => p.id)

      if (unvisitedIds.length > 0) {
        const firstPersonId = unvisitedIds[0]
        const firstPersonIndex = MOCK_PEOPLE.findIndex(
          (p) => p.id === firstPersonId,
        )
        const firstPerson = MOCK_PEOPLE[firstPersonIndex]

        return {
          ...updatedState,
          visitQueue: unvisitedIds,
          targetStarIndex: firstPersonIndex,
          previousStarIndex: -1,
          phase: 'flying',
          narratorMessage: `Flying to ${firstPerson.name}...`,
        }
      }

      return updatedState
    })
  }, [stars])

  const onReturnComplete = useCallback(() => {
    setState((prev) => {
      const chartedCount = Array.from(stars.values()).filter(
        (s) => s.placement !== null,
      ).length
      const totalCount = MOCK_PEOPLE.length

      let message = ''
      if (chartedCount === totalCount) {
        message = `Journey complete! You've mapped all ${totalCount} stars in your constellation.`
      } else {
        message = `${chartedCount} of ${totalCount} stars mapped. Proceed or explore with 🧑‍🚀 manual controls.`
      }

      return {
        ...prev,
        narratorMessage: message,
      }
    })
  }, [stars])

  const actions: JourneyActions = {
    advanceIntro,
    backIntro,
    startSelection,
    toggleStarSelection,
    selectAllStars,
    clearStars,
    startVisitingSelectedStars,
    onApproaching,
    onArrived,
    placeStar,
    onTakeoffComplete,
    proceedAfterPlacement,
    zoomOut,
    enableManualControls,
    openReviewModal,
    closeReviewModal,
    continueJourney,
    onReturnComplete,
  }

  return {
    state,
    actions,
    shouldResetCamera,
  }
}
