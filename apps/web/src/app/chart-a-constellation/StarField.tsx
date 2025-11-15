/**
 * StarField - Main component for the star charting experience
 *
 * REFACTORED STRUCTURE:
 * - Uses useJourneyStateMachine hook for centralized state management
 * - UI components extracted to /components (NavPanel, ConstellationModal, PlacementOverlay)
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
import { StarOverlay } from './types'
import { initializeStars } from './starData'
import Scene from './Scene'
import { NavPanel } from './components/NavPanel'
import { ConstellationModal } from './components/ConstellationModal'
import { PlacementOverlay } from './components/PlacementOverlay'
import { useJourneyStateMachine } from './hooks/useJourneyStateMachine'
import { MOCK_PEOPLE } from './mockData'

export default function StarField() {
  const [stars, setStars] = useState(initializeStars)
  const [overlays, setOverlays] = useState<StarOverlay[]>([])

  // Journey state machine - single source of truth
  const { state, actions, shouldResetCamera } = useJourneyStateMachine(
    stars,
    setStars,
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
          onUpdateOverlays={setOverlays}
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
      {state.phase === 'returning' && (
        <div className="pointer-events-auto fixed right-4 top-20 z-20 sm:right-6 sm:top-24">
          <div className="rounded-lg border-2 border-indigo-500/50 bg-slate-900/90 p-2 shadow-xl backdrop-blur-sm">
            <button
              onClick={() =>
                actions.enableManualControls(!state.manualControlsEnabled)
              }
              className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                state.manualControlsEnabled
                  ? 'bg-indigo-600 text-white'
                  : 'bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30'
              }`}
            >
              {state.manualControlsEnabled ? '🧑‍🚀 Manual' : '🚀 Auto-Pilot'}
            </button>
          </div>
        </div>
      )}

      {/* Placement Overlay */}
      {state.phase === 'arrived' && (
        <PlacementOverlay
          personName={MOCK_PEOPLE[state.targetStarIndex].name}
          onPlacement={handlePlacePerson}
        />
      )}

      {/* HUD Overlays */}
      {overlays.map((overlay) => (
        <div
          key={overlay.person.id}
          style={{
            position: 'absolute',
            left: `${overlay.screenX}px`,
            top: `${overlay.screenY}px`,
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            zIndex: 10,
          }}
        >
          <div className="rounded-full border-2 border-cyan-400/50 bg-slate-900/80 px-3 py-1 text-xs text-cyan-300 backdrop-blur-sm">
            {overlay.person.name}
          </div>
        </div>
      ))}

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
        onStartSelection={actions.startSelection}
        onVisitSelectedStars={actions.startVisitingSelectedStars}
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
