import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface RelationshipSliderProps {
  label: string
  hint: string
  value: number
  minLabel: string
  maxLabel: string
  onChange: (value: number) => void
}

export default function RelationshipSlider({
  label,
  hint,
  value,
  minLabel,
  maxLabel,
  onChange,
}: RelationshipSliderProps) {
  return (
    <div className="pb-6 border-b border-gray-200 dark:border-gray-700 last:border-0 last:pb-0">
      <div className="mb-2 flex items-center gap-3">
        <label className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
        <Tooltip delayDuration={0} disableHoverableContent={false}>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
              }}
              className="inline-flex items-center justify-center rounded-full w-5 h-5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
              aria-label="More information"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-5 h-5"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM8.94 6.94a.75.75 0 11-1.061-1.061 3 3 0 112.871 5.026v.345a.75.75 0 01-1.5 0v-.5c0-.72.57-1.172 1.081-1.287A1.5 1.5 0 108.94 6.94zM10 15a1 1 0 100-2 1 1 0 000 2z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            {hint}
          </TooltipContent>
        </Tooltip>
        <span className="w-6 text-right text-lg font-bold text-indigo-700 dark:text-indigo-300 flex-shrink-0">
          {value}
        </span>
      </div>
      <input
        type="range"
        min="0"
        max="10"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="relationship-slider w-full cursor-pointer"
        style={{
          background: `linear-gradient(to right, #4f46e5 0%, #4f46e5 ${
            value * 10
          }%, #e5e7eb ${value * 10}%, #e5e7eb 100%)`,
        }}
      />
      <div className="mt-1 flex justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>0 - {minLabel}</span>
        <span>10 - {maxLabel}</span>
      </div>
    </div>
  )
}
