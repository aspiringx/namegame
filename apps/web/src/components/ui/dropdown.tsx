'use client'

import { Menu, Transition } from '@headlessui/react'
import { Fragment } from 'react'

export function Dropdown({
  trigger,
  children,
  triggerClassName,
  menuClassName,
}: {
  trigger: React.ReactNode
  children: React.ReactNode
  triggerClassName?: string
  menuClassName?: string
}) {
  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button className={triggerClassName}>{trigger}</Menu.Button>
      </div>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items
          className={
            menuClassName ||
            'absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md border border-gray-700 bg-gray-800 text-gray-200 shadow-lg focus:outline-none'
          }
        >
          <div className="px-1 py-1 ">{children}</div>
        </Menu.Items>
      </Transition>
    </Menu>
  )
}

export function DropdownItem({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
}) {
  return (
    <Menu.Item disabled={disabled}>
      {({ active }) => (
        <button
          type="button"
          onClick={onClick}
          disabled={disabled}
          className={`group flex w-full items-center rounded-md px-2 py-2 text-sm transition-colors ${
            disabled
              ? 'cursor-not-allowed opacity-50 text-gray-100'
              : active
              ? 'bg-indigo-600 text-white bg-indigo-500 text-white'
              : 'text-gray-100 bg-gray-800'
          }`}
        >
          {children}
        </button>
      )}
    </Menu.Item>
  )
}
