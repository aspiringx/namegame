/**
 * StarField - Main component for the star charting experience
 *
 * REFACTORED STRUCTURE:
 * - Uses useJourneyStateMachine hook for centralized state management
 * - UI components extracted to /components (NavPanel, ConstellationModal)
 * - All journey phase transitions handled atomically by the state machine
 * - Scene.tsx receives shouldResetCameraRef for simple constellation recalculation signaling
 *
 * This component is now ~200 lines instead of 1000+, focusing only on:
 * - Layout measurements (viewport, header, nav panel)
 * - Coordinating between state machine, Scene, and UI components
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { initializeStars } from './starData'
import Scene from './Scene'
import { NavPanel } from './components/NavPanel'
import { ConstellationModal } from './components/ConstellationModal'
import { useJourneyStateMachine } from './hooks/useJourneyStateMachine'
import { MOCK_PEOPLE } from './mockData'

export default function StarField() {
  const [groupName] = useState('Hypothetical Group')
  const [stars, setStars] = useState(initializeStars)

  // Journey state machine - single source of truth
  const { state, actions, shouldResetCamera } = useJourneyStateMachine(
    stars,
    setStars,
    groupName,
  )

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

  const initialNavPanelHeight = useRef<number>(0)

  // Derive placements count
  const placementsCount = Array.from(stars.values()).filter(
    (s) => s.placement,
  ).length

  // Measure layout dimensions
  const measureLayout = useCallback(() => {
    const width = window.innerWidth
    const container = document.getElementById('canvas-container')
    const height = container?.clientHeight || window.innerHeight

    setViewportDimensions({ width, height })

    const header = document.querySelector('header')
    const headerRect = header?.getBoundingClientRect()
    const headerBottom = headerRect ? headerRect.bottom : 0

    const navPanel = document.getElementById('nav-panel')
    const navPanelRect = navPanel?.getBoundingClientRect()
    const navPanelTop = navPanelRect ? navPanelRect.top : height
    const currentNavPanelHeight = height - navPanelTop

    if (initialNavPanelHeight.current === 0 && currentNavPanelHeight > 0) {
      initialNavPanelHeight.current = currentNavPanelHeight
    }

    setLayoutMeasurements({
      headerHeight: headerBottom,
      navPanelHeight: currentNavPanelHeight,
    })
  }, [])

  useEffect(() => {
    measureLayout()
    window.addEventListener('resize', measureLayout)
    return () => window.removeEventListener('resize', measureLayout)
  }, [measureLayout])

  // Remeasure when narrator message changes (nav panel appears/updates)
  useEffect(() => {
    if (state.narratorMessage) {
      // Small delay to ensure nav panel is rendered
      const timer = setTimeout(measureLayout, 50)
      return () => clearTimeout(timer)
    }
  }, [state.narratorMessage, measureLayout])

  // Handle placement selection
  const handlePlacePerson = useCallback(
    (placement: 'inner' | 'close' | 'outer') => {
      const targetPerson = MOCK_PEOPLE[state.targetStarIndex]
      actions.placeStar(targetPerson.id, placement)
    },
    [state.targetStarIndex, actions],
  )

  return (
    <div
      id="canvas-container"
      style={{ position: 'relative', width: '100%', height: '100dvh' }}
    >
      <Canvas
        camera={{ position: [0, 0, 25], fov: 60 }}
        style={{ width: '100%', height: '100dvh' }}
      >
        <Scene
          stars={stars}
          onUpdateStars={setStars}
          targetStarIndex={state.targetStarIndex}
          previousStarIndex={state.previousStarIndex}
          viewportDimensions={viewportDimensions}
          layoutMeasurements={layoutMeasurements}
          onApproaching={actions.onApproaching}
          onArrived={actions.onArrived}
          onTakeoffComplete={actions.onTakeoffComplete}
          onReturnComplete={actions.onReturnComplete}
          journeyPhase={state.phase}
          useConstellationPositions={state.useConstellationPositions}
          manualControlsEnabled={state.manualControlsEnabled}
          shouldResetCameraRef={shouldResetCamera}
        />
      </Canvas>

      {/* Manual Controls Toggle - Only in constellation view */}
      {(state.phase === 'returning' ||
        state.phase === 'returning-batch-complete' ||
        state.phase === 'returning-journey-complete') && (
        <div className="pointer-events-auto fixed right-4 top-4 z-20">
          <button
            onClick={() =>
              actions.enableManualControls(!state.manualControlsEnabled)
            }
            className="rounded-lg border-2 border-indigo-500/50 bg-slate-900/90 px-4 py-2 text-sm font-medium text-white shadow-xl backdrop-blur-sm transition-colors hover:bg-slate-800/90"
          >
            {state.manualControlsEnabled ? '🧑‍🚀 Manual' : '🚀 Auto-Pilot'}
          </button>
        </div>
      )}

      {/* HUD Overlays - removed, names shown in nav panel instead */}

      {/* Nav Panel */}
      <NavPanel
        phase={state.phase}
        introStep={state.introStep}
        narratorMessage={state.narratorMessage}
        selectedStarIds={state.selectedStarIds}
        placementsCount={placementsCount}
        visitQueueLength={state.visitQueue.length}
        manualControlsEnabled={state.manualControlsEnabled}
        onAdvanceIntro={actions.advanceIntro}
        onBackIntro={actions.backIntro}
        onStartSelection={actions.startSelection}
        onToggleStarSelection={actions.toggleStarSelection}
        onSelectAllStars={actions.selectAllStars}
        onClearStars={actions.clearStars}
        onVisitSelectedStars={actions.startVisitingSelectedStars}
        onPlaceStar={handlePlacePerson}
        onProceedAfterPlacement={actions.proceedAfterPlacement}
        onZoomOut={actions.zoomOut}
        onContinueJourney={actions.continueJourney}
        onOpenReviewModal={actions.openReviewModal}
        onToggleManualControls={actions.enableManualControls}
      />

      {/* Constellation Review Modal */}
      {state.phase === 'constellation-review' && (
        <ConstellationModal
          stars={stars}
          selectedStarIds={state.selectedStarIds}
          onToggleSelection={actions.toggleStarSelection}
          onVisitSelected={() => {
            actions.closeReviewModal()
            actions.startVisitingSelectedStars()
          }}
          onClose={actions.closeReviewModal}
        />
      )}
    </div>
  )
}
