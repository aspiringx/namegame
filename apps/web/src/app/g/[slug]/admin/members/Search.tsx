'use client'

import { Badge } from '@/components/ui/badge'

export function Search({
  placeholder,
  count,
  onSearchChange,
  defaultValue,
}: {
  placeholder: string
  count: number
  onSearchChange: (term: string) => void
  defaultValue?: string
}) {
  return (
    <div className="relative flex flex-1 flex-shrink-0">
      <label htmlFor="search" className="sr-only">
        Search
      </label>
      <input
        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 pr-24 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
        placeholder={placeholder}
        onChange={(e) => {
          onSearchChange(e.target.value)
        }}
        defaultValue={defaultValue}
      />
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
        <Badge
          variant="secondary"
          className="bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200"
        >
          {count} found
        </Badge>
      </div>
    </div>
  )
}
