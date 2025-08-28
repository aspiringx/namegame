'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { signOut, useSession } from 'next-auth/react'
import { useUserSession } from '@/context/UserSessionContext'
import { useDeviceInfo } from '@/hooks/useDeviceInfo'

export default function UserMenu() {
  const { data: session, update } = useSession()
  const { imageUrl } = useUserSession()
  const deviceInfo = useDeviceInfo()
  const canShowPrompt = deviceInfo && !deviceInfo.isPWA && deviceInfo.a2hs.isSupported
  const [isDropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const channel = new BroadcastChannel('photo_updates')
    const handlePhotoUpdate = () => {
      update() // Refetch the session
    }
    channel.addEventListener('message', handlePhotoUpdate)
    return () => {
      channel.removeEventListener('message', handlePhotoUpdate)
      channel.close()
    }
  }, [update])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

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
        className="flex items-center rounded-lg px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        {user && (
          <p className="mr-4 hidden text-gray-700 sm:block dark:text-gray-300">
            {user.firstName}
          </p>
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
          <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700" />
        )}
      </button>
      {isDropdownOpen && (
        <div className="absolute top-full right-0 z-50 mt-2 w-48 rounded-md bg-white py-2 shadow-lg dark:bg-gray-800">
          {user ? (
            <>
              <Link
                href={`/me`}
                className="block px-4 py-2 text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                onClick={closeDropdown}
              >
                Me
              </Link>
              {isSuperAdmin && (
                <>
                  <hr className="my-2 border-gray-200 dark:border-gray-700" />
                  <Link
                    href="/admin"
                    className="block px-4 py-2 text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                    onClick={closeDropdown}
                  >
                    Global Admin
                  </Link>
                  <Link
                    href="/admin/groups"
                    className="block py-2 pr-4 pl-8 text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                    onClick={closeDropdown}
                  >
                    Groups
                  </Link>
                  <Link
                    href="/admin/users"
                    className="block py-2 pr-4 pl-8 text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                    onClick={closeDropdown}
                  >
                    Users
                  </Link>
                </>
              )}
              {canShowPrompt && (
                <button
                  onClick={() => {
                    localStorage.removeItem('namegame_pwa_prompt_dismissed')
                    window.location.reload()
                  }}
                  className="block w-full px-4 py-2 text-left text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  {deviceInfo?.a2hs.actionLabel || 'Install App'}
                </button>
              )}
              <hr className="my-2 border-gray-200 dark:border-gray-700" />
              <button
                onClick={() => {
                  const callbackUrl = `${window.location.origin}/`;
                  signOut({ callbackUrl });
                  closeDropdown()
                }}
                className="block w-full px-4 py-2 text-left text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="block px-4 py-2 text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                onClick={closeDropdown}
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="block px-4 py-2 text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                onClick={closeDropdown}
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  )
}
