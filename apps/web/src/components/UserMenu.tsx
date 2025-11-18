'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { signOut, useSession } from 'next-auth/react'
import { useUserSession } from '@/context/UserSessionContext'
import { useA2HS } from '@/context/A2HSContext'
import { useDeviceInfoContext } from '@/context/DeviceInfoContext'
import { NAMEGAME_PWA_PROMPT_DISMISSED_KEY } from '@/lib/constants'

export default function UserMenu() {
  const { data: session, update } = useSession()
  const { imageUrl, recentGroups } = useUserSession()
  const { showPrompt } = useA2HS()
  const deviceInfo = useDeviceInfoContext()
  const [isDropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const channel = new BroadcastChannel('photo_updates')
    const handlePhotoUpdate = () => {
      update() // Refetch the session
    }
    channel.addEventListener('message', handlePhotoUpdate)

    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      channel.removeEventListener('message', handlePhotoUpdate)
      channel.close()
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [update])

  if (!deviceInfo) {
    return null // Don't render anything until the device info is loaded
  }

  const toggleDropdown = () => {
    setDropdownOpen(!isDropdownOpen)
  }

  const closeDropdown = () => {
    setDropdownOpen(false)
  }

  const user = session?.user
  const isSuperAdmin = user?.isSuperAdmin

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        className="flex items-center rounded-lg px-4 py-2 hover:bg-gray-800"
      >
        {user && (
          <p className="mr-4 hidden text-gray-300 sm:block">{user.firstName}</p>
        )}
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt="User Profile"
            width={40}
            height={40}
            className="h-10 w-10 rounded-full object-cover"
            key={imageUrl} // Force re-render on image change
          />
        ) : (
          // This placeholder is shown during initial load, before context is ready.
          <div className="h-10 w-10 rounded-full bg-gray-700" />
        )}
      </button>
      {isDropdownOpen && (
        <div className="absolute top-full right-0 z-50 mt-2 w-48 rounded-md bg-gray-800 py-2 shadow-lg">
          {user ? (
            <>
              <Link
                href={`/me`}
                className="block px-4 py-2 text-gray-200 hover:bg-gray-700"
                onClick={closeDropdown}
              >
                Me
              </Link>
              <Link
                href="/me/groups"
                className="block px-4 py-2 text-gray-200 hover:bg-gray-700"
                onClick={closeDropdown}
              >
                My Groups
              </Link>
              {recentGroups && recentGroups.length > 0 && (
                <>
                  {recentGroups.map((group) => (
                    <Link
                      key={group.slug}
                      href={`/g/${group.slug}`}
                      className="block py-3 pr-4 pl-8 text-sm text-gray-400 hover:bg-gray-700"
                      onClick={closeDropdown}
                    >
                      {group.name}
                    </Link>
                  ))}
                </>
              )}
              {isSuperAdmin && (
                <>
                  <hr className="my-2 border-gray-700" />
                  <Link
                    href="/admin"
                    className="block px-4 py-2 text-gray-200 hover:bg-gray-700"
                    onClick={closeDropdown}
                  >
                    Global Admin
                  </Link>
                  <Link
                    href="/admin/groups"
                    className="block py-3 pr-4 pl-8 text-gray-200 hover:bg-gray-700"
                    onClick={closeDropdown}
                  >
                    Groups
                  </Link>
                  <Link
                    href="/admin/users"
                    className="block py-3 pr-4 pl-8 text-gray-200 hover:bg-gray-700"
                    onClick={closeDropdown}
                  >
                    Users
                  </Link>
                  <Link
                    href="/me/push-test"
                    className="block py-3 pr-4 pl-8 text-gray-200 hover:bg-gray-700"
                    onClick={closeDropdown}
                  >
                    Push Test
                  </Link>
                </>
              )}

              {deviceInfo.a2hs.canInstall && (
                <>
                  <hr className="my-2 border-gray-700" />
                  <button
                    onClick={() => {
                      if (deviceInfo.pwaPrompt.isReady) {
                        // For Chrome/Edge, trigger the native prompt
                        deviceInfo.pwaPrompt.prompt()
                      } else {
                        // For Safari, show the manual instructions prompt.
                        // We clear the dismissal flag so it always shows from the menu.
                        localStorage.removeItem(
                          NAMEGAME_PWA_PROMPT_DISMISSED_KEY,
                        )
                        showPrompt()
                      }
                      closeDropdown()
                    }}
                    className="block w-full px-4 py-2 text-left text-gray-200 hover:bg-gray-700"
                  >
                    {deviceInfo.a2hs.actionLabel}
                  </button>
                </>
              )}

              {/* Home and Logout */}
              <hr className="my-2 border-gray-700" />
              <Link
                href="/"
                className="block px-4 py-2 text-gray-200 hover:bg-gray-700"
                onClick={closeDropdown}
              >
                Home
              </Link>
              <button
                onClick={() => {
                  const callbackUrl = `${window.location.origin}/`
                  signOut({ callbackUrl })
                  closeDropdown()
                }}
                className="block w-full px-4 py-2 text-left text-gray-200 hover:bg-gray-700"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="block px-4 py-2 text-gray-200 hover:bg-gray-700"
                onClick={closeDropdown}
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="block px-4 py-2 text-gray-200 hover:bg-gray-700"
                onClick={closeDropdown}
              >
                Sign Up
              </Link>
              <hr className="my-2 border-gray-700" />
              <Link
                href="/"
                className="block px-4 py-2 text-gray-200 hover:bg-gray-700"
                onClick={closeDropdown}
              >
                Home
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  )
}
