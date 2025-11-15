import { StarData } from '../types'
import { MOCK_PEOPLE } from '../mockData'

interface ConstellationModalProps {
  stars: Map<string, StarData>
  selectedStarIds: Set<string>
  onToggleSelection: (starId: string) => void
  onVisitSelected: () => void
  onClose: () => void
}

export function ConstellationModal({
  stars,
  selectedStarIds,
  onToggleSelection,
  onVisitSelected,
  onClose,
}: ConstellationModalProps) {
  const placements = new Map(
    Array.from(stars.entries())
      .filter(([_, star]) => star.placement)
      .map(([id, star]) => [id, star.placement!]),
  )

  const innerStars = Array.from(stars.entries()).filter(
    ([_, s]) => s.placement === 'inner',
  )
  const closeStars = Array.from(stars.entries()).filter(
    ([_, s]) => s.placement === 'close',
  )
  const outerStars = Array.from(stars.entries()).filter(
    ([_, s]) => s.placement === 'outer',
  )
  const unchartedStars = Array.from(stars.entries()).filter(
    ([_, s]) => !s.placement,
  )

  return (
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
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Close stars */}
          {innerStars.length > 0 && (
            <StarSection
              title={`● Close (${innerStars.length})`}
              stars={innerStars}
              selectedStarIds={selectedStarIds}
              onToggleSelection={onToggleSelection}
            />
          )}

          {/* Familiar/warm stars */}
          {closeStars.length > 0 && (
            <StarSection
              title={`● Familiar (${closeStars.length})`}
              stars={closeStars}
              selectedStarIds={selectedStarIds}
              onToggleSelection={onToggleSelection}
            />
          )}

          {/* Distant stars */}
          {outerStars.length > 0 && (
            <StarSection
              title={`● Distant (${outerStars.length})`}
              stars={outerStars}
              selectedStarIds={selectedStarIds}
              onToggleSelection={onToggleSelection}
            />
          )}

          {/* Uncharted stars */}
          {unchartedStars.length > 0 && (
            <StarSection
              title={`○ Uncharted (${unchartedStars.length})`}
              stars={unchartedStars}
              selectedStarIds={selectedStarIds}
              onToggleSelection={onToggleSelection}
              dimmed
            />
          )}
        </div>

        {/* Footer with action buttons */}
        <div className="sticky bottom-0 bg-slate-900/95 border-t border-indigo-500/30 p-4">
          {selectedStarIds.size > 0 && (
            <button
              onClick={onVisitSelected}
              className="w-full rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-colors hover:bg-cyan-700 active:bg-cyan-800"
            >
              → Visit {selectedStarIds.size} Selected Star
              {selectedStarIds.size !== 1 ? 's' : ''}
            </button>
          )}
          <button
            onClick={onClose}
            className="mt-2 w-full rounded-lg border border-indigo-400/50 bg-indigo-500/10 px-4 py-2.5 text-sm font-medium text-indigo-300 transition-colors hover:border-indigo-400 hover:bg-indigo-500/20"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

interface StarSectionProps {
  title: string
  stars: [string, StarData][]
  selectedStarIds: Set<string>
  onToggleSelection: (starId: string) => void
  dimmed?: boolean
}

function StarSection({
  title,
  stars,
  selectedStarIds,
  onToggleSelection,
  dimmed = false,
}: StarSectionProps) {
  return (
    <div>
      <h3 className="text-sm font-bold text-cyan-400 mb-2">{title}</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {stars.map(([id]) => {
          const person = MOCK_PEOPLE.find((p) => p.id === id)!
          const isSelected = selectedStarIds.has(id)
          return (
            <button
              key={id}
              onClick={() => onToggleSelection(id)}
              className={`flex items-center gap-2 p-2 rounded border-2 transition-all ${
                isSelected
                  ? 'border-cyan-400 bg-cyan-500/20'
                  : dimmed
                  ? 'border-gray-600 bg-gray-800/50 hover:border-gray-500'
                  : 'border-indigo-400/30 bg-indigo-500/10 hover:border-indigo-400/50'
              }`}
            >
              <img
                src={person.photo}
                alt={person.name}
                className="w-14 h-14 rounded-full object-cover"
              />
              <span className="text-xs text-white flex-1 text-left">
                {person.name}
              </span>
              {isSelected && <span className="text-cyan-400">✓</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}
