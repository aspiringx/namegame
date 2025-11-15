/**
 * PlacementOverlay
 *
 * Modal that appears when you arrive at a star, asking the user to place it
 * in one of three distance categories: Close, Near, or Far.
 * This determines the star's position in the constellation view.
 */

interface PlacementOverlayProps {
  personName: string
  onPlacement: (placement: 'inner' | 'close' | 'outer') => void
}

export function PlacementOverlay({
  personName,
  onPlacement,
}: PlacementOverlayProps) {
  return (
    <div className="pointer-events-auto fixed inset-x-0 top-1/3 z-20 flex justify-center px-4">
      <div className="w-full max-w-md rounded-lg border-2 border-indigo-500/50 bg-slate-900/95 p-6 shadow-2xl backdrop-blur-sm">
        <h3 className="mb-4 text-center text-lg font-bold text-white">
          Where is {personName} today?
        </h3>
        <div className="flex gap-2">
          <button
            data-testid="placement-close"
            onClick={() => onPlacement('inner')}
            className="flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-colors hover:bg-indigo-700 active:bg-indigo-800"
          >
            Close
          </button>
          <button
            data-testid="placement-near"
            onClick={() => onPlacement('close')}
            className="flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-colors hover:bg-indigo-700 active:bg-indigo-800"
          >
            Near
          </button>
          <button
            data-testid="placement-far"
            onClick={() => onPlacement('outer')}
            className="flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-colors hover:bg-indigo-700 active:bg-indigo-800"
          >
            Far
          </button>
        </div>
      </div>
    </div>
  )
}
