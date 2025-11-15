/**
 * NavPanel
 *
 * The bottom navigation panel that shows narrator messages and action buttons.
 * Displays different buttons based on the current journey phase:
 * - Intro: Proceed button to advance through intro steps
 * - Selecting: Visit selected stars button
 * - Arrived: Zoom Out button (top right)
 * - Complete: Continue Journey, Review, and Zoom Out buttons
 * - Returning: Auto-Pilot/Manual toggle, Proceed, and Review buttons
 */

import { JourneyPhase } from '../hooks/useJourneyStateMachine'
import { MOCK_PEOPLE } from '../mockData'

interface NavPanelProps {
  phase: JourneyPhase
  introStep: number
  narratorMessage: string
  selectedStarIds: Set<string>
  placementsCount: number
  visitQueueLength: number
  manualControlsEnabled: boolean
  onAdvanceIntro: () => void
  onStartSelection: () => void
  onVisitSelectedStars: () => void
  onProceedAfterPlacement: () => void
  onZoomOut: () => void
  onContinueJourney: () => void
  onOpenReviewModal: () => void
  onToggleManualControls: (enabled: boolean) => void
}

export function NavPanel({
  phase,
  introStep,
  narratorMessage,
  selectedStarIds,
  placementsCount,
  visitQueueLength,
  manualControlsEnabled,
  onAdvanceIntro,
  onStartSelection,
  onVisitSelectedStars,
  onProceedAfterPlacement,
  onZoomOut,
  onContinueJourney,
  onOpenReviewModal,
  onToggleManualControls,
}: NavPanelProps) {
  const totalCount = MOCK_PEOPLE.length
  const hasUncharted = placementsCount < totalCount

  return (
    <div
      id="nav-panel"
      className="pointer-events-auto fixed bottom-0 left-0 right-0 z-20 border-t-2 border-indigo-500/50 bg-gradient-to-t from-slate-900/95 to-slate-900/90 shadow-2xl backdrop-blur-sm"
    >
      <div className="mx-auto max-w-4xl">
        {/* Content */}
        <div className="relative px-4 py-3 sm:px-6 sm:py-4 min-h-[120px]">
          {/* Header with title and controls */}
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wide text-cyan-400 sm:text-base">
              ● Navigation System
            </h2>

            <div className="flex items-center gap-2">
              {/* Auto-Pilot/Manual toggle - show when in returning mode */}
              {phase === 'returning' && placementsCount > 0 && (
                <>
                  <button
                    onClick={() => onToggleManualControls(false)}
                    className={`text-base px-2 py-1 rounded border transition-colors ${
                      !manualControlsEnabled
                        ? 'border-indigo-400 bg-indigo-500/40 text-indigo-100 shadow-sm'
                        : 'border-indigo-400/50 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 hover:border-indigo-400'
                    }`}
                    title="Auto-Pilot"
                  >
                    🚀
                  </button>
                  <button
                    onClick={() => onToggleManualControls(true)}
                    className={`text-base px-2 py-1 rounded border transition-colors ${
                      manualControlsEnabled
                        ? 'border-indigo-400 bg-indigo-500/40 text-indigo-100 shadow-sm'
                        : 'border-indigo-400/50 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 hover:border-indigo-400'
                    }`}
                    title="Manual"
                  >
                    🧑‍🚀
                  </button>
                </>
              )}

              {/* Zoom Out button - show only when arrived at a star */}
              {placementsCount > 0 && hasUncharted && phase === 'arrived' && (
                <button
                  data-testid="zoom-out-button"
                  onClick={onZoomOut}
                  className="text-xs px-2 py-1 rounded border border-indigo-400/50 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 hover:border-indigo-400 transition-colors"
                >
                  ⊙ Zoom Out
                </button>
              )}
            </div>
          </div>

          {/* Message */}
          <p className="mb-3 text-sm text-gray-200 sm:text-base">
            {narratorMessage}
          </p>

          {/* Navigation buttons - show when waiting for user to advance */}
          {(phase === 'intro' ||
            phase === 'selecting' ||
            (phase === 'placed' && hasUncharted)) && (
            <div className="mt-3 flex gap-2">
              {/* Back button - only show during intro if not on first step */}
              {phase === 'intro' && introStep > 0 && (
                <button
                  onClick={() => {
                    /* Back functionality if needed */
                  }}
                  className="rounded border border-indigo-400/50 bg-indigo-500/10 px-3 py-1.5 text-sm text-indigo-300 transition-colors hover:border-indigo-400 hover:bg-indigo-500/20"
                >
                  ←
                </button>
              )}
              {/* Proceed button */}
              <button
                data-testid="proceed-button"
                onClick={
                  phase === 'placed' ? onProceedAfterPlacement : onAdvanceIntro
                }
                disabled={phase === 'selecting' && selectedStarIds.size === 0}
                className="flex-1 rounded border border-indigo-400/50 bg-indigo-500/10 px-4 py-1.5 text-sm text-indigo-300 transition-colors hover:border-indigo-400 hover:bg-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {phase === 'selecting'
                  ? `→ Visit ${selectedStarIds.size} Star${
                      selectedStarIds.size !== 1 ? 's' : ''
                    }`
                  : '→ Proceed'}
              </button>
            </div>
          )}

          {/* Buttons in constellation view when not all stars charted */}
          {phase === 'returning' && hasUncharted && (
            <div className="mt-3 flex gap-2">
              <button
                onClick={onContinueJourney}
                className="flex-1 rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-colors hover:bg-cyan-700 active:bg-cyan-800"
              >
                → Proceed
              </button>
              <button
                onClick={onOpenReviewModal}
                className="flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-colors hover:bg-indigo-700 active:bg-indigo-800"
              >
                ✦ Review
              </button>
            </div>
          )}

          {/* Action buttons when selected stars complete but uncharted remain */}
          {phase === 'complete' && hasUncharted && visitQueueLength === 0 && (
            <div className="mt-3 space-y-2">
              <button
                onClick={onContinueJourney}
                className="w-full rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-colors hover:bg-cyan-700 active:bg-cyan-800"
              >
                → Continue Journey
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={onOpenReviewModal}
                  className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-colors hover:bg-indigo-700 active:bg-indigo-800"
                >
                  ✦ Review
                </button>
                <button
                  data-testid="zoom-out-after-placement"
                  onClick={onZoomOut}
                  className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-colors hover:bg-indigo-700 active:bg-indigo-800"
                >
                  ⊙ Zoom Out
                </button>
              </div>
            </div>
          )}

          {/* View Constellation button - large prominent button only when ALL stars charted */}
          {placementsCount === totalCount && phase === 'complete' && (
            <div className="mt-3">
              <button
                onClick={onZoomOut}
                className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-colors hover:bg-indigo-700 active:bg-indigo-800"
              >
                ⊙ View Constellation
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
