'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import UserMenu from './UserMenu'
import Image from 'next/image'
import { GroupData } from '@/types'
import { Settings, ArrowLeft, ArrowRight } from 'lucide-react'
import GroupInfoModal from './GroupInfoModal'
import ChatIcon, { ChatIconRef } from './ChatIcon'
import ChatDeepLink from './ChatDeepLink'
import RefreshButton from './ui/RefreshButton'
import { useSession } from 'next-auth/react'
import { useDeviceInfo } from '@/hooks/useDeviceInfo'

interface HeaderProps {
  group?: GroupData | null
  isGroupAdmin?: boolean
  groupSlug?: string
}

export default function Header({
  group,
  isGroupAdmin,
  groupSlug,
}: HeaderProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const chatIconRef = useRef<ChatIconRef>(null)
  const router = useRouter()
  const { data: session } = useSession()
  const deviceInfo = useDeviceInfo(session)
  const [canGoBack, setCanGoBack] = useState(false)
  const [canGoForward, setCanGoForward] = useState(false)

  useEffect(() => {
    // Check navigation state
    const updateNavState = () => {
      setCanGoBack(window.history.length > 1)
      // Note: There's no reliable way to detect forward history in browsers
      // We keep it enabled to match browser UI. The router.forward() will simply
      // do nothing if there's no forward history available.
      setCanGoForward(true)
    }

    updateNavState()
    // Listen for navigation changes
    window.addEventListener('popstate', updateNavState)
    return () => window.removeEventListener('popstate', updateNavState)
  }, [])

  const handleOpenChat = () => {
    chatIconRef.current?.openChat()
  }

  return (
    <>
      <ChatDeepLink onOpenChat={handleOpenChat} />
      <header
        id="page-header"
        className="bg-background border-border sticky top-0 left-0 z-50 w-full border-b"
      >
        <div className="container mx-auto flex h-full items-center justify-between px-5 py-1">
          <div className="flex items-center gap-2">
            {/* PWA Navigation Controls */}
            {deviceInfo.isPWA && (
              <>
                <button
                  onClick={() => router.back()}
                  disabled={!canGoBack}
                  className="text-gray-600 hover:text-gray-900 disabled:text-gray-400 disabled:cursor-not-allowed dark:text-gray-400 dark:hover:text-gray-100 dark:disabled:text-gray-600"
                  aria-label="Go back"
                >
                  <ArrowLeft size={24} />
                </button>
                <button
                  onClick={() => router.forward()}
                  disabled={!canGoForward}
                  className="text-gray-600 hover:text-gray-900 disabled:text-gray-400 disabled:cursor-not-allowed dark:text-gray-400 dark:hover:text-gray-100 dark:disabled:text-gray-600"
                  aria-label="Go forward"
                >
                  <ArrowRight size={24} />
                </button>
                <RefreshButton />
              </>
            )}

            {/* Logo/Group Name */}
            {group ? (
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 text-left"
                data-tour="group-name"
              >
                {group.logo && (
                  <Image
                    src={group.logo}
                    alt={`${group.name} logo`}
                    width={32}
                    height={32}
                    className="h-10 w-10 object-cover"
                  />
                )}
                {/* Show group name on desktop, hide on mobile */}
                <span
                  className={`block max-w-[200px] truncate text-xl font-bold text-gray-600 dark:text-gray-200 ${
                    deviceInfo.isMobile ? 'hidden' : 'sm:max-w-none'
                  }`}
                >
                  {group.name}
                </span>
              </button>
            ) : (
              <Link
                href="/"
                className="flex items-center gap-1 text-xl font-bold text-gray-600 dark:text-gray-200"
              >
                <Image
                  src="/images/butterfly.png"
                  alt="NameGame social butterfly"
                  width={32}
                  height={32}
                  className="h-auto md:max-w-[32px]"
                />
                {/* Show app name text only on desktop */}
                <span className="hidden md:inline">NameGame</span>
              </Link>
            )}
          </div>
          <div className="flex items-center gap-4">
            {isGroupAdmin && groupSlug && (
              <Link
                href={`/g/${groupSlug}/admin`}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
              >
                <Settings size={24} />
              </Link>
            )}
            <ChatIcon ref={chatIconRef} />
            <UserMenu />
          </div>
        </div>
      </header>
      {group && (
        <GroupInfoModal
          group={group}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  )
}
