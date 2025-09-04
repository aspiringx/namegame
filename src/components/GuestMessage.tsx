'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from './ui/button'
import Modal from './ui/modal'
import { Brain, X } from 'lucide-react'
import Image from 'next/image'

export function GuestMessage({
  isGuest,
  firstName,
  groupName,
  groupType,
}: {
  isGuest: boolean
  firstName?: string | null
  groupName?: string
  groupType?: 'community' | 'family' | string
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    if (isGuest && pathname.startsWith('/g/')) {
      setIsModalOpen(true)
    }
  }, [isGuest, pathname])

  if (!isGuest) {
    return null
  }

  const handleUpdateProfile = () => {
    router.push('/me')
    setIsModalOpen(false)
  }

  const handleClose = () => {
    setIsModalOpen(false)
  }

  const modalContent = (
    <div className="p-6">
      <button
        onClick={handleClose}
        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        aria-label="Close"
      >
        <X className="h-6 w-6" />
      </button>
      <Image
        src="/images/butterflies.png"
        alt="NameGame social butterflies"
        width={70}
        height={70}
        className="center mx-auto mb-4 h-auto w-auto"
      />
      <h3 className="mb-4 text-center text-xl font-semibold text-gray-900 dark:text-gray-100">
        Welcome {firstName}!
      </h3>
      <div className="space-y-2">
        <p className="mb-4">You're in the private {groupName} group!</p>
        <p>
          Complete your profile to access all features and help others recognize
          you.
        </p>
      </div>
      <div className="mt-6 flex w-full justify-center gap-4 sm:w-auto">
        <Button onClick={handleUpdateProfile}>Complete Profile</Button>
      </div>
      <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
        p.s. You can do it now or later from the user menu (Me) on the top
        right.
      </p>
    </div>
  )

  // For group pages, show the modal
  if (pathname.startsWith('/g/')) {
    return (
      <Modal isOpen={isModalOpen} onClose={handleClose}>
        {modalContent}
      </Modal>
    )
  }

  // For the /me page, show an inline message
  return (
    <div className="my-2 rounded-md bg-blue-200 p-4 dark:bg-blue-900">
      <h3 className="mb-2 text-center text-lg font-semibold">
        Hi {firstName}!
      </h3>
      <p>
        Please complete your profile to unlock group features and help others
        recognize you.
      </p>
    </div>
  )
}
