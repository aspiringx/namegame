'use client'

export function Search({
  placeholder,
  onSearchChange,
  value,
}: {
  placeholder: string
  onSearchChange: (term: string) => void
  value: string
}) {
  return (
    <div className="relative flex flex-1 flex-shrink-0">
      <label htmlFor="search" className="sr-only">
        Search
      </label>
      <input
        className="peer block w-full rounded-md border border-gray-100 py-[9px] pl-10 text-sm outline-1 placeholder:text-gray-500"
        placeholder={placeholder}
        onChange={(e) => onSearchChange(e.target.value)}
        value={value}
      />
    </div>
  )
}
