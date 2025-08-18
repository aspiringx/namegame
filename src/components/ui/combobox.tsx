"use client"

import { useState } from 'react'
import { Combobox as HeadlessCombobox } from '@headlessui/react'
import { Check, ChevronsUpDown } from 'lucide-react'

import { cn } from '@/lib/utils'

export interface ComboboxOption {
  value: string
  label: string
}

export interface DividerOption {
  isDivider: true
}

type ComboboxOptionWithDivider = ComboboxOption | DividerOption

interface ComboboxProps {
  options: ComboboxOptionWithDivider[]
  selectedValue: string
  onSelectValue: (value: string) => void
  placeholder?: string
  name?: string
  zIndex?: string
}

export function Combobox({ 
  options, 
  selectedValue, 
  onSelectValue, 
  placeholder, 
  name,
  zIndex = 'z-10'
}: ComboboxProps) {
  const [query, setQuery] = useState('')

  const getOptionLabel = (value: string) => {
    const option = options.find((opt) => !('isDivider' in opt) && opt.value === value) as ComboboxOption | undefined;
    return option ? option.label : '';
  };

  const filteredOptions = query === ''
      ? options
      : options.filter((option) => {
          if ('isDivider' in option) {
            return true; // Keep dividers in filtered list
          }
          return option.label.toLowerCase().includes(query.toLowerCase());
        });

  return (
    <HeadlessCombobox value={selectedValue} onChange={onSelectValue} name={name}>
      <div className="relative mt-1">
        <input type="hidden" name={name} value={selectedValue} />
        <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-white text-left shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-teal-300 sm:text-sm dark:bg-gray-700">
          <HeadlessCombobox.Input
            className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0 dark:bg-gray-700 dark:text-white"
            onChange={(event) => setQuery(event.target.value)}
            placeholder={placeholder}
            displayValue={getOptionLabel}
          />
          <HeadlessCombobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
            <ChevronsUpDown
              className="h-5 w-5 text-gray-400"
              aria-hidden="true"
            />
          </HeadlessCombobox.Button>
        </div>
        <HeadlessCombobox.Options className={cn(
          "absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm dark:bg-gray-700",
          zIndex
        )}>
          {filteredOptions.length === 0 && query !== '' ? (
            <div className="relative cursor-default select-none px-4 py-2 text-gray-700 dark:text-gray-300">
              Nothing found.
            </div>
          ) : (
            filteredOptions.map((option, index) => {
              if ('isDivider' in option) {
                return <div key={`divider-${index}`} className="my-1 h-px bg-gray-200 dark:bg-gray-600" />
              }
              return (
                <HeadlessCombobox.Option
                  key={option.value}
                  className={({ active }) =>
                    `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-teal-600 text-white' : 'text-gray-900 dark:text-white'}`
                  }
                  value={option.value}
                >
                  {({ selected, active }) => (
                    <>
                      <span
                        className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                        {option.label}
                      </span>
                      {selected ? (
                        <span
                          className={`absolute inset-y-0 left-0 flex items-center pl-3 ${active ? 'text-white' : 'text-teal-600'}`}>
                          <Check className="h-5 w-5" aria-hidden="true" />
                        </span>
                      ) : null}
                    </>
                  )}
                </HeadlessCombobox.Option>
              )
            })
          )}
        </HeadlessCombobox.Options>
      </div>
    </HeadlessCombobox>
  )
}
