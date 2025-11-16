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

import { JourneyPhase } from '../types'
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
  onBackIntro: () => void
  onStartSelection: () => void
  onToggleStarSelection: (starId: string) => void
  onSelectAllStars: () => void
  onClearStars: () => void
  onVisitSelectedStars: () => void
  onPlaceStar: (placement: 'inner' | 'close' | 'outer') => void
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
  onBackIntro,
  onStartSelection,
  onToggleStarSelection,
  onSelectAllStars,
  onClearStars,
  onVisitSelectedStars,
  onPlaceStar,
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
      className="fixed left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-3xl px-2 sm:px-4"
      style={{ bottom: '1rem' }}
    >
      <div className="relative overflow-hidden rounded-lg border-2 border-indigo-500/50 bg-gradient-to-b from-slate-900/50 to-slate-950/50 shadow-2xl backdrop-blur-sm">
        {/* Control panel accent lines */}
        <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-indigo-500 via-cyan-400 to-indigo-500"></div>
        <div className="absolute right-0 top-0 h-full w-1 bg-gradient-to-b from-indigo-500 via-cyan-400 to-indigo-500"></div>
        <div className="absolute left-0 bottom-0 h-1 w-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-indigo-500"></div>
        <div className="absolute right-0 bottom-0 h-1 w-full bg-gradient-to-l from-indigo-500 via-cyan-400 to-indigo-500"></div>

        {/* Content */}
        <div className="relative px-4 py-3 sm:px-6 sm:py-4 min-h-[120px]">
          {/* Header with title and controls */}
          <div className="mb-1 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 animate-pulse rounded-full bg-cyan-400"></div>
              <span className="text-xs font-mono uppercase tracking-wider text-cyan-400/70">
                Navigation System
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Auto-Pilot/Manual toggle - show when in returning mode */}
              {(phase === 'returning' ||
                phase === 'returning-batch-complete' ||
                phase === 'returning-journey-complete') &&
                placementsCount > 0 && (
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
          <p
            className="font-mono text-xs leading-relaxed tracking-wide text-indigo-100 sm:text-sm pt-2"
            style={{ letterSpacing: '0.03em' }}
            dangerouslySetInnerHTML={{ __html: narratorMessage }}
          />

          {/* Star selection grid - show during selection phase */}
          {phase === 'selecting' && (
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between text-xs text-indigo-300">
                <span>{selectedStarIds.size} selected</span>
                <div className="flex gap-2">
                  <button
                    onClick={onSelectAllStars}
                    className="px-2 py-1 rounded border border-indigo-400/30 bg-indigo-500/10 hover:bg-indigo-500/20 transition-colors"
                  >
                    Select All
                  </button>
                  <button
                    onClick={onClearStars}
                    className="px-2 py-1 rounded border border-indigo-400/30 bg-indigo-500/10 hover:bg-indigo-500/20 transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[40vh] overflow-y-auto">
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
                        onClick={() => onToggleStarSelection(person.id)}
                        className={`w-full flex items-center gap-2 p-2 rounded-lg border-2 transition-all ${
                          isSelected
                            ? 'border-cyan-400 bg-cyan-500/20'
                            : 'border-indigo-400/30 bg-indigo-500/10 hover:border-indigo-400/50'
                        }`}
                      >
                        <img
                          src={person.photo}
                          alt={person.name}
                          className="w-14 h-14 rounded-full object-cover"
                        />
                        <span className="text-xs text-left text-white flex-1">
                          {person.name}
                        </span>
                        {isSelected && <span className="text-cyan-400">✓</span>}
                      </button>
                    )
                  })}
              </div>
            </div>
          )}

          {/* Placement buttons - show when arrived at a star */}
          {phase === 'arrived' && (
            <div className="mt-3 flex gap-2">
              <button
                data-testid="placement-close"
                onClick={() => onPlaceStar('inner')}
                className="flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-colors hover:bg-indigo-700 active:bg-indigo-800"
              >
                Close
              </button>
              <button
                data-testid="placement-near"
                onClick={() => onPlaceStar('close')}
                className="flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-colors hover:bg-indigo-700 active:bg-indigo-800"
              >
                Near
              </button>
              <button
                data-testid="placement-far"
                onClick={() => onPlaceStar('outer')}
                className="flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-colors hover:bg-indigo-700 active:bg-indigo-800"
              >
                Far
              </button>
            </div>
          )}

          {/* Navigation buttons - show when waiting for user to advance */}
          {(phase === 'intro' ||
            phase === 'selecting' ||
            (phase === 'placed' && hasUncharted)) && (
            <div className="mt-3 flex gap-2">
              {/* Back button - show during intro (if not first step) and during selecting */}
              {((phase === 'intro' && introStep > 0) ||
                phase === 'selecting') && (
                <button
                  onClick={onBackIntro}
                  className="rounded border border-indigo-400/50 bg-indigo-500/10 px-3 py-1.5 text-sm text-indigo-300 transition-colors hover:border-indigo-400 hover:bg-indigo-500/20"
                >
                  ←
                </button>
              )}
              {/* Proceed button */}
              <button
                data-testid="proceed-button"
                onClick={
                  phase === 'placed'
                    ? onProceedAfterPlacement
                    : phase === 'selecting'
                    ? onVisitSelectedStars
                    : onAdvanceIntro
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

          {/* Buttons in constellation view when not all stars charted (manual zoom out only) */}
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
          {phase === 'returning-batch-complete' && hasUncharted && (
            <div className="mt-3 space-y-2">
              <button
                onClick={onContinueJourney}
                className="w-full rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-colors hover:bg-cyan-700 active:bg-cyan-800"
              >
                → Continue Journey
              </button>
              <button
                onClick={onOpenReviewModal}
                className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-colors hover:bg-indigo-700 active:bg-indigo-800"
              >
                ✦ Review
              </button>
            </div>
          )}

          {/* Journey complete - all stars charted */}
          {phase === 'returning-journey-complete' && (
            <div className="mt-3">
              <button
                onClick={onOpenReviewModal}
                className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-colors hover:bg-indigo-700 active:bg-indigo-800"
              >
                ✦ Review
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
